import passport from 'passport';
import { logger } from '../utils/logger.util.js';
import {
  throwBadRequest,
  throwNotFound,
  throwUnauthorized,
} from '../middlewares/error.middleware.js';

/**
 * 🔐 Controlador de Autenticación - Versión Simplificada
 * Usando express-async-errors + http-errors (librerías estándar)
 */
class AuthController {
  /**
   * 👤 Procesar registro de usuario
   */
  static register(req, res, next) {
    passport.authenticate('local-register', (err, user, info) => {
      if (err) {
        logger.error('❌ Error en registro:', err);
        return next(err);
      }

      if (!user) {
        logger.warning('⚠️ Fallo en registro:', info.message);
        return next(throwBadRequest(info.message));
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          logger.error('❌ Error al iniciar sesión después del registro:', loginErr);
          return next(loginErr);
        }

        logger.success(`🎉 Usuario registrado y logueado: ${user.email}`);
        return res.status(201).json({
          success: true,
          message: 'Usuario registrado exitosamente',
          user: user.toPublicJSON(),
        });
      });
    })(req, res, next);
  }

  /**
   * 🔑 Procesar login de usuario
   */
  static login(req, res, next) {
    passport.authenticate('local-login', (err, user, info) => {
      if (err) {
        logger.error('❌ Error en login:', err);
        return next(err);
      }

      if (!user) {
        logger.warning('⚠️ Fallo en login:', info.message);
        return next(throwBadRequest(info.message));
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          logger.error('❌ Error al establecer sesión:', loginErr);
          return next(loginErr);
        }

        logger.success(`✅ Usuario logueado: ${user.email}`);
        return res.status(200).json({
          success: true,
          message: 'Login exitoso',
          user: user.toPublicJSON(),
        });
      });
    })(req, res, next);
  }

  /**
   * 🚪 Logout de usuario
   */
  static logout(req, res, next) {
    const userEmail = req.user?.email || 'Desconocido';

    req.logout((err) => {
      if (err) {
        logger.error('❌ Error en logout:', err);
        return next(err);
      }

      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          logger.error('❌ Error al destruir sesión:', sessionErr);
          return next(sessionErr);
        }

        logger.info(`👋 Usuario deslogueado: ${userEmail}`);
        res.status(200).json({
          success: true,
          message: 'Logout exitoso',
        });
      });
    });
  }

  /**
   * 👤 Obtener usuario actual
   */
  static getCurrentUser(req, res) {
    if (!req.isAuthenticated()) {
      throwUnauthorized('No hay usuario autenticado');
    }

    logger.info(`📱 Información de usuario solicitada: ${req.user.email}`);
    res.status(200).json({
      success: true,
      user: req.user.toPublicJSON(),
    });
  }

  /**
   * 👤 Obtener usuario actual (alias para getCurrentUser)
   */
  static getProfile(req, res, _next) {
    return AuthController.getCurrentUser(req, res);
  }

  /**
   * ✅ Verificar estado de autenticación
   */
  static checkAuth(req, res) {
    if (req.isAuthenticated()) {
      logger.info(`✅ Estado de auth verificado: ${req.user.email}`);
      res.status(200).json({
        success: true,
        authenticated: true,
        user: req.user.toPublicJSON(),
      });
    } else {
      res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
    }
  }

  /**
   * 🔄 Cambiar rol de usuario (solo admin)
   */
  static async changeUserRole(req, res) {
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      throwBadRequest('userId y newRole son requeridos');
    }

    if (!['user', 'premium', 'admin'].includes(newRole)) {
      throwBadRequest('Rol inválido. Debe ser: user, premium o admin');
    }

    const User = (await import('../models/User.model.js')).default;
    const user = await User.findById(userId);

    if (!user) {
      throwNotFound('Usuario');
    }

    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    logger.success(`🔄 Rol cambiado para ${user.email}: ${oldRole} → ${newRole}`);

    res.status(200).json({
      success: true,
      message: `Rol actualizado de ${oldRole} a ${newRole}`,
      user: user.toPublicJSON(),
    });
  }
}

export default AuthController;
