/**
 * Get Confirmation Stats Use Case
 * Caso de uso para obtener estadísticas de confirmaciones
 */

class GetConfirmationStatsUseCase {
    constructor(confirmationRepository, invitationRepository, logger) {
        this.confirmationRepository = confirmationRepository;
        this.invitationRepository = invitationRepository;
        this.logger = logger;
    }

    /**
     * Helper para obtener confirmaciones filtrando las de invitaciones inactivas
     * @returns {Promise<Array>} Lista de confirmaciones activas
     * @private
     */
    async _getActiveConfirmations() {
        const confirmations = await this.confirmationRepository.findAll();
        
        // Obtener invitaciones inactivas
        const inactiveInvitations = await this.invitationRepository.findAll({ status: 'inactive' }, true);
        const inactiveCodes = new Set(inactiveInvitations.map(inv => inv.code));
        
        // Filtrar confirmaciones de invitaciones inactivas
        return confirmations.filter(conf => !inactiveCodes.has(conf.code));
    }

    /**
     * Obtiene estadísticas generales de confirmaciones e invitaciones
     * @returns {Object} Resultado de la operación
     */
    async execute() {
        const endOperation = this.logger.startOperation('getConfirmationStats');

        try {
            // 1. Obtener estadísticas de invitaciones (ya excluye inactivas)
            const invitationStats = await this.invitationRepository.getStats();

            // 2. Obtener confirmaciones filtradas (excluyendo inactivas) para métricas adicionales
            const confirmations = await this._getActiveConfirmations();
            
            // Calcular métricas adicionales de confirmaciones
            const positive = confirmations.filter(conf => conf.isPositive());
            const withDietaryRestrictions = confirmations.filter(conf => conf.hasDietaryRestrictions()).length;
            const withMessages = confirmations.filter(conf => conf.hasMessage()).length;
            const withPhone = confirmations.filter(conf => conf.hasPhone()).length;

            // 3. Construir respuesta estructurada para el frontend
            const stats = {
                // Estadísticas de Invitaciones
                invitations: {
                    total: invitationStats.total,
                    totalPasses: invitationStats.totalIssuedPasses,
                    confirmed: invitationStats.confirmed + invitationStats.partial, // Incluir parciales como confirmados en conteo general
                    pending: invitationStats.pending,
                    cancelled: invitationStats.cancelled,
                    inactive: invitationStats.inactive
                },
                
                // Estadísticas de Confirmaciones (Pases)
                confirmations: {
                    totalConfirmedGuests: invitationStats.confirmedPasses,
                    pendingPasses: invitationStats.pendingPasses,
                    byType: {
                        adults: invitationStats.confirmedAdultPasses,
                        children: invitationStats.confirmedChildPasses,
                        staff: invitationStats.confirmedStaffPasses
                    },
                    // Métricas adicionales
                    withDietaryRestrictions,
                    withMessages,
                    withPhone
                },
                
                // Distribución de Pases
                passDistribution: {
                    activeAdultPasses: invitationStats.activeAdultPasses,
                    activeChildPasses: invitationStats.activeChildPasses,
                    activeStaffPasses: invitationStats.activeStaffPasses,
                    totalActivePasses: invitationStats.totalActivePasses,
                    distributionPercentages: invitationStats.distributionPercentages
                },
                
                // Tasas de conversión
                rates: {
                    confirmationRate: invitationStats.total > 0 ? 
                        Math.round(((invitationStats.confirmed + invitationStats.partial) / invitationStats.total) * 100) : 0,
                    attendanceRate: invitationStats.totalActivePasses > 0 ? 
                        Math.round((invitationStats.confirmedPasses / invitationStats.totalActivePasses) * 100) : 0
                }
            };

            endOperation({ success: true });

            return {
                success: true,
                ...stats, // Esparcir propiedades para mantener compatibilidad si es necesario
                message: 'Estadísticas obtenidas exitosamente'
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting confirmation stats', {
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
     * Obtiene confirmaciones positivas
     * @returns {Object} Resultado de la operación
     */
    async executeGetPositive() {
        const endOperation = this.logger.startOperation('getPositiveConfirmations');

        try {
            const allConfirmations = await this._getActiveConfirmations();
            const confirmations = allConfirmations.filter(conf => conf.isPositive());

            endOperation({ success: true, count: confirmations.length });

            return {
                success: true,
                confirmations: confirmations.map(confirmation => confirmation.toObject()),
                count: confirmations.length,
                message: `${confirmations.length} confirmaciones positivas encontradas`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting positive confirmations', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo confirmaciones positivas'
            };
        }
    }

    /**
     * Obtiene confirmaciones negativas
     * @returns {Object} Resultado de la operación
     */
    async executeGetNegative() {
        const endOperation = this.logger.startOperation('getNegativeConfirmations');

        try {
            const allConfirmations = await this._getActiveConfirmations();
            const confirmations = allConfirmations.filter(conf => conf.isNegative());

            endOperation({ success: true, count: confirmations.length });

            return {
                success: true,
                confirmations: confirmations.map(confirmation => confirmation.toObject()),
                count: confirmations.length,
                message: `${confirmations.length} confirmaciones negativas encontradas`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting negative confirmations', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo confirmaciones negativas'
            };
        }
    }

    /**
     * Obtiene confirmaciones con restricciones dietarias
     * @returns {Object} Resultado de la operación
     */
    async executeGetWithDietaryRestrictions() {
        const endOperation = this.logger.startOperation('getConfirmationsWithDietaryRestrictions');

        try {
            const allConfirmations = await this._getActiveConfirmations();
            const confirmations = allConfirmations.filter(conf => conf.hasDietaryRestrictions());

            endOperation({ success: true, count: confirmations.length });

            return {
                success: true,
                confirmations: confirmations.map(confirmation => confirmation.toObject()),
                count: confirmations.length,
                message: `${confirmations.length} confirmaciones con restricciones dietarias encontradas`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting confirmations with dietary restrictions', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo confirmaciones con restricciones dietarias'
            };
        }
    }

    /**
     * Obtiene confirmaciones con mensajes
     * @returns {Object} Resultado de la operación
     */
    async executeGetWithMessages() {
        const endOperation = this.logger.startOperation('getConfirmationsWithMessages');

        try {
            const allConfirmations = await this._getActiveConfirmations();
            const confirmations = allConfirmations.filter(conf => conf.hasMessage());

            endOperation({ success: true, count: confirmations.length });

            return {
                success: true,
                confirmations: confirmations.map(confirmation => confirmation.toObject()),
                count: confirmations.length,
                message: `${confirmations.length} confirmaciones con mensajes encontradas`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting confirmations with messages', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo confirmaciones con mensajes'
            };
        }
    }

    /**
     * Obtiene confirmaciones recientes
     * @param {number} days - Número de días hacia atrás
     * @returns {Object} Resultado de la operación
     */
    async executeGetRecent(days = 7) {
        const endOperation = this.logger.startOperation('getRecentConfirmations', { days });

        try {
            if (days < 1 || days > 365) {
                endOperation({ success: false, reason: 'invalid_days' });
                return {
                    success: false,
                    error: 'Número de días debe estar entre 1 y 365'
                };
            }

            const allConfirmations = await this._getActiveConfirmations();
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const confirmations = allConfirmations.filter(conf => 
                new Date(conf.confirmedAt) > cutoffDate
            );

            endOperation({ success: true, count: confirmations.length, days });

            return {
                success: true,
                confirmations: confirmations.map(confirmation => confirmation.toObject()),
                count: confirmations.length,
                days,
                message: `${confirmations.length} confirmaciones en los últimos ${days} días`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting recent confirmations', {
                days,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo confirmaciones recientes'
            };
        }
    }

    /**
     * Obtiene el total de invitados confirmados
     * @returns {Object} Resultado de la operación
     */
    async executeGetTotalGuests() {
        const endOperation = this.logger.startOperation('getTotalConfirmedGuests');

        try {
            const allConfirmations = await this._getActiveConfirmations();
            const positiveConfirmations = allConfirmations.filter(conf => conf.isPositive());
            const total = positiveConfirmations.reduce((sum, conf) => sum + conf.attendingGuests, 0);

            endOperation({ success: true, total });

            return {
                success: true,
                total,
                message: `Total de invitados confirmados: ${total}`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error getting total confirmed guests', {
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error obteniendo total de invitados confirmados'
            };
        }
    }

    /**
     * Exporta confirmaciones
     * @param {string} format - Formato de exportación
     * @returns {Object} Resultado de la operación
     */
    async executeExport(format = 'csv') {
        const endOperation = this.logger.startOperation('exportConfirmations', { format });

        try {
            if (!['csv', 'json'].includes(format)) {
                endOperation({ success: false, reason: 'invalid_format' });
                return {
                    success: false,
                    error: 'Formato de exportación no válido'
                };
            }

            const result = await this.confirmationRepository.exportAll(format);

            endOperation({ success: true, format, recordCount: result.count });

            return {
                success: true,
                data: result.data,
                count: result.count,
                format,
                message: `${result.count} confirmaciones exportadas en formato ${format}`
            };

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error exporting confirmations', {
                format,
                error: error.message,
                stack: error.stack
            });

            return {
                success: false,
                error: 'Error exportando confirmaciones'
            };
        }
    }
}

module.exports = GetConfirmationStatsUseCase;
