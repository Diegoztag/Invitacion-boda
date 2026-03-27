/**
 * Confirmation Controller
 * Controlador para manejar las operaciones de confirmaciones
 * Sigue principios Clean Architecture y SOLID
 */

import BaseController from './BaseController.js';
const {
    CreateConfirmationDTO,
    UpdateConfirmationDTO
} = require('../../application/dto/ConfirmationDTO');
const { convertToCSV } = require('../../shared/utils/csv-formatter');

class ConfirmationController extends BaseController {
    constructor(
        confirmAttendanceUseCase,
        updateConfirmationUseCase,
        cancelConfirmationUseCase,
        getConfirmationStatsUseCase,
        getConfirmationUseCase,
        getConfirmationsUseCase,
        searchConfirmationsByNameUseCase,
        validationService,
        config,
        logger
    ) {
        super(logger);
        this.confirmAttendanceUseCase = confirmAttendanceUseCase;
        this.updateConfirmationUseCase = updateConfirmationUseCase;
        this.cancelConfirmationUseCase = cancelConfirmationUseCase;
        this.getConfirmationStatsUseCase = getConfirmationStatsUseCase;
        this.getConfirmationUseCase = getConfirmationUseCase;
        this.getConfirmationsUseCase = getConfirmationsUseCase;
        this.searchConfirmationsByNameUseCase = searchConfirmationsByNameUseCase;
        this.validationService = validationService;
        this.config = config;
    }

    /**
     * Confirma asistencia a una invitación
     * POST /api/confirmations/:code
     */
    async confirmAttendance(req, res, next) {
        const endOperation = this.logger.startOperation('confirmAttendance', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;

            // Validar código
            if (!this.validationService.validateInvitationCode(code)) {
                return this.sendError(res, new Error('Código de invitación inválido'), next);
            }

            // Validar datos de confirmación
            const createConfirmationDTO = new CreateConfirmationDTO(req.body);
            const validation =
                this.validationService.validateConfirmationData(createConfirmationDTO);

            if (!validation.isValid) {
                return this.sendError(res, new Error('Datos de confirmación inválidos'), next);
            }

            // Añadir attendingNames a los datos sanitizados
            const confirmationData = {
                ...validation.sanitized,
                attendingNames: createConfirmationDTO.attendingNames
            };

            // Ejecutar caso de uso
            const result = await this.confirmAttendanceUseCase.execute(code, confirmationData);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({
                confirmed: true,
                willAttend: validation.sanitized.willAttend,
                attendingGuests: validation.sanitized.attendingGuests || 0
            });

            this.sendSuccess(res, result, 201);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene una confirmación por código
     * GET /api/confirmations/:code
     */
    async getConfirmation(req, res, next) {
        const endOperation = this.logger.startOperation('getConfirmation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;
            const result = await this.getConfirmationUseCase.execute(code);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({ found: true });
            this.sendSuccess(res, { confirmation: result.data });
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Actualiza una confirmación existente
     * PUT /api/confirmations/:code
     */
    async updateConfirmation(req, res, next) {
        const endOperation = this.logger.startOperation('updateConfirmation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;

            // Validar código
            if (!this.validationService.validateInvitationCode(code)) {
                return this.sendError(res, new Error('Código de invitación inválido'), next);
            }

            // Validar datos de actualización
            const updateConfirmationDTO = new UpdateConfirmationDTO(req.body);
            const validation =
                this.validationService.validateConfirmationData(updateConfirmationDTO);

            if (!validation.isValid) {
                return this.sendError(res, new Error('Datos de actualización inválidos'), next);
            }

            // Ejecutar actualización
            const result = await this.updateConfirmationUseCase.execute(code, validation.sanitized);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({ updated: true });

            this.sendSuccess(res, result);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Cancela una confirmación
     * DELETE /api/confirmations/:code
     */
    async cancelConfirmation(req, res, next) {
        const endOperation = this.logger.startOperation('cancelConfirmation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;
            const { reason = '' } = req.body;

            // Validar código
            if (!this.validationService.validateInvitationCode(code)) {
                return this.sendError(res, new Error('Código de invitación inválido'), next);
            }

            // Ejecutar cancelación
            const result = await this.cancelConfirmationUseCase.execute(code, reason);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({ cancelled: true });

            this.sendSuccess(res, result);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene todas las confirmaciones con filtros y paginación
     * GET /api/confirmations
     */
    async getConfirmations(req, res, next) {
        const endOperation = this.logger.startOperation('getConfirmations', {
            query: req.query,
            ip: req.ip
        });

        try {
            const {
                page = 1,
                limit = this.config.validation.pagination.defaultLimit,
                willAttend,
                search,
                sortBy = 'confirmedAt',
                sortOrder = 'desc'
            } = req.query;

            const filters = {};
            if (willAttend !== undefined) {
                filters.willAttend = willAttend === 'true';
            }
            if (search) {
                filters.search = search;
            }

            const sort = { field: sortBy, direction: sortOrder };

            const result = await this.getConfirmationsUseCase.execute(page, limit, filters, sort);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({
                count: result.data.length,
                total: result.pagination.total
            });

            this.sendSuccess(res, {
                confirmations: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene estadísticas de confirmaciones
     * GET /api/confirmations/stats
     */
    async getStats(req, res, next) {
        const endOperation = this.logger.startOperation('getConfirmationStats', {
            ip: req.ip
        });

        try {
            const stats = await this.getConfirmationStatsUseCase.execute();

            endOperation({ statsGenerated: true });

            this.sendSuccess(res, { stats });
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene confirmaciones positivas (que van a asistir)
     * GET /api/confirmations/positive
     */
    async getPositiveConfirmations(req, res, next) {
        const endOperation = this.logger.startOperation('getPositiveConfirmations', {
            ip: req.ip
        });

        try {
            const result = await this.getConfirmationStatsUseCase.getPositiveConfirmations();

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({ found: result.count });

            this.sendSuccess(res, result);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene confirmaciones negativas (que no van a asistir)
     * GET /api/confirmations/negative
     */
    async getNegativeConfirmations(req, res, next) {
        const endOperation = this.logger.startOperation('getNegativeConfirmations', {
            ip: req.ip
        });

        try {
            const result = await this.getConfirmationStatsUseCase.getNegativeConfirmations();

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({ found: result.count });

            this.sendSuccess(res, result);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene confirmaciones con restricciones dietarias
     * GET /api/confirmations/dietary-restrictions
     */
    async getConfirmationsWithDietaryRestrictions(req, res, next) {
        const endOperation = this.logger.startOperation('getConfirmationsWithDietaryRestrictions', {
            ip: req.ip
        });

        try {
            const result =
                await this.getConfirmationStatsUseCase.getConfirmationsWithDietaryRestrictions();

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({ found: result.count });

            this.sendSuccess(res, result);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene confirmaciones con mensajes para los novios
     * GET /api/confirmations/messages
     */
    async getConfirmationsWithMessages(req, res, next) {
        const endOperation = this.logger.startOperation('getConfirmationsWithMessages', {
            ip: req.ip
        });

        try {
            const result = await this.getConfirmationStatsUseCase.getConfirmationsWithMessages();

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({ found: result.count });

            this.sendSuccess(res, result);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene confirmaciones recientes
     * GET /api/confirmations/recent
     */
    async getRecentConfirmations(req, res, next) {
        const endOperation = this.logger.startOperation('getRecentConfirmations', {
            ip: req.ip
        });

        try {
            const { hours = 24 } = req.query;
            const hoursNum = parseInt(hours, 10);

            const result = await this.getConfirmationStatsUseCase.getRecentConfirmations(hoursNum);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({
                found: result.count,
                hours: result.hours
            });

            this.sendSuccess(res, result);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Exporta confirmaciones
     * GET /api/confirmations/export
     */
    async exportConfirmations(req, res, next) {
        const endOperation = this.logger.startOperation('exportConfirmations', {
            ip: req.ip
        });

        try {
            const { format = 'csv' } = req.query;

            const result = await this.getConfirmationStatsUseCase.exportAll(format);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({
                exported: result.count,
                format
            });

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=confirmations.csv');
                const csvData = convertToCSV(result.data);
                res.send(csvData);
            } else {
                this.sendSuccess(res, result);
            }
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Busca confirmaciones por nombre
     * GET /api/confirmations/search/:name
     */
    async searchByName(req, res, next) {
        const endOperation = this.logger.startOperation('searchConfirmationsByName', {
            name: req.params.name,
            ip: req.ip
        });

        try {
            const { name } = req.params;
            const result = await this.searchConfirmationsByNameUseCase.execute(name);

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({ found: result.count });

            this.sendSuccess(res, {
                confirmations: result.data,
                count: result.count
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }

    /**
     * Obtiene el total de invitados confirmados
     * GET /api/confirmations/total-guests
     */
    async getTotalConfirmedGuests(req, res, next) {
        const endOperation = this.logger.startOperation('getTotalConfirmedGuests', {
            ip: req.ip
        });

        try {
            const result = await this.getConfirmationStatsUseCase.getTotalConfirmedGuests();

            if (!result.success) {
                return this.sendError(res, new Error(result.error), next);
            }

            endOperation({ totalGuests: result.total });

            this.sendSuccess(res, {
                totalConfirmedGuests: result.total
            });
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }
}

module.exports = ConfirmationController;
