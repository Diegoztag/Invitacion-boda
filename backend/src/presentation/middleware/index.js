/**
 * Middleware Index
 * Configuración central de todos los middlewares de la aplicación
 * Organizado siguiendo principios Clean Architecture
 */

const AuthMiddleware = require('./authMiddleware');
const SecurityMiddleware = require('./securityMiddleware');
const csrfMiddleware = require('./csrf');

/**
 * Configura todos los middlewares de la aplicación
 * @param {Object} dependencies - Dependencias necesarias
 * @returns {Object} Objeto con todos los middlewares configurados
 */
function configureMiddleware(dependencies) {
    const { validationService, logger, config } = dependencies;

    // Instanciar middlewares
    const authMiddleware = new AuthMiddleware(logger);
    const securityMiddleware = new SecurityMiddleware(validationService, logger, config);

    return {
        // Middleware de seguridad
        forceHttps: securityMiddleware.forceHttps,
        helmet: securityMiddleware.helmet,
        compression: securityMiddleware.compression,
        cors: securityMiddleware.cors,
        rateLimit: securityMiddleware.rateLimit,
        authRateLimit: securityMiddleware.authRateLimit,
        requestId: securityMiddleware.requestId,
        requestLogger: securityMiddleware.requestLogger,
        csrfProtection: csrfMiddleware,
        sendCsrfToken: (req, res) => {
            res.json({ csrfToken: req.csrfToken() });
        },

        // Middleware de validación
        validateParams: securityMiddleware.validateParams,
        validateQuery: securityMiddleware.validateQuery,
        validateBody: securityMiddleware.validateBody,
        sanitizeInput: securityMiddleware.sanitizeInput,

        // Middleware de autenticación
        authenticate: authMiddleware.authenticate,
        requirePermissions: authMiddleware.requirePermissions.bind(authMiddleware),

        // Endpoints de autenticación
        login: authMiddleware.login,
        verify: authMiddleware.verify,

        // Middleware de manejo de errores
        errorHandler: securityMiddleware.errorHandler,
        globalErrorHandler: securityMiddleware.globalErrorHandler,

        // Instancias para acceso directo si es necesario
        authMiddleware,
        securityMiddleware
    };
}

module.exports = configureMiddleware;
