import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import {logger} from '../utils/logger.util.js';

/**
 * 🛒 Controlador de Carritos
 * Maneja todas las operaciones del carrito de compras
 */
class CartController {
  /**
   * 🛒 Obtener carrito del usuario
   */
  static async getCart(req, res) {
    try {
      const cart = await Cart.findOne({ user: req.user._id, status: 'active' })
        .populate('products.product', 'title price thumbnail stock')
        .populate('user', 'first_name last_name email');

      if (!cart) {
        logger.info(`🛒 Creando nuevo carrito para: ${req.user.email}`);
        const newCart = new Cart({
          user: req.user._id,
          products: [],
        });
        await newCart.save();

        return res.json({
          success: true,
          cart: newCart,
        });
      }

      logger.info(`🛒 Carrito obtenido para: ${req.user.email}`);
      res.json({
        success: true,
        cart,
      });
    } catch (error) {
      logger.error('❌ Error al obtener carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener carrito',
      });
    }
  }

  /**
   * ➕ Agregar producto al carrito
   */
  static async addToCart(req, res) {
    try {
      const { productId, quantity = 1 } = req.body;
      const parsedQuantity = parseInt(quantity);

      // Verificar que el producto existe
      const product = await Product.findById(productId);
      if (!product) {
        logger.warning(`⚠️ Producto no encontrado: ${productId}`);
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado',
        });
      }

      // Verificar stock disponible
      if (!product.hasStock(parsedQuantity)) {
        logger.warning(`⚠️ Stock insuficiente para producto: ${product.title}`);
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente',
        });
      }

      // Obtener o crear carrito
      let cart = await Cart.findOne({ user: req.user._id, status: 'active' });
      if (!cart) {
        cart = new Cart({
          user: req.user._id,
          products: [],
        });
      }

      // Verificar si el producto ya está en el carrito
      const existingProduct = cart.products.find(
        (item) => item.product.toString() === productId
      );

      if (existingProduct) {
        const newQuantity = existingProduct.quantity + parsedQuantity;

        if (!product.hasStock(newQuantity)) {
          logger.warning(`⚠️ Stock insuficiente para cantidad total: ${newQuantity}`);
          return res.status(400).json({
            success: false,
            message: 'Stock insuficiente para la cantidad solicitada',
          });
        }

        existingProduct.quantity = newQuantity;
        existingProduct.price = product.price;
      } else {
        cart.products.push({
          product: productId,
          quantity: parsedQuantity,
          price: product.price,
        });
      }

      await cart.save();
      await cart.populate('products.product', 'title price thumbnail stock');

      logger.success(`✅ Producto agregado al carrito: ${product.title} por ${req.user.email}`);
      res.json({
        success: true,
        message: 'Producto agregado al carrito',
        cart,
      });
    } catch (error) {
      logger.error('❌ Error al agregar al carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error al agregar producto al carrito',
      });
    }
  }

  /**
   * ✏️ Actualizar cantidad de productos en carrito
   */
  static async updateCartItem(req, res) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const parsedQuantity = parseInt(quantity);

      if (parsedQuantity <= 0) {
        return CartController.removeFromCart(req, res);
      }

      const cart = await Cart.findOne({ user: req.user._id, status: 'active' });
      if (!cart) {
        logger.warning(`⚠️ Carrito no encontrado para: ${req.user.email}`);
        return res.status(404).json({
          success: false,
          message: 'Carrito no encontrado',
        });
      }

      const cartItem = cart.products.find(
        (item) => item.product.toString() === productId
      );

      if (!cartItem) {
        logger.warning(`⚠️ Producto no encontrado en carrito: ${productId}`);
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado en el carrito',
        });
      }

      // Verificar stock disponible
      const product = await Product.findById(productId);
      if (!product.hasStock(parsedQuantity)) {
        logger.warning(`⚠️ Stock insuficiente: ${product.title}`);
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente',
        });
      }

      cartItem.quantity = parsedQuantity;
      cartItem.price = product.price;

      await cart.save();
      await cart.populate('products.product', 'title price thumbnail stock');

      logger.success(`✅ Cantidad actualizada en carrito: ${product.title}`);
      res.json({
        success: true,
        message: 'Cantidad actualizada',
        cart,
      });
    } catch (error) {
      logger.error('❌ Error al actualizar carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar carrito',
      });
    }
  }

  /**
   * 🗑️ Eliminar producto del carrito
   */
  static async removeFromCart(req, res) {
    try {
      const { productId } = req.params;

      const cart = await Cart.findOne({ user: req.user._id, status: 'active' });
      if (!cart) {
        logger.warning(`⚠️ Carrito no encontrado para: ${req.user.email}`);
        return res.status(404).json({
          success: false,
          message: 'Carrito no encontrado',
        });
      }

      const productIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId
      );

      if (productIndex === -1) {
        logger.warning(`⚠️ Producto no encontrado en carrito: ${productId}`);
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado en el carrito',
        });
      }

      cart.products.splice(productIndex, 1);
      await cart.save();
      await cart.populate('products.product', 'title price thumbnail stock');

      logger.success(`🗑️ Producto eliminado del carrito por: ${req.user.email}`);
      res.json({
        success: true,
        message: 'Producto eliminado del carrito',
        cart,
      });
    } catch (error) {
      logger.error('❌ Error al eliminar del carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar producto del carrito',
      });
    }
  }

  /**
   * 🧹 Limpiar carrito completo
   */
  static async clearCart(req, res) {
    try {
      const cart = await Cart.findOne({ user: req.user._id, status: 'active' });
      if (!cart) {
        logger.warning(`⚠️ Carrito no encontrado para: ${req.user.email}`);
        return res.status(404).json({
          success: false,
          message: 'Carrito no encontrado',
        });
      }

      cart.products = [];
      await cart.save();

      logger.success(`🧹 Carrito limpiado por: ${req.user.email}`);
      res.json({
        success: true,
        message: 'Carrito limpiado exitosamente',
        cart,
      });
    } catch (error) {
      logger.error('❌ Error al limpiar carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error al limpiar carrito',
      });
    }
  }
}

export default CartController;
