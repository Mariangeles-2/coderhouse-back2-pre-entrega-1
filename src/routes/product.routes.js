import { Router } from 'express';

import ProductController from '../controllers/product.controller.js';
import { authRules } from '../middlewares/auth.middleware.js';
import { authenticateJWT } from '../middlewares/jwt.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  createProductValidation,
  updateProductValidation,
} from '../validations/product.validation.js';

const router = Router();

/**
 * 🛍️ Rutas de Productos - Con autorización basada en roles
 * Solo administradores pueden crear, actualizar y eliminar productos
 */

// ========================================
// 📖 RUTAS PÚBLICAS (lectura)
// ========================================

/**
 * GET / - Obtener todos los productos (público)
 */
router.get('/', ProductController.getAllProducts);

/**
 * GET /:pid - Obtener producto por ID (público)
 */
router.get('/:pid', ProductController.getProductById);

// ========================================
// 🔐 RUTAS RESTRINGIDAS (admin y premium)
// ========================================

/**
 * POST / - Crear producto (admin y premium)
 */
router.post(
  '/',
  authenticateJWT,
  authRules.products.modify, // ✅ Usa el nuevo middleware que permite admin y premium
  validateRequest(createProductValidation),
  ProductController.createProduct
);

/**
 * PUT /:pid - Actualizar producto (admin y premium con ownership)
 */
router.put(
  '/:pid',
  authenticateJWT,
  authRules.products.modify, // ✅ Usa el nuevo middleware
  authRules.ownership('product'), // ✅ Premium solo sus productos, admin cualquiera
  validateRequest(updateProductValidation),
  ProductController.updateProduct
);

/**
 * DELETE /:pid - Eliminar producto (admin y premium con ownership)
 */
router.delete(
  '/:pid',
  authenticateJWT,
  authRules.products.modify, // ✅ Usa el nuevo middleware
  authRules.ownership('product'), // ✅ Premium solo sus productos, admin cualquiera
  ProductController.deleteProduct
);

// ========================================
// 👤 RUTAS ESPECÍFICAS DE USUARIO
// ========================================

/**
 * GET /owner/:ownerId - Obtener productos por propietario
 * Admin: puede ver cualquier propietario
 * Premium: solo puede ver sus propios productos
 */
router.get(
  '/owner/:ownerId?',
  authRules.adminOrPremium, // Admin o premium
  ProductController.getProductsByOwner
);

export default router;
