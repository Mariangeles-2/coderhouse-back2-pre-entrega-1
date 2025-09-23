import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

/**
 * 👤 Modelo de Usuario para el Ecommerce
 * Incluye todos los campos requeridos según las especificaciones + seguridad mejorada
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
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Por favor ingresa un email válido',
      ],
    },
    age: {
      type: Number,
      required: [true, 'La edad es obligatoria'],
      min: [18, 'Debes tener al menos 18 años para registrarte'],
      max: [100, 'La edad máxima es 100 años'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      maxlength: [50, 'La contraseña no puede exceder 50 caracteres'],
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
    // 🔐 Campos para recuperación de contraseñas
    passwordResetToken: {
      type: String,
      default: undefined,
    },
    passwordResetExpires: {
      type: Date,
      default: undefined,
    },
    // 📊 Campos de seguridad adicionales
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
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
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * 🔍 Método para comparar contraseñas
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * 🔒 Método para verificar si la cuenta está bloqueada
 */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * 🔐 Método para incrementar intentos de login fallidos
 */
userSchema.methods.incLoginAttempts = function () {
  // Si tenemos un lock previo y ya expiró, reiniciar
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Si llegamos al máximo de intentos y no estamos bloqueados, bloquear
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 horas
  }

  return this.updateOne(updates);
};

/**
 * ✅ Método para resetear intentos de login tras login exitoso
 */
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() },
  });
};

/**
 * 📊 Método para obtener información pública del usuario (sin contraseña)
 */
userSchema.methods.toPublicJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

/**
 * 👥 Método para buscar usuario por email
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * 🔍 Método para buscar usuario por token de recuperación
 */
userSchema.statics.findByResetToken = function (token) {
  return this.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });
};

/**
 * 🏷️ Índices para optimización
 */
userSchema.index({ role: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ passwordResetExpires: 1 });

const User = mongoose.model('User', userSchema);

export default User;
