/**
 * Component Factory
 * Encapsula la lógica de creación de componentes de UI.
 */
export class ComponentFactory {
    /**
     * Crea e inicializa un componente de cuenta regresiva.
     * @param {HTMLElement} element - El elemento del DOM para el componente.
     * @returns {Promise<import('./ui/countdown.js').CountdownComponent|null>}
     */
    static async createCountdown(element) {
        try {
            const { CountdownComponent } = await import('./ui/countdown.js');
            const targetDate = element.getAttribute('data-countdown');
            const countdown = new CountdownComponent(element, targetDate);
            await countdown.init();
            return countdown;
        } catch (error) {
            console.error('Error creating CountdownComponent:', error);
            return null;
        }
    }

    /**
     * Crea e inicializa un componente modal.
     * @param {HTMLElement} element - El elemento del DOM para el componente.
     * @returns {Promise<import('./ui/modal.js').ModalComponent|null>}
     */
    static async createModal(element) {
        try {
            const { ModalComponent } = await import('./ui/modal.js');
            const modal = new ModalComponent(element);
            await modal.init();
            return modal;
        } catch (error) {
            console.error('Error creating ModalComponent:', error);
            return null;
        }
    }

    /**
     * Crea e inicializa el componente de menú móvil.
     * @returns {Promise<import('./ui/mobile-menu.js').MobileMenuComponent|null>}
     */
    static async createMobileMenu() {
        try {
            const { MobileMenuComponent } = await import('./ui/mobile-menu.js');
            const mobileMenu = new MobileMenuComponent();
            mobileMenu.init();
            return mobileMenu;
        } catch (error) {
            console.error('Error creating MobileMenuComponent:', error);
            return null;
        }
    }

    /**
     * Crea e inicializa un componente de loader.
     * @param {HTMLElement} element - El elemento del DOM para el componente.
     * @returns {Promise<import('./ui/loader.js').LoaderComponent|null>}
     */
    static async createLoader(element) {
        try {
            const { LoaderComponent } = await import('./ui/loader.js');
            const loader = new LoaderComponent(element);
            await loader.init();
            return loader;
        } catch (error) {
            console.error('Error creating LoaderComponent:', error);
            return null;
        }
    }
}
