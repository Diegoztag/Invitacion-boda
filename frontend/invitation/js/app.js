/**
 * Punto de entrada principal de la aplicación
 * Utiliza Clean Architecture con Dependency Injection
 */

// Importar el controlador principal
import { AppController } from './presentation/controllers/app-controller.js';
import { eventBus } from './shared/utils/event-bus.js';
import { eventLogger } from './shared/utils/event-logger.js';

/**
 * Inicialización de la aplicación
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Middleware de Event Bus
        eventBus.use(eventLogger);

        // Crear instancia del controlador principal
        const appController = new AppController(document.body, {
            enableDebugMode: false, // Cambiar a true para debugging
            enablePerformanceMonitoring: true
        });

        // Inicializar la aplicación
        await appController.init();

        // Registrar Service Worker para soporte offline
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registrado con éxito:', registration.scope);
            } catch (error) {
                console.error('Error al registrar el ServiceWorker:', error);
            }
        }

        // Log de éxito (solo en desarrollo)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            //
        }
    } catch {
        // Mostrar mensaje de error al usuario
        showErrorMessage();
    }
});

/**
 * Mostrar mensaje de error al usuario
 */
function showErrorMessage() {
    const errorDiv = createErrorContainer();
    const errorContent = createErrorContent();
    errorDiv.appendChild(errorContent);
    document.body.appendChild(errorDiv);
}

/**
 * Crea el contenedor del mensaje de error
 * @returns {HTMLElement}
 */
function createErrorContainer() {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f8d7da;
        color: #721c24;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #f5c6cb;
        z-index: 9999;
        text-align: center;
        font-family: Arial, sans-serif;
    `;
    return errorDiv;
}

/**
 * Crea el contenido del mensaje de error
 * @returns {HTMLElement}
 */
function createErrorContent() {
    const content = document.createElement('div');
    content.innerHTML = `
        <h3>⚠️ Error de Carga</h3>
        <p>Hubo un problema al cargar la aplicación.</p>
        <p>Por favor, recarga la página o contacta al administrador.</p>
    `;
    const button = createReloadButton();
    content.appendChild(button);
    return content;
}

/**
 * Crea el botón de recarga
 * @returns {HTMLButtonElement}
 */
function createReloadButton() {
    const button = document.createElement('button');
    button.textContent = 'Recargar Página';
    button.style.cssText = `
        background: #dc3545;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
    `;
    button.onclick = () => window.location.reload();
    return button;
}

/**
 * Manejo global de errores no capturados
 */
window.addEventListener('error', () => {
    //
});

window.addEventListener('unhandledrejection', () => {
    //
});
