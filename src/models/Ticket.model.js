import mongoose from 'mongoose';

/**
 * 🎫 Modelo de Ticket para compras del ecommerce
 * Implementa todos los campos necesarios para una lógica de compra robusta
 */
const ticketSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'El código del ticket es obligatorio'],
      unique: true,
      uppercase: true,
    },
    purchase_datetime: {
      type: Date,
      required: [true, 'La fecha de compra es obligatoria'],
      default: Date.now,
    },
    amount: {
      type: Number,
      required: [true, 'El monto total es obligatorio'],
      min: [0, 'El monto no puede ser negativo'],
    },
    purchaser: {
      type: String,
      required: [true, 'El email del comprador es obligatorio'],
      lowercase: true,
      trim: true,
    },
    // Información detallada de productos comprados
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    // Estado del ticket
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'refunded'],
      default: 'completed',
    },
    // Información del usuario
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Productos que no pudieron comprarse (stock insuficiente)
    failedProducts: [
      {
        product: {
          type: String,
          required: true,
        },
        requestedQuantity: {
          type: Number,
          required: true,
        },
        availableStock: {
          type: Number,
          required: true,
        },
        reason: {
          type: String,
          default: 'Stock insuficiente',
        },
      },
    ],
    // Información de pago
    paymentInfo: {
      method: {
        type: String,
        enum: ['credit_card', 'debit_card', 'paypal', 'cash', 'transfer'],
        default: 'credit_card',
      },
      transactionId: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved',
      },
    },
    // Información de envío
    shippingInfo: {
      address: String,
      city: String,
      postalCode: String,
      country: String,
      estimatedDelivery: Date,
      trackingNumber: String,
    },
    // Totales y descuentos
    totals: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      tax: {
        type: Number,
        default: 0,
        min: 0,
      },
      shipping: {
        type: Number,
        default: 0,
        min: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para optimización
ticketSchema.index({ purchaser: 1 });
ticketSchema.index({ user: 1 });
ticketSchema.index({ purchase_datetime: -1 });
ticketSchema.index({ status: 1 });

// Middleware para generar código único
ticketSchema.pre('save', function (next) {
  if (!this.code) {
    this.code = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Método para calcular totales
ticketSchema.methods.calculateTotals = function () {
  const subtotal = this.products.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.21; // IVA 21%
  const total = subtotal + tax + this.totals.shipping - this.totals.discount;

  this.totals = {
    subtotal,
    tax,
    shipping: this.totals.shipping || 0,
    discount: this.totals.discount || 0,
    total,
  };
  this.amount = total;
};

// Método estático para generar código de ticket
ticketSchema.statics.generateCode = function () {
  return `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
