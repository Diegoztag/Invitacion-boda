const js = require('@eslint/js');

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
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                setImmediate: 'readonly',
                setInterval: 'readonly',
                setTimeout: 'readonly',
                clearImmediate: 'readonly',
                clearInterval: 'readonly',
                clearTimeout: 'readonly'
            }
        },
        rules: {
            'no-console': 'warn',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'prefer-const': 'error',
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
            'semi': ['error', 'always'],
            'indent': ['error', 4],
            'quotes': ['error', 'single'],
            'no-trailing-spaces': 'error',
            'comma-dangle': ['error', 'never'],
            'no-var': 'error',
            'arrow-spacing': 'error',
            'keyword-spacing': 'error'
        }
    }
];
