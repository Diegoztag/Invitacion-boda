const express = require('express');

/**
 * Configurar rutas de notificaciones
 * @param {NotificationController} notificationController
 * @returns {Router}
 */
function configureNotificationRoutes(notificationController) {
    const router = express.Router();

    router.get('/stream', (req, res) => notificationController.subscribe(req, res));

    return router;
}

module.exports = configureNotificationRoutes;
