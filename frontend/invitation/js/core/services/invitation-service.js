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

            // Cargar desde API
            const response = await this.apiClient.getInvitation(normalizedCode);

            // Extraer datos de la invitación de la respuesta
            const invitationData = response.invitation || response;

            const invitation = new Invitation(invitationData);

            // Validar que la invitación sea válida
            if (!invitation.isValid()) {
                throw new Error('La invitación no es válida o está inactiva');
            }

            // Guardar en cache y establecer como actual
            this.cache.set(normalizedCode, invitation);
            this.currentInvitation = invitation;

            this.emit(EVENTS.CONTENT.LOADED, { invitation });

            return invitation;
        } catch (_error) {
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
        const normalizedCode = this.validateAndNormalizeCode(code);
        this.validateConfirmationData(confirmationData);

        try {
            const invitation = await this.getInvitationForConfirmation(normalizedCode);
            this.validateConfirmationAction(invitation, confirmationData);

            this.emit(EVENTS.RSVP.FORM_SUBMITTED, { invitation, confirmationData });

            const response = await this.apiClient.confirmInvitation(
                normalizedCode,
                confirmationData
            );

            this.updateLocalInvitationState(invitation, confirmationData, normalizedCode);

            this.emit(EVENTS.RSVP.CONFIRMATION_SUCCESS, {
                invitation,
                response,
                confirmationData
            });

            return invitation;
        } catch (error) {
            this.emit(EVENTS.RSVP.CONFIRMATION_ERROR, {
                error: error.message,
                code: normalizedCode,
                confirmationData
            });
            throw error;
        }
    }

    validateAndNormalizeCode(code) {
        if (!code || typeof code !== 'string') {
            throw new Error('El código de invitación es requerido');
        }
        return code.trim().toUpperCase();
    }

    validateConfirmationData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Los datos de confirmación son requeridos');
        }
    }

    async getInvitationForConfirmation(normalizedCode) {
        let invitation = this.currentInvitation;
        if (!invitation || invitation.code !== normalizedCode) {
            invitation = await this.loadInvitation(normalizedCode);
        }
        return invitation;
    }

    validateConfirmationAction(invitation, confirmationData) {
        if (!invitation.canConfirm() && !invitation.canModify()) {
            throw new Error('Esta invitación no puede ser modificada');
        }

        const validation = invitation.validateConfirmationData(confirmationData);
        if (!validation.isValid) {
            const errorMessage = validation.errors.join('. ');
            this.emit(EVENTS.RSVP.VALIDATION_ERROR, { errors: validation.errors });
            throw new Error(errorMessage);
        }
    }

    updateLocalInvitationState(invitation, confirmationData, normalizedCode) {
        invitation.confirm(confirmationData);
        this.cache.set(normalizedCode, invitation);
        this.currentInvitation = invitation;
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
            } catch (_err) {
                //
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
    }
}
