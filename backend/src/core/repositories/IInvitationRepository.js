/**
 * Invitation Repository Interface
 * Define el contrato para el repositorio de invitaciones
 * Sigue principios SOLID: Interface Segregation y Dependency Inversion
 */

class IInvitationRepository {
    /**
     * Guarda una nueva invitación
     * @param {Invitation} invitation - Entidad de invitación
     * @returns {Promise<Invitation>} Invitación guardada
     * @throws {Error} Si hay error al guardar
     */
    async save(invitation) {
        throw new Error('Method save must be implemented');
    }

    /**
     * Busca una invitación por código
     * @param {string} code - Código de la invitación
     * @returns {Promise<Invitation|null>} Invitación encontrada o null
     * @throws {Error} Si hay error en la búsqueda
     */
    async findByCode(code) {
        throw new Error('Method findByCode must be implemented');
    }

    /**
     * Obtiene todas las invitaciones
     * @param {Object} filters - Filtros opcionales
     * @param {string} filters.status - Filtrar por estado (active, inactive)
     * @param {boolean} filters.confirmed - Filtrar por confirmación
     * @returns {Promise<Array<Invitation>>} Lista de invitaciones
     * @throws {Error} Si hay error al obtener las invitaciones
     */
    async findAll(filters = {}) {
        throw new Error('Method findAll must be implemented');
    }

    /**
     * Actualiza una invitación existente
     * @param {string} code - Código de la invitación
     * @param {Invitation} invitation - Datos actualizados de la invitación
     * @returns {Promise<Invitation>} Invitación actualizada
     * @throws {Error} Si la invitación no existe o hay error al actualizar
     */
    async update(code, invitation) {
        throw new Error('Method update must be implemented');
    }

    /**
     * Elimina una invitación (soft delete)
     * @param {string} code - Código de la invitación
     * @param {string} deletedBy - Quien elimina la invitación
     * @param {string} reason - Razón de la eliminación
     * @returns {Promise<boolean>} True si se eliminó correctamente
     * @throws {Error} Si la invitación no existe o hay error al eliminar
     */
    async delete(code, deletedBy = 'admin', reason = '') {
        throw new Error('Method delete must be implemented');
    }

    /**
     * Reactiva una invitación eliminada
     * @param {string} code - Código de la invitación
     * @returns {Promise<Invitation>} Invitación reactivada
     * @throws {Error} Si la invitación no existe o hay error al reactivar
     */
    async restore(code) {
        throw new Error('Method restore must be implemented');
    }

    /**
     * Busca invitaciones por nombre de invitado
     * @param {string} guestName - Nombre del invitado
     * @returns {Promise<Array<Invitation>>} Lista de invitaciones que coinciden
     * @throws {Error} Si hay error en la búsqueda
     */
    async findByGuestName(guestName) {
        throw new Error('Method findByGuestName must be implemented');
    }

    /**
     * Busca invitaciones por número de teléfono
     * @param {string} phone - Número de teléfono
     * @returns {Promise<Array<Invitation>>} Lista de invitaciones que coinciden
     * @throws {Error} Si hay error en la búsqueda
     */
    async findByPhone(phone) {
        throw new Error('Method findByPhone must be implemented');
    }

    /**
     * Busca invitaciones por número de mesa
     * @param {number} tableNumber - Número de mesa
     * @returns {Promise<Array<Invitation>>} Lista de invitaciones de la mesa
     * @throws {Error} Si hay error en la búsqueda
     */
    async findByTable(tableNumber) {
        throw new Error('Method findByTable must be implemented');
    }

    /**
     * Obtiene estadísticas de invitaciones
     * @returns {Promise<Object>} Estadísticas de invitaciones
     * @throws {Error} Si hay error al calcular estadísticas
     */
    async getStats() {
        throw new Error('Method getStats must be implemented');
    }

    /**
     * Importa múltiples invitaciones
     * @param {Array<Object>} invitationsData - Datos de las invitaciones
     * @returns {Promise<Object>} Resultado de la importación
     * @throws {Error} Si hay error en la importación
     */
    async importBatch(invitationsData) {
        throw new Error('Method importBatch must be implemented');
    }

    /**
     * Exporta todas las invitaciones
     * @param {Object} options - Opciones de exportación
     * @returns {Promise<Object>} Datos exportados
     * @throws {Error} Si hay error en la exportación
     */
    async exportAll(options = {}) {
        throw new Error('Method exportAll must be implemented');
    }

    /**
     * Verifica si existe una invitación con el código dado
     * @param {string} code - Código de la invitación
     * @returns {Promise<boolean>} True si existe
     * @throws {Error} Si hay error en la verificación
     */
    async exists(code) {
        throw new Error('Method exists must be implemented');
    }

    /**
     * Cuenta el total de invitaciones
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>} Número total de invitaciones
     * @throws {Error} Si hay error al contar
     */
    async count(filters = {}) {
        throw new Error('Method count must be implemented');
    }

    /**
     * Obtiene invitaciones paginadas
     * @param {number} page - Número de página (1-based)
     * @param {number} limit - Límite de resultados por página
     * @param {Object} filters - Filtros opcionales
     * @param {Object} sort - Opciones de ordenamiento
     * @returns {Promise<Object>} Resultado paginado
     * @throws {Error} Si hay error en la paginación
     */
    async findPaginated(page = 1, limit = 10, filters = {}, sort = {}) {
        throw new Error('Method findPaginated must be implemented');
    }
}

module.exports = IInvitationRepository;
