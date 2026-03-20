/**
 * Componente de Menú Móvil
 * Maneja la funcionalidad del menú hamburguesa
 */

export class MobileMenuComponent {
    constructor() {
        this.navToggle = null;
        this.navMenu = null;
        this.navLinks = [];
        this.isOpen = false;
        this.isInitialized = false;
    }

    /**
     * Inicializa el componente
     */
    init() {
        if (this.isInitialized) {
            return;
        }

        console.log('📱 Initializing MobileMenuComponent...');

        // Obtener elementos del DOM
        this.navToggle = document.getElementById('navToggle');
        this.navMenu = document.getElementById('navMenu');
        this.navLinks = document.querySelectorAll('.nav-link');

        if (!this.navToggle || !this.navMenu) {
            console.warn('Mobile menu elements not found');
            return;
        }

        // Inicializar atributos ARIA
        this.navToggle.setAttribute('aria-expanded', 'false');
        this.navToggle.setAttribute('aria-controls', 'navMenu');
        this.navMenu.setAttribute('aria-hidden', 'true');

        // Configurar event listeners
        this.setupEventListeners();

        this.isInitialized = true;
        console.log('✅ MobileMenuComponent initialized');
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Toggle del menú
        this.navToggle.addEventListener('click', e => {
            e.preventDefault();
            this.toggle();
        });

        // Cerrar menú al hacer clic en un enlace
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isOpen) {
                    this.close();
                }
            });
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', e => {
            if (
                this.isOpen &&
                !this.navMenu.contains(e.target) &&
                !this.navToggle.contains(e.target)
            ) {
                this.close();
            }
        });

        // Cerrar menú con tecla Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Manejar cambios de tamaño de ventana
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1199 && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Alterna el estado del menú
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Abre el menú
     */
    open() {
        if (this.isOpen) {
            return;
        }

        this.isOpen = true;
        this.navToggle.classList.add('active');
        this.navToggle.setAttribute('aria-expanded', 'true');
        this.navMenu.classList.add('active');
        this.navMenu.setAttribute('aria-hidden', 'false');
        document.body.classList.add('menu-open');

        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';

        // Focus en el primer enlace
        if (this.navLinks.length > 0) {
            setTimeout(() => this.navLinks[0].focus(), 100);
        }

        console.log('📱 Mobile menu opened');
    }

    /**
     * Cierra el menú
     */
    close() {
        if (!this.isOpen) {
            return;
        }

        this.isOpen = false;
        this.navToggle.classList.remove('active');
        this.navToggle.setAttribute('aria-expanded', 'false');
        this.navMenu.classList.remove('active');
        this.navMenu.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('menu-open');

        // Restaurar scroll del body
        document.body.style.overflow = '';

        // Devolver el foco al botón
        this.navToggle.focus();

        console.log('📱 Mobile menu closed');
    }

    /**
     * Verifica si el menú está abierto
     * @returns {boolean}
     */
    isMenuOpen() {
        return this.isOpen;
    }

    /**
     * Destruye el componente
     */
    destroy() {
        if (this.isOpen) {
            this.close();
        }

        this.navToggle = null;
        this.navMenu = null;
        this.navLinks = [];
        this.isInitialized = false;

        console.log('🗑️ MobileMenuComponent destroyed');
    }
}
