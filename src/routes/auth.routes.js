import { Router } from 'express';

import AuthController from '../controllers/auth.controller.js';
import { authRules } from '../middlewares/auth.middleware.js';
import { authenticateJWT } from '../middlewares/jwt.middleware.js';
import { generalLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  loginValidation,
  registerValidation,
  resetPasswordValidation,
} from '../validations/auth.validation.js';

const router = Router();

// Rutas de autenticación con middlewares de autorización

// Aplicar rate limiting a todas las rutas de auth
router.use(generalLimiter);

// RUTAS PÚBLICAS (solo invitados)
// POST /register - Registro de usuario
router.post(
  '/register',
  authRules.guestOnly, // Solo usuarios no autenticados
  validateRequest(registerValidation),
  AuthController.register
);

// POST /login - Inicio de sesión
router.post(
  '/login',
  authRules.guestOnly, // Solo usuarios no autenticados
  validateRequest(loginValidation),
  AuthController.login
);

// POST /forgot-password - Solicitar recuperación de contraseña
router.post(
  '/forgot-password',
  authRules.guestOnly, // Solo usuarios no autenticados
  AuthController.requestPasswordReset
);

// POST /reset-password - Restablecer contraseña
router.post(
  '/reset-password',
  authRules.guestOnly, // Solo usuarios no autenticados
  validateRequest(resetPasswordValidation),
  AuthController.resetPassword
);

// RUTAS AUTENTICADAS
// GET /current - Usuario actual (DTO seguro sin información sensible)
router.get(
  '/current',
  authenticateJWT, // Aplicar JWT solo aquí
  authRules.authenticated, // Cualquier usuario autenticado
  AuthController.current
);

// POST /refresh-token - Renovar token de acceso
router.post(
  '/refresh-token',
  authenticateJWT, // Aplicar JWT solo aquí
  authRules.authenticated, // Cualquier usuario autenticado
  AuthController.refreshToken
);

// POST /logout - Cerrar sesión
router.post(
  '/logout',
  authenticateJWT, // Aplicar JWT solo aquí
  authRules.authenticated, // Cualquier usuario autenticado
  AuthController.logout
);

export default router;
