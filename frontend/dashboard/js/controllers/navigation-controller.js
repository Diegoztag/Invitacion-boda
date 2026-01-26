/**
 * Navigation Controller
 * Maneja toda la lógica de navegación entre secciones del admin
 */

export class NavigationController {
    constructor(dashboardController, invitationsController) {
        this.dashboardController = dashboardController;
        this.invitationsController = invitationsController;
        this.currentSection = 'dashboard';
        this.isInitialized = false;
    }

    /**
     * Inicializa el controlador de navegación
     */
    async init() {
        this.setupEventListeners();
        this.initializeFromHash();
        this.isInitialized = true;
    }

    /**
     * Configura los event listeners de navegación
     */
    setupEventListeners() {
        // Mobile Menu Toggle
        const mobileMenuBtn = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (mobileMenuBtn && sidebar && overlay) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
                mobileMenuBtn.classList.toggle('active');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
            
            // Close sidebar when clicking a nav item on mobile
            const navItems = sidebar.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('active');
                        overlay.classList.remove('active');
                        mobileMenuBtn.classList.remove('active');
                    }
                });
            });
        }

        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.hasAttribute('href')) {
                e.preventDefault();
                const section = navItem.getAttribute('href').substring(1);
                this.navigateToSection(section);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.navigateToSection(e.state.section, false);
            } else {
                this.initializeFromHash();
            }
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            if (!this.isInitialized) return;
            this.initializeFromHash();
        });
    }

    /**
     * Inicializa la sección basada en el hash de la URL
     */
    initializeFromHash() {
        const hash = window.location.hash.substring(1);
        const section = hash || 'dashboard';
        this.navigateToSection(section, false);
    }

    /**
     * Navega a una sección específica
     */
    async navigateToSection(section, updateHistory = true) {
        if (this.currentSection === section) return;

        // Validate section
        const validSections = ['dashboard', 'invitations'];
        if (!validSections.includes(section)) {
            section = 'dashboard';
        }

        // Update URL and history
        if (updateHistory) {
            const newUrl = `${window.location.pathname}#${section}`;
            history.pushState({ section }, '', newUrl);
        }

        // Update navigation UI
        this.updateNavigationUI(section);

        // Hide all sections
        this.hideAllSections();

        // Show target section and load data
        await this.showSection(section);

        // Update current section
        this.currentSection = section;
    }

    /**
     * Actualiza la UI de navegación
     */
    updateNavigationUI(activeSection) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current section
        const activeNavItem = document.querySelector(`.nav-item[href="#${activeSection}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update page title
        this.updatePageTitle(activeSection);
    }

    /**
     * Actualiza el título de la página
     */
    updatePageTitle(section) {
        const titles = {
            dashboard: 'Dashboard - Admin Boda',
            invitations: 'Invitaciones - Admin Boda'
        };

        document.title = titles[section] || 'Admin Boda';
    }

    /**
     * Oculta todas las secciones
     */
    hideAllSections() {
        const sections = ['dashboard', 'invitations'];
        sections.forEach(section => {
            const sectionElement = document.getElementById(section);
            if (sectionElement) {
                sectionElement.style.display = 'none';
            }
        });
    }

    /**
     * Muestra una sección específica y carga sus datos
     */
    async showSection(section) {
        const sectionElement = document.getElementById(section);
        if (!sectionElement) return;

        // Show section
        sectionElement.style.display = 'block';

        // Load section-specific data
        try {
            switch (section) {
                case 'dashboard':
                    await this.loadDashboardSection();
                    break;
                case 'invitations':
                    await this.loadInvitationsSection();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${section} section:`, error);
        }

        // Trigger section-specific initialization if needed
        this.triggerSectionInit(section);
    }

    /**
     * Carga la sección del dashboard
     */
    async loadDashboardSection() {
        if (this.dashboardController) {
            await this.dashboardController.loadDashboardData();
        }
    }

    /**
     * Carga la sección de invitaciones
     */
    async loadInvitationsSection() {
        if (this.invitationsController) {
            await this.invitationsController.loadInvitationsSectionData();
        }
    }

    /**
     * Dispara la inicialización específica de la sección
     */
    triggerSectionInit(section) {
        // Dispatch custom event for section change
        document.dispatchEvent(new CustomEvent('sectionChanged', {
            detail: { section, previousSection: this.currentSection }
        }));

        // Section-specific initialization
        switch (section) {
            case 'dashboard':
                this.initDashboardSection();
                break;
            case 'invitations':
                this.initInvitationsSection();
                break;
        }
    }

    /**
     * Inicializa elementos específicos del dashboard
     */
    initDashboardSection() {
        // Re-initialize responsive elements
        if (this.dashboardController) {
            this.dashboardController.updateResponsiveLabels();
        }

        // Focus on search if available
        const searchInput = document.querySelector('#dashboard input[type="search"]');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    }

    /**
     * Inicializa elementos específicos de invitaciones
     */
    initInvitationsSection() {
        // Focus on search input
        const searchInput = document.querySelector('#invitations #searchInput');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }

        // Initialize any section-specific components
        this.initInvitationsComponents();
    }

    /**
     * Inicializa componentes específicos de invitaciones
     */
    initInvitationsComponents() {
        // Initialize tooltips, dropdowns, etc.
        // This can be expanded as needed
    }

    /**
     * Obtiene la sección actual
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Verifica si una sección está activa
     */
    isActiveSection(section) {
        return this.currentSection === section;
    }

    /**
     * Navega al dashboard
     */
    goToDashboard() {
        this.navigateToSection('dashboard');
    }

    /**
     * Navega a invitaciones
     */
    goToInvitations() {
        this.navigateToSection('invitations');
    }

    /**
     * Maneja errores de navegación
     */
    handleNavigationError(error, section) {
        console.error(`Navigation error for section ${section}:`, error);
        
        // Fallback to dashboard if current section fails
        if (section !== 'dashboard') {
            this.navigateToSection('dashboard');
        }
    }

    /**
     * Limpia recursos del controlador
     */
    cleanup() {
        // Remove event listeners if needed
        this.isInitialized = false;
    }
}
