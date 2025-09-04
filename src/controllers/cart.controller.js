import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import { logger } from '../utils/logger.util.js';
import { throwBadRequest, throwForbidden, throwNotFound } from '../middlewares/error.middleware.js';

/**
 * 🛒 Controlador de Carritos - Versión Simplificada
 * Usando express-async-errors + http-errors (librerías estándar)
 */
class CartController {
  /**
   * 🛒 Obtener carrito del usuario
   */
  static async getCart(req, res) {
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
  }

  /**
   * ➕ Agregar producto al carrito
   */
  static async addToCart(req, res) {
    const { productId, quantity = 1 } = req.body;
    const parsedQuantity = parseInt(quantity);

    // Validaciones básicas
    if (!productId) {
      throwBadRequest('El ID del producto es requerido');
    }
    if (parsedQuantity <= 0) {
      throwBadRequest('La cantidad debe ser mayor a 0');
    }

    // Verificar que el producto existe
    const product = await Product.findById(productId);
    if (!product) {
      throwNotFound('Producto');
    }

    // Verificar que el usuario no sea propietario del producto (solo para premium)
    if (req.user.role === 'premium' && product.owner.toString() === req.user._id.toString()) {
      throwForbidden('No puedes agregar tu propio producto al carrito');
    }

    // Verificar stock disponible
    if (product.stock < parsedQuantity) {
      throwBadRequest(
        `Stock insuficiente para ${product.title}. Solicitado: ${parsedQuantity}, Disponible: ${product.stock}`
      );
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
    const existingProduct = cart.products.find((item) => item.product.toString() === productId);

    if (existingProduct) {
      const newQuantity = existingProduct.quantity + parsedQuantity;
      if (newQuantity > product.stock) {
        throwBadRequest(
          `Stock insuficiente para ${product.title}. Solicitado: ${newQuantity}, Disponible: ${product.stock}`
        );
      }
      existingProduct.quantity = newQuantity;
    } else {
      cart.products.push({
        product: productId,
        quantity: parsedQuantity,
      });
    }

    await cart.save();
    await cart.populate('products.product', 'title price thumbnail stock');

    logger.success(
      `✅ Producto agregado al carrito: ${product.title} x${parsedQuantity} por ${req.user.email}`
    );

    res.status(201).json({
      success: true,
      message: 'Producto agregado al carrito exitosamente',
      cart,
    });
  }

  /**
   * ✏️ Actualizar cantidad de producto en carrito
   */
  static async updateProductQuantity(req, res) {
    const { pid } = req.params;
    const { quantity } = req.body;
    const parsedQuantity = parseInt(quantity);

    if (parsedQuantity <= 0) {
      throwBadRequest('La cantidad debe ser mayor a 0');
    }

    const cart = await Cart.findOne({ user: req.user._id, status: 'active' });
    if (!cart) {
      throwNotFound('Carrito');
    }

    const productInCart = cart.products.find((item) => item.product.toString() === pid);

    if (!productInCart) {
      throwNotFound('Producto en el carrito');
    }

    // Verificar stock disponible
    const product = await Product.findById(pid);
    if (!product) {
      throwNotFound('Producto');
    }

    if (product.stock < parsedQuantity) {
      throwBadRequest(
        `Stock insuficiente para ${product.title}. Solicitado: ${parsedQuantity}, Disponible: ${product.stock}`
      );
    }

    productInCart.quantity = parsedQuantity;
    await cart.save();
    await cart.populate('products.product', 'title price thumbnail stock');

    logger.success(
      `✏️ Cantidad actualizada en carrito: ${product.title} → ${parsedQuantity} por ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'Cantidad actualizada exitosamente',
      cart,
    });
  }

  /**
   * 🗑️ Eliminar producto del carrito
   */
  static async removeFromCart(req, res) {
    const { pid } = req.params;

    const cart = await Cart.findOne({ user: req.user._id, status: 'active' });
    if (!cart) {
      throwNotFound('Carrito');
    }

    const productIndex = cart.products.findIndex((item) => item.product.toString() === pid);

    if (productIndex === -1) {
      throwNotFound('Producto en el carrito');
    }

    cart.products.splice(productIndex, 1);
    await cart.save();
    await cart.populate('products.product', 'title price thumbnail stock');

    logger.success(`🗑️ Producto eliminado del carrito: ${pid} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Producto eliminado del carrito exitosamente',
      cart,
    });
  }

  /**
   * 🧹 Limpiar carrito
   */
  static async clearCart(req, res) {
    const cart = await Cart.findOne({ user: req.user._id, status: 'active' });
    if (!cart) {
      throwNotFound('Carrito');
    }

    cart.products = [];
    await cart.save();

    logger.success(`🧹 Carrito limpiado por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Carrito limpiado exitosamente',
      cart,
    });
  }

  /**
   * 💳 Procesar compra (purchase)
   */
  static async purchaseCart(req, res) {
    const cart = await Cart.findOne({ user: req.user._id, status: 'active' }).populate(
      'products.product'
    );

    if (!cart || cart.products.length === 0) {
      throwBadRequest('El carrito está vacío');
    }

    const productsToProcess = [];
    const failedProducts = [];
    let total = 0;

    // Verificar stock y calcular total
    for (const item of cart.products) {
      const product = item.product;

      if (product.stock >= item.quantity) {
        productsToProcess.push(item);
        total += product.price * item.quantity;
      } else {
        failedProducts.push({
          product: product.title,
          requested: item.quantity,
          available: product.stock,
        });
      }
    }

    if (productsToProcess.length === 0) {
      throwBadRequest('Ningún producto tiene stock suficiente para procesar la compra');
    }

    // Actualizar stock de productos exitosos
    for (const item of productsToProcess) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    // Actualizar carrito con productos fallidos
    cart.products = cart.products.filter((item) =>
      failedProducts.some((failed) => failed.product === item.product.title)
    );
    await cart.save();

    // Crear ticket de compra (simulado)
    const ticket = {
      code: `TICKET-${Date.now()}`,
      purchase_datetime: new Date(),
      amount: total,
      purchaser: req.user.email,
      products: productsToProcess.map((item) => ({
        product: item.product.title,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
      })),
    };

    logger.success(`💳 Compra procesada: ${ticket.code} por ${req.user.email} - Total: $${total}`);

    res.json({
      success: true,
      message: 'Compra procesada exitosamente',
      ticket,
      failedProducts: failedProducts.length > 0 ? failedProducts : undefined,
    });
  }
}

export default CartController;
