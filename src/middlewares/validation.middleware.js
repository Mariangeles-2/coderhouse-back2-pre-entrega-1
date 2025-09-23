import { logger } from '../utils/logger.util.js';

/**
 * 🛡️ Middleware de validación usando Joi - Versión Limpia
 */

export const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    }));

    logger.validation('🚫 Errores de validación:', { errors, path: req.path });

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      error: 'VALIDATION_ERROR',
      statusCode: 400,
      details: errors,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Asignar valores validados y convertidos
  req.body = value;
  next();
};

// Alias para compatibilidad
export const validateBody = validateRequest;
