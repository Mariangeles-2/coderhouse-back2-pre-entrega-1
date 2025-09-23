import { logger } from '../utils/logger.util.js';

/**
 * 🛡️ Función de validación de origen para CORS
 */
const validateCorsOrigin = (requestOrigin, callback) => {
  // Lista de dominios permitidos
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    process.env.FRONTEND_URL,
  ].filter(Boolean); // Remover valores undefined

  // ✅ Permitir requests sin origin (Postman, Thunder Client, Insomnia, apps móviles)
  if (!requestOrigin) {
    logger.debug('🔧 Permitiendo request sin origin (Postman/herramientas de testing)');
    return callback(null, true);
  }

  // ✅ Permitir orígenes de la lista blanca
  if (allowedOrigins.includes(requestOrigin)) {
    logger.debug(`✅ CORS: Origen permitido: ${requestOrigin}`);
    callback(null, true);
  } else {
    logger.security(`🚫 CORS: Origen no permitido: ${requestOrigin}`);
    callback(new Error('Origen no permitido por política CORS'));
  }
};

/**
 * 🛡️ Configuración de seguridad HTTP con Helmet y CORS
 */

// Configuración de CORS segura que permite Postman
export const corsOptions = {
  origin: validateCorsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-API-Key',
    'User-Agent',
  ],
  credentials: true, // Permitir cookies y headers de autenticación
  maxAge: 86400, // Cache preflight por 24 horas
  // ✅ Habilitar preflight para todas las rutas
  preflightContinue: false,
  optionsSuccessStatus: 200, // Para IE11
};

// Configuración de Helmet para seguridad HTTP
export const helmetOptions = {
  // Política de seguridad de contenido
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },

  // Política de referrer
  referrerPolicy: { policy: 'same-origin' },

  // Protección contra clickjacking
  frameguard: { action: 'deny' },

  // Evitar que el navegador detecte MIME types
  noSniff: true,

  // Forzar HTTPS en producción
  hsts:
    process.env.NODE_ENV === 'production'
      ? {
          maxAge: 31536000, // 1 año
          includeSubDomains: true,
          preload: true,
        }
      : false,

  // Protección XSS
  xssFilter: true,

  // Ocultar información del servidor
  hidePoweredBy: true,
};

/**
 * 🔒 Middleware de seguridad HTTP personalizado
 */
export const securityHeaders = (req, res, next) => {
  // Headers de seguridad adicionales
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Solo aplicar HSTS en producción
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remover headers que revelan información del servidor
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Cache control para endpoints sensibles
  if (req.path.includes('/auth/') || req.path.includes('/api/users/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  next();
};

/**
 * 📊 Middleware mejorado para logging de requests
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log de request con más detalles
  const requestInfo = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    origin: req.get('Origin') || 'No origin',
    referer: req.get('Referer') || 'No referer',
  };

  logger.info(`📨 ${req.method} ${req.path}`, requestInfo);

  // Interceptar response para logging mejorado
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const responseInfo = {
      statusCode,
      duration: `${duration}ms`,
      contentLength: body ? body.length : 0,
      user: req.user?.email || 'No autenticado',
    };

    // Log según el tipo de response
    if (statusCode >= 500) {
      logger.error(`📤 ${req.method} ${req.path} - ERROR ${statusCode}`, responseInfo);
    } else if (statusCode >= 400) {
      logger.warning(`📤 ${req.method} ${req.path} - WARNING ${statusCode}`, responseInfo);
    } else {
      logger.info(`📤 ${req.method} ${req.path} - SUCCESS ${statusCode}`, responseInfo);
    }

    // Log de actividad sospechosa
    if (statusCode === 401 || statusCode === 403) {
      logger.security(`🚨 Acceso no autorizado detectado`, {
        ...requestInfo,
        ...responseInfo,
        timestamp: new Date().toISOString(),
      });
    }

    return originalSend.call(this, body);
  };

  next();
};
