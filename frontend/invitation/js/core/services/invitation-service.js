/**
 * Servicio de dominio para manejo de invitaciones
 * Contiene toda la lógica de negocio relacionada con invitaciones
 */

import { Invitation } from '../models/invitation.js';
import { EVENTS } from '../../shared/constants/events.js';

export class InvitationService {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.currentInvitation = null;
        this.cache = new Map();
        this.eventListeners = new Map();
    }

    /**
     * Carga una invitación por código
     * @param {string} code - Código de la invitación
     * @returns {Promise<Invitation>}
     */
    async loadInvitation(code) {
        if (!code || typeof code !== 'string') {
            throw new Error('El código de invitación es requerido');
        }

        const normalizedCode = code.trim().toUpperCase();

        try {
            // Verificar cache primero
            if (this.cache.has(normalizedCode)) {
                const cachedInvitation = this.cache.get(normalizedCode);
                this.currentInvitation = cachedInvitation;
                this.emit(EVENTS.CONTENT.LOADED, { invitation: cachedInvitation });
                return cachedInvitation;
            }

            console.log(`📨 Loading invitation: ${normalizedCode}`);

            // Cargar desde API
            const response = await this.apiClient.getInvitation(normalizedCode);
            console.log('📦 Raw response from API:', response);

            // Extraer datos de la invitación de la respuesta
            const invitationData = response.invitation || response;

            const invitation = new Invitation(invitationData);
            console.log('🏗️ Invitation model created:', invitation);
            console.log('🔍 Validation check:', {
                code: invitation.code,
                guestNames: invitation.guestNames,
                numberOfPasses: invitation.numberOfPasses,
                isActive: invitation.isActive,
                isValid: invitation.isValid()
            });

            // Validar que la invitación sea válida
            if (!invitation.isValid()) {
                throw new Error('La invitación no es válida o está inactiva');
            }

            // Guardar en cache y establecer como actual
            this.cache.set(normalizedCode, invitation);
            this.currentInvitation = invitation;

            console.log('✅ Invitation loaded successfully:', invitation.getDisplayName());
            this.emit(EVENTS.CONTENT.LOADED, { invitation });

            return invitation;
        } catch (error) {
            console.error(`❌ Error loading invitation ${normalizedCode}:`, error);
            this.emit(EVENTS.CONTENT.ERROR, { error: error.message, code: normalizedCode });
            throw error;
        }
    }

    /**
     * Confirma la asistencia de una invitación
     * @param {string} code - Código de la invitación
     * @param {Object} confirmationData - Datos de confirmación
     * @returns {Promise<Invitation>}
     */
    async confirmAttendance(code, confirmationData) {
        if (!code || typeof code !== 'string') {
            throw new Error('El código de invitación es requerido');
        }

        if (!confirmationData || typeof confirmationData !== 'object') {
            throw new Error('Los datos de confirmación son requeridos');
        }

        const normalizedCode = code.trim().toUpperCase();

        try {
            // Obtener la invitación actual o cargarla
            let invitation = this.currentInvitation;
            if (!invitation || invitation.code !== normalizedCode) {
                invitation = await this.loadInvitation(normalizedCode);
            }

            // Validar que se puede confirmar
            if (!invitation.canConfirm() && !invitation.canModify()) {
                throw new Error('Esta invitación no puede ser modificada');
            }

            // Validar datos de confirmación
            const validation = invitation.validateConfirmationData(confirmationData);
            if (!validation.isValid) {
                const errorMessage = validation.errors.join('. ');
                this.emit(EVENTS.RSVP.VALIDATION_ERROR, { errors: validation.errors });
                throw new Error(errorMessage);
            }

            console.log(`📝 Confirming attendance for: ${invitation.getDisplayName()}`);
            this.emit(EVENTS.RSVP.FORM_SUBMITTED, { invitation, confirmationData });

            // Enviar confirmación al backend
            const response = await this.apiClient.confirmInvitation(
                normalizedCode,
                confirmationData
            );

            // Actualizar el modelo local
            invitation.confirm(confirmationData);

            // Actualizar cache
            this.cache.set(normalizedCode, invitation);
            this.currentInvitation = invitation;

            console.log(`✅ Attendance confirmed successfully for: ${invitation.getDisplayName()}`);
            this.emit(EVENTS.RSVP.CONFIRMATION_SUCCESS, {
                invitation,
                response,
                confirmationData
            });

            return invitation;
        } catch (error) {
            console.error(`❌ Error confirming attendance for ${normalizedCode}:`, error);
            this.emit(EVENTS.RSVP.CONFIRMATION_ERROR, {
                error: error.message,
                code: normalizedCode,
                confirmationData
            });
            throw error;
        }
    }

    /**
     * Obtiene la invitación actual
     * @returns {Invitation|null}
     */
    getCurrentInvitation() {
        return this.currentInvitation;
    }

    /**
     * Verifica si hay una invitación cargada
     * @returns {boolean}
     */
    hasCurrentInvitation() {
        return this.currentInvitation !== null;
    }

    /**
     * Limpia la invitación actual
     */
    clearCurrentInvitation() {
        this.currentInvitation = null;
        console.log('🧹 Current invitation cleared');
    }

    /**
     * Obtiene una invitación del cache
     * @param {string} code - Código de la invitación
     * @returns {Invitation|null}
     */
    getCachedInvitation(code) {
        const normalizedCode = code.trim().toUpperCase();
        return this.cache.get(normalizedCode) || null;
    }

    /**
     * Verifica si una invitación está en cache
     * @param {string} code - Código de la invitación
     * @returns {boolean}
     */
    isCached(code) {
        const normalizedCode = code.trim().toUpperCase();
        return this.cache.has(normalizedCode);
    }

    /**
     * Limpia el cache de invitaciones
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Invitation cache cleared');
    }

    /**
     * Obtiene estadísticas del cache
     * @returns {Object}
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Valida un código de invitación (formato)
     * @param {string} code - Código a validar
     * @returns {Object} { isValid: boolean, error?: string }
     */
    validateInvitationCode(code) {
        if (!code || typeof code !== 'string') {
            return { isValid: false, error: 'El código es requerido' };
        }

        const trimmedCode = code.trim();

        if (trimmedCode.length === 0) {
            return { isValid: false, error: 'El código no puede estar vacío' };
        }

        if (trimmedCode.length < 3) {
            return { isValid: false, error: 'El código debe tener al menos 3 caracteres' };
        }

        if (trimmedCode.length > 20) {
            return { isValid: false, error: 'El código no puede tener más de 20 caracteres' };
        }

        // Verificar caracteres válidos (letras, números, guiones)
        if (!/^[A-Za-z0-9\-_]+$/.test(trimmedCode)) {
            return {
                isValid: false,
                error: 'El código solo puede contener letras, números y guiones'
            };
        }

        return { isValid: true };
    }

    /**
     * Busca invitaciones por nombre de invitado (para admin)
     * @param {string} guestName - Nombre del invitado
     * @returns {Promise<Invitation[]>}
     */
    async searchInvitationsByGuest(guestName) {
        if (!guestName || typeof guestName !== 'string') {
            throw new Error('El nombre del invitado es requerido');
        }

        try {
            const response = await this.apiClient.get('/api/invitations/search', {
                guestName: guestName.trim()
            });

            return response.invitations.map(data => new Invitation(data));
        } catch (error) {
            console.error('Error searching invitations:', error);
            throw new Error('Error al buscar invitaciones');
        }
    }

    /**
     * Obtiene estadísticas de invitaciones
     * @returns {Promise<Object>}
     */
    async getInvitationStats() {
        try {
            return await this.apiClient.getInvitationStats();
        } catch (error) {
            console.error('Error getting invitation stats:', error);
            throw new Error('Error al obtener estadísticas');
        }
    }

    /**
     * Registra un listener para eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remueve un listener de eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    off(event, callback) {
        if (!this.eventListeners.has(event)) {
            return;
        }

        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Emite un evento
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos del evento
     */
    emit(event, data) {
        if (!this.eventListeners.has(event)) {
            return;
        }

        this.eventListeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }

    /**
     * Limpia todos los listeners
     */
    clearEventListeners() {
        this.eventListeners.clear();
    }

    /**
     * Destruye el servicio y limpia recursos
     */
    destroy() {
        this.clearCache();
        this.clearEventListeners();
        this.currentInvitation = null;
        console.log('🗑️ InvitationService destroyed');
    }
}
