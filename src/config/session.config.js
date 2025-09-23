import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import session from 'express-session';

import { logger } from '../utils/logger.util.js';

dotenv.config();

/**
 * 🔐 Configuración de sesiones
 */
const configureSession = (app) => {
  try {
    const sessionConfig = {
      secret: process.env.SESSION_SECRET || 'mi_secreto_super_seguro',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_backend',
        touchAfter: 24 * 3600, // Lazy session update
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 horas
      },
    };

    app.use(session(sessionConfig));
    logger.auth('✨ Configuración de sesiones correcta');
  } catch (error) {
    logger.error('❌ Error al configurar sesiones:', error);
    throw error;
  }
};

export { configureSession };
