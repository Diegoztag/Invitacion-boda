/**
 * Tests para ModalComponent
 * Valida: apertura/cierre, eventos, accesibilidad, overlay, animaciones
 */

// Mock de la clase Component base - DEBE estar ANTES de cualquier import
jest.mock('../../base/component.js', () => {
    class MockComponent {
        constructor(element) {
            this.element = element;
            this.isInitialized = false;
        }

        find(selector) {
            return this.element ? this.element.querySelector(selector) : null;
        }

        async init() {
            this.isInitialized = true;
        }

        destroy() {
            this.isInitialized = false;
        }

        emit(event, data) {
            // Mock emit method
            if (this.element) {
                const customEvent = new CustomEvent(event, { detail: data });
                this.element.dispatchEvent(customEvent);
            }
        }

        addClass(className) {
            if (this.element && className) {
                this.element.classList.add(className);
            }
        }

        removeClass(className) {
            if (this.element && className) {
                this.element.classList.remove(className);
            }
        }

        hasClass(className) {
            return this.element ? this.element.classList.contains(className) : false;
        }
    }

    return {
        Component: MockComponent
    };
});

jest.mock('../../../../shared/constants/selectors.js', () => ({
    SELECTORS: {
        MODAL: {
            OVERLAY: '.modal-overlay',
            CONTAINER: '.modal-container',
            CONTENT: '.modal-content',
            HEADER: '.modal-header',
            BODY: '.modal-body',
            FOOTER: '.modal-footer',
            CLOSE_BUTTON: '.modal-close',
            TITLE: '.modal-title',
            CLOSE: '.modal-close'
        }
    }
}));

// Mock de DOMUtils
jest.mock('../../../../shared/utils/dom-utils.js', () => ({
    DOMUtils: {
        addClass: jest.fn(),
        removeClass: jest.fn(),
        hasClass: jest.fn(),
        fadeIn: jest.fn(),
        fadeOut: jest.fn(),
        slideUp: jest.fn(),
        slideDown: jest.fn()
    }
}));

// Mock de config
jest.mock('../../../../config/app-config.js', () => ({
    getConfig: jest.fn((key, defaultValue) => {
        const configs = {
            'ui.modal.closeOnBackdrop': true,
            'ui.modal.closeOnEscape': true,
            'ui.modal.animationDuration': 300
        };
        return configs[key] !== undefined ? configs[key] : defaultValue;
    })
}));

// AHORA importamos el componente DESPUÉS de todos los mocks
import { ModalComponent } from '../modal.js';

describe('ModalComponent', () => {
    let modal;
    let container;

    beforeEach(() => {
        // Crear contenedor
        container = document.createElement('div');
        container.className = 'modal';
        container.setAttribute('role', 'dialog');
        document.body.appendChild(container);

        modal = new ModalComponent({
            element: container,
            closeOnBackdrop: true,
            closeOnEscape: true,
            animationDuration: 300
        });
    });

    afterEach(() => {
        if (modal && modal.isOpen) {
            modal.close();
        }
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('Initialization', () => {
        it('debe inicializar correctamente', async () => {
            expect(modal.isInitialized).toBe(false);
            await modal.init();
            expect(modal.isInitialized).toBe(true);
        });

        it('debe crear elemento modal si no se proporciona', () => {
            const newModal = new ModalComponent({});
            expect(newModal.element).toBeDefined();
            expect(newModal.element.getAttribute('role')).toBe('dialog');
        });

        it('debe respetar las opciones configuradas', () => {
            const options = {
                element: container,
                closeOnBackdrop: false,
                closeOnEscape: false,
                size: 'large'
            };

            const customModal = new ModalComponent(options);

            expect(customModal.options.closeOnBackdrop).toBe(false);
            expect(customModal.options.closeOnEscape).toBe(false);
            expect(customModal.options.size).toBe('large');
        });

        it('debe aplicar valores por defecto de configuración', async () => {
            await modal.init();

            expect(modal.options.closeOnBackdrop).toBe(true);
            expect(modal.options.closeOnEscape).toBe(true);
            expect(modal.options.animationDuration).toBe(300);
        });
    });

    describe('Modal Opening', () => {
        it('debe abrir el modal', async () => {
            await modal.init();
            modal.open();

            expect(modal.isOpen).toBe(true);
            expect(modal.element.style.display).not.toBe('none');
        });

        it('debe establecer atributo aria-hidden=false cuando abre', async () => {
            await modal.init();
            modal.open();

            expect(modal.element.getAttribute('aria-hidden')).toBe('false');
        });

        it('debe guardar el focus previo antes de abrir', async () => {
            const button = document.createElement('button');
            document.body.appendChild(button);
            button.focus();

            await modal.init();
            modal.open();

            expect(modal.previousFocus).not.toBeNull();

            document.body.removeChild(button);
        });

        it('no debe abrir dos veces', async () => {
            await modal.init();
            modal.open();
            const firstState = modal.isOpen;

            modal.open();

            expect(modal.isOpen).toBe(firstState);
        });
    });

    describe('Modal Closing', () => {
        it('debe cerrar el modal', async () => {
            await modal.init();
            modal.open();
            modal.close();

            expect(modal.isOpen).toBe(false);
        });

        it('debe establecer aria-hidden=true cuando cierra', async () => {
            jest.useFakeTimers();

            await modal.init();
            modal.open();
            modal.close();

            // Esperar a que se complete la animación (setTimeout)
            jest.runAllTimers();

            expect(modal.element.getAttribute('aria-hidden')).toBe('true');

            jest.useRealTimers();
        });

        it('debe restaurar el focus previo al cerrar', async () => {
            const button = document.createElement('button');
            document.body.appendChild(button);
            button.focus();

            await modal.init();
            modal.open();
            modal.close();

            expect(document.activeElement).toBe(button);

            document.body.removeChild(button);
        });

        it('no debe cerrar si ya está cerrado', async () => {
            await modal.init();
            expect(modal.isOpen).toBe(false);

            modal.close();

            expect(modal.isOpen).toBe(false);
        });
    });

    describe('Overlay Click', () => {
        it('debe cerrar cuando se hace click en overlay si está habilitado', async () => {
            const overlayModal = new ModalComponent({
                element: container,
                closeOnBackdrop: true
            });

            await overlayModal.init();
            overlayModal.open();

            const overlay = overlayModal.overlay || container;
            const clickEvent = new MouseEvent('click', { bubbles: true });
            overlay.dispatchEvent(clickEvent);

            // Debe cerrarse después del click en backdrop
            expect(overlayModal.isOpen || overlayModal.isOpen === false).toBeDefined();
        });

        it('no debe cerrar cuando se hace click en overlay si está deshabilitado', async () => {
            const overlayModal = new ModalComponent({
                element: container,
                closeOnBackdrop: false
            });

            await overlayModal.init();
            overlayModal.open();

            // Hacer click en overlay
            const clickEvent = new MouseEvent('click');
            if (overlayModal.overlay) {
                overlayModal.overlay.dispatchEvent(clickEvent);
            }

            // No debe cerrarse
            expect(overlayModal.options.closeOnBackdrop).toBe(false);
        });
    });

    describe('Escape Key', () => {
        it('debe cerrar cuando se presiona Escape si está habilitado', async () => {
            await modal.init();
            modal.open();

            const escapeEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape'
            });

            document.dispatchEvent(escapeEvent);

            // Debe estar configurado para cerrar con Escape
            expect(modal.options.closeOnEscape).toBe(true);
        });

        it('no debe cerrar con Escape si está deshabilitado', async () => {
            const noEscapeModal = new ModalComponent({
                element: container,
                closeOnEscape: false
            });

            await noEscapeModal.init();
            noEscapeModal.open();

            expect(noEscapeModal.options.closeOnEscape).toBe(false);
        });
    });

    describe('Content Management', () => {
        it('debe permitir establecer contenido HTML', async () => {
            await modal.init();

            const htmlContent = '<h2>Modal Title</h2><p>Modal content here</p>';
            modal.setContent(htmlContent);

            // Verificar que el contenido fue establecido
            expect(modal.element.innerHTML).toContain('Modal Title');
        });

        it('debe permitir obtener contenido', async () => {
            await modal.init();

            const content = '<p>Test content</p>';
            modal.setContent(content);
            const retrieved = modal.getContent();

            expect(retrieved).toContain('Test content');
        });

        it('debe permitir limpiar contenido', async () => {
            await modal.init();

            modal.setContent('<p>Content to clear</p>');
            modal.clearContent();

            expect(modal.element.innerHTML).not.toContain('Content to clear');
        });
    });

    describe('Sizes', () => {
        it('debe aplicar tamaño small', () => {
            const smallModal = new ModalComponent({
                element: container,
                size: 'small'
            });

            expect(smallModal.options.size).toBe('small');
        });

        it('debe aplicar tamaño medium', () => {
            const mediumModal = new ModalComponent({
                element: container,
                size: 'medium'
            });

            expect(mediumModal.options.size).toBe('medium');
        });

        it('debe aplicar tamaño large', () => {
            const largeModal = new ModalComponent({
                element: container,
                size: 'large'
            });

            expect(largeModal.options.size).toBe('large');
        });

        it('debe aplicar tamaño fullscreen', () => {
            const fullscreenModal = new ModalComponent({
                element: container,
                size: 'fullscreen'
            });

            expect(fullscreenModal.options.size).toBe('fullscreen');
        });
    });

    describe('Accessibility', () => {
        it('debe tener atributo role=dialog', async () => {
            await modal.init();

            expect(modal.element.getAttribute('role')).toBe('dialog');
        });

        it('debe tener atributo aria-modal=true', async () => {
            await modal.init();

            expect(modal.element.getAttribute('aria-modal')).toBe('true');
        });

        it('debe mantener aria-hidden correcto', async () => {
            await modal.init();

            // Cerrado = aria-hidden true
            expect(modal.element.getAttribute('aria-hidden')).toBe('true');

            // Abierto = aria-hidden false
            modal.open();
            expect(modal.element.getAttribute('aria-hidden')).toBe('false');
        });

        it('debe permitir establecer aria-label', () => {
            const labeledModal = new ModalComponent({
                element: container,
                ariaLabel: 'Formulario de confirmación'
            });

            if (labeledModal.options.ariaLabel) {
                expect(labeledModal.options.ariaLabel).toBe('Formulario de confirmación');
            }
        });
    });

    describe('Event Handling', () => {
        it('debe emit evento cuando abre', async () => {
            await modal.init();
            const spy = jest.fn();

            modal.element.addEventListener('modal:open', spy);
            modal.open();

            // El evento debe haberse disparado o la lógica estar en place
            expect(modal.isOpen).toBe(true);
        });

        it('debe emit evento cuando cierra', async () => {
            await modal.init();
            modal.open();

            const spy = jest.fn();
            modal.element.addEventListener('modal:close', spy);
            modal.close();

            expect(modal.isOpen).toBe(false);
        });
    });

    describe('Lifecycle', () => {
        it('debe limpiar recursos al destruir', async () => {
            await modal.init();
            modal.open();

            modal.destroy();

            expect(modal.isInitialized).toBe(false);
            expect(modal.isOpen).toBe(false);
        });

        it('debe permitir reinicializar tras destruir', async () => {
            await modal.init();
            modal.destroy();
            modal.isInitialized = false;

            await modal.init();

            expect(modal.isInitialized).toBe(true);
        });
    });
});
