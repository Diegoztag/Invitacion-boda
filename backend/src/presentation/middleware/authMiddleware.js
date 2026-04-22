/**
 * Authentication Middleware
 * Middleware para autenticaciรณn y autorizaciรณn
 * Implementa seguridad bรกsica para rutas administrativas
 */

const jwt = require('jsonwebtoken');

class AuthMiddleware {
    constructor(logger) {
        this.logger = logger;

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET no estรก definido en las variables de entorno');
        }
        if (!process.env.ADMIN_PASSWORD) {
            throw new Error('ADMIN_PASSWORD no estรก definido en las variables de entorno');
        }

        this.secretKey = process.env.JWT_SECRET;
        this.adminUsername = process.env.ADMIN_USERNAME || 'admin';
        this.adminPassword = process.env.ADMIN_PASSWORD;
    }

    /**
     * Middleware de autenticaciรณn bรกsica
     * Verifica token JWT o credenciales bรกsicas
     */
    authenticate = (req, res, next) => {
        const endOperation = this.logger.startOperation('authenticate', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });

        try {
            // Verificar header de autorizaciรณn
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                endOperation({
                    authenticated: false,
                    reason: 'no_auth_header'
                });
                return res.status(401).json({
                    success: false,
                    error: 'Token de autorizaciรณn requerido'
                });
            }

            // Verificar si es Bearer token (JWT)
            if (authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                return this.verifyJWT(token, req, res, next, endOperation);
            }

            // Verificar si es Basic auth
            if (authHeader.startsWith('Basic ')) {
                const credentials = authHeader.substring(6);
                return this.verifyBasicAuth(credentials, req, res, next, endOperation);
            }

            endOperation({
                authenticated: false,
                reason: 'invalid_auth_type'
            });
            return res.status(401).json({
                success: false,
                error: 'Tipo de autorizaciรณn no vรกlido'
            });
        } catch (error) {
            endOperation(
                {
                    error: error.message
                },
                'error'
            );

            this.logger.error('Error in authentication middleware', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Error interno de autenticaciรณn'
            });
        }
    };

    /**
     * Verifica token JWT
     * @param {string} token - Token JWT
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware
     * @param {Function} endOperation - Logger operation
     */
    verifyJWT(token, req, _res, next, endOperation) {
        try {
            const decoded = jwt.verify(token, this.secretKey);

            // Verificar expiraciรณn
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                endOperation({
                    authenticated: false,
                    reason: 'token_expired'
                });
                return _res.status(401).json({
                    success: false,
                    error: 'Token expirado'
                });
            }

            // Agregar informaciรณn del usuario al request
            req.user = {
                id: decoded.id || 'admin',
                role: decoded.role || 'admin',
                permissions: decoded.permissions || ['read', 'write', 'delete']
            };

            endOperation({
                authenticated: true,
                method: 'jwt'
            });
            next();
        } catch (error) {
            endOperation({
                authenticated: false,
                reason: 'invalid_jwt'
            });

            if (error.name === 'JsonWebTokenError') {
                return _res.status(401).json({
                    success: false,
                    error: 'Token invรกlido'
                });
            }

            if (error.name === 'TokenExpiredError') {
                return _res.status(401).json({
                    success: false,
                    error: 'Token expirado'
                });
            }

            throw error;
        }
    }

    /**
     * Verifica autenticaciรณn bรกsica
     * @param {string} credentials - Credenciales codificadas en base64
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware
     * @param {Function} endOperation - Logger operation
     */
    verifyBasicAuth(credentials, req, res, next, endOperation) {
        try {
            const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
            const [username, password] = decoded.split(':');

            if (username === this.adminUsername && password === this.adminPassword) {
                req.user = {
                    id: this.adminUsername,
                    role: 'admin',
                    permissions: ['read', 'write', 'delete']
                };

                endOperation({
                    authenticated: true,
                    method: 'basic'
                });
                next();
            } else {
                endOperation({
                    authenticated: false,
                    reason: 'invalid_credentials'
                });
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales invรกlidas'
                });
            }
        } catch {
            endOperation({
                authenticated: false,
                reason: 'basic_auth_error'
            });
            return res.status(401).json({
                success: false,
                error: 'Error en autenticaciรณn bรกsica'
            });
        }
    }

    /**
     * Genera un token JWT para el usuario admin
     * @param {Object} payload - Datos del usuario
     * @returns {string} Token JWT
     */
    generateToken(payload = {}) {
        const defaultPayload = {
            id: 'admin',
            role: 'admin',
            permissions: ['read', 'write', 'delete'],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 horas
        };

        return jwt.sign({ ...defaultPayload, ...payload }, this.secretKey);
    }

    /**
     * Middleware para verificar permisos especรญficos
     * @param {Array<string>} requiredPermissions - Permisos requeridos
     * @returns {Function} Middleware function
     */
    requirePermissions(requiredPermissions) {
        return (req, res, next) => {
            const endOperation = this.logger.startOperation('checkPermissions', {
                requiredPermissions,
                userPermissions: req.user ? req.user.permissions : undefined
            });

            try {
                if (!req.user) {
                    endOperation({
                        authorized: false,
                        reason: 'no_user'
                    });
                    return res.status(401).json({
                        success: false,
                        error: 'Usuario no autenticado'
                    });
                }

                const userPermissions = req.user.permissions || [];
                const hasPermission = requiredPermissions.every(permission =>
                    userPermissions.includes(permission)
                );

                if (!hasPermission) {
                    endOperation({
                        authorized: false,
                        reason: 'insufficient_permissions'
                    });
                    return res.status(403).json({
                        success: false,
                        error: 'Permisos insuficientes'
                    });
                }

                endOperation({
                    authorized: true
                });
                next();
            } catch (error) {
                endOperation(
                    {
                        error: error.message
                    },
                    'error'
                );

                this.logger.error('Error checking permissions', {
                    error: error.message,
                    stack: error.stack
                });

                return res.status(500).json({
                    success: false,
                    error: 'Error interno de autorizaciรณn'
                });
            }
        };
    }

    /**
     * Endpoint para login y obtener token
     * POST /auth/login
     * @todo Implementar rate limiting para prevenir ataques de fuerza bruta
     */
    login = (req, res) => {
        const endOperation = this.logger.startOperation('login', {
            ip: req.ip
        });

        try {
            const { username, password } = req.body;

            if (!username || !password) {
                endOperation({
                    success: false,
                    reason: 'missing_credentials'
                });
                return res.status(400).json({
                    success: false,
                    error: 'Usuario y contraseรฑa requeridos'
                });
            }

            if (username === this.adminUsername && password === this.adminPassword) {
                const token = this.generateToken();

                endOperation({
                    success: true
                });

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: this.adminUsername,
                        role: 'admin',
                        permissions: ['read', 'write', 'delete']
                    },
                    expiresIn: '24h'
                });
            }

            endOperation({
                success: false,
                reason: 'invalid_credentials'
            });
            return res.status(401).json({
                success: false,
                error: 'Credenciales invรกlidas'
            });
        } catch (error) {
            endOperation(
                {
                    error: error.message
                },
                'error'
            );

            this.logger.error('Error in login', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Endpoint para verificar token
     * GET /auth/verify
     */
    verify = (req, res) => {
        const endOperation = this.logger.startOperation('verifyToken', {
            ip: req.ip
        });

        try {
            if (!req.user) {
                endOperation({
                    valid: false
                });
                return res.status(401).json({
                    success: false,
                    error: 'Token invรกlido'
                });
            }

            endOperation({
                valid: true
            });
            return res.json({
                success: true,
                user: req.user,
                valid: true
            });
        } catch (error) {
            endOperation(
                {
                    error: error.message
                },
                'error'
            );

            this.logger.error('Error verifying token', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };
}

module.exports = AuthMiddleware;
