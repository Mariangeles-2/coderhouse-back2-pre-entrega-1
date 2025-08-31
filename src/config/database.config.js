import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {logger} from '../utils/logger.util.js';

dotenv.config();

/**
 * 🗄️ Configuración de conexión a MongoDB
 */
class DatabaseConfig {
  static async connectToDatabase() {
    try {
      const mongoUri = process.env.MONGO_URI;

      logger.database('🔌 Conectando a MongoDB...');

      await mongoose.connect(mongoUri);

      logger.success('✨ Conexión exitosa a MongoDB');

      // Eventos de la conexión
      mongoose.connection.on('error', (error) => {
        logger.error('💥 Error de conexión a MongoDB:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warning('🔌 Desconectado de MongoDB');
      });

    } catch (error) {
      logger.error('❌ Error al conectar con MongoDB:', error);
      throw error;
    }
  }
}

export const connectToDatabase = DatabaseConfig.connectToDatabase;
