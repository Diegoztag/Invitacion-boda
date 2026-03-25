/**
 * SearchInvitationsByNameUseCase
 * Caso de uso para buscar invitaciones por el nombre de un invitado.
 */
class SearchInvitationsByNameUseCase {
    constructor(invitationRepository, logger) {
        this.invitationRepository = invitationRepository;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso.
     * @param {string} name - El nombre a buscar.
     * @returns {Promise<{success: boolean, data: Array, count: number, error: string}>}
     */
    async execute(name) {
        const endOperation = this.logger.startOperation('SearchInvitationsByNameUseCase.execute', {
            name
        });

        try {
            // Validar el nombre
            if (!name || name.trim().length < 2) {
                return { success: false, error: 'El nombre debe tener al menos 2 caracteres' };
            }

            // Buscar invitaciones
            const invitations = await this.invitationRepository.findByGuestName(name);

            endOperation({ found: invitations.length });

            // Convertir entidades a objetos planos
            const serializedData = invitations.map(invitation => invitation.toObject());

            return {
                success: true,
                data: serializedData,
                count: invitations.length
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en SearchInvitationsByNameUseCase', {
                name,
                error: error.message,
                stack: error.stack
            });
            return { success: false, error: 'Error al buscar las invitaciones' };
        }
    }
}

module.exports = SearchInvitationsByNameUseCase;
