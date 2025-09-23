import Cart from '../models/Cart.model.js';

/**
 * 🗄️ DAO para operaciones de base de datos de Carrito
 */
class CartDAO {
  /**
   * Crear un nuevo carrito
   */
  create(cartData) {
    return Cart.create(cartData);
  }

  /**
   * Buscar carrito por ID
   */
  findById(id) {
    return Cart.findById(id)
      .populate('products.product', 'title price thumbnail stock')
      .populate('user', 'first_name last_name email');
  }

  /**
   * Buscar carrito activo por usuario
   */
  findActiveByUser(userId) {
    return Cart.findOne({ user: userId, status: 'active' })
      .populate('products.product', 'title price thumbnail stock')
      .populate('user', 'first_name last_name email');
  }

  /**
   * Actualizar carrito por ID
   */
  updateById(id, updateData) {
    return Cart.findByIdAndUpdate(id, updateData, { new: true }).populate(
      'products.product',
      'title price thumbnail stock'
    );
  }

  /**
   * Eliminar carrito por ID
   */
  deleteById(id) {
    return Cart.findByIdAndDelete(id);
  }

  /**
   * Limpiar productos del carrito
   */
  clearProducts(cartId) {
    return Cart.findByIdAndUpdate(cartId, { products: [] }, { new: true });
  }

  /**
   * Agregar producto al carrito
   */
  addProduct(cartId, productId, quantity) {
    return Cart.findByIdAndUpdate(
      cartId,
      {
        $push: {
          products: { product: productId, quantity },
        },
      },
      { new: true }
    ).populate('products.product', 'title price thumbnail stock');
  }

  /**
   * Actualizar cantidad de producto en carrito
   */
  updateProductQuantity(cartId, productId, quantity) {
    return Cart.findOneAndUpdate(
      { _id: cartId, 'products.product': productId },
      { $set: { 'products.$.quantity': quantity } },
      { new: true }
    ).populate('products.product', 'title price thumbnail stock');
  }

  /**
   * Remover producto del carrito
   */
  removeProduct(cartId, productId) {
    return Cart.findByIdAndUpdate(
      cartId,
      { $pull: { products: { product: productId } } },
      { new: true }
    ).populate('products.product', 'title price thumbnail stock');
  }
}

export default new CartDAO();
