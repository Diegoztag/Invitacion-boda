const NotFoundException = require('../../shared/exceptions/NotFoundException');

/**
 * Update Invitation Use Case
 */
class UpdateInvitationUseCase {
    constructor(invitationRepository, logger) {
        this.invitationRepository = invitationRepository;
        this.logger = logger;
    }

    async execute(code, updatedData) {
        const endOperation = this.logger.startOperation('updateInvitation', { code });

        try {
            const invitation = await this.invitationRepository.findByCode(code);

            if (!invitation) {
                throw new NotFoundException('Invitación', code);
            }

            // Validar y aplicar actualizaciones
            this._applyUpdates(invitation, updatedData);

            await this.invitationRepository.update(code, invitation);

            endOperation({ success: true });
            return {
                success: true,
                invitation: invitation.toObject(),
                message: 'Invitación actualizada exitosamente'
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error updating invitation', {
                code,
                error: error.message,
                stack: error.stack
            });
            return {
                success: false,
                error: 'Error actualizando invitación'
            };
        }
    }

    /**
     * Aplica las actualizaciones a la entidad de invitación.
     * @param {Invitation} invitation - La invitación a actualizar.
     * @param {Object} updatedData - Los datos a actualizar.
     * @private
     */
    _applyUpdates(invitation, updatedData) {
        // Lista de campos permitidos para actualización
        const allowedUpdates = [
            'guestNames',
            'numberOfPasses',
            'phone',
            'status',
            'adultPasses',
            'childPasses',
            'staffPasses',
            'tableNumber'
        ];

        Object.keys(updatedData).forEach(key => {
            if (allowedUpdates.includes(key)) {
                invitation[key] = updatedData[key];
            }
        });

        // Re-validar la entidad después de la actualización
        invitation.validate();
    }
}

module.exports = UpdateInvitationUseCase;
