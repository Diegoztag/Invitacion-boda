import { ThemeController } from '../theme-controller.js';
import { EVENTS } from '../../../shared/constants/events.js';
import { SELECTORS } from '../../../shared/constants/selectors.js';

describe('ThemeController', () => {
    let container;
    let controller;
    let toggleButton;

    beforeEach(() => {
        // Configurar el DOM
        container = document.createElement('div');

        toggleButton = document.createElement('button');
        toggleButton.className =
            SELECTORS?.THEME?.TOGGLE_BUTTON?.replace('.', '') || 'theme-toggle';
        container.appendChild(toggleButton);

        // Limpiar localStorage y clases del body
        localStorage.clear();
        document.body.className = '';

        // Mock de window.matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(), // Deprecated
                removeListener: jest.fn(), // Deprecated
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            }))
        });

        controller = new ThemeController(container);
    });

    afterEach(() => {
        if (controller) {
            controller.destroy();
        }
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize correctly', async () => {
            await controller.init();
            expect(controller.isInitialized).toBe(true);
        });

        it('should not initialize twice', async () => {
            await controller.init();
            const discoverSpy = jest.spyOn(controller, 'discoverElements');
            await controller.init();
            expect(discoverSpy).not.toHaveBeenCalled();
        });

        it('should discover elements', async () => {
            await controller.init();
            expect(controller.themeToggleButton).toBe(toggleButton);
        });
    });

    describe('Theme Loading', () => {
        it('should load default theme if no saved theme and no system preference', async () => {
            await controller.init();
            expect(controller.getCurrentTheme()).toBe('light');
            expect(document.body.classList.contains('dark-mode')).toBe(false);
        });

        it('should load saved theme from localStorage', async () => {
            localStorage.setItem('theme', 'dark');
            await controller.init();
            expect(controller.getCurrentTheme()).toBe('dark');
            expect(document.body.classList.contains('dark-mode')).toBe(true);
        });

        it('should load system preference if no saved theme', async () => {
            window.matchMedia.mockImplementation(query => ({
                matches: query === '(prefers-color-scheme: dark)'
            }));
            await controller.init();
            expect(controller.getCurrentTheme()).toBe('dark');
            expect(document.body.classList.contains('dark-mode')).toBe(true);
        });
    });

    describe('Theme Toggling', () => {
        it('should toggle theme from light to dark', async () => {
            await controller.init();
            controller.toggleTheme();
            expect(controller.getCurrentTheme()).toBe('dark');
            expect(document.body.classList.contains('dark-mode')).toBe(true);
            expect(localStorage.getItem('theme')).toBe('dark');
        });

        it('should toggle theme from dark to light', async () => {
            localStorage.setItem('theme', 'dark');
            await controller.init();
            controller.toggleTheme();
            expect(controller.getCurrentTheme()).toBe('light');
            expect(document.body.classList.contains('dark-mode')).toBe(false);
            expect(localStorage.getItem('theme')).toBe('light');
        });

        it('should toggle theme on button click', async () => {
            await controller.init();
            toggleButton.click();
            expect(controller.getCurrentTheme()).toBe('dark');
        });
    });

    describe('Set Theme', () => {
        it('should set specific theme', async () => {
            await controller.init();
            controller.setTheme('dark');
            expect(controller.getCurrentTheme()).toBe('dark');
            expect(document.body.classList.contains('dark-mode')).toBe(true);
        });

        it('should ignore invalid theme', async () => {
            await controller.init();
            controller.setTheme('invalid');
            expect(controller.getCurrentTheme()).toBe('light');
        });

        it('should update aria-pressed attribute on toggle button', async () => {
            await controller.init();
            controller.setTheme('dark');
            expect(toggleButton.getAttribute('aria-pressed')).toBe('true');
            controller.setTheme('light');
            expect(toggleButton.getAttribute('aria-pressed')).toBe('false');
        });

        it('should emit theme changed event', async () => {
            await controller.init();
            const callback = jest.fn();
            const eventName = EVENTS?.THEME?.CHANGED || 'theme:changed';
            controller.on(eventName, callback);

            controller.setTheme('dark');

            expect(callback).toHaveBeenCalledWith({ theme: 'dark' });
        });
    });

    describe('Event Handling', () => {
        it('should handle events correctly', () => {
            const callback = jest.fn();
            controller.on('test-event', callback);
            controller.emit('test-event', { data: 'test' });
            expect(callback).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should catch errors in event callbacks', () => {
            const callback = jest.fn().mockImplementation(() => {
                throw new Error('Test error');
            });
            controller.on('test-event', callback);

            // Should not throw
            expect(() => {
                controller.emit('test-event', { data: 'test' });
            }).not.toThrow();

            expect(callback).toHaveBeenCalled();
        });
    });

    describe('Destroy', () => {
        it('should clean up correctly', async () => {
            await controller.init();

            // Mock the toggleTheme method to verify it's not called
            const toggleSpy = jest.spyOn(controller, 'toggleTheme');

            controller.destroy();
            expect(controller.isInitialized).toBe(false);

            // Button click should not toggle theme after destroy
            toggleButton.click();
            expect(toggleSpy).not.toHaveBeenCalled();
        });
    });
});
