/**
 * Confirm Attendance Use Case
 * Caso de uso para confirmar asistencia a una invitación
 * Sigue principios Clean Architecture y SOLID
 */

const Confirmation = require('../../core/entities/Confirmation');

class ConfirmAttendanceUseCase {
    constructor(invitationRepository, confirmationRepository, validationService, sseService, logger) {
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
     * @param {boolean} confirmationData.willAttend - Si va a asistir
     * @param {number} confirmationData.attendingGuests - Número de invitados que asistirán
     * @param {Array<string>} confirmationData.attendingNames - Nombres de los invitados
     * @param {string} confirmationData.phone - Teléfono de contacto
     * @param {string} confirmationData.dietaryRestrictions - Restricciones dietarias
     * @param {string} confirmationData.message - Mensaje para los novios
     * @returns {Promise<Object>} Resultado de la operación
     */
    async execute(invitationCode, confirmationData) {
        try {
            // Validar datos de entrada
            this.validateInput(invitationCode, confirmationData);

            // Buscar la invitación
            const invitation = await this.invitationRepository.findByCode(invitationCode);
            if (!invitation) {
                throw new Error('Invitación no encontrada');
            }

            // Validar estado de la invitación
            this.validateInvitationState(invitation);

            // Verificar si ya existe una confirmación
            const existingConfirmation = await this.confirmationRepository.findByCode(invitationCode);
            if (existingConfirmation) {
                throw new Error('Esta invitación ya ha sido confirmada');
            }

            // Normalizar datos de confirmación
            const normalizedData = this.normalizeConfirmationData(confirmationData);

            // Validar reglas de negocio
            this.validateBusinessRules(invitation, normalizedData);

            // Crear entidad de confirmación
            const confirmation = new Confirmation({
                code: invitationCode,
                ...normalizedData
            });

            // Guardar confirmación
            const savedConfirmation = await this.confirmationRepository.save(confirmation);

            // Actualizar invitación
            const updatedInvitation = invitation.confirm({
                attendingGuests: normalizedData.attendingGuests
            });

            // Actualizar detalles adicionales en la invitación
            updatedInvitation.updateConfirmation({
                attendingNames: normalizedData.attendingNames,
                dietaryRestrictionsNames: normalizedData.dietaryRestrictions, // Map to correct field name if needed, check Invitation.js
                dietaryRestrictionsDetails: normalizedData.dietaryRestrictionsDetails, // Check if this exists in normalizedData
                generalMessage: normalizedData.message
            });

            await this.invitationRepository.update(invitationCode, updatedInvitation);

            // Log de éxito
            this.logger.info('Attendance confirmed successfully', {
                invitationCode,
                willAttend: normalizedData.willAttend,
                attendingGuests: normalizedData.attendingGuests,
                guestNames: invitation.getGuestNamesString()
            });

            // Notificar vía SSE
            if (this.sseService) {
                this.sseService.notify('confirmation', {
                    type: 'new_confirmation',
                    invitation: updatedInvitation.toObject(),
                    confirmation: savedConfirmation.toObject(),
                    timestamp: new Date().toISOString()
                });
            }

            return {
                success: true,
                invitation: updatedInvitation.toObject(),
                confirmation: savedConfirmation.toObject(),
                message: normalizedData.willAttend 
                    ? 'Asistencia confirmada exitosamente'
                    : 'Confirmación de no asistencia registrada'
            };

        } catch (error) {
            // Log de error
            this.logger.error('Error confirming attendance', {
                invitationCode,
                error: error.message,
                confirmationData
            });

            return {
                success: false,
                error: error.message,
                message: 'Error al confirmar asistencia'
            };
        }
    }

    /**
     * Actualiza una confirmación existente
     * @param {string} invitationCode - Código de la invitación
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>} Resultado de la operación
     */
    async updateConfirmation(invitationCode, updateData) {
        try {
            // Validar datos de entrada
            this.validateInput(invitationCode, updateData);

            // Buscar la invitación
            const invitation = await this.invitationRepository.findByCode(invitationCode);
            if (!invitation) {
                throw new Error('Invitación no encontrada');
            }

            // Buscar confirmación existente
            const existingConfirmation = await this.confirmationRepository.findByCode(invitationCode);
            if (!existingConfirmation) {
                throw new Error('No existe una confirmación para esta invitación');
            }

            // Normalizar datos
            const normalizedData = this.normalizeConfirmationData(updateData);

            // Validar reglas de negocio
            this.validateBusinessRules(invitation, normalizedData);

            // Actualizar confirmación
            const updatedConfirmation = existingConfirmation.clone();
            
            if (normalizedData.willAttend !== undefined) {
                updatedConfirmation.updateAttendance(normalizedData.willAttend);
            }
            
            if (normalizedData.attendingGuests !== undefined) {
                updatedConfirmation.updateAttendingGuests(normalizedData.attendingGuests);
            }
            
            if (normalizedData.attendingNames) {
                updatedConfirmation.updateAttendingNames(normalizedData.attendingNames);
            }
            
            if (normalizedData.phone !== undefined) {
                updatedConfirmation.updatePhone(normalizedData.phone);
            }
            
            if (normalizedData.dietaryRestrictions !== undefined) {
                updatedConfirmation.updateDietaryRestrictions(normalizedData.dietaryRestrictions);
            }
            
            if (normalizedData.message !== undefined) {
                updatedConfirmation.updateMessage(normalizedData.message);
            }

            // Guardar confirmación actualizada
            const savedConfirmation = await this.confirmationRepository.update(invitationCode, updatedConfirmation);

            // Actualizar invitación si cambió la asistencia
            if (normalizedData.willAttend !== undefined || normalizedData.attendingGuests !== undefined) {
                const updatedInvitation = invitation.clone();
                
                if (normalizedData.willAttend === false) {
                    updatedInvitation.unconfirm();
                } else if (normalizedData.attendingGuests !== undefined) {
                    updatedInvitation._confirmedPasses = normalizedData.attendingGuests;
                }

                await this.invitationRepository.update(invitationCode, updatedInvitation);
            }

            // Log de éxito
            this.logger.info('Confirmation updated successfully', {
                invitationCode,
                changes: Object.keys(normalizedData)
            });

            return {
                success: true,
                confirmation: savedConfirmation.toObject(),
                message: 'Confirmación actualizada exitosamente'
            };

        } catch (error) {
            // Log de error
            this.logger.error('Error updating confirmation', {
                invitationCode,
                error: error.message,
                updateData
            });

            return {
                success: false,
                error: error.message,
                message: 'Error al actualizar confirmación'
            };
        }
    }

    /**
     * Cancela una confirmación existente
     * @param {string} invitationCode - Código de la invitación
     * @param {string} reason - Razón de la cancelación
     * @returns {Promise<Object>} Resultado de la operación
     */
    async cancelConfirmation(invitationCode, reason = '') {
        try {
            // Buscar la invitación
            const invitation = await this.invitationRepository.findByCode(invitationCode);
            if (!invitation) {
                throw new Error('Invitación no encontrada');
            }

            // Buscar confirmación existente
            const existingConfirmation = await this.confirmationRepository.findByCode(invitationCode);
            if (!existingConfirmation) {
                throw new Error('No existe una confirmación para esta invitación');
            }

            // Eliminar confirmación
            await this.confirmationRepository.delete(invitationCode);

            // Actualizar invitación
            const updatedInvitation = invitation.unconfirm();
            await this.invitationRepository.update(invitationCode, updatedInvitation);

            // Log de éxito
            this.logger.info('Confirmation cancelled successfully', {
                invitationCode,
                reason,
                guestNames: invitation.getGuestNamesString()
            });

            return {
                success: true,
                invitation: updatedInvitation.toObject(),
                message: 'Confirmación cancelada exitosamente'
            };

        } catch (error) {
            // Log de error
            this.logger.error('Error cancelling confirmation', {
                invitationCode,
                error: error.message,
                reason
            });

            return {
                success: false,
                error: error.message,
                message: 'Error al cancelar confirmación'
            };
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
        if (confirmationData.willAttend !== undefined && typeof confirmationData.willAttend !== 'boolean') {
            throw new Error('willAttend debe ser un boolean');
        }

        // Validar attendingGuests si se proporciona
        if (confirmationData.attendingGuests !== undefined) {
            if (!Number.isInteger(confirmationData.attendingGuests) || confirmationData.attendingGuests < 0) {
                throw new Error('El número de invitados debe ser un entero no negativo');
            }
        }

        // Validar attendingNames si se proporciona
        if (confirmationData.attendingNames !== undefined && !Array.isArray(confirmationData.attendingNames)) {
            throw new Error('Los nombres de invitados deben ser un array');
        }

        // Validar teléfono si se proporciona
        if (confirmationData.phone && !this.validationService.validatePhone(confirmationData.phone)) {
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
            normalized.dietaryRestrictions = this.validationService.sanitizeString(normalized.dietaryRestrictions);
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

        // Validar que no exceda el número de pases disponibles
        if (normalizedData.attendingGuests > invitation.numberOfPasses) {
            throw new Error(`Solo tienes ${invitation.numberOfPasses} pases disponibles`);
        }

        // Validar que el número de nombres no exceda el número de invitados
        if (normalizedData.attendingNames && normalizedData.attendingNames.length > normalizedData.attendingGuests) {
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
}

module.exports = ConfirmAttendanceUseCase;
