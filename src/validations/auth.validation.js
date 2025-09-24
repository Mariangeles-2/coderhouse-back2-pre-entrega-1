import Joi from 'joi';

import { commonValidations, confirmation, required } from './common.validation.js';

// Validaciones de autenticación con Clean Code
// Usa componentes reutilizables para mayor mantenibilidad

export const registerValidation = Joi.object({
  first_name: required(commonValidations.name, 'El nombre').messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede tener más de 50 caracteres',
  }),
  last_name: required(commonValidations.name, 'El apellido').messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'string.max': 'El apellido no puede tener más de 50 caracteres',
  }),
  email: required(commonValidations.email, 'El email'),
  age: required(commonValidations.age, 'La edad'),
  password: required(commonValidations.password, 'La contraseña'),
});

export const loginValidation = Joi.object({
  email: required(commonValidations.email, 'El email'),
  password: required(Joi.string().min(1), 'La contraseña').messages({
    'string.min': 'La contraseña es requerida',
  }),
});

export const changePasswordValidation = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'La contraseña actual es obligatoria',
  }),
  newPassword: required(commonValidations.password, 'La nueva contraseña'),
  confirmPassword: confirmation('newPassword', 'confirmación de contraseña'),
});

export const forgotPasswordValidation = Joi.object({
  email: required(commonValidations.email, 'El email'),
});

export const resetPasswordValidation = Joi.object({
  token: required(Joi.string().min(10), 'El token de recuperación').messages({
    'string.min': 'Token inválido',
  }),
  newPassword: required(commonValidations.password, 'La nueva contraseña'),
  confirmPassword: confirmation('newPassword', 'confirmación de contraseña'),
});
