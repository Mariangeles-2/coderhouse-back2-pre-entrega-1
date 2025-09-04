import express from 'express';
import ProductController from '../controllers/product.controller.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', ProductController.getAllProducts);
router.get('/:pid', ProductController.getProductById);
router.post('/', AuthMiddleware.isAuthenticated, ProductController.createProduct);
router.put(
  '/:pid',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdminOrOwner,
  ProductController.updateProduct
);
router.delete(
  '/:pid',
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.isAdminOrOwner,
  ProductController.deleteProduct
);
router.get(
  '/owner/:ownerId?',
  AuthMiddleware.isAuthenticated,
  ProductController.getProductsByOwner
);

export default router;
