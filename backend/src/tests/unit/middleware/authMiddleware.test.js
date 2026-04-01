/**
 * AuthMiddleware Unit Tests
 * Verifica la lógica de generación/verificación de JWT y autenticación básica
 */

const jwt = require('jsonwebtoken');
const AuthMiddleware = require('../../../presentation/middleware/authMiddleware');

let auth;
let logger;

const createMockLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    startOperation: jest.fn(() => jest.fn())
});

beforeEach(() => {
    logger = createMockLogger();
    auth = new AuthMiddleware(logger);

    // fijar secret para reproducibilidad
    auth.secretKey = 'test-secret';
});

describe('AuthMiddleware (unit)', () => {
    describe('generateToken / verifyJWT', () => {
        test('should create and validate a token', () => {
            const token = auth.generateToken({ id: 'admin', role: 'admin' });
            expect(typeof token).toBe('string');

            // build fake express objects
            const req = {};
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();
            const endOp = jest.fn();

            auth.verifyJWT(token, req, res, next, endOp);

            expect(req.user).toHaveProperty('id', 'admin');
            expect(next).toHaveBeenCalled();
        });

        test('should reject invalid token', () => {
            const req = {};
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();
            const endOp = jest.fn();

            auth.verifyJWT('not-a-token', req, res, next, endOp);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });

        test('should reject expired token', () => {
            const expiredToken = jwt.sign(
                { exp: Math.floor(Date.now() / 1000) - 10 },
                auth.secretKey
            );

            const req = {};
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();
            const endOp = jest.fn();

            auth.verifyJWT(expiredToken, req, res, next, endOp);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, error: 'Token expirado' })
            );
        });
    });

    describe('verifyBasicAuth', () => {
        test('should accept correct credentials', () => {
            const credentials = Buffer.from('admin:' + auth.adminPassword).toString('base64');
            const req = {};
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();
            const endOp = jest.fn();

            auth.verifyBasicAuth(credentials, req, res, next, endOp);

            expect(req.user).toBeDefined();
            expect(next).toHaveBeenCalled();
        });

        test('should reject wrong credentials', () => {
            const credentials = Buffer.from('admin:wrong').toString('base64');
            const req = {};
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();
            const endOp = jest.fn();

            auth.verifyBasicAuth(credentials, req, res, next, endOp);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('login endpoint', () => {
        test('should return token with valid creds', () => {
            const req = {
                body: { username: 'admin', password: auth.adminPassword },
                ip: '127.0.0.1'
            };
            const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

            auth.login(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, token: expect.any(String) })
            );
        });

        test('should reject missing fields', () => {
            const req = { body: {}, ip: '127.0.0.1' };
            const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

            auth.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('requirePermissions', () => {
        test('allows when permission exists', () => {
            const middleware = auth.requirePermissions(['read']);
            const req = { user: { permissions: ['read', 'write'] } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('blocks when permission missing', () => {
            const middleware = auth.requirePermissions(['delete']);
            const req = { user: { permissions: ['read'] } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('authenticate', () => {
        test('should authenticate with valid token', () => {
            const token = auth.generateToken({ id: 'admin', role: 'admin' });
            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            auth.authenticate(req, res, next);

            expect(req.user).toHaveProperty('id', 'admin');
            expect(next).toHaveBeenCalled();
        });
    });
});
