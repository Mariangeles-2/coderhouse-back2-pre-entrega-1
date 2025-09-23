import User from '../models/User.model.js';

/**
 * 🗄️ DAO para operaciones de base de datos de Usuario
 * Implementa el patrón DAO para separar la lógica de acceso a datos
 */
class UserDAO {
  /**
   * Crear un nuevo usuario
   */
  create(userData) {
    return User.create(userData);
  }

  /**
   * Buscar usuario por ID
   */
  findById(id) {
    return User.findById(id);
  }

  /**
   * Buscar usuario por email
   */
  findByEmail(email) {
    return User.findByEmail(email);
  }

  /**
   * Buscar usuario por token de reset
   */
  findByResetToken(token) {
    return User.findByResetToken(token);
  }

  /**
   * Actualizar usuario por ID
   */
  updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true });
  }

  /**
   * Eliminar usuario por ID
   */
  deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  /**
   * Buscar todos los usuarios con paginación
   */
  findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return User.find()
      .select('-password -passwordResetToken -passwordResetExpires')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });
  }

  /**
   * Contar total de usuarios
   */
  count() {
    return User.countDocuments();
  }
}

export default new UserDAO();
