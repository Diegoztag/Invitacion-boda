/**
 * Auth integration tests
 * Verifica el flujo de login y acceso a rutas protegidas usando supertest
 */

const request = require('supertest');
const Server = require('../../server');

let serverInstance;
let app;

beforeAll(() => {
    serverInstance = new Server();
    app = serverInstance.app;

    // sustituir el repository de invitaciones por un stub minimalista
    const fakeInvRepo = {
        getStats: jest.fn().mockResolvedValue({ total: 0, confirmed: 0 })
    };
    serverInstance.container.register('invitationRepository', () => fakeInvRepo, {
        singleton: true
    });
});

describe('Integration /auth and protected routes', () => {
    test('login returns JWT and stats endpoint respects auth', async () => {
        // obtener contraseña actual de middleware para asegurarnos de usar la correcta
        const authMiddleware = serverInstance.container.resolve('authMiddleware');
        const username = authMiddleware.adminUsername;
        const password = authMiddleware.adminPassword;

        const loginRes = await request(app).post('/api/v1/auth/login').send({ username, password });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.success).toBe(true);
        expect(loginRes.body.token).toBeDefined();

        const token = loginRes.body.token;

        // acceso sin token debe fallar
        const noAuth = await request(app).get('/api/v1/stats');
        expect(noAuth.status).toBe(401);

        // acceso con token debe tener éxito
        const withAuth = await request(app)
            .get('/api/v1/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(withAuth.status).toBe(200);
        expect(withAuth.body.success).toBe(true);
        expect(withAuth.body.data).toHaveProperty('stats');
    });
});
