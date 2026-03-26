/**
 * SearchConfirmationsByNameUseCase
 * Caso de uso para buscar confirmaciones por el nombre de un invitado.
 */
class SearchConfirmationsByNameUseCase {
    constructor(confirmationRepository, logger) {
        this.confirmationRepository = confirmationRepository;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso.
     * @param {string} name - El nombre del invitado a buscar.
     * @returns {Promise<{success: boolean, data: object[], count: number, error: string}>}
     */
    async execute(name) {
        const endOperation = this.logger.startOperation(
            'SearchConfirmationsByNameUseCase.execute',
            { name }
        );

        try {
            // 1. Validar el nombre
            if (!name || name.trim().length < 2) {
                endOperation({ error: 'Invalid name' }, 'error');
                return {
                    success: false,
                    error: 'El nombre debe tener al menos 2 caracteres'
                };
            }

            // 2. Buscar las confirmaciones
            const confirmations = await this.confirmationRepository.findByGuestName(name);

            endOperation({ found: confirmations.length });

            return {
                success: true,
                data: confirmations.map(conf => conf.toObject()),
                count: confirmations.length
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en SearchConfirmationsByNameUseCase', {
                name,
                error: error.message,
                stack: error.stack
            });
            return { success: false, error: 'Error al buscar las confirmaciones' };
        }
    }
}

module.exports = SearchConfirmationsByNameUseCase;
