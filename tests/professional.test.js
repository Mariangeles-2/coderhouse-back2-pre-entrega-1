#!/usr/bin/env node

/**
 * 🧪 Suite de Testing Profesional para Ecommerce Backend
 * Framework de testing robusto y profesional usando Mocha-style con Supertest
 */

import { spawn } from 'child_process';

import axios from 'axios';

const BASE_URL = 'http://localhost:8080';
let serverProcess = null;

// Configurar axios para testing
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: () => true,
});

class ProfessionalTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.total = 0;
    this.tokens = {};
    this.users = {};
    this.testData = {};
    this.startTime = Date.now();
  }

  /**
   * 🚀 Ejecutar suite completa de pruebas
   */
  async runAll() {
    console.log('\n🧪 ECOMMERCE BACKEND - SUITE DE TESTING PROFESIONAL');
    console.log('='.repeat(65));
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    console.log(`🔧 Stack: Node.js + Express + MongoDB + JWT`);
    console.log('='.repeat(65));

    try {
      await this.ensureServerRunning();

      // Ejecutar todas las categorías de pruebas
      await this.runSystemHealthTests();
      await this.runAuthenticationTests();
      await this.runAuthorizationTests();
      await this.runProductManagementTests();
      await this.runCartManagementTests();
      await this.runSecurityTests();
      await this.runDataIntegrityTests();

      this.printFinalReport();
      await this.cleanup();
    } catch (error) {
      console.error('\n❌ ERROR CRÍTICO EN TESTING:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * 🔧 Asegurar que el servidor esté funcionando
   */
  async ensureServerRunning() {
    console.log('\n🔧 VERIFICANDO SERVIDOR...');

    try {
      const response = await api.get('/');
      if (response.status === 200) {
        console.log('✅ Servidor ya está ejecutándose');
        return;
      }
    } catch (error) {
      // Servidor no disponible, necesitamos iniciarlo
    }

    console.log('🚀 Iniciando servidor para testing...');
    await this.startTestServer();
  }

  /**
   * 🚀 Iniciar servidor de testing
   */
  async startTestServer() {
    return new Promise((resolve, reject) => {
      serverProcess = spawn('node', ['src/app.js'], {
        cwd: process.cwd(),
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Timeout esperando servidor'));
        }
      }, 15000);

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('API disponible en') && !serverReady) {
          serverReady = true;
          clearTimeout(timeout);
          console.log('✅ Servidor de testing iniciado correctamente');
          setTimeout(resolve, 2000); // Dar tiempo extra para estabilización
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error('🚨 Error del servidor:', data.toString());
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        if (!serverReady) {
          reject(error);
        }
      });
    });
  }

  /**
   * 🏥 Pruebas de salud del sistema
   */
  async runSystemHealthTests() {
    console.log('\n🏥 PRUEBAS DE SALUD DEL SISTEMA');
    console.log('-'.repeat(40));

    await this.test('Servidor responde correctamente', async () => {
      const response = await api.get('/');
      this.assert(response.status === 200, 'Status 200');
      this.assert(response.data.success === true, 'Success true');
      this.assert(response.data.version === '2.0.0', 'Versión correcta');
      this.assert(response.data.endpoints, 'Endpoints definidos');
    });

    await this.test('Documentación Swagger disponible', async () => {
      const response = await api.get('/api-docs.json');
      this.assert(response.status === 200, 'Swagger JSON disponible');
      this.assert(response.data.openapi || response.data.swagger, 'Especificación válida');
    });
  }

  /**
   * 🔐 Pruebas de autenticación
   */
  async runAuthenticationTests() {
    console.log('\n🔐 PRUEBAS DE AUTENTICACIÓN');
    console.log('-'.repeat(40));

    const timestamp = Date.now();
    this.users = {
      normal: {
        first_name: 'Usuario',
        last_name: 'Normal',
        email: `user-${timestamp}@test.com`,
        age: 25,
        password: 'TestPassword123!',
      },
      premium: {
        first_name: 'Usuario',
        last_name: 'Premium',
        email: `premium-${timestamp}@test.com`,
        age: 30,
        password: 'PremiumPassword123!',
      },
      admin: {
        first_name: 'Usuario',
        last_name: 'Admin',
        email: `admin-${timestamp}@test.com`,
        age: 35,
        password: 'AdminPassword123!',
      },
    };

    // Registrar todos los tipos de usuario
    for (const [role, userData] of Object.entries(this.users)) {
      await this.test(`Registro de usuario ${role}`, async () => {
        const response = await api.post('/auth/register', userData);
        this.assert(response.status === 201, `Status 201 para ${role}`);
        this.assert(response.data.success === true, 'Success true');
        this.assert(response.data.user.email === userData.email, 'Email correcto');
        this.assert(!response.data.user.password, 'Sin contraseña en DTO');
        this.assert(Array.isArray(response.data.user.permissions), 'Permisos incluidos');

        // Verificar rol correcto
        const expectedRole = role === 'normal' ? 'user' : role;
        this.assert(response.data.user.role === expectedRole, `Rol ${expectedRole} asignado`);
      });

      await this.test(`Login de usuario ${role}`, async () => {
        const response = await api.post('/auth/login', {
          email: userData.email,
          password: userData.password,
        });
        this.assert(response.status === 200, 'Status 200');
        this.assert(response.data.success === true, 'Success true');
        this.assert(response.data.tokens?.accessToken, 'Access token presente');
        this.assert(response.data.tokens?.refreshToken, 'Refresh token presente');
        this.assert(!response.data.user.password, 'Sin contraseña en respuesta');

        this.tokens[role] = response.data.tokens.accessToken;
      });
    }

    // Pruebas de errores
    await this.test('Registro con email duplicado falla', async () => {
      const response = await api.post('/auth/register', this.users.normal);
      this.assert(response.status === 400, 'Status 400');
      this.assert(response.data.success === false, 'Success false');
    });

    await this.test('Login con credenciales incorrectas falla', async () => {
      const response = await api.post('/auth/login', {
        email: this.users.normal.email,
        password: 'PasswordIncorrecto',
      });
      this.assert(response.status === 401, 'Status 401');
      this.assert(response.data.success === false, 'Success false');
    });

    await this.test('Ruta /current con token válido', async () => {
      const response = await api.get('/auth/current', {
        headers: { Authorization: `Bearer ${this.tokens.normal}` },
      });
      this.assert(response.status === 200, 'Status 200');
      this.assert(response.data.success === true, 'Success true');
      this.assert(!response.data.user.password, 'Sin contraseña en DTO');
      this.assert(response.data.user.fullName, 'Nombre completo calculado');
      this.assert(response.data.user.permissions, 'Permisos incluidos');
    });
  }

  /**
   * 👥 Pruebas de autorización por roles
   */
  async runAuthorizationTests() {
    console.log('\n👥 PRUEBAS DE AUTORIZACIÓN POR ROLES');
    console.log('-'.repeat(40));

    // Usuario normal NO puede crear productos
    await this.test('Usuario normal NO puede crear productos', async () => {
      const productData = {
        title: 'Producto Test User',
        description: 'No debería poder crearse',
        price: 100,
        stock: 10,
        category: 'electronics',
      };

      const response = await api.post('/api/products', productData, {
        headers: { Authorization: `Bearer ${this.tokens.normal}` },
      });
      this.assert(response.status === 403, 'Status 403 Forbidden');
      this.assert(response.data.success === false, 'Success false');
    });

    // Usuario premium PUEDE crear productos
    await this.test('Usuario premium PUEDE crear productos', async () => {
      const productData = {
        title: 'Producto Premium Test',
        description: 'Creado por usuario premium',
        price: 299.99,
        stock: 15,
        category: 'electronics',
        code: `PRM-${Date.now().toString().slice(-8)}`, // ✅ Código corto único
      };

      const response = await api.post('/api/products', productData, {
        headers: { Authorization: `Bearer ${this.tokens.premium}` },
      });

      this.assert(response.status === 201, `Status 201, recibido: ${response.status}`);
      this.assert(response.data.success === true, 'Success true');
      this.assert(response.data.product.title === productData.title, 'Título correcto');

      this.testData.premiumProductId = response.data.product.id;
    });

    // Usuario admin PUEDE crear productos
    await this.test('Usuario admin PUEDE crear productos', async () => {
      const productData = {
        title: 'Producto Admin Test',
        description: 'Creado por administrador',
        price: 499.99,
        stock: 25,
        category: 'electronics',
        code: `ADM-${Date.now().toString().slice(-8)}`, // ✅ Código corto único
      };

      const response = await api.post('/api/products', productData, {
        headers: { Authorization: `Bearer ${this.tokens.admin}` },
      });

      this.assert(response.status === 201, `Status 201, recibido: ${response.status}`);
      this.assert(response.data.success === true, 'Success true');

      this.testData.adminProductId = response.data.product.id;
    });

    // Pruebas de carritos
    await this.test('Usuario normal PUEDE usar carrito', async () => {
      const response = await api.get('/api/carts', {
        headers: { Authorization: `Bearer ${this.tokens.normal}` },
      });
      this.assert(response.status === 200, 'Status 200');
      this.assert(response.data.success === true, 'Success true');
      this.assert(response.data.cart, 'Carrito definido');
      this.assert(Array.isArray(response.data.cart.products), 'Array de productos');
    });

    await this.test('Usuario admin NO puede usar carrito', async () => {
      const response = await api.get('/api/carts', {
        headers: { Authorization: `Bearer ${this.tokens.admin}` },
      });
      this.assert(response.status === 403, 'Status 403 Forbidden');
      this.assert(response.data.success === false, 'Success false');
    });

    await this.test('Usuario premium NO puede usar carrito', async () => {
      const response = await api.get('/api/carts', {
        headers: { Authorization: `Bearer ${this.tokens.premium}` },
      });
      this.assert(response.status === 403, 'Status 403 Forbidden esperado'); // ✅ CORRECTO
      this.assert(response.data.success === false, 'Success false esperado'); // ✅ CORRECTO
    });
  }

  /**
   * 🛍️ Pruebas de gestión de productos
   */
  async runProductManagementTests() {
    console.log('\n🛍️ PRUEBAS DE GESTIÓN DE PRODUCTOS');
    console.log('-'.repeat(40));

    await this.test('Listar productos es público', async () => {
      const response = await api.get('/api/products');
      this.assert(response.status === 200, 'Status 200');
      this.assert(response.data.success === true, 'Success true');
      this.assert(Array.isArray(response.data.products), 'Array de productos');
      this.assert(response.data.pagination, 'Paginación incluida');
    });

    if (this.testData.premiumProductId) {
      await this.test('Ver producto específico', async () => {
        const response = await api.get(`/api/products/${this.testData.premiumProductId}`);
        this.assert(response.status === 200, 'Status 200');
        this.assert(response.data.success === true, 'Success true');
        this.assert(response.data.product.id === this.testData.premiumProductId, 'ID correcto');
        this.assert(response.data.product.owner, 'Información del owner');
      });
    }

    await this.test('Producto inexistente retorna 404', async () => {
      const response = await api.get('/api/products/64a1b2c3d4e5f6789012345');
      this.assert(response.status === 404, 'Status 404 esperado'); // ✅ CORRECTO
      this.assert(response.data.success === false, 'Success false esperado'); // ✅ CORRECTO
    });

    await this.test('Crear producto con datos inválidos falla', async () => {
      const invalidProduct = {
        title: 'A', // Muy corto
        price: -100, // Negativo
        stock: -5, // Negativo
      };

      const response = await api.post('/api/products', invalidProduct, {
        headers: { Authorization: `Bearer ${this.tokens.admin}` },
      });
      this.assert(response.status === 400, 'Status 400');
      this.assert(response.data.success === false, 'Success false');
    });
  }

  /**
   * 🛒 Pruebas de gestión de carritos
   */
  async runCartManagementTests() {
    console.log('\n🛒 PRUEBAS DE GESTIÓN DE CARRITOS');
    console.log('-'.repeat(40));

    if (this.testData.adminProductId) {
      await this.test('Agregar producto al carrito', async () => {
        const response = await api.post(
          '/api/carts/product',
          {
            productId: this.testData.adminProductId,
            quantity: 2,
          },
          {
            headers: { Authorization: `Bearer ${this.tokens.normal}` },
          }
        );

        // Puede ser 200 (éxito) o 400 (sin stock/otro error de negocio)
        this.assert([200, 400].includes(response.status), 'Status 200 o 400');

        if (response.status === 200) {
          this.assert(response.data.success === true, 'Success true');
          this.assert(response.data.cart.products.length > 0, 'Producto agregado');
        }
      });
    }
  }

  /**
   * 🛡️ Pruebas de seguridad
   */
  async runSecurityTests() {
    console.log('\n🛡️ PRUEBAS DE SEGURIDAD');
    console.log('-'.repeat(40));

    await this.test('JWT inválido retorna 401', async () => {
      const response = await api.get('/auth/current', {
        headers: { Authorization: 'Bearer token-invalido' },
      });
      this.assert(response.status === 401, 'Status 401');
      this.assert(response.data.success === false, 'Success false');
    });

    await this.test('Acceso sin autenticación a ruta protegida', async () => {
      const response = await api.get('/auth/current');
      this.assert(response.status === 401, 'Status 401');
      this.assert(response.data.success === false, 'Success false');
    });

    await this.test('Ruta inexistente retorna 404', async () => {
      const response = await api.get('/api/ruta-inexistente');
      this.assert(response.status === 404, 'Status 404');
      this.assert(response.data.success === false, 'Success false');
    });
  }

  /**
   * 📊 Pruebas de integridad de datos
   */
  async runDataIntegrityTests() {
    console.log('\n📊 PRUEBAS DE INTEGRIDAD DE DATOS');
    console.log('-'.repeat(40));

    await this.test('DTOs nunca incluyen contraseñas', async () => {
      const response = await api.get('/auth/current', {
        headers: { Authorization: `Bearer ${this.tokens.normal}` },
      });
      this.assert(response.status === 200, 'Status 200');
      this.assert(!response.data.user.password, 'Sin contraseña');
      this.assert(!response.data.user.passwordResetToken, 'Sin token reset');
    });

    await this.test('Permisos incluidos según rol', async () => {
      const response = await api.get('/auth/current', {
        headers: { Authorization: `Bearer ${this.tokens.premium}` },
      });
      this.assert(response.status === 200, 'Status 200');
      this.assert(
        response.data.user.permissions.includes('create:products'),
        'Permiso create:products'
      );
      this.assert(
        !response.data.user.permissions.includes('manage:system'),
        'Sin permiso manage:system'
      );
    });
  }

  /**
   * 🧪 Ejecutar una prueba individual
   */
  async test(description, testFn) {
    this.total++;
    try {
      await testFn();
      this.passed++;
      console.log(`  ✅ ${description}`);
    } catch (error) {
      this.failed++;
      console.log(`  ❌ ${description}`);
      console.log(`     💬 ${error.message}`);
    }
  }

  /**
   * 🔍 Aserción con mensaje descriptivo
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * 🧹 Limpieza de recursos
   */
  async cleanup() {
    if (serverProcess) {
      console.log('\n🧹 Cerrando servidor de testing...');
      serverProcess.kill('SIGTERM');
      serverProcess = null;
    }
  }

  /**
   * 📊 Reporte final detallado
   */
  printFinalReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const percentage = this.total > 0 ? ((this.passed / this.total) * 100).toFixed(1) : 0;

    console.log(`\n${'='.repeat(65)}`);
    console.log('📊 REPORTE FINAL DE TESTING');
    console.log('='.repeat(65));

    console.log(`⏱️  Duración total: ${duration}s`);
    console.log(`📈 Cobertura: ${this.passed}/${this.total} pruebas (${percentage}%)`);
    console.log(`✅ Exitosas: ${this.passed}`);
    console.log(`❌ Fallidas: ${this.failed}`);

    if (this.failed === 0) {
      console.log('\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
      console.log('✅ El sistema está funcionando perfectamente');
      console.log('\n📋 FUNCIONALIDADES VERIFICADAS:');
      console.log('  👤 Autenticación JWT robusta');
      console.log('  🔐 Autorización por roles (user/premium/admin)');
      console.log('  🛍️ Gestión de productos con ownership');
      console.log('  🛒 Carritos personalizados por usuario');
      console.log('  🛡️ Seguridad HTTP y validaciones');
      console.log('  📊 DTOs seguros sin información sensible');
    } else {
      console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON');
      console.log(`🔧 ${this.failed} prueba(s) requieren atención`);
      console.log('📝 Revisar los errores reportados arriba');
    }

    console.log(`\n${'='.repeat(65)}`);

    // Exit code para CI/CD
    if (this.failed > 0) {
      process.exitCode = 1;
    }
  }
}

// Manejo de señales para cleanup
const testSuite = new ProfessionalTestSuite();

process.on('SIGINT', async () => {
  console.log('\n🛑 Interrumpido por usuario');
  await testSuite.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Terminando pruebas');
  await testSuite.cleanup();
  process.exit(0);
});

// Ejecutar la suite
testSuite.runAll().catch(async (error) => {
  console.error('\n❌ Error fatal en testing:', error.message);
  await testSuite.cleanup();
  process.exit(1);
});

export default ProfessionalTestSuite;
