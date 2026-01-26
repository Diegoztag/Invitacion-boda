/**
 * Invitation Controller
 * Controlador para manejar las operaciones de invitaciones
 * Sigue principios Clean Architecture y SOLID
 */

const path = require('path');
// Importar configuración para validación de límites
const WEDDING_CONFIG = require('../../../../frontend/public/config.js');

class InvitationController {
    constructor(createInvitationUseCase, invitationRepository, validationService, logger) {
        this.createInvitationUseCase = createInvitationUseCase;
        this.invitationRepository = invitationRepository;
        this.validationService = validationService;
        this.logger = logger;
    }

    /**
     * Obtiene una invitación por código
     * GET /api/invitations/:code
     */
    async getInvitation(req, res) {
        const endOperation = this.logger.startOperation('getInvitation', {
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

            // Buscar invitación
            const invitation = await this.invitationRepository.findByCode(code);
            
            if (!invitation) {
                return res.status(404).json({
                    success: false,
                    error: 'Invitación no encontrada'
                });
            }

            endOperation({ found: true });

            res.json({
                success: true,
                invitation: invitation.toObject()
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
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
     * Crea una nueva invitación
     * POST /api/invitations
     */
    async createInvitation(req, res) {
        const endOperation = this.logger.startOperation('createInvitation', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        try {
            // Validar datos de entrada
            const validation = this.validationService.validateInvitationData(req.body);
            
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de invitación inválidos',
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

            res.status(201).json(result);

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
     * Obtiene todas las invitaciones con filtros y paginación
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
                limit = 10,
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

            // Validar parámetros de paginación
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            if (isNaN(pageNum) || pageNum < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Número de página inválido'
                });
            }

            if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Límite inválido (1-1000)'
                });
            }

            // Construir filtros
            const filters = {};
            if (status) filters.status = status;
            if (confirmed !== undefined) filters.confirmed = confirmed === 'true';
            if (search) filters.search = search;
            if (passes) filters.passes = passes;
            if (table) filters.table = table;
            if (phone) filters.phone = phone;

            // Construir opciones de ordenamiento
            const sort = {
                field: sortBy,
                direction: sortOrder
            };

            // Obtener invitaciones paginadas
            let result = await this.invitationRepository.findPaginated(
                pageNum, 
                limitNum, 
                filters, 
                sort,
                includeInactive === 'true'
            );

            endOperation({ 
                count: result.data.length,
                total: result.pagination.total 
            });

            // Convertir entidades a objetos planos
            const serializedData = result.data.map(invitation => invitation.toObject());

            res.json({
                success: true,
                data: serializedData,
                pagination: result.pagination
            });

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
     * Actualiza una invitación
     * PUT /api/invitations/:code
     */
    async updateInvitation(req, res) {
        const endOperation = this.logger.startOperation('updateInvitation', {
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

            // Buscar invitación existente
            const existingInvitation = await this.invitationRepository.findByCode(code);
            if (!existingInvitation) {
                return res.status(404).json({
                    success: false,
                    error: 'Invitación no encontrada'
                });
            }

            // Validar datos de actualización
            const validation = this.validationService.validateInvitationData({
                ...existingInvitation.toObject(),
                ...req.body
            });

            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de actualización inválidos',
                    details: validation.errors
                });
            }

            // Crear invitación actualizada
            const updatedInvitation = existingInvitation.clone();
            updatedInvitation.update(validation.sanitized);

            // Guardar cambios
            const result = await this.invitationRepository.update(code, updatedInvitation);

            endOperation({ updated: true });

            res.json({
                success: true,
                invitation: result.toObject(),
                message: 'Invitación actualizada exitosamente'
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
     * Elimina una invitación (soft delete)
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

            // Validar código
            if (!this.validationService.validateInvitationCode(code)) {
                return res.status(400).json({
                    success: false,
                    error: 'Código de invitación inválido'
                });
            }

            // Eliminar invitación
            const result = await this.invitationRepository.delete(code, 'admin', reason);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: 'Invitación no encontrada'
                });
            }

            endOperation({ deleted: true });

            res.json({
                success: true,
                message: 'Invitación eliminada exitosamente'
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
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
     * Restaura (activa) una invitación previamente eliminada
     * PUT /api/invitations/:code/activate
     */
    async restoreInvitation(req, res) {
        const endOperation = this.logger.startOperation('restoreInvitation', {
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

            // 1. Buscar la invitación (incluso si está inactiva)
            const invitation = await this.invitationRepository.findByCode(code);
            
            if (!invitation) {
                return res.status(404).json({
                    success: false,
                    error: 'Invitación no encontrada'
                });
            }

            // Si ya está activa, no hacer nada
            if (invitation.status !== 'inactive') {
                return res.status(400).json({
                    success: false,
                    error: 'La invitación ya está activa'
                });
            }

            // 2. Validar cupo
            const stats = await this.invitationRepository.getStats();
            const currentOccupied = stats.occupiedPasses;
            const targetTotal = WEDDING_CONFIG.guests.targetTotal;
            const invitationPasses = invitation.numberOfPasses;

            if (currentOccupied + invitationPasses > targetTotal) {
                return res.status(400).json({
                    success: false,
                    error: `No se puede activar: Excedería el límite de ${targetTotal} invitados (Actual: ${currentOccupied}, Invitación: ${invitationPasses})`
                });
            }

            // 3. Restaurar
            const result = await this.invitationRepository.restore(code);

            endOperation({ restored: true });

            res.json({
                success: true,
                invitation: result.toObject(),
                message: 'Invitación activada exitosamente'
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
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
     * Obtiene estadísticas de invitaciones
     * GET /api/stats
     */
    async getStats(req, res) {
        const endOperation = this.logger.startOperation('getInvitationStats', {
            ip: req.ip
        });

        try {
            // Obtener estadísticas unificadas desde invitaciones
            const invitationStats = await this.invitationRepository.getStats();

            // Calcular tasas de confirmación y asistencia
            const confirmationRate = invitationStats.active > 0 
                ? (invitationStats.confirmed / invitationStats.active * 100).toFixed(2)
                : "0.00";

            const attendanceRate = invitationStats.totalIssuedPasses > 0
                ? (invitationStats.confirmedPasses / invitationStats.totalIssuedPasses * 100).toFixed(2)
                : "0.00";

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
                        averageGuestsPerConfirmation: invitationStats.confirmed > 0 
                            ? (invitationStats.confirmedPasses / invitationStats.confirmed).toFixed(2)
                            : "0.00"
                    },
                    passDistribution: {
                        // Desglose de pases activos
                        activeAdultPasses: invitationStats.activeAdultPasses || 0,
                        activeChildPasses: invitationStats.activeChildPasses || 0,
                        activeStaffPasses: invitationStats.activeStaffPasses || 0,
                        totalActivePasses: invitationStats.totalActivePasses || 0,
                        
                        // Porcentajes de distribución
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

            // Ejecutar importación en lote
            const result = await this.createInvitationUseCase.executeBatch(invitations);

            endOperation({ 
                imported: result.success.length,
                failed: result.errors.length 
            });

            res.json({
                success: true,
                result,
                message: `Importación completada: ${result.success.length} exitosas, ${result.errors.length} fallidas`
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

            if (!name || name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre debe tener al menos 2 caracteres'
                });
            }

            const invitations = await this.invitationRepository.findByGuestName(name);

            endOperation({ found: invitations.length });

            res.json({
                success: true,
                invitations: invitations.map(inv => inv.toObject()),
                count: invitations.length
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

module.exports = InvitationController;
