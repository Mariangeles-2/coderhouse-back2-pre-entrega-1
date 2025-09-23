import winston from 'winston';

/**
 * 📝 Logger Profesional con Winston
 * Reemplaza al logger manual anterior con funcionalidades avanzadas
 */

// Configuración de niveles personalizados para nuestro dominio
const customLevels = {
  levels: {
    error: 0,
    security: 1,
    warning: 2,
    auth: 3,
    info: 4,
    success: 5,
    debug: 6,
  },
  colors: {
    error: 'red',
    security: 'magenta',
    warning: 'yellow',
    auth: 'blue',
    info: 'cyan',
    success: 'green',
    debug: 'gray',
  },
};

// Agregar colores personalizados
winston.addColors(customLevels.colors);

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;

    // Agregar stack trace si existe
    if (stack) {
      logMessage += `\n${stack}`;
    }

    // Agregar metadata adicional si existe
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return logMessage;
  })
);

// Formato para archivos (sin colores)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configuración de transports
const transports = [
  // Consola - siempre activa en desarrollo
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
  }),
];

// En producción, agregar archivos de log
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Log general
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'info',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Log solo de errores
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Log de seguridad
    new winston.transports.File({
      filename: 'logs/security.log',
      level: 'security',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10, // Más archivos para seguridad
    })
  );
}

// Crear el logger
const winstonLogger = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  transports,
  // Manejar excepciones no capturadas
  exceptionHandlers: [
    new winston.transports.Console({ format: logFormat }),
    ...(process.env.NODE_ENV === 'production'
      ? [new winston.transports.File({ filename: 'logs/exceptions.log' })]
      : []),
  ],
  // Manejar promesas rechazadas
  rejectionHandlers: [
    new winston.transports.Console({ format: logFormat }),
    ...(process.env.NODE_ENV === 'production'
      ? [new winston.transports.File({ filename: 'logs/rejections.log' })]
      : []),
  ],
  exitOnError: false,
});

/**
 * 🎯 Clase Logger con métodos específicos para nuestro dominio
 * Mantiene la misma interfaz que el logger anterior para compatibilidad
 */
class Logger {
  static info(message, meta = {}) {
    winstonLogger.info(`ℹ️ ${message}`, meta);
  }

  static success(message, meta = {}) {
    winstonLogger.success(`✅ ${message}`, meta);
  }

  static warning(message, meta = {}) {
    winstonLogger.warning(`⚠️ ${message}`, meta);
  }

  static error(message, meta = {}) {
    winstonLogger.error(`❌ ${message}`, meta);
  }

  static debug(message, meta = {}) {
    winstonLogger.debug(`🐛 ${message}`, meta);
  }

  static auth(message, meta = {}) {
    winstonLogger.auth(`🔐 ${message}`, meta);
  }

  static security(message, meta = {}) {
    winstonLogger.security(`🚨 ${message}`, meta);
  }

  static database(message, meta = {}) {
    winstonLogger.info(`🗄️ [DATABASE] ${message}`, meta);
  }

  static server(message, meta = {}) {
    winstonLogger.info(`🚀 [SERVER] ${message}`, meta);
  }

  static validation(message, meta = {}) {
    winstonLogger.warning(`🛡️ [VALIDATION] ${message}`, meta);
  }

  static rateLimit(message, meta = {}) {
    winstonLogger.warning(`🚫 [RATE_LIMIT] ${message}`, meta);
  }

  static email(message, meta = {}) {
    winstonLogger.info(`📧 [EMAIL] ${message}`, meta);
  }

  // Métodos adicionales para casos específicos
  static logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user?.email || 'No autenticado',
    };

    if (res.statusCode >= 400) {
      this.warning(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
    } else {
      this.info(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
    }
  }

  static logSecurityEvent(event, details = {}) {
    this.security(`SECURITY EVENT: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  // Método para crear logs estructurados
  static structured(level, message, data = {}) {
    winstonLogger.log(level, message, {
      structured: true,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
}

export const logger = Logger;
export default Logger;
