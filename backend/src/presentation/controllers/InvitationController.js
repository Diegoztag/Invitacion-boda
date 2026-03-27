/**
 * Invitation Controller
 * Controlador para manejar las operaciones de invitaciones
 * Sigue principios Clean Architecture y SOLID
 */

const { CreateInvitationDTO, UpdateInvitationDTO } = require('../../application/dto/InvitationDTO');
const { convertToCSV } = require('../../shared/utils/csv-formatter');
const NotFoundException = require('../../shared/exceptions/NotFoundException');
const BusinessRuleException = require('../../shared/exceptions/BusinessRuleException');

class InvitationController {
    constructor(
        createInvitationUseCase,
        getInvitationUseCase,
        getInvitationsUseCase,
        searchInvitationsByNameUseCase,
        restoreInvitationUseCase,
        deleteInvitationUseCase, // Añadido
        invitationRepository, // Se mantiene por ahora para update, pero se eliminará
        validationService,
        config,
        logger
    ) {
        this.createInvitationUseCase = createInvitationUseCase;
        this.getInvitationUseCase = getInvitationUseCase;
        this.getInvitationsUseCase = getInvitationsUseCase;
        this.searchInvitationsByNameUseCase = searchInvitationsByNameUseCase;
        this.restoreInvitationUseCase = restoreInvitationUseCase;
        this.deleteInvitationUseCase = deleteInvitationUseCase; // Añadido
        this.invitationRepository = invitationRepository;
        this.validationService = validationService;
        this.config = config;
        this.logger = logger;
    }

    /**
     * Obtiene una invitaciรณn por cรณdigo
     * GET /api/invitations/:code
     */
    async getInvitation(req, res) {
        const endOperation = this.logger.startOperation('getInvitation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;
            const invitation = await this.getInvitationUseCase.execute(code);
            endOperation({ found: true });
            res.json({ success: true, invitation });
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            if (error instanceof NotFoundException) {
                return res.status(404).json({ success: false, error: error.message });
            }

            if (error instanceof BusinessRuleException) {
                return res.status(400).json({ success: false, error: error.message });
            }

            this.logger.error('Error getting invitation', {
                code: req.params.code,
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Crea una nueva invitaciรณn
     * POST /api/invitations
     */
    async createInvitation(req, res) {
        const endOperation = this.logger.startOperation('createInvitation', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        try {
            const createInvitationDTO = new CreateInvitationDTO(req.body);
            // Validar datos de entrada
            const validation = this.validationService.validateInvitationData(createInvitationDTO);

            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de invitaciรณn invรกlidos',
                    details: validation.errors
                });
            }

            // Ejecutar caso de uso
            const result = await this.createInvitationUseCase.execute(validation.sanitized);

            if (!result.success) {
                return res.status(400).json(result);
            }

            endOperation({
                created: true,
                code: result.invitation.code
            });

            // Convertir entidad a objeto plano para no exponer getters/protรณtipo
            res.status(201).json({
                ...result,
                invitation: result.invitation.toObject()
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error creating invitation', {
                body: req.body,
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtiene todas las invitaciones con filtros y paginaciรณn
     * GET /api/invitations
     */
    async getInvitations(req, res) {
        const endOperation = this.logger.startOperation('getInvitations', {
            query: req.query,
            ip: req.ip
        });

        try {
            const {
                page = 1,
                limit = this.config.validation.pagination.defaultLimit,
                status,
                confirmed,
                search,
                passes,
                table,
                phone,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                includeInactive = 'false'
            } = req.query;

            // Construir filtros
            const filters = {};
            if (status) {
                filters.status = status;
            }
            if (confirmed !== undefined) {
                filters.confirmed = confirmed === 'true';
            }
            if (search) {
                filters.search = search;
            }
            if (passes) {
                filters.passes = passes;
            }
            if (table) {
                filters.table = table;
            }
            if (phone) {
                filters.phone = phone;
            }

            // Construir opciones de ordenamiento
            const sort = { field: sortBy, direction: sortOrder };

            const result = await this.getInvitationsUseCase.execute(
                page,
                limit,
                filters,
                sort,
                includeInactive === 'true'
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            endOperation({
                count: result.data.length,
                total: result.pagination.total
            });

            res.json(result);
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error getting invitations', {
                query: req.query,
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Actualiza una invitaciรณn
     * PUT /api/invitations/:code
     */
    async updateInvitation(req, res) {
        const endOperation = this.logger.startOperation('updateInvitation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;

            // Validar cรณdigo
            if (!this.validationService.validateInvitationCode(code)) {
                return res.status(400).json({
                    success: false,
                    error: 'Cรณdigo de invitaciรณn invรกlido'
                });
            }

            // Buscar invitaciรณn existente
            const existingInvitation = await this.invitationRepository.findByCode(code);
            if (!existingInvitation) {
                return res.status(404).json({
                    success: false,
                    error: 'Invitaciรณn no encontrada'
                });
            }

            const updateInvitationDTO = new UpdateInvitationDTO(req.body);

            // Validar datos de actualizaciรณn
            const validation = this.validationService.validateInvitationData({
                ...existingInvitation.toObject(),
                ...updateInvitationDTO
            });

            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de actualizaciรณn invรกlidos',
                    details: validation.errors
                });
            }

            // Crear invitaciรณn actualizada
            const updatedInvitation = existingInvitation.clone();
            updatedInvitation.update(validation.sanitized);

            // Guardar cambios
            const result = await this.invitationRepository.update(code, updatedInvitation);

            endOperation({ updated: true });

            res.json({
                success: true,
                invitation: result.toObject(),
                message: 'Invitaciรณn actualizada exitosamente'
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error updating invitation', {
                code: req.params.code,
                body: req.body,
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Elimina una invitaciรณn (soft delete)
     * DELETE /api/invitations/:code
     */
    async deleteInvitation(req, res) {
        const endOperation = this.logger.startOperation('deleteInvitation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;
            const { reason = '' } = req.body;
            const cancelledBy = req.user ? req.user.id : 'admin'; // Asumir que hay un usuario autenticado

            await this.deleteInvitationUseCase.execute(code, cancelledBy, reason);

            endOperation({ deleted: true });

            res.json({
                success: true,
                message: 'Invitación desactivada exitosamente'
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            if (error instanceof NotFoundException) {
                return res.status(404).json({ success: false, error: error.message });
            }

            if (error instanceof BusinessRuleException) {
                return res.status(400).json({ success: false, error: error.message });
            }

            this.logger.error('Error deleting invitation', {
                code: req.params.code,
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Restaura (activa) una invitaciรณn previamente eliminada
     * PUT /api/invitations/:code/activate
     */
    async restoreInvitation(req, res) {
        const endOperation = this.logger.startOperation('restoreInvitation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;

            const restoredInvitation = await this.restoreInvitationUseCase.execute(code);

            endOperation({ restored: true });

            res.json({
                success: true,
                invitation: restoredInvitation,
                message: 'Invitación activada exitosamente'
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            if (error instanceof NotFoundException) {
                return res.status(404).json({ success: false, error: error.message });
            }

            if (error instanceof BusinessRuleException) {
                return res.status(400).json({ success: false, error: error.message });
            }

            this.logger.error('Error restoring invitation', {
                code: req.params.code,
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtiene estadรญsticas de invitaciones
     * GET /api/stats
     */
    async getStats(req, res) {
        const endOperation = this.logger.startOperation('getInvitationStats', {
            ip: req.ip
        });

        try {
            // Obtener estadรญsticas unificadas desde invitaciones
            const invitationStats = await this.invitationRepository.getStats();

            // Calcular tasas de confirmaciรณn y asistencia
            const confirmationRate =
                invitationStats.active > 0
                    ? ((invitationStats.confirmed / invitationStats.active) * 100).toFixed(2)
                    : '0.00';

            const attendanceRate =
                invitationStats.totalIssuedPasses > 0
                    ? (
                          (invitationStats.confirmedPasses / invitationStats.totalIssuedPasses) *
                          100
                      ).toFixed(2)
                    : '0.00';

            endOperation({ statsGenerated: true });

            // Estructura optimizada sin duplicaciones
            res.json({
                success: true,
                stats: {
                    invitations: {
                        total: invitationStats.total,
                        confirmed: invitationStats.confirmed,
                        pending: invitationStats.pending,
                        cancelled: invitationStats.cancelled,
                        partial: invitationStats.partial,
                        active: invitationStats.active,
                        inactive: invitationStats.inactive,
                        totalPasses: invitationStats.totalIssuedPasses,
                        occupiedPasses: invitationStats.occupiedPasses,
                        cancelledPasses: invitationStats.totalLiberatedPasses
                    },
                    confirmations: {
                        total: invitationStats.confirmed,
                        positive: invitationStats.confirmed,
                        negative: invitationStats.cancelled,
                        totalConfirmedGuests: invitationStats.confirmedPasses,
                        pendingPasses: invitationStats.pendingPasses,
                        averageGuestsPerConfirmation:
                            invitationStats.confirmed > 0
                                ? (
                                      invitationStats.confirmedPasses / invitationStats.confirmed
                                  ).toFixed(2)
                                : '0.00'
                    },
                    passDistribution: {
                        // Desglose de pases activos
                        activeAdultPasses: invitationStats.activeAdultPasses || 0,
                        activeChildPasses: invitationStats.activeChildPasses || 0,
                        activeStaffPasses: invitationStats.activeStaffPasses || 0,
                        totalActivePasses: invitationStats.totalActivePasses || 0,

                        // Porcentajes de distribuciรณn
                        distributionPercentages: invitationStats.distributionPercentages || {
                            adults: 0,
                            children: 0,
                            staff: 0
                        },

                        // Desglose de pases confirmados
                        confirmedAdultPasses: invitationStats.confirmedAdultPasses || 0,
                        confirmedChildPasses: invitationStats.confirmedChildPasses || 0,
                        confirmedStaffPasses: invitationStats.confirmedStaffPasses || 0,
                        totalConfirmedPasses: invitationStats.totalConfirmedPasses || 0
                    },
                    rates: {
                        confirmationRate: confirmationRate,
                        attendanceRate: attendanceRate
                    }
                }
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error getting invitation stats', {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Importa invitaciones desde CSV
     * POST /api/invitations/import
     */
    async importInvitations(req, res) {
        const endOperation = this.logger.startOperation('importInvitations', {
            ip: req.ip
        });

        try {
            const { invitations } = req.body;

            if (!Array.isArray(invitations) || invitations.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere un array de invitaciones'
                });
            }

            // Ejecutar importaciรณn en lote
            const result = await this.createInvitationUseCase.executeBatch(invitations);

            endOperation({
                imported: result.success.length,
                failed: result.errors.length
            });

            res.json({
                success: true,
                result,
                message: `Importaciรณn completada: ${result.success.length} exitosas, ${result.errors.length} fallidas`
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error importing invitations', {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Exporta invitaciones
     * GET /api/invitations/export
     */
    async exportInvitations(req, res) {
        const endOperation = this.logger.startOperation('exportInvitations', {
            ip: req.ip
        });

        try {
            const { format = 'json' } = req.query;

            const result = await this.invitationRepository.exportAll();

            endOperation({
                exported: result.count,
                format
            });

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=invitations.csv');

                // Convertir a CSV
                const csvData = convertToCSV(result.data);
                res.send(csvData);
            } else {
                res.json({
                    success: true,
                    ...result
                });
            }
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error exporting invitations', {
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }

    /**
     * Busca invitaciones por nombre
     * GET /api/invitations/search/:name
     */
    async searchByName(req, res) {
        const endOperation = this.logger.startOperation('searchInvitationsByName', {
            name: req.params.name,
            ip: req.ip
        });

        try {
            const { name } = req.params;

            const result = await this.searchInvitationsByNameUseCase.execute(name);

            if (!result.success) {
                return res.status(400).json(result);
            }

            endOperation({ found: result.count });

            // Renombrar 'data' a 'invitations' para mantener la consistencia de la API
            res.json({
                success: true,
                invitations: result.data,
                count: result.count
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');

            this.logger.error('Error searching invitations by name', {
                name: req.params.name,
                error: error.message,
                stack: error.stack
            });

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
}

module.exports = InvitationController;
