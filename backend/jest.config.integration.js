/**
 * Jest Configuration for Integration Tests
 */

const baseConfig = require('./jest.config.js');

module.exports = {
    ...baseConfig,
    displayName: 'integration',
    testMatch: ['**/src/tests/integration/**/*.test.js', '**/src/tests/integration/**/*.spec.js'],
    coverageDirectory: 'coverage/integration',
    // Integration tests might need more time
    testTimeout: 30000
};
