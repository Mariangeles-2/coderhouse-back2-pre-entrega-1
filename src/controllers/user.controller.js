import User from '../models/User.model.js';
import { logger } from '../utils/logger.util.js';
import { throwBadRequest, throwForbidden, throwNotFound } from '../middlewares/error.middleware.js';

/**
 * 👥 Controlador de Usuarios - Versión Simplificada
 * Usando express-async-errors + http-errors (librerías estándar)
 */
class UserController {
  /**
   * 📋 Obtener todos los usuarios (solo admin)
   */
  static async getAllUsers(req, res) {
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
  }

  /**
   * 👤 Obtener usuario por ID
   */
  static async getUserById(req, res) {
    const { id } = req.params;

    // Solo admin puede ver otros usuarios, usuarios normales solo pueden verse a sí mismos
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      throwForbidden('Solo puedes ver tu propia información');
    }

    const user = await User.findById(id).select('-password').populate('cart');

    if (!user) {
      throwNotFound('Usuario');
    }

    logger.info(`👤 Usuario consultado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      user,
    });
  }

  /**
   * ✏️ Actualizar perfil de usuario
   */
  static async updateProfile(req, res) {
    const { id } = req.params;
    const updateData = req.body;

    // Solo admin puede actualizar otros usuarios, usuarios normales solo pueden actualizarse a sí mismos
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      throwForbidden('Solo puedes actualizar tu propia información');
    }

    // No permitir cambiar campos sensibles a menos que sea admin
    if (req.user.role !== 'admin') {
      delete updateData.role;
      delete updateData.email;
    }

    // Validaciones
    if (updateData.age && (updateData.age < 0 || updateData.age > 120)) {
      throwBadRequest('La edad debe estar entre 0 y 120 años');
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      throwNotFound('Usuario');
    }

    logger.success(`✏️ Perfil actualizado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user,
    });
  }

  /**
   * 🗑️ Eliminar usuario (solo admin)
   */
  static async deleteUser(req, res) {
    const { id } = req.params;

    // No permitir que el admin se elimine a sí mismo
    if (req.user._id.toString() === id) {
      throwBadRequest('No puedes eliminar tu propia cuenta');
    }

    const user = await User.findById(id);
    if (!user) {
      throwNotFound('Usuario');
    }

    await User.findByIdAndDelete(id);

    logger.success(`🗑️ Usuario eliminado: ${user.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  }

  /**
   * 🔄 Cambiar rol de usuario (solo admin)
   */
  static async changeUserRole(req, res) {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      throwBadRequest('El campo role es requerido');
    }

    if (!['user', 'premium', 'admin'].includes(role)) {
      throwBadRequest('Rol inválido. Debe ser: user, premium o admin');
    }

    // No permitir que el admin cambie su propio rol
    if (req.user._id.toString() === id) {
      throwBadRequest('No puedes cambiar tu propio rol');
    }

    const user = await User.findById(id);
    if (!user) {
      throwNotFound('Usuario');
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    logger.success(
      `🔄 Rol cambiado para ${user.email}: ${oldRole} → ${role} por ${req.user.email}`
    );

    res.json({
      success: true,
      message: `Rol actualizado de ${oldRole} a ${role}`,
      user: user.toPublicJSON(),
    });
  }

  /**
   * 📊 Obtener estadísticas de usuarios (solo admin)
   */
  static async getUserStats(req, res) {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await User.countDocuments();
    const recent = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    logger.info(`📊 Estadísticas de usuarios consultadas por: ${req.user.email}`);

    res.json({
      success: true,
      stats: {
        total,
        recent,
        byRole: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      },
    });
  }
}

export default UserController;
