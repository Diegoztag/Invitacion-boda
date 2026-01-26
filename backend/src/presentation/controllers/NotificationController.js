/**
 * NotificationController
 * Controlador para manejar suscripciones a notificaciones SSE
 */
class NotificationController {
    constructor(sseService, logger) {
        this.sseService = sseService;
        this.logger = logger;
    }

    /**
     * Suscribirse al stream de eventos
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    subscribe(req, res) {
        try {
            this.sseService.addClient(req, res);
        } catch (error) {
            this.logger.error('Error subscribing to notifications', { error: error.message });
            res.status(500).json({ success: false, error: 'Error establishing connection' });
        }
    }
}

module.exports = NotificationController;
