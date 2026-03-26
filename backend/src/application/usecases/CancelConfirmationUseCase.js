/**
 * Cancel Confirmation Use Case
 * Caso de uso para cancelar una confirmación de asistencia existente.
 */
class CancelConfirmationUseCase {
    constructor(invitationRepository, confirmationRepository, logger) {
        this.invitationRepository = invitationRepository;
        this.confirmationRepository = confirmationRepository;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso para cancelar una confirmación.
     * @param {string} invitationCode - Código de la invitación.
     * @param {string} reason - Razón de la cancelación.
     * @returns {Promise<{success: boolean, invitation: object, error: string, message: string}>}
     */
    async execute(invitationCode, reason = '') {
        const endOperation = this.logger.startOperation('CancelConfirmationUseCase.execute', {
            invitationCode,
            reason
        });

        try {
            // 1. Buscar la invitación y la confirmación
            const invitation = await this.invitationRepository.findByCode(invitationCode);
            if (!invitation) {
                throw new Error('Invitación no encontrada');
            }

            const existingConfirmation =
                await this.confirmationRepository.findByCode(invitationCode);
            if (!existingConfirmation) {
                throw new Error('No existe una confirmación para esta invitación');
            }

            // 2. Eliminar la confirmación
            await this.confirmationRepository.delete(invitationCode);

            // 3. Actualizar la invitación para desconfirmarla
            const updatedInvitation = invitation.unconfirm();
            await this.invitationRepository.update(invitationCode, updatedInvitation);

            endOperation({ cancelled: true });
            return {
                success: true,
                invitation: updatedInvitation.toObject(),
                message: 'Confirmación cancelada exitosamente'
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en CancelConfirmationUseCase', {
                invitationCode,
                error: error.message,
                reason
            });
            return {
                success: false,
                error: error.message,
                message: 'Error al cancelar la confirmación'
            };
        }
    }
}

module.exports = CancelConfirmationUseCase;
