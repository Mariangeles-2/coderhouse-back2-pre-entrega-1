import express from 'express';
import UserController from '../controllers/user.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', AuthMiddleware.isAuthenticated, AuthMiddleware.isAdmin, UserController.getAllUsers);
router.get(
  '/stats',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdmin,
  UserController.getUserStats
);
router.get('/:id', AuthMiddleware.isAuthenticated, UserController.getUserById);
router.put('/:id', AuthMiddleware.isAuthenticated, UserController.updateProfile);
router.delete(
  '/:id',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdmin,
  UserController.deleteUser
);
router.patch(
  '/:id/role',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdmin,
  UserController.changeUserRole
);

export default router;
