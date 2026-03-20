export class ConfigurationController {
    constructor(apiService, notificationService) {
        this.apiService = apiService;
        this.notificationService = notificationService;
        this.configForm = document.getElementById('config-form');
        this.testEmailButton = document.getElementById('test-email-button');
    }

    async init() {
        this.setupEventListeners();
        await this.loadConfiguration();
    }

    setupEventListeners() {
        this.configForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.testEmailButton.addEventListener('click', this.handleTestEmail.bind(this));
    }

    async loadConfiguration() {
        try {
            const config = await this.apiService.getConfiguration();
            this.populateForm(config);
        } catch {
            this.notificationService.show('Error al cargar la configuración', 'error');
        }
    }

    populateForm(_config) {
        // Populate form fields with config data
        // Example: document.getElementById('email-host').value = config.email.host;
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(this.configForm);
        const configData = Object.fromEntries(formData.entries());

        try {
            await this.apiService.updateConfiguration(configData);
            this.notificationService.show('Configuración guardada con éxito');
        } catch {
            this.notificationService.show('Error al guardar la configuración', 'error');
        }
    }

    async handleTestEmail() {
        try {
            await this.apiService.sendTestEmail();
            this.notificationService.show('Correo de prueba enviado');
        } catch {
            this.notificationService.show('Error al enviar el correo de prueba', 'error');
        }
    }
}
