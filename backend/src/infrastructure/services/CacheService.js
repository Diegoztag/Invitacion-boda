const NodeCache = require('node-cache');

/**
 * Cache Service
 * Servicio para manejar el almacenamiento en caché en memoria
 */
class CacheService {
    constructor(logger, ttlSeconds = 300) {
        // Default TTL: 5 minutos
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false
        });
        this.logger = logger;
    }

    /**
     * Obtiene un valor de la caché
     * @param {string} key - Clave del valor
     * @returns {*} Valor almacenado o undefined si no existe
     */
    get(key) {
        const value = this.cache.get(key);
        if (value) {
            this.logger.debug(`Cache hit for key: ${key}`);
        } else {
            this.logger.debug(`Cache miss for key: ${key}`);
        }
        return value;
    }

    /**
     * Almacena un valor en la caché
     * @param {string} key - Clave del valor
     * @param {*} value - Valor a almacenar
     * @param {number} [ttl] - Tiempo de vida en segundos (opcional)
     * @returns {boolean} true si se almacenó correctamente
     */
    set(key, value, ttl) {
        this.logger.debug(`Setting cache for key: ${key}`);
        if (ttl) {
            return this.cache.set(key, value, ttl);
        }
        return this.cache.set(key, value);
    }

    /**
     * Elimina un valor de la caché
     * @param {string|string[]} keys - Clave o array de claves a eliminar
     * @returns {number} Número de elementos eliminados
     */
    del(keys) {
        this.logger.debug(`Deleting cache for keys: ${keys}`);
        return this.cache.del(keys);
    }

    /**
     * Limpia toda la caché
     */
    flush() {
        this.logger.info('Flushing entire cache');
        this.cache.flushAll();
    }

    /**
     * Obtiene estadísticas de la caché
     * @returns {Object} Estadísticas
     */
    getStats() {
        return this.cache.getStats();
    }
}

module.exports = CacheService;
