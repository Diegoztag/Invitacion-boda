/**
 * Controlador de Animaciones de Scroll
 * Maneja las animaciones de elementos al entrar en el viewport
 */

export class ScrollAnimationController {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            threshold: 0.2,
            rootMargin: '0px',
            animationClass: 'animate-in',
            selector: '.itinerary-item',
            ...options
        };
        
        this.observer = null;
        this.isInitialized = false;
    }
    
    /**
     * Inicializa el controlador
     */
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        console.log('✨ Initializing ScrollAnimationController...');
        
        this.setupObserver();
        this.observeElements();
        
        this.isInitialized = true;
        console.log('✅ ScrollAnimationController initialized');
    }
    
    /**
     * Configura el IntersectionObserver
     */
    setupObserver() {
        const options = {
            root: null, // viewport
            rootMargin: this.options.rootMargin,
            threshold: this.options.threshold
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    // Dejar de observar una vez animado si solo queremos que se anime una vez
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);
    }
    
    /**
     * Observa los elementos que coinciden con el selector
     */
    observeElements() {
        const elements = this.container.querySelectorAll(this.options.selector);
        
        elements.forEach(element => {
            this.observer.observe(element);
        });
        
        console.log(`👀 Observing ${elements.length} elements for scroll animation`);
    }
    
    /**
     * Anima un elemento añadiendo la clase configurada
     * @param {HTMLElement} element - Elemento a animar
     */
    animateElement(element) {
        element.classList.add(this.options.animationClass);
    }
    
    /**
     * Refresca los elementos observados (útil si se añade contenido dinámicamente)
     */
    refresh() {
        if (this.observer) {
            this.observer.disconnect();
            this.observeElements();
        }
    }
    
    /**
     * Destruye el controlador
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.isInitialized = false;
        console.log('🗑️ ScrollAnimationController destroyed');
    }
}
