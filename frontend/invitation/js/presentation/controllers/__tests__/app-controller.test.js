/**
 * Tests para AppController
 * Valida: inicialización, servicios, componentes, controladores, eventos
 */

// Mock de AppFacade
jest.mock('../../../core/facades/AppFacade.js', () => ({
    AppFacade: {
        getInstance: jest.fn(() => ({
            initializeServices: jest.fn().mockResolvedValue({
                metaService: { init: jest.fn().mockResolvedValue() },
                configurationService: { init: jest.fn().mockResolvedValue() },
                invitationService: { init: jest.fn().mockResolvedValue() },
                validationService: { init: jest.fn().mockResolvedValue() },
                sectionGeneratorService: { generateEnabledSections: jest.fn() }
            }),
            getService: jest.fn()
        }))
    }
}));

// Mock de ControllerFactory
jest.mock('../controller-factory.js', () => ({
    ControllerFactory: {
        createNavigationController: jest.fn().mockResolvedValue({
            init: jest.fn().mockResolvedValue(),
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        }),
        createContentController: jest.fn().mockResolvedValue({
            init: jest.fn().mockResolvedValue(),
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        }),
        createRSVPController: jest.fn().mockResolvedValue({
            init: jest.fn().mockResolvedValue(),
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn(),
            populateFormWithInvitation: jest.fn()
        }),
        createCarouselController: jest.fn().mockResolvedValue({
            init: jest.fn().mockResolvedValue(),
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        }),
        createScrollAnimationController: jest.fn().mockResolvedValue({
            init: jest.fn().mockResolvedValue(),
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        }),
        createThemeController: jest.fn().mockResolvedValue({
            init: jest.fn().mockResolvedValue(),
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        })
    }
}));

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
        emit: jest.fn(),
        destroy: jest.fn()
    }))
}));

jest.mock('../content-controller.js', () => ({
    ContentController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn(),
        destroy: jest.fn()
    }))
}));

jest.mock('../rsvp-controller.js', () => ({
    RsvpController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn(),
        destroy: jest.fn(),
        populateFormWithInvitation: jest.fn()
    }))
}));

jest.mock('../carousel-controller.js', () => ({
    CarouselController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn(),
        destroy: jest.fn()
    }))
}));

jest.mock('../scroll-animation-controller.js', () => ({
    ScrollAnimationController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn(),
        destroy: jest.fn()
    }))
}));

jest.mock('../theme-controller.js', () => ({
    ThemeController: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(),
        on: jest.fn(),
        emit: jest.fn(),
        destroy: jest.fn()
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
    let mockAppFacade;

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

        // Configurar AppFacade mock
        const { AppFacade } = require('../../../core/facades/AppFacade.js');
        mockAppFacade = {
            initializeServices: jest.fn().mockResolvedValue({
                metaService: { init: jest.fn().mockResolvedValue() },
                configurationService: { init: jest.fn().mockResolvedValue() },
                invitationService: {
                    init: jest.fn().mockResolvedValue(),
                    loadInvitation: jest.fn().mockResolvedValue({ id: 'test-invitation' })
                },
                validationService: { init: jest.fn().mockResolvedValue() },
                sectionGeneratorService: { generateEnabledSections: jest.fn() }
            }),
            getService: jest.fn(),
            loadInitialData: jest.fn().mockResolvedValue({ id: 'test-invitation' })
        };
        AppFacade.getInstance.mockReturnValue(mockAppFacade);

        // Mock DIContainer to return mockAppFacade
        mockDIContainer.get.mockImplementation(serviceName => {
            if (serviceName === 'appFacade') {
                return Promise.resolve(mockAppFacade);
            }
            return Promise.resolve({});
        });

        appController = new AppController(container, {
            autoInit: false,
            enableErrorHandling: false,
            enablePerformanceMonitoring: false
        });

        // Mock controllers that are expected to be initialized
        appController.navigationController = {
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        };
        appController.contentController = {
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        };
        appController.rsvpController = {
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn(),
            populateFormWithInvitation: jest.fn()
        };
        appController.carouselController = {
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        };
        appController.scrollAnimationController = {
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        };
        appController.themeController = {
            on: jest.fn(),
            emit: jest.fn(),
            destroy: jest.fn()
        };
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
                    case 'appFacade':
                        return Promise.resolve(mockAppFacade);
                    case 'sectionGeneratorService':
                        return Promise.resolve({
                            generateEnabledSections: jest.fn()
                        });
                    case 'configurationService':
                        return Promise.resolve({
                            init: jest.fn().mockResolvedValue()
                        });
                    case 'invitationService':
                        return Promise.resolve({
                            init: jest.fn().mockResolvedValue()
                        });
                    case 'metaService':
                        return Promise.resolve({
                            init: jest.fn().mockResolvedValue()
                        });
                    case 'validationService':
                        return Promise.resolve({
                            init: jest.fn().mockResolvedValue()
                        });
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
                            emit: jest.fn(),
                            destroy: jest.fn()
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
            mockDIContainer.get.mockImplementation(serviceName => {
                if (serviceName === 'appFacade') {
                    return Promise.resolve(mockAppFacade);
                }
                return Promise.resolve({
                    generateEnabledSections: jest.fn()
                });
            });

            // Mockear imports dinámicos
            global.import = jest.fn().mockImplementation(modulePath => {
                if (modulePath.includes('navigation-controller.js')) {
                    return Promise.resolve({
                        NavigationController: jest.fn().mockImplementation(() => ({
                            init: jest.fn().mockResolvedValue(),
                            on: jest.fn(),
                            emit: jest.fn(),
                            destroy: jest.fn()
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
            const mockServices = {
                metaService: { init: jest.fn().mockResolvedValue() },
                configurationService: { init: jest.fn().mockResolvedValue() },
                invitationService: { init: jest.fn().mockResolvedValue() },
                validationService: { init: jest.fn().mockResolvedValue() },
                sectionGeneratorService: { generateEnabledSections: jest.fn() }
            };
            mockAppFacade.initializeServices.mockResolvedValue(mockServices);

            await appController._initializeServices();

            expect(mockAppFacade.initializeServices).toHaveBeenCalled();
            expect(appController.metaService).toBe(mockServices.metaService);
            expect(appController.configurationService).toBe(mockServices.configurationService);
            expect(appController.validationService).toBe(mockServices.validationService);
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

            await appController._initializeUIComponents();

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
            await expect(appController._initializeUIComponents()).resolves.not.toThrow();

            // Debería continuar inicializando otros componentes
            expect(appController.components.size).toBeGreaterThan(0);

            // Limpiar mock
            delete global.import;
        });
    });

    describe('Controller Initialization', () => {
        it('debe inicializar controladores principales', async () => {
            await appController._initializeControllers();

            expect(appController.navigationController).toBeDefined();
            expect(appController.contentController).toBeDefined();
            expect(appController.rsvpController).toBeDefined();
            expect(appController.scrollAnimationController).toBeDefined();
            expect(appController.themeController).toBeDefined();
        });
    });

    describe('Event Handling', () => {
        it('debe configurar event listeners globales', () => {
            appController._setupEventListeners();

            // Verificar que se configuraron listeners
            expect(appController.eventListeners.size).toBeGreaterThan(0);
        });

        it('debe emitir eventos correctamente', () => {
            const mockCallback = jest.fn();
            container.addEventListener('app:ready', mockCallback);

            appController.emit('app:ready', {
                test: 'data'
            });

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        test: 'data'
                    }
                })
            );
        });
    });

    describe('Data Loading', () => {
        it('debe cargar datos iniciales', async () => {
            const mockServices = {
                metaService: { init: jest.fn().mockResolvedValue() },
                configurationService: { init: jest.fn().mockResolvedValue() },
                invitationService: {
                    init: jest.fn().mockResolvedValue(),
                    loadInvitation: jest.fn().mockResolvedValue({ id: 'test-invitation' })
                },
                validationService: { init: jest.fn().mockResolvedValue() },
                sectionGeneratorService: { generateEnabledSections: jest.fn() }
            };
            mockAppFacade.initializeServices.mockResolvedValue(mockServices);

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

            await appController._initializeServices();
            await appController._loadInitialData();

            expect(mockAppFacade.loadInitialData).toHaveBeenCalledWith('test-invitation');
            expect(appController.currentInvitation).toEqual({
                id: 'test-invitation'
            });

            // Restaurar URLSearchParams
            global.URLSearchParams = originalURLSearchParams;
        });
    });

    describe('Lifecycle', () => {
        it('debe destruir recursos correctamente', async () => {
            // Simular estado inicializado sin llamar init()
            appController.isInitialized = true;
            appController.isLoading = false;
            appController.components.set('test-component', {
                destroy: jest.fn()
            });
            appController.controllers = [
                appController.navigationController,
                appController.contentController
            ].filter(Boolean);

            await appController.destroy();

            expect(appController.isInitialized).toBe(false);
            expect(appController.components.size).toBe(0);
        });

        it('debe verificar estado de readiness', async () => {
            expect(appController.isReady()).toBe(false);

            // Simular estado inicializado
            appController.isInitialized = true;
            appController.isLoading = false;

            expect(appController.isReady()).toBe(true);
        });
    });
});
