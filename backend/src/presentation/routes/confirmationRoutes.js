/**
 * Confirmation Routes
 * Rutas para el manejo de confirmaciones
 * Organizado siguiendo principios REST y Clean Architecture
 */

const express = require('express');
const router = express.Router();

/**
 * Envuelve un método del controlador para asegurar que `next` se pase correctamente.
 * @param {Function} fn - El método del controlador.
 * @returns {Function} Un manejador de ruta de Express.
 */
const asyncHandler = fn => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};

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
    router.post(
        '/:code',
        middleware.csrfProtection,
        middleware.validateParams,
        middleware.validateBody,
        middleware.sanitizeInput,
        asyncHandler(confirmationController.confirmAttendance.bind(confirmationController))
    );

    router.get(
        '/:code',
        middleware.validateParams,
        asyncHandler(confirmationController.getConfirmation.bind(confirmationController))
    );

    router.put(
        '/:code',
        middleware.csrfProtection,
        middleware.validateParams,
        middleware.validateBody,
        middleware.sanitizeInput,
        asyncHandler(confirmationController.updateConfirmation.bind(confirmationController))
    );

    // Rutas administrativas (requieren autenticación)
    router.use(middleware.authenticate);

    // Estadísticas (debe ir antes de las rutas con parámetros)
    router.get(
        '/stats',
        asyncHandler(confirmationController.getStats.bind(confirmationController))
    );

    // Confirmaciones por tipo
    router.get(
        '/positive',
        asyncHandler(confirmationController.getPositiveConfirmations.bind(confirmationController))
    );

    router.get(
        '/negative',
        asyncHandler(confirmationController.getNegativeConfirmations.bind(confirmationController))
    );

    router.get(
        '/dietary-restrictions',
        asyncHandler(
            confirmationController.getConfirmationsWithDietaryRestrictions.bind(
                confirmationController
            )
        )
    );

    router.get(
        '/messages',
        asyncHandler(
            confirmationController.getConfirmationsWithMessages.bind(confirmationController)
        )
    );

    router.get(
        '/recent',
        middleware.validateQuery,
        asyncHandler(confirmationController.getRecentConfirmations.bind(confirmationController))
    );

    router.get(
        '/total-guests',
        asyncHandler(confirmationController.getTotalConfirmedGuests.bind(confirmationController))
    );

    // Exportación
    router.get(
        '/export',
        middleware.validateQuery,
        asyncHandler(confirmationController.exportConfirmations.bind(confirmationController))
    );

    // Búsqueda
    router.get(
        '/search/:name',
        middleware.validateParams,
        asyncHandler(confirmationController.searchByName.bind(confirmationController))
    );

    // CRUD Operations
    router.get(
        '/',
        middleware.validateQuery,
        asyncHandler(confirmationController.getConfirmations.bind(confirmationController))
    );

    router.delete(
        '/:code',
        middleware.csrfProtection,
        middleware.validateParams,
        middleware.validateBody,
        asyncHandler(confirmationController.cancelConfirmation.bind(confirmationController))
    );

    return router;
}

module.exports = configureConfirmationRoutes;
