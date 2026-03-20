/**
 * Integration Tests - Create + Confirm Flow
 * Pruebas de integración que validan el flujo completo de crear invitación y confirmar asistencia
 */

const request = require('supertest');
const Server = require('../../server');

describe('Integration - Create + Confirm Flow', () => {
    let app;
    let server;
    let token;
    let createdInvitationCode;

    beforeAll(async () => {
        // Crear servidor de prueba sin iniciar el listener HTTP
        server = new Server();
        app = server.app;

        // Asegurar que la infraestructura de datos esté inicializada (CSV files, etc.)
        await server.ensureDataDirectories();
        await server.initializeRepositories();

        // Obtener token de autenticación para las rutas protegidas
        const authMiddleware = server.container.resolve('authMiddleware');
        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'admin', password: authMiddleware.adminPassword })
            .expect(200);

        token = loginResponse.body.token;
    });

    afterAll(async () => {
        if (server && server.stop) {
            await server.stop();
        }
    });

    test('debe crear invitación exitosamente', async () => {
        const invitationData = {
            guestNames: ['Juan Pérez', 'María García'],
            numberOfPasses: 2,
            phone: '+1234567890',
            adultPasses: 2,
            childPasses: 0,
            staffPasses: 0
        };

        const response = await request(app)
            .post('/api/v1/invitations')
            .set('Authorization', `Bearer ${token}`)
            .send(invitationData);

        if (response.status !== 201) {
            console.log(response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.invitation).toBeDefined();
        expect(response.body.invitation.code).toBeDefined();
        expect(response.body.invitation.guestNames).toEqual(['Juan Pérez', 'María García']);
        expect(response.body.invitation.numberOfPasses).toBe(2);
        expect(response.body.invitation.status).toBe('active');

        // Guardar el código para las siguientes pruebas
        createdInvitationCode = response.body.invitation.code;
    });

    test('debe obtener la invitación creada', async () => {
        const response = await request(app)
            .get(`/api/v1/invitations/${createdInvitationCode}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.invitation.code).toBe(createdInvitationCode);
        expect(response.body.invitation.guestNames).toEqual(['Juan Pérez', 'María García']);
        expect(response.body.invitation.confirmed).toBe(false);
    });

    test('debe confirmar asistencia para la invitación', async () => {
        const confirmationData = {
            willAttend: true,
            attendingGuests: 2,
            attendingNames: ['Juan Pérez', 'María García'],
            phone: '+1234567890',
            dietaryRestrictions: 'Sin restricciones',
            message: '¡Felicidades! Estamos muy emocionados.'
        };

        const response = await request(app)
            .post(`/api/v1/confirmations/${createdInvitationCode}`)
            .send(confirmationData)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.invitation).toBeDefined();
        expect(response.body.confirmation).toBeDefined();
        expect(response.body.invitation.confirmed).toBe(true);
        expect(response.body.confirmation.willAttend).toBe(true);
        expect(response.body.confirmation.attendingGuests).toBe(2);
        expect(response.body.confirmation.attendingNames).toEqual(['Juan Pérez', 'María García']);
    });

    test('debe obtener la invitación actualizada después de confirmar', async () => {
        const response = await request(app)
            .get(`/api/v1/invitations/${createdInvitationCode}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.invitation.confirmed).toBe(true);
        expect(response.body.invitation.confirmedPasses).toBe(2);
        expect(response.body.invitation.attendingNames).toEqual(['Juan Pérez', 'María García']);
        expect(response.body.invitation.dietaryRestrictionsNames).toBe('Sin restricciones');
        expect(response.body.invitation.generalMessage).toBe(
            '¡Felicidades! Estamos muy emocionados.'
        );
    });

    test('debe obtener estadísticas actualizadas', async () => {
        const response = await request(app)
            .get('/api/v1/stats')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.stats).toBeDefined();
        expect(response.body.stats.invitations.total).toBeGreaterThanOrEqual(1);
        expect(response.body.stats.invitations.confirmed).toBeGreaterThanOrEqual(1);
        expect(response.body.stats.confirmations.totalConfirmedGuests).toBeGreaterThanOrEqual(2);
    });

    test('debe fallar al confirmar invitación inexistente', async () => {
        const confirmationData = {
            willAttend: false,
            attendingGuests: 0,
            message: 'No podemos asistir'
        };

        const response = await request(app)
            .post('/api/v1/confirmations/NONEXISTENT')
            .send(confirmationData)
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invitación no encontrada');
    });

    test('debe fallar al confirmar invitación ya confirmada', async () => {
        const confirmationData = {
            willAttend: false,
            attendingGuests: 0,
            message: 'Cambio de opinión'
        };

        const response = await request(app)
            .post(`/api/v1/confirmations/${createdInvitationCode}`)
            .send(confirmationData)
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('ya ha sido confirmada');
    });

    test('debe manejar confirmación negativa', async () => {
        // Crear otra invitación para probar confirmación negativa
        const invitationData = {
            guestNames: ['Pedro López'],
            numberOfPasses: 1,
            phone: '+0987654321'
        };

        const createResponse = await request(app)
            .post('/api/v1/invitations')
            .set('Authorization', `Bearer ${token}`)
            .send(invitationData)
            .expect(201);

        const newCode = createResponse.body.invitation.code;

        // Confirmar que no asiste
        const confirmationData = {
            willAttend: false,
            attendingGuests: 0,
            message: 'Lo sentimos, no podremos asistir'
        };

        const confirmResponse = await request(app)
            .post(`/api/v1/confirmations/${newCode}`)
            .send(confirmationData)
            .expect(201);

        expect(confirmResponse.body.success).toBe(true);
        expect(confirmResponse.body.confirmation.willAttend).toBe(false);
        expect(confirmResponse.body.confirmation.attendingGuests).toBe(0);
        expect(confirmResponse.body.message).toBe('Confirmación de no asistencia registrada');
    });

    test('debe validar datos de confirmación', async () => {
        // Crear otra invitación
        const invitationData = {
            guestNames: ['Ana Rodríguez'],
            numberOfPasses: 1
        };

        const createResponse = await request(app)
            .post('/api/v1/invitations')
            .set('Authorization', `Bearer ${token}`)
            .send(invitationData)
            .expect(201);

        const newCode = createResponse.body.invitation.code;

        // Intentar confirmar con datos inválidos
        const invalidConfirmationData = {
            willAttend: 'true', // Debería ser boolean
            attendingGuests: -1, // No puede ser negativo
            attendingNames: 'Solo un string' // Debería ser array
        };

        const response = await request(app)
            .post(`/api/v1/confirmations/${newCode}`)
            .send(invalidConfirmationData)
            .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
    });
});
