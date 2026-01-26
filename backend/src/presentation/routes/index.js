/**
 * Routes Index
 * Configuración central de todas las rutas de la aplicación
 * Organizado siguiendo principios Clean Architecture
 */

const express = require('express');
const configureInvitationRoutes = require('./invitationRoutes');
const configureConfirmationRoutes = require('./confirmationRoutes');
const configureNotificationRoutes = require('./notificationRoutes');

/**
 * Configura todas las rutas de la aplicación
 * @param {Object} controllers - Controladores de la aplicación
 * @param {Object} middleware - Middleware de seguridad y validación
 * @returns {Router} Router principal configurado
 */
function configureRoutes(controllers, middleware) {
    const router = express.Router();

    // Middleware global
    router.use(middleware.helmet);
    router.use(middleware.compression);
    router.use(middleware.requestId);

    // Health check endpoint
    router.get('/health', (req, res) => {
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: process.env.APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        });
    });

    // API versioning
    const apiV1 = express.Router();

    // Configurar rutas de invitaciones
    const invitationRoutes = configureInvitationRoutes(
        controllers.invitationController,
        middleware
    );
    apiV1.use('/invitations', invitationRoutes);

    // Configurar rutas de confirmaciones
    const confirmationRoutes = configureConfirmationRoutes(
        controllers.confirmationController,
        middleware
    );
    apiV1.use('/confirmations', confirmationRoutes);

    // Configurar rutas de notificaciones (SSE)
    const notificationRoutes = configureNotificationRoutes(
        controllers.notificationController
    );
    apiV1.use('/notifications', notificationRoutes);

    // Rutas adicionales para estadísticas generales (optimizada sin duplicaciones)
    apiV1.get('/stats', 
        middleware.authenticate,
        controllers.invitationController.getStats.bind(controllers.invitationController)
    );

    // Montar API v1
    router.use('/api/v1', apiV1);

    // Ruta por defecto para API
    router.use('/api', apiV1);

    // Manejo de rutas no encontradas
    router.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            error: 'Endpoint no encontrado',
            path: req.originalUrl,
            method: req.method
        });
    });

    // Manejo global de errores
    router.use(middleware.globalErrorHandler);

    return router;
}

module.exports = configureRoutes;
