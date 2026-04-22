/**
 * Test Environment Variables
 * Variables de entorno específicas para testing
 */

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.CSV_INVITATIONS_PATH = './test-data/invitations.csv';
process.env.CSV_CONFIRMATIONS_PATH = './test-data/confirmations.csv';
process.env.SQLITE_DB_PATH = ':memory:';
