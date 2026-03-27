const BaseException = require('./BaseException');

/**
 * Business Rule Exception
 * Excepción para violaciones de reglas de negocio (400 o 409).
 */
class BusinessRuleException extends BaseException {
    constructor(message, details, statusCode = 400) {
        super('BusinessRuleException', statusCode, message, details);
    }
}

module.exports = BusinessRuleException;
