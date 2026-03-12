/**
 * Cliente API para comunicación con el backend
 * Maneja todas las peticiones HTTP de forma centralizada
 */

export class ApiClient {
    constructor(baseUrl, config = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remover slash final
        this.config = {
            timeout: 10000,
            retries: 3,
            ...config
        };
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        };
    }

    /**
     * Realiza una petición HTTP
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de la petición
     * @returns {Promise<Object>} Respuesta de la API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method: 'GET',
            headers: { ...this.defaultHeaders },
            ...options
        };

        // Agregar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        config.signal = controller.signal;

        try {
            console.log(`🌐 API Request: ${config.method} ${url}`);

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                // Intentar obtener detalles del error del cuerpo de la respuesta
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                        if (errorData.details) {
                            errorMessage += `: ${JSON.stringify(errorData.details)}`;
                        }
                    }
                } catch (e) {
                    // Si no es JSON, usar el texto de estado
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`✅ API Response: ${config.method} ${url}`, data);

            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.config.timeout}ms`);
            }

            console.error(`❌ API Error: ${config.method} ${url}`, error);
            throw error;
        }
    }

    /**
     * Realiza una petición GET
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} params - Parámetros de query
     * @returns {Promise<Object>}
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, { method: 'GET' });
    }

    /**
     * Realiza una petición POST
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @returns {Promise<Object>}
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Realiza una petición PUT
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} data - Datos a enviar
     * @returns {Promise<Object>}
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Realiza una petición DELETE
     * @param {string} endpoint - Endpoint de la API
     * @returns {Promise<Object>}
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Obtiene una invitación por código
     * @param {string} code - Código de la invitación
     * @returns {Promise<Object>}
     */
    async getInvitation(code) {
        if (!code || typeof code !== 'string') {
            throw new Error('Invitation code is required and must be a string');
        }

        try {
            return await this.get(`/invitations/${encodeURIComponent(code)}`);
        } catch (error) {
            if (error.message.includes('404')) {
                throw new Error('Invitación no encontrada. Verifica el código ingresado.');
            }
            throw new Error('Error al cargar la invitación. Intenta nuevamente.');
        }
    }

    /**
     * Confirma la asistencia a una invitación
     * @param {string} code - Código de la invitación
     * @param {Object} confirmationData - Datos de confirmación
     * @returns {Promise<Object>}
     */
    async confirmInvitation(code, confirmationData) {
        if (!code || typeof code !== 'string') {
            throw new Error('Invitation code is required and must be a string');
        }

        if (!confirmationData || typeof confirmationData !== 'object') {
            throw new Error('Confirmation data is required and must be an object');
        }

        // Mapear datos al formato del backend
        // El backend espera: willAttend, attendingGuests, attendingNames, etc.
        // El frontend envía: attending, guest_count, guest_names, etc.

        // Asegurar que willAttend sea booleano
        let willAttend = false;
        if (confirmationData.attending !== undefined) {
            willAttend =
                confirmationData.attending === true || confirmationData.attending === 'true';
        } else if (confirmationData.attendance !== undefined) {
            willAttend =
                confirmationData.attendance === 'si' || confirmationData.attendance === true;
        }

        const payload = {
            willAttend: willAttend,
            attendingGuests: parseInt(
                confirmationData.guest_count || confirmationData.attendingGuests || 0
            ),
            attendingNames: confirmationData.guest_names || confirmationData.attendingNames || [],
            phone: confirmationData.phone || '',
            email: confirmationData.email || '',
            dietaryRestrictions: confirmationData.dietaryRestrictions || '',
            message: confirmationData.message || ''
        };

        try {
            // Usar el endpoint de confirmaciones correcto
            return await this.post(`/confirmations/${encodeURIComponent(code)}`, {
                ...payload,
                confirmedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error detallado confirmación:', error);

            if (error.message.includes('404')) {
                throw new Error('Invitación no encontrada.');
            }

            // Si el error viene del backend con detalles, intentar mostrarlos
            if (error.message.includes('400')) {
                // Si el mensaje ya contiene detalles (gracias a la mejora en request()), re-lanzarlo tal cual
                if (error.message.includes('details') || error.message.includes(':')) {
                    throw error;
                }
                throw new Error('Datos de confirmación inválidos.');
            }

            throw new Error('Error al confirmar la asistencia. Intenta nuevamente.');
        }
    }

    /**
     * Verifica el estado de salud de la API
     * @returns {Promise<Object>}
     */
    async healthCheck() {
        try {
            const response = await this.get('/health');
            console.log('✅ API Health Check passed');
            return response;
        } catch (error) {
            console.warn('⚠️ API Health Check failed:', error.message);
            // No lanzar error para permitir que la app funcione offline
            return { status: 'offline', error: error.message };
        }
    }

    /**
     * Obtiene estadísticas de invitaciones (para admin)
     * @returns {Promise<Object>}
     */
    async getInvitationStats() {
        try {
            return await this.get('/invitations/stats');
        } catch (error) {
            console.error('Error getting invitation stats:', error);
            throw new Error('Error al obtener estadísticas de invitaciones.');
        }
    }

    /**
     * Realiza una petición con reintentos automáticos
     * @param {Function} requestFn - Función que realiza la petición
     * @param {number} maxRetries - Número máximo de reintentos
     * @returns {Promise<Object>}
     */
    async withRetries(requestFn, maxRetries = this.config.retries) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;

                // No reintentar en errores 4xx (errores del cliente)
                if (
                    error.message.includes('400') ||
                    error.message.includes('401') ||
                    error.message.includes('403') ||
                    error.message.includes('404')
                ) {
                    throw error;
                }

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt - 1) * 1000; // Backoff exponencial
                    console.log(`⏳ Retry attempt ${attempt}/${maxRetries} in ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error(`❌ All ${maxRetries} retry attempts failed`);
                }
            }
        }

        throw lastError;
    }

    /**
     * Establece headers personalizados
     * @param {Object} headers - Headers a establecer
     */
    setHeaders(headers) {
        this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    }

    /**
     * Obtiene la configuración actual
     * @returns {Object}
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Actualiza la configuración
     * @param {Object} newConfig - Nueva configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
