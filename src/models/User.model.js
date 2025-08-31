import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * 👤 Modelo de Usuario para el Ecommerce
 * Incluye todos los campos requeridos según las especificaciones
 */
const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    },
    last_name: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
      minlength: [2, 'El apellido debe tener al menos 2 caracteres'],
      maxlength: [50, 'El apellido no puede exceder 50 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingresa un email válido',
      ],
    },
    age: {
      type: Number,
      required: [true, 'La edad es obligatoria'],
      min: [13, 'Debes tener al menos 13 años'],
      max: [120, 'La edad máxima es 120 años'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'premium'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * 🔐 Middleware para hashear la contraseña antes de guardar
 */
userSchema.pre('save', async function (next) {
  // Solo hashear la contraseña si ha sido modificada (o es nueva)
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 🔍 Método para comparar contraseñas
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * 📊 Método para obtener información pública del usuario (sin contraseña)
 */
userSchema.methods.toPublicJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

/**
 * 👥 Método para buscar usuario por email
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * 🏷️ Índices para optimización
 */
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User;
