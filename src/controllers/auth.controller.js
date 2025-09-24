import bcrypt from 'bcrypt';
import passport from 'passport';

import { UserDTO } from '../dto/index.js';
import { throwBadRequest, throwUnauthorized } from '../middlewares/error.middleware.js';
import userRepository from '../repositories/user.repository.js';
import { jwtService } from '../utils/jwt.util.js';
import { logger } from '../utils/logger.util.js';
import { passwordResetService } from '../utils/passwordReset.util.js';

// Controlador de autenticación con Repository pattern
// Usa Repository, DTOs y Services
class AuthController {
  // Registro de usuario
  static async register(req, res) {
    const { first_name, last_name, email, age, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throwBadRequest('El email ya está registrado');
    }

    // Determinar rol basado en el email (para pruebas y desarrollo)
    let role = 'user'; // Por defecto
    if (email.toLowerCase().includes('admin')) {
      role = 'admin';
      logger.info(`Asignando rol admin a: ${email}`);
    } else if (email.toLowerCase().includes('premium')) {
      role = 'premium';
      logger.info(`Asignando rol premium a: ${email}`);
    }

    // Crear usuario usando repository
    const userData = {
      first_name,
      last_name,
      email,
      age: parseInt(age),
      password,
      role, // Incluir el rol determinado
    };

    const newUser = await userRepository.create(userData);

    logger.success(`Usuario registrado: ${newUser.email} con rol: ${newUser.role}`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: UserDTO.fromUser(newUser),
    });
  }

  // Login de usuario
  static login(req, res, next) {
    passport.authenticate('local-login', async (err, user, info) => {
      if (err) {
        logger.error('Error en autenticación:', err);
        return next(err);
      }

      if (!user) {
        logger.warning(`Intento de login fallido: ${req.body.email || 'email no proporcionado'}`);

        return res.status(401).json({
          success: false,
          message: info?.message || 'Credenciales inválidas',
        });
      }

      try {
        // Generar tokens JWT
        const tokens = jwtService.generateTokenPair(user);

        // Actualizar último login usando repository
        await userRepository.update(user._id, { lastLogin: new Date() });

        // Establecer sesión
        req.login(user, (loginErr) => {
          if (loginErr) {
            logger.error('Error estableciendo sesión:', loginErr);
            return next(loginErr);
          }

          const userDTO = UserDTO.currentUser(user);

          logger.success(`Login exitoso: ${user.email}`);

          res.json({
            success: true,
            message: 'Login exitoso',
            user: userDTO,
            tokens,
          });
        });
      } catch (tokenError) {
        logger.error('Error generando tokens:', tokenError);
        next(tokenError);
      }
    })(req, res, next);
  }

  // Logout de usuario
  static logout(req, res) {
    const userEmail = req.user?.email || 'Usuario no identificado';

    req.logout((err) => {
      if (err) {
        logger.error('Error en logout:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al cerrar sesión',
        });
      }

      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          logger.error('Error destruyendo sesión:', sessionErr);
          return res.status(500).json({
            success: false,
            message: 'Error al destruir sesión',
          });
        }

        logger.info(`Logout exitoso: ${userEmail}`);

        res.json({
          success: true,
          message: 'Logout exitoso',
        });
      });
    });
  }

  // Usuario actual (ruta /current mejorada)
  static async current(req, res) {
    if (!req.user) {
      throwUnauthorized('No hay usuario autenticado');
    }

    // Usar repository para obtener información actualizada y segura
    const currentUser = await userRepository.getCurrentUser(req.user._id);

    if (!currentUser) {
      throwUnauthorized('Usuario no encontrado');
    }

    logger.info(`Información de usuario actual solicitada: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Usuario actual',
      user: currentUser, // Ya es un DTO seguro sin información sensible
    });
  }

  // Renovar token de acceso
  static async refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throwBadRequest('Refresh token requerido');
    }

    try {
      // Verificar refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);

      // Buscar usuario
      const user = await userRepository.findByEmail(decoded.email);
      if (!user) {
        throwUnauthorized('Usuario no encontrado');
      }

      // Generar nuevo par de tokens
      const tokens = jwtService.generateTokenPair(user);

      logger.info(`Token renovado para: ${user.email}`);

      res.json({
        success: true,
        message: 'Token renovado exitosamente',
        tokens,
      });
    } catch (error) {
      logger.warning(`Error renovando token: ${error.message}`);
      throwUnauthorized('Refresh token inválido o expirado');
    }
  }

  // Solicitar recuperación de contraseña
  static async requestPasswordReset(req, res) {
    const { email } = req.body;

    if (!email) {
      throwBadRequest('El email es requerido');
    }

    try {
      const user = await userRepository.findByEmail(email);

      if (!user) {
        // Por seguridad, siempre respondemos éxito
        return res.json({
          success: true,
          message: 'Si el email existe, recibirás un enlace de recuperación',
        });
      }

      // Generar token con expiración de 1 hora
      const { token, expires } = passwordResetService.generateResetToken();

      // Actualizar usuario con token
      await userRepository.update(user._id, {
        passwordResetToken: token,
        passwordResetExpires: expires,
      });

      // Enviar email (en un entorno real)
      await passwordResetService.sendResetEmail(
        user.email,
        token,
        `${user.first_name} ${user.last_name}`
      );

      logger.info(`Recuperación de contraseña solicitada para: ${user.email}`);

      res.json({
        success: true,
        message: 'Email de recuperación enviado exitosamente',
      });
    } catch (error) {
      logger.error('Error en recuperación de contraseña:', error);
      throw error;
    }
  }

  // Restablecer contraseña
  static async resetPassword(req, res) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throwBadRequest('Token y nueva contraseña son requeridos');
    }

    const user = await userRepository.findByResetToken(token);

    if (!user) {
      throwBadRequest('Token inválido o expirado');
    }

    // Verificar que el token no haya expirado
    if (!passwordResetService.isTokenValid(user.passwordResetExpires)) {
      throwBadRequest('El token ha expirado. Solicita uno nuevo');
    }

    // Validar que la nueva contraseña sea diferente a la anterior
    await passwordResetService.validateNewPassword(newPassword, user.password);

    // Hashear nueva contraseña
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña y limpiar tokens
    await userRepository.update(user._id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    // Enviar confirmación
    await passwordResetService.sendPasswordChangedConfirmation(
      user.email,
      `${user.first_name} ${user.last_name}`
    );

    logger.success(`Contraseña restablecida exitosamente para: ${user.email}`);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
    });
  }
}

export default AuthController;
