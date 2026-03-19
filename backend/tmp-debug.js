const request = require('supertest');
const Server = require('./src/server');

(async () => {
    const server = new Server();
    const app = server.app;
    await server.ensureDataDirectories();
    await server.initializeRepositories();
    const authMiddleware = server.container.resolve('authMiddleware');

    const loginResp = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: authMiddleware.adminPassword });

    console.log('login', loginResp.status, loginResp.body);

    const token = loginResp.body.token;
    const invitationData = {
        guestNames: ['Juan Pérez', 'María García'],
        numberOfPasses: 2,
        phone: '+1234567890',
        adultPasses: 2,
        childPasses: 0,
        staffPasses: 0
    };

    const resp = await request(app)
        .post('/api/v1/invitations')
        .set('Authorization', `Bearer ${token}`)
        .send(invitationData);

    console.log('create', resp.status, resp.body);
})();
