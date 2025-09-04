# 🛍️ Ecommerce Backend API - Pre-entrega 1

API REST completa para un sistema de ecommerce con autenticación, autorización y gestión de usuarios, productos y
carritos.

## 🚀 Características

- ✅ **Autenticación completa** con Passport.js (registro, login, logout)
- 🔐 **Autorización por roles** (user, premium, admin)
- 👥 **Gestión de usuarios** con diferentes niveles de acceso
- 🛍️ **CRUD completo de productos** con ownership
- 🛒 **Sistema de carrito** personalizado por usuario
- 📚 **Documentación Swagger/OpenAPI** completa
- 🧪 **Colección Postman** para testing
- 🔧 **ESLint + Prettier** integrados automáticamente
- 📝 **Logging avanzado** con diferentes niveles
- 🚨 **Manejo de errores** robusto y consistente

## 🛠️ Tecnologías

- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **Passport.js** (autenticación)
- **Express-session** + **Connect-mongo**
- **BCrypt** (hash de contraseñas)
- **Swagger UI** (documentación)
- **ESLint** + **Prettier** (calidad de código)

## 📁 Estructura del Proyecto

```
├── src/
│   ├── app.js                 # Aplicación principal
│   ├── config/               # Configuraciones
│   │   ├── database.config.js
│   │   ├── passport.config.js
│   │   └── session.config.js
│   ├── controllers/          # Lógica de negocio
│   │   ├── auth.controller.js
│   │   ├── cart.controller.js
│   │   ├── product.controller.js
│   │   └── user.controller.js
│   ├── middlewares/          # Middlewares personalizados
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── models/               # Modelos de datos
│   │   ├── Cart.model.js
│   │   ├── Product.model.js
│   │   └── User.model.js
│   ├── routes/               # Definición de rutas
│   │   ├── auth.routes.js
│   │   ├── cart.routes.js
│   │   ├── product.routes.js
│   │   └── user.routes.js
│   └── utils/                # Utilidades
│       └── logger.util.js
├── docs/
│   └── api/                  # Documentación
│       ├── swagger.json      # Especificación OpenAPI
│       └── Ecommerce_Backend_API.postman_collection.json
├── eslint.config.js          # Configuración ESLint
├── nodemon.json             # Configuración Nodemon
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
SESSION_SECRET=tu-secret-key-aqui
NODE_ENV=development
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

#### Scripts disponibles

```bash
npm run check         # Verificar ESLint + Prettier
npm run fix          # Corregir automáticamente errores
npm run lint:check   # Solo verificar ESLint
npm run format       # Aplicar formato Prettier
npm run test:lint    # Test de linting para CI/CD
npm run test:format  # Test de formato para CI/CD
```

## 📚 Documentación

### API Documentation

- **Swagger UI**: http://localhost:8080/api-docs
- **OpenAPI JSON**: http://localhost:8080/api-docs.json

### Testing

Importa la colección de Postman desde:

```
docs/api/Ecommerce_Backend_API.postman_collection.json
```

## 🔐 Roles y Permisos

### 👤 User (usuario básico)

- Ver productos
- Gestionar su carrito
- Actualizar su perfil

### 💎 Premium

- Todos los permisos de User
- Crear productos
- Gestionar sus propios productos

### 👑 Admin

- Todos los permisos
- Gestionar cualquier producto
- Gestionar usuarios
- Cambiar roles
- Acceso a estadísticas

## 🛣️ Endpoints Principales

### Autenticación

- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Inicio de sesión
- `GET /auth/current` - Usuario actual
- `POST /auth/logout` - Cerrar sesión

### Usuarios

- `GET /api/users` - Lista usuarios (admin)
- `PUT /api/users/:id` - Actualizar usuario
- `PATCH /api/users/:id/role` - Cambiar rol (admin)
- `DELETE /api/users/:id` - Eliminar usuario (admin)

### Productos

- `GET /api/products` - Lista productos (paginado)
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto (premium/admin)
- `PUT /api/products/:id` - Actualizar producto (owner/admin)
- `DELETE /api/products/:id` - Eliminar producto (owner/admin)

### Carrito

- `GET /api/carts` - Obtener carrito del usuario
- `POST /api/carts/add` - Agregar producto al carrito
- `PUT /api/carts/product/:pid` - Actualizar cantidad
- `DELETE /api/carts/product/:pid` - Eliminar producto
- `POST /api/carts/purchase` - Procesar compra

## 🔧 Desarrollo

### Calidad de Código

El proyecto incluye ESLint y Prettier configurados automáticamente:

- Se ejecuta linting automáticamente al iniciar el servidor
- Nodemon reinicia el servidor y ejecuta linting en cada cambio
- Configuración optimizada para ES6+ y mejores prácticas

### Logging

Sistema de logging robusto con diferentes niveles:

- `logger.info()` - Información general
- `logger.success()` - Operaciones exitosas
- `logger.warning()` - Advertencias
- `logger.error()` - Errores

### Manejo de Errores

- Uso de `express-async-errors` para manejo automático
- Middleware global de errores
- Respuestas consistentes con `http-errors`
- Logging contextual de errores

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 Licencia

ISC

## 👨‍💻 Autor

**Angie Somma** - Coderhouse Backend 2
