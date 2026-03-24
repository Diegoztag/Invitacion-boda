import { NavigationController } from '../navigation-controller.js';
import { EVENTS } from '../../../shared/constants/events.js';

describe('NavigationController', () => {
    let container;
    let navController;

    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = `
            <section id="home" data-title="Home"></section>
            <section id="about" data-title="About"></section>
            <nav>
                <a href="#home">Home</a>
                <a href="#about">About</a>
            </nav>
        `;
        document.body.appendChild(container);

        const homeSection = container.querySelector('#home');
        const aboutSection = container.querySelector('#about');

        homeSection.getBoundingClientRect = jest.fn(() => ({
            top: 0,
            height: 600,
            bottom: 600
        }));

        aboutSection.getBoundingClientRect = jest.fn(() => ({
            top: 600,
            height: 600,
            bottom: 1200
        }));

        Object.defineProperty(window, 'pageYOffset', {
            value: 0,
            writable: true
        });

        Object.defineProperty(window, 'innerHeight', {
            value: 800,
            writable: true
        });

        // Prevent URL updates during test
        window.history.pushState({}, '', '/');

        // Mock scrollTo para compatibilidad con jsdom
        window.scrollTo = jest.fn();

        navController = new NavigationController(container, {
            smoothScroll: false,
            updateUrl: false,
            highlightActiveSection: true,
            scrollDebounce: 0
        });
    });

    afterEach(() => {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
        navController.destroy();
        window.location.hash = '';
    });

    it('should discover sections and nav items during initialization', async () => {
        await navController.init();

        expect(navController.isInitialized).toBe(true);
        expect(navController.sections.size).toBe(2);
        expect(navController.navItems.size).toBe(2);
        expect(navController.getSectionInfo('home')).not.toBeNull();
        expect(navController.getSectionInfo('about')).not.toBeNull();
    });

    it('should handle navigation by id and emit events', async () => {
        await navController.discoverSections();
        await navController.discoverNavItems();

        const navigatedSpy = jest.fn();
        navController.on(EVENTS.NAVIGATION.NAVIGATED, navigatedSpy);

        await navController.navigateToSection('about', false);

        expect(navController.getCurrentSection()).toBe('about');
        expect(navController.getSectionInfo('about').isVisible).toBe(false);
        expect(navigatedSpy).toHaveBeenCalledWith(expect.objectContaining({ section: 'about' }));

        // Validate nav item state updated
        const navItem = navController.navItems.get('about');
        expect(navItem.element.classList.contains('active')).toBe(true);
        expect(navItem.element.getAttribute('aria-current')).toBe('page');
    });

    it('should set active section manually and update nav item states', async () => {
        await navController.discoverSections();
        await navController.discoverNavItems();

        navController.setActiveSection('about');

        expect(navController.getCurrentSection()).toBe('about');

        const aboutNavItem = navController.navItems.get('about');
        expect(aboutNavItem.element.classList.contains('active')).toBe(true);
        expect(aboutNavItem.element.getAttribute('aria-current')).toBe('page');
    });

    it('should clean up listeners and state on destroy', async () => {
        await navController.init();

        navController.destroy();

        expect(navController.isInitialized).toBe(false);
        expect(navController.sections.size).toBe(0);
        expect(navController.navItems.size).toBe(0);
        expect(navController.container).toBeNull();
    });
});
