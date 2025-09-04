import express from 'express';
import methodOverride from 'method-override';
import dotenv from 'dotenv';
import 'express-async-errors'; // 🎯 Esto maneja TODOS los errores async automáticamente!
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 📦 Importar configuraciones
import { connectToDatabase } from './config/database.config.js';
import { configureSession } from './config/session.config.js';
import { configurePassport } from './config/passport.config.js';
import { logger } from './utils/logger.util.js';

// 🚨 Importar sistema simplificado de errores
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

// 📁 Importar rutas
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';

// 📚 Cargar documentación Swagger
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = JSON.parse(
  fs.readFileSync(join(__dirname, '../docs/api/swagger.json'), 'utf8')
);

// Configurar dotenv
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

      // ⚙️ Configurar middlewares
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

  configureMiddlewares() {
    // 📊 Middleware para parsear JSON y URL encoded
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

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
    // Swagger UI endpoint
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    // JSON de la especificación OpenAPI
    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerDocument);
    });

    logger.info('📚 Documentación Swagger configurada en /api-docs');
  }

  configureRoutes() {
    // 🛣️ Ruta principal - API info con links a documentación
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '🛍️ Ecommerce Backend API',
        version: '1.0.0',
        documentation: {
          swagger: `http://localhost:${this.port}/api-docs`,
          openapi_json: `http://localhost:${this.port}/api-docs.json`,
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
      logger.info(`📚 Documentación Swagger: http://localhost:${this.port}/api-docs`);
      logger.info(`🔗 OpenAPI JSON: http://localhost:${this.port}/api-docs.json`);
    });
  }
}

// 🎯 Inicializar aplicación
new EcommerceApp();
