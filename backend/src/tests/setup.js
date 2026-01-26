/**
 * Jest Setup
 * Configuración global para tests
 */

// Configurar timezone para tests consistentes
process.env.TZ = 'UTC';

// Mock de console para tests más limpios
global.console = {
    ...console,
    // Silenciar logs durante tests
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Configurar timeouts globales
jest.setTimeout(10000);

// Mock de Date para tests determinísticos
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date = class extends Date {
    constructor(...args) {
        if (args.length === 0) {
            return mockDate;
        }
        return new Date(...args);
    }

    static now() {
        return mockDate.getTime();
    }
};

// Helpers globales para tests
global.createMockLogger = () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    startOperation: jest.fn(() => jest.fn())
});

global.createMockValidationService = () => ({
    validateInvitationData: jest.fn(),
    validateConfirmationData: jest.fn(),
    validateInvitationCode: jest.fn(),
    generateInvitationCode: jest.fn(),
    sanitizeInput: jest.fn()
});

global.createMockRepository = () => ({
    save: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    count: jest.fn(),
    getStats: jest.fn(),
    findPaginated: jest.fn(),
    exportAll: jest.fn(),
    importBatch: jest.fn()
});

// Cleanup después de cada test
afterEach(() => {
    jest.clearAllMocks();
});

// Cleanup después de todos los tests
afterAll(() => {
    jest.restoreAllMocks();
});
