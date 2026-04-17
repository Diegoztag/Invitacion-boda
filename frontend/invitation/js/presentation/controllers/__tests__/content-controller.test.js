import { ContentController } from '../content-controller.js';
import { EVENTS } from '../../../shared/constants/events.js';

describe('ContentController', () => {
    let container;
    let metaServiceMock;
    let controller;

    beforeEach(() => {
        // Configurar DOM
        container = document.createElement('div');
        container.innerHTML = `
            <div data-content="title" data-content-type="text" data-content-fallback="Título por defecto">Título Original</div>
            <div data-content="description" data-content-type="html">Descripción Original</div>
            <div data-content="price" data-content-type="currency" data-content-format="EUR">100</div>
            <div data-content="date" data-content-type="date" data-content-format="short">2023-01-01</div>
            <div data-content="number" data-content-type="number" data-content-format="decimal">10.5</div>
            <input data-content="input-val" data-content-type="attribute" data-content-attribute="value" value="Original">
            
            <div data-date="event-date" data-date-format="long"></div>
            <div data-counter="guests" data-counter-start="0" data-counter-end="100" data-counter-duration="1000">0</div>
            
            <div data-show-if="isVIP" id="vip-section">VIP Section</div>
            <div data-hide-if="isGuest" id="guest-section">Guest Section</div>
        `;
        document.body.appendChild(container);

        // Mock de MetaService
        metaServiceMock = {
            updateFromData: jest.fn().mockResolvedValue(true)
        };

        // Mock de requestAnimationFrame
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
            cb(Date.now() + 16);
            return 1;
        });

        // Inicializar controlador
        controller = new ContentController(container, metaServiceMock, {
            enableAnimations: false // Deshabilitar animaciones para pruebas más rápidas
        });
    });

    afterEach(() => {
        document.body.removeChild(container);
        jest.restoreAllMocks();
        if (controller) {
            controller.destroy();
        }
    });

    describe('Initialization', () => {
        it('should initialize correctly', async () => {
            await controller.init();
            expect(controller.isInitialized).toBe(true);
            expect(controller.contentElements.size).toBe(6);
            expect(controller.dynamicElements.size).toBe(4);
        });

        it('should not initialize twice', async () => {
            await controller.init();
            const discoverSpy = jest.spyOn(controller, 'discoverContentElements');
            await controller.init();
            expect(discoverSpy).not.toHaveBeenCalled();
        });

        it('should discover content elements correctly', async () => {
            await controller.init();
            const titleElement = controller.contentElements.get('title');
            expect(titleElement).toBeDefined();
            expect(titleElement.type).toBe('text');
            expect(titleElement.fallback).toBe('Título por defecto');
            expect(titleElement.originalContent).toBe('Título Original');
        });

        it('should discover special elements correctly', async () => {
            await controller.init();
            expect(controller.dynamicElements.has('date-event-date')).toBe(true);
            expect(controller.dynamicElements.has('counter-guests')).toBe(true);
            expect(controller.dynamicElements.has('conditional-isVIP')).toBe(true);
            expect(controller.dynamicElements.has('conditional-isGuest')).toBe(true);
        });
    });

    describe('Content Updates', () => {
        beforeEach(async () => {
            await controller.init();
        });

        it('should update text content', async () => {
            await controller.updateContent('title', 'Nuevo Título');
            const el = container.querySelector('[data-content="title"]');
            expect(el.textContent).toBe('Nuevo Título');
        });

        it('should update HTML content', async () => {
            await controller.updateContent('description', '<b>Nueva Descripción</b>');
            const el = container.querySelector('[data-content="description"]');
            expect(el.innerHTML).toBe('<b>Nueva Descripción</b>');
        });

        it('should update attribute content', async () => {
            await controller.updateContent('input-val', 'Nuevo Valor');
            const el = container.querySelector('[data-content="input-val"]');
            expect(el.getAttribute('value')).toBe('Nuevo Valor');
        });

        it('should use fallback when value is null', async () => {
            await controller.updateContent('title', null);
            const el = container.querySelector('[data-content="title"]');
            expect(el.textContent).toBe('Título por defecto');
        });

        it('should ignore updates for non-existent keys', async () => {
            await controller.updateContent('non-existent', 'value');
            // No debería lanzar error
        });

        it('should update multiple contents', async () => {
            await controller.updateMultipleContent({
                title: 'Título Múltiple',
                description: 'Descripción Múltiple'
            });

            expect(container.querySelector('[data-content="title"]').textContent).toBe(
                'Título Múltiple'
            );
            expect(container.querySelector('[data-content="description"]').textContent).toBe(
                'Descripción Múltiple'
            );
        });
    });

    describe('Formatting', () => {
        beforeEach(async () => {
            await controller.init();
        });

        it('should format currency correctly', async () => {
            await controller.updateContent('price', 1500.5);
            const el = container.querySelector('[data-content="price"]');
            // El formato exacto depende de la configuración regional, verificamos que contenga el número y el símbolo
            expect(el.textContent).toMatch(/1500,50/);
            expect(el.textContent).toMatch(/€/);
        });

        it('should handle invalid currency gracefully', async () => {
            await controller.updateContent('price', 'invalid');
            const el = container.querySelector('[data-content="price"]');
            expect(el.textContent).toMatch(/0 €/);
        });

        it('should format numbers correctly', async () => {
            await controller.updateContent('number', 1234.567);
            const el = container.querySelector('[data-content="number"]');
            expect(el.textContent).toMatch(/1234,57/);
        });

        it('should handle invalid numbers gracefully', async () => {
            await controller.updateContent('number', 'invalid');
            const el = container.querySelector('[data-content="number"]');
            expect(el.textContent).toBe('0');
        });

        it('should format dates correctly', async () => {
            const date = new Date('2023-12-25T10:00:00Z');
            await controller.updateContent('date', date);
            const el = container.querySelector('[data-content="date"]');
            expect(el.textContent).not.toBe('Fecha inválida');
            expect(el.textContent.length).toBeGreaterThan(0);
        });

        it('should handle invalid dates gracefully', async () => {
            await controller.updateContent('date', 'invalid-date');
            const el = container.querySelector('[data-content="date"]');
            expect(el.textContent).toBe('Fecha inválida');
        });
    });

    describe('Conditional Elements', () => {
        beforeEach(async () => {
            await controller.init();
        });

        it('should show element when condition is met', () => {
            controller.evaluateConditionalElements({ isVIP: true });
            const el = container.querySelector('#vip-section');
            expect(el.style.display).toBe('');
            expect(el.hasAttribute('hidden')).toBe(false);
        });

        it('should hide element when condition is not met', () => {
            controller.evaluateConditionalElements({ isVIP: false });
            const el = container.querySelector('#vip-section');
            expect(el.style.display).toBe('none');
            expect(el.hasAttribute('hidden')).toBe(true);
        });

        it('should handle hide-if condition correctly', () => {
            controller.evaluateConditionalElements({ isGuest: true });
            const el = container.querySelector('#guest-section');
            expect(el.style.display).toBe('none');
            expect(el.hasAttribute('hidden')).toBe(true);

            controller.evaluateConditionalElements({ isGuest: false });
            expect(el.style.display).toBe('');
            expect(el.hasAttribute('hidden')).toBe(false);
        });
    });

    describe('Event Handling', () => {
        beforeEach(async () => {
            await controller.init();
        });

        it('should handle dataChanged event', () => {
            const updateSpy = jest.spyOn(controller, 'updateMultipleContent');
            const evalSpy = jest.spyOn(controller, 'evaluateConditionalElements');

            const event = new CustomEvent('dataChanged', {
                detail: { title: 'Nuevo Título', isVIP: true }
            });
            container.dispatchEvent(event);

            expect(updateSpy).toHaveBeenCalledWith(
                { title: 'Nuevo Título', isVIP: true },
                { skipAnimation: false }
            );
            expect(evalSpy).toHaveBeenCalledWith({ title: 'Nuevo Título', isVIP: true });
            expect(metaServiceMock.updateFromData).toHaveBeenCalled();
        });

        it('should handle section changed event', () => {
            const emitSpy = jest.spyOn(controller, 'emit');

            const event = new CustomEvent(EVENTS.NAVIGATION.SECTION_CHANGED, {
                detail: { current: 'home', previous: 'about' }
            });
            container.dispatchEvent(event);

            expect(emitSpy).toHaveBeenCalledWith(EVENTS.CONTENT.SECTION_CHANGED, {
                current: 'home',
                previous: 'about'
            });
        });

        it('should support custom event listeners', () => {
            const callback = jest.fn();
            controller.on('test-event', callback);

            controller.emit('test-event', { data: 'test' });

            expect(callback).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should allow removing custom event listeners', () => {
            const callback = jest.fn();
            controller.on('test-event', callback);
            controller.off('test-event', callback);

            controller.emit('test-event', { data: 'test' });

            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle errors in event listeners gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const badCallback = () => {
                throw new Error('Test error');
            };

            controller.on('test-event', badCallback);
            controller.emit('test-event', {});

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Animations', () => {
        it('should animate content change when enabled', async () => {
            controller = new ContentController(container, metaServiceMock, {
                enableAnimations: true,
                animationDuration: 100
            });
            await controller.init();

            const el = container.querySelector('[data-content="title"]');

            // Mock setTimeout para ejecutar inmediatamente
            jest.useFakeTimers();

            const updatePromise = controller.updateContent('title', 'Animado');

            expect(el.style.opacity).toBe('0');

            jest.advanceTimersByTime(50); // Mitad de la animación
            expect(el.textContent).toBe('Animado');
            expect(el.style.opacity).toBe('1');

            jest.advanceTimersByTime(50); // Fin de la animación

            await updatePromise;
            jest.useRealTimers();
        });
    });

    describe('Utility Methods', () => {
        beforeEach(async () => {
            await controller.init();
        });

        it('should return all content elements', () => {
            const elements = controller.getAllContentElements();
            expect(elements).toBeInstanceOf(Map);
            expect(elements.size).toBe(6);
            expect(elements).not.toBe(controller.contentElements); // Debe ser una copia
        });

        it('should return all dynamic elements', () => {
            const elements = controller.getAllDynamicElements();
            expect(elements).toBeInstanceOf(Map);
            expect(elements.size).toBe(4);
            expect(elements).not.toBe(controller.dynamicElements); // Debe ser una copia
        });

        it('should reset all content to original state', async () => {
            await controller.updateContent('title', 'Modificado');
            expect(container.querySelector('[data-content="title"]').textContent).toBe(
                'Modificado'
            );

            controller.resetContent();

            expect(container.querySelector('[data-content="title"]').textContent).toBe(
                'Título Original'
            );
        });

        it('should reset specific content to original state', async () => {
            await controller.updateContent('title', 'Modificado 1');
            await controller.updateContent('description', 'Modificado 2');

            controller.resetContent(['title']);

            expect(container.querySelector('[data-content="title"]').textContent).toBe(
                'Título Original'
            );
            expect(container.querySelector('[data-content="description"]').textContent).toBe(
                'Modificado 2'
            );
        });

        it('should update options', () => {
            controller.updateOptions({ enableAnimations: true, newOption: 'test' });
            expect(controller.options.enableAnimations).toBe(true);
            expect(controller.options.newOption).toBe('test');
        });
    });
});
