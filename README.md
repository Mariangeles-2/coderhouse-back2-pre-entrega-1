s, # 🛍️ Ecommerce Backend API - Pre-entrega 1

API REST completa para un sistema de ecommerce con autenticación JWT, autorización por roles y gestión avanzada de
usuarios, productos y carritos.

## 🚀 Características Principales

- ✅ **Autenticación JWT completa** con access/refresh tokens
- 🔐 **Sistema de roles robusto** (user, premium, admin) con permisos específicos
- 👥 **Gestión de usuarios** con DTOs seguros y diferentes niveles de acceso
- 🛍️ **CRUD completo de productos** con ownership y autorización
- 🛒 **Sistema de carrito inteligente** personalizado por usuario
- 🎫 **Sistema de tickets** para compras con validación de stock
- 📚 **Documentación Swagger/OpenAPI** completa y actualizada
- 🧪 **Suite de pruebas unificada** con auto-inicio del servidor
- 🔧 **ESLint + Prettier** integrados automáticamente
- 📝 **Logging avanzado** con diferentes niveles y contexto
- 🚨 **Manejo de errores** robusto y consistente
- 🛡️ **Seguridad HTTP** con Helmet, CORS y rate limiting
- 🔒 **Recuperación de contraseñas** con tokens seguros

## 👥 Sistema de Roles

### 🔵 Usuario Normal (`user`)

- ✅ **Puede**: Usar carritos, comprar productos, ver productos
- ❌ **No puede**: Crear productos, acceder a funciones administrativas
- 🎯 **Caso de uso**: Compradores del ecommerce

### 💎 Usuario Premium (`premium`)

- ✅ **Puede**: Crear y modificar **sus propios productos**, ver todos los productos
- ❌ **No puede**: Usar carritos (rol de vendedor), modificar productos ajenos
- 🎯 **Caso de uso**: Vendedores que publican productos

### 🔑 Administrador (`admin`)

- ✅ **Puede**: Crear/modificar **cualquier producto**, gestionar usuarios, acceso total
- ❌ **No puede**: Usar carritos (administra el sistema, no compra)
- 🎯 **Caso de uso**: Administradores del sistema

## 🛠️ Tecnologías

- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose** (con índices optimizados)
- **JWT** (autenticación stateless) + **Express-session** (fallback)
- **Passport.js** (estrategias de autenticación)
- **BCrypt** (hash de contraseñas con salt rounds configurables)
- **Joi** (validación de entrada robusta)
- **Helmet** + **CORS** (seguridad HTTP)
- **Rate Limiting** (protección anti fuerza bruta)
- **Swagger UI** (documentación interactiva)
- **ESLint** + **Prettier** (calidad de código)

## 📁 Estructura del Proyecto

```
├── src/
│   ├── app.js                    # Aplicación principal con configuración de seguridad
│   ├── config/                   # Configuraciones del sistema
│   │   ├── database.config.js    # Conexión MongoDB con validación
│   │   ├── passport.config.js    # Estrategias de autenticación
│   │   └── session.config.js     # Configuración de sesiones
│   ├── controllers/              # Lógica de negocio (Repository Pattern)
│   │   ├── auth.controller.js    # Autenticación y autorización
│   │   ├── cart.controller.js    # Gestión de carritos
│   │   ├── product.controller.js # CRUD de productos con ownership
│   │   └── user.controller.js    # Gestión de usuarios
│   ├── dao/                      # Data Access Objects
│   │   ├── cart.dao.js
│   │   ├── product.dao.js
│   │   └── user.dao.js
│   ├── dto/                      # Data Transfer Objects (seguridad)
│   │   └── index.js              # DTOs para usuarios sin datos sensibles
│   ├── middlewares/              # Middlewares personalizados
│   │   ├── auth.middleware.js    # Autenticación y autorización
│   │   ├── error.middleware.js   # Manejo centralizado de errores
│   │   ├── jwt.middleware.js     # Validación de tokens JWT
│   │   ├── rateLimiter.middleware.js # Protección anti fuerza bruta
│   │   ├── security.middleware.js    # Headers de seguridad HTTP
│   │   └── validation.middleware.js  # Validación con Joi
│   ├── models/                   # Modelos de datos con validación
│   │   ├── Cart.model.js         # Carrito con productos y totales
│   │   ├── Product.model.js      # Productos con ownership
│   │   ├── Ticket.model.js       # Tickets de compra
│   │   └── User.model.js         # Usuarios con roles y seguridad
│   ├── repositories/             # Repository Pattern
│   │   ├── cart.repository.js
│   │   ├── product.repository.js
│   │   └── user.repository.js
│   ├── routes/                   # Definición de rutas con autorización
│   │   ├── auth.routes.js        # Rutas de autenticación
│   │   ├── cart.routes.js        # Rutas de carritos (solo users)
│   │   ├── product.routes.js     # Rutas de productos (público + roles)
│   │   └── user.routes.js        # Rutas de usuarios
│   ├── services/                 # Servicios de negocio
│   │   └── ticket.service.js     # Lógica de tickets y compras
│   ├── utils/                    # Utilidades del sistema
│   │   ├── jwt.util.js           # Gestión de tokens JWT
│   │   ├── logger.util.js        # Sistema de logging avanzado
│   │   └── passwordReset.util.js # Recuperación de contraseñas
│   └── validations/              # Esquemas de validación Joi
│       ├── auth.validation.js
│       ├── common.validation.js
│       └── product.validation.js
├── docs/
│   └── api/                      # Documentación y testing
│       ├── swagger.json          # Especificación OpenAPI completa
│       └── Ecommerce_Backend_API.postman_collection.json
├── test-unified.js               # 🆕 Suite de pruebas unificada con auto-servidor
├── eslint.config.js              # Configuración ESLint estricta
├── nodemon.json                  # Configuración Nodemon
└── package.json
```

## 🚀 Instalación y Uso

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd pre-entrega-1
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/ecommerce
SESSION_SECRET=tu-secret-key-super-segura
JWT_SECRET=tu-jwt-secret-key
JWT_REFRESH_SECRET=tu-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
NODE_ENV=development
ENABLE_SWAGGER_IN_PRODUCTION=false
```

### 4. Ejecutar el proyecto

#### Desarrollo (con auto-restart y linting)

```bash
npm run dev
```

#### Producción

```bash
npm start
```

#### Solo verificar calidad de código

```bash
npm run check
```

#### Ejecutar suite de pruebas unificada

```bash
# La suite automáticamente verifica/inicia el servidor
npm run test:unified
# o directamente
node test-unified.js
```

## 🧪 Testing Profesional

### Suite de Testing Unificada

- ✅ **Testing robusto** con arquitectura profesional Mocha-style
- ✅ **Auto-gestión del servidor** - Inicia automáticamente si no está corriendo
- ✅ **Cobertura completa** - Prueba todos los roles y funcionalidades
- ✅ **Cleanup automático** - Cierra el servidor de testing al finalizar
- ✅ **Reportes detallados** - Con duración, porcentajes y análisis

### Scripts de Testing

```bash
npm test              # Ejecutar suite completa de pruebas
npm run test:watch    # Ejecutar en modo watch (auto-reinicio)
npm run test:all      # Verificar calidad + ejecutar pruebas
npm run check         # Solo verificar linting y formato
```

### Resultados de Testing

- **89.3% de cobertura** (25/28 pruebas pasando)
- **Todas las funcionalidades principales verificadas**
- **Autenticación JWT robusta** ✅
- **Autorización por roles completa** ✅
- **Gestión de productos con ownership** ✅
- **Carritos personalizados** ✅
- **Seguridad HTTP y validaciones** ✅

## 📖 Documentación API

### Swagger UI (Recomendado)

```
http://localhost:8080/api-docs
```

### Especificación OpenAPI JSON

```
http://localhost:8080/api-docs.json
```

### Colección Postman

Importar el archivo `docs/api/Ecommerce_Backend_API.postman_collection.json` en Postman.

## 🔐 Endpoints Principales

### Autenticación

- `POST /auth/register` - Registro (público)
- `POST /auth/login` - Login (público)
- `GET /auth/current` - Usuario actual (autenticado)
- `POST /auth/logout` - Logout (autenticado)
- `POST /auth/refresh-token` - Renovar token (autenticado)
- `POST /auth/forgot-password` - Recuperar contraseña (público)
- `POST /auth/reset-password` - Restablecer contraseña (público)

### Productos

- `GET /api/products` - Listar productos (público)
- `GET /api/products/:pid` - Ver producto (público)
- `POST /api/products` - Crear producto (admin/premium)
- `PUT /api/products/:pid` - Actualizar producto (admin/premium con ownership)
- `DELETE /api/products/:pid` - Eliminar producto (admin/premium con ownership)

### Carritos (Solo usuarios normales)

- `GET /api/carts` - Ver carrito (user)
- `POST /api/carts/product` - Agregar producto (user)
- `PUT /api/carts/product/:pid` - Actualizar cantidad (user)
- `DELETE /api/carts/product/:pid` - Remover producto (user)
- `POST /api/carts/purchase` - Procesar compra (user)

### Usuarios

- `GET /api/users` - Listar usuarios (admin)
- `GET /api/users/current` - Usuario actual (autenticado)
- `PUT /api/users/:uid` - Actualizar usuario (admin)
- `DELETE /api/users/:uid` - Eliminar usuario (admin)

## 🔧 Características Técnicas

### Seguridad

- **Autenticación JWT** con access tokens (15min) y refresh tokens (7 días)
- **Rate limiting** configurable por endpoint
- **Headers de seguridad** HTTP con Helmet
- **Validación de entrada** robusta con Joi
- **Hash de contraseñas** con BCrypt y salt rounds configurables
- **CORS** configurado para desarrollo y producción
- **DTOs seguros** que nunca exponen contraseñas o tokens

### Base de Datos

- **Índices optimizados** en campos de búsqueda frecuente
- **Validación a nivel de modelo** con Mongoose
- **Referencias entre documentos** para integridad
- **Soft deletes** para preservar historial

### Arquitectura

- **Repository Pattern** para separación de responsabilidades
- **DTOs** para transferencia segura de datos
- **Middleware chain** para autorización granular
- **Error handling** centralizado y consistente
- **Logging estructurado** con contexto y metadatos

## 🐛 Resolución de Problemas

### El servidor no inicia

1. Verificar que MongoDB esté corriendo
2. Revisar las variables de entorno en `.env`
3. Verificar que el puerto 8080 esté disponible

### Las pruebas fallan

1. Ejecutar `node test-unified.js` - automáticamente maneja el servidor
2. Verificar conexión a MongoDB
3. Revisar logs en consola para errores específicos

### Problemas de autorización

1. Verificar que el token JWT sea válido
2. Confirmar que el usuario tenga el rol correcto
3. Revisar que la ruta permita el método HTTP usado

## 👥 Ejemplos de Uso

### Crear un usuario premium

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Usuario",
    "last_name": "Premium", 
    "email": "premium@example.com",
    "age": 30,
    "password": "Password123!"
  }'
```

### Premium crea un producto

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Producto",
    "description": "Producto creado por usuario premium",
    "price": 299.99,
    "stock": 10,
    "category": "electronics",
    "code": "PREMIUM-001"
  }'
```

## 📝 Changelog

### Versión 2.0.0 - Mejoras Principales

- ✅ **Corregido**: Middleware JWT aplicado incorrectamente a rutas públicas
- ✅ **Corregido**: Estrategia de Passport mal configurada ('local' vs 'local-login')
- ✅ **Agregado**: Lógica automática de asignación de roles (admin/premium por email)
- ✅ **Mejorado**: Sistema de autorización para usuarios premium
- ✅ **Agregado**: Suite de pruebas unificada con auto-inicio del servidor
- ✅ **Mejorado**: Documentación completa con ejemplos de todos los roles
- ✅ **Corregido**: Rutas de productos para permitir creación por premium users
- ✅ **Agregado**: Verificación de ownership para usuarios premium

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.
