/**
 * Controlador base para estandarizar el manejo de respuestas y errores.
 */
class BaseController {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Envía una respuesta exitosa.
     * @param {object} res - El objeto de respuesta de Express.
     * @param {object} data - Los datos a enviar en la respuesta.
     * @param {number} statusCode - El código de estado HTTP.
     */
    sendSuccess(res, data, statusCode = 200) {
        res.status(statusCode).json({
            success: true,
            data: data
        });
    }

    /**
     * Envía una respuesta de error.
     * @param {object} res - El objeto de respuesta de Express.
     * @param {Error} error - El objeto de error.
     * @param {function} next - La función `next` de Express.
     */
    sendError(res, error, next) {
        // El errorHandler middleware se encargará de formatear el error.
        // Aquí solo lo pasamos al siguiente middleware.
        next(error);
    }
}

export default BaseController;
