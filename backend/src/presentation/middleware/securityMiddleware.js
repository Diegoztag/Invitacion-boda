/**
 * Security Middleware
 * Middleware de seguridad para proteger la aplicación
 * Incluye rate limiting, validación, sanitización y headers de seguridad
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

class SecurityMiddleware {
    constructor(validationService, logger) {
        this.validationService = validationService;
        this.logger = logger;
    }

    /**
     * Configuración de Helmet para headers de seguridad
     */
    get helmet() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: [
                        "'self'", 
                        "'unsafe-inline'",
                        "https://fonts.googleapis.com",
                        "https://cdnjs.cloudflare.com"
                    ],
                    scriptSrc: [
                        "'self'", 
                        "'unsafe-inline'",
                        "https://cdn.jsdelivr.net",
                        "https://cdnjs.cloudflare.com"
                    ],
                    imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:3000", "https://localhost:3000", "https://cdn.jsdelivr.net"],
                    fontSrc: [
                        "'self'", 
                        "https://fonts.gstatic.com",
                        "https://fonts.googleapis.com",
                        "https://cdnjs.cloudflare.com"
                    ],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'", "data:"],
                    frameSrc: ["'self'", "https://www.google.com"],
                },
            },
            crossOriginEmbedderPolicy: false,
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        });
    }

    /**
     * Configuración de compresión
     */
    get compression() {
        return compression({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            },
            level: 6,
            threshold: 1024
        });
    }

    /**
     * CORS middleware
     */
    get cors() {
        return (req, res, next) => {
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3001', // Browser-sync
                'http://localhost:8080',
                'https://localhost:3000',
                'https://localhost:3001', // Browser-sync HTTPS
                'https://localhost:8080',
                process.env.FRONTEND_URL
            ].filter(Boolean);

            const origin = req.headers.origin;
            
            if (allowedOrigins.includes(origin) || !origin) {
                res.setHeader('Access-Control-Allow-Origin', origin || '*');
            }

            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Max-Age', '86400');

            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }

            next();
        };
    }

    /**
     * Rate limiting para prevenir ataques de fuerza bruta
     */
    get rateLimit() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100, // máximo 100 requests por ventana
            message: {
                success: false,
                error: 'Demasiadas solicitudes, intenta de nuevo más tarde'
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                this.logger.warn('Rate limit exceeded', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path
                });

                res.status(429).json({
                    success: false,
                    error: 'Demasiadas solicitudes, intenta de nuevo más tarde'
                });
            }
        });
    }

    /**
     * Rate limiting estricto para endpoints de autenticación
     */
    get authRateLimit() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 5, // máximo 5 intentos de login por ventana
            message: {
                success: false,
                error: 'Demasiados intentos de login, intenta de nuevo más tarde'
            },
            skipSuccessfulRequests: true,
            handler: (req, res) => {
                this.logger.warn('Auth rate limit exceeded', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });

                res.status(429).json({
                    success: false,
                    error: 'Demasiados intentos de login, intenta de nuevo más tarde'
                });
            }
        });
    }

    /**
     * Middleware para agregar ID único a cada request
     */
    get requestId() {
        return (req, res, next) => {
            req.id = uuidv4();
            res.setHeader('X-Request-ID', req.id);
            next();
        };
    }

    /**
     * Middleware de logging de requests
     */
    get requestLogger() {
        return (req, res, next) => {
            const startTime = Date.now();
            
            // Log del request entrante
            this.logger.info('Incoming request', {
                requestId: req.id,
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                contentType: req.get('Content-Type')
            });

            // Interceptar el final de la respuesta
            const originalSend = res.send;
            res.send = function(data) {
                const duration = Date.now() - startTime;
                
                // Log de la respuesta
                req.app.locals.logger.info('Request completed', {
                    requestId: req.id,
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                    contentLength: res.get('Content-Length') || data?.length || 0
                });

                return originalSend.call(this, data);
            };

            next();
        };
    }

    /**
     * Validación de parámetros de ruta
     */
    get validateParams() {
        return (req, res, next) => {
            try {
                // Validar código de invitación si está presente
                if (req.params.code) {
                    if (!this.validationService.validateInvitationCode(req.params.code)) {
                        return res.status(400).json({
                            success: false,
                            error: 'Código de invitación inválido'
                        });
                    }
                }

                // Validar nombre si está presente
                if (req.params.name) {
                    const name = req.params.name.trim();
                    if (name.length < 2 || name.length > 100) {
                        return res.status(400).json({
                            success: false,
                            error: 'Nombre debe tener entre 2 y 100 caracteres'
                        });
                    }
                }

                next();
            } catch (error) {
                this.logger.error('Error validating params', {
                    params: req.params,
                    error: error.message
                });

                res.status(400).json({
                    success: false,
                    error: 'Parámetros inválidos'
                });
            }
        };
    }

    /**
     * Validación de query parameters
     */
    get validateQuery() {
        return (req, res, next) => {
            try {
                const { page, limit, sortBy, sortOrder } = req.query;

                // Validar paginación
                if (page && (isNaN(page) || parseInt(page) < 1)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Número de página inválido'
                    });
                }

                if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 1000)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Límite inválido (1-1000)'
                    });
                }

                // Validar ordenamiento
                const allowedSortFields = ['createdAt', 'code', 'confirmedAt', 'willAttend'];
                if (sortBy && !allowedSortFields.includes(sortBy)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Campo de ordenamiento inválido'
                    });
                }

                if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Orden inválido (asc/desc)'
                    });
                }

                next();
            } catch (error) {
                this.logger.error('Error validating query', {
                    query: req.query,
                    error: error.message
                });

                res.status(400).json({
                    success: false,
                    error: 'Parámetros de consulta inválidos'
                });
            }
        };
    }

    /**
     * Validación de body
     */
    get validateBody() {
        return (req, res, next) => {
            try {
                // Verificar que el body no esté vacío para requests que lo requieren
                if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                    if (!req.body || Object.keys(req.body).length === 0) {
                        return res.status(400).json({
                            success: false,
                            error: 'Cuerpo de la solicitud requerido'
                        });
                    }
                }

                // Verificar tamaño del body
                const bodySize = JSON.stringify(req.body).length;
                if (bodySize > 1024 * 1024) { // 1MB
                    return res.status(413).json({
                        success: false,
                        error: 'Cuerpo de la solicitud demasiado grande'
                    });
                }

                next();
            } catch (error) {
                this.logger.error('Error validating body', {
                    error: error.message
                });

                res.status(400).json({
                    success: false,
                    error: 'Cuerpo de la solicitud inválido'
                });
            }
        };
    }

    /**
     * Sanitización de input
     */
    get sanitizeInput() {
        return (req, res, next) => {
            try {
                // Sanitizar body
                if (req.body) {
                    req.body = this.sanitizeObject(req.body);
                }

                // Sanitizar query
                if (req.query) {
                    req.query = this.sanitizeObject(req.query);
                }

                // Sanitizar params
                if (req.params) {
                    req.params = this.sanitizeObject(req.params);
                }

                next();
            } catch (error) {
                this.logger.error('Error sanitizing input', {
                    error: error.message
                });

                res.status(400).json({
                    success: false,
                    error: 'Error procesando datos de entrada'
                });
            }
        };
    }

    /**
     * Manejo de errores específico para rutas
     */
    get errorHandler() {
        return (error, req, res, next) => {
            this.logger.error('Route error', {
                requestId: req.id,
                path: req.path,
                method: req.method,
                error: error.message,
                stack: error.stack
            });

            // Error de validación
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: error.details
                });
            }

            // Error de autorización
            if (error.name === 'UnauthorizedError') {
                return res.status(401).json({
                    success: false,
                    error: 'No autorizado'
                });
            }

            // Error genérico
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        };
    }

    /**
     * Manejo global de errores
     */
    get globalErrorHandler() {
        return (error, req, res, next) => {
            this.logger.error('Global error', {
                requestId: req.id,
                path: req.path,
                method: req.method,
                error: error.message,
                stack: error.stack
            });

            if (res.headersSent) {
                return next(error);
            }

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                requestId: req.id
            });
        };
    }

    /**
     * Sanitiza un objeto recursivamente
     * @param {Object} obj - Objeto a sanitizar
     * @returns {Object} Objeto sanitizado
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return this.sanitizeValue(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = this.sanitizeValue(key);
            sanitized[sanitizedKey] = this.sanitizeObject(value);
        }

        return sanitized;
    }

    /**
     * Sanitiza un valor individual
     * @param {*} value - Valor a sanitizar
     * @returns {*} Valor sanitizado
     */
    sanitizeValue(value) {
        if (typeof value === 'string') {
            // Remover caracteres peligrosos
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        }

        return value;
    }
}

module.exports = SecurityMiddleware;
