import Product from '../models/Product.model.js';
import { logger } from '../utils/logger.util.js';
import { throwBadRequest, throwForbidden, throwNotFound } from '../middlewares/error.middleware.js';

/**
 * 🛍️ Controlador de Productos - Versión Simplificada
 * Usando express-async-errors + http-errors (librerías estándar)
 */
class ProductController {
  /**
   * 📋 Obtener todos los productos
   * ¡No más try-catch! express-async-errors lo maneja automáticamente
   */
  static async getAllProducts(req, res) {
    const { page = 1, limit = 10, category, search, sort = 'createdAt' } = req.query;

    // Construir query de filtros
    const query = { status: true };
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sort] = req.query.order === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('owner', 'first_name last_name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    const total = await Product.countDocuments(query);

    logger.info(`📋 Lista de productos solicitada - Página: ${page}, Total: ${total}`);

    res.json({
      success: true,
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  }

  /**
   * 🔍 Obtener producto por ID
   * Mucho más simple que antes!
   */
  static async getProductById(req, res) {
    const { pid } = req.params;

    const product = await Product.findById(pid).populate('owner', 'first_name last_name email');

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

    // Validaciones simples
    if (!title) {
      throwBadRequest('El título es requerido');
    }
    if (!description) {
      throwBadRequest('La descripción es requerida');
    }
    if (!price || price <= 0) {
      throwBadRequest('El precio debe ser mayor a 0');
    }
    if (!stock || stock < 0) {
      throwBadRequest('El stock no puede ser negativo');
    }
    if (!category) {
      throwBadRequest('La categoría es requerida');
    }

    // Determinar propietario
    let owner = null;
    if (req.user.role === 'premium') {
      owner = req.user._id;
    } else if (req.user.role === 'admin') {
      owner = req.body.owner || req.user._id;
    }

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

    const product = await Product.create(productData);
    await product.populate('owner', 'first_name last_name email');

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

    const product = await Product.findById(pid);
    if (!product) {
      throwNotFound('Producto');
    }

    // Verificar permisos
    if (req.user.role === 'premium' && product.owner.toString() !== req.user._id.toString()) {
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

    const updatedProduct = await Product.findByIdAndUpdate(pid, updateData, {
      new: true,
      runValidators: true,
    }).populate('owner', 'first_name last_name email');

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

    const product = await Product.findById(pid);
    if (!product) {
      throwNotFound('Producto');
    }

    // Verificar permisos
    if (req.user.role === 'premium' && product.owner.toString() !== req.user._id.toString()) {
      throwForbidden('Solo puedes eliminar productos de tu propiedad');
    }

    await Product.findByIdAndDelete(pid);

    logger.success(`🗑️ Producto eliminado: ${product.title} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
    });
  }

  /**
   * 📊 Obtener productos por propietario
   */
  static async getProductsByOwner(req, res) {
    const ownerId = req.params.ownerId || req.user._id;

    // Solo admin puede ver productos de otros usuarios
    if (req.user.role !== 'admin' && ownerId !== req.user._id.toString()) {
      throwForbidden('Solo puedes ver tus propios productos');
    }

    const products = await Product.find({ owner: ownerId })
      .populate('owner', 'first_name last_name email')
      .sort({ createdAt: -1 });

    logger.info(`📊 Productos consultados para propietario: ${ownerId}`);

    res.json({
      success: true,
      products,
      total: products.length,
    });
  }
}

export default ProductController;
