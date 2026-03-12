/**
 * CSRF Protection Middleware
 * Protección contra ataques Cross-Site Request Forgery
 */

const { v4: uuidv4 } = require('uuid');

class CSRFMiddleware {
    constructor(logger) {
        this.logger = logger;
        // Almacenar tokens en memoria (en producción usar Redis/sesiones)
        this.tokens = new Map();
    }

    /**
     * Generar un nuevo token CSRF
     * @returns {string} Token CSRF
     */
    generateToken() {
        return uuidv4();
    }

    /**
     * Middleware para generar y pasar token CSRF
     * Agrega token a responses con formato JSON
     */
    generateMiddleware() {
        return (req, res, next) => {
            const token = this.generateToken();

            // Almacenar token en memoria (asociado a la sesión/IP)
            const key = req.sessionID || req.ip;
            this.tokens.set(key, {
                token,
                createdAt: Date.now(),
                used: false
            });

            // Pasar token en header y locales
            res.setHeader('X-CSRF-Token', token);
            res.locals.csrfToken = token;
            req.csrfToken = () => token;

            next();
        };
    }

    /**
     * Validar token CSRF en requests que modifiquen datos
     * Retorna middleware que valida el token
     */
    validateMiddleware() {
        return (req, res, next) => {
            // Solo validar para requests que modifiquen datos
            if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                return next();
            }

            // Obtener token del request
            const token =
                req.headers['x-csrf-token'] || req.body?.csrfToken || req.query?.csrfToken;

            if (!token) {
                this.logger.warn('CSRF token missing', {
                    ip: req.ip,
                    method: req.method,
                    path: req.path
                });

                return res.status(403).json({
                    success: false,
                    error: 'Token CSRF faltante',
                    code: 'CSRF_TOKEN_MISSING'
                });
            }

            // Buscar token en almacenamiento
            const key = req.sessionID || req.ip;
            const storedData = this.tokens.get(key);

            if (!storedData) {
                this.logger.warn('CSRF token not found in storage', {
                    ip: req.ip,
                    method: req.method,
                    path: req.path
                });

                return res.status(403).json({
                    success: false,
                    error: 'Token CSRF inválido o expirado',
                    code: 'CSRF_TOKEN_INVALID'
                });
            }

            // Validar que el token coincida
            if (storedData.token !== token) {
                this.logger.warn('CSRF token mismatch', {
                    ip: req.ip,
                    method: req.method,
                    path: req.path
                });

                return res.status(403).json({
                    success: false,
                    error: 'Token CSRF inválido',
                    code: 'CSRF_TOKEN_MISMATCH'
                });
            }

            // Validar tiempo (token válido por 1 hora)
            const age = Date.now() - storedData.createdAt;
            const maxAge = 60 * 60 * 1000; // 1 hora

            if (age > maxAge) {
                this.logger.warn('CSRF token expired', {
                    ip: req.ip,
                    method: req.method,
                    path: req.path,
                    age
                });

                return res.status(403).json({
                    success: false,
                    error: 'Token CSRF expirado',
                    code: 'CSRF_TOKEN_EXPIRED'
                });
            }

            // Token válido, marcar como usado y regenerar
            storedData.used = true;
            const newToken = this.generateToken();
            this.tokens.set(key, {
                token: newToken,
                createdAt: Date.now(),
                used: false
            });

            // Pasar nuevo token en respuesta
            res.setHeader('X-CSRF-Token', newToken);
            req.csrfTokenValid = true;

            this.logger.debug('CSRF token validated', {
                ip: req.ip,
                method: req.method,
                path: req.path
            });

            next();
        };
    }

    /**
     * Limpiar tokens expirados
     */
    cleanupExpiredTokens() {
        const maxAge = 60 * 60 * 1000; // 1 hora
        const now = Date.now();

        for (const [key, data] of this.tokens.entries()) {
            if (now - data.createdAt > maxAge) {
                this.tokens.delete(key);
            }
        }
    }

    /**
     * Iniciar limpieza periódica de tokens
     */
    startCleanupInterval() {
        setInterval(
            () => {
                this.cleanupExpiredTokens();
            },
            30 * 60 * 1000
        ); // Limpiar cada 30 minutos
    }
}

module.exports = CSRFMiddleware;
