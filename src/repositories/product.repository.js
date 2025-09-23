import productDAO from '../dao/product.dao.js';
import { ProductDTO } from '../dto/index.js';
import { logger } from '../utils/logger.util.js';

/**
 * 🏛️ Repository para Producto - Implementa patrón Repository
 */
class ProductRepository {
  /**
   * Crear un nuevo producto
   */
  async create(productData) {
    try {
      const product = await productDAO.create(productData);
      logger.info(`🛍️ Producto creado: ${product.title}`);
      return ProductDTO.fromProduct(product);
    } catch (error) {
      logger.error('❌ Error creando producto:', error);
      throw error;
    }
  }

  /**
   * Buscar producto por ID
   */
  async findById(id) {
    try {
      const product = await productDAO.findById(id);
      return product ? ProductDTO.fromProduct(product) : null;
    } catch (error) {
      logger.error(`❌ Error buscando producto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Buscar todos los productos con filtros
   */
  async findAll(filters) {
    try {
      const products = await productDAO.findAll(filters);
      const total = await productDAO.count(filters);

      return {
        products: products.map((product) => ProductDTO.productList(product)),
        pagination: {
          current: parseInt(filters.page || 1),
          pages: Math.ceil(total / (filters.limit || 10)),
          total,
        },
      };
    } catch (error) {
      logger.error('❌ Error obteniendo productos:', error);
      throw error;
    }
  }

  /**
   * Buscar productos por propietario
   */
  async findByOwner(ownerId) {
    try {
      const products = await productDAO.findByOwner(ownerId);
      return products.map((product) => ProductDTO.fromProduct(product));
    } catch (error) {
      logger.error(`❌ Error buscando productos del propietario ${ownerId}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar producto
   */
  async update(id, updateData) {
    try {
      const product = await productDAO.updateById(id, updateData);
      if (!product) {
        return null;
      }

      logger.info(`✏️ Producto actualizado: ${product.title}`);
      return ProductDTO.fromProduct(product);
    } catch (error) {
      logger.error(`❌ Error actualizando producto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar producto
   */
  async delete(id) {
    try {
      const product = await productDAO.deleteById(id);
      if (product) {
        logger.info(`🗑️ Producto eliminado: ${product.title}`);
      }
      return product ? ProductDTO.fromProduct(product) : null;
    } catch (error) {
      logger.error(`❌ Error eliminando producto ${id}:`, error);
      throw error;
    }
  }

  /**
   * Verificar y actualizar stock para compra
   */
  async processStockForPurchase(items) {
    const results = {
      successful: [],
      failed: [],
      total: 0,
    };

    // Procesar todos los items en paralelo para mejor rendimiento
    const stockCheckPromises = items.map(async (item) => {
      try {
        const hasStock = await productDAO.checkStock(item.product._id, item.quantity);

        if (hasStock) {
          await productDAO.updateStock(item.product._id, item.quantity);
          return {
            type: 'success',
            data: {
              product: item.product,
              quantity: item.quantity,
              subtotal: item.product.price * item.quantity,
            },
          };
        }
        const product = await productDAO.findById(item.product._id);
        return {
          type: 'failed',
          data: {
            product: item.product.title,
            requestedQuantity: item.quantity,
            availableStock: product?.stock || 0,
            reason: 'Stock insuficiente',
          },
        };
      } catch (error) {
        logger.error(`❌ Error procesando stock para producto ${item.product._id}:`, error);
        return {
          type: 'failed',
          data: {
            product: item.product.title,
            requestedQuantity: item.quantity,
            availableStock: 0,
            reason: 'Error en el procesamiento',
          },
        };
      }
    });

    // Ejecutar todas las operaciones en paralelo
    const processedItems = await Promise.all(stockCheckPromises);

    // Separar resultados exitosos y fallidos
    for (const item of processedItems) {
      if (item.type === 'success') {
        results.successful.push(item.data);
        results.total += item.data.subtotal;
      } else {
        results.failed.push(item.data);
      }
    }

    return results;
  }
}

export default new ProductRepository();
