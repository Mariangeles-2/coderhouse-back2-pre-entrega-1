import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', AuthMiddleware.isNotAuthenticated, AuthController.register);
router.post('/login', AuthMiddleware.isNotAuthenticated, AuthController.login);
router.post('/logout', AuthMiddleware.isAuthenticated, AuthController.logout);
router.get('/profile', AuthMiddleware.isAuthenticated, AuthController.getProfile);
router.get('/check', AuthController.checkAuth);

export default router;
