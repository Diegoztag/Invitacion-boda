/**
 * Servicio de notificaciones Toast
 * Muestra mensajes amigables al usuario
 */
export class ToastService {
    constructor() {
        this.container = null;
        // No inicializar en el constructor para evitar problemas si el DOM no está listo
    }

    init() {
        if (typeof document === 'undefined') {
            return;
        }

        // Crear contenedor si no existe
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms
     */
    showError(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    /**
     * Muestra un mensaje de éxito
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms
     */
    showSuccess(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    /**
     * Muestra un mensaje de información
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms
     */
    showInfo(message, duration = 3000) {
        this.show(message, 'info', duration);
    }

    /**
     * Muestra un toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo (error, success, info)
     * @param {number} duration - Duración en ms
     */
    show(message, type = 'info', duration = 3000) {
        if (typeof document === 'undefined') {
            return;
        }
        if (!this.container) {
            this.init();
        }

        const toast = document.createElement('div');

        // Estilos base
        let bgColor = '#333';
        const color = '#fff';
        let icon = 'ℹ️';

        if (type === 'error') {
            bgColor = '#dc3545';
            icon = '⚠️';
        } else if (type === 'success') {
            bgColor = '#28a745';
            icon = '✅';
        }

        toast.style.cssText = `
            background-color: ${bgColor};
            color: ${color};
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            max-width: 300px;
            word-break: break-word;
        `;

        toast.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remover después de la duración
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';

            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }
}

export const toastService = new ToastService();
