# 🛍️ Ecommerce Backend - Pre-entrega 1

## 📋 Descripción

Sistema completo de ecommerce backend desarrollado para la **Pre-entrega 1 del curso de Backend 2 de Coderhouse**.
Implementa autenticación y autorización utilizando **Passport.js** con estrategias locales, siguiendo principios de *
*Clean Code** y arquitectura escalable.

## ✨ Características Principales

### 🔐 Autenticación y Autorización

- ✅ **Passport Local Strategy** para registro y login
- ✅ **Bcrypt** para encriptación segura de contraseñas
- ✅ **Express Sessions** con MongoDB como store
- ✅ **Middleware de autenticación** para proteger rutas
- ✅ **Sistema de roles** (user, premium, admin)
- ✅ **Middleware de autorización** por roles

### 👥 Gestión de Usuarios

- ✅ Registro completo con validaciones
- ✅ Login/logout seguro
- ✅ Perfil de usuario
- ✅ CRUD completo de usuarios (admin)
- ✅ Cambio de roles (admin)

### 🛍️ Sistema de Productos

- ✅ CRUD completo de productos
- ✅ Filtros por categoría y búsqueda
- ✅ Paginación
- ✅ Control de stock
- ✅ Permisos por rol (premium/admin pueden crear)

### 🛒 Carrito de Compras

- ✅ Carrito personal por usuario
- ✅ Agregar/eliminar productos
- ✅ Actualizar cantidades
- ✅ Validación de stock
- ✅ Cálculo automático de totales

### 🎨 Interfaz y Experiencia

- ✅ **Handlebars** como motor de plantillas
- ✅ **Bootstrap 5** para diseño responsive
- ✅ **Helpers personalizados** para comparaciones
- ✅ **AJAX** para operaciones sin recarga
- ✅ **Mensajes con emojis** en consola y UI

### 🔧 Herramientas de Desarrollo

- ✅ **ESLint** configurado para ES2021
- ✅ **Prettier** para formateo de código
- ✅ **Nodemon** para desarrollo
- ✅ **MongoDB** con Mongoose ODM
- ✅ **Variables de entorno** con dotenv

## 🏗️ Arquitectura del Proyecto

```
src/
├── app.js                 # 🚀 Archivo principal de la aplicación
├── config/               # ⚙️ Configuraciones
│   ├── database.config.js
│   ├── passport.config.js
│   └── session.config.js
├── controllers/          # 🎮 Controladores
│   ├── auth.controller.js
│   ├── cart.controller.js
│   ├── product.controller.js
│   └── user.controller.js
├── middlewares/          # 🛡️ Middlewares
│   └── auth.middleware.js
├── models/              # 📊 Modelos de datos
│   ├── Cart.model.js
│   ├── Product.model.js
│   └── User.model.js
├── routes/              # 🛣️ Rutas
│   ├── auth.routes.js
│   ├── cart.routes.js
│   ├── product.routes.js
│   └── user.routes.js
├── utils/               # 🔧 Utilidades
│   ├── handlebars.helpers.js
│   └── logger.util.js
└── views/               # 🎨 Vistas
    ├── layouts/
    ├── auth/
    └── partials/
```

## 🚀 Instalación y Configuración

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

Crear archivo `.env` en la raíz del proyecto:

```env
# 🛍️ Configuración del Ecommerce Backend
PORT=8080
MONGO_URI=mongodb://localhost:27017/ecommerce_backend
SESSION_SECRET=mi_secreto_super_seguro_para_sesiones
NODE_ENV=development

# 🔐 Configuración de Autenticación
BCRYPT_ROUNDS=10
```

### 4. Iniciar MongoDB

Asegúrate de tener MongoDB ejecutándose en tu sistema.

### 5. Ejecutar la aplicación

```bash
# Desarrollo (con Nodemon)
npm run dev

# Producción
npm start
```

## 📡 API Endpoints

### 🔐 Autenticación

```
GET  /auth/register     # Mostrar formulario de registro
POST /auth/register     # Procesar registro
GET  /auth/login        # Mostrar formulario de login
POST /auth/login        # Procesar login
POST /auth/logout       # Cerrar sesión
GET  /auth/profile      # Perfil del usuario
GET  /auth/check        # Verificar autenticación
```

### 👥 Usuarios (requiere autenticación)

```
GET    /api/users           # Listar usuarios (admin)
GET    /api/users/:id       # Obtener usuario por ID
PUT    /api/users/:id       # Actualizar usuario
DELETE /api/users/:id       # Eliminar usuario (admin)
PATCH  /api/users/:id/role  # Cambiar rol (admin)
```

### 🛍️ Productos

```
GET    /api/products        # Listar productos (público)
GET    /api/products/:id    # Obtener producto por ID (público)
POST   /api/products        # Crear producto (premium/admin)
PUT    /api/products/:id    # Actualizar producto (propietario/admin)
DELETE /api/products/:id    # Eliminar producto (propietario/admin)
```

### 🛒 Carritos (requiere autenticación)

```
GET    /api/carts                    # Obtener carrito del usuario
POST   /api/carts/add               # Agregar producto al carrito
PUT    /api/carts/products/:id      # Actualizar cantidad
DELETE /api/carts/products/:id      # Eliminar producto del carrito
DELETE /api/carts/clear             # Limpiar carrito
```

## 👤 Sistema de Roles

### 🔹 User (Usuario básico)

- ✅ Registrarse y autenticarse
- ✅ Ver productos
- ✅ Gestionar su carrito
- ✅ Editar su perfil

### ⭐ Premium

- ✅ Todo lo del usuario básico
- ✅ Crear productos
- ✅ Editar sus productos

### 👑 Admin (Administrador)

- ✅ Todo lo anterior
- ✅ Gestionar todos los usuarios
- ✅ Cambiar roles de usuarios
- ✅ Eliminar usuarios
- ✅ Editar/eliminar cualquier producto

## 📊 Modelos de Datos

### User Schema

```javascript
{
    first_name: String(required),
        last_name
:
    String(required),
        email
:
    String(required, unique),
        age
:
    Number(required),
        password
:
    String(required, hashed),
        cart
:
    ObjectId(ref
:
    Cart
),
    role: String(

    enum

:
    ['user', 'premium', 'admin']
)
}
```

### Product Schema

```javascript
{
    title: String(required),
        description
:
    String(required),
        price
:
    Number(required),
        thumbnail
:
    String,
        code
:
    String(required, unique),
        stock
:
    Number(required),
        category
:
    String(

    enum

),
    status: Boolean,
        owner
:
    ObjectId(ref
:
    User
)
}
```

### Cart Schema

```javascript
{
    user: ObjectId(ref
:
    User
),
    products: [{
        product: ObjectId(ref
:
    Product
),
    quantity: Number,
        price
:
    Number
}],
    totalAmount: Number,
        status
:
    String(

    enum

:
    ['active', 'completed', 'cancelled']
)
}
```

## 🛠️ Scripts Disponibles

```bash
npm start          # Iniciar en producción
npm run dev        # Iniciar en desarrollo (Nodemon)
npm run lint       # Ejecutar ESLint
npm run lint:fix   # Corregir errores de ESLint
npm run format     # Formatear código con Prettier
```

## 🔐 Seguridad Implementada

- ✅ **Contraseñas hasheadas** con bcrypt
- ✅ **Sesiones seguras** con express-session
- ✅ **Validación de entrada** en modelos
- ✅ **Middleware de autenticación**
- ✅ **Control de acceso por roles**
- ✅ **Protección CSRF** implícita
- ✅ **Validación de propietario** en recursos

## 🎯 Funcionalidades Destacadas

### 🚀 Clean Code

- Arquitectura por capas bien definida
- Controladores separados por responsabilidad
- Middlewares reutilizables
- Utilidades centralizadas
- Código comentado y documentado

### 📱 Logger con Emojis

- Mensajes coloridos y descriptivos
- Diferentes niveles de log
- Contexto específico por operación

### 🎨 Interfaz Moderna

- Diseño responsive con Bootstrap 5
- Formularios interactivos con AJAX
- Mensajes de retroalimentación
- Navegación intuitiva

## 🔮 Próximas Mejoras

- [ ] JWT para autenticación stateless
- [ ] OAuth con Google/GitHub
- [ ] Sistema de recuperación de contraseña
- [ ] Notificaciones por email
- [ ] Dashboard de administración
- [ ] API REST documentada con Swagger
- [ ] Tests unitarios y de integración
- [ ] Docker para containerización

## 👨‍💻 Autor

**Angie Somma**  
Estudiante de Backend 2 - Coderhouse  
Pre-entrega 1

---

## 📄 Licencia

Este proyecto es parte de un curso educativo y está bajo la licencia ISC.

---

*Desarrollado con ❤️ y muchos ☕ para Coderhouse Backend 2*
