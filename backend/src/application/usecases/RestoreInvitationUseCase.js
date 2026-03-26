const config = require('../../config');

/**
 * RestoreInvitationUseCase
 * Caso de uso para restaurar (activar) una invitación previamente eliminada.
 */
class RestoreInvitationUseCase {
    constructor(invitationRepository, validationService, logger) {
        this.invitationRepository = invitationRepository;
        this.validationService = validationService;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso.
     * @param {string} code - El código de la invitación a restaurar.
     * @returns {Promise<{success: boolean, data: object, error: string}>}
     */
    async execute(code) {
        const endOperation = this.logger.startOperation('RestoreInvitationUseCase.execute', {
            code
        });

        try {
            // 1. Validar el código
            if (!this.validationService.validateInvitationCode(code)) {
                return { success: false, error: 'Código de invitación inválido' };
            }

            // 2. Buscar la invitación (incluso si está inactiva)
            const invitation = await this.invitationRepository.findByCode(code, true); // Incluir inactivas

            if (!invitation) {
                return { success: false, error: 'Invitación no encontrada' };
            }

            // 3. Verificar si ya está activa
            if (invitation.status !== 'inactive') {
                return { success: false, error: 'La invitación ya está activa' };
            }

            // 4. Validar cupo antes de restaurar
            const stats = await this.invitationRepository.getStats();
            const currentOccupied = stats.occupiedPasses;
            const targetTotal = config.guests.targetTotal;
            const invitationPasses = invitation.numberOfPasses;

            if (currentOccupied + invitationPasses > targetTotal) {
                const errorMessage = `No se puede activar: Excedería el límite de ${targetTotal} invitados (Actual: ${currentOccupied}, Invitación: ${invitationPasses})`;
                return { success: false, error: errorMessage };
            }

            // 5. Restaurar la invitación
            const restoredInvitation = await this.invitationRepository.restore(code);

            endOperation({ restored: true });

            return {
                success: true,
                data: restoredInvitation.toObject()
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en RestoreInvitationUseCase', {
                code,
                error: error.message,
                stack: error.stack
            });
            return { success: false, error: 'Error al restaurar la invitación' };
        }
    }
}

module.exports = RestoreInvitationUseCase;
