import cartDAO from '../dao/cart.dao.js';
import Ticket from '../models/Ticket.model.js';
import productRepository from '../repositories/product.repository.js';
import { logger } from '../utils/logger.util.js';

/**
 * 🎫 Servicio de Tickets para lógica de compra robusta
 * Maneja la creación de tickets, verificación de stock y compras completas/incompletas
 */
class TicketService {
  /**
   * Procesar compra completa del carrito
   */
  async processPurchase(userId, userEmail) {
    try {
      logger.info(`🛒 Iniciando proceso de compra para usuario: ${userEmail}`);

      // Obtener carrito activo
      const cart = await cartDAO.findActiveByUser(userId);
      if (!cart || cart.products.length === 0) {
        throw new Error('El carrito está vacío o no existe');
      }

      // Procesar stock y generar resultados
      const stockResults = await productRepository.processStockForPurchase(cart.products);

      // Crear ticket solo si hay productos exitosos
      let ticket = null;
      if (stockResults.successful.length > 0) {
        ticket = await this.createTicket({
          userId,
          userEmail,
          successfulProducts: stockResults.successful,
          failedProducts: stockResults.failed,
          total: stockResults.total,
        });

        // Actualizar carrito removiendo productos comprados exitosamente
        await this._updateCartAfterPurchase(cart._id, stockResults.successful);

        logger.success(`✅ Compra procesada exitosamente. Ticket: ${ticket.code}`);
      }

      return {
        ticket,
        successfulProducts: stockResults.successful,
        failedProducts: stockResults.failed,
        total: stockResults.total,
        message: this._generatePurchaseMessage(stockResults),
      };
    } catch (error) {
      logger.error('❌ Error procesando compra:', error);
      throw error;
    }
  }

  /**
   * Crear ticket de compra
   */
  async createTicket({
    userId,
    userEmail,
    successfulProducts,
    failedProducts,
    total,
    shippingInfo = {},
    paymentMethod = 'credit_card',
  }) {
    try {
      const ticketData = {
        code: Ticket.generateCode(),
        purchaser: userEmail,
        user: userId,
        amount: total,
        products: successfulProducts.map((item) => ({
          product: item.product._id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        failedProducts,
        paymentInfo: {
          method: paymentMethod,
          status: 'approved',
          transactionId: `TXN-${Date.now()}`,
        },
        shippingInfo,
        status: 'completed',
      };

      const ticket = new Ticket(ticketData);

      // Calcular totales automáticamente
      ticket.calculateTotals();

      await ticket.save();

      logger.success(`🎫 Ticket creado: ${ticket.code} por ${userEmail}`);
      return ticket;
    } catch (error) {
      logger.error('❌ Error creando ticket:', error);
      throw error;
    }
  }

  /**
   * Buscar ticket por código
   */
  async findByCode(code) {
    try {
      return await Ticket.findOne({ code })
        .populate('user', 'first_name last_name email')
        .populate('products.product', 'title price category');
    } catch (error) {
      logger.error(`❌ Error buscando ticket ${code}:`, error);
      throw error;
    }
  }

  /**
   * Buscar tickets por usuario
   */
  async findByUser(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const tickets = await Ticket.find({ user: userId })
        .populate('products.product', 'title price category')
        .sort({ purchase_datetime: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Ticket.countDocuments({ user: userId });

      return {
        tickets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      };
    } catch (error) {
      logger.error(`❌ Error buscando tickets del usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar estado del ticket
   */
  async updateStatus(ticketId, newStatus) {
    try {
      const ticket = await Ticket.findByIdAndUpdate(ticketId, { status: newStatus }, { new: true });

      if (ticket) {
        logger.info(`📝 Estado de ticket actualizado: ${ticket.code} -> ${newStatus}`);
      }

      return ticket;
    } catch (error) {
      logger.error(`❌ Error actualizando estado del ticket ${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de ventas
   */
  async getSalesStats(startDate, endDate) {
    try {
      const match = {
        status: 'completed',
        purchase_datetime: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
          $lte: endDate || new Date(),
        },
      };

      const stats = await Ticket.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$amount' },
            totalTickets: { $sum: 1 },
            averageTicket: { $avg: '$amount' },
            totalProducts: { $sum: { $size: '$products' } },
          },
        },
      ]);

      return (
        stats[0] || {
          totalSales: 0,
          totalTickets: 0,
          averageTicket: 0,
          totalProducts: 0,
        }
      );
    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas de ventas:', error);
      throw error;
    }
  }

  /**
   * Métodos privados
   */
  async _updateCartAfterPurchase(cartId, successfulProducts) {
    try {
      // Remover productos comprados exitosamente del carrito en paralelo
      const removePromises = successfulProducts.map((item) =>
        cartDAO.removeProduct(cartId, item.product._id)
      );

      await Promise.all(removePromises);
    } catch (error) {
      logger.error('❌ Error actualizando carrito después de compra:', error);
      // No lanzar error para no interrumpir el proceso de compra
    }
  }

  _generatePurchaseMessage(stockResults) {
    const { successful, failed } = stockResults;

    if (failed.length === 0) {
      return 'Compra procesada exitosamente. Todos los productos fueron adquiridos.';
    }

    if (successful.length === 0) {
      return 'No se pudo procesar la compra. Ningún producto tiene stock suficiente.';
    }

    return `Compra procesada parcialmente. ${successful.length} productos adquiridos, ${failed.length} productos sin stock suficiente.`;
  }
}

export default new TicketService();
