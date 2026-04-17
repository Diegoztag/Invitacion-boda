import { ScrollAnimationController } from '../scroll-animation-controller.js';

describe('ScrollAnimationController', () => {
    let container;
    let controller;
    let mockObserve;
    let mockUnobserve;
    let mockDisconnect;
    let intersectionCallback;

    beforeEach(() => {
        container = document.createElement('div');

        // Create some elements to observe
        for (let i = 0; i < 3; i++) {
            const el = document.createElement('div');
            el.className = 'itinerary-item';
            container.appendChild(el);
        }

        mockObserve = jest.fn();
        mockUnobserve = jest.fn();
        mockDisconnect = jest.fn();

        window.IntersectionObserver = jest.fn().mockImplementation(callback => {
            intersectionCallback = callback;
            return {
                observe: mockObserve,
                unobserve: mockUnobserve,
                disconnect: mockDisconnect
            };
        });

        controller = new ScrollAnimationController(container);
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
            expect(window.IntersectionObserver).toHaveBeenCalled();
        });

        it('should not initialize twice', async () => {
            await controller.init();
            const setupSpy = jest.spyOn(controller, 'setupObserver');
            await controller.init();
            expect(setupSpy).not.toHaveBeenCalled();
        });

        it('should observe elements on init', async () => {
            await controller.init();
            expect(mockObserve).toHaveBeenCalledTimes(3);
        });
    });

    describe('Animation', () => {
        it('should animate element when intersecting', async () => {
            await controller.init();

            const elements = container.querySelectorAll('.itinerary-item');
            const mockEntries = [
                { isIntersecting: true, target: elements[0] },
                { isIntersecting: false, target: elements[1] }
            ];

            intersectionCallback(mockEntries);

            expect(elements[0].classList.contains('animate-in')).toBe(true);
            expect(elements[1].classList.contains('animate-in')).toBe(false);
            expect(mockUnobserve).toHaveBeenCalledWith(elements[0]);
            expect(mockUnobserve).not.toHaveBeenCalledWith(elements[1]);
        });
    });

    describe('Refresh', () => {
        it('should disconnect and re-observe elements', async () => {
            await controller.init();

            // Add a new element
            const newEl = document.createElement('div');
            newEl.className = 'itinerary-item';
            container.appendChild(newEl);

            mockObserve.mockClear();
            controller.refresh();

            expect(mockDisconnect).toHaveBeenCalled();
            expect(mockObserve).toHaveBeenCalledTimes(4);
        });

        it('should do nothing if not initialized', () => {
            controller.refresh();
            expect(mockDisconnect).not.toHaveBeenCalled();
        });
    });

    describe('Destroy', () => {
        it('should clean up correctly', async () => {
            await controller.init();
            controller.destroy();

            expect(mockDisconnect).toHaveBeenCalled();
            expect(controller.observer).toBeNull();
            expect(controller.isInitialized).toBe(false);
        });
    });
});
