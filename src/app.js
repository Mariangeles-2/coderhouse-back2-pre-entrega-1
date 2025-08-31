import express from 'express';
import methodOverride from 'method-override';
import dotenv from 'dotenv';

// 📦 Importar configuraciones
import {connectToDatabase} from './config/database.config.js';
import {configureSession} from './config/session.config.js';
import {configurePassport} from './config/passport.config.js';
import {logger} from './utils/logger.util.js';

// 📁 Importar rutas
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';

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

      // 🛣️ Configurar rutas
      this.configureRoutes();

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

  configureRoutes() {
    // 🛣️ Ruta principal - API info
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '🛍️ Ecommerce Backend API',
        version: '1.0.0',
        endpoints: {
          auth: '/auth',
          users: '/api/users',
          products: '/api/products',
          carts: '/api/carts'
        }
      });
    });

    // 🔐 Rutas de autenticación
    this.app.use('/auth', authRoutes);

    // 👥 Rutas de usuarios
    this.app.use('/api/users', userRoutes);

    // 🛒 Rutas de productos
    this.app.use('/api/products', productRoutes);

    // 🛍️ Rutas de carritos
    this.app.use('/api/carts', cartRoutes);

    // ❌ Endpoint 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        availableEndpoints: {
          auth: '/auth',
          users: '/api/users',
          products: '/api/products',
          carts: '/api/carts'
        }
      });
    });
  }

  startServer() {
    this.app.listen(this.port, () => {
      logger.info(`🚀 Servidor ejecutándose en puerto ${this.port}`);
      logger.info(`🌐 API disponible en: http://localhost:${this.port}`);
    });
  }
}

// 🎯 Inicializar aplicación
const app = new EcommerceApp();

export default app;
