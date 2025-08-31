import passport from 'passport';
import {logger} from '../utils/logger.util.js';

/**
 * 🔐 Controlador de Autenticación
 * Maneja registro, login, logout y gestión de sesiones
 */
class AuthController {
  /**
   * 👤 Procesar registro de usuario
   */
  static register(req, res, next) {
    passport.authenticate('local-register', (err, user, info) => {
      if (err) {
        logger.error('❌ Error en registro:', err);
        return res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        });
      }

      if (!user) {
        logger.warning('⚠️ Fallo en registro:', info.message);
        return res.status(400).json({
          success: false,
          message: info.message,
        });
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          logger.error('❌ Error al iniciar sesión después del registro:', loginErr);
          return res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
          });
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
        return res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        });
      }

      if (!user) {
        logger.warning('⚠️ Fallo en login:', info.message);
        return res.status(401).json({
          success: false,
          message: info.message,
        });
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          logger.error('❌ Error al establecer sesión:', loginErr);
          return res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
          });
        }

        logger.success(`✅ Usuario logueado: ${user.email}`);
        return res.json({
          success: true,
          message: 'Sesión iniciada exitosamente',
          user: user.toPublicJSON(),
        });
      });
    })(req, res, next);
  }

  /**
   * 🚪 Cerrar sesión
   */
  static logout(req, res) {
    const userEmail = req.user?.email || 'Usuario desconocido';

    req.logout((err) => {
      if (err) {
        logger.error('❌ Error al cerrar sesión:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al cerrar sesión',
        });
      }

      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          logger.error('❌ Error al destruir sesión:', sessionErr);
          return res.status(500).json({
            success: false,
            message: 'Error al destruir sesión',
          });
        }

        logger.info(`👋 Usuario deslogueado: ${userEmail}`);
        res.clearCookie('connect.sid');
        return res.json({
          success: true,
          message: 'Sesión cerrada exitosamente',
        });
      });
    });
  }

  /**
   * 👤 Obtener perfil del usuario actual
   */
  static getProfile(req, res) {
    logger.info(`👤 Perfil solicitado: ${req.user.email}`);
    res.json({
      success: true,
      user: req.user.toPublicJSON(),
    });
  }

  /**
   * ✅ Verificar estado de autenticación
   */
  static checkAuth(req, res) {
    if (req.isAuthenticated()) {
      return res.json({
        success: true,
        authenticated: true,
        user: req.user.toPublicJSON(),
      });
    }

    return res.json({
      success: true,
      authenticated: false,
      user: null,
    });
  }
}

export default AuthController;
