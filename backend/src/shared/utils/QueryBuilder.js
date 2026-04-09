/**
 * QueryBuilder
 * Utilidad para construir objetos de consulta (filtros, paginación, ordenamiento)
 * a partir de los parámetros de la petición HTTP (req.query).
 */

class QueryBuilder {
    /**
     * Construye un objeto de consulta estandarizado
     * @param {Object} query - req.query
     * @param {Object} config - Configuración de la aplicación (opcional)
     * @returns {Object} Objeto con page, limit, filters y sort
     */
    static buildFromRequest(query, config = {}) {
        const defaultLimit = config?.validation?.pagination?.defaultLimit || 10;

        const {
            page = 1,
            limit = defaultLimit,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeInactive = 'false',
            ...rawFilters
        } = query;

        const filters = this._parseFilters(rawFilters);

        return {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || defaultLimit,
            filters,
            sort: {
                field: sortBy,
                direction: sortOrder
            },
            includeInactive: includeInactive === 'true'
        };
    }

    /**
     * Parsea los filtros, convirtiendo strings booleanos y numéricos
     * @param {Object} rawFilters - Filtros en crudo
     * @returns {Object} Filtros parseados
     * @private
     */
    static _parseFilters(rawFilters) {
        const parsedFilters = {};

        for (const [key, value] of Object.entries(rawFilters)) {
            if (value === undefined || value === null || value === '') {
                continue;
            }

            if (value === 'true') {
                parsedFilters[key] = true;
            } else if (value === 'false') {
                parsedFilters[key] = false;
            } else if (!isNaN(value) && value.trim() !== '') {
                // Solo convertir a número si es estrictamente numérico y no es un teléfono
                if (key !== 'phone' && key !== 'search') {
                    parsedFilters[key] = Number(value);
                } else {
                    parsedFilters[key] = value;
                }
            } else {
                parsedFilters[key] = value;
            }
        }

        return parsedFilters;
    }
}

module.exports = QueryBuilder;
