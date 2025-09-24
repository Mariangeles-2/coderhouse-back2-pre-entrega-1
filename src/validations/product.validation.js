import Joi from 'joi';

import {
  commonValidations,
  description,
  optional,
  required,
  thumbnailArray,
} from './common.validation.js';

// Validaciones de productos con Clean Code
// Usa las categorías del modelo Product y componentes reutilizables

// Categorías válidas extraídas del modelo Product
export const PRODUCT_CATEGORIES = [
  'electronics',
  'clothing',
  'books',
  'home',
  'sports',
  'beauty',
  'toys',
  'automotive',
  'other',
];

// Validación de categoría usando el enum del modelo
const categoryValidation = Joi.string()
  .valid(...PRODUCT_CATEGORIES)
  .messages({
    'any.only': `La categoría debe ser una de: ${PRODUCT_CATEGORIES.join(', ')}`,
  });

// Validación de código de producto (integrada directamente)
const productCodeValidation = Joi.string()
  .pattern(/^[A-Z0-9-]+$/)
  .min(3)
  .max(20)
  .uppercase()
  .messages({
    'string.pattern.base': 'El código solo puede contener letras mayúsculas, números y guiones',
    'string.min': 'El código debe tener al menos 3 caracteres',
    'string.max': 'El código no puede tener más de 20 caracteres',
  });

export const createProductValidation = Joi.object({
  title: required(Joi.string().min(3).max(100).trim(), 'El título').messages({
    'string.min': 'El título debe tener al menos 3 caracteres',
    'string.max': 'El título no puede tener más de 100 caracteres',
  }),

  description: required(description(10, 1000), 'La descripción'),

  code: required(productCodeValidation, 'El código del producto'),

  price: required(commonValidations.price, 'El precio'),

  status: optional(Joi.boolean().default(true)).messages({
    'boolean.base': 'El estado debe ser verdadero o falso',
  }),

  stock: required(commonValidations.stock, 'El stock'),

  category: required(categoryValidation, 'La categoría'),

  thumbnails: optional(thumbnailArray(5)),
});

export const updateProductValidation = Joi.object({
  title: optional(Joi.string().min(3).max(100).trim()).messages({
    'string.min': 'El título debe tener al menos 3 caracteres',
    'string.max': 'El título no puede tener más de 100 caracteres',
  }),

  description: optional(description(10, 1000)),

  price: optional(commonValidations.price),

  status: optional(Joi.boolean()).messages({
    'boolean.base': 'El estado debe ser verdadero o falso',
  }),

  stock: optional(commonValidations.stock),

  category: optional(categoryValidation),

  thumbnails: optional(thumbnailArray(5)),
})
  .min(1)
  .messages({
    'object.min': 'Debe proporcionar al menos un campo para actualizar',
  });

// Validaciones para carritos
// Validación para agregar producto al carrito
export const addToCartValidation = Joi.object({
  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'El ID del producto debe ser un ObjectId válido',
      'any.required': 'El ID del producto es requerido',
    }),
  quantity: Joi.number().integer().min(1).max(100).default(1).messages({
    'number.base': 'La cantidad debe ser un número',
    'number.integer': 'La cantidad debe ser un número entero',
    'number.min': 'La cantidad mínima es 1',
    'number.max': 'La cantidad máxima es 100',
  }),
});

// Validación para actualizar cantidad
export const updateQuantityValidation = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).required().messages({
    'number.base': 'La cantidad debe ser un número',
    'number.integer': 'La cantidad debe ser un número entero',
    'number.min': 'La cantidad mínima es 1',
    'number.max': 'La cantidad máxima es 100',
    'any.required': 'La cantidad es requerida',
  }),
});
