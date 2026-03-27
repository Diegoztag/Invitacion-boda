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

    /**
     * Ejecuta un caso de uso y maneja la respuesta.
     * @param {object} req - El objeto de solicitud de Express.
     * @param {object} res - El objeto de respuesta de Express.
     * @param {function} next - La función `next` de Express.
     * @param {object} useCase - El caso de uso a ejecutar.
     * @param {Array} params - Los parámetros para el caso de uso.
     * @param {string} operationName - El nombre de la operación para el logger.
     */
    async executeUseCase(req, res, next, useCase, params, operationName) {
        const endOperation = this.logger.startOperation(operationName, {
            params,
            ip: req.ip
        });

        try {
            const result = await useCase.execute(...params);
            if (result && result.success === false) {
                // Si el caso de uso retorna un error de negocio, lo manejamos
                return this.sendError(res, new Error(result.error), next);
            }
            endOperation({ success: true });
            this.sendSuccess(res, result);
        } catch (error) {
            endOperation({ error: error.message }, 'error');
            this.sendError(res, error, next);
        }
    }
}

export default BaseController;
