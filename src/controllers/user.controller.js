import bcrypt from 'bcrypt';

import { throwBadRequest, throwNotFound } from '../middlewares/error.middleware.js';
import userRepository from '../repositories/user.repository.js';
import { logger } from '../utils/logger.util.js';
import { passwordResetService } from '../utils/passwordReset.util.js';

/**
 * 👤 Controlador de Usuarios - Actualizado con Repository Pattern y DTOs
 */
class UserController {
  /**
   * 📋 Obtener información del usuario actual - RUTA /current
   * Implementa DTO para evitar envío de información sensible
   */
  static async getCurrentUser(req, res) {
    const currentUser = await userRepository.getCurrentUser(req.user._id);

    if (!currentUser) {
      throwNotFound('Usuario no encontrado');
    }

    logger.info(`🔍 Información de usuario actual solicitada por: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Información del usuario actual',
      user: currentUser, // Ya es un DTO que no incluye información sensible
    });
  }

  /**
   * 📋 Obtener todos los usuarios (solo admin)
   */
  static async getAllUsers(req, res) {
    const { page = 1, limit = 10 } = req.query;

    const result = await userRepository.getAll(page, limit);

    logger.info(`📋 Lista de usuarios solicitada por admin: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Lista de usuarios obtenida',
      ...result,
    });
  }

  /**
   * 🔍 Obtener usuario por ID
   */
  static async getUserById(req, res) {
    const { uid } = req.params;

    const user = await userRepository.findById(uid);

    if (!user) {
      throwNotFound('Usuario');
    }

    res.json({
      success: true,
      user,
    });
  }

  /**
   * ✏️ Actualizar usuario
   */
  static async updateUser(req, res) {
    const { uid } = req.params;
    const updateData = req.body;

    const user = await userRepository.update(uid, updateData);

    if (!user) {
      throwNotFound('Usuario');
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user,
    });
  }

  /**
   * 🗑️ Eliminar usuario
   */
  static async deleteUser(req, res) {
    const { uid } = req.params;

    const user = await userRepository.delete(uid);

    if (!user) {
      throwNotFound('Usuario');
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      user,
    });
  }

  /**
   * 🔐 Solicitar recuperación de contraseña - Mejorado
   */
  static async requestPasswordReset(req, res) {
    const { email } = req.body;

    if (!email) {
      throwBadRequest('El email es requerido');
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Por seguridad, siempre respondemos éxito aunque el email no exista
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación',
      });
    }

    // Generar token con expiración de 1 hora
    const { token, expires } = passwordResetService.generateResetToken();

    // Actualizar usuario con token y expiración
    await userRepository.update(user._id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    // Enviar email de recuperación
    await passwordResetService.sendResetEmail(
      user.email,
      token,
      `${user.first_name} ${user.last_name}`
    );

    logger.info(`🔐 Recuperación de contraseña solicitada para: ${user.email}`);

    res.json({
      success: true,
      message: 'Email de recuperación enviado exitosamente',
    });
  }

  /**
   * 🔒 Restablecer contraseña - Mejorado
   */
  static async resetPassword(req, res) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throwBadRequest('Token y nueva contraseña son requeridos');
    }

    const user = await userRepository.findByResetToken(token);

    if (!user) {
      throwBadRequest('Token inválido o expirado');
    }

    // Verificar que el token no haya expirado
    if (!passwordResetService.isTokenValid(user.passwordResetExpires)) {
      throwBadRequest('El token ha expirado. Solicita uno nuevo');
    }

    // Validar que la nueva contraseña sea diferente a la anterior
    await passwordResetService.validateNewPassword(newPassword, user.password);

    // Hashear nueva contraseña
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y limpiar tokens
    await userRepository.update(user._id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    // Enviar confirmación
    await passwordResetService.sendPasswordChangedConfirmation(
      user.email,
      `${user.first_name} ${user.last_name}`
    );

    logger.success(`🔒 Contraseña restablecida exitosamente para: ${user.email}`);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
    });
  }
}

export default UserController;
