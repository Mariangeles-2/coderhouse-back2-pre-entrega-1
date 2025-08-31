import User from '../models/User.model.js';
import {logger} from '../utils/logger.util.js';

/**
 * 👥 Controlador de Usuarios
 */
class UserController {
  /**
   * 📋 Obtener todos los usuarios (solo admin)
   */
  static async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, role } = req.query;
      const query = role ? { role } : {};

      const users = await User.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      logger.info(`📋 Lista de usuarios solicitada por admin: ${req.user.email}`);

      res.json({
        success: true,
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      logger.error('❌ Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios',
      });
    }
  }

  /**
   * 👤 Obtener usuario por ID
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('-password').populate('cart');

      if (!user) {
        logger.warning(`⚠️ Usuario no encontrado: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      logger.info(`👤 Usuario obtenido: ${user.email}`);
      res.json({
        success: true,
        user,
      });
    } catch (error) {
      logger.error('❌ Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
      });
    }
  }

  /**
   * ✏️ Actualizar usuario
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { first_name, last_name, age, role } = req.body;

      // Solo admin puede cambiar roles
      const updateData = { first_name, last_name, age };
      if (req.user.role === 'admin' && role) {
        updateData.role = role;
      }

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        logger.warning(`⚠️ Usuario no encontrado para actualizar: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      logger.success(`✅ Usuario actualizado: ${user.email}`);
      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        user,
      });
    } catch (error) {
      logger.error('❌ Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario',
      });
    }
  }

  /**
   * 🗑️ Eliminar usuario (solo admin)
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // No permitir que el admin se elimine a sí mismo
      if (id === req.user._id.toString()) {
        logger.warning(`⚠️ Admin intentó eliminarse a sí mismo: ${req.user.email}`);
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta',
        });
      }

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        logger.warning(`⚠️ Usuario no encontrado para eliminar: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      logger.success(`🗑️ Usuario eliminado por admin: ${user.email}`);
      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      logger.error('❌ Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar usuario',
      });
    }
  }

  /**
   * 🔄 Cambiar rol de usuario (solo admin)
   */
  static async changeUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['user', 'admin', 'premium'].includes(role)) {
        logger.warning(`⚠️ Rol inválido proporcionado: ${role}`);
        return res.status(400).json({
          success: false,
          message: 'Rol inválido',
        });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        logger.warning(`⚠️ Usuario no encontrado para cambiar rol: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      logger.success(`🔄 Rol cambiado para usuario ${user.email}: ${role}`);
      res.json({
        success: true,
        message: `Rol cambiado a ${role} exitosamente`,
        user,
      });
    } catch (error) {
      logger.error('❌ Error al cambiar rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar rol',
      });
    }
  }
}

export default UserController;
