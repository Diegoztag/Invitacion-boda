/**
 * Get Invitation Use Case
 * Caso de uso para obtener invitaciones
 */

class GetInvitationUseCase {
    constructor(invitationRepository, logger) {
        this.invitationRepository = invitationRepository;
        this.logger = logger;
    }

    /**
     * Obtiene una invitación por código
     * @param {string} code - Código de la invitación
     * @returns {Object} Resultado de la operación
     */
    async execute(code) {
        const endOperation = this.logger.startOperation('getInvitation', { code });

        try {
            if (!code || typeof code !== 'string') {
                endOperation({ success: false, reason: 'invalid_code' });
                return {
                    success: false,
                    error: 'Código de invitación es requerido'
                };
            }

            const invitation = await this.invitationRepository.findByCode(code);

            if (!invitation) {
                endOperation({ success: false, reason: 'not_found' });
                return {
                    success: false,
                    error: 'Invitación no encontrada'
                };
            }

            // Verificar si la invitación está activa
            if (!invitation.isActive()) {
                endOperation({ success: false, reason: 'inactive' });
                return {
                    success: false,
                    error: 'Invitación no está activa'
                };
            }

            endOperation({ success: true });
            return {
                success: true,
                invitation: invitation.toObject(),
                message: 'Invitación encontrada'
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting invitation', {
                code,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo invitación'
            };
        }
    }

    /**
     * Obtiene todas las invitaciones con filtros y paginación
     * @param {Object} options - Opciones de consulta
     * @returns {Object} Resultado de la operación
     */
    async executeGetAll(options = {}) {
        const endOperation = this.logger.startOperation('getAllInvitations', options);

        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                status = null,
                confirmed = null,
                search = null
            } = options;

            // Validar parámetros
            if (page < 1 || limit < 1 || limit > 100) {
                endOperation({ success: false, reason: 'invalid_pagination' });
                return {
                    success: false,
                    error: 'Parámetros de paginación inválidos'
                };
            }

            const filters = {
                status,
                confirmed,
                search
            };

            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                sortOrder
            };

            const result = await this.invitationRepository.findPaginated(filters, pagination);

            endOperation({ 
                success: true, 
                total: result.total,
                page: result.page,
                totalPages: result.totalPages
            });

            return {
                success: true,
                invitations: result.data.map(invitation => invitation.toObject()),
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                    hasNext: result.hasNext,
                    hasPrev: result.hasPrev
                },
                message: `${result.total} invitaciones encontradas`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting all invitations', {
                options,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo invitaciones'
            };
        }
    }

    /**
     * Busca invitaciones por nombre
     * @param {string} name - Nombre a buscar
     * @returns {Object} Resultado de la operación
     */
    async executeSearch(name) {
        const endOperation = this.logger.startOperation('searchInvitations', { name });

        try {
            if (!name || typeof name !== 'string' || name.trim().length < 2) {
                endOperation({ success: false, reason: 'invalid_search_term' });
                return {
                    success: false,
                    error: 'Término de búsqueda debe tener al menos 2 caracteres'
                };
            }

            const invitations = await this.invitationRepository.searchByName(name.trim());

            endOperation({ success: true, found: invitations.length });

            return {
                success: true,
                invitations: invitations.map(invitation => invitation.toObject()),
                message: `${invitations.length} invitaciones encontradas`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error searching invitations', {
                name,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error buscando invitaciones'
            };
        }
    }

    /**
     * Obtiene estadísticas de invitaciones
     * @returns {Object} Resultado de la operación
     */
    async executeGetStats() {
        const endOperation = this.logger.startOperation('getInvitationStats');

        try {
            const stats = await this.invitationRepository.getStats();

            endOperation({ success: true });

            return {
                success: true,
                stats,
                message: 'Estadísticas obtenidas exitosamente'
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting invitation stats', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo estadísticas'
            };
        }
    }

    /**
     * Exporta todas las invitaciones
     * @param {string} format - Formato de exportación (csv, json)
     * @returns {Object} Resultado de la operación
     */
    async executeExport(format = 'csv') {
        const endOperation = this.logger.startOperation('exportInvitations', { format });

        try {
            if (!['csv', 'json'].includes(format)) {
                endOperation({ success: false, reason: 'invalid_format' });
                return {
                    success: false,
                    error: 'Formato de exportación no válido'
                };
            }

            const result = await this.invitationRepository.exportAll(format);

            endOperation({ success: true, format, recordCount: result.count });

            return {
                success: true,
                data: result.data,
                count: result.count,
                format,
                message: `${result.count} invitaciones exportadas en formato ${format}`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error exporting invitations', {
                format,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error exportando invitaciones'
            };
        }
    }
}

module.exports = GetInvitationUseCase;
