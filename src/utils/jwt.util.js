import { randomUUID } from 'crypto';

import jwt from 'jsonwebtoken';

import { logger } from './logger.util.js';

// Sistema JWT con Access y Refresh Tokens
// Solo incluye métodos que realmente se utilizan
class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  // Generar Access Token (corta duración)
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

      logger.auth(`Access token generado para: ${user.email}`);
      return token;
    } catch (error) {
      logger.error('Error generando access token:', error);
      throw new Error('Error generando token de acceso');
    }
  }

  // Generar Refresh Token (larga duración)
  generateRefreshToken(user) {
    try {
      const payload = {
        id: user._id,
        email: user.email,
        jti: randomUUID(), // JWT ID único para invalidar tokens específicos
        type: 'refresh',
      };

      const token = jwt.sign(payload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'ecommerce-backend',
        audience: 'ecommerce-users',
      });

      logger.auth(`Refresh token generado para: ${user.email}`);
      return token;
    } catch (error) {
      logger.error('Error generando refresh token:', error);
      throw new Error('Error generando token de actualización');
    }
  }

  // Generar par de tokens (access + refresh)
  generateTokenPair(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  // Verificar Access Token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'ecommerce-backend',
        audience: 'ecommerce-users',
      });

      if (decoded.type !== 'access') {
        throw new Error('Token inválido: no es un access token');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token de acceso expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token de acceso inválido');
      }
      throw error;
    }
  }

  // Verificar Refresh Token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'ecommerce-backend',
        audience: 'ecommerce-users',
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido: no es un refresh token');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Refresh token inválido');
      }
      throw error;
    }
  }

  // Decodificar token sin verificar (útil para debug)
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Error decodificando token:', error);
      return null;
    }
  }

  // Verificar si un token está próximo a expirar
  isTokenExpiringSoon(token, minutesThreshold = 5) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      const thresholdInSeconds = minutesThreshold * 60;

      return timeUntilExpiry <= thresholdInSeconds;
    } catch (error) {
      logger.error('Error verificando expiración:', error);
      return true;
    }
  }
}

export const jwtService = new JWTService();
