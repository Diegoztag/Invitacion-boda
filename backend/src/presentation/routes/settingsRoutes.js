const express = require('express');
const router = express.Router();

module.exports = (settingsController, middleware) => {
    // Obtener configuración (público para que el frontend pueda consumirla)
    router.get('/', (req, res) => settingsController.getSettings(req, res));

    // Actualizar configuración (protegido)
    router.put('/', middleware.authenticate, (req, res) =>
        settingsController.updateSettings(req, res)
    );

    return router;
};
