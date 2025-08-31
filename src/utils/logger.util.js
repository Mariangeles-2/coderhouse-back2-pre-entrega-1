/**
 * 📝 Utilidad de Logger
 */

class Logger {
  static info(message, ...args) {
    console.log(`ℹ️ [INFO] ${message}`, ...args);
  }

  static success(message, ...args) {
    console.log(`✅ [SUCCESS] ${message}`, ...args);
  }

  static warning(message, ...args) {
    console.warn(`⚠️ [WARNING] ${message}`, ...args);
  }

  static error(message, ...args) {
    console.error(`❌ [ERROR] ${message}`, ...args);
  }

  static debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  }

  static auth(message, ...args) {
    console.log(`🔐 [AUTH] ${message}`, ...args);
  }

  static database(message, ...args) {
    console.log(`🗄️ [DATABASE] ${message}`, ...args);
  }

  static server(message, ...args) {
    console.log(`🚀 [SERVER] ${message}`, ...args);
  }
}

export const logger = Logger;
