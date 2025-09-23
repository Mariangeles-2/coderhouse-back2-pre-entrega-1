import User from '../models/User.model.js';
import { jwtService } from '../utils/jwt.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * 🔐 Middleware de autenticación JWT - Refactorizado
 * Permite autenticación tanto por JWT como por sesión (para compatibilidad)
 */
export const authenticateJWT = async (req, res, next) => {
  try {
    // Intentar autenticación JWT primero
    const jwtAuthResult = await _tryJWTAuthentication(req);
    if (jwtAuthResult.success) {
      req.user = jwtAuthResult.user;
      req.isJWTAuth = true;
      logger.auth(`✅ Usuario autenticado via JWT: ${jwtAuthResult.user.email}`);
      return next();
    }

    // Si JWT falla, intentar autenticación por sesión
    const sessionAuthResult = _trySessionAuthentication(req);
    if (sessionAuthResult.success) {
      req.user = sessionAuthResult.user;
      req.isJWTAuth = false;
      logger.auth(`✅ Usuario autenticado via Sesión: ${sessionAuthResult.user.email}`);
      return next();
    }

    // No hay autenticación válida
    return res.status(401).json({
      success: false,
      message: 'Token inválido o sesión expirada',
    });
  } catch (error) {
    logger.error('❌ Error en middleware JWT:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

/**
 * 🔧 Funciones privadas para reducir complejidad
 */
const _tryJWTAuthentication = async (req) => {
  const authHeader = req.headers.authorization;
  const token = jwtService.extractTokenFromHeader(authHeader);

  if (!token) {
    return { success: false };
  }

  try {
    const decoded = jwtService.verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return { success: false };
    }

    return { success: true, user };
  } catch (jwtError) {
    return { success: false, error: jwtError.message };
  }
};

const _trySessionAuthentication = (req) => {
  if (req.session && req.session.user) {
    return { success: true, user: req.session.user };
  }
  return { success: false };
};
