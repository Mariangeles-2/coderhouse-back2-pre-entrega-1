import cartDAO from '../dao/cart.dao.js';
import { CartDTO } from '../dto/index.js';
import { logger } from '../utils/logger.util.js';

/**
 * 🏛️ Repository para Carrito - Implementa patrón Repository
 */
class CartRepository {
  /**
   * Crear un nuevo carrito
   */
  async create(cartData) {
    try {
      const cart = await cartDAO.create(cartData);
      logger.info(`🛒 Carrito creado para usuario: ${cartData.user}`);
      return CartDTO.fromCart(cart);
    } catch (error) {
      logger.error('❌ Error creando carrito:', error);
      throw error;
    }
  }

  /**
   * Buscar carrito por ID
   */
  async findById(id) {
    try {
      const cart = await cartDAO.findById(id);
      return cart ? CartDTO.fromCart(cart) : null;
    } catch (error) {
      logger.error(`❌ Error buscando carrito ${id}:`, error);
      throw error;
    }
  }

  /**
   * Buscar carrito activo por usuario
   */
  async findActiveByUser(userId) {
    try {
      const cart = await cartDAO.findActiveByUser(userId);
      return cart ? CartDTO.fromCart(cart) : null;
    } catch (error) {
      logger.error(`❌ Error buscando carrito activo del usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar carrito
   */
  async update(id, updateData) {
    try {
      const cart = await cartDAO.updateById(id, updateData);
      if (!cart) {
        return null;
      }
      logger.info(`✏️ Carrito actualizado: ${id}`);
      return CartDTO.fromCart(cart);
    } catch (error) {
      logger.error(`❌ Error actualizando carrito ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar carrito
   */
  async delete(id) {
    try {
      const cart = await cartDAO.deleteById(id);
      if (cart) {
        logger.info(`🗑️ Carrito eliminado: ${id}`);
      }
      return cart ? CartDTO.fromCart(cart) : null;
    } catch (error) {
      logger.error(`❌ Error eliminando carrito ${id}:`, error);
      throw error;
    }
  }

  /**
   * Agregar producto al carrito
   */
  async addProduct(cartId, productId, quantity) {
    try {
      const cart = await cartDAO.addProduct(cartId, productId, quantity);
      logger.info(`➕ Producto agregado al carrito ${cartId}`);
      return CartDTO.fromCart(cart);
    } catch (error) {
      logger.error(`❌ Error agregando producto al carrito ${cartId}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar cantidad de producto en carrito
   */
  async updateProductQuantity(cartId, productId, quantity) {
    try {
      const cart = await cartDAO.updateProductQuantity(cartId, productId, quantity);
      logger.info(`✏️ Cantidad actualizada en carrito ${cartId}`);
      return CartDTO.fromCart(cart);
    } catch (error) {
      logger.error(`❌ Error actualizando cantidad en carrito ${cartId}:`, error);
      throw error;
    }
  }

  /**
   * Remover producto del carrito
   */
  async removeProduct(cartId, productId) {
    try {
      const cart = await cartDAO.removeProduct(cartId, productId);
      logger.info(`🗑️ Producto removido del carrito ${cartId}`);
      return CartDTO.fromCart(cart);
    } catch (error) {
      logger.error(`❌ Error removiendo producto del carrito ${cartId}:`, error);
      throw error;
    }
  }

  /**
   * Limpiar productos del carrito
   */
  async clearProducts(cartId) {
    try {
      const cart = await cartDAO.clearProducts(cartId);
      logger.info(`🧹 Carrito limpiado: ${cartId}`);
      return CartDTO.fromCart(cart);
    } catch (error) {
      logger.error(`❌ Error limpiando carrito ${cartId}:`, error);
      throw error;
    }
  }
}

export default new CartRepository();
