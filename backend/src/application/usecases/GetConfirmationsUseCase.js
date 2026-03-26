/**
 * GetConfirmationsUseCase
 * Caso de uso para obtener una lista paginada y filtrada de confirmaciones.
 */
class GetConfirmationsUseCase {
    constructor(confirmationRepository, logger) {
        this.confirmationRepository = confirmationRepository;
        this.logger = logger;
    }

    /**
     * Ejecuta el caso de uso.
     * @param {number} page - Número de página.
     * @param {number} limit - Límite de resultados por página.
     * @param {object} filters - Filtros a aplicar (ej. { willAttend: true, search: 'John' }).
     * @param {object} sort - Opciones de ordenamiento (ej. { field: 'confirmedAt', direction: 'desc' }).
     * @returns {Promise<{success: boolean, data: object[], pagination: object, error: string}>}
     */
    async execute(page, limit, filters = {}, sort = {}) {
        const endOperation = this.logger.startOperation('GetConfirmationsUseCase.execute', {
            page,
            limit,
            filters,
            sort
        });

        try {
            // 1. Validar parámetros de paginación
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);

            if (isNaN(pageNum) || pageNum < 1) {
                return { success: false, error: 'Número de página inválido' };
            }
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                return { success: false, error: 'Límite inválido (1-100)' };
            }

            // 2. Separar el filtro de búsqueda del resto
            const { search, ...otherFilters } = filters;

            // 3. Obtener confirmaciones paginadas
            const result = await this.confirmationRepository.findPaginated(
                pageNum,
                limitNum,
                otherFilters,
                sort
            );

            // 4. Aplicar búsqueda si se proporciona
            if (search) {
                const searchResults = await this.confirmationRepository.findByGuestName(search);
                // Filtrar los resultados paginados para que coincidan con la búsqueda
                result.data = result.data.filter(confirmation =>
                    searchResults.some(sr => sr.code === confirmation.code)
                );
                result.pagination.total = result.data.length; // Actualizar el total para reflejar el filtro
            }

            endOperation({
                count: result.data.length,
                total: result.pagination.total
            });

            return {
                success: true,
                data: result.data.map(item => item.toObject()),
                pagination: result.pagination
            };
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.logger.error('Error en GetConfirmationsUseCase', {
                page,
                limit,
                filters,
                sort,
                error: error.message,
                stack: error.stack
            });
            return { success: false, error: 'Error al obtener las confirmaciones' };
        }
    }
}

module.exports = GetConfirmationsUseCase;
