import {logger} from '../utils/logger.util.js';
import Product from '../models/Product.model.js';

/**
 * 🛡️ Middlewares de Autenticación y Autorización
 */
class AuthMiddleware {
  /**
   * 🔐 Verificar si el usuario está autenticado
   */
  static isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      logger.auth(`✅ Usuario autenticado: ${req.user.email}`);
      return next();
    }

    logger.warning('⚠️ Intento de acceso sin autenticación');
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado. Debes iniciar sesión.',
    });
  }

  /**
   * 🚫 Verificar si el usuario NO está autenticado (para login/register)
   */
  static isNotAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }

    logger.info(`🔄 Usuario ya autenticado: ${req.user.email}`);
    return res.status(200).json({
      success: true,
      message: 'Ya estás autenticado',
      user: req.user.toPublicJSON(),
    });
  }

  /**
   * 👑 Verificar rol de administrador
   */
  static isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      logger.auth(`👑 Acceso de admin autorizado: ${req.user.email}`);
      return next();
    }

    logger.warning(`🚫 Acceso denegado - Se requiere rol admin: ${req.user?.email || 'No autenticado'}`);
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.',
    });
  }

  /**
   * ⭐ Verificar rol premium o admin
   */
  static isPremiumOrAdmin(req, res, next) {
    if (req.isAuthenticated() && ['admin', 'premium'].includes(req.user.role)) {
      logger.auth(`⭐ Acceso premium/admin autorizado: ${req.user.email}`);
      return next();
    }

    logger.warning(`🚫 Acceso denegado - Se requiere rol premium/admin: ${req.user?.email || 'No autenticado'}`);
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos premium o de administrador.',
    });
  }

  /**
   * 🏠 Verificar que el usuario solo acceda a sus propios recursos
   */
  static isOwnerOrAdmin(req, res, next) {
    const resourceUserId = req.params.id || req.body.userId;
    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (isAdmin || currentUserId === resourceUserId) {
      logger.auth(`🏠 Acceso a recurso propio autorizado: ${req.user.email}`);
      return next();
    }

    logger.warning(`🚫 Acceso denegado - Recurso no pertenece al usuario: ${req.user.email}`);
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo puedes acceder a tus propios recursos.',
    });
  }

  /**
   * 🏠 Verificar que el usuario sea propietario del producto o admin
   */
  static async isProductOwnerOrAdmin(req, res, next) {
    try {
      const {id} = req.params;
      const product = await Product.findById(id);

      if (!product) {
        logger.warning(`⚠️ Producto no encontrado: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado',
        });
      }

      // Verificar si es el propietario o admin
      const isOwner = product.owner?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        logger.warning(`🚫 Acceso denegado - Usuario no es propietario del producto: ${req.user.email}`);
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo el propietario del producto o un administrador pueden realizar esta acción.',
        });
      }

      logger.auth(`✅ Acceso autorizado al producto ${product.title} por: ${req.user.email}`);
      // Pasar el producto al siguiente middleware/controlador para evitar consulta duplicada
      req.product = product;
      return next();
    } catch (error) {
      logger.error('❌ Error al verificar propietario del producto:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
}

export default AuthMiddleware;
