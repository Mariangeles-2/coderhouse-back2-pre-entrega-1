import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-node';
import prettierPlugin from 'eslint-plugin-prettier';
import promisePlugin from 'eslint-plugin-promise';
import securityPlugin from 'eslint-plugin-security';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

export default [
  // Configuración base recomendada
  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },

    plugins: {
      prettier: prettierPlugin,
      import: importPlugin,
      node: nodePlugin,
      promise: promisePlugin,
      security: securityPlugin,
      'unused-imports': unusedImportsPlugin,
    },

    rules: {
      // 🔧 Prettier integration
      'prettier/prettier': [
        'error',
        {
          semi: true,
          singleQuote: true,
          trailingComma: 'es5',
          tabWidth: 2,
          printWidth: 100,
          endOfLine: 'lf',
        },
      ],

      // 🧹 Variables y imports sin usar
      'no-unused-vars': 'off', // Desactivamos la regla base
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // 📦 Import/Export optimizations
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unused-modules': 'off', // Desactivado por problemas con archivos de rutas
      'import/extensions': ['error', 'always', { ignorePackages: true }],
      'import/no-relative-parent-imports': 'off', // Completamente desactivado

      // 🎯 Manejo de errores y excepciones
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-return-await': 'error',
      'require-await': 'error',
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',

      // 🔒 Seguridad
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',

      // 🎪 Promesas
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-callback-in-promise': 'warn',
      'promise/avoid-new': 'warn',
      'promise/no-return-in-finally': 'error',

      // 📝 Calidad de código
      'no-console': 'off', // Permitimos console para logging
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      'template-curly-spacing': ['error', 'never'],
      'prefer-destructuring': [
        'error',
        {
          array: true,
          object: true,
        },
        {
          enforceForRenamedProperties: false,
        },
      ],

      // 🎨 Estilo y consistencia
      'no-multiple-empty-lines': [
        'error',
        {
          max: 2,
          maxEOF: 1,
          maxBOF: 0,
        },
      ],
      'eol-last': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],

      // 🚫 Código problemático
      'no-duplicate-imports': 'error',
      'no-useless-catch': 'error',
      'no-useless-return': 'error',
      'no-useless-rename': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-lonely-if': 'error',
      'no-else-return': 'error',
      'no-unneeded-ternary': 'error',
      'prefer-exponentiation-operator': 'error',
      'prefer-numeric-literals': 'error',

      // 🎪 Funciones
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-confusing-arrow': 'error',

      // 🔄 Complejidad
      complexity: ['warn', 10],
      'max-depth': ['warn', 4],
      'max-nested-callbacks': ['warn', 3],
      'max-params': ['warn', 5],
      'max-statements': ['warn', 20],
    },

    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.json'],
        },
      },
    },
  },

  // Configuración específica para archivos de configuración
  {
    files: ['**/*.config.js', 'eslint.config.js'],
    rules: {
      'import/no-unused-modules': 'off',
    },
  },

  // Ignorar archivos
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '*.min.js'],
  },

  // Prettier debe ir al final para sobrescribir reglas conflictivas
  prettierConfig,
];
