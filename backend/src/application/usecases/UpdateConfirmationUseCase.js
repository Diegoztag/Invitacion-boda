/**
 * Update Confirmation Use Case
 * Caso de uso para actualizar una confirmación de asistencia existente.
 */
class UpdateConfirmationUseCase {
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
     * Ejecuta el caso de uso para actualizar una confirmación.
     * @param {string} invitationCode - Código de la invitación.
     * @param {Object} updateData - Datos a actualizar.
     * @returns {Promise<{success: boolean, confirmation: object, error: string, message: string}>}
     */
    async execute(invitationCode, updateData) {
        const endOperation = this.logger.startOperation('UpdateConfirmationUseCase.execute', {
            invitationCode,
            updateData
        });

        try {
            // 1. Validar datos de entrada
            this.validateInput(invitationCode, updateData);

            // 2. Buscar la invitación y la confirmación
            const invitation = await this.invitationRepository.findByCode(invitationCode);
            if (!invitation) {
                throw new Error('Invitación no encontrada');
            }

            const existingConfirmation =
                await this.confirmationRepository.findByCode(invitationCode);
            if (!existingConfirmation) {
                throw new Error('No existe una confirmación para esta invitación');
            }

            // 3. Normalizar datos
            const normalizedData = this.normalizeConfirmationData(updateData);

            // 4. Validar reglas de negocio
            this.validateBusinessRules(invitation, normalizedData);

            // 5. Actualizar la entidad de confirmación
            const updatedConfirmation = this.applyUpdates(
                existingConfirmation,
                normalizedData,
                invitation
            );

            // 6. Guardar confirmación actualizada
            const savedConfirmation = await this.confirmationRepository.update(
                invitationCode,
                updatedConfirmation
            );

            // 7. Actualizar invitación si es necesario
            await this.updateInvitationIfNeeded(invitation, normalizedData);

            endOperation({ updated: true });
            return {
                success: true,
                confirmation: savedConfirmation.toObject(),
                message: 'Confirmación actualizada exitosamente'
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en UpdateConfirmationUseCase', {
                invitationCode,
                error: error.message,
                updateData
            });
            return {
                success: false,
                error: error.message,
                message: 'Error al actualizar la confirmación'
            };
        }
    }

    applyUpdates(confirmation, normalizedData, invitation) {
        const updatedConfirmation = confirmation.clone();
        if (normalizedData.willAttend !== undefined) {
            updatedConfirmation.updateAttendance(normalizedData.willAttend);
        }
        if (normalizedData.attendingGuests !== undefined) {
            updatedConfirmation.updateAttendingGuests(
                normalizedData.attendingGuests,
                invitation.numberOfPasses
            );
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
        return updatedConfirmation;
    }

    async updateInvitationIfNeeded(invitation, normalizedData) {
        if (
            normalizedData.willAttend !== undefined ||
            normalizedData.attendingGuests !== undefined
        ) {
            const updatedInvitation = invitation.clone();
            if (normalizedData.willAttend === false) {
                updatedInvitation.unconfirm();
            } else if (normalizedData.attendingGuests !== undefined) {
                updatedInvitation.confirm({ attendingGuests: normalizedData.attendingGuests });
            }
            await this.invitationRepository.update(invitation.code, updatedInvitation);
        }
    }

    validateInput(invitationCode, data) {
        if (!invitationCode || typeof invitationCode !== 'string') {
            throw new Error('El código de invitación es requerido');
        }
        if (!data || typeof data !== 'object') {
            throw new Error('Los datos de actualización son requeridos');
        }
    }

    normalizeConfirmationData(data) {
        const normalized = { ...data };
        if (normalized.attendingNames) {
            normalized.attendingNames = normalized.attendingNames
                .map(name => this.validationService.sanitizeString(name.trim()))
                .filter(name => name.length > 0);
        }
        if (normalized.phone) {
            normalized.phone = this.validationService.sanitizePhone(normalized.phone);
        }
        return normalized;
    }

    validateBusinessRules(_invitation, _normalizedData) {
        // La validación del número de pases ahora la hace la entidad Confirmation
        // if (normalizedData.attendingGuests > invitation.numberOfPasses) {
        //     throw new Error(`Solo tienes ${invitation.numberOfPasses} pases disponibles`);
        // }
    }
}

module.exports = UpdateConfirmationUseCase;
