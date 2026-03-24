import { CarouselController } from '../carousel-controller.js';
import { EVENTS } from '../../../shared/constants/events.js';

describe('CarouselController', () => {
    let container;
    let carouselController;

    beforeEach(() => {
        jest.useFakeTimers();

        container = document.createElement('div');
        container.id = 'carousel';
        container.innerHTML = `
            <div id="carouselTrack">
                <div class="carousel-slide">Slide 1</div>
                <div class="carousel-slide">Slide 2</div>
                <div class="carousel-slide">Slide 3</div>
            </div>
        `;
        document.body.appendChild(container);

        carouselController = new CarouselController(container, {
            autoPlay: false,
            autoPlayInterval: 100,
            animationDuration: 0,
            loop: true,
            showDots: true,
            showArrows: true
        });
    });

    afterEach(() => {
        carouselController.destroy();
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
        jest.useRealTimers();
    });

    it('initializes and configures carousel elements', async () => {
        await carouselController.init();

        expect(carouselController.isInitialized).toBe(true);
        expect(carouselController.getTotalSlides()).toBe(3);
        expect(carouselController.getCurrentSlide()).toBe(0);

        // Navigation and dots were created
        expect(carouselController.prevButton).toBeDefined();
        expect(carouselController.nextButton).toBeDefined();
        expect(carouselController.dotElements.length).toBe(3);
    });

    it('navigates using goToSlide, nextSlide, and prevSlide', async () => {
        await carouselController.init();

        const slideChanged = jest.fn();
        carouselController.on(EVENTS.CAROUSEL.SLIDE_CHANGED, slideChanged);

        const goAsync = async index => {
            const promise = carouselController.goToSlide(index);
            jest.advanceTimersByTime(100);
            await promise;
        };

        await goAsync(1);
        expect(carouselController.getCurrentSlide()).toBe(1);
        expect(slideChanged).toHaveBeenCalledWith(expect.objectContaining({ from: 0, to: 1 }));

        const next1 = carouselController.nextSlide();
        jest.advanceTimersByTime(100);
        await Promise.resolve();
        expect(carouselController.getCurrentSlide()).toBe(2);

        carouselController.nextSlide();
        jest.advanceTimersByTime(100);
        await Promise.resolve();
        expect(carouselController.getCurrentSlide()).toBe(0);

        carouselController.prevSlide();
        jest.advanceTimersByTime(100);
        await Promise.resolve();
        expect(carouselController.getCurrentSlide()).toBe(2);
    });

    it('starts and pauses autoPlay correctly', async () => {
        await carouselController.init();

        carouselController.startAutoPlay();
        expect(carouselController.isPlaying).toBe(true);

        jest.advanceTimersByTime(100);
        // auto-play should have moved to next slide
        expect(carouselController.getCurrentSlide()).toBe(1);

        carouselController.pauseAutoPlay();
        expect(carouselController.isPlaying).toBe(false);
        expect(carouselController.autoPlayTimer).toBeNull();
    });

    it('destroys controller and removes event listeners', async () => {
        await carouselController.init();

        carouselController.destroy();

        expect(carouselController.isInitialized).toBe(false);
        expect(carouselController.container).toBeNull();
        expect(carouselController.eventListeners.size).toBe(0);
    });
});
