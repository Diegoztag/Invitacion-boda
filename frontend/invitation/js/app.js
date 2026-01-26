/**
 * Punto de entrada principal de la aplicación
 * Utiliza Clean Architecture con Dependency Injection
 */

// Importar el controlador principal
import { AppController } from './presentation/controllers/app-controller.js';

/**
 * Inicialización de la aplicación
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Crear instancia del controlador principal
        const appController = new AppController(document.body, {
            enableDebugMode: false, // Cambiar a true para debugging
            enablePerformanceMonitoring: true
        });

        // Inicializar la aplicación
        await appController.init();

        // Log de éxito (solo en desarrollo)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('✅ Aplicación inicializada correctamente con Clean Architecture');
            console.log('🏗️ Arquitectura: Clean Architecture + Dependency Injection');
            console.log('📊 Módulos cargados:', appController.getLoadedModules?.() || 'N/A');
        }

    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
        
        // Mostrar mensaje de error al usuario
        showErrorMessage();
    }
});

/**
 * Mostrar mensaje de error al usuario
 */
function showErrorMessage() {
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
    
    errorDiv.innerHTML = `
        <h3>⚠️ Error de Carga</h3>
        <p>Hubo un problema al cargar la aplicación.</p>
        <p>Por favor, recarga la página o contacta al administrador.</p>
        <button onclick="window.location.reload()" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        ">Recargar Página</button>
    `;
    
    document.body.appendChild(errorDiv);
}

/**
 * Manejo global de errores no capturados
 */
window.addEventListener('error', (event) => {
    console.error('❌ Error global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rechazada no manejada:', event.reason);
});
