/**
 * Aplicación Principal de Invitación de Boda
 * Nueva arquitectura con Clean Architecture
 * 
 * Este archivo reemplazará app.js una vez completada la migración
 */

import { AppController } from './frontend/js/presentation/controllers/app-controller.js';
import { APP_CONFIG } from './frontend/js/config/app-config.js';

/**
 * Clase principal de la aplicación
 */
class WeddingInvitationApp {
    constructor() {
        this.appController = null;
        this.isInitialized = false;
        this.config = APP_CONFIG;
    }
    
    /**
     * Inicializa la aplicación
     */
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }
        
        try {
            console.log('🎉 Starting Wedding Invitation App...');
            console.log('📋 Config:', this.config);
            
            // Crear y configurar el controlador principal
            this.appController = new AppController(document.body, {
                enableErrorHandling: this.config.enableErrorHandling,
                enablePerformanceMonitoring: this.config.enablePerformanceMonitoring,
                enableDebugMode: this.config.enableDebugMode
            });
            
            // Inicializar la aplicación
            await this.appController.init();
            
            // Configurar eventos globales de la aplicación
            this.setupAppEvents();
            
            this.isInitialized = true;
            
            console.log('🎊 Wedding Invitation App started successfully!');
            
        } catch (error) {
            console.error('💥 Failed to start Wedding Invitation App:', error);
            this.handleStartupError(error);
        }
    }
    
    /**
     * Configura eventos globales de la aplicación
     */
    setupAppEvents() {
        // Evento cuando la app está lista
        this.appController.on('app:ready', (data) => {
            console.log('✨ App is ready!', data);
            this.onAppReady(data);
        });
        
        // Evento de error de la aplicación
        this.appController.on('app:error', (data) => {
            console.error('❌ App error:', data);
            this.onAppError(data);
        });
        
        // Evento cuando se carga una invitación
        this.appController.on('app:invitation-loaded', (data) => {
            console.log('📨 Invitation loaded:', data);
            this.onInvitationLoaded(data);
        });
        
        // Evento cuando se envía un RSVP
        this.appController.on('app:rsvp-submitted', (data) => {
            console.log('✅ RSVP submitted:', data);
            this.onRSVPSubmitted(data);
        });
        
        // Evento de cambio de sección
        this.appController.on('app:section-changed', (data) => {
            console.log('📍 Section changed:', data);
            this.onSectionChanged(data);
        });
    }
    
    /**
     * Maneja cuando la app está lista
     * @param {Object} data - Datos del evento
     */
    onAppReady(data) {
        // Remover cualquier loader de página
        const pageLoader = document.querySelector('.page-loader');
        if (pageLoader) {
            pageLoader.classList.add('fade-out');
            setTimeout(() => pageLoader.remove(), 500);
        }
        
        // Añadir clase al body para indicar que la app está lista
        document.body.classList.add('app-ready');
        
        // Mostrar métricas de rendimiento si está habilitado
        if (this.config.enablePerformanceMonitoring && data.loadTime) {
            console.log(`⚡ App loaded in ${data.loadTime.toFixed(2)}ms`);
        }
        
        // Trigger de animaciones de entrada si es necesario
        this.triggerEntryAnimations();
    }
    
    /**
     * Maneja errores de la aplicación
     * @param {Object} data - Datos del error
     */
    onAppError(data) {
        // Log del error
        console.error('App Error:', data.error);
        
        // Mostrar notificación de error al usuario si es necesario
        if (data.error && !data.error.silent) {
            this.showErrorNotification(data.error.message || 'Ha ocurrido un error');
        }
    }
    
    /**
     * Maneja cuando se carga una invitación
     * @param {Object} data - Datos de la invitación
     */
    onInvitationLoaded(data) {
        const invitation = data.invitation;
        
        // Actualizar título de la página
        if (invitation.guestName) {
            document.title = `Invitación de Boda - ${invitation.guestName}`;
        }
        
        // Personalizar contenido si es necesario
        this.personalizeContent(invitation);
    }
    
    /**
     * Maneja cuando se envía un RSVP
     * @param {Object} data - Datos del RSVP
     */
    onRSVPSubmitted(data) {
        // Mostrar mensaje de éxito
        this.showSuccessNotification('¡Confirmación enviada exitosamente!');
        
        // Opcional: redirigir a sección de agradecimiento
        setTimeout(() => {
            this.appController.navigateToSection('gracias');
        }, 2000);
    }
    
    /**
     * Maneja cambios de sección
     * @param {Object} data - Datos del cambio de sección
     */
    onSectionChanged(data) {
        // Actualizar clases del body para estilos específicos de sección
        document.body.className = document.body.className
            .replace(/section-\w+/g, '')
            .trim();
        
        if (data.current) {
            document.body.classList.add(`section-${data.current}`);
        }
        
        // Analytics tracking si está configurado
        if (this.config.analytics && this.config.analytics.enabled) {
            this.trackSectionView(data.current);
        }
    }
    
    /**
     * Personaliza el contenido basado en la invitación
     * @param {Object} invitation - Datos de la invitación
     */
    personalizeContent(invitation) {
        // Personalizar saludo
        const greetingElements = document.querySelectorAll('[data-greeting]');
        greetingElements.forEach(element => {
            if (invitation.guestName) {
                element.textContent = `¡Hola ${invitation.guestName}!`;
            }
        });
        
        // Personalizar otros elementos según sea necesario
        if (invitation.specialMessage) {
            const messageElements = document.querySelectorAll('[data-special-message]');
            messageElements.forEach(element => {
                element.textContent = invitation.specialMessage;
                element.style.display = 'block';
            });
        }
    }
    
    /**
     * Activa animaciones de entrada
     */
    triggerEntryAnimations() {
        // Añadir clase para activar animaciones CSS
        document.body.classList.add('animations-ready');
        
        // Animar elementos con data-animate
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('animate-in');
            }, index * 100); // Stagger animation
        });
    }
    
    /**
     * Muestra una notificación de error
     * @param {string} message - Mensaje de error
     */
    showErrorNotification(message) {
        // Crear notificación simple
        const notification = document.createElement('div');
        notification.className = 'notification notification-error';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⚠️</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove después de 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    /**
     * Muestra una notificación de éxito
     * @param {string} message - Mensaje de éxito
     */
    showSuccessNotification(message) {
        // Crear notificación simple
        const notification = document.createElement('div');
        notification.className = 'notification notification-success';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✅</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove después de 3 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
    
    /**
     * Tracking de analytics para cambio de sección
     * @param {string} section - Sección actual
     */
    trackSectionView(section) {
        // Implementar tracking según el proveedor de analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: `Section: ${section}`,
                page_location: `${window.location.origin}${window.location.pathname}#${section}`
            });
        }
        
        // O Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'ViewContent', {
                content_name: `Section: ${section}`
            });
        }
    }
    
    /**
     * Maneja errores de inicio
     * @param {Error} error - Error ocurrido
     */
    handleStartupError(error) {
        // Mostrar mensaje de error de fallback
        const errorContainer = document.createElement('div');
        errorContainer.className = 'startup-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h2>😔 Oops! Algo salió mal</h2>
                <p>No pudimos cargar la invitación correctamente.</p>
                <p>Por favor, recarga la página o inténtalo más tarde.</p>
                <button onclick="window.location.reload()" class="retry-button">
                    🔄 Reintentar
                </button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
        
        // Log del error para debugging
        console.error('Startup Error Details:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }
    
    /**
     * Obtiene el controlador de la aplicación
     * @returns {AppController}
     */
    getAppController() {
        return this.appController;
    }
    
    /**
     * Verifica si la aplicación está inicializada
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized && this.appController && this.appController.isInitialized;
    }
    
    /**
     * Destruye la aplicación
     */
    async destroy() {
        if (this.appController) {
            await this.appController.destroy();
            this.appController = null;
        }
        
        this.isInitialized = false;
        
        console.log('👋 Wedding Invitation App destroyed');
    }
}

// Crear instancia global de la aplicación
const weddingApp = new WeddingInvitationApp();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        weddingApp.init();
    });
} else {
    // DOM ya está listo
    weddingApp.init();
}

// Exportar para uso global
window.WeddingApp = weddingApp;

// Exportar para módulos ES6
export default weddingApp;
export { WeddingInvitationApp };
