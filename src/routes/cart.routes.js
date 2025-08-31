import express from 'express';
import CartController from '../controllers/cart.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * 🛒 Rutas de Carritos
 */

// 🛒 Obtener carrito del usuario autenticado
router.get('/', AuthMiddleware.isAuthenticated, CartController.getCart);

// ➕ Agregar producto al carrito
router.post('/add', AuthMiddleware.isAuthenticated, CartController.addToCart);

// ✏️ Actualizar cantidad de productos en carrito
router.put('/products/:productId', AuthMiddleware.isAuthenticated, CartController.updateCartItem);

// 🗑️ Eliminar producto del carrito
router.delete('/products/:productId', AuthMiddleware.isAuthenticated, CartController.removeFromCart);

// 🧹 Limpiar carrito completo
router.delete('/clear', AuthMiddleware.isAuthenticated, CartController.clearCart);

export default router;
