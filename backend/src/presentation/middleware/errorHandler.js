/**
 * Middleware de manejo de errores para estandarizar las respuestas de error.
 */
const BaseException = require('../../shared/exceptions/BaseException');

const errorHandler = (err, req, res, _next) => {
    console.log('ERROR HANDLER CAUGHT:', err.name, err.message, err.statusCode);
    // Verificar si es una excepción personalizada (por instancia o por propiedades)
    if (
        err instanceof BaseException ||
        (err.statusCode && err.name && err.name.endsWith('Exception'))
    ) {
        return res.status(err.statusCode || 400).json({
            success: false,
            error: err.message,
            code: err.errorCode || err.name,
            details: err.details || []
        });
    }

    // Para errores inesperados, ocultar detalles en producción
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
            success: false,
            error: 'Ocurrió un error inesperado en el servidor.',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }

    // En desarrollo, mostrar más detalles
    return res.status(500).json({
        success: false,
        error: err.message,
        code: 'INTERNAL_SERVER_ERROR',
        stack: err.stack
    });
};

module.exports = errorHandler;
