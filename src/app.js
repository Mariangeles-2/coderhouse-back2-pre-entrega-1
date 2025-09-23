import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import 'express-async-errors'; // 🎯 Esto maneja TODOS los errores async automáticamente!
import helmet from 'helmet';
import methodOverride from 'method-override';
import swaggerUi from 'swagger-ui-express';

import { connectToDatabase } from './config/database.config.js';
import { configurePassport } from './config/passport.config.js';
import { configureSession } from './config/session.config.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';
import {
  corsOptions,
  helmetOptions,
  requestLogger,
  securityHeaders,
} from './middlewares/security.middleware.js';
import authRoutes from './routes/auth.routes.js';
import cartRoutes from './routes/cart.routes.js';
import productRoutes from './routes/product.routes.js';
import userRoutes from './routes/user.routes.js';
import { logger } from './utils/logger.util.js';

// 📚 Cargar documentación Swagger
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = JSON.parse(
  fs.readFileSync(join(__dirname, '../docs/api/swagger.json'), 'utf8')
);

// Configurar dotenv ANTES de todo
dotenv.config();

class EcommerceApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8080;
    this.initializeApp();
  }

  async initializeApp() {
    try {
      // 🔌 Conectar a la base de datos
      await connectToDatabase();

      // 🛡️ Configurar seguridad HTTP
      this.configureSecurity();

      // ⚙️ Configurar middlewares básicos
      this.configureMiddlewares();

      // 🔐 Configurar autenticación
      this.configureAuthentication();

      // 📚 Configurar documentación Swagger
      this.configureSwagger();

      // 🛣️ Configurar rutas
      this.configureRoutes();

      // 🚨 Configurar manejo de errores (al final)
      this.configureErrorHandling();

      // 🚀 Iniciar servidor
      this.startServer();
    } catch (error) {
      logger.error('❌ Error al inicializar la aplicación:', error);
      process.exit(1);
    }
  }

  configureSecurity() {
    // 🛡️ Helmet para headers de seguridad
    this.app.use(helmet(helmetOptions));

    // 🌐 CORS configurado
    this.app.use(cors(corsOptions));

    // 🔒 Headers de seguridad personalizados
    this.app.use(securityHeaders);

    // 📊 Logging de requests para seguridad
    this.app.use(requestLogger);

    // 🚫 Rate limiting general
    this.app.use(generalLimiter);

    logger.info('🛡️ Configuración de seguridad HTTP aplicada');
  }

  configureMiddlewares() {
    // 📊 Middleware para parsear JSON y URL encoded
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 🔧 Method override para formularios HTML
    this.app.use(methodOverride('_method'));
  }

  configureAuthentication() {
    // 🔐 Configurar sesiones y Passport
    configureSession(this.app);
    configurePassport(this.app);
  }

  /**
   * 📚 Configurar documentación Swagger
   */
  configureSwagger() {
    // Solo mostrar Swagger en desarrollo o si está explícitamente habilitado
    const showSwagger =
      process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER_IN_PRODUCTION === 'true';

    if (showSwagger) {
      // Swagger UI endpoint
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

      // JSON de la especificación OpenAPI
      this.app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerDocument);
      });

      logger.info('📚 Documentación Swagger configurada en /api-docs');
    } else {
      logger.info('📚 Documentación Swagger deshabilitada en producción');
    }
  }

  configureRoutes() {
    // 🛣️ Ruta principal - API info con links a documentación
    this.app.get('/', (req, res) => {
      const showSwagger =
        process.env.NODE_ENV !== 'production' ||
        process.env.ENABLE_SWAGGER_IN_PRODUCTION === 'true';

      res.json({
        success: true,
        message: '🛍️ Ecommerce Backend API - Versión Segura',
        version: '2.0.0',
        security: {
          jwt: 'Autenticación JWT implementada',
          rateLimit: 'Protección anti fuerza bruta activa',
          validation: 'Validación de entrada con Joi',
          cors: 'CORS configurado',
          helmet: 'Headers de seguridad aplicados',
        },
        documentation: showSwagger
          ? {
              swagger: `http://localhost:${this.port}/api-docs`,
              openapi_json: `http://localhost:${this.port}/api-docs.json`,
            }
          : {
              message: 'Documentación disponible solo en desarrollo',
            },
        endpoints: {
          auth: '/auth',
          users: '/api/users',
          products: '/api/products',
          carts: '/api/carts',
        },
      });
    });

    // 🔐 Rutas de autenticación
    this.app.use('/auth', authRoutes);

    // 👥 Rutas de usuarios
    this.app.use('/api/users', userRoutes);

    // 🛍️ Rutas de productos
    this.app.use('/api/products', productRoutes);

    // 🛒 Rutas de carritos
    this.app.use('/api/carts', cartRoutes);
  }

  configureErrorHandling() {
    // 🔍 Middleware para rutas no encontradas (404)
    this.app.use(notFoundHandler);

    // 🚨 Middleware global de manejo de errores
    this.app.use(errorHandler);

    logger.info('🛡️ Sistema de manejo de errores configurado');
  }

  startServer() {
    this.app.listen(this.port, () => {
      logger.success(`🚀 Servidor corriendo en puerto ${this.port}`);
      logger.info(`📍 API disponible en: http://localhost:${this.port}`);

      const showSwagger =
        process.env.NODE_ENV !== 'production' ||
        process.env.ENABLE_SWAGGER_IN_PRODUCTION === 'true';

      if (showSwagger) {
        logger.info(`📚 Documentación Swagger: http://localhost:${this.port}/api-docs`);
        logger.info(`🔗 OpenAPI JSON: http://localhost:${this.port}/api-docs.json`);
      }

      logger.info('🛡️ Características de seguridad:');
      logger.info('  ✅ JWT con access/refresh tokens');
      logger.info('  ✅ Rate limiting anti fuerza bruta');
      logger.info('  ✅ Validación de entrada con Joi');
      logger.info('  ✅ Headers de seguridad HTTP');
      logger.info('  ✅ CORS configurado');
      logger.info('  ✅ Recuperación de contraseñas');
      logger.info('  ✅ Políticas de contraseñas robustas');
    });
  }
}

// 🎯 Inicializar aplicación si no estamos en testing
if (process.env.NODE_ENV !== 'test') {
  new EcommerceApp();
}

// Exportar la aplicación para testing
export default new EcommerceApp().app;
