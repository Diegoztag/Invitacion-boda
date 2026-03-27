/**
 * Base Exception
 * Clase base para excepciones personalizadas de la aplicación.
 */
class BaseException extends Error {
    constructor(name, statusCode, message, details) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = BaseException;
