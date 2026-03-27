const BaseException = require('./BaseException');

/**
 * Not Found Exception
 * Excepción para recursos no encontrados (404).
 */
class NotFoundException extends BaseException {
    constructor(resource = 'Recurso', query = 'desconocido') {
        const message = `${resource} con identificador '${query}' no encontrado.`;
        super('NotFoundException', 404, message);
    }
}

module.exports = NotFoundException;
