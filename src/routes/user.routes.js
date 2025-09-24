import { Router } from 'express';

import UserController from '../controllers/user.controller.js';
import { authRules } from '../middlewares/auth.middleware.js';
import { authenticateJWT } from '../middlewares/jwt.middleware.js';

const router = Router();

// Rutas de usuarios con autorización basada en roles

// Aplicar middleware JWT para detectar usuarios autenticados
router.use(authenticateJWT);

// RUTAS DE USUARIO INDIVIDUAL
// GET /current - Información del usuario actual (DTO seguro)
router.get(
  '/current',
  authRules.authenticated, // Cualquier usuario autenticado
  UserController.getCurrentUser
);

// RUTAS ADMINISTRATIVAS (solo admin)
// GET / - Obtener todos los usuarios (solo admin)
router.get(
  '/',
  authRules.adminOnly, // Solo administradores
  UserController.getAllUsers
);

// GET /:uid - Obtener usuario por ID (solo admin)
router.get(
  '/:uid',
  authRules.adminOnly, // Solo administradores
  UserController.getUserById
);

// PUT /:uid - Actualizar usuario (solo admin)
router.put(
  '/:uid',
  authRules.adminOnly, // Solo administradores
  UserController.updateUser
);

// DELETE /:uid - Eliminar usuario (solo admin)
router.delete(
  '/:uid',
  authRules.adminOnly, // Solo administradores
  UserController.deleteUser
);

export default router;
