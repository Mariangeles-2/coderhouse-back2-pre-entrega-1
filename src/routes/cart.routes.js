import express from 'express';
import CartController from '../controllers/cart.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', AuthMiddleware.isAuthenticated, CartController.getCart);
router.post(
  '/add',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.cannotAddOwnProduct,
  CartController.addToCart
);
router.put('/products/:pid', AuthMiddleware.isAuthenticated, CartController.updateProductQuantity);
router.delete('/products/:pid', AuthMiddleware.isAuthenticated, CartController.removeFromCart);
router.delete('/clear', AuthMiddleware.isAuthenticated, CartController.clearCart);
router.post('/purchase', AuthMiddleware.isAuthenticated, CartController.purchaseCart);

export default router;
