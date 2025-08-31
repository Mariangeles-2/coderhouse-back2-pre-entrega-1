import express from 'express';
import UserController from '../controllers/user.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * 👥 Rutas de Usuarios
 */

// 📋 Obtener todos los usuarios (solo admin)
router.get('/', AuthMiddleware.isAuthenticated, AuthMiddleware.isAdmin, UserController.getAllUsers);

// 👤 Obtener usuario por ID (solo admin o propietario)
router.get('/:id', AuthMiddleware.isAuthenticated, AuthMiddleware.isOwnerOrAdmin, UserController.getUserById);

// ✏️ Actualizar usuario (solo admin o propietario)
router.put('/:id', AuthMiddleware.isAuthenticated, AuthMiddleware.isOwnerOrAdmin, UserController.updateUser);

// 🗑️ Eliminar usuario (solo admin)
router.delete('/:id', AuthMiddleware.isAuthenticated, AuthMiddleware.isAdmin, UserController.deleteUser);

// 🔄 Cambiar rol de usuario (solo admin)
router.patch('/:id/role', AuthMiddleware.isAuthenticated, AuthMiddleware.isAdmin, UserController.changeUserRole);

export default router;
