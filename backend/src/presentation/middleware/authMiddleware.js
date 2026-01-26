/**
 * Authentication Middleware
 * Middleware para autenticación y autorización
 * Implementa seguridad básica para rutas administrativas
 */

const jwt = require('jsonwebtoken');

class AuthMiddleware {
    constructor(logger) {
        this.logger = logger;
        this.secretKey = process.env.JWT_SECRET || 'wedding-invitation-secret-key';
        this.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    }

    /**
     * Middleware de autenticación básica
     * Verifica token JWT o credenciales básicas
     */
    authenticate = (req, res, next) => {
        const endOperation = this.logger.startOperation('authenticate', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });

        try {
            // Verificar header de autorización
            const authHeader = req.headers.authorization;
            
            if (!authHeader) {
                endOperation({ authenticated: false, reason: 'no_auth_header' });
                return res.status(401).json({
                    success: false,
                    error: 'Token de autorización requerido'
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

            endOperation({ authenticated: false, reason: 'invalid_auth_type' });
            return res.status(401).json({
                success: false,
                error: 'Tipo de autorización no válido'
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
            this.logger.error('Error in authentication middleware', {
                error: error.message,
                stack: error.stack
            });

            return res.status(500).json({
                success: false,
                error: 'Error interno de autenticación'
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
    verifyJWT(token, req, res, next, endOperation) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            
            // Verificar expiración
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                endOperation({ authenticated: false, reason: 'token_expired' });
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado'
                });
            }

            // Agregar información del usuario al request
            req.user = {
                id: decoded.id || 'admin',
                role: decoded.role || 'admin',
                permissions: decoded.permissions || ['read', 'write', 'delete']
            };

            endOperation({ authenticated: true, method: 'jwt' });
            next();

        } catch (error) {
            endOperation({ authenticated: false, reason: 'invalid_jwt' });
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido'
                });
            }

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado'
                });
            }

            throw error;
        }
    }

    /**
     * Verifica autenticación básica
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

            if (username === 'admin' && password === this.adminPassword) {
                req.user = {
                    id: 'admin',
                    role: 'admin',
                    permissions: ['read', 'write', 'delete']
                };

                endOperation({ authenticated: true, method: 'basic' });
                next();
            } else {
                endOperation({ authenticated: false, reason: 'invalid_credentials' });
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas'
                });
            }

        } catch (error) {
            endOperation({ authenticated: false, reason: 'basic_auth_error' });
            return res.status(401).json({
                success: false,
                error: 'Error en autenticación básica'
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
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
        };

        return jwt.sign({ ...defaultPayload, ...payload }, this.secretKey);
    }

    /**
     * Middleware para verificar permisos específicos
     * @param {Array<string>} requiredPermissions - Permisos requeridos
     * @returns {Function} Middleware function
     */
    requirePermissions(requiredPermissions) {
        return (req, res, next) => {
            const endOperation = this.logger.startOperation('checkPermissions', {
                requiredPermissions,
                userPermissions: req.user?.permissions
            });

            try {
                if (!req.user) {
                    endOperation({ authorized: false, reason: 'no_user' });
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
                    endOperation({ authorized: false, reason: 'insufficient_permissions' });
                    return res.status(403).json({
                        success: false,
                        error: 'Permisos insuficientes'
                    });
                }

                endOperation({ authorized: true });
                next();

            } catch (error) {
                endOperation({ error: error.message }, 'error');
                
                this.logger.error('Error checking permissions', {
                    error: error.message,
                    stack: error.stack
                });

                return res.status(500).json({
                    success: false,
                    error: 'Error interno de autorización'
                });
            }
        };
    }

    /**
     * Endpoint para login y obtener token
     * POST /auth/login
     */
    login = (req, res) => {
        const endOperation = this.logger.startOperation('login', {
            ip: req.ip
        });

        try {
            const { username, password } = req.body;

            if (!username || !password) {
                endOperation({ success: false, reason: 'missing_credentials' });
                return res.status(400).json({
                    success: false,
                    error: 'Usuario y contraseña requeridos'
                });
            }

            if (username === 'admin' && password === this.adminPassword) {
                const token = this.generateToken();
                
                endOperation({ success: true });
                
                return res.json({
                    success: true,
                    token,
                    user: {
                        id: 'admin',
                        role: 'admin',
                        permissions: ['read', 'write', 'delete']
                    },
                    expiresIn: '24h'
                });
            }

            endOperation({ success: false, reason: 'invalid_credentials' });
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
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
                endOperation({ valid: false });
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido'
                });
            }

            endOperation({ valid: true });
            return res.json({
                success: true,
                user: req.user,
                valid: true
            });

        } catch (error) {
            endOperation({ error: error.message }, 'error');
            
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
