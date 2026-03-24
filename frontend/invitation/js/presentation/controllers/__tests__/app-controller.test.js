/**
 * Tests para AppController
 * Valida: inicialización, servicios, componentes, controladores, eventos
 */

// Mock de DIContainer
jest.mock('../../../config/di-container.js', () => ({
    DIContainer: {
        getInstance: jest.fn(() => ({
            init: jest.fn().mockResolvedValue(),
            get: jest.fn()
        }))
    }
}));

// Mock de servicios
jest.mock('../../../core/services/configuration-service.js', () => ({
    ConfigurationService: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        loadConfiguration: jest.fn().mockResolvedValue({}),
        applyConfiguration: jest.fn()
    }))
}));

jest.mock('../../../core/services/invitation-service.js', () => ({
    InvitationService: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        loadInvitation: jest.fn().mockResolvedValue(null)
    }))
}));

jest.mock('../../../core/services/meta-service.js', () => ({
    MetaService: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        updateMetaTags: jest.fn()
    }))
}));

jest.mock('../../../core/services/validation-service.js', () => ({
    ValidationService: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue()
    }))
}));

jest.mock('../../../core/services/section-generator-service.js', () => ({
    SectionGeneratorService: jest.fn().mockImplementation(() => ({
        generateEnabledSections: jest.fn()
    }))
}));

// Mock de controladores
jest.mock('../navigation-controller.js', () => ({
    NavigationController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn()
    }))
}));

jest.mock('../content-controller.js', () => ({
    ContentController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn()
    }))
}));

jest.mock('../rsvp-controller.js', () => ({
    RsvpController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn()
    }))
}));

jest.mock('../carousel-controller.js', () => ({
    CarouselController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn()
    }))
}));

jest.mock('../scroll-animation-controller.js', () => ({
    ScrollAnimationController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn()
    }))
}));

// Mock de componentes UI
jest.mock('../../components/ui/countdown.js', () => ({
    CountdownComponent: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue()
    }))
}));

jest.mock('../../components/ui/modal.js', () => ({
    ModalComponent: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue()
    }))
}));

jest.mock('../../components/ui/mobile-menu.js', () => ({
    MobileMenuComponent: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue()
    }))
}));

jest.mock('../../components/ui/loader.js', () => ({
    LoaderComponent: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue()
    }))
}));

// Mock de utilidades
jest.mock('../../../shared/utils/dom-utils.js', () => ({
    DOMUtils: {
        addClass: jest.fn(),
        removeClass: jest.fn(),
        hasClass: jest.fn(),
        getElement: jest.fn(),
        querySelectorAll: jest.fn()
    }
}));

// Mock de constantes
jest.mock('../../../shared/constants/events.js', () => ({
    EVENTS: {
        APP: {
            READY: 'app:ready',
            ERROR: 'app:error',
            INVITATION_LOADED: 'app:invitation-loaded',
            RSVP_SUBMITTED: 'app:rsvp-submitted',
            SECTION_CHANGED: 'app:section-changed',
            WINDOW_RESIZED: 'app:window-resized',
            VISIBILITY_CHANGED: 'app:visibility-changed'
        },
        NAVIGATION: {
            SECTION_CHANGED: 'navigation:section-changed'
        },
        RSVP: {
            SUBMITTED: 'rsvp:submitted',
            INVITATION_LOADED: 'rsvp:invitation-loaded'
        }
    }
}));

jest.mock('../../../shared/constants/selectors.js', () => ({
    SELECTORS: {
        NAVIGATION: '.navigation',
        RSVP_FORM: '.rsvp-form'
    }
}));

// NOW import the controller after all mocks are defined
import { AppController } from '../app-controller.js';

describe('AppController', () => {
    let container;
    let appController;
    let mockDIContainer;

    beforeEach(() => {
        // Crear contenedor de prueba
        container = document.createElement('div');
        container.innerHTML = `
      <div data-countdown="2026-06-15T18:00:00"></div>
      <div data-modal="rsvp-modal"></div>
      <div data-loader="main-loader"></div>
      <nav class="navigation"></nav>
      <form class="rsvp-form"></form>
    `;
        document.body.appendChild(container);

        // Mock del DI Container
        mockDIContainer = {
            init: jest.fn().mockResolvedValue(),
            get: jest.fn()
        };

        // Resetear mocks
        jest.clearAllMocks();

        // Configurar DI Container mock
        const { DIContainer } = require('../../../config/di-container.js');
        DIContainer.getInstance.mockReturnValue(mockDIContainer);

        appController = new AppController(container, {
            autoInit: false,
            enableErrorHandling: false,
            enablePerformanceMonitoring: false
        });
    });

    afterEach(() => {
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        it('debe inicializar correctamente', async () => {
            // Configurar mocks de servicios
            mockDIContainer.get.mockImplementation(serviceName => {
                switch (serviceName) {
                    case 'sectionGeneratorService':
                        return Promise.resolve({ generateEnabledSections: jest.fn() });
                    case 'configurationService':
                        return Promise.resolve({ init: jest.fn().mockResolvedValue() });
                    case 'invitationService':
                        return Promise.resolve({ init: jest.fn().mockResolvedValue() });
                    case 'metaService':
                        return Promise.resolve({ init: jest.fn().mockResolvedValue() });
                    case 'validationService':
                        return Promise.resolve({ init: jest.fn().mockResolvedValue() });
                    default:
                        return Promise.resolve({});
                }
            });

            // Mockear imports dinámicos para controladores
            global.import = jest.fn().mockImplementation(modulePath => {
                if (modulePath.includes('navigation-controller.js')) {
                    return Promise.resolve({
                        NavigationController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('content-controller.js')) {
                    return Promise.resolve({
                        ContentController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('rsvp-controller.js')) {
                    return Promise.resolve({
                        RSVPController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('carousel-controller.js')) {
                    return Promise.resolve({
                        CarouselController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('scroll-animation-controller.js')) {
                    return Promise.resolve({
                        ScrollAnimationController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('countdown.js')) {
                    return Promise.resolve({
                        CountdownComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('modal.js')) {
                    return Promise.resolve({
                        ModalComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('mobile-menu.js')) {
                    return Promise.resolve({
                        MobileMenuComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('loader.js')) {
                    return Promise.resolve({
                        LoaderComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                return Promise.reject(new Error(`Module not found: ${modulePath}`));
            });

            expect(appController.isInitialized).toBe(false);

            await appController.init();

            expect(appController.isInitialized).toBe(true);
            expect(appController.diContainer).toBe(mockDIContainer);
            expect(mockDIContainer.init).toHaveBeenCalled();

            // Limpiar mock
            delete global.import;
        });

        it('debe manejar errores de inicialización', async () => {
            // Simular error en DI Container
            mockDIContainer.init.mockRejectedValue(new Error('DI init failed'));

            await expect(appController.init()).rejects.toThrow('DI init failed');
            expect(appController.isInitialized).toBe(false);
            expect(appController.isLoading).toBe(false);
        });

        it('no debe inicializar dos veces', async () => {
            // Configurar mocks
            mockDIContainer.get.mockResolvedValue({ generateEnabledSections: jest.fn() });

            // Mockear imports dinámicos
            global.import = jest.fn().mockImplementation(modulePath => {
                if (modulePath.includes('navigation-controller.js')) {
                    return Promise.resolve({
                        NavigationController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('content-controller.js')) {
                    return Promise.resolve({
                        ContentController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('rsvp-controller.js')) {
                    return Promise.resolve({
                        RSVPController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('carousel-controller.js')) {
                    return Promise.resolve({
                        CarouselController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('scroll-animation-controller.js')) {
                    return Promise.resolve({
                        ScrollAnimationController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn()
                        }))
                    });
                }
                if (modulePath.includes('countdown.js')) {
                    return Promise.resolve({
                        CountdownComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('modal.js')) {
                    return Promise.resolve({
                        ModalComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('mobile-menu.js')) {
                    return Promise.resolve({
                        MobileMenuComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('loader.js')) {
                    return Promise.resolve({
                        LoaderComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                return Promise.reject(new Error(`Module not found: ${modulePath}`));
            });

            await appController.init();
            expect(appController.isInitialized).toBe(true);

            // Intentar inicializar de nuevo
            await appController.init();
            expect(mockDIContainer.init).toHaveBeenCalledTimes(1);

            // Limpiar mock
            delete global.import;
        });
    });

    describe('Service Initialization', () => {
        it('debe inicializar servicios correctamente', async () => {
            const mockSectionGenerator = { generateEnabledSections: jest.fn() };
            const mockConfigService = { init: jest.fn().mockResolvedValue() };
            const mockInvitationService = { init: jest.fn().mockResolvedValue() };
            const mockMetaService = { init: jest.fn().mockResolvedValue() };
            const mockValidationService = { init: jest.fn().mockResolvedValue() };

            mockDIContainer.get.mockImplementation(serviceName => {
                switch (serviceName) {
                    case 'sectionGeneratorService':
                        return Promise.resolve(mockSectionGenerator);
                    case 'configurationService':
                        return Promise.resolve(mockConfigService);
                    case 'invitationService':
                        return Promise.resolve(mockInvitationService);
                    case 'metaService':
                        return Promise.resolve(mockMetaService);
                    case 'validationService':
                        return Promise.resolve(mockValidationService);
                    default:
                        return Promise.resolve({});
                }
            });

            await appController.initializeServices();

            expect(mockSectionGenerator.generateEnabledSections).toHaveBeenCalled();
            expect(appController.configurationService).toBe(mockConfigService);
            expect(appController.invitationService).toBe(mockInvitationService);
            expect(appController.metaService).toBe(mockMetaService);
            expect(appController.validationService).toBe(mockValidationService);
        });
    });

    describe('Component Initialization', () => {
        it('debe inicializar componentes UI base', async () => {
            // Mockear import dinámico para devolver componentes mockeados
            global.import = jest.fn().mockImplementation(modulePath => {
                if (modulePath.includes('countdown.js')) {
                    return Promise.resolve({
                        CountdownComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('modal.js')) {
                    return Promise.resolve({
                        ModalComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('mobile-menu.js')) {
                    return Promise.resolve({
                        MobileMenuComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('loader.js')) {
                    return Promise.resolve({
                        LoaderComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                return Promise.reject(new Error(`Module not found: ${modulePath}`));
            });

            await appController.initializeBaseComponents();

            // Verificar que se crearon componentes
            expect(appController.components.size).toBeGreaterThan(0);

            // Verificar que CountdownComponent se inicializó
            const countdownComponents = Array.from(appController.components.keys()).filter(key =>
                key.startsWith('countdown-')
            );
            expect(countdownComponents.length).toBe(1);

            // Limpiar mock
            delete global.import;
        });

        it('debe manejar errores en inicialización de componentes', async () => {
            // Mockear import dinámico para simular error
            global.import = jest.fn().mockImplementation(modulePath => {
                if (modulePath.includes('countdown.js')) {
                    return Promise.reject(new Error('Countdown init failed'));
                }
                // Para otros módulos, devolver mocks normales
                if (modulePath.includes('modal.js')) {
                    return Promise.resolve({
                        ModalComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('mobile-menu.js')) {
                    return Promise.resolve({
                        MobileMenuComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                if (modulePath.includes('loader.js')) {
                    return Promise.resolve({
                        LoaderComponent: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue()
                        }))
                    });
                }
                return Promise.reject(new Error(`Module not found: ${modulePath}`));
            });

            // No debería lanzar error, solo warning
            await expect(appController.initializeBaseComponents()).resolves.not.toThrow();

            // Debería continuar inicializando otros componentes
            expect(appController.components.size).toBeGreaterThan(0);

            // Limpiar mock
            delete global.import;
        });
    });

    describe('Controller Initialization', () => {
        it('debe inicializar controladores principales', async () => {
            await appController.initializeControllers();

            expect(appController.navigationController).toBeDefined();
            expect(appController.contentController).toBeDefined();
            expect(appController.rsvpController).toBeDefined();
            expect(appController.carouselController).toBeDefined();
            expect(appController.scrollAnimationController).toBeDefined();
        });
    });

    describe('Event Handling', () => {
        it('debe configurar event listeners globales', () => {
            appController.setupGlobalEventListeners();

            // Verificar que se configuraron listeners
            expect(appController.eventListeners.size).toBeGreaterThan(0);
        });

        it('debe emitir eventos correctamente', () => {
            const mockCallback = jest.fn();
            container.addEventListener('app:ready', mockCallback);

            appController.emit('app:ready', { test: 'data' });

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { test: 'data' }
                })
            );
        });
    });

    describe('Data Loading', () => {
        it('debe cargar datos iniciales', async () => {
            const mockSectionGenerator = { generateEnabledSections: jest.fn() };
            const mockConfigService = { init: jest.fn().mockResolvedValue() };
            const mockInvitationService = {
                init: jest.fn().mockResolvedValue(),
                loadInvitation: jest.fn().mockResolvedValue({ id: 'test-invitation' })
            };
            const mockMetaService = {
                init: jest.fn().mockResolvedValue(),
                loadDefaultMeta: jest.fn().mockResolvedValue()
            };
            const mockValidationService = { init: jest.fn().mockResolvedValue() };

            mockDIContainer.get.mockImplementation(serviceName => {
                switch (serviceName) {
                    case 'sectionGeneratorService':
                        return Promise.resolve(mockSectionGenerator);
                    case 'configurationService':
                        return Promise.resolve(mockConfigService);
                    case 'invitationService':
                        return Promise.resolve(mockInvitationService);
                    case 'metaService':
                        return Promise.resolve(mockMetaService);
                    case 'validationService':
                        return Promise.resolve(mockValidationService);
                    default:
                        return Promise.resolve({});
                }
            });

            // Mockear URLSearchParams para simular que hay un ID en la URL
            const originalURLSearchParams = global.URLSearchParams;
            global.URLSearchParams = class {
                get(param) {
                    if (param === 'id') {
                        return 'test-invitation';
                    }
                    return null;
                }
            };

            await appController.initializeServices();
            await appController.loadInitialData();

            expect(mockInvitationService.loadInvitation).toHaveBeenCalledWith('test-invitation');
            expect(appController.currentInvitation).toEqual({ id: 'test-invitation' });

            // Restaurar URLSearchParams
            global.URLSearchParams = originalURLSearchParams;
        });
    });

    describe('Lifecycle', () => {
        it('debe destruir recursos correctamente', async () => {
            // Simular estado inicializado sin llamar init()
            appController.isInitialized = true;
            appController.isLoading = false;
            appController.components.set('test-component', { destroy: jest.fn() });
            appController.controllers = [
                appController.navigationController,
                appController.contentController
            ].filter(Boolean);

            await appController.destroy();

            expect(appController.isInitialized).toBe(false);
            expect(appController.components.size).toBe(0);
        });

        it('debe verificar estado de readiness', async () => {
            expect(appController.isInitialized && !appController.isLoading).toBe(false);

            // Simular estado inicializado
            appController.isInitialized = true;
            appController.isLoading = false;

            expect(appController.isInitialized && !appController.isLoading).toBe(true);
        });
    });
});
