/**
 * Confirmation Repository Interface
 * Define el contrato para el repositorio de confirmaciones
 * Sigue principios SOLID: Interface Segregation y Dependency Inversion
 */

class IConfirmationRepository {
    /**
     * Guarda una nueva confirmación
     * @param {Confirmation} confirmation - Entidad de confirmación
     * @returns {Promise<Confirmation>} Confirmación guardada
     * @throws {Error} Si hay error al guardar
     */
    async save(confirmation) {
        throw new Error('Method save must be implemented');
    }

    /**
     * Busca una confirmación por código de invitación
     * @param {string} code - Código de la invitación
     * @returns {Promise<Confirmation|null>} Confirmación encontrada o null
     * @throws {Error} Si hay error en la búsqueda
     */
    async findByCode(code) {
        throw new Error('Method findByCode must be implemented');
    }

    /**
     * Obtiene todas las confirmaciones
     * @param {Object} filters - Filtros opcionales
     * @param {boolean} filters.willAttend - Filtrar por asistencia
     * @param {Date} filters.confirmedAfter - Confirmaciones después de esta fecha
     * @param {Date} filters.confirmedBefore - Confirmaciones antes de esta fecha
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones
     * @throws {Error} Si hay error al obtener las confirmaciones
     */
    async findAll(filters = {}) {
        throw new Error('Method findAll must be implemented');
    }

    /**
     * Actualiza una confirmación existente
     * @param {string} code - Código de la invitación
     * @param {Confirmation} confirmation - Datos actualizados de la confirmación
     * @returns {Promise<Confirmation>} Confirmación actualizada
     * @throws {Error} Si la confirmación no existe o hay error al actualizar
     */
    async update(code, confirmation) {
        throw new Error('Method update must be implemented');
    }

    /**
     * Elimina una confirmación
     * @param {string} code - Código de la invitación
     * @returns {Promise<boolean>} True si se eliminó correctamente
     * @throws {Error} Si la confirmación no existe o hay error al eliminar
     */
    async delete(code) {
        throw new Error('Method delete must be implemented');
    }

    /**
     * Busca confirmaciones por número de teléfono
     * @param {string} phone - Número de teléfono
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones que coinciden
     * @throws {Error} Si hay error en la búsqueda
     */
    async findByPhone(phone) {
        throw new Error('Method findByPhone must be implemented');
    }

    /**
     * Busca confirmaciones que contengan un nombre específico
     * @param {string} guestName - Nombre del invitado
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones que coinciden
     * @throws {Error} Si hay error en la búsqueda
     */
    async findByGuestName(guestName) {
        throw new Error('Method findByGuestName must be implemented');
    }

    /**
     * Obtiene confirmaciones positivas (que van a asistir)
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones positivas
     * @throws {Error} Si hay error en la búsqueda
     */
    async findPositiveConfirmations() {
        throw new Error('Method findPositiveConfirmations must be implemented');
    }

    /**
     * Obtiene confirmaciones negativas (que no van a asistir)
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones negativas
     * @throws {Error} Si hay error en la búsqueda
     */
    async findNegativeConfirmations() {
        throw new Error('Method findNegativeConfirmations must be implemented');
    }

    /**
     * Obtiene confirmaciones con restricciones dietarias
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones con restricciones
     * @throws {Error} Si hay error en la búsqueda
     */
    async findWithDietaryRestrictions() {
        throw new Error('Method findWithDietaryRestrictions must be implemented');
    }

    /**
     * Obtiene confirmaciones con mensajes para los novios
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones con mensajes
     * @throws {Error} Si hay error en la búsqueda
     */
    async findWithMessages() {
        throw new Error('Method findWithMessages must be implemented');
    }

    /**
     * Obtiene estadísticas de confirmaciones
     * @returns {Promise<Object>} Estadísticas de confirmaciones
     * @throws {Error} Si hay error al calcular estadísticas
     */
    async getStats() {
        throw new Error('Method getStats must be implemented');
    }

    /**
     * Verifica si existe una confirmación para el código dado
     * @param {string} code - Código de la invitación
     * @returns {Promise<boolean>} True si existe
     * @throws {Error} Si hay error en la verificación
     */
    async exists(code) {
        throw new Error('Method exists must be implemented');
    }

    /**
     * Cuenta el total de confirmaciones
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>} Número total de confirmaciones
     * @throws {Error} Si hay error al contar
     */
    async count(filters = {}) {
        throw new Error('Method count must be implemented');
    }

    /**
     * Obtiene confirmaciones paginadas
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

    /**
     * Exporta todas las confirmaciones
     * @param {Object} options - Opciones de exportación
     * @returns {Promise<Object>} Datos exportados
     * @throws {Error} Si hay error en la exportación
     */
    async exportAll(options = {}) {
        throw new Error('Method exportAll must be implemented');
    }

    /**
     * Obtiene el total de invitados confirmados
     * @returns {Promise<number>} Número total de invitados confirmados
     * @throws {Error} Si hay error al calcular
     */
    async getTotalConfirmedGuests() {
        throw new Error('Method getTotalConfirmedGuests must be implemented');
    }

    /**
     * Obtiene confirmaciones recientes
     * @param {number} hours - Horas hacia atrás para considerar "reciente"
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones recientes
     * @throws {Error} Si hay error en la búsqueda
     */
    async findRecent(hours = 24) {
        throw new Error('Method findRecent must be implemented');
    }

    /**
     * Busca confirmaciones por rango de fechas
     * @param {Date} startDate - Fecha de inicio
     * @param {Date} endDate - Fecha de fin
     * @returns {Promise<Array<Confirmation>>} Lista de confirmaciones en el rango
     * @throws {Error} Si hay error en la búsqueda
     */
    async findByDateRange(startDate, endDate) {
        throw new Error('Method findByDateRange must be implemented');
    }
}

module.exports = IConfirmationRepository;
