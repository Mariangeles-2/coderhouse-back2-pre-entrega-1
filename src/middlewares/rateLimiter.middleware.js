import rateLimit from 'express-rate-limit';

import { logger } from '../utils/logger.util.js';

/**
 * 🛡️ Configuración de Rate Limiting para protección contra ataques de fuerza bruta
 */

// Rate limiter general para la API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por ventana de tiempo
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true, // Incluir headers `RateLimit-*`
  legacyHeaders: false, // Deshabilitar headers `X-RateLimit-*`
  handler: (req, res) => {
    logger.warning(`🚫 Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
      retryAfter: '15 minutos',
    });
  },
});

// Rate limiter estricto para login (protección anti fuerza bruta)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos de login por IP cada 15 minutos
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req, res) => {
    logger.security(
      `🚨 ALERTA: Posible ataque de fuerza bruta desde IP: ${req.ip} - Email: ${req.body?.email || 'No especificado'}`
    );
    res.status(429).json({
      success: false,
      message:
        'Demasiados intentos de inicio de sesión fallidos. Por seguridad, espera 15 minutos antes de intentar de nuevo.',
      retryAfter: '15 minutos',
      security: 'Este IP ha sido temporalmente bloqueado por seguridad',
    });
  },
});

// Rate limiter para registro de usuarios
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 registros por hora por IP
  message: {
    success: false,
    message: 'Demasiados registros desde esta IP. Intenta de nuevo en 1 hora.',
    retryAfter: '1 hora',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security(`🚨 ALERTA: Múltiples registros desde IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Demasiados registros desde esta IP. Intenta de nuevo en 1 hora.',
      retryAfter: '1 hora',
    });
  },
});

// Rate limiter para recuperación de contraseñas
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 solicitudes de recuperación por hora
  message: {
    success: false,
    message: 'Demasiadas solicitudes de recuperación de contraseña. Intenta de nuevo en 1 hora.',
    retryAfter: '1 hora',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security(
      `🚨 Múltiples solicitudes de recuperación desde IP: ${req.ip} - Email: ${req.body?.email || 'No especificado'}`
    );
    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes de recuperación de contraseña. Intenta de nuevo en 1 hora.',
      retryAfter: '1 hora',
    });
  },
});

// Rate limiter para endpoints de administrador
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 50, // Máximo 50 requests cada 5 minutos para admins
  message: {
    success: false,
    message: 'Demasiadas solicitudes administrativas. Intenta de nuevo en 5 minutos.',
    retryAfter: '5 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warning(
      `🚫 Rate limit excedido para admin desde IP: ${req.ip} - Usuario: ${req.user?.email || 'No identificado'}`
    );
    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes administrativas. Intenta de nuevo en 5 minutos.',
      retryAfter: '5 minutos',
    });
  },
});
