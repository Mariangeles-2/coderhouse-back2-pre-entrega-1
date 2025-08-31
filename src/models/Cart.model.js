import mongoose from 'mongoose';

/**
 * 🛒 Modelo de Carrito de Compras
 */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'La cantidad debe ser al menos 1'],
          default: 1,
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'El precio no puede ser negativo'],
        },
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'El monto total no puede ser negativo'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * 💰 Middleware para calcular el total
 */
cartSchema.pre('save', function (next) {
  this.totalAmount = this.products.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  next();
});

/**
 * 📊 Método para obtener el total de items
 */
cartSchema.methods.getTotalItems = function () {
  return this.products.reduce((total, item) => total + item.quantity, 0);
};

/**
 * 🏷️ Índices para optimización
 */
cartSchema.index({ user: 1 });
cartSchema.index({ status: 1 });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
