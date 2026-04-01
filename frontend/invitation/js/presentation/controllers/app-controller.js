/**
 * Controlador Principal de la Aplicación
 * Orquesta todos los componentes y servicios de la aplicación
 */

import { DIContainer } from '../../config/di-container.js';
import { EVENTS } from '../../shared/constants/events.js';
import { ComponentFactory } from '../components/component-factory.js';
import { ControllerFactory } from './controller-factory.js';

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
        this.scrollAnimationController = null;

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
            return;
        }

        if (this.options.enablePerformanceMonitoring) {
            this.performanceMetrics.initStartTime = performance.now();
        }

        try {
            this.isLoading = true;

            // 1. Configurar manejo de errores
            if (this.options.enableErrorHandling) {
                this._setupErrorHandling();
            }

            // 2. Inicializar DI Container y servicios
            await this._initializeServices();

            // 3. Inicializar componentes UI base
            await this._initializeUIComponents();

            // 4. Inicializar controladores
            await this._initializeControllers();

            // 5. Configurar event listeners globales
            this._setupEventListeners();

            // 6. Cargar datos iniciales
            await this._loadInitialData();

            // 7. Finalizar inicialización
            this.finalizeInitialization();

            this.isInitialized = true;
            this.isLoading = false;

            // Emitir evento de aplicación lista
            this.emit(EVENTS.APP.READY, {
                loadTime: this.performanceMetrics.loadTime,
                components: Array.from(this.components.keys())
            });
        } catch (error) {
            this.isLoading = false;
            this.handleInitializationError(error);
            throw error;
        }
    }

    /**
     * Inicializa servicios principales
     */
    async _initializeServices() {
        // Inicializar DI Container
        this.diContainer = DIContainer.getInstance();
        await this.diContainer.init();

        // 1. Generar estructura HTML primero (SectionGeneratorService)
        this.sectionGeneratorService = await this.diContainer.get('sectionGeneratorService');
        this.sectionGeneratorService.generateEnabledSections();

        // 2. Aplicar configuración y contenido sobre la estructura generada (ConfigurationService)
        this.configurationService = await this.diContainer.get('configurationService');
        if (this.configurationService && this.configurationService.init) {
            await this.configurationService.init();
        }

        // 3. Inicializar resto de servicios
        this.invitationService = await this.diContainer.get('invitationService');
        if (this.invitationService && this.invitationService.init) {
            await this.invitationService.init();
        }

        this.metaService = await this.diContainer.get('metaService');
        if (this.metaService && this.metaService.init) {
            await this.metaService.init();
        }

        this.validationService = await this.diContainer.get('validationService');
        if (this.validationService && this.validationService.init) {
            await this.validationService.init();
        }
    }

    /**
     * Inicializa componentes UI base
     */
    async _initializeUIComponents() {
        const componentInitializers = [
            {
                selector: '[data-countdown]',
                factory: ComponentFactory.createCountdown,
                name: 'countdown'
            },
            { selector: '[data-modal]', factory: ComponentFactory.createModal, name: 'modal' },
            { selector: '[data-loader]', factory: ComponentFactory.createLoader, name: 'loader' }
        ];

        for (const { selector, factory, name } of componentInitializers) {
            const elements = this.container.querySelectorAll(selector);
            for (const element of elements) {
                const component = await factory(element);
                if (component) {
                    this.components.set(`${name}-${element.id || Date.now()}`, component);
                }
            }
        }

        // Componentes Singleton
        const mobileMenu = await ComponentFactory.createMobileMenu();
        if (mobileMenu) {
            this.components.set('mobile-menu', mobileMenu);
        }
    }

    /**
     * Inicializa controladores principales
     */
    async _initializeControllers() {
        this.navigationController = await ControllerFactory.createNavigationController(
            this.container
        );
        this.contentController = await ControllerFactory.createContentController(
            this.container,
            this.metaService
        );
        this.scrollAnimationController = await ControllerFactory.createScrollAnimationController(
            this.container
        );

        const rsvpContainer =
            this.container.querySelector('[data-rsvp-container]') ||
            this.container.querySelector('#rsvp');
        if (rsvpContainer) {
            this.rsvpController = await ControllerFactory.createRSVPController(
                rsvpContainer,
                this.diContainer.get('rsvpFacade'),
                this.validationService
            );
        }

        const carouselElements = this.container.querySelectorAll('[data-carousel]');
        for (const element of carouselElements) {
            const carousel = await ControllerFactory.createCarouselController(
                element,
                this.configurationService
            );
            if (carousel) {
                this.components.set(`carousel-${element.id || Date.now()}`, carousel);
            }
        }
    }

    /**
     * Configura event listeners globales
     */
    _setupEventListeners() {
        // Error handling
        const errorHandler = event => {
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
            this.navigationController.on(EVENTS.NAVIGATION.SECTION_CHANGED, data => {
                this.handleSectionChange(data);
            });
        }

        // RSVP events
        if (this.rsvpController) {
            this.rsvpController.on(EVENTS.RSVP.SUBMITTED, data => {
                this.handleRSVPSubmitted(data);
            });

            this.rsvpController.on(EVENTS.RSVP.INVITATION_LOADED, data => {
                this.handleInvitationLoaded(data);
            });
        }
    }

    /**
     * Carga datos iniciales de la aplicación
     */
    async _loadInitialData() {
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
                    this.currentInvitation =
                        await this.invitationService.loadInvitation(invitationId);
                    if (this.currentInvitation) {
                        // Actualizar RSVP Controller explícitamente
                        if (this.rsvpController) {
                            this.rsvpController.populateFormWithInvitation(this.currentInvitation);
                            this.rsvpController.currentInvitation = this.currentInvitation;
                        }

                        this.emit(EVENTS.APP.INVITATION_LOADED, {
                            invitation: this.currentInvitation
                        });
                    }
                } catch (error) {
                    console.error('Error loading invitation:', error);
                }
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    /**
     * Finaliza la inicialización
     */
    finalizeInitialization() {
        if (this.options.enablePerformanceMonitoring) {
            this.performanceMetrics.initEndTime = performance.now();
            this.performanceMetrics.loadTime =
                this.performanceMetrics.initEndTime - this.performanceMetrics.initStartTime;
        }

        // Remover loader de página si existe
        this.hideLoader();

        // Añadir clase de app inicializada
        document.body.classList.add('app-initialized');

        // Debug mode
        if (this.options.enableDebugMode) {
            window.WeddingApp = this;
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
    }

    /**
     * Configura manejo de errores
     */
    _setupErrorHandling() {
        // Configurar manejo de errores personalizado
        window.addEventListener('error', event => {
            this.logError('JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', event => {
            this.logError('Unhandled Promise Rejection', event.reason);
        });
    }

    /**
     * Maneja errores de inicialización
     * @param {Error} error - Error ocurrido
     */
    handleInitializationError(error) {
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
        // Implementar lógica de logging si es necesario
    }

    /**
     * Maneja cambios de sección
     * @param {Object} data - Datos del cambio de sección
     */
    handleSectionChange(data) {
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
        this.components.forEach(component => {
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
        this.components.forEach(component => {
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
            case 'scrollAnimation':
                return this.scrollAnimationController;
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
                carousel: !!this.carouselController,
                scrollAnimation: !!this.scrollAnimationController
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
                    console.error(`Error in event listener for ${event}:`, error);
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
        await this.destroy();
        await this.init();
    }

    /**
     * Destruye la aplicación y limpia recursos
     */
    async destroy() {
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

        if (this.scrollAnimationController) {
            this.scrollAnimationController.destroy();
            this.scrollAnimationController = null;
        }

        // Destruir componentes
        this.components.forEach(component => {
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
        this.isDestroyed = true;
    }

    /**
     * Verifica si la aplicación está lista
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized && !this.isLoading;
    }
}
