/**
 * Configuración base consolidada para proyectos de análisis forense
 * Centraliza configuraciones comunes para ESLint, Prettier y Jest
 * Previene duplicación de configuraciones entre proyectos
 */

module.exports = {
  // Configuración base ESLint
  eslint: {
    root: true,
    env: {
      node: true,
      es2022: true,
      jest: true
    },
    extends: ['eslint:recommended'],
    parser: 'espree',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    ignorePatterns: [
      '*.md',
      '*.json',
      'consolidated-reports/',
      'dev-docs/',
      'archive/',
      'docs/',
      'node_modules/'
    ],
    rules: {
      // Reglas de formato (consistentes con Prettier)
      indent: ['warn', 2, { SwitchCase: 1 }],
      'linebreak-style': ['warn', 'unix'],
      quotes: ['warn', 'single'],
      semi: ['warn', 'always'],

      // Reglas de calidad
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-debugger': 'off',
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',

      // Reglas de estilo (deshabilitadas para compatibilidad con Prettier)
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'no-useless-escape': 'off',

      // Reglas críticas para encoding forense
      'no-multiple-empty-lines': 'warn',
      'no-irregular-whitespace': 'error',
      'no-control-regex': 'error'
    },
    overrides: [
      {
        files: ['*.md'],
        rules: {
          'no-irregular-whitespace': 'error'
        }
      }
    ]
  },

  // Configuración base Prettier
  prettier: {
    semi: true,
    trailingComma: 'none',
    singleQuote: true,
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    bracketSpacing: true,
    arrowParens: 'avoid',
    endOfLine: 'lf',
    quoteProps: 'as-needed',
    bracketSameLine: false,
    proseWrap: 'always',
    embeddedLanguageFormatting: 'auto',
    insertPragma: false,
    requirePragma: false,
    htmlWhitespaceSensitivity: 'css',
    vueIndentScriptAndStyle: false,
    overrides: [
      {
        files: '*.md',
        options: {
          proseWrap: 'always',
          printWidth: 100
        }
      }
    ]
  },

  // Configuración base Jest
  jest: {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: [
      'src/**/*.js',
      'consolidated-tests/**/*.js',
      '!consolidated-tests/**/*.test.js',
      '!consolidated-tests/**/*.spec.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    testTimeout: 30000,
    collectCoverage: false
  },

  // Paths comunes para proyectos forense
  paths: {
    root: '<rootDir>',
    source: '<rootDir>/src',
    scripts: '<rootDir>/src/scripts',
    utils: '<rootDir>/src/utils',
    tests: '<rootDir>/consolidated-tests',
    reports: '<rootDir>/consolidated-reports',
    config: '<rootDir>/config',
    docs: '<rootDir>/dev-docs',
    archive: '<rootDir>/archive'
  },

  // Scripts comunes para package.json
  scripts: {
    // Scripts de calidad
    lint: 'eslint src/ consolidated-tests/ --ext .js --max-warnings=0',
    'lint:fix': 'eslint src/ consolidated-tests/ --ext .js --fix',
    format: 'prettier --write src/ consolidated-tests/',
    'format:check': 'prettier --check src/ consolidated-tests/',

    // Scripts de testing
    test: 'jest',
    'test:watch': 'jest --watch',
    'test:coverage': 'jest --coverage',
    'test:corrections':
      'jest consolidated-tests/tdd-corrections.test.js --verbose',

    // Scripts de validación específicos para análisis forense
    'validate-rules':
      'node src/scripts/validate-rules.js config/rules_forense.json',
    'validate-evidence':
      'node src/scripts/validate-evidence.js consolidated-reports/',
    'validate-completeness':
      'node src/scripts/validate-completeness.js config/rules_forense.json consolidated-reports/',
    'check-encoding': 'node src/utils/encoding-validator.js .',
    'check-metrics': 'node src/scripts/check-metrics-consistency.js',

    // Scripts de quality gates
    'quality-gate':
      'npm run lint && npm run format:check && npm run test -- --passWithNoTests',
    'quality-gate-full':
      'npm run quality-gate && npm run validate-rules && npm run validate-evidence && npm run validate-completeness',
    'quality-gate-strict':
      'npm run quality-gate-full && echo "✅ All quality gates passed - Zero technical debt"',

    // Scripts de pre-commit
    'pre-commit':
      'npm run lint && npm run format:check && npm run check-encoding && npm run check-metrics && npm run test:corrections',

    // Scripts de validación completa
    'validate-all':
      'npm run quality-gate-strict && npm run check-encoding && npm run check-metrics'
  },

  // Dependencias comunes para proyectos forense
  dependencies: {
    // Core dependencies (generales)
    // @TODO: Agregar según necesidades específicas del proyecto
  },

  devDependencies: {
    // Herramientas de calidad
    eslint: '^8.45.0',
    prettier: '^3.0.0',
    jest: '^29.6.0'
  },

  // Configuración de engines
  engines: {
    node: '>=16.0.0',
    npm: '>=8.0.0'
  }
};
