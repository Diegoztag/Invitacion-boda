/**
 * AppController Simplificado para Testing
 * Versión básica sin dependencias complejas para verificar la arquitectura
 */

import { Component } from '../../shared/base/component.js';
import { EVENTS } from '../../shared/constants/events.js';

export class AppControllerSimple extends Component {
    constructor(container, options = {}) {
        super(container);
        
        this.options = {
            enableErrorHandling: true,
            enablePerformanceMonitoring: false,
            enableDebugMode: true,
            ...options
        };
        
        this.isInitialized = false;
        this.startTime = performance.now();
        
        console.log('🎯 AppControllerSimple created');
    }
    
    /**
     * Inicializa el controlador de aplicación
     */
    async init() {
        if (this.isInitialized) {
            console.warn('AppController already initialized');
            return;
        }
        
        try {
            console.log('🚀 Initializing AppControllerSimple...');
            
            // Configurar manejo de errores
            if (this.options.enableErrorHandling) {
                this.setupErrorHandling();
            }
            
            // Inicializar componentes básicos
            await this.initializeBasicComponents();
            
            // Configurar eventos
            this.setupEvents();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            // Calcular tiempo de carga
            const loadTime = performance.now() - this.startTime;
            
            console.log('✅ AppControllerSimple initialized successfully');
            
            // Emitir evento de app lista
            this.emit(EVENTS.APP.READY, {
                loadTime,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize AppControllerSimple:', error);
            this.emit(EVENTS.APP.ERROR, { error });
            throw error;
        }
    }
    
    /**
     * Inicializa componentes básicos
     */
    async initializeBasicComponents() {
        console.log('🔧 Initializing basic components...');
        
        // Verificar elementos básicos del DOM
        this.checkRequiredElements();
        
        // Configurar navegación básica
        this.setupBasicNavigation();
        
        // Configurar formulario RSVP básico
        this.setupBasicRSVP();
        
        console.log('✅ Basic components initialized');
    }
    
    /**
     * Verifica que los elementos requeridos estén en el DOM
     */
    checkRequiredElements() {
        const requiredElements = [
            'nav',
            '#inicio',
            '#rsvp-form'
        ];
        
        const missingElements = requiredElements.filter(selector => {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Required element not found: ${selector}`);
                return true;
            }
            return false;
        });
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Some required elements are missing:', missingElements);
        } else {
            console.log('✅ All required elements found');
        }
    }
    
    /**
     * Configura navegación básica
     */
    setupBasicNavigation() {
        const navLinks = document.querySelectorAll('nav a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.navigateToSection(targetId);
            });
        });
        
        console.log(`📍 Navigation setup for ${navLinks.length} links`);
    }
    
    /**
     * Configura RSVP básico
     */
    setupBasicRSVP() {
        const rsvpForm = document.getElementById('rsvp-form');
        
        if (rsvpForm) {
            rsvpForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBasicRSVP(e);
            });
            
            console.log('📝 Basic RSVP form setup');
        }
    }
    
    /**
     * Navega a una sección
     */
    navigateToSection(sectionId) {
        const targetElement = document.getElementById(sectionId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Emitir evento de cambio de sección
            this.emit(EVENTS.APP.SECTION_CHANGED, {
                previous: this.currentSection,
                current: sectionId
            });
            
            this.currentSection = sectionId;
            
            console.log(`📍 Navigated to section: ${sectionId}`);
        } else {
            console.warn(`⚠️ Section not found: ${sectionId}`);
        }
    }
    
    /**
     * Maneja envío básico de RSVP
     */
    handleBasicRSVP(event) {
        const formData = new FormData(event.target);
        const rsvpData = Object.fromEntries(formData.entries());
        
        console.log('📝 RSVP Data:', rsvpData);
        
        // Simular envío exitoso
        setTimeout(() => {
            this.emit(EVENTS.APP.RSVP_SUBMITTED, {
                data: rsvpData,
                timestamp: new Date().toISOString()
            });
            
            // Mostrar mensaje de éxito
            this.showSuccessMessage('¡Confirmación enviada exitosamente!');
        }, 1000);
    }
    
    /**
     * Muestra mensaje de éxito
     */
    showSuccessMessage(message) {
        // Crear notificación simple
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove después de 3 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
    
    /**
     * Configura manejo de errores globales
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('💥 Global error:', event.error);
            this.emit(EVENTS.APP.ERROR, {
                error: event.error,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('💥 Unhandled promise rejection:', event.reason);
            this.emit(EVENTS.APP.ERROR, {
                error: event.reason,
                type: 'unhandledrejection'
            });
        });
        
        console.log('🛡️ Error handling setup');
    }
    
    /**
     * Configura eventos del controlador
     */
    setupEvents() {
        // Evento cuando la app está lista
        this.on(EVENTS.APP.READY, (data) => {
            console.log('✨ App is ready!', data);
            document.body.classList.add('app-ready');
            
            // Ocultar el loader
            this.hideLoader();
        });
        
        // Evento de error
        this.on(EVENTS.APP.ERROR, (data) => {
            console.error('❌ App error:', data);
        });
        
        // Evento de RSVP enviado
        this.on(EVENTS.APP.RSVP_SUBMITTED, (data) => {
            console.log('✅ RSVP submitted:', data);
        });
        
        // Evento de cambio de sección
        this.on(EVENTS.APP.SECTION_CHANGED, (data) => {
            console.log('📍 Section changed:', data);
            
            // Actualizar clases del body
            document.body.className = document.body.className
                .replace(/section-\w+/g, '')
                .trim();
            
            if (data.current) {
                document.body.classList.add(`section-${data.current}`);
            }
        });
        
        console.log('📡 Events setup');
    }
    
    /**
     * Destruye el controlador
     */
    async destroy() {
        console.log('🧹 Destroying AppControllerSimple...');
        
        // Limpiar event listeners
        this.removeAllListeners();
        
        // Marcar como no inicializado
        this.isInitialized = false;
        
        console.log('👋 AppControllerSimple destroyed');
    }
    
    /**
     * Oculta el loader de la página
     */
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.5s ease-out';
            
            setTimeout(() => {
                loader.style.display = 'none';
                loader.remove();
            }, 500);
            
            console.log('🎭 Loader hidden');
        }
    }
    
    /**
     * Verifica si está inicializado
     */
    isReady() {
        return this.isInitialized;
    }
}
