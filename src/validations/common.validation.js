import Joi from 'joi';

// Validaciones reutilizables con Clean Code
// Solo schemas que realmente se utilizan en la aplicación

// Validaciones base reutilizables
export const commonValidations = {
  // Validación de nombres (aplica para firstName, lastName, etc.)
  name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .trim()
    .messages({
      'string.pattern.base': 'Solo puede contener letras y espacios',
      'string.min': 'Debe tener al menos 2 caracteres',
      'string.max': 'No puede tener más de 50 caracteres',
      'string.empty': 'No puede estar vacío',
    }),

  // Validación de email estándar
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net', 'org', 'ar', 'edu', 'gov', 'co'] },
    })
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Debe ser un email válido',
      'string.empty': 'El email es obligatorio',
    }),

  // Validación de edad (18-100 años)
  age: Joi.number().integer().min(18).max(100).messages({
    'number.base': 'La edad debe ser un número',
    'number.integer': 'La edad debe ser un número entero',
    'number.min': 'Debes tener al menos 18 años para registrarte',
    'number.max': 'La edad no puede ser mayor a 100 años',
  }),

  // Validación de contraseña robusta (8-50 caracteres)
  password: Joi.string()
    .min(8)
    .max(50)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .messages({
      'string.pattern.base':
        'La contraseña debe incluir: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&)',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.max': 'La contraseña no puede tener más de 50 caracteres',
      'string.empty': 'La contraseña es obligatoria',
    }),

  // Validación de precios
  price: Joi.number().positive().precision(2).max(999999.99).messages({
    'number.positive': 'El precio debe ser mayor a 0',
    'number.max': 'El precio no puede ser mayor a $999,999.99',
  }),

  // Validación de stock
  stock: Joi.number().integer().min(0).max(999999).messages({
    'number.integer': 'El stock debe ser un número entero',
    'number.min': 'El stock no puede ser negativo',
    'number.max': 'El stock no puede ser mayor a 999,999',
  }),

  // Validación de cantidad
  quantity: Joi.number().integer().min(1).max(999).messages({
    'number.integer': 'La cantidad debe ser un número entero',
    'number.min': 'La cantidad debe ser al menos 1',
    'number.max': 'La cantidad no puede ser mayor a 999',
  }),
};

// Funciones helper para validaciones
// Crear validación requerida para cualquier campo
export const required = (schema, fieldName = 'Campo') =>
  schema.required().messages({
    'any.required': `${fieldName} es obligatorio`,
  });

// Crear validación opcional para cualquier campo
export const optional = (schema) => schema.optional();

// Crear validación de confirmación (para contraseñas, emails, etc.)
export const confirmation = (fieldName, label = 'confirmación') =>
  Joi.string()
    .valid(Joi.ref(fieldName))
    .required()
    .messages({
      'any.only': `La ${label} no coincide`,
      'any.required': `La ${label} es obligatoria`,
    });

// Crear validación de array de URLs para thumbnails
export const thumbnailArray = (maxItems = 5) =>
  Joi.array()
    .items(
      Joi.string().uri().messages({
        'string.uri': 'Cada imagen debe ser una URL válida',
      })
    )
    .max(maxItems)
    .default([])
    .messages({
      'array.max': `No puedes agregar más de ${maxItems} imágenes`,
    });

// Crear validación de texto descriptivo
export const description = (minLength = 10, maxLength = 1000) =>
  Joi.string()
    .min(minLength)
    .max(maxLength)
    .trim()
    .messages({
      'string.min': `Debe tener al menos ${minLength} caracteres`,
      'string.max': `No puede tener más de ${maxLength} caracteres`,
    });
