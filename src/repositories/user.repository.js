import userDAO from '../dao/user.dao.js';
import { UserDTO } from '../dto/index.js';
import { logger } from '../utils/logger.util.js';

/**
 * 🏛️ Repository para Usuario - Implementa patrón Repository
 * Maneja la lógica de negocio y trabaja con el DAO
 */
class UserRepository {
  /**
   * Crear un nuevo usuario
   */
  async create(userData) {
    try {
      const user = await userDAO.create(userData);
      logger.info(`👤 Usuario creado: ${user.email}`);
      return UserDTO.fromUser(user);
    } catch (error) {
      logger.error('❌ Error creando usuario:', error);
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id) {
    try {
      const user = await userDAO.findById(id);
      return user ? UserDTO.fromUser(user) : null;
    } catch (error) {
      logger.error(`❌ Error buscando usuario por ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Buscar usuario por email (para autenticación)
   */
  async findByEmail(email) {
    try {
      return await userDAO.findByEmail(email); // Retorna el modelo completo para autenticación
    } catch (error) {
      logger.error(`❌ Error buscando usuario por email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Buscar usuario por token de reset
   */
  async findByResetToken(token) {
    try {
      return await userDAO.findByResetToken(token);
    } catch (error) {
      logger.error('❌ Error buscando usuario por token de reset:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   */
  async update(id, updateData) {
    try {
      // Filtrar campos sensibles que no deben actualizarse directamente
      const filteredData = { ...updateData };
      delete filteredData.password;
      delete filteredData.passwordResetToken;
      delete filteredData.passwordResetExpires;
      delete filteredData.loginAttempts;
      delete filteredData.lockUntil;

      const user = await userDAO.updateById(id, filteredData);
      if (!user) {
        return null;
      }

      logger.info(`✏️ Usuario actualizado: ${user.email}`);
      return UserDTO.fromUser(user);
    } catch (error) {
      logger.error(`❌ Error actualizando usuario ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar usuario
   */
  async delete(id) {
    try {
      const user = await userDAO.deleteById(id);
      if (user) {
        logger.info(`🗑️ Usuario eliminado: ${user.email}`);
      }
      return user ? UserDTO.fromUser(user) : null;
    } catch (error) {
      logger.error(`❌ Error eliminando usuario ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener lista de usuarios con paginación
   */
  async getAll(page = 1, limit = 10) {
    try {
      const users = await userDAO.findAll(page, limit);
      const total = await userDAO.count();

      return {
        users: users.map((user) => UserDTO.fromUser(user)),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      };
    } catch (error) {
      logger.error('❌ Error obteniendo lista de usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener información del usuario actual (para ruta /current)
   */
  async getCurrentUser(id) {
    try {
      const user = await userDAO.findById(id);
      if (!user) {
        return null;
      }

      logger.info(`🔍 Información de usuario actual solicitada: ${user.email}`);
      return UserDTO.currentUser(user);
    } catch (error) {
      logger.error(`❌ Error obteniendo usuario actual ${id}:`, error);
      throw error;
    }
  }
}

export default new UserRepository();
