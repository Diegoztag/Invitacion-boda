class SettingsController {
    constructor(settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    async getSettings(req, res) {
        try {
            const settings = await this.settingsRepository.getSettings();
            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('Error getting settings:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la configuración'
            });
        }
    }

    async updateSettings(req, res) {
        try {
            const settings = req.body;

            if (!settings || typeof settings !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de configuración inválido'
                });
            }

            await this.settingsRepository.updateSettings(settings);

            res.json({
                success: true,
                message: 'Configuración actualizada correctamente'
            });
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la configuración'
            });
        }
    }
}

module.exports = SettingsController;
