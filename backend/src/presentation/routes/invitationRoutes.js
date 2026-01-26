/**
 * Invitation Routes
 * Rutas para el manejo de invitaciones
 * Organizado siguiendo principios REST y Clean Architecture
 */

const express = require('express');
const router = express.Router();

/**
 * Configura las rutas de invitaciones
 * @param {InvitationController} invitationController - Controlador de invitaciones
 * @param {Object} middleware - Middleware de seguridad y validación
 * @returns {Router} Router configurado
 */
function configureInvitationRoutes(invitationController, middleware) {
    // Middleware común para todas las rutas
    router.use(middleware.cors);
    router.use(middleware.rateLimit);
    router.use(middleware.requestLogger);

    // ==========================================
    // 1. Rutas Específicas (Prioridad Alta)
    // ==========================================

    // Búsqueda por nombre (Pública)
    router.get('/search/:name',
        middleware.validateParams,
        invitationController.searchByName.bind(invitationController)
    );

    // DEBUG ENDPOINT - TEMPORAL (Pública)
    router.get('/debug/list', async (req, res) => {
        try {
            // Acceder al repositorio directamente desde el contenedor (hack temporal)
            // Asumimos que el controller tiene acceso al repositorio
            const repo = invitationController.invitationRepository;
            const all = await repo.findAll({}, true); // includeInactive = true
            
            res.json({
                count: all.length,
                invitations: all.map(inv => ({
                    code: inv.code,
                    status: inv.status,
                    isActive: inv.isActive(),
                    guestNames: inv.guestNames
                }))
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Exportación (Privada)
    // IMPORTANTE: Debe ir antes de /:code para evitar conflicto
    router.get('/export',
        middleware.authenticate,
        middleware.validateQuery,
        invitationController.exportInvitations.bind(invitationController)
    );

    // Importación masiva (Privada)
    router.post('/import',
        middleware.authenticate,
        middleware.validateBody,
        middleware.sanitizeInput,
        invitationController.importInvitations.bind(invitationController)
    );

    // ==========================================
    // 2. Rutas Raíz (Colección)
    // ==========================================

    // Obtener todas (Privada)
    router.get('/',
        middleware.authenticate,
        middleware.validateQuery,
        invitationController.getInvitations.bind(invitationController)
    );

    // Crear nueva (Privada)
    router.post('/',
        middleware.authenticate,
        middleware.validateBody,
        middleware.sanitizeInput,
        invitationController.createInvitation.bind(invitationController)
    );

    // ==========================================
    // 3. Rutas Parametrizadas (Prioridad Baja)
    // ==========================================

    // Reactivación de invitación (Privada)
    // Debe ir antes de operaciones CRUD estándar si hay conflicto de verbos, 
    // aunque aquí es PUT /:code/activate vs PUT /:code
    router.put('/:code/activate',
        middleware.authenticate,
        middleware.validateParams,
        invitationController.restoreInvitation.bind(invitationController)
    );

    // Obtener una (Pública)
    router.get('/:code', 
        middleware.validateParams,
        invitationController.getInvitation.bind(invitationController)
    );

    // Actualizar (Privada)
    router.put('/:code',
        middleware.authenticate,
        middleware.validateParams,
        middleware.validateBody,
        middleware.sanitizeInput,
        invitationController.updateInvitation.bind(invitationController)
    );

    // Eliminar (Privada)
    router.delete('/:code',
        middleware.authenticate,
        middleware.validateParams,
        middleware.validateBody,
        invitationController.deleteInvitation.bind(invitationController)
    );

    // Manejo de errores específico para invitaciones
    router.use(middleware.errorHandler);

    return router;
}

module.exports = configureInvitationRoutes;
