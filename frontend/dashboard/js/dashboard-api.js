// dashboard-api.js - Centralización de llamadas API

import { API_ENDPOINTS } from './dashboard-constants.js';
import { formatGuestNames } from './dashboard-utils.js';

/**
 * Clase para manejar todas las llamadas API del panel de administración
 */
export class AdminAPI {
    constructor(backendUrl) {
        this.backendUrl = backendUrl;
        this.headers = {
            'Content-Type': 'application/json'
        };

        // Configurar autenticación si está habilitada
        this.setupAuthentication();
    }

    /**
     * Configura la autenticación basada en la configuración
     */
    setupAuthentication() {
        // Intentar obtener token JWT guardado (nueva forma)
        const token = localStorage.getItem('dashboardToken');
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
            return;
        }

        // Fallback a configuración básica si no hay token
        const config =
            (typeof window !== 'undefined' && window.WEDDING_CONFIG?.api?.dashboard) || null;

        if (config?.requireAuth) {
            if (config.authType === 'basic' && config.credentials) {
                const { username, password } = config.credentials;
                const credentials = btoa(`${username}:${password}`);
                this.headers['Authorization'] = `Basic ${credentials}`;
            }
        }
    }

    /**
     * Configura token JWT para autenticación
     * @param {string} token - Token JWT
     */
    setJWTToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }

    /**
     * Convierte el estado interno a texto para mostrar
     * @param {string} status - Estado de la invitación
     * @returns {string} Texto para mostrar
     */
    getStatusDisplayText(status) {
        const statusMap = {
            pending: 'Pendiente',
            confirmed: 'Confirmado',
            partial: 'Parcial',
            cancelled: 'Cancelado',
            inactive: 'Inactivo'
        };

        return statusMap[status] || 'Pendiente';
    }

    /**
     * Maneja errores de API de forma consistente
     * @param {Error} error - Error capturado
     * @returns {Object} Objeto de error formateado
     */
    handleApiError(error) {
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

            // Asegurarnos de que el token esté actualizado antes de cada petición
            this.setupAuthentication();

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                }
            });

            if (response.status === 401) {
                // Token inválido o expirado
                localStorage.removeItem('dashboardToken');
                window.location.href = '/dashboard/login.html';
                return { success: false, error: 'Sesión expirada', type: 'auth' };
            }

            if (!response.ok) {
                const error = new Error(`HTTP error! status: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            return {
                success: true,
                data
            };
        } catch (error) {
            return this.handleApiError(error);
        }
    }

    /**
     * Obtiene las estadísticas del dashboard
     * @returns {Promise<Object>} Estadísticas o error
     */
    async fetchStats() {
        const result = await this.fetchWithErrorHandling(API_ENDPOINTS.STATS);

        if (result.success) {
            return {
                success: true,
                data: result.data.stats || result.data
            };
        }

        return result;
    }

    /**
     * Obtiene la configuración dinámica
     * @returns {Promise<Object>} Configuración o error
     */
    async fetchSettings() {
        return this.fetchWithErrorHandling('/settings');
    }

    /**
     * Actualiza la configuración dinámica
     * @param {Object} settings - Nueva configuración
     * @returns {Promise<Object>} Resultado de la actualización
     */
    async updateSettings(settings) {
        return this.fetchWithErrorHandling('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    /**
     * Obtiene todas las invitaciones
     * @param {Object} options - Opciones de filtrado y paginación
     * @returns {Promise<Object>} Invitaciones o error
     */
    async fetchInvitations(options = {}) {
        // Construir query string
        const queryParams = new URLSearchParams();

        // Agregar todas las opciones al query string
        Object.keys(options).forEach(key => {
            if (options[key] !== undefined && options[key] !== null && options[key] !== '') {
                queryParams.append(key, options[key]);
            }
        });

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/invitations?${queryString}` : '/invitations';

        const result = await this.fetchWithErrorHandling(endpoint);

        if (result.success) {
            // Normalizar la respuesta - el backend puede devolver diferentes estructuras
            let invitations = [];

            if (result.data) {
                // Si tiene estructura de paginación
                if (result.data.data && Array.isArray(result.data.data)) {
                    invitations = result.data.data;
                }
                // Si las invitaciones están directamente en data
                else if (Array.isArray(result.data)) {
                    invitations = result.data;
                }
                // Si están en invitations
                else if (result.data.invitations && Array.isArray(result.data.invitations)) {
                    invitations = result.data.invitations;
                }
            }

            return {
                success: true,
                invitations: invitations,
                pagination: result.data.pagination
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
        const result = await this.fetchWithErrorHandling('/invitations', {
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
        const result = await this.fetchWithErrorHandling(`/invitations/${code}`, {
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
        const result = await this.fetchWithErrorHandling(`/invitations/${code}`, {
            method: 'DELETE'
        });

        return result;
    }

    /**
     * Obtiene invitaciones confirmadas recientemente
     * @param {number} days - Días hacia atrás (0 para sin límite de tiempo)
     * @param {number} limit - Límite de resultados (default: 5)
     * @returns {Promise<Object>} Confirmaciones recientes o error
     */
    async fetchRecentConfirmations(days = 7, limit = 5) {
        const result = await this.fetchInvitations();

        if (result.success) {
            const invitations = result.invitations || [];

            // Filtrar solo confirmadas/parciales que tengan fecha de confirmación
            let recentConfirmations = invitations.filter(
                inv =>
                    (inv.status === 'confirmed' || inv.status === 'partial') && inv.confirmationDate
            );

            // Si se especifica un rango de días, filtrar por fecha
            if (days > 0) {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);

                recentConfirmations = recentConfirmations.filter(inv => {
                    const confirmDate = new Date(inv.confirmationDate);
                    return confirmDate >= cutoffDate;
                });
            }

            // Ordenar y limitar
            recentConfirmations = recentConfirmations
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
     * Descarga el CSV de invitaciones desde el servidor
     * @returns {Promise<Object>} Resultado de la operación
     */
    async downloadInvitationsCSV() {
        try {
            const url = `${this.backendUrl}/invitations/export?format=csv`;
            const response = await fetch(url, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `invitaciones_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            return { success: true };
        } catch (error) {
            return this.handleApiError(error, 'download-csv');
        }
    }

    /**
     * Exporta invitaciones a CSV (Cliente-side fallback)
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
            let cancelledPasses = 0;

            // Calcular pases cancelados basado en el estado
            if (invitation.status === 'cancelled') {
                cancelledPasses = invitation.numberOfPasses;
            } else if (invitation.status === 'partial') {
                cancelledPasses = invitation.numberOfPasses - (invitation.confirmedPasses || 0);
            }

            const isConfirmed =
                invitation.status === 'confirmed' || invitation.status === 'partial';
            const dietaryRestrictions = invitation.dietaryRestrictionsNames
                ? `${invitation.dietaryRestrictionsNames} ${invitation.dietaryRestrictionsDetails ? `(${invitation.dietaryRestrictionsDetails})` : ''}`
                : '-';

            return [
                invitation.code,
                formatGuestNames(invitation.guestNames),
                invitation.numberOfPasses,
                this.getStatusDisplayText(invitation.status),
                invitation.confirmedPasses || 0,
                cancelledPasses,
                isConfirmed ? 'Sí' : invitation.status === 'cancelled' ? 'No' : '-',
                invitation.phone || '-',
                dietaryRestrictions,
                invitation.generalMessage || '-',
                invitation.confirmationDate
                    ? new Date(invitation.confirmationDate).toLocaleDateString('es-MX')
                    : '-'
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
        try {
            // Procesar CSV y convertir a formato de invitaciones
            const invitations = this.parseCSVToInvitations(csvContent);

            if (invitations.length === 0) {
                return {
                    success: false,
                    created: 0,
                    errors: ['No se encontraron invitaciones válidas en el archivo CSV'],
                    createdInvitations: []
                };
            }

            const result = await this.fetchWithErrorHandling('/invitations/import', {
                method: 'POST',
                body: JSON.stringify({ invitations })
            });

            if (result.success) {
                const data = result.data.result || result.data;
                return {
                    success: true,
                    created: data.success?.length || 0,
                    errors: data.errors || [],
                    createdInvitations: data.success || []
                };
            }

            return {
                success: false,
                created: 0,
                errors: [result.error],
                createdInvitations: []
            };
        } catch (error) {
            return {
                success: false,
                created: 0,
                errors: [error.message],
                createdInvitations: []
            };
        }
    }

    /**
     * Convierte contenido CSV a formato de invitaciones
     * @param {string} csvContent - Contenido CSV
     * @returns {Array} Array de objetos de invitación
     * @private
     */
    parseCSVToInvitations(csvContent) {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) {
            throw new Error(
                'El archivo CSV debe tener al menos una fila de encabezados y una fila de datos'
            );
        }

        // Obtener encabezados
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const invitations = [];

        // Procesar cada fila de datos
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                continue;
            }

            const values = this.parseCSVLine(line);
            if (values.length < 2) {
                continue;
            } // Necesita al menos Nombres y Pases

            const invitation = {};

            // Mapear valores a campos
            headers.forEach((header, index) => {
                if (values[index] !== undefined) {
                    const value = values[index].trim();

                    switch (header.toLowerCase()) {
                        case 'nombres':
                        case 'nombre':
                        case 'invitados':
                            // Agregar soporte para pipe (|) que es el separador usado en la exportación
                            invitation.guestNames = value
                                .split(/\s+y\s+|\s*,\s*|\s*&\s*|\|/)
                                .filter(n => n.trim());
                            break;
                        case 'pases':
                        case 'passes':
                            invitation.numberOfPasses = parseInt(value) || 1;
                            break;
                        case 'mesa':
                        case 'table':
                            if (value && value !== '0') {
                                invitation.tableNumber = parseInt(value) || null;
                            }
                            break;
                        case 'telefono':
                        case 'teléfono':
                        case 'phone':
                            if (value) {
                                invitation.phone = value;
                            }
                            break;
                        case 'adultos':
                        case 'adults':
                            invitation.adults = parseInt(value) || 0;
                            break;
                        case 'niños':
                        case 'ninos':
                        case 'children':
                            invitation.children = parseInt(value) || 0;
                            break;
                        case 'staff':
                            invitation.staff = parseInt(value) || 0;
                            break;
                    }
                }
            });

            // Validaciones básicas
            if (!invitation.guestNames || invitation.guestNames.length === 0) {
                continue; // Saltar filas sin nombres
            }

            if (!invitation.numberOfPasses || invitation.numberOfPasses < 1) {
                invitation.numberOfPasses = 1;
            }

            // Validar suma de tipos de invitados si están especificados
            if (invitation.adults || invitation.children || invitation.staff) {
                const total =
                    (invitation.adults || 0) + (invitation.children || 0) + (invitation.staff || 0);

                if (total !== invitation.numberOfPasses) {
                }
            }

            invitations.push(invitation);
        }

        return invitations;
    }

    /**
     * Parsea una línea CSV manejando comillas y comas
     * @param {string} line - Línea CSV
     * @returns {Array} Array de valores
     * @private
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Comilla escapada
                    current += '"';
                    i++; // Saltar la siguiente comilla
                } else {
                    // Cambiar estado de comillas
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Separador de campo
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        // Agregar el último valor
        values.push(current);

        return values;
    }
}

/**
 * Instancia global de AdminAPI
 * Se inicializa con la configuración del backend
 */
function getBackendUrl() {
    // Intentar obtener la URL desde WEDDING_CONFIG, con fallback a localhost
    if (typeof window !== 'undefined' && window.WEDDING_CONFIG?.api?.backendUrl) {
        return window.WEDDING_CONFIG.api.backendUrl + '/api/v1';
    }
    return 'http://localhost:3000/api/v1';
}

export const adminAPI = new AdminAPI(getBackendUrl());

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
        if (!result) {
            return 'Error desconocido';
        }
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
