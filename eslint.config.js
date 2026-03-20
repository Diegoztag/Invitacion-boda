const globals = require('globals');

module.exports = [
    {
        ignores: ['node_modules', 'dist', 'build', 'coverage', '.git']
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.browser
            }
        },
        rules: {
            'no-console': 'warn',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'prefer-const': 'error',
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all'],
            semi: ['error', 'always'],
            indent: ['error', 4, { SwitchCase: 1 }],
            quotes: ['error', 'single'],
            'no-trailing-spaces': 'error',
            'comma-dangle': ['error', 'never'],
            'no-var': 'error',
            'arrow-spacing': 'error',
            'keyword-spacing': 'error',
            'space-before-blocks': 'error'
        }
    }
];
