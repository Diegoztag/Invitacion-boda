const NotFoundException = require('../../shared/exceptions/NotFoundException');

/**
 * DeleteInvitationUseCase
 * Caso de uso para eliminar (desactivar) una invitación.
 */
class DeleteInvitationUseCase {
    constructor(invitationRepository, logger) {
        this.invitationRepository = invitationRepository;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso.
     * @param {string} code - El código de la invitación a eliminar.
     * @param {string} cancelledBy - Quién realiza la cancelación.
     * @param {string} reason - La razón de la cancelación.
     * @returns {Promise<object>} - La invitación actualizada.
     * @throws {NotFoundException} - Si la invitación no se encuentra.
     * @throws {BusinessRuleException} - Si la invitación ya está inactiva.
     */
    async execute(code, cancelledBy = 'admin', reason = '') {
        const endOperation = this.logger.startOperation('DeleteInvitationUseCase.execute', {
            code,
            cancelledBy,
            reason
        });

        try {
            // 1. Buscar la invitación
            const invitation = await this.invitationRepository.findByCode(code);

            if (!invitation) {
                throw new NotFoundException('Invitación', code);
            }

            // 2. Usar el método de dominio para cancelar
            // La entidad se encarga de verificar si ya está inactiva
            invitation.cancel(cancelledBy, reason);

            // 3. Persistir los cambios
            const updatedInvitation = await this.invitationRepository.update(code, invitation);

            endOperation({ deleted: true });

            return updatedInvitation.toObject();
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en DeleteInvitationUseCase', {
                code,
                error: error.message,
                stack: error.stack
            });
            // Re-lanzar la excepción
            throw error;
        }
    }
}

module.exports = DeleteInvitationUseCase;
