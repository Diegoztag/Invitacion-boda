/**
 * Invitation Controller
 * Controlador para manejar las operaciones de invitaciones
 * Sigue principios Clean Architecture y SOLID
 */

const BaseController = require('./BaseController');

const { CreateInvitationDTO, UpdateInvitationDTO } = require('../../application/dto/InvitationDTO');
const QueryBuilder = require('../../shared/utils/QueryBuilder');
const BusinessRuleException = require('../../shared/exceptions/BusinessRuleException');

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
                return this.sendError(
                    res,
                    new BusinessRuleException('Datos de invitación inválidos', validation.errors),
                    next
                );
            }

            // Ejecutar caso de uso
            const result = await this.createInvitationUseCase.execute(validation.sanitized);

            if (!result.success) {
                return this.sendError(res, new BusinessRuleException(result.error), next);
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
                return this.sendError(res, new BusinessRuleException(result.error), next);
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
                return this.sendError(
                    res,
                    new BusinessRuleException('Se requiere un array de invitaciones'),
                    next
                );
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
