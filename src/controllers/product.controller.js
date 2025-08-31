import Product from '../models/Product.model.js';
import {logger} from '../utils/logger.util.js';

/**
 * 🛍️ Controlador de Productos
 */
class ProductController {
  /**
   * 📋 Obtener todos los productos
   */
  static async getAllProducts(req, res) {
    try {
      const { page = 1, limit = 10, category, search, sort = 'createdAt' } = req.query;

      // Construir query de filtros
      const query = { status: true };
      if (category) query.category = category;
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
    } catch (error) {
      logger.error('❌ Error al obtener productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos',
      });
    }
  }

  /**
   * 🛍️ Obtener producto por ID
   */
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id).populate('owner', 'first_name last_name email');

      if (!product) {
        logger.warning(`⚠️ Producto no encontrado: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado',
        });
      }

      logger.info(`🛍️ Producto obtenido: ${product.title}`);
      res.json({
        success: true,
        product,
      });
    } catch (error) {
      logger.error('❌ Error al obtener producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener producto',
      });
    }
  }

  /**
   * ➕ Crear nuevo producto
   */
  static async createProduct(req, res) {
    try {
      const { title, description, price, thumbnail, code, stock, category } = req.body;

      const productData = {
        title,
        description,
        price: parseFloat(price),
        thumbnail,
        code: code.toUpperCase(),
        stock: parseInt(stock),
        category,
        owner: req.user._id,
      };

      const product = new Product(productData);
      await product.save();

      await product.populate('owner', 'first_name last_name email');

      logger.success(`✅ Producto creado: ${product.title} por ${req.user.email}`);
      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        product,
      });
    } catch (error) {
      if (error.code === 11000) {
        logger.warning(`⚠️ Código de producto duplicado: ${req.body.code}`);
        return res.status(400).json({
          success: false,
          message: 'El código del producto ya existe',
        });
      }

      logger.error('❌ Error al crear producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear producto',
      });
    }
  }

  /**
   * ✏️ Actualizar producto
   */
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { title, description, price, thumbnail, stock, category, status } = req.body;

      // El producto ya fue validado por el middleware isProductOwnerOrAdmin
      const product = req.product;

      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (price) updateData.price = parseFloat(price);
      if (thumbnail) updateData.thumbnail = thumbnail;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (category) updateData.category = category;
      // Solo admin puede cambiar status
      if (req.user.role === 'admin' && status !== undefined) updateData.status = status;

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('owner', 'first_name last_name email');

      logger.success(`✅ Producto actualizado: ${updatedProduct.title} por ${req.user.email}`);
      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        product: updatedProduct,
      });
    } catch (error) {
      logger.error('❌ Error al actualizar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar producto',
      });
    }
  }

  /**
   * 🗑️ Eliminar producto
   */
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      // El producto ya fue validado por el middleware isProductOwnerOrAdmin
      const product = req.product;

      await Product.findByIdAndDelete(id);

      logger.success(`🗑️ Producto eliminado: ${product.title} por ${req.user.email}`);
      res.json({
        success: true,
        message: 'Producto eliminado exitosamente',
      });
    } catch (error) {
      logger.error('❌ Error al eliminar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar producto',
      });
    }
  }
}

export default ProductController;
