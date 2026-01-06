// admin-api.js - Centralización de llamadas API

import { API_ENDPOINTS } from './admin-constants.js';

/**
 * Clase para manejar todas las llamadas API del panel de administración
 */
export class AdminAPI {
    constructor(backendUrl) {
        this.backendUrl = backendUrl;
        this.headers = {
            'Content-Type': 'application/json'
        };
    }
    
    /**
     * Maneja errores de API de forma consistente
     * @param {Error} error - Error capturado
     * @param {string} context - Contexto del error
     * @returns {Object} Objeto de error formateado
     */
    handleApiError(error, context = '') {
        console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
        
        // Determinar tipo de error
        if (error.name === 'NetworkError' || !navigator.onLine) {
            return {
                success: false,
                error: 'Error de conexión. Por favor verifica tu conexión a internet.',
                type: 'network'
            };
        }
        
        if (error.status === 404) {
            return {
                success: false,
                error: 'Recurso no encontrado.',
                type: 'not_found'
            };
        }
        
        if (error.status === 500) {
            return {
                success: false,
                error: 'Error del servidor. Por favor intenta más tarde.',
                type: 'server'
            };
        }
        
        return {
            success: false,
            error: error.message || 'Error desconocido',
            type: 'unknown'
        };
    }
    
    /**
     * Realiza una petición fetch con manejo de errores
     * @param {string} endpoint - Endpoint relativo
     * @param {Object} options - Opciones de fetch
     * @returns {Promise<Object>} Respuesta parseada
     */
    async fetchWithErrorHandling(endpoint, options = {}) {
        try {
            const url = `${this.backendUrl}${endpoint}`;
            console.log('Fetching:', url, 'with options:', options);
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                }
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const error = new Error(`HTTP error! status: ${response.status}`);
                error.status = response.status;
                throw error;
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Fetch error:', error);
            return this.handleApiError(error, endpoint);
        }
    }
    
    /**
     * Obtiene las estadísticas del dashboard
     * @returns {Promise<Object>} Estadísticas o error
     */
    async fetchStats() {
        const result = await this.fetchWithErrorHandling('/stats');
        
        if (result.success) {
            return {
                success: true,
                stats: result.data.stats
            };
        }
        
        return result;
    }
    
    /**
     * Obtiene todas las invitaciones
     * @returns {Promise<Object>} Invitaciones o error
     */
    async fetchInvitations() {
        const result = await this.fetchWithErrorHandling('/invitations');
        
        if (result.success) {
            return {
                success: true,
                invitations: result.data.invitations || []
            };
        }
        
        return result;
    }
    
    /**
     * Crea una nueva invitación
     * @param {Object} invitationData - Datos de la invitación
     * @returns {Promise<Object>} Invitación creada o error
     */
    async createInvitation(invitationData) {
        const result = await this.fetchWithErrorHandling('/invitation', {
            method: 'POST',
            body: JSON.stringify(invitationData)
        });
        
        if (result.success) {
            return {
                success: true,
                invitation: result.data.invitation,
                invitationUrl: result.data.invitationUrl
            };
        }
        
        return result;
    }
    
    /**
     * Actualiza una invitación existente
     * @param {string} code - Código de la invitación
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>} Invitación actualizada o error
     */
    async updateInvitation(code, updateData) {
        const result = await this.fetchWithErrorHandling(`/invitation/${code}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        if (result.success) {
            return {
                success: true,
                invitation: result.data.invitation
            };
        }
        
        return result;
    }
    
    /**
     * Elimina una invitación
     * @param {string} code - Código de la invitación
     * @returns {Promise<Object>} Resultado de la eliminación
     */
    async deleteInvitation(code) {
        const result = await this.fetchWithErrorHandling(`/invitation/${code}`, {
            method: 'DELETE'
        });
        
        return result;
    }
    
    /**
     * Obtiene invitaciones confirmadas recientemente
     * @param {number} days - Días hacia atrás (default: 7)
     * @param {number} limit - Límite de resultados (default: 5)
     * @returns {Promise<Object>} Confirmaciones recientes o error
     */
    async fetchRecentConfirmations(days = 7, limit = 5) {
        const result = await this.fetchInvitations();
        
        if (result.success) {
            const invitations = result.invitations || [];
            
            // Filtrar y ordenar confirmaciones recientes
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const recentConfirmations = invitations
                .filter(inv => {
                    if (inv.confirmed && inv.confirmationDate) {
                        const confirmDate = new Date(inv.confirmationDate);
                        return confirmDate >= cutoffDate;
                    }
                    return false;
                })
                .sort((a, b) => new Date(b.confirmationDate) - new Date(a.confirmationDate))
                .slice(0, limit);
            
            return {
                success: true,
                confirmations: recentConfirmations
            };
        }
        
        return result;
    }
    
    /**
     * Calcula el total de pases confirmados en los últimos días
     * @param {number} days - Días hacia atrás (default: 7)
     * @returns {Promise<Object>} Total de pases o error
     */
    async calculateRecentConfirmedPasses(days = 7) {
        const result = await this.fetchRecentConfirmations(days, 999);
        
        if (result.success) {
            const totalPasses = result.confirmations.reduce((sum, inv) => {
                return sum + (inv.confirmedPasses || 0);
            }, 0);
            
            return {
                success: true,
                totalPasses,
                confirmationCount: result.confirmations.length
            };
        }
        
        return result;
    }
    
    /**
     * Exporta invitaciones a CSV
     * @param {Array} invitations - Array de invitaciones
     * @param {string} filename - Nombre del archivo (sin extensión)
     * @returns {void}
     */
    exportToCSV(invitations, filename = 'invitaciones') {
        const headers = [
            'Código',
            'Invitados',
            'Pases',
            'Estado',
            'Confirmados',
            'Cancelados',
            'Asistirá',
            'Teléfono',
            'Restricciones',
            'Mensaje',
            'Fecha Confirmación'
        ];
        
        const rows = invitations.map(invitation => {
            const details = invitation.confirmationDetails || {};
            let cancelledPasses = 0;
            
            if (invitation.confirmed && details) {
                if (!details.willAttend) {
                    cancelledPasses = invitation.numberOfPasses;
                } else if (details.willAttend && invitation.confirmedPasses < invitation.numberOfPasses) {
                    cancelledPasses = invitation.numberOfPasses - invitation.confirmedPasses;
                }
            }
            
            return [
                invitation.code,
                invitation.guestNames.join(' y '),
                invitation.numberOfPasses,
                invitation.confirmed ? 'Confirmado' : 'Pendiente',
                invitation.confirmedPasses || 0,
                cancelledPasses,
                details.willAttend !== undefined ? (details.willAttend ? 'Sí' : 'No') : '-',
                details.phone || invitation.phone || '-',
                details.dietaryRestrictions || '-',
                details.message || '-',
                invitation.confirmationDate ? new Date(invitation.confirmationDate).toLocaleDateString('es-MX') : '-'
            ];
        });
        
        // Generar CSV
        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
        });
        
        // Descargar archivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
    
    /**
     * Importa invitaciones desde contenido CSV
     * @param {string} csvContent - Contenido del archivo CSV
     * @returns {Promise<Object>} Resultado de la importación
     */
    async importInvitations(csvContent) {
        const result = await this.fetchWithErrorHandling('/import-csv', {
            method: 'POST',
            body: JSON.stringify({ csvContent })
        });
        
        if (result.success) {
            const data = result.data;
            return {
                success: true,
                created: data.imported || 0,
                errors: data.errors || [],
                createdInvitations: data.invitations || []
            };
        }
        
        return {
            success: false,
            created: 0,
            errors: [result.error],
            createdInvitations: []
        };
    }
}

/**
 * Factory function para crear instancia de API
 * @param {string} backendUrl - URL del backend
 * @returns {AdminAPI} Instancia de AdminAPI
 */
export function createAdminAPI(backendUrl) {
    return new AdminAPI(backendUrl);
}

/**
 * Funciones helper para manejo de respuestas
 */
export const APIHelpers = {
    /**
     * Verifica si una respuesta fue exitosa
     * @param {Object} result - Resultado de API
     * @returns {boolean}
     */
    isSuccess(result) {
        return result && result.success === true;
    },
    
    /**
     * Obtiene el mensaje de error de una respuesta
     * @param {Object} result - Resultado de API
     * @returns {string}
     */
    getErrorMessage(result) {
        if (!result) return 'Error desconocido';
        return result.error || 'Error al procesar la solicitud';
    },
    
    /**
     * Determina si el error es de red
     * @param {Object} result - Resultado de API
     * @returns {boolean}
     */
    isNetworkError(result) {
        return result && result.type === 'network';
    },
    
    /**
     * Determina si el error es del servidor
     * @param {Object} result - Resultado de API
     * @returns {boolean}
     */
    isServerError(result) {
        return result && result.type === 'server';
    }
};
