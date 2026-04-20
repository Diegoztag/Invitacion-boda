const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

module.exports = settingsController => {
    // Obtener configuración (público para que el frontend pueda consumirla)
    router.get('/', (req, res) => settingsController.getSettings(req, res));

    // Actualizar configuración (protegido)
    router.put('/', authMiddleware, (req, res) => settingsController.updateSettings(req, res));

    return router;
};
