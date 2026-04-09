/**
 * Invitation Controller
 * Controlador para manejar las operaciones de invitaciones
 * Sigue principios Clean Architecture y SOLID
 */

import BaseController from './BaseController.js';

const { CreateInvitationDTO, UpdateInvitationDTO } = require('../../application/dto/InvitationDTO');
const { convertToCSV } = require('../../shared/utils/csv-formatter');
const QueryBuilder = require('../../shared/utils/QueryBuilder');

class InvitationController extends BaseController {
    constructor(
        createInvitationUseCase,
        getInvitationUseCase,
        getInvitationsUseCase,
        searchInvitationsByNameUseCase,
        restoreInvitationUseCase,
        deleteInvitationUseCase, // Añadido
        updateInvitationUseCase, // Añadido
        getInvitationStatsUseCase, // Añadido
        exportInvitationsUseCase, // Añadido
        invitationRepository, // Se mantiene por ahora para update, pero se eliminará
        validationService,
        config,
        logger
    ) {
        super(logger);
        this.createInvitationUseCase = createInvitationUseCase;
        this.getInvitationUseCase = getInvitationUseCase;
        this.getInvitationsUseCase = getInvitationsUseCase;
        this.searchInvitationsByNameUseCase = searchInvitationsByNameUseCase;
        this.restoreInvitationUseCase = restoreInvitationUseCase;
        this.deleteInvitationUseCase = deleteInvitationUseCase; // Añadido
        this.updateInvitationUseCase = updateInvitationUseCase; // Añadido
        this.getInvitationStatsUseCase = getInvitationStatsUseCase; // Añadido
        this.exportInvitationsUseCase = exportInvitationsUseCase; // Añadido
        this.invitationRepository = invitationRepository;
        this.validationService = validationService;
        this.config = config;
    }

    /**
     * Obtiene una invitaciรณn por cรณdigo
     * GET /api/invitations/:code
     */
    async getInvitation(req, res, next) {
        const { code } = req.params;
        await this.executeUseCase(
            req,
            res,
            next,
            this.getInvitationUseCase,
            [code],
            'getInvitation'
        );
    }

    /**
     * Crea una nueva invitaciรณn
     * POST /api/invitations
     */
    async createInvitation(req, res, next) {
        const endOperation = this.logger.startOperation('createInvitation', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        try {
            const createInvitationDTO = new CreateInvitationDTO(req.body);
            // Validar datos de entrada
            const validation = this.validationService.validateInvitationData(createInvitationDTO);

            if (!validation.isValid) {
                return this.sendError(res, new Error('Datos de invitaciรณn invรกlidos'), next);
            }

            // Ejecutar caso de uso
            const result = await this.createInvitationUseCase.execute(validation.sanitized);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({
                created: true,
                code: result.invitation.code
            });

            // Convertir entidad a objeto plano para no exponer getters/protรณtipo
            this.sendSuccess(
                res,
                {
                    ...result,
                    invitation: result.invitation.toObject()
                },
                201
            );
        } catch (error) {
            endOperation(
                {
                    error: error.message
                },
                'error'
            );
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene todas las invitaciones con filtros y paginaciรณn
     * GET /api/invitations
     */
    async getInvitations(req, res, next) {
        const endOperation = this.logger.startOperation('getInvitations', {
            query: req.query,
            ip: req.ip
        });

        try {
            const queryParams = QueryBuilder.buildFromRequest(req.query, this.config);

            const result = await this.getInvitationsUseCase.execute(
                queryParams.page,
                queryParams.limit,
                queryParams.filters,
                queryParams.sort,
                queryParams.includeInactive
            );

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({
                count: result.data.length,
                total: result.pagination.total
            });

            this.sendSuccess(res, result);
        } catch (error) {
            endOperation(
                {
                    error: error.message
                },
                'error'
            );
            this.sendError(res, error, next);
        }
    }

    /**
     * Actualiza una invitaciรณn
     * PUT /api/invitations/:code
     */
    async updateInvitation(req, res, next) {
        const { code } = req.params;
        const updateInvitationDTO = new UpdateInvitationDTO(req.body);

        await this.executeUseCase(
            req,
            res,
            next,
            this.updateInvitationUseCase,
            [code, updateInvitationDTO],
            'updateInvitation'
        );
    }

    /**
     * Elimina una invitaciรณn (soft delete)
     * DELETE /api/invitations/:code
     */
    async deleteInvitation(req, res, next) {
        const { code } = req.params;
        const { reason = '' } = req.body;
        const cancelledBy = req.user ? req.user.id : 'admin';
        await this.executeUseCase(
            req,
            res,
            next,
            this.deleteInvitationUseCase,
            [code, cancelledBy, reason],
            'deleteInvitation'
        );
    }

    /**
     * Restaura (activa) una invitaciรณn previamente eliminada
     * PUT /api/invitations/:code/activate
     */
    async restoreInvitation(req, res, next) {
        const { code } = req.params;
        await this.executeUseCase(
            req,
            res,
            next,
            this.restoreInvitationUseCase,
            [code],
            'restoreInvitation'
        );
    }

    /**
     * Obtiene estadรญsticas de invitaciones
     * GET /api/stats
     */
    async getStats(req, res, next) {
        await this.executeUseCase(
            req,
            res,
            next,
            this.getInvitationStatsUseCase,
            [],
            'getInvitationStats'
        );
    }

    /**
     * Importa invitaciones desde CSV
     * POST /api/invitations/import
     */
    async importInvitations(req, res, next) {
        const endOperation = this.logger.startOperation('importInvitations', {
            ip: req.ip
        });

        try {
            const { invitations } = req.body;

            if (!Array.isArray(invitations) || invitations.length === 0) {
                return this.sendError(res, new Error('Se requiere un array de invitaciones'), next);
            }

            // Ejecutar importaciรณn en lote
            const result = await this.createInvitationUseCase.executeBatch(invitations);

            endOperation({
                imported: result.success.length,
                failed: result.errors.length
            });

            this.sendSuccess(res, {
                result,
                message: `Importaciรณn completada: ${result.success.length} exitosas, ${result.errors.length} fallidas`
            });
        } catch (error) {
            endOperation(
                {
                    error: error.message
                },
                'error'
            );
            this.sendError(res, error, next);
        }
    }

    /**
     * Exporta invitaciones
     * GET /api/invitations/export
     */
    async exportInvitations(req, res, next) {
        const endOperation = this.logger.startOperation('exportInvitations', {
            ip: req.ip
        });

        try {
            const { format = 'json' } = req.query;

            const result = await this.exportInvitationsUseCase.execute(format);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

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
                this.sendSuccess(res, result);
            }
        } catch (error) {
            endOperation(
                {
                    error: error.message
                },
                'error'
            );
            this.sendError(res, error, next);
        }
    }

    /**
     * Busca invitaciones por nombre
     * GET /api/invitations/search/:name
     */
    async searchByName(req, res, next) {
        const { name } = req.params;
        await this.executeUseCase(
            req,
            res,
            next,
            this.searchInvitationsByNameUseCase,
            [name],
            'searchInvitationsByName'
        );
    }
}

module.exports = InvitationController;
