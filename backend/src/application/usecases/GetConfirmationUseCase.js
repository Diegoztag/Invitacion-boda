/**
 * GetConfirmationUseCase
 * Caso de uso para obtener una confirmación por su código de invitación.
 */
class GetConfirmationUseCase {
    constructor(confirmationRepository, validationService, logger) {
        this.confirmationRepository = confirmationRepository;
        this.validationService = validationService;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso.
     * @param {string} code - El código de la invitación asociado a la confirmación.
     * @returns {Promise<{success: boolean, data: object, error: string}>}
     */
    async execute(code) {
        const endOperation = this.logger.startOperation('GetConfirmationUseCase.execute', { code });

        try {
            // 1. Validar el código
            if (!this.validationService.validateInvitationCode(code)) {
                endOperation({ error: 'Invalid code' }, 'error');
                return { success: false, error: 'Código de invitación inválido' };
            }

            // 2. Buscar la confirmación
            const confirmation = await this.confirmationRepository.findByCode(code);

            if (!confirmation) {
                endOperation({ found: false });
                return { success: false, error: 'Confirmación no encontrada' };
            }

            endOperation({ found: true });

            return {
                success: true,
                data: confirmation.toObject()
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en GetConfirmationUseCase', {
                code,
                error: error.message,
                stack: error.stack
            });
            return { success: false, error: 'Error al obtener la confirmación' };
        }
    }
}

module.exports = GetConfirmationUseCase;
