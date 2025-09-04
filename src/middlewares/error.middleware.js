import createError from 'http-errors';
import { logger } from '../utils/logger.util.js';

/**
 * 🛡️ Manejador de Errores Simplificado usando estándares de Express
 * Usa http-errors (librería estándar) en lugar de clases personalizadas
 */

/**
 * 🚨 Middleware de manejo de errores global (estándar de Express)
 */
export const errorHandler = (err, req, res, _next) => {
  // Log del error con contexto
  logError(err, req);

  // Si no es un error HTTP, crear uno genérico
  if (!err.status && !err.statusCode) {
    err = createError(500, err.message || 'Error interno del servidor');
  }

  const status = err.status || err.statusCode || 500;

  // Respuesta consistente
  res.status(status).json({
    success: false,
    error: {
      message: err.message,
      status,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};

/**
 * 🔍 Middleware para rutas no encontradas (404)
 */
export const notFoundHandler = (req, res, next) => {
  const error = createError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * 📝 Función de logging simplificada
 */
const logError = (err, req) => {
  const context = {
    method: req?.method,
    url: req?.url,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    user: req?.user?.email || 'No autenticado',
  };

  if (err.status < 500) {
    logger.warning(`⚠️ ${err.message}`, context);
  } else {
    logger.error(`💥 ${err.message}`, { ...context, stack: err.stack });
  }
};

// 🎁 Helper functions usando http-errors (mucho más simple)
export const throwNotFound = (resource = 'Recurso') => {
  throw createError(404, `${resource} no encontrado`);
};

export const throwBadRequest = (message) => {
  throw createError(400, message);
};

export const throwUnauthorized = (message = 'No autorizado') => {
  throw createError(401, message);
};

export const throwForbidden = (message = 'Acceso prohibido') => {
  throw createError(403, message);
};

export const throwConflict = (message) => {
  throw createError(409, message);
};

export const throwValidationError = (message) => {
  throw createError(422, message);
};
