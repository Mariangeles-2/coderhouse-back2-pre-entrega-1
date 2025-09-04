import { logger } from '../utils/logger.util.js';
import Product from '../models/Product.model.js';
import { throwForbidden, throwNotFound, throwUnauthorized } from './error.middleware.js';

/**
 * 🛡️ Middlewares de Autenticación y Autorización - Versión Simplificada
 * Usando http-errors (librería estándar) + express-async-errors
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
    throwUnauthorized('Debes iniciar sesión para acceder a este recurso');
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

    logger.warning(
      `🚫 Acceso denegado - Se requiere rol admin: ${req.user?.email || 'No autenticado'}`
    );
    throwForbidden('Se requieren permisos de administrador para acceder a este recurso');
  }

  /**
   * 👑 Verificar si es admin o propietario del producto
   */
  static async isAdminOrOwner(req, res, next) {
    // Primero verificar autenticación
    if (!req.isAuthenticated()) {
      throwUnauthorized('Debes iniciar sesión para acceder a este recurso');
    }

    const user = req.user;
    const productId = req.params.pid;

    // Si es admin, permitir acceso
    if (user.role === 'admin') {
      logger.auth(`👑 Acceso de admin autorizado: ${user.email}`);
      return next();
    }

    // Si es usuario premium, verificar que sea propietario del producto
    if (user.role === 'premium') {
      const product = await Product.findById(productId);

      if (!product) {
        throwNotFound('Producto');
      }

      if (product.owner.toString() === user._id.toString()) {
        logger.auth(
          `✅ Acceso de propietario autorizado: ${user.email} para producto ${productId}`
        );
        return next();
      } else {
        logger.warning(
          `🚫 Usuario premium sin permisos: ${user.email} intentó acceder a producto ${productId}`
        );
        throwForbidden('Solo puedes modificar productos de tu propiedad');
      }
    }

    // Usuario normal sin permisos
    logger.warning(`🚫 Acceso denegado - Usuario sin permisos: ${user.email}`);
    throwForbidden('No tienes permisos para realizar esta acción');
  }

  /**
   * 🛒 Verificar que el usuario no sea propietario del producto (para agregar al carrito)
   */
  static async cannotAddOwnProduct(req, res, next) {
    if (!req.isAuthenticated()) {
      throwUnauthorized('Debes iniciar sesión para agregar productos al carrito');
    }

    const user = req.user;
    const productId = req.body.productId; // Viene del body en lugar de params

    // Solo verificar si es usuario premium (los admins no pueden agregar productos al carrito)
    if (user.role === 'premium') {
      const product = await Product.findById(productId);

      if (!product) {
        throwNotFound('Producto');
      }

      if (product.owner.toString() === user._id.toString()) {
        logger.warning(`🚫 Usuario intentó agregar su propio producto al carrito: ${user.email}`);
        throwForbidden('No puedes agregar tu propio producto al carrito');
      }
    }

    logger.auth(`✅ Usuario autorizado para agregar producto al carrito: ${user.email}`);
    next();
  }
}

export default AuthMiddleware;
