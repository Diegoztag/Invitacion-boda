const config = require('../../config');
const NotFoundException = require('../../shared/exceptions/NotFoundException');
const BusinessRuleException = require('../../shared/exceptions/BusinessRuleException');

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
     * @returns {Promise<object>} - La invitación restaurada.
     * @throws {BusinessRuleException} - Si el código es inválido o la invitación ya está activa.
     * @throws {NotFoundException} - Si la invitación no se encuentra.
     */
    async execute(code) {
        const endOperation = this.logger.startOperation('RestoreInvitationUseCase.execute', {
            code
        });

        try {
            // 1. Validar el código
            if (!this.validationService.validateInvitationCode(code)) {
                throw new BusinessRuleException('Código de invitación inválido');
            }

            // 2. Buscar la invitación (incluso si está inactiva)
            const invitation = await this.invitationRepository.findByCode(code, true);

            if (!invitation) {
                throw new NotFoundException('Invitación', code);
            }

            // 3. Validar cupo antes de restaurar (lógica de negocio que requiere datos externos)
            const stats = await this.invitationRepository.getStats();
            const currentOccupied = stats.occupiedPasses;
            const targetTotal = config.guests.targetTotal;
            const invitationPasses = invitation.numberOfPasses;

            if (currentOccupied + invitationPasses > targetTotal) {
                const errorMessage = `No se puede activar: Excedería el límite de ${targetTotal} invitados (Actual: ${currentOccupied}, Invitación: ${invitationPasses})`;
                throw new BusinessRuleException(errorMessage);
            }

            // 4. Usar el método de dominio para restaurar la invitación
            invitation.restore(); // La lógica de cambio de estado está ahora en la entidad

            // 5. Persistir los cambios
            const updatedInvitation = await this.invitationRepository.update(code, invitation);

            endOperation({ restored: true });

            return updatedInvitation.toObject();
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en RestoreInvitationUseCase', {
                code,
                error: error.message,
                stack: error.stack
            });
            // Re-lanzar la excepción para que la capa superior la maneje
            throw error;
        }
    }
}

module.exports = RestoreInvitationUseCase;
