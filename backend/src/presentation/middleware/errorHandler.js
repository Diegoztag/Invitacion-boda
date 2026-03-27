/**
 * Middleware de manejo de errores para estandarizar las respuestas de error.
 */
import { BaseException } from '../../shared/exceptions/BaseException.js';

const errorHandler = (err, req, res, _next) => {
    if (err instanceof BaseException) {
        return res.status(err.statusCode).json({
            error: {
                code: err.errorCode,
                message: err.message,
                details: err.details || []
            }
        });
    }

    // Para errores inesperados, ocultar detalles en producción
    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Ocurrió un error inesperado en el servidor.'
            }
        });
    }

    // En desarrollo, mostrar más detalles
    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message,
            stack: err.stack
        }
    });
};

export default errorHandler;
