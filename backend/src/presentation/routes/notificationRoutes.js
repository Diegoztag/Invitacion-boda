const express = require('express');

/**
 * Configurar rutas de notificaciones
 * @param {NotificationController} notificationController
 * @param {Object} middleware
 * @returns {Router}
 */
function configureNotificationRoutes(notificationController, middleware) {
    const router = express.Router();

    router.get('/stream', middleware.authenticate, (req, res) =>
        notificationController.subscribe(req, res)
    );

    return router;
}

module.exports = configureNotificationRoutes;
