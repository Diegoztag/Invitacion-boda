/**
 * Confirmation Routes
 * Rutas para el manejo de confirmaciones
 * Organizado siguiendo principios REST y Clean Architecture
 */

const express = require('express');
const router = express.Router();

/**
 * Configura las rutas de confirmaciones
 * @param {ConfirmationController} confirmationController - Controlador de confirmaciones
 * @param {Object} middleware - Middleware de seguridad y validación
 * @returns {Router} Router configurado
 */
function configureConfirmationRoutes(confirmationController, middleware) {
    // Middleware común para todas las rutas
    router.use(middleware.cors);
    router.use(middleware.rateLimit);
    router.use(middleware.requestLogger);

    // Rutas públicas para confirmación de asistencia
    router.post('/:code',
        middleware.validateParams,
        middleware.validateBody,
        middleware.sanitizeInput,
        confirmationController.confirmAttendance.bind(confirmationController)
    );

    router.get('/:code',
        middleware.validateParams,
        confirmationController.getConfirmation.bind(confirmationController)
    );

    router.put('/:code',
        middleware.validateParams,
        middleware.validateBody,
        middleware.sanitizeInput,
        confirmationController.updateConfirmation.bind(confirmationController)
    );

    // Rutas administrativas (requieren autenticación)
    router.use(middleware.authenticate);

    // Estadísticas (debe ir antes de las rutas con parámetros)
    router.get('/stats',
        confirmationController.getStats.bind(confirmationController)
    );

    // Confirmaciones por tipo
    router.get('/positive',
        confirmationController.getPositiveConfirmations.bind(confirmationController)
    );

    router.get('/negative',
        confirmationController.getNegativeConfirmations.bind(confirmationController)
    );

    router.get('/dietary-restrictions',
        confirmationController.getConfirmationsWithDietaryRestrictions.bind(confirmationController)
    );

    router.get('/messages',
        confirmationController.getConfirmationsWithMessages.bind(confirmationController)
    );

    router.get('/recent',
        middleware.validateQuery,
        confirmationController.getRecentConfirmations.bind(confirmationController)
    );

    router.get('/total-guests',
        confirmationController.getTotalConfirmedGuests.bind(confirmationController)
    );

    // Exportación
    router.get('/export',
        middleware.validateQuery,
        confirmationController.exportConfirmations.bind(confirmationController)
    );

    // Búsqueda
    router.get('/search/:name',
        middleware.validateParams,
        confirmationController.searchByName.bind(confirmationController)
    );

    // CRUD Operations
    router.get('/',
        middleware.validateQuery,
        confirmationController.getConfirmations.bind(confirmationController)
    );

    router.delete('/:code',
        middleware.validateParams,
        middleware.validateBody,
        confirmationController.cancelConfirmation.bind(confirmationController)
    );

    // Manejo de errores específico para confirmaciones
    router.use(middleware.errorHandler);

    return router;
}

module.exports = configureConfirmationRoutes;
