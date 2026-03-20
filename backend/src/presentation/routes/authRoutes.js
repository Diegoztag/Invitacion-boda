/**
 * Auth Routes
 * Rutas de autenticación (login, logout, verify)
 */

const express = require('express');

/**
 * Configura rutas de autenticación
 * @param {Object} middleware - Middleware, incluyendo authMiddleware
 * @returns {Router} Router de autenticación
 */
function configureAuthRoutes(middleware) {
    const router = express.Router();

    // POST /auth/login - Obtener token JWT
    router.post('/login', middleware.authRateLimit, middleware.authMiddleware.login);

    // GET /auth/verify - Verificar token JWT válido
    router.get('/verify', middleware.authenticate, middleware.authMiddleware.verify);

    // POST /auth/logout - Logout (cliente debe limpiar token)
    router.post('/logout', middleware.authenticate, (req, res) => {
        res.json({
            success: true,
            message: 'Sesión cerrada correctamente. Por favor limpia el token en el cliente.'
        });
    });

    // GET /auth/refresh - Refrescar token JWT
    router.get('/refresh', middleware.authenticate, (req, res) => {
        try {
            const authMiddleware = middleware.authMiddleware;
            const newToken = authMiddleware.generateToken({
                id: req.user.id,
                role: req.user.role,
                permissions: req.user.permissions
            });

            res.json({
                success: true,
                token: newToken,
                expiresIn: '24h'
            });
        } catch {
            res.status(500).json({
                success: false,
                error: 'Error al refrescar token'
            });
        }
    });

    return router;
}

module.exports = configureAuthRoutes;
