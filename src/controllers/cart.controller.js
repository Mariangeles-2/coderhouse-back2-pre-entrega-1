import { isValidObjectId } from 'mongoose';

import cartDAO from '../dao/cart.dao.js';
import { CartDTO } from '../dto/index.js';
import { throwBadRequest, throwForbidden, throwNotFound } from '../middlewares/error.middleware.js';
import productRepository from '../repositories/product.repository.js';
import ticketService from '../services/ticket.service.js';
import { logger } from '../utils/logger.util.js';

// Controlador para todas las operaciones del carrito
// Usa patrón Repository, DAOs y DTOs
class CartController {
  // Obtener o crear carrito del usuario logueado
  static async getCart(req, res) {
    let cart = await cartDAO.findActiveByUser(req.user._id);

    if (!cart) {
      logger.info(`Creando nuevo carrito para: ${req.user.email}`);
      cart = await cartDAO.create({
        user: req.user._id,
        products: [],
      });
    }

    const cartDTO = CartDTO.fromCart(cart);
    logger.info(`Carrito obtenido para: ${req.user.email}`);

    res.json({
      success: true,
      cart: cartDTO,
    });
  }

  // Agregar producto al carrito existente o crear uno nuevo
  static async addToCart(req, res) {
    const { productId, quantity = 1 } = req.body;
    const parsedQuantity = parseInt(quantity);

    // Validar datos de entrada básicos
    CartController._validateAddToCartRequest(productId, parsedQuantity);

    // Buscar producto usando repository
    const product = await productRepository.findById(productId);
    if (!product) {
      throwNotFound('Producto');
    }

    // Verificar permisos de usuario y stock disponible
    CartController._validateProductForCart(req.user, product, parsedQuantity);

    // Obtener carrito activo o crear uno nuevo
    let cart = await cartDAO.findActiveByUser(req.user._id);
    if (!cart) {
      cart = await cartDAO.create({ user: req.user._id, products: [] });
    }

    // Verificar si producto ya está en el carrito
    const existingProduct = cart.products.find((item) => item.product.toString() === productId);

    if (existingProduct) {
      // Sumar cantidad al producto existente
      await cartDAO.updateProductQuantity(
        cart._id,
        productId,
        existingProduct.quantity + parsedQuantity
      );
    } else {
      // Agregar producto nuevo al carrito
      await cartDAO.addProduct(cart._id, productId, parsedQuantity);
    }

    // Traer carrito actualizado y convertir a DTO
    const updatedCart = await cartDAO.findById(cart._id);
    const cartDTO = CartDTO.fromCart(updatedCart);

    logger.success(
      `Producto agregado al carrito: ${product.title} (${parsedQuantity}) por ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'Producto agregado al carrito exitosamente',
      cart: cartDTO,
    });
  }

  // Cambiar cantidad de un producto específico en el carrito
  static async updateProductQuantity(req, res) {
    const { pid } = req.params;
    const { quantity } = req.body;
    const parsedQuantity = parseInt(quantity);

    if (parsedQuantity <= 0) {
      throwBadRequest('La cantidad debe ser mayor a 0');
    }

    const cart = await cartDAO.findActiveByUser(req.user._id);
    if (!cart) {
      throwNotFound('Carrito');
    }

    const productInCart = cart.products.find((item) => item.product.toString() === pid);
    if (!productInCart) {
      throwNotFound('Producto en el carrito');
    }

    // Verificar que hay suficiente stock
    const product = await productRepository.findById(pid);
    if (!product) {
      throwNotFound('Producto');
    }

    if (product.stock < parsedQuantity) {
      throwBadRequest(
        `Stock insuficiente para ${product.title}. Solicitado: ${parsedQuantity}, Disponible: ${product.stock}`
      );
    }

    // Actualizar cantidad en BD
    const updatedCart = await cartDAO.updateProductQuantity(cart._id, pid, parsedQuantity);
    const cartDTO = CartDTO.fromCart(updatedCart);

    logger.success(
      `Cantidad actualizada en carrito: ${product.title} → ${parsedQuantity} por ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'Cantidad actualizada exitosamente',
      cart: cartDTO,
    });
  }

  // Eliminar un producto completo del carrito
  static async removeFromCart(req, res) {
    const { pid } = req.params;

    const cart = await cartDAO.findActiveByUser(req.user._id);
    if (!cart) {
      throwNotFound('Carrito');
    }

    const productInCart = cart.products.find((item) => item.product.toString() === pid);
    if (!productInCart) {
      throwNotFound('Producto en el carrito');
    }

    // Remover producto completamente del carrito
    const updatedCart = await cartDAO.removeProduct(cart._id, pid);
    const cartDTO = CartDTO.fromCart(updatedCart);

    logger.success(`Producto eliminado del carrito: ${pid} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Producto eliminado del carrito exitosamente',
      cart: cartDTO,
    });
  }

  // Vaciar carrito completo (no eliminar el carrito, solo los productos)
  static async clearCart(req, res) {
    const cart = await cartDAO.findActiveByUser(req.user._id);
    if (!cart) {
      throwNotFound('Carrito');
    }

    const clearedCart = await cartDAO.clearProducts(cart._id);
    const cartDTO = CartDTO.fromCart(clearedCart);

    logger.success(`Carrito limpiado por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Carrito limpiado exitosamente',
      cart: cartDTO,
    });
  }

  // Finalizar compra - genera ticket y actualiza stock
  static async purchaseCart(req, res) {
    try {
      const purchaseResult = await ticketService.processPurchase(req.user._id, req.user.email);

      if (!purchaseResult.ticket) {
        throwBadRequest(
          'No se pudo procesar la compra. Verifica que tengas productos en el carrito con stock disponible.'
        );
      }

      logger.success(
        `Compra procesada: ${purchaseResult.ticket.code} por ${req.user.email} - Total: $${purchaseResult.total}`
      );

      res.json({
        success: true,
        message: purchaseResult.message,
        ticket: purchaseResult.ticket,
        failedProducts:
          purchaseResult.failedProducts.length > 0 ? purchaseResult.failedProducts : undefined,
      });
    } catch (error) {
      logger.error('Error procesando compra:', error);
      throw error;
    }
  }

  // Métodos de validación privados
  static _validateAddToCartRequest(productId, quantity) {
    if (!productId) {
      throwBadRequest('El ID del producto es requerido');
    }
    if (!isValidObjectId(productId)) {
      throwNotFound('Producto');
    }
    if (quantity <= 0) {
      throwBadRequest('La cantidad debe ser mayor a 0');
    }
  }

  static _validateProductForCart(user, product, quantity) {
    // Usuarios premium no pueden agregar sus propios productos
    if (user.role === 'premium' && product.owner && product.owner.id === user._id.toString()) {
      throwForbidden('No puedes agregar tu propio producto al carrito');
    }

    // Verificar que hay stock suficiente
    if (product.stock < quantity) {
      throwBadRequest(
        `Stock insuficiente para ${product.title}. Solicitado: ${quantity}, Disponible: ${product.stock}`
      );
    }
  }
}

export default CartController;
