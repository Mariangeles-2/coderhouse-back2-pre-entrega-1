import { logger } from '../utils/logger.util.js';

import { throwForbidden, throwNotFound, throwUnauthorized } from './error.middleware.js';

/**
 * 🛡️ Middleware unificado de Autenticación y Autorización
 * Combina verificación de identidad y permisos en un solo lugar
 */

// ========================================
// 🔐 AUTENTICACIÓN (¿Quién eres?)
// ========================================

/**
 * Verificar que el usuario esté autenticado
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    logger.warning('🚫 Acceso denegado: Usuario no autenticado', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    return throwUnauthorized('Debes estar autenticado para acceder a este recurso');
  }
  next();
};

/**
 * Verificar que el usuario NO esté autenticado (para login/register)
 */
export const requireGuest = (req, res, next) => {
  if (req.user) {
    logger.info('ℹ️ Usuario ya autenticado intentando acceso a ruta de invitado', {
      user: req.user.email,
      path: req.path,
    });
    return throwForbidden('Ya estás autenticado');
  }
  next();
};

// ========================================
// 🛡️ AUTORIZACIÓN (¿Qué puedes hacer?)
// ========================================

/**
 * Verificar rol específico
 */
export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return throwUnauthorized('Debes estar autenticado');
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.security('🚨 Acceso denegado por rol insuficiente', {
        user: req.user.email,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return throwForbidden(`Acceso denegado. Roles requeridos: ${allowedRoles.join(', ')}`);
    }

    next();
  };

/**
 * Verificar cuenta activa
 */
export const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return throwUnauthorized('Debes estar autenticado');
  }

  if (!req.user.isActive) {
    logger.warning('🔒 Intento de acceso con cuenta inactiva', {
      user: req.user.email,
      path: req.path,
      method: req.method,
    });
    return throwForbidden('Tu cuenta está inactiva. Contacta al administrador');
  }

  next();
};

// ========================================
// 🎯 REGLAS DE NEGOCIO ESPECÍFICAS
// ========================================

/**
 * Admins y premium pueden modificar productos
 */
export const requireAdminOrPremiumForProducts = (req, res, next) => {
  const { method } = req;

  // Solo verificar para operaciones de modificación
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!req.user) {
      return throwUnauthorized('Debes estar autenticado');
    }

    if (!['admin', 'premium'].includes(req.user.role)) {
      logger.security('🚨 Intento de modificación de productos sin permisos', {
        user: req.user.email,
        userRole: req.user.role,
        method,
        path: req.path,
        ip: req.ip,
      });
      return throwForbidden(
        'Solo los administradores y usuarios premium pueden crear, actualizar o eliminar productos'
      );
    }
  }

  next();
};

/**
 * Solo usuarios (no admins ni premium) pueden usar carritos
 */
export const requireUserForCart = (req, res, next) => {
  if (!req.user) {
    return throwUnauthorized('Debes estar autenticado para gestionar tu carrito');
  }

  if (req.user.role === 'admin') {
    logger.warning('⚠️ Admin intentando usar funciones de carrito', {
      user: req.user.email,
      path: req.path,
      method: req.method,
    });
    return throwForbidden('Los administradores no pueden usar carritos de compra');
  }

  if (req.user.role === 'premium') {
    logger.warning('⚠️ Usuario premium intentando usar funciones de carrito', {
      user: req.user.email,
      path: req.path,
      method: req.method,
    });
    return throwForbidden('Los usuarios premium no pueden usar carritos de compra');
  }

  next();
};

/**
 * Verificar propiedad de recurso (para usuarios premium)
 */
export const requireOwnership =
  (resourceType = 'product') =>
  async (req, res, next) => {
    if (!req.user) {
      return throwUnauthorized('Debes estar autenticado');
    }

    // Admin siempre tiene acceso
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      let resource;
      const resourceId = req.params.pid || req.params.id;

      if (resourceType === 'product') {
        const Product = (await import('../models/Product.model.js')).default;
        resource = await Product.findById(resourceId);

        if (!resource) {
          return throwNotFound('Producto no encontrado');
        }

        // Verificar que el usuario premium sea propietario
        if (req.user.role === 'premium' && resource.owner.toString() !== req.user._id.toString()) {
          logger.security('🚨 Intento de acceso a producto ajeno', {
            user: req.user.email,
            productId: resourceId,
            productOwner: resource.owner.toString(),
            path: req.path,
            method: req.method,
          });
          return throwForbidden('Solo puedes modificar productos de tu propiedad');
        }
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error(`❌ Error verificando propiedad de ${resourceType}:`, error);
      next(error);
    }
  };

// ========================================
// 📋 COMBINACIONES COMUNES
// ========================================

export const authRules = {
  // Solo administradores
  adminOnly: [requireAuth, requireActiveAccount, requireRole('admin')],

  // Administradores y premium
  adminOrPremium: [requireAuth, requireActiveAccount, requireRole('admin', 'premium')],

  // Cualquier usuario autenticado
  authenticated: [requireAuth, requireActiveAccount],

  // Solo usuarios (no admins) para carritos
  userOnly: [requireAuth, requireActiveAccount, requireUserForCart],

  // Verificar propiedad para premium
  ownership: (resourceType) => [requireAuth, requireActiveAccount, requireOwnership(resourceType)],

  // Reglas específicas para productos
  products: {
    read: [], // Lectura pública
    modify: [requireAuth, requireActiveAccount, requireAdminOrPremiumForProducts],
  },

  // Reglas para carritos
  carts: [requireAuth, requireActiveAccount, requireUserForCart],

  // Solo invitados (no autenticados)
  guestOnly: [requireGuest],
};

/**
 * Logging de accesos autorizados
 */
export const logAuthorizedAccess = (req, res, next) => {
  if (req.user) {
    logger.info('✅ Acceso autorizado', {
      user: req.user.email,
      role: req.user.role,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  }
  next();
};
