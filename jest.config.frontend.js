/** @type {import('jest').Config} */
const config = {
    displayName: 'frontend',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/frontend'],
    testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
    moduleDirectories: ['node_modules', 'frontend'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/frontend/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/frontend/jest.setup.js'],
    collectCoverageFrom: [
        'frontend/**/*.js',
        '!frontend/**/*.test.js',
        '!frontend/jest.setup.js',
        '!frontend/**/__tests__/**',
        '!frontend/img/**',
        '!frontend/**/node_modules/**'
    ],
    coverageThreshold: {
        'frontend/js/core/services': {
            branches: 75,
            functions: 80,
            lines: 80,
            statements: 80
        },
        'frontend/js/presentation/components/ui': {
            branches: 70,
            functions: 75,
            lines: 75,
            statements: 75
        },
        'frontend/js/presentation/controllers': {
            branches: 60,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    verbose: true,
    clearMocks: true
};

export default config;
