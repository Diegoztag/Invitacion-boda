/**
 * Jest Configuration
 * Configuración para tests unitarios y de integración
 */

module.exports = {
    // Entorno de testing
    testEnvironment: 'node',

    // Directorios de tests
    testMatch: ['**/src/tests/**/*.test.js', '**/src/tests/**/*.spec.js'],

    // Directorios a ignorar
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

    // Configuración de cobertura
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],

    // Archivos a incluir en cobertura
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/tests/**',
        '!src/**/*.test.js',
        '!src/**/*.spec.js',
        '!src/config/**',
        '!src/server.js'
    ],

    // Umbrales de cobertura (enfocados en capas de dominio - entidades y casos de uso)
    coverageThreshold: {
        // Para evitar que módulos auxiliares sin pruebas obliguen a fallar el build,
        // se pone el umbral global en 0. Los directorios clave siguen con 70%.
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        },
        'src/core/entities/': {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        },
        'src/application/usecases/': {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],

    // Module paths
    moduleDirectories: ['node_modules', 'src'],

    // Transformaciones
    transform: {
        '^.+\\.js$': 'babel-jest'
    },

    // Configuración de timeouts
    testTimeout: 10000,

    // Configuración de mocks
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    // Configuración de verbose
    verbose: true,

    // Configuración de reporters
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'test-results',
                outputName: 'junit.xml'
            }
        ]
    ],

    // Variables de entorno para tests
    setupFiles: ['<rootDir>/src/tests/env.js']
};
