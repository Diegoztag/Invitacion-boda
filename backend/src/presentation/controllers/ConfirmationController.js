/**
 * Confirmation Controller
 * Controlador para manejar las operaciones de confirmaciones
 * Sigue principios Clean Architecture y SOLID
 */

class ConfirmationController {
    constructor(confirmAttendanceUseCase, getConfirmationStatsUseCase, confirmationRepository, validationService, logger) {
        this.confirmAttendanceUseCase = confirmAttendanceUseCase;
        this.getConfirmationStatsUseCase = getConfirmationStatsUseCase;
        this.confirmationRepository = confirmationRepository;
        this.validationService = validationService;
        this.logger = logger;
    }

    /**
     * Confirma asistencia a una invitación
     * POST /api/confirmations/:code
     */
    async confirmAttendance(req, res) {
        const endOperation = this.logger.startOperation('confirmAttendance', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;

            // Validar código
            if (!this.validationService.validateInvitationCode(code)) {
                return res.status(400).json({
                    success: false,
                    error: 'Código de invitación inválido'
                });
            }

            // Validar datos de confirmación
            const validation = this.validationService.validateConfirmationData(req.body);
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de confirmación inválidos',
                    details: validation.errors
                });
            }

            // Ejecutar caso de uso
            const result = await this.confirmAttendanceUseCase.execute(code, validation.sanitized);

            if (!result.success) {
                return res.status(400).json(result);
            }

            endOperation({ 
                confirmed: true, 
                willAttend: validation.sanitized.willAttend,
                attendingGuests: validation.sanitized.attendingGuests || 0
            });

            res.status(201).json(result);

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error confirming attendance', {
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
     * Obtiene una confirmación por código
     * GET /api/confirmations/:code
     */
    async getConfirmation(req, res) {
        const endOperation = this.logger.startOperation('getConfirmation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;

            // Validar código
            if (!this.validationService.validateInvitationCode(code)) {
                return res.status(400).json({
                    success: false,
                    error: 'Código de invitación inválido'
                });
            }

            // Buscar confirmación
            const confirmation = await this.confirmationRepository.findByCode(code);
            
            if (!confirmation) {
                return res.status(404).json({
                    success: false,
                    error: 'Confirmación no encontrada'
                });
            }

            endOperation({ found: true });

            res.json({
                success: true,
                confirmation: confirmation.toObject()
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting confirmation', {
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
     * Actualiza una confirmación existente
     * PUT /api/confirmations/:code
     */
    async updateConfirmation(req, res) {
        const endOperation = this.logger.startOperation('updateConfirmation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;

            // Validar código
            if (!this.validationService.validateInvitationCode(code)) {
                return res.status(400).json({
                    success: false,
                    error: 'Código de invitación inválido'
                });
            }

            // Validar datos de actualización
            const validation = this.validationService.validateConfirmationData(req.body);
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de actualización inválidos',
                    details: validation.errors
                });
            }

            // Ejecutar actualización
            const result = await this.confirmAttendanceUseCase.updateConfirmation(code, validation.sanitized);

            if (!result.success) {
                return res.status(400).json(result);
            }

            endOperation({ updated: true });

            res.json(result);

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error updating confirmation', {
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
     * Cancela una confirmación
     * DELETE /api/confirmations/:code
     */
    async cancelConfirmation(req, res) {
        const endOperation = this.logger.startOperation('cancelConfirmation', {
            code: req.params.code,
            ip: req.ip
        });

        try {
            const { code } = req.params;
            const { reason = '' } = req.body;

            // Validar código
            if (!this.validationService.validateInvitationCode(code)) {
                return res.status(400).json({
                    success: false,
                    error: 'Código de invitación inválido'
                });
            }

            // Ejecutar cancelación
            const result = await this.confirmAttendanceUseCase.cancelConfirmation(code, reason);

            if (!result.success) {
                return res.status(400).json(result);
            }

            endOperation({ cancelled: true });

            res.json(result);

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error cancelling confirmation', {
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
     * Obtiene todas las confirmaciones con filtros y paginación
     * GET /api/confirmations
     */
    async getConfirmations(req, res) {
        const endOperation = this.logger.startOperation('getConfirmations', {
            query: req.query,
            ip: req.ip
        });

        try {
            const {
                page = 1,
                limit = 10,
                willAttend,
                search,
                sortBy = 'confirmedAt',
                sortOrder = 'desc'
            } = req.query;

            // Validar parámetros de paginación
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            if (isNaN(pageNum) || pageNum < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Número de página inválido'
                });
            }

            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Límite inválido (1-100)'
                });
            }

            // Construir filtros
            const filters = {};
            if (willAttend !== undefined) filters.willAttend = willAttend === 'true';

            // Construir opciones de ordenamiento
            const sort = {
                field: sortBy,
                direction: sortOrder
            };

            // Obtener confirmaciones paginadas
            let result = await this.confirmationRepository.findPaginated(
                pageNum, 
                limitNum, 
                filters, 
                sort
            );

            // Aplicar búsqueda si se proporciona
            if (search) {
                const searchResults = await this.confirmationRepository.findByGuestName(search);
                result.data = result.data.filter(confirmation =>
                    searchResults.some(sr => sr.code === confirmation.code)
                );
                result.pagination.total = result.data.length;
            }

            endOperation({ 
                count: result.data.length,
                total: result.pagination.total 
            });

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting confirmations', {
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
     * Obtiene estadísticas de confirmaciones
     * GET /api/confirmations/stats
     */
    async getStats(req, res) {
        const endOperation = this.logger.startOperation('getConfirmationStats', {
            ip: req.ip
        });

        try {
            const stats = await this.getConfirmationStatsUseCase.execute();

            endOperation({ statsGenerated: true });

            res.json({
                success: true,
                stats
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting confirmation stats', {
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
     * Obtiene confirmaciones positivas (que van a asistir)
     * GET /api/confirmations/positive
     */
    async getPositiveConfirmations(req, res) {
        const endOperation = this.logger.startOperation('getPositiveConfirmations', {
            ip: req.ip
        });

        try {
            const confirmations = await this.getConfirmationStatsUseCase.getPositiveConfirmations();

            endOperation({ found: confirmations.length });

            res.json({
                success: true,
                confirmations: confirmations.map(conf => conf.toObject()),
                count: confirmations.length
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting positive confirmations', {
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
     * Obtiene confirmaciones negativas (que no van a asistir)
     * GET /api/confirmations/negative
     */
    async getNegativeConfirmations(req, res) {
        const endOperation = this.logger.startOperation('getNegativeConfirmations', {
            ip: req.ip
        });

        try {
            const confirmations = await this.getConfirmationStatsUseCase.getNegativeConfirmations();

            endOperation({ found: confirmations.length });

            res.json({
                success: true,
                confirmations: confirmations.map(conf => conf.toObject()),
                count: confirmations.length
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting negative confirmations', {
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
     * Obtiene confirmaciones con restricciones dietarias
     * GET /api/confirmations/dietary-restrictions
     */
    async getConfirmationsWithDietaryRestrictions(req, res) {
        const endOperation = this.logger.startOperation('getConfirmationsWithDietaryRestrictions', {
            ip: req.ip
        });

        try {
            const confirmations = await this.confirmationRepository.findWithDietaryRestrictions();

            endOperation({ found: confirmations.length });

            res.json({
                success: true,
                confirmations: confirmations.map(conf => conf.toObject()),
                count: confirmations.length
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting confirmations with dietary restrictions', {
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
     * Obtiene confirmaciones con mensajes para los novios
     * GET /api/confirmations/messages
     */
    async getConfirmationsWithMessages(req, res) {
        const endOperation = this.logger.startOperation('getConfirmationsWithMessages', {
            ip: req.ip
        });

        try {
            const confirmations = await this.confirmationRepository.findWithMessages();

            endOperation({ found: confirmations.length });

            res.json({
                success: true,
                confirmations: confirmations.map(conf => conf.toObject()),
                count: confirmations.length
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting confirmations with messages', {
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
     * Obtiene confirmaciones recientes
     * GET /api/confirmations/recent
     */
    async getRecentConfirmations(req, res) {
        const endOperation = this.logger.startOperation('getRecentConfirmations', {
            ip: req.ip
        });

        try {
            const { hours = 24 } = req.query;
            const hoursNum = parseInt(hours, 10);

            if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 168) { // Max 1 semana
                return res.status(400).json({
                    success: false,
                    error: 'Horas inválidas (1-168)'
                });
            }

            const confirmations = await this.confirmationRepository.findRecent(hoursNum);

            endOperation({ 
                found: confirmations.length,
                hours: hoursNum 
            });

            res.json({
                success: true,
                confirmations: confirmations.map(conf => conf.toObject()),
                count: confirmations.length,
                hours: hoursNum
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting recent confirmations', {
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
     * Exporta confirmaciones
     * GET /api/confirmations/export
     */
    async exportConfirmations(req, res) {
        const endOperation = this.logger.startOperation('exportConfirmations', {
            ip: req.ip
        });

        try {
            const { format = 'json' } = req.query;

            const result = await this.confirmationRepository.exportAll();

            endOperation({ 
                exported: result.count,
                format 
            });

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=confirmations.csv');
                
                // Convertir a CSV (implementación simplificada)
                const csvData = this.convertToCSV(result.data);
                res.send(csvData);
            } else {
                res.json({
                    success: true,
                    ...result
                });
            }

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error exporting confirmations', {
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
     * Busca confirmaciones por nombre
     * GET /api/confirmations/search/:name
     */
    async searchByName(req, res) {
        const endOperation = this.logger.startOperation('searchConfirmationsByName', {
            name: req.params.name,
            ip: req.ip
        });

        try {
            const { name } = req.params;

            if (!name || name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre debe tener al menos 2 caracteres'
                });
            }

            const confirmations = await this.confirmationRepository.findByGuestName(name);

            endOperation({ found: confirmations.length });

            res.json({
                success: true,
                confirmations: confirmations.map(conf => conf.toObject()),
                count: confirmations.length
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error searching confirmations by name', {
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

    /**
     * Obtiene el total de invitados confirmados
     * GET /api/confirmations/total-guests
     */
    async getTotalConfirmedGuests(req, res) {
        const endOperation = this.logger.startOperation('getTotalConfirmedGuests', {
            ip: req.ip
        });

        try {
            const total = await this.confirmationRepository.getTotalConfirmedGuests();

            endOperation({ totalGuests: total });

            res.json({
                success: true,
                totalConfirmedGuests: total
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting total confirmed guests', {
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
     * Convierte datos a formato CSV
     * @param {Array} data - Datos a convertir
     * @returns {string} CSV string
     * @private
     */
    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                if (Array.isArray(value)) {
                    return `"${value.join('|')}"`;
                }
                return `"${value || ''}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }
}

module.exports = ConfirmationController;
