import mongoose from 'mongoose';

/**
 * 🛍️ Modelo de Producto
 */

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título del producto es obligatorio'],
      trim: true,
      minlength: [3, 'El título debe tener al menos 3 caracteres'],
      maxlength: [100, 'El título no puede exceder 100 caracteres'],
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
      maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    thumbnail: {
      type: String,
      default: 'https://via.placeholder.com/300x300?text=Producto',
    },
    code: {
      type: String,
      required: [true, 'El código del producto es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      trim: true,
      enum: [
        'electronics',
        'clothing',
        'books',
        'home',
        'sports',
        'beauty',
        'toys',
        'automotive',
        'other',
      ],
    },
    status: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * 📊 Método para verificar si hay stock
 */
productSchema.methods.hasStock = function (quantity = 1) {
  return this.stock >= quantity;
};

/**
 * 📦 Método para reducir stock
 */
productSchema.methods.reduceStock = function (quantity) {
  if (!this.hasStock(quantity)) {
    throw new Error('Stock insuficiente');
  }
  this.stock -= quantity;
  return this.save();
};

/**
 * 🏷️ Índices para optimización
 */
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ title: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
