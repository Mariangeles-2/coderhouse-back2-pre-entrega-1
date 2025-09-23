/**
 * 📦 DTO para información pública del usuario
 * Excluye información sensible como contraseñas y tokens
 */
export class UserDTO {
  constructor(user) {
    this.id = user._id;
    this.firstName = user.first_name;
    this.lastName = user.last_name;
    this.email = user.email;
    this.age = user.age;
    this.role = user.role;
    this.isActive = user.isActive;
    this.lastLogin = user.lastLogin;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  /**
   * Método estático para crear DTO desde objeto user
   */
  static fromUser(user) {
    const dto = new UserDTO(user);
    // Agregar permisos basados en el rol
    dto.permissions = UserDTO.getRolePermissions(user.role);
    return dto;
  }

  /**
   * DTO específico para respuesta de autenticación actual
   */
  static currentUser(user) {
    return {
      id: user._id,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      permissions: UserDTO.getRolePermissions(user.role),
    };
  }

  /**
   * Obtener permisos basados en el rol
   */
  static getRolePermissions(role) {
    const permissions = new Map([
      [
        'user',
        [
          'read:own-profile',
          'update:own-profile',
          'use:cart',
          'read:products',
          'purchase:products',
        ],
      ],
      [
        'premium',
        [
          'read:own-profile',
          'update:own-profile',
          'create:products',
          'update:own-products',
          'delete:own-products',
          'read:products',
        ],
      ],
      [
        'admin',
        [
          'read:all-profiles',
          'update:all-profiles',
          'delete:users',
          'create:products',
          'update:all-products',
          'delete:all-products',
          'read:products',
          'manage:system',
        ],
      ],
    ]);

    return permissions.get(role) || [];
  }
}

/**
 * 📦 DTO para información de productos
 */
export class ProductDTO {
  constructor(product) {
    this.id = product._id;
    this.title = product.title;
    this.description = product.description;
    this.price = product.price;
    this.stock = product.stock;
    this.category = product.category;
    this.code = product.code;
    this.thumbnails = product.thumbnails;
    this.status = product.status;
    this.owner = product.owner
      ? {
          id: product.owner._id,
          name: `${product.owner.first_name} ${product.owner.last_name}`,
          email: product.owner.email,
        }
      : null;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }

  static fromProduct(product) {
    return new ProductDTO(product);
  }

  /**
   * DTO simplificado para listas de productos
   */
  static productList(product) {
    return {
      id: product._id,
      title: product.title,
      price: product.price,
      stock: product.stock,
      category: product.category,
      thumbnail: product.thumbnails?.[0] || null,
      status: product.status,
    };
  }
}

/**
 * 📦 DTO para información de carritos
 */
export class CartDTO {
  constructor(cart) {
    this.id = cart._id;
    this.user = cart.user
      ? {
          id: cart.user._id,
          name: `${cart.user.first_name} ${cart.user.last_name}`,
          email: cart.user.email,
        }
      : null;
    this.products =
      cart.products?.map((item) => ({
        product: {
          id: item.product._id,
          title: item.product.title,
          price: item.product.price,
          thumbnail: item.product.thumbnail,
          stock: item.product.stock,
        },
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })) || [];
    this.total = this.products.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalItems = this.products.reduce((sum, item) => sum + item.quantity, 0);
    this.status = cart.status;
    this.createdAt = cart.createdAt;
    this.updatedAt = cart.updatedAt;
  }

  static fromCart(cart) {
    return new CartDTO(cart);
  }
}
