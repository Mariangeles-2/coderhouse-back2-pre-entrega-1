import { randomUUID } from 'crypto';

import jwt from 'jsonwebtoken';

import { logger } from './logger.util.js';

/**
 * 🔐 Sistema JWT con Access y Refresh Tokens - Versión Limpia
 * Solo incluye métodos que realmente se utilizan
 */

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  /**
   * 🎫 Generar Access Token (corta duración)
   */
  generateAccessToken(user) {
    try {
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        type: 'access',
      };

      const token = jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'ecommerce-backend',
        audience: 'ecommerce-users',
      });

      logger.auth(`✅ Access token generado para: ${user.email}`);
      return token;
    } catch (error) {
      logger.error('❌ Error generando access token:', error);
      throw new Error('Error generando token de acceso');
    }
  }

  /**
   * 🔄 Generar Refresh Token (larga duración)
   */
  generateRefreshToken(user) {
    try {
      const payload = {
        id: user._id,
        email: user.email,
        type: 'refresh',
        jti: randomUUID(),
      };

      const token = jwt.sign(payload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'ecommerce-backend',
        audience: 'ecommerce-users',
      });

      logger.auth(`✅ Refresh token generado para: ${user.email}`);
      return token;
    } catch (error) {
      logger.error('❌ Error generando refresh token:', error);
      throw new Error('Error generando token de renovación');
    }
  }

  /**
   * 🎯 Generar par de tokens (access + refresh) - MÉTODO PRINCIPAL
   */
  generateTokenPair(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      expiresIn: this.accessTokenExpiry,
    };
  }

  /**
   * 🔍 Verificar Access Token - MÉTODO PRINCIPAL
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'ecommerce-backend',
        audience: 'ecommerce-users',
      });

      if (decoded.type !== 'access') {
        logger.warning('🚫 Token inválido: no es un access token');
        throw new Error('Token inválido');
      }

      return decoded;
    } catch (error) {
      return this._handleTokenError(error, 'access');
    }
  }

  /**
   * 🔄 Verificar Refresh Token - MÉTODO PRINCIPAL
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'ecommerce-backend',
        audience: 'ecommerce-users',
      });

      if (decoded.type !== 'refresh') {
        logger.warning('🚫 Token inválido: no es un refresh token');
        throw new Error('Token inválido');
      }

      return decoded;
    } catch (error) {
      return this._handleTokenError(error, 'refresh');
    }
  }

  /**
   * 🔧 Método privado para manejar errores de tokens
   */
  _handleTokenError(error, tokenType) {
    if (error.name === 'TokenExpiredError') {
      logger.warning(`⏰ ${tokenType} token expirado`);
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warning(`🚫 ${tokenType} token inválido`);
      throw new Error('Token inválido');
    } else {
      logger.error(`❌ Error verificando ${tokenType} token:`, error.message);
      throw new Error(
        `Error verificando token de ${tokenType === 'access' ? 'acceso' : 'renovación'}`
      );
    }
  }

  /**
   * 🔧 Extraer token del header Authorization - MÉTODO PRINCIPAL
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remover "Bearer "
  }
}

// Exportar instancia singleton
export const jwtService = new JWTService();
