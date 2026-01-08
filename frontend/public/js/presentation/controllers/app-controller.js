/**
 * Controlador Principal de la Aplicación
 * Orquesta todos los componentes y servicios de la aplicación
 */

import { DIContainer } from '../../config/di-container.js';
import { EVENTS } from '../../shared/constants/events.js';
import { SELECTORS } from '../../shared/constants/selectors.js';
import { DOMUtils } from '../../shared/utils/dom-utils.js';

export class AppController {
    constructor(container, options = {}) {
        this.container = container || document.body;
        this.options = {
            autoInit: true,
            enableErrorHandling: true,
            enablePerformanceMonitoring: false,
            enableDebugMode: false,
            ...options
        };
        
        // Servicios principales
        this.diContainer = null;
        this.invitationService = null;
        this.metaService = null;
        this.validationService = null;
        this.configurationService = null;
        
        // Controladores
        this.navigationController = null;
        this.contentController = null;
        this.rsvpController = null;
        this.carouselController = null;
        
        // Componentes UI
        this.components = new Map();
        
        // Estado de la aplicación
        this.isInitialized = false;
        this.isLoading = false;
        this.currentInvitation = null;
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Performance monitoring
        this.performanceMetrics = {
            initStartTime: null,
            initEndTime: null,
            loadTime: null
        };
    }
    
    /**
     * Inicializa la aplicación
     */
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }
        
        console.log('🚀 Initializing Wedding Invitation App...');
        
        if (this.options.enablePerformanceMonitoring) {
            this.performanceMetrics.initStartTime = performance.now();
        }
        
        try {
            this.isLoading = true;
            
            // 1. Configurar manejo de errores
            if (this.options.enableErrorHandling) {
                this.setupErrorHandling();
            }
            
            // 2. Inicializar DI Container y servicios
            await this.initializeServices();
            
            // 3. Inicializar componentes UI base
            await this.initializeBaseComponents();
            
            // 4. Inicializar controladores
            await this.initializeControllers();
            
            // 5. Configurar event listeners globales
            this.setupGlobalEventListeners();
            
            // 6. Cargar datos iniciales
            await this.loadInitialData();
            
            // 7. Finalizar inicialización
            this.finalizeInitialization();
            
            this.isInitialized = true;
            this.isLoading = false;
            
            console.log('✅ Wedding Invitation App initialized successfully');
            
            // Emitir evento de aplicación lista
            this.emit(EVENTS.APP.READY, {
                loadTime: this.performanceMetrics.loadTime,
                components: Array.from(this.components.keys())
            });
            
        } catch (error) {
            this.isLoading = false;
            console.error('❌ Failed to initialize app:', error);
            this.handleInitializationError(error);
            throw error;
        }
    }
    
    /**
     * Inicializa servicios principales
     */
    async initializeServices() {
        console.log('🔧 Initializing services...');
        
        // Inicializar DI Container
        this.diContainer = DIContainer.getInstance();
        await this.diContainer.init();
        
        // Obtener servicios del container
        this.configurationService = await this.diContainer.get('configurationService');
        this.invitationService = await this.diContainer.get('invitationService');
        this.metaService = await this.diContainer.get('metaService');
        this.validationService = await this.diContainer.get('validationService');
        this.sectionGeneratorService = await this.diContainer.get('sectionGeneratorService');
        
        // Generar secciones habilitadas según configuración
        this.sectionGeneratorService.generateEnabledSections();
        
        console.log('✅ Services initialized');
    }
    
    /**
     * Inicializa componentes UI base
     */
    async initializeBaseComponents() {
        console.log('🎨 Initializing base UI components...');
        
        // Countdown Component
        const countdownElements = this.container.querySelectorAll('[data-countdown]');
        for (const element of countdownElements) {
            try {
                const { CountdownComponent } = await import('../components/ui/countdown.js');
                const targetDate = element.getAttribute('data-countdown');
                const countdown = new CountdownComponent(element, targetDate);
                await countdown.init();
                this.components.set(`countdown-${element.id || Date.now()}`, countdown);
            } catch (error) {
                console.warn('Could not initialize countdown component:', error);
            }
        }
        
        // Modal Components
        const modalElements = this.container.querySelectorAll('[data-modal]');
        for (const element of modalElements) {
            try {
                const { ModalComponent } = await import('../components/ui/modal.js');
                const modal = new ModalComponent(element);
                await modal.init();
                this.components.set(`modal-${element.id || Date.now()}`, modal);
            } catch (error) {
                console.warn('Could not initialize modal component:', error);
            }
        }
        
        // Mobile Menu Component
        try {
            const { MobileMenuComponent } = await import('../components/ui/mobile-menu.js');
            const mobileMenu = new MobileMenuComponent();
            mobileMenu.init();
            this.components.set('mobile-menu', mobileMenu);
        } catch (error) {
            console.warn('Could not initialize mobile menu component:', error);
        }
        
        // Loader Components
        const loaderElements = this.container.querySelectorAll('[data-loader]');
        for (const element of loaderElements) {
            try {
                const { LoaderComponent } = await import('../components/ui/loader.js');
                const loader = new LoaderComponent(element);
                await loader.init();
                this.components.set(`loader-${element.id || Date.now()}`, loader);
            } catch (error) {
                console.warn('Could not initialize loader component:', error);
            }
        }
        
        console.log(`✅ Initialized ${this.components.size} base components`);
    }
    
    /**
     * Inicializa controladores principales
     */
    async initializeControllers() {
        console.log('🎮 Initializing controllers...');
        
        // Navigation Controller
        try {
            const { NavigationController } = await import('./navigation-controller.js');
            this.navigationController = new NavigationController(this.container, {
                smoothScroll: true,
                updateUrl: true,
                highlightActiveSection: true
            });
            await this.navigationController.init();
        } catch (error) {
            console.warn('Could not initialize navigation controller:', error);
        }
        
        // Content Controller
        try {
            const { ContentController } = await import('./content-controller.js');
            this.contentController = new ContentController(
                this.container, 
                this.metaService,
                {
                    autoUpdateMeta: true,
                    enableAnimations: true
                }
            );
            await this.contentController.init();
        } catch (error) {
            console.warn('Could not initialize content controller:', error);
        }
        
        // RSVP Controller
        const rsvpContainer = this.container.querySelector('[data-rsvp-container]') || 
                             this.container.querySelector('#rsvp');
        if (rsvpContainer) {
            try {
                const { RSVPController } = await import('./rsvp-controller.js');
                this.rsvpController = new RSVPController(
                    rsvpContainer,
                    this.invitationService,
                    this.validationService,
                    {
                        autoSave: true,
                        showConfirmation: true,
                        enableValidation: true
                    }
                );
                await this.rsvpController.init();
            } catch (error) {
                console.warn('Could not initialize RSVP controller:', error);
            }
        }
        
        // Carousel Controllers
        const carouselElements = this.container.querySelectorAll('[data-carousel]');
        for (const element of carouselElements) {
            try {
                const { CarouselController } = await import('./carousel-controller.js');
                
                // Obtener configuración del carrusel desde WEDDING_CONFIG
                const config = this.configurationService?.getConfig() || {};
                const carouselConfig = config.carouselSection?.carousel || {};
                
                const carousel = new CarouselController(element, {
                    autoPlay: carouselConfig.enableAutoPlay !== false,
                    autoPlayInterval: carouselConfig.autoPlayDelay || 5000,
                    loop: true,
                    showDots: carouselConfig.showIndicators !== false,
                    showArrows: carouselConfig.showNavigationButtons !== false,
                    swipeEnabled: carouselConfig.enableSwipe !== false,
                    keyboardEnabled: carouselConfig.enableKeyboard !== false
                });
                await carousel.init();
                this.components.set(`carousel-${element.id || Date.now()}`, carousel);
            } catch (error) {
                console.warn('Could not initialize carousel controller:', error);
            }
        }
        
        console.log('✅ Controllers initialized');
    }
    
    /**
     * Configura event listeners globales
     */
    setupGlobalEventListeners() {
        console.log('🔗 Setting up global event listeners...');
        
        // Error handling
        const errorHandler = (event) => {
            this.handleGlobalError(event.error || event.reason, event);
        };
        
        window.addEventListener('error', errorHandler);
        window.addEventListener('unhandledrejection', errorHandler);
        
        this.eventListeners.set('global-error', {
            element: window,
            event: 'error',
            handler: errorHandler
        });
        
        // Resize handling
        const resizeHandler = () => {
            this.handleWindowResize();
        };
        
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.set('resize', {
            element: window,
            event: 'resize',
            handler: resizeHandler
        });
        
        // Visibility change
        const visibilityHandler = () => {
            this.handleVisibilityChange();
        };
        
        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.set('visibility', {
            element: document,
            event: 'visibilitychange',
            handler: visibilityHandler
        });
        
        // Navigation events
        if (this.navigationController) {
            this.navigationController.on(EVENTS.NAVIGATION.SECTION_CHANGED, (data) => {
                this.handleSectionChange(data);
            });
        }
        
        // RSVP events
        if (this.rsvpController) {
            this.rsvpController.on(EVENTS.RSVP.SUBMITTED, (data) => {
                this.handleRSVPSubmitted(data);
            });
            
            this.rsvpController.on(EVENTS.RSVP.INVITATION_LOADED, (data) => {
                this.handleInvitationLoaded(data);
            });
        }
        
        console.log('✅ Global event listeners configured');
    }
    
    /**
     * Carga datos iniciales de la aplicación
     */
    async loadInitialData() {
        console.log('📊 Loading initial data...');
        
        try {
            // Cargar configuración de meta tags
            if (this.metaService) {
                await this.metaService.loadDefaultMeta();
            }
            
            // Cargar datos de invitación si hay ID en URL
            const urlParams = new URLSearchParams(window.location.search);
            const invitationId = urlParams.get('id') || urlParams.get('invitation');
            
            if (invitationId && this.invitationService) {
                try {
                    this.currentInvitation = await this.invitationService.getInvitation(invitationId);
                    if (this.currentInvitation) {
                        this.emit(EVENTS.APP.INVITATION_LOADED, {
                            invitation: this.currentInvitation
                        });
                    }
                } catch (error) {
                    console.warn('Could not load invitation:', error);
                }
            }
            
        } catch (error) {
            console.warn('Error loading initial data:', error);
        }
        
        console.log('✅ Initial data loaded');
    }
    
    /**
     * Finaliza la inicialización
     */
    finalizeInitialization() {
        if (this.options.enablePerformanceMonitoring) {
            this.performanceMetrics.initEndTime = performance.now();
            this.performanceMetrics.loadTime = 
                this.performanceMetrics.initEndTime - this.performanceMetrics.initStartTime;
            
            console.log(`⏱️ App initialization took ${this.performanceMetrics.loadTime.toFixed(2)}ms`);
        }
        
        // Remover loader de página si existe
        this.hideLoader();
        
        // Añadir clase de app inicializada
        document.body.classList.add('app-initialized');
        
        // Debug mode
        if (this.options.enableDebugMode) {
            window.WeddingApp = this;
            console.log('🐛 Debug mode enabled. App available as window.WeddingApp');
        }
    }
    
    /**
     * Oculta el loader de la página
     */
    hideLoader() {
        const loaders = [
            document.querySelector('.page-loader'),
            document.querySelector('#page-loader'),
            document.querySelector('#loader'),
            document.querySelector('.loader')
        ];
        
        loaders.forEach(loader => {
            if (loader) {
                loader.style.opacity = '0';
                loader.style.transition = 'opacity 0.5s ease-out';
                
                setTimeout(() => {
                    loader.style.display = 'none';
                    if (loader.parentElement) {
                        loader.remove();
                    }
                }, 500);
            }
        });
        
        console.log('🎭 Loader hidden');
    }
    
    /**
     * Configura manejo de errores
     */
    setupErrorHandling() {
        // Configurar manejo de errores personalizado
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason);
        });
    }
    
    /**
     * Maneja errores de inicialización
     * @param {Error} error - Error ocurrido
     */
    handleInitializationError(error) {
        console.error('App initialization failed:', error);
        
        // Mostrar mensaje de error al usuario
        const errorMessage = document.createElement('div');
        errorMessage.className = 'app-error-message';
        errorMessage.innerHTML = `
            <h3>Error al cargar la aplicación</h3>
            <p>Ha ocurrido un error al inicializar la aplicación. Por favor, recarga la página.</p>
            <button onclick="window.location.reload()">Recargar página</button>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Emitir evento de error
        this.emit(EVENTS.APP.ERROR, { error, phase: 'initialization' });
    }
    
    /**
     * Maneja errores globales
     * @param {Error} error - Error ocurrido
     * @param {Event} event - Evento de error
     */
    handleGlobalError(error, event) {
        this.logError('Global Error', error, { event });
        
        // Emitir evento de error
        this.emit(EVENTS.APP.ERROR, { error, event });
    }
    
    /**
     * Registra un error
     * @param {string} type - Tipo de error
     * @param {Error} error - Error
     * @param {Object} context - Contexto adicional
     */
    logError(type, error, context = {}) {
        const errorInfo = {
            type,
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...context
        };
        
        console.error(`[${type}]`, errorInfo);
        
        // Aquí se podría enviar a un servicio de logging externo
        // this.sendErrorToService(errorInfo);
    }
    
    /**
     * Maneja cambios de sección
     * @param {Object} data - Datos del cambio de sección
     */
    handleSectionChange(data) {
        console.log(`📍 Section changed: ${data.previous} → ${data.current}`);
        
        // Actualizar meta tags según la sección
        if (this.metaService) {
            this.metaService.updateForSection(data.current);
        }
        
        // Emitir evento de aplicación
        this.emit(EVENTS.APP.SECTION_CHANGED, data);
    }
    
    /**
     * Maneja envío de RSVP
     * @param {Object} data - Datos del RSVP
     */
    handleRSVPSubmitted(data) {
        console.log('✅ RSVP submitted successfully');
        
        // Actualizar estado de la aplicación
        if (data.result && data.result.invitation) {
            this.currentInvitation = data.result.invitation;
        }
        
        // Emitir evento de aplicación
        this.emit(EVENTS.APP.RSVP_SUBMITTED, data);
    }
    
    /**
     * Maneja carga de invitación
     * @param {Object} data - Datos de la invitación
     */
    handleInvitationLoaded(data) {
        console.log('📨 Invitation loaded');
        
        this.currentInvitation = data.invitation;
        
        // Actualizar contenido dinámico si existe el controlador
        if (this.contentController) {
            this.contentController.updateMultipleContent({
                guestName: data.invitation.guestName,
                eventDate: data.invitation.eventDate,
                venue: data.invitation.venue
            });
        }
        
        // Emitir evento de aplicación
        this.emit(EVENTS.APP.INVITATION_LOADED, data);
    }
    
    /**
     * Maneja cambios de tamaño de ventana
     */
    handleWindowResize() {
        // Notificar a componentes que manejan resize
        this.components.forEach((component) => {
            if (component.handleResize) {
                component.handleResize();
            }
        });
        
        // Emitir evento de resize
        this.emit(EVENTS.APP.WINDOW_RESIZED, {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }
    
    /**
     * Maneja cambios de visibilidad de la página
     */
    handleVisibilityChange() {
        const isHidden = document.hidden;
        
        // Pausar/reanudar componentes según visibilidad
        this.components.forEach((component) => {
            if (isHidden && component.pause) {
                component.pause();
            } else if (!isHidden && component.resume) {
                component.resume();
            }
        });
        
        // Emitir evento de visibilidad
        this.emit(EVENTS.APP.VISIBILITY_CHANGED, { hidden: isHidden });
    }
    
    /**
     * Obtiene un componente por ID
     * @param {string} id - ID del componente
     * @returns {Object|null}
     */
    getComponent(id) {
        return this.components.get(id) || null;
    }
    
    /**
     * Obtiene un controlador específico
     * @param {string} name - Nombre del controlador
     * @returns {Object|null}
     */
    getController(name) {
        switch (name) {
            case 'navigation':
                return this.navigationController;
            case 'content':
                return this.contentController;
            case 'rsvp':
                return this.rsvpController;
            case 'carousel':
                return this.carouselController;
            default:
                return null;
        }
    }
    
    /**
     * Obtiene un servicio específico
     * @param {string} name - Nombre del servicio
     * @returns {Object|null}
     */
    getService(name) {
        if (this.diContainer) {
            return this.diContainer.get(name);
        }
        return null;
    }
    
    /**
     * Obtiene el estado actual de la aplicación
     * @returns {Object}
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            isLoading: this.isLoading,
            currentInvitation: this.currentInvitation,
            components: Array.from(this.components.keys()),
            controllers: {
                navigation: !!this.navigationController,
                content: !!this.contentController,
                rsvp: !!this.rsvpController,
                carousel: !!this.carouselController
            },
            performanceMetrics: { ...this.performanceMetrics }
        };
    }
    
    /**
     * Navega a una sección específica
     * @param {string} sectionId - ID de la sección
     */
    navigateToSection(sectionId) {
        if (this.navigationController) {
            this.navigationController.navigateToSection(sectionId);
        }
    }
    
    /**
     * Muestra un modal
     * @param {string} modalId - ID del modal
     * @param {Object} options - Opciones del modal
     */
    showModal(modalId, options = {}) {
        const modal = this.getComponent(`modal-${modalId}`);
        if (modal && modal.show) {
            modal.show(options);
        }
    }
    
    /**
     * Oculta un modal
     * @param {string} modalId - ID del modal
     */
    hideModal(modalId) {
        const modal = this.getComponent(`modal-${modalId}`);
        if (modal && modal.hide) {
            modal.hide();
        }
    }
    
    /**
     * Registra un listener para eventos de la aplicación
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    on(event, callback) {
        if (!this.eventListeners.has(`custom-${event}`)) {
            this.eventListeners.set(`custom-${event}`, []);
        }
        this.eventListeners.get(`custom-${event}`).push(callback);
    }
    
    /**
     * Remueve un listener de eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    off(event, callback) {
        const listeners = this.eventListeners.get(`custom-${event}`);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emite un evento de la aplicación
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos del evento
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(`custom-${event}`);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in app event listener for ${event}:`, error);
                }
            });
        }
        
        // También emitir en el contenedor como evento DOM
        if (this.container) {
            const customEvent = new CustomEvent(event, { detail: data });
            this.container.dispatchEvent(customEvent);
        }
    }
    
    /**
     * Reinicia la aplicación
     */
    async restart() {
        console.log('🔄 Restarting application...');
        
        await this.destroy();
        await this.init();
        
        console.log('✅ Application restarted');
    }
    
    /**
     * Destruye la aplicación y limpia recursos
     */
    async destroy() {
        console.log('🗑️ Destroying application...');
        
        // Destruir controladores
        if (this.navigationController) {
            this.navigationController.destroy();
            this.navigationController = null;
        }
        
        if (this.contentController) {
            this.contentController.destroy();
            this.contentController = null;
        }
        
        if (this.rsvpController) {
            this.rsvpController.destroy();
            this.rsvpController = null;
        }
        
        if (this.carouselController) {
            this.carouselController.destroy();
            this.carouselController = null;
        }
        
        // Destruir componentes
        this.components.forEach((component) => {
            if (component.destroy) {
                component.destroy();
            }
        });
        this.components.clear();
        
        // Remover event listeners
        this.eventListeners.forEach((listener, key) => {
            if (listener.element && listener.handler) {
                listener.element.removeEventListener(listener.event, listener.handler);
            }
        });
        this.eventListeners.clear();
        
        // Limpiar referencias
        this.diContainer = null;
        this.invitationService = null;
        this.metaService = null;
        this.validationService = null;
        this.currentInvitation = null;
        
        // Remover clase de app inicializada
        document.body.classList.remove('app-initialized');
        
        this.isInitialized = false;
        this.isLoading = false;
        
        console.log('✅ Application destroyed');
    }
}
