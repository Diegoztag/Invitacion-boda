/**
 * GetInvitationsUseCase
 * Caso de uso para obtener una lista paginada de invitaciones.
 */
class GetInvitationsUseCase {
    constructor(invitationRepository, config, logger) {
        this.invitationRepository = invitationRepository;
        this.config = config;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso.
     * @param {number} page - Número de página.
     * @param {number} limit - Límite de resultados por página.
     * @param {object} filters - Filtros a aplicar.
     * @param {object} sort - Opciones de ordenamiento.
     * @param {boolean} includeInactive - Si se deben incluir invitaciones inactivas.
     * @returns {Promise<{success: boolean, data: Array, pagination: object, error: string}>}
     */
    async execute(page, limit, filters, sort, includeInactive) {
        const endOperation = this.logger.startOperation('GetInvitationsUseCase.execute');

        try {
            // Validar parámetros de paginación
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            if (isNaN(pageNum) || pageNum < 1) {
                return { success: false, error: 'Número de página inválido' };
            }

            const maxLimit = this.config.validation.pagination.maxLimit;
            if (isNaN(limitNum) || limitNum < 1 || limitNum > maxLimit) {
                return { success: false, error: `Límite inválido (1-${maxLimit})` };
            }

            // Obtener invitaciones paginadas
            const result = await this.invitationRepository.findPaginated(
                pageNum,
                limitNum,
                filters,
                sort,
                includeInactive
            );

            endOperation({
                count: result.data.length,
                total: result.pagination.total
            });

            // Convertir entidades a objetos planos
            const serializedData = result.data.map(invitation => invitation.toObject());

            return {
                success: true,
                data: serializedData,
                pagination: result.pagination
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en GetInvitationsUseCase', {
                error: error.message,
                stack: error.stack
            });
            return { success: false, error: 'Error al obtener las invitaciones' };
        }
    }
}

module.exports = GetInvitationsUseCase;
