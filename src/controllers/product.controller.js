import { throwBadRequest, throwForbidden, throwNotFound } from '../middlewares/error.middleware.js';
import productRepository from '../repositories/product.repository.js';
import { logger } from '../utils/logger.util.js';

/**
 * 🛍️ Controlador de Productos - Actualizado con Repository Pattern
 * Usa Repository y DTOs para arquitectura profesional
 */
class ProductController {
  /**
   * 📋 Obtener todos los productos
   */
  static async getAllProducts(req, res) {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const filters = { page, limit, category, search, sort, order };
    const result = await productRepository.findAll(filters);

    logger.info(
      `📋 Lista de productos solicitada - Página: ${page}, Total: ${result.pagination.total}`
    );

    res.json({
      success: true,
      products: result.products,
      pagination: result.pagination,
    });
  }

  /**
   * 🔍 Obtener producto por ID
   */
  static async getProductById(req, res) {
    const { pid } = req.params;

    const product = await productRepository.findById(pid);
    if (!product) {
      throwNotFound('Producto');
    }

    logger.info(`🔍 Producto consultado: ${product.title} (ID: ${pid})`);

    res.json({
      success: true,
      product,
    });
  }

  /**
   * ➕ Crear nuevo producto
   */
  static async createProduct(req, res) {
    const { title, description, price, stock, category } = req.body;

    // Validar datos requeridos
    ProductController._validateRequiredFields({ title, description, price, stock, category });

    // Determinar propietario
    const owner = ProductController._determineOwner(req.user, req.body.owner);

    const productData = {
      title,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      code: req.body.code || `PROD-${Date.now()}`,
      thumbnails: req.body.thumbnails || [],
      owner,
    };

    const product = await productRepository.create(productData);

    logger.success(`✅ Producto creado: ${product.title} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      product,
    });
  }

  /**
   * ✏️ Actualizar producto
   */
  static async updateProduct(req, res) {
    const { pid } = req.params;
    const updateData = req.body;

    const existingProduct = await productRepository.findById(pid);
    if (!existingProduct) {
      throwNotFound('Producto');
    }

    // Verificar permisos
    if (req.user.role === 'premium' && existingProduct.owner.id !== req.user._id.toString()) {
      throwForbidden('Solo puedes actualizar productos de tu propiedad');
    }

    // Validaciones
    if (updateData.price && updateData.price <= 0) {
      throwBadRequest('El precio debe ser mayor a 0');
    }
    if (updateData.stock && updateData.stock < 0) {
      throwBadRequest('El stock no puede ser negativo');
    }

    // No permitir cambiar el propietario a menos que sea admin
    if (updateData.owner && req.user.role !== 'admin') {
      delete updateData.owner;
    }

    const updatedProduct = await productRepository.update(pid, updateData);

    logger.success(`✏️ Producto actualizado: ${updatedProduct.title} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product: updatedProduct,
    });
  }

  /**
   * 🗑️ Eliminar producto
   */
  static async deleteProduct(req, res) {
    const { pid } = req.params;

    const product = await productRepository.findById(pid);
    if (!product) {
      throwNotFound('Producto');
    }

    // Verificar permisos
    if (req.user.role === 'premium' && product.owner.id !== req.user._id.toString()) {
      throwForbidden('Solo puedes eliminar productos de tu propiedad');
    }

    await productRepository.delete(pid);

    logger.success(`🗑️ Producto eliminado: ${product.title} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
    });
  }

  /**
   * 📊 Obtener productos por propietario (para usuarios premium)
   */
  static async getProductsByOwner(req, res) {
    const ownerId = req.params.ownerId || req.user._id;

    // Solo admin puede ver productos de otros usuarios
    if (req.user.role !== 'admin' && ownerId !== req.user._id.toString()) {
      throwForbidden('Solo puedes ver tus propios productos');
    }

    const products = await productRepository.findByOwner(ownerId);

    logger.info(`📊 Productos consultados para propietario: ${ownerId}`);

    res.json({
      success: true,
      products,
      total: products.length,
    });
  }

  /**
   * 🔧 Métodos privados para reducir complejidad
   */
  static _validateRequiredFields({ title, description, price, stock, category }) {
    if (!title) throwBadRequest('El título es requerido');
    if (!description) throwBadRequest('La descripción es requerida');
    if (!price || price <= 0) throwBadRequest('El precio debe ser mayor a 0');
    if (!stock || stock < 0) throwBadRequest('El stock no puede ser negativo');
    if (!category) throwBadRequest('La categoría es requerida');
  }

  static _determineOwner(user, requestedOwner) {
    if (user.role === 'premium') {
      return user._id;
    }
    if (user.role === 'admin') {
      return requestedOwner || user._id;
    }
    return null;
  }
}

export default ProductController;
