import { isValidObjectId } from 'mongoose';

import Product from '../models/Product.model.js';

/**
 * 🗄️ DAO para operaciones de base de datos de Producto
 */
class ProductDAO {
  /**
   * Crear un nuevo producto
   */
  create(productData) {
    return Product.create(productData);
  }

  /**
   * Buscar producto por ID
   */
  findById(id) {
    // Validar que el ID sea un ObjectId válido
    if (!isValidObjectId(id)) {
      return null;
    }
    return Product.findById(id).populate('owner', 'first_name last_name email');
  }

  /**
   * Buscar todos los productos con filtros y paginación
   */
  findAll({ page = 1, limit = 10, category, search, sort = 'createdAt', order = 'desc' }) {
    const query = { status: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = { [sort]: order === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;

    return Product.find(query)
      .populate('owner', 'first_name last_name email')
      .limit(limit)
      .skip(skip)
      .sort(sortOptions);
  }

  /**
   * Contar productos con filtros
   */
  count({ category, search }) {
    const query = { status: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    return Product.countDocuments(query);
  }

  /**
   * Buscar productos por propietario
   */
  findByOwner(ownerId) {
    return Product.find({ owner: ownerId })
      .populate('owner', 'first_name last_name email')
      .sort({ createdAt: -1 });
  }

  /**
   * Actualizar producto por ID
   */
  updateById(id, updateData) {
    return Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('owner', 'first_name last_name email');
  }

  /**
   * Eliminar producto por ID
   */
  deleteById(id) {
    return Product.findByIdAndDelete(id);
  }

  /**
   * Actualizar stock del producto
   */
  updateStock(id, quantity) {
    return Product.findByIdAndUpdate(id, { $inc: { stock: -quantity } }, { new: true });
  }

  /**
   * Verificar disponibilidad de stock
   */
  async checkStock(id, requiredQuantity) {
    const product = await Product.findById(id);
    return product && product.stock >= requiredQuantity;
  }
}

export default new ProductDAO();
