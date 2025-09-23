import createError from 'http-errors';

import { logger } from '../utils/logger.util.js';

/**
 * 🚨 Sistema de manejo de errores simplificado con http-errors
 * Funciona perfectamente con express-async-errors para capturar TODOS los errores
 */

// ========================================
// 🎯 Funciones helper para lanzar errores
// ========================================

export const throwBadRequest = (message = 'Petición inválida') => {
  throw createError(400, message);
};

export const throwUnauthorized = (message = 'No autorizado') => {
  throw createError(401, message);
};

export const throwForbidden = (message = 'Prohibido') => {
  throw createError(403, message);
};

export const throwNotFound = (resource = 'Recurso') => {
  throw createError(404, `${resource} no encontrado`);
};

export const throwTooManyRequests = (message = 'Demasiadas solicitudes') => {
  throw createError(429, message);
};

// ========================================
// 🔍 Middleware para rutas no encontradas
// ========================================
export const notFoundHandler = (req, res, _next) => {
  logger.warning(`🔍 Ruta no encontrada: ${req.method} ${req.path} - IP: ${req.ip}`);

  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });
};

// ========================================
// 🚨 Middleware global de manejo de errores - Refactorizado
// ========================================
export const errorHandler = (err, req, res, _next) => {
  // Si ya se envió una respuesta, delegamos a Express
  if (res.headersSent) {
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  // Logging del error
  _logError(err, req, statusCode, message);

  // Crear respuesta de error
  const errorResponse = _createErrorResponse(err, req, statusCode, message);

  // Enviar respuesta
  res.status(statusCode).json(errorResponse);
};

/**
 * 🔧 Funciones privadas para reducir complejidad
 */
const _logError = (err, req, statusCode, message) => {
  const logData = {
    message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user?.email || 'No autenticado',
  };

  if (statusCode >= 500) {
    logger.error(`🚨 Error ${statusCode}:`, {
      ...logData,
      stack: err.stack,
    });
  } else if (statusCode >= 400) {
    logger.warning(`⚠️ Error ${statusCode}:`, logData);
  }
};

const _createErrorResponse = (err, req, statusCode, message) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const errorResponse = {
    success: false,
    message,
    error: err.name || 'ERROR',
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    type: _getErrorType(statusCode),
  };

  // En desarrollo, incluir más información para debugging
  if (!isProduction) {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || null;
  }

  // Agregar información específica para ciertos errores
  if (statusCode === 429) {
    errorResponse.retryAfter = err.retryAfter || '15 minutos';
  }

  return errorResponse;
};

const _getErrorType = (statusCode) => {
  switch (statusCode) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'AUTHENTICATION_ERROR';
    case 403:
      return 'AUTHORIZATION_ERROR';
    case 404:
      return 'NOT_FOUND_ERROR';
    case 429:
      return 'RATE_LIMIT_ERROR';
    case 500:
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
};
