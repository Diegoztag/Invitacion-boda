/**
 * Jest Configuration for Unit Tests
 */

const baseConfig = require('./jest.config.js');

module.exports = {
    ...baseConfig,
    displayName: 'unit',
    testMatch: ['**/src/tests/unit/**/*.test.js', '**/src/tests/unit/**/*.spec.js'],
    coverageDirectory: 'coverage/unit'
};
