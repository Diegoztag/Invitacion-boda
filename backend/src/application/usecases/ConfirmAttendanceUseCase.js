/**
 * Confirm Attendance Use Case
 * Caso de uso para confirmar asistencia a una invitación
 * Sigue principios Clean Architecture y SOLID
 */

const Confirmation = require('../../core/entities/Confirmation');

class ConfirmAttendanceUseCase {
    constructor(
        invitationRepository,
        confirmationRepository,
        validationService,
        sseService,
        logger
    ) {
        this.invitationRepository = invitationRepository;
        this.confirmationRepository = confirmationRepository;
        this.validationService = validationService;
        this.sseService = sseService;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso para confirmar asistencia
     * @param {string} invitationCode - Código de la invitación
     * @param {Object} confirmationData - Datos de confirmación
     * @returns {Promise<Object>} Resultado de la operación
     */
    async execute(invitationCode, confirmationData) {
        try {
            const { invitation, normalizedData } = await this._prepareAndValidate(
                invitationCode,
                confirmationData
            );
            const savedConfirmation = await this._createAndSaveConfirmation(
                invitation,
                normalizedData
            );
            const updatedInvitation = await this._updateAndNotify(
                invitation,
                savedConfirmation,
                normalizedData
            );
            return this._buildSuccessResponse(
                updatedInvitation,
                savedConfirmation,
                normalizedData.willAttend
            );
        } catch (error) {
            return this._handleError(error, invitationCode, confirmationData);
        }
    }

    /**
     * Valida los datos de entrada
     * @param {string} invitationCode
     * @param {Object} confirmationData
     * @private
     */
    validateInput(invitationCode, confirmationData) {
        if (!invitationCode || typeof invitationCode !== 'string') {
            throw new Error('El código de invitación es requerido');
        }

        if (!confirmationData || typeof confirmationData !== 'object') {
            throw new Error('Los datos de confirmación son requeridos');
        }

        // Validar willAttend si se proporciona
        if (
            confirmationData.willAttend !== undefined &&
            typeof confirmationData.willAttend !== 'boolean'
        ) {
            throw new Error('willAttend debe ser un boolean');
        }

        // Validar attendingGuests si se proporciona
        if (confirmationData.attendingGuests !== undefined) {
            if (
                !Number.isInteger(confirmationData.attendingGuests) ||
                confirmationData.attendingGuests < 0
            ) {
                throw new Error('El número de invitados debe ser un entero no negativo');
            }
        }

        // Validar attendingNames si se proporciona
        if (
            confirmationData.attendingNames !== undefined &&
            !Array.isArray(confirmationData.attendingNames)
        ) {
            throw new Error('Los nombres de invitados deben ser un array');
        }

        // Validar teléfono si se proporciona
        if (
            confirmationData.phone &&
            !this.validationService.validatePhone(confirmationData.phone)
        ) {
            throw new Error('El formato del teléfono no es válido');
        }
    }

    /**
     * Valida el estado de la invitación
     * @param {Invitation} invitation
     * @private
     */
    validateInvitationState(invitation) {
        if (!invitation.isActive()) {
            throw new Error('No se puede confirmar una invitación inactiva');
        }
    }

    /**
     * Normaliza los datos de confirmación
     * @param {Object} confirmationData
     * @returns {Object}
     * @private
     */
    normalizeConfirmationData(confirmationData) {
        const normalized = { ...confirmationData };

        // Normalizar nombres de invitados
        if (normalized.attendingNames) {
            normalized.attendingNames = normalized.attendingNames
                .map(name => this.validationService.sanitizeString(name.trim()))
                .filter(name => name.length > 0);
        }

        // Normalizar teléfono
        if (normalized.phone) {
            normalized.phone = this.validationService.sanitizePhone(normalized.phone);
        }

        // Normalizar restricciones dietarias
        if (normalized.dietaryRestrictions) {
            normalized.dietaryRestrictions = this.validationService.sanitizeString(
                normalized.dietaryRestrictions
            );
        }

        // Normalizar mensaje
        if (normalized.message) {
            normalized.message = this.validationService.sanitizeString(normalized.message);
        }

        return normalized;
    }

    /**
     * Valida las reglas de negocio
     * @param {Invitation} invitation
     * @param {Object} normalizedData
     * @private
     */
    validateBusinessRules(invitation, normalizedData) {
        // Si va a asistir, debe especificar número de invitados
        if (normalizedData.willAttend && normalizedData.attendingGuests === undefined) {
            throw new Error('Debe especificar el número de invitados que asistirán');
        }

        // Si no va a asistir, no debe tener invitados
        if (normalizedData.willAttend === false && normalizedData.attendingGuests > 0) {
            throw new Error('No se pueden tener invitados si no va a asistir');
        }

        // La validación del número de pases ahora la hace la entidad Confirmation
        // if (normalizedData.attendingGuests > invitation.numberOfPasses) {
        //     throw new Error(`Solo tienes ${invitation.numberOfPasses} pases disponibles`);
        // }

        // Validar que el número de nombres no exceda el número de invitados
        if (
            normalizedData.attendingNames &&
            normalizedData.attendingNames.length > normalizedData.attendingGuests
        ) {
            throw new Error('No se pueden tener más nombres que invitados confirmados');
        }

        // Validar longitud de mensaje
        if (normalizedData.message && normalizedData.message.length > 500) {
            throw new Error('El mensaje no puede exceder 500 caracteres');
        }

        // Validar longitud de restricciones dietarias
        if (normalizedData.dietaryRestrictions && normalizedData.dietaryRestrictions.length > 200) {
            throw new Error('Las restricciones dietarias no pueden exceder 200 caracteres');
        }
    }

    /**
     * Busca y valida la invitación.
     * @param {string} invitationCode - Código de la invitación.
     * @returns {Promise<Invitation>} La entidad de la invitación.
     * @private
     */
    async findAndValidateInvitation(invitationCode) {
        const invitation = await this.invitationRepository.findByCode(invitationCode);
        if (!invitation) {
            throw new Error('Invitación no encontrada');
        }

        this.validateInvitationState(invitation);

        if (invitation.isConfirmed()) {
            throw new Error('Esta invitación ya ha sido confirmada');
        }

        const existingConfirmation = await this.confirmationRepository.findByCode(invitationCode);
        if (existingConfirmation) {
            throw new Error('Esta invitación ya ha sido confirmada');
        }

        return invitation;
    }

    /**
     * Actualiza la invitación y notifica a través de SSE.
     * @param {Invitation} invitation - La entidad de la invitación original.
     * @param {Confirmation} savedConfirmation - La entidad de la confirmación guardada.
     * @param {Object} normalizedData - Los datos de confirmación normalizados.
     * @returns {Promise<Invitation>} La entidad de la invitación actualizada.
     * @private
     */
    async updateInvitationAndNotify(invitation, savedConfirmation, normalizedData) {
        const updatedInvitation = invitation
            .confirm({
                attendingGuests: normalizedData.attendingGuests
            })
            .updateConfirmation({
                attendingNames: normalizedData.attendingNames,
                dietaryRestrictionsNames: normalizedData.dietaryRestrictions,
                dietaryRestrictionsDetails: normalizedData.dietaryRestrictions,
                generalMessage: normalizedData.message
            });

        await this.invitationRepository.update(invitation.code, updatedInvitation);

        this.logger.info('Attendance confirmed successfully', {
            invitationCode: invitation.code,
            willAttend: normalizedData.willAttend,
            attendingGuests: normalizedData.attendingGuests,
            guestNames: invitation.getGuestNamesString()
        });

        if (this.sseService) {
            this.sseService.notify('confirmation', {
                type: 'new_confirmation',
                invitation: updatedInvitation.toObject(),
                confirmation: savedConfirmation.toObject(),
                timestamp: new Date().toISOString()
            });
        }

        return updatedInvitation;
    }

    /**
     * Prepara y valida los datos para la confirmación.
     * @param {string} invitationCode - Código de la invitación.
     * @param {Object} confirmationData - Datos de confirmación.
     * @returns {Promise<{invitation: Invitation, normalizedData: Object}>}
     * @private
     */
    async _prepareAndValidate(invitationCode, confirmationData) {
        this.validateInput(invitationCode, confirmationData);
        const invitation = await this.findAndValidateInvitation(invitationCode);
        const normalizedData = this.normalizeConfirmationData(confirmationData);
        this.validateBusinessRules(invitation, normalizedData);
        return { invitation, normalizedData };
    }

    /**
     * Crea y guarda la confirmación.
     * @param {Invitation} invitation - La entidad de la invitación.
     * @param {Object} normalizedData - Los datos de confirmación normalizados.
     * @returns {Promise<Confirmation>}
     * @private
     */
    async _createAndSaveConfirmation(invitation, normalizedData) {
        const confirmation = new Confirmation({
            code: invitation.code,
            willAttend: normalizedData.willAttend,
            attendingGuests: normalizedData.attendingGuests,
            attendingNames: normalizedData.attendingNames,
            phone: normalizedData.phone,
            dietaryRestrictions: normalizedData.dietaryRestrictions,
            message: normalizedData.message,
            totalPasses: invitation.numberOfPasses
        });

        return this.confirmationRepository.save(confirmation);
    }

    /**
     * Actualiza la invitación y notifica.
     * @param {Invitation} invitation - La entidad de la invitación.
     * @param {Confirmation} savedConfirmation - La confirmación guardada.
     * @param {Object} normalizedData - Los datos de confirmación normalizados.
     * @returns {Promise<Invitation>}
     * @private
     */
    async _updateAndNotify(invitation, savedConfirmation, normalizedData) {
        return this.updateInvitationAndNotify(invitation, savedConfirmation, normalizedData);
    }

    /**
     * Construye una respuesta de éxito.
     * @param {Invitation} updatedInvitation - La invitación actualizada.
     * @param {Confirmation} savedConfirmation - La confirmación guardada.
     * @param {boolean} willAttend - Si el invitado asistirá.
     * @returns {Object}
     * @private
     */
    _buildSuccessResponse(updatedInvitation, savedConfirmation, willAttend) {
        return {
            success: true,
            invitation: updatedInvitation.toObject(),
            confirmation: savedConfirmation.toObject(),
            message: willAttend
                ? 'Asistencia confirmada exitosamente'
                : 'Confirmación de no asistencia registrada'
        };
    }

    /**
     * Maneja los errores durante la confirmación.
     * @param {Error} error - El error.
     * @param {string} invitationCode - El código de la invitación.
     * @param {Object} confirmationData - Los datos de confirmación.
     * @returns {Object}
     * @private
     */
    _handleError(error, invitationCode, confirmationData) {
        this.logger.error('Error confirming attendance', {
            invitationCode,
            error: error.message,
            stack: error.stack,
            confirmationData
        });

        return {
            success: false,
            error: error.message,
            message: 'Error al confirmar asistencia'
        };
    }
}

module.exports = ConfirmAttendanceUseCase;
