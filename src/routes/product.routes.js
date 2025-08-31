import express from 'express';
import ProductController from '../controllers/product.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * 🛍️ Rutas de Productos
 */

// 📋 Obtener todos los productos (público)
router.get('/', ProductController.getAllProducts);

// 🛍️ Obtener producto por ID (público)
router.get('/:id', ProductController.getProductById);

// ➕ Crear nuevo producto (solo premium y admin)
router.post('/', AuthMiddleware.isAuthenticated, AuthMiddleware.isPremiumOrAdmin, ProductController.createProduct);

// ✏️ Actualizar producto (solo propietario o admin)
router.put('/:id', AuthMiddleware.isAuthenticated, AuthMiddleware.isProductOwnerOrAdmin, ProductController.updateProduct);

// 🗑️ Eliminar producto (solo propietario o admin)
router.delete('/:id', AuthMiddleware.isAuthenticated, AuthMiddleware.isProductOwnerOrAdmin, ProductController.deleteProduct);

export default router;
