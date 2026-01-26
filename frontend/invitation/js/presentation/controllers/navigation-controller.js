/**
 * Controlador de Navegación
 * Maneja la navegación entre secciones y el estado de la aplicación
 */

import { EVENTS } from '../../shared/constants/events.js';
import { SELECTORS } from '../../shared/constants/selectors.js';
import { DOMUtils } from '../../shared/utils/dom-utils.js';
import { debounce } from '../../shared/helpers/debounce.js';

export class NavigationController {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            smoothScroll: true,
            scrollOffset: 80, // Offset para header fijo
            updateUrl: true,
            highlightActiveSection: true,
            scrollDebounce: 100,
            ...options
        };
        
        this.sections = new Map();
        this.navItems = new Map();
        this.currentSection = null;
        this.isScrolling = false;
        this.scrollTimeout = null;
        
        // Debounced scroll handler
        this.debouncedScrollHandler = debounce(
            this.handleScroll.bind(this), 
            this.options.scrollDebounce
        );
        
        this.eventListeners = new Map();
        this.isInitialized = false;
    }
    
    /**
     * Inicializa el controlador
     */
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        console.log('🧭 Initializing NavigationController...');
        
        // Descubrir secciones y elementos de navegación
        this.discoverSections();
        this.discoverNavItems();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Configurar navegación inicial
        this.setupInitialNavigation();
        
        this.isInitialized = true;
        console.log('✅ NavigationController initialized');
    }
    
    /**
     * Descubre las secciones de la página
     */
    discoverSections() {
        const sectionElements = this.container.querySelectorAll('[data-section], section[id]');
        
        sectionElements.forEach(section => {
            const id = section.id || section.getAttribute('data-section');
            if (id) {
                this.sections.set(id, {
                    element: section,
                    id: id,
                    title: section.getAttribute('data-title') || id,
                    offset: 0,
                    isVisible: false
                });
            }
        });
        
        console.log(`📍 Discovered ${this.sections.size} sections`);
    }
    
    /**
     * Descubre los elementos de navegación
     */
    discoverNavItems() {
        const navLinks = this.container.querySelectorAll('a[href^="#"], [data-nav-target]');
        
        navLinks.forEach(link => {
            const target = link.getAttribute('href')?.substring(1) || 
                          link.getAttribute('data-nav-target');
            
            if (target && this.sections.has(target)) {
                this.navItems.set(target, {
                    element: link,
                    target: target,
                    isActive: false
                });
            }
        });
        
        console.log(`🔗 Discovered ${this.navItems.size} navigation items`);
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Click en elementos de navegación
        this.navItems.forEach((navItem, target) => {
            const clickHandler = (e) => {
                e.preventDefault();
                this.navigateToSection(target);
            };
            
            navItem.element.addEventListener('click', clickHandler);
            this.eventListeners.set(`nav-${target}`, {
                element: navItem.element,
                event: 'click',
                handler: clickHandler
            });
        });
        
        // Scroll para actualizar sección activa
        if (this.options.highlightActiveSection) {
            const scrollHandler = () => {
                if (!this.isScrolling) {
                    this.debouncedScrollHandler();
                }
            };
            
            window.addEventListener('scroll', scrollHandler, { passive: true });
            this.eventListeners.set('scroll', {
                element: window,
                event: 'scroll',
                handler: scrollHandler
            });
        }
        
        // Resize para recalcular offsets
        const resizeHandler = debounce(() => {
            this.updateSectionOffsets();
        }, 250);
        
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.set('resize', {
            element: window,
            event: 'resize',
            handler: resizeHandler
        });
        
        // Cambios en URL (back/forward)
        if (this.options.updateUrl) {
            const popstateHandler = (e) => {
                const hash = window.location.hash.substring(1);
                if (hash && this.sections.has(hash)) {
                    this.navigateToSection(hash, false); // No actualizar URL
                }
            };
            
            window.addEventListener('popstate', popstateHandler);
            this.eventListeners.set('popstate', {
                element: window,
                event: 'popstate',
                handler: popstateHandler
            });
        }
    }
    
    /**
     * Configura la navegación inicial
     */
    setupInitialNavigation() {
        // Actualizar offsets de secciones
        this.updateSectionOffsets();
        
        // Navegar a sección inicial si hay hash en URL
        const initialHash = window.location.hash.substring(1);
        if (initialHash && this.sections.has(initialHash)) {
            // Delay para permitir que la página se cargue completamente
            setTimeout(() => {
                this.navigateToSection(initialHash, false);
            }, 100);
        } else {
            // Determinar sección actual basada en scroll
            this.updateActiveSection();
        }
    }
    
    /**
     * Navega a una sección específica
     * @param {string} sectionId - ID de la sección
     * @param {boolean} updateUrl - Si actualizar la URL
     * @param {Object} options - Opciones adicionales
     */
    async navigateToSection(sectionId, updateUrl = true, options = {}) {
        const section = this.sections.get(sectionId);
        if (!section) {
            console.warn(`Section not found: ${sectionId}`);
            return;
        }
        
        console.log(`🧭 Navigating to section: ${sectionId}`);
        
        // Emitir evento antes de navegar
        this.emit(EVENTS.NAVIGATION.BEFORE_NAVIGATE, {
            from: this.currentSection,
            to: sectionId,
            section: section
        });
        
        // Calcular posición de scroll
        const targetPosition = this.calculateScrollPosition(section);
        
        // Realizar scroll
        await this.scrollToPosition(targetPosition, options);
        
        // Actualizar estado
        this.setActiveSection(sectionId);
        
        // Actualizar URL si es necesario
        if (updateUrl && this.options.updateUrl) {
            this.updateUrl(sectionId);
        }
        
        // Emitir evento después de navegar
        this.emit(EVENTS.NAVIGATION.NAVIGATED, {
            section: sectionId,
            element: section.element
        });
    }
    
    /**
     * Calcula la posición de scroll para una sección
     * @param {Object} section - Objeto de sección
     * @returns {number}
     */
    calculateScrollPosition(section) {
        const rect = section.element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        return scrollTop + rect.top - this.options.scrollOffset;
    }
    
    /**
     * Realiza scroll suave a una posición
     * @param {number} position - Posición de scroll
     * @param {Object} options - Opciones de scroll
     * @returns {Promise}
     */
    scrollToPosition(position, options = {}) {
        return new Promise((resolve) => {
            if (!this.options.smoothScroll) {
                window.scrollTo(0, position);
                resolve();
                return;
            }
            
            this.isScrolling = true;
            
            const startPosition = window.pageYOffset;
            const distance = position - startPosition;
            const duration = options.duration || 800;
            let startTime = null;
            
            const animateScroll = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                
                // Easing function (ease-in-out)
                const easeInOutQuad = progress < 0.5 
                    ? 2 * progress * progress 
                    : -1 + (4 - 2 * progress) * progress;
                
                const currentPosition = startPosition + (distance * easeInOutQuad);
                window.scrollTo(0, currentPosition);
                
                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                } else {
                    this.isScrolling = false;
                    resolve();
                }
            };
            
            requestAnimationFrame(animateScroll);
        });
    }
    
    /**
     * Maneja el evento de scroll
     */
    handleScroll() {
        this.updateActiveSection();
    }
    
    /**
     * Actualiza la sección activa basada en el scroll actual
     */
    updateActiveSection() {
        const scrollPosition = window.pageYOffset + this.options.scrollOffset + 50;
        let activeSection = null;
        let maxVisibleArea = 0;
        
        // Encontrar la sección más visible
        this.sections.forEach((section, id) => {
            const rect = section.element.getBoundingClientRect();
            const elementTop = window.pageYOffset + rect.top;
            const elementBottom = elementTop + rect.height;
            
            // Calcular área visible
            const visibleTop = Math.max(elementTop, window.pageYOffset);
            const visibleBottom = Math.min(elementBottom, window.pageYOffset + window.innerHeight);
            const visibleArea = Math.max(0, visibleBottom - visibleTop);
            
            section.isVisible = visibleArea > 0;
            
            // Si esta sección tiene más área visible, es la activa
            if (visibleArea > maxVisibleArea) {
                maxVisibleArea = visibleArea;
                activeSection = id;
            }
        });
        
        // Actualizar sección activa si cambió
        if (activeSection && activeSection !== this.currentSection) {
            this.setActiveSection(activeSection);
        }
    }
    
    /**
     * Establece la sección activa
     * @param {string} sectionId - ID de la sección
     */
    setActiveSection(sectionId) {
        const previousSection = this.currentSection;
        this.currentSection = sectionId;
        
        // Actualizar clases de navegación
        this.updateNavItemStates();
        
        // Emitir evento de cambio de sección
        if (previousSection !== sectionId) {
            this.emit(EVENTS.NAVIGATION.SECTION_CHANGED, {
                previous: previousSection,
                current: sectionId,
                section: this.sections.get(sectionId)
            });
        }
    }
    
    /**
     * Actualiza los estados visuales de los elementos de navegación
     */
    updateNavItemStates() {
        this.navItems.forEach((navItem, target) => {
            const isActive = target === this.currentSection;
            
            if (isActive !== navItem.isActive) {
                navItem.isActive = isActive;
                
                if (isActive) {
                    navItem.element.classList.add('active');
                    navItem.element.setAttribute('aria-current', 'page');
                } else {
                    navItem.element.classList.remove('active');
                    navItem.element.removeAttribute('aria-current');
                }
            }
        });
    }
    
    /**
     * Actualiza los offsets de las secciones
     */
    updateSectionOffsets() {
        this.sections.forEach((section) => {
            const rect = section.element.getBoundingClientRect();
            section.offset = window.pageYOffset + rect.top;
        });
    }
    
    /**
     * Actualiza la URL con el hash de la sección
     * @param {string} sectionId - ID de la sección
     */
    updateUrl(sectionId) {
        const newUrl = `${window.location.pathname}${window.location.search}#${sectionId}`;
        
        try {
            window.history.pushState({ section: sectionId }, '', newUrl);
        } catch (error) {
            console.warn('Could not update URL:', error);
        }
    }
    
    /**
     * Obtiene la sección activa actual
     * @returns {string|null}
     */
    getCurrentSection() {
        return this.currentSection;
    }
    
    /**
     * Obtiene información de una sección
     * @param {string} sectionId - ID de la sección
     * @returns {Object|null}
     */
    getSectionInfo(sectionId) {
        return this.sections.get(sectionId) || null;
    }
    
    /**
     * Obtiene todas las secciones
     * @returns {Map}
     */
    getAllSections() {
        return new Map(this.sections);
    }
    
    /**
     * Verifica si una sección existe
     * @param {string} sectionId - ID de la sección
     * @returns {boolean}
     */
    hasSection(sectionId) {
        return this.sections.has(sectionId);
    }
    
    /**
     * Obtiene las secciones visibles actualmente
     * @returns {string[]}
     */
    getVisibleSections() {
        const visible = [];
        this.sections.forEach((section, id) => {
            if (section.isVisible) {
                visible.push(id);
            }
        });
        return visible;
    }
    
    /**
     * Registra un listener para eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    on(event, callback) {
        if (!this.eventListeners.has(`custom-${event}`)) {
            this.eventListeners.set(`custom-${event}`, []);
        }
        this.eventListeners.get(`custom-${event}`).push(callback);
    }
    
    /**
     * Remueve un listener de eventos
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función callback
     */
    off(event, callback) {
        const listeners = this.eventListeners.get(`custom-${event}`);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emite un evento
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos del evento
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(`custom-${event}`);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
        
        // También emitir en el contenedor como evento DOM
        if (this.container) {
            const customEvent = new CustomEvent(event, { detail: data });
            this.container.dispatchEvent(customEvent);
        }
    }
    
    /**
     * Actualiza las opciones del controlador
     * @param {Object} newOptions - Nuevas opciones
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        // Reconfigurar si es necesario
        if (newOptions.scrollOffset !== undefined) {
            this.updateSectionOffsets();
        }
        
        console.log('⚙️ Navigation options updated');
    }
    
    /**
     * Fuerza una actualización de la navegación
     */
    refresh() {
        this.updateSectionOffsets();
        this.updateActiveSection();
        console.log('🔄 Navigation refreshed');
    }
    
    /**
     * Destruye el controlador y limpia recursos
     */
    destroy() {
        // Remover todos los event listeners
        this.eventListeners.forEach((listener, key) => {
            if (listener.element && listener.handler) {
                listener.element.removeEventListener(listener.event, listener.handler);
            }
        });
        
        // Limpiar referencias
        this.eventListeners.clear();
        this.sections.clear();
        this.navItems.clear();
        this.container = null;
        this.currentSection = null;
        this.debouncedScrollHandler = null;
        
        this.isInitialized = false;
        console.log('🗑️ NavigationController destroyed');
    }
}
