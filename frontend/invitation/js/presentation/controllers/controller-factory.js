/**
 * Controller Factory
 * Encapsula la lógica de creación de controladores.
 */
export class ControllerFactory {
    /**
     * Crea e inicializa el NavigationController.
     * @param {HTMLElement} container - El contenedor principal de la aplicación.
     * @returns {Promise<import('./navigation-controller.js').NavigationController|null>}
     */
    static async createNavigationController(container) {
        try {
            const { NavigationController } = await import('./navigation-controller.js');
            const controller = new NavigationController(container, {
                smoothScroll: true,
                updateUrl: true,
                highlightActiveSection: true
            });
            await controller.init();
            return controller;
        } catch (error) {
            return null;
        }
    }

    /**
     * Crea e inicializa el ContentController.
     * @param {HTMLElement} container - El contenedor principal de la aplicación.
     * @param {import('../../core/services/meta-service.js').MetaService} metaService - El servicio de metadatos.
     * @returns {Promise<import('./content-controller.js').ContentController|null>}
     */
    static async createContentController(container, metaService) {
        try {
            const { ContentController } = await import('./content-controller.js');
            const controller = new ContentController(container, metaService, {
                autoUpdateMeta: true,
                enableAnimations: true
            });
            await controller.init();
            return controller;
        } catch {
            return null;
        }
    }

    /**
     * Crea e inicializa el RSVPController.
     * @param {HTMLElement} container - El elemento contenedor del formulario RSVP.
     * @param {import('../../core/facades/RSVPFacade.js').RSVPFacade} rsvpFacade - El facade de RSVP.
     * @param {import('../../core/services/validation-service.js').ValidationService} validationService - El servicio de validación.
     * @returns {Promise<import('./rsvp-controller.js').RSVPController|null>}
     */
    static async createRSVPController(container, rsvpFacade, validationService) {
        try {
            const { RSVPController } = await import('./rsvp-controller.js');

            const controller = new RSVPController(container, rsvpFacade, validationService, {
                autoSave: true,
                showConfirmation: true,
                enableValidation: true,
                allowReconfirmation: window.WEDDING_CONFIG?.rsvpForm?.allowReconfirmation ?? false
            });
            await controller.init();
            return controller;
        } catch {
            return null;
        }
    }

    /**
     * Crea e inicializa un CarouselController.
     * @param {HTMLElement} element - El elemento del DOM para el carrusel.
     * @param {import('../../core/services/configuration-service.js').ConfigurationService} configurationService - El servicio de configuración.
     * @returns {Promise<import('./carousel-controller.js').CarouselController|null>}
     */
    static async createCarouselController(element, configurationService) {
        try {
            const { CarouselController } = await import('./carousel-controller.js');
            const config = configurationService?.getConfig() || {};
            const carouselConfig = config.carouselSection?.carousel || {};
            const controller = new CarouselController(element, {
                autoPlay: carouselConfig.enableAutoPlay !== false,
                autoPlayInterval: carouselConfig.autoPlayDelay || 5000,
                animationDuration: carouselConfig.animationDuration || 600,
                loop: true,
                showDots: carouselConfig.showIndicators !== false,
                showArrows: carouselConfig.showNavigationButtons !== false,
                swipeEnabled: carouselConfig.enableSwipe !== false,
                keyboardEnabled: carouselConfig.enableKeyboard !== false
            });
            await controller.init();
            return controller;
        } catch {
            return null;
        }
    }

    /**
     * Crea e inicializa el ScrollAnimationController.
     * @param {HTMLElement} container - El contenedor principal de la aplicación.
     * @returns {Promise<import('./scroll-animation-controller.js').ScrollAnimationController|null>}
     */
    static async createScrollAnimationController(container) {
        try {
            const { ScrollAnimationController } = await import('./scroll-animation-controller.js');
            const controller = new ScrollAnimationController(container);
            await controller.init();
            return controller;
        } catch {
            return null;
        }
    }
}
