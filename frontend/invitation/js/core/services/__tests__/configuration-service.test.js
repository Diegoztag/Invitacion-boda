import { ConfigurationService } from '../configuration-service.js';

describe('ConfigurationService', () => {
    let configService;

    beforeEach(() => {
        configService = new ConfigurationService();
        // Limpiar WEDDING_CONFIG global
        delete window.WEDDING_CONFIG;
    });

    afterEach(() => {
        configService.isInitialized = false;
    });

    describe('Initialization', () => {
        it('debe inicializar correctamente', async () => {
            expect(configService.isInitialized).toBe(false);
            await configService.init();
            expect(configService.isInitialized).toBe(true);
        });

        it('no debe inicializar dos veces', async () => {
            const configSpy = jest.spyOn(configService, 'loadConfiguration');
            await configService.init();
            await configService.init();

            // loadConfiguration solo se debe llamar una vez
            expect(configSpy).toHaveBeenCalledTimes(1);
            configSpy.mockRestore();
        });
    });

    describe('Configuration Loading', () => {
        it('debe cargar WEDDING_CONFIG desde window', () => {
            const testConfig = {
                couple: {
                    brideName: 'María',
                    groomName: 'Juan'
                },
                eventDate: '2026-06-15'
            };
            window.WEDDING_CONFIG = testConfig;

            configService.loadConfiguration();

            expect(configService.config).toEqual(testConfig);
        });

        it('debe usar configuración por defecto si WEDDING_CONFIG no existe', () => {
            delete window.WEDDING_CONFIG;

            configService.loadConfiguration();

            expect(configService.config).toBeDefined();
            expect(typeof configService.config).toBe('object');
        });

        it('debe usar configuración por defecto si WEDDING_CONFIG está vacío', () => {
            window.WEDDING_CONFIG = {};

            configService.loadConfiguration();

            expect(configService.config).toBeDefined();
            expect(Object.keys(configService.config).length).toBeGreaterThan(0);
        });

        it('debe retornar getDefaultConfig cuando sea necesario', () => {
            const defaultConfig = configService.getDefaultConfig();

            expect(defaultConfig).toBeDefined();
            expect(typeof defaultConfig).toBe('object');
            // Configuration should have basic structure
            expect(
                defaultConfig.couple || defaultConfig.event || defaultConfig.messages
            ).toBeDefined();
        });
    });

    describe('Configuration Structure', () => {
        it('debe tener estructura de configuración válida', () => {
            const testConfig = {
                couple: {
                    brideName: 'María García',
                    groomName: 'Juan López',
                    brideFamily: 'García',
                    groomFamily: 'López'
                },
                event: {
                    date: '2026-06-15',
                    time: '18:00',
                    location: 'Salón de eventos'
                },
                messages: {
                    title: 'Nuestra Boda',
                    subtitle: 'Estamos felices de invitarte'
                }
            };

            window.WEDDING_CONFIG = testConfig;
            configService.loadConfiguration();

            expect(configService.config.couple).toBeDefined();
            expect(configService.config.event).toBeDefined();
            expect(configService.config.messages).toBeDefined();
        });
    });

    describe('Configuration Retrieval', () => {
        it('debe permitir obtener valores de configuración', () => {
            const testConfig = {
                couple: {
                    brideName: 'María'
                },
                nest: {
                    level1: {
                        level2: 'value'
                    }
                }
            };

            window.WEDDING_CONFIG = testConfig;
            configService.loadConfiguration();

            expect(configService.config.couple.brideName).toBe('María');
            expect(configService.config.nest.level1.level2).toBe('value');
        });

        it('debe manejar claves ausentes sin errores', () => {
            configService.loadConfiguration();

            // No debe lanzar error accediendo a propiedades inexistentes
            expect(() => {
                const { nonexistent } = configService.config;
                if (nonexistent && nonexistent.property) {
                    // Access value only if properties exist
                }
            }).not.toThrow();
        });
    });

    describe('Configuration Application', () => {
        it('debe aplicar configuración al DOM', async () => {
            const testConfig = {
                couple: {
                    brideName: 'María',
                    groomName: 'Juan'
                }
            };
            window.WEDDING_CONFIG = testConfig;

            const applySpy = jest.spyOn(configService, 'applyConfigurationToDOM');
            await configService.init();

            expect(applySpy).toHaveBeenCalled();
            applySpy.mockRestore();
        });

        it('debe rastrear elementos aplicados', () => {
            expect(configService.appliedElements).toBeInstanceOf(Set);
            expect(configService.appliedElements.size).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('debe manejar null gracefully', () => {
            window.WEDDING_CONFIG = null;

            configService.loadConfiguration();

            expect(configService.config).toBeDefined();
            expect(configService.config).not.toBeNull();
        });

        it('debe procesar configuración con valores especiales', () => {
            const testConfig = {
                numbers: [1, 2, 3],
                dates: new Date('2026-06-15'),
                booleans: {
                    isOpen: true,
                    isClosed: false
                }
            };

            window.WEDDING_CONFIG = testConfig;
            configService.loadConfiguration();

            expect(configService.config.numbers).toEqual([1, 2, 3]);
            expect(configService.config.booleans.isOpen).toBe(true);
        });
    });
});
