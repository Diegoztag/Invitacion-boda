const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

module.exports = settingsController => {
    // Obtener configuración (público, o protegido si se prefiere)
    // Lo dejamos protegido por ahora ya que es para el dashboard
    router.get('/', authMiddleware, (req, res) => settingsController.getSettings(req, res));

    // Actualizar configuración (protegido)
    router.put('/', authMiddleware, (req, res) => settingsController.updateSettings(req, res));

    return router;
};
