const express = require('express');
const configureInvitationRoutes = require('../../src/presentation/routes/invitationRoutes');

describe('Invitation Routes', () => {
    const controller = {
        searchByName: jest.fn(),
        exportInvitations: jest.fn(),
        importInvitations: jest.fn(),
        getInvitations: jest.fn(),
        createInvitation: jest.fn(),
        restoreInvitation: jest.fn(),
        getInvitation: jest.fn(),
        updateInvitation: jest.fn(),
        deleteInvitation: jest.fn()
    };

    const middleware = {
        cors: jest.fn((req, res, next) => next()),
        rateLimit: jest.fn((req, res, next) => next()),
        requestLogger: jest.fn((req, res, next) => next()),
        authenticate: jest.fn((req, res, next) => next()),
        validateParams: jest.fn((req, res, next) => next()),
        validateQuery: jest.fn((req, res, next) => next()),
        validateBody: jest.fn((req, res, next) => next()),
        sanitizeInput: jest.fn((req, res, next) => next()),
        errorHandler: jest.fn((err, req, res, next) => next(err))
    };

    it('should register all main invitation endpoints with middleware', () => {
        const router = configureInvitationRoutes(controller, middleware);

        const routePaths = router.stack
            .filter(layer => layer.route)
            .map(layer => ({ path: layer.route.path, methods: layer.route.methods }));

        const expectedPaths = [
            '/search/:name',
            '/debug/list',
            '/export',
            '/import',
            '/',
            '/:code/activate',
            '/:code',
            '/:code',
            '/:code'
        ];

        expectedPaths.forEach(expectedPath => {
            expect(routePaths.some(r => r.path === expectedPath)).toBe(true);
        });

        const searchRoute = router.stack.find(layer => layer.route && layer.route.path === '/search/:name');
        expect(searchRoute).toBeDefined();
        expect(searchRoute.route.methods.get).toBe(true);

        const exportRoute = router.stack.find(layer => layer.route && layer.route.path === '/export');
        expect(exportRoute.route.methods.get).toBe(true);
    });
});
