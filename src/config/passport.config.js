import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import User from '../models/User.model.js';
import Cart from '../models/Cart.model.js';
import {logger} from '../utils/logger.util.js';

/**
 * 🔐 Configuración de estrategias de Passport
 */
class PassportConfig {
  static configurePassport(app) {
    // Inicializar Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Configurar estrategias
    this.configureLocalStrategy();
    this.configureSerializeUser();
    this.configureDeserializeUser();

    logger.auth('🛡️ Passport configurado correctamente');
  }

  /**
   * 🔑 Estrategia Local para login
   */
  static configureLocalStrategy() {
    passport.use(
      'local-login',
      new LocalStrategy(
        {
          usernameField: 'email',
          passwordField: 'password',
        },
        async (email, password, done) => {
          try {
            logger.auth(`🔍 Intentando autenticar usuario: ${email}`);

            // Buscar usuario por email
            const user = await User.findByEmail(email);
            if (!user) {
              logger.warning(`⚠️ Usuario no encontrado: ${email}`);
              return done(null, false, { message: 'Email o contraseña incorrectos' });
            }

            // Verificar contraseña
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
              logger.warning(`🚫 Contraseña incorrecta para: ${email}`);
              return done(null, false, { message: 'Email o contraseña incorrectos' });
            }

            logger.success(`✅ Usuario autenticado exitosamente: ${email}`);
            return done(null, user);
          } catch (error) {
            logger.error('❌ Error en autenticación:', error);
            return done(error);
          }
        }
      )
    );

    passport.use(
      'local-register',
      new LocalStrategy(
        {
          usernameField: 'email',
          passwordField: 'password',
          passReqToCallback: true,
        },
        async (req, email, password, done) => {
          try {
            const { first_name, last_name, age } = req.body;

            logger.auth(`👤 Intentando registrar nuevo usuario: ${email}`);

            // Verificar si el usuario ya existe
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
              logger.warning(`⚠️ Email ya registrado: ${email}`);
              return done(null, false, { message: 'El email ya está registrado' });
            }

            // Crear nuevo usuario
            const newUser = new User({
              first_name,
              last_name,
              email,
              age: parseInt(age),
              password,
            });

            const savedUser = await newUser.save();

            // Crear carrito para el nuevo usuario
            const newCart = new Cart({
              user: savedUser._id,
              products: [],
            });

            const savedCart = await newCart.save();

            // Actualizar usuario con referencia al carrito
            savedUser.cart = savedCart._id;
            await savedUser.save();

            logger.success(`🎉 Usuario registrado exitosamente: ${email}`);
            return done(null, savedUser);
          } catch (error) {
            logger.error('❌ Error en registro:', error);
            return done(error);
          }
        }
      )
    );
  }

  /**
   * 📦 Pasar a JSON el usuario para la sesión
   */
  static configureSerializeUser() {
    passport.serializeUser((user, done) => {
      logger.debug(`📦 Serializando usuario: ${user._id}`);
      done(null, user._id);
    });
  }

  /**
   * 📤 Pasar a objeto el usuario desde la sesión
   */
  static configureDeserializeUser() {
    passport.deserializeUser(async (id, done) => {
      try {
        logger.debug(`📤 Deserializando usuario: ${id}`);
        const user = await User.findById(id).populate('cart');
        done(null, user);
      } catch (error) {
        logger.error('❌ Error al deserializar usuario:', error);
        done(error);
      }
    });
  }
}

export const configurePassport = PassportConfig.configurePassport.bind(PassportConfig);
