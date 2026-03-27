const BaseException = require('./BaseException');

/**
 * Validation Exception
 * Excepción para errores de validación de datos (400).
 */
class ValidationException extends BaseException {
    constructor(errors, message = 'Error de validación') {
        super('ValidationException', 400, message, errors);
    }
}

module.exports = ValidationException;
