import { adminAPI } from '../dashboard-api.js';
import { showToast } from '../components/dashboard-modal.js';

export class ConfigurationController {
    constructor() {
        this.container = document.getElementById('configuracion');
        this.form = document.getElementById('config-form');
        this.settings = {};
    }

    async init() {
        if (!this.container || !this.form) {
            return;
        }

        await this.loadConfiguration();
        this.render();
        this.setupEventListeners();
    }

    async loadConfiguration() {
        try {
            const result = await adminAPI.fetchSettings();
            if (result.success) {
                this.settings = result.data.data || {};
            } else {
                showToast('Error al cargar la configuración', 'error');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showToast('Error al cargar la configuración', 'error');
        }
    }

    render() {
        // Limpiar el formulario existente excepto el botón de submit
        const submitBtn = this.form.querySelector('button[type="submit"]');
        this.form.innerHTML = '';

        const fieldsHtml = `
            <div class="form-group">
                <label for="weddingDate">Fecha de la Boda</label>
                <input type="date" id="weddingDate" name="weddingDate" value="${this.settings.weddingDate || ''}" class="form-control">
            </div>
            
            <div class="form-group">
                <label for="locationName">Nombre del Lugar</label>
                <input type="text" id="locationName" name="locationName" value="${this.settings.locationName || ''}" class="form-control">
            </div>
            
            <div class="form-group">
                <label for="locationUrl">URL de Google Maps</label>
                <input type="url" id="locationUrl" name="locationUrl" value="${this.settings.locationUrl || ''}" class="form-control">
            </div>
            
            <div class="form-group checkbox-group">
                <label for="enableConfirmations" class="checkbox-label">
                    <input type="checkbox" id="enableConfirmations" name="enableConfirmations" ${this.settings.enableConfirmations !== false ? 'checked' : ''}>
                    Habilitar Confirmaciones
                </label>
            </div>
        `;

        this.form.insertAdjacentHTML('afterbegin', fieldsHtml);
        if (submitBtn) {
            this.form.appendChild(submitBtn);
        } else {
            this.form.insertAdjacentHTML(
                'beforeend',
                '<button type="submit" class="btn btn-primary">Guardar Cambios</button>'
            );
        }
    }

    setupEventListeners() {
        if (!this.form) {
            return;
        }

        this.form.addEventListener('submit', async e => {
            e.preventDefault();

            const formData = new FormData(this.form);
            const newSettings = {
                weddingDate: formData.get('weddingDate'),
                locationName: formData.get('locationName'),
                locationUrl: formData.get('locationUrl'),
                enableConfirmations: formData.get('enableConfirmations') === 'on'
            };

            try {
                const result = await adminAPI.updateSettings(newSettings);
                if (result.success) {
                    showToast('Configuración guardada correctamente', 'success');
                    this.settings = newSettings;
                } else {
                    showToast('Error al guardar la configuración', 'error');
                }
            } catch (error) {
                console.error('Error saving settings:', error);
                showToast('Error al guardar la configuración', 'error');
            }
        });
    }
}
