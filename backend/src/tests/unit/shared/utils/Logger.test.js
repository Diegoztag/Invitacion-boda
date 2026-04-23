const Logger = require('../../../../shared/utils/Logger');
const fs = require('fs').promises;

jest.mock('fs', () => {
    const actualFs = jest.requireActual('fs');
    return {
        ...actualFs,
        promises: {
            ...actualFs.promises,
            readdir: jest.fn(),
            stat: jest.fn(),
            unlink: jest.fn()
        }
    };
});

describe('Logger', () => {
    let logger;

    beforeEach(() => {
        jest.clearAllMocks();
        // Create logger with console disabled to avoid noise during tests
        logger = new Logger({ enableConsole: false, enableFile: false });

        // Spy on the internal winstonLogger methods
        jest.spyOn(logger.winstonLogger, 'log').mockImplementation(() => {});
        jest.spyOn(logger.winstonLogger, 'child').mockReturnValue(logger.winstonLogger);
        jest.spyOn(logger.winstonLogger, 'isLevelEnabled').mockReturnValue(true);
    });

    describe('constructor', () => {
        it('should initialize with default options', () => {
            const defaultLogger = new Logger({ enableConsole: false }); // disable console for tests
            expect(defaultLogger.level).toBe('info');
            expect(defaultLogger.enableFile).toBe(false);
        });

        it('should initialize with custom options', () => {
            const customLogger = new Logger({
                level: 'debug',
                enableConsole: false,
                enableFile: true,
                filePath: './custom.log',
                serviceName: 'test-service'
            });

            expect(customLogger.level).toBe('debug');
            expect(customLogger.enableConsole).toBe(false);
            expect(customLogger.enableFile).toBe(true);
            expect(customLogger.filePath).toBe('./custom.log');
            expect(customLogger.serviceName).toBe('test-service');
        });
    });

    describe('logging methods', () => {
        it('should log error', () => {
            logger.error('Test error', { meta: 'data' });
            expect(logger.winstonLogger.log).toHaveBeenCalledWith('error', 'Test error', {
                meta: 'data'
            });
        });

        it('should log error with Error object', () => {
            const error = new Error('Something went wrong');
            logger.error('Test error', { error });

            expect(logger.winstonLogger.log).toHaveBeenCalledWith(
                'error',
                'Test error',
                expect.objectContaining({
                    error,
                    stack: error.stack,
                    errorName: error.name,
                    errorMessage: error.message
                })
            );
        });

        it('should log warn', () => {
            logger.warn('Test warn', { meta: 'data' });
            expect(logger.winstonLogger.log).toHaveBeenCalledWith('warn', 'Test warn', {
                meta: 'data'
            });
        });

        it('should log info', () => {
            logger.info('Test info', { meta: 'data' });
            expect(logger.winstonLogger.log).toHaveBeenCalledWith('info', 'Test info', {
                meta: 'data'
            });
        });

        it('should log debug', () => {
            logger.debug('Test debug', { meta: 'data' });
            expect(logger.winstonLogger.log).toHaveBeenCalledWith('debug', 'Test debug', {
                meta: 'data'
            });
        });

        it('should log trace (silly)', () => {
            logger.trace('Test trace', { meta: 'data' });
            expect(logger.winstonLogger.log).toHaveBeenCalledWith('silly', 'Test trace', {
                meta: 'data'
            });
        });
    });

    describe('specialized logging methods', () => {
        it('should start and complete operation', () => {
            const endOperation = logger.startOperation('testOp', { context: 'data' });

            expect(logger.winstonLogger.log).toHaveBeenCalledWith(
                'info',
                'Starting operation: testOp',
                expect.objectContaining({
                    operation: 'testOp',
                    context: 'data'
                })
            );

            endOperation({ result: 'success' });

            expect(logger.winstonLogger.log).toHaveBeenCalledWith(
                'info',
                'Completed operation: testOp',
                expect.objectContaining({
                    operation: 'testOp',
                    result: 'success',
                    duration: expect.any(String)
                })
            );
        });

        it('should log HTTP request', () => {
            const req = {
                method: 'GET',
                url: '/api/test',
                ip: '127.0.0.1',
                headers: { 'user-agent': 'jest' }
            };
            const res = { statusCode: 200, get: jest.fn().mockReturnValue('100') };

            logger.logHttpRequest(req, res, 50);

            expect(logger.winstonLogger.log).toHaveBeenCalledWith(
                'info',
                'HTTP GET /api/test',
                expect.objectContaining({
                    method: 'GET',
                    url: '/api/test',
                    statusCode: 200,
                    duration: '50ms',
                    ip: '127.0.0.1',
                    userAgent: 'jest',
                    contentLength: '100'
                })
            );
        });

        it('should log HTTP request as warn if status >= 400', () => {
            const req = { method: 'POST', url: '/api/test', ip: '127.0.0.1', headers: {} };
            const res = { statusCode: 404, get: jest.fn() };

            logger.logHttpRequest(req, res, 50);

            expect(logger.winstonLogger.log).toHaveBeenCalledWith(
                'warn',
                'HTTP POST /api/test',
                expect.any(Object)
            );
        });

        it('should log database error', () => {
            const error = new Error('DB Error');
            logger.logDatabaseError('query', error, { table: 'users' });

            expect(logger.winstonLogger.log).toHaveBeenCalledWith(
                'error',
                'Database operation failed: query',
                expect.objectContaining({
                    operation: 'query',
                    error,
                    table: 'users'
                })
            );
        });

        it('should log validation error', () => {
            logger.logValidationError('email', 'invalid format', 'test@', { userId: 1 });

            expect(logger.winstonLogger.log).toHaveBeenCalledWith(
                'warn',
                'Validation failed for field: email',
                expect.objectContaining({
                    field: 'email',
                    reason: 'invalid format',
                    value: 'test@',
                    userId: 1
                })
            );
        });

        it('should log security event', () => {
            logger.logSecurityEvent('login_failed', { ip: '127.0.0.1' });

            expect(logger.winstonLogger.log).toHaveBeenCalledWith(
                'warn',
                'Security event: login_failed',
                expect.objectContaining({
                    securityEvent: 'login_failed',
                    ip: '127.0.0.1'
                })
            );
        });

        it('should log metric', () => {
            logger.logMetric('response_time', 150, 'ms', { endpoint: '/api' });

            expect(logger.winstonLogger.log).toHaveBeenCalledWith(
                'info',
                'Metric: response_time',
                expect.objectContaining({
                    metric: 'response_time',
                    value: 150,
                    unit: 'ms',
                    endpoint: '/api'
                })
            );
        });
    });

    describe('utility methods', () => {
        it('should create a child logger', () => {
            const childLogger = logger.child({ requestId: '123' });

            expect(childLogger).toBeInstanceOf(Logger);
            expect(logger.winstonLogger.child).toHaveBeenCalledWith({ requestId: '123' });
        });

        it('should set level', () => {
            logger.setLevel('debug');

            expect(logger.level).toBe('debug');
            expect(logger.winstonLogger.level).toBe('debug');
        });

        it('should check if level is enabled', () => {
            const isEnabled = logger.isLevelEnabled('info');

            expect(logger.winstonLogger.isLevelEnabled).toHaveBeenCalledWith('info');
            expect(isEnabled).toBe(true);
        });
    });

    describe('cleanOldLogs', () => {
        beforeEach(() => {
            fs.readdir.mockReset();
            fs.stat.mockReset();
            fs.unlink.mockReset();
        });

        it('should do nothing if file logging is disabled', async () => {
            await logger.cleanOldLogs();
            expect(fs.readdir).not.toHaveBeenCalled();
        });

        it('should delete old log files', async () => {
            const fileLogger = new Logger({
                enableFile: true,
                filePath: './logs/app.log',
                enableConsole: false
            });
            jest.spyOn(fileLogger.winstonLogger, 'log').mockImplementation(() => {});

            const oldDate = new Date(0); // 1970-01-01

            fs.readdir.mockResolvedValue(['old.log', 'new.log']);
            fs.stat.mockResolvedValue({ mtime: oldDate });
            fs.unlink.mockResolvedValue();

            await fileLogger.cleanOldLogs(30);

            expect(fileLogger.winstonLogger.log).not.toHaveBeenCalledWith(
                'error',
                expect.any(String),
                expect.any(Object)
            );
            expect(fs.readdir).toHaveBeenCalled();
            expect(fs.stat).toHaveBeenCalled();
            expect(fs.unlink).toHaveBeenCalled();
        });

        it('should handle errors during cleanup', async () => {
            const fileLogger = new Logger({
                enableFile: true,
                filePath: './logs/app.log',
                enableConsole: false
            });
            jest.spyOn(fileLogger.winstonLogger, 'log').mockImplementation(() => {});

            const error = new Error('Read error');
            fs.readdir.mockRejectedValue(error);

            await fileLogger.cleanOldLogs();

            expect(fileLogger.winstonLogger.log).toHaveBeenCalledWith(
                'error',
                'Error cleaning old logs',
                expect.objectContaining({
                    error
                })
            );
        });
    });
});
