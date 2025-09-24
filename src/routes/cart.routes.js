import { Router } from 'express';

import CartController from '../controllers/cart.controller.js';
import { authRules } from '../middlewares/auth.middleware.js';
import { authenticateJWT } from '../middlewares/jwt.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  addToCartValidation,
  updateQuantityValidation,
} from '../validations/product.validation.js';

const router = Router();

// Rutas de carritos - Solo para usuarios (no admins)
// Solo usuarios pueden agregar productos a su carrito

// Aplicar middleware JWT para detectar usuarios autenticados
router.use(authenticateJWT);

// Aplicar reglas específicas de carritos a todas las rutas
router.use(authRules.carts); // Solo usuarios autenticados (no admins)

// OPERACIONES DE CARRITO
// GET / - Obtener carrito del usuario
router.get('/', CartController.getCart);

// POST /product - Agregar producto al carrito
router.post('/product', validateRequest(addToCartValidation), CartController.addToCart);

// PUT /product/:pid - Actualizar cantidad de producto en carrito
router.put(
  '/product/:pid',
  validateRequest(updateQuantityValidation),
  CartController.updateProductQuantity
);

// DELETE /product/:pid - Eliminar producto del carrito
router.delete('/product/:pid', CartController.removeFromCart);

// DELETE / - Limpiar carrito completo
router.delete('/', CartController.clearCart);

// POST /purchase - Procesar compra (genera ticket)
router.post('/purchase', CartController.purchaseCart);

export default router;
