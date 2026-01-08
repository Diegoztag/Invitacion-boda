/**
 * Componente de Animaciones del Itinerario
 * Maneja las animaciones de entrada y scroll del itinerario
 */

export class ItineraryAnimations {
    constructor() {
        this.items = [];
        this.observer = null;
        this.isInitialized = false;
        this.animationDelay = 100; // ms entre animaciones
    }

    /**
     * Inicializa las animaciones del itinerario
     */
    init() {
        if (this.isInitialized) {
            return;
        }

        console.log('🎭 Initializing Itinerary Animations...');

        // Buscar elementos del itinerario
        this.findItineraryElements();

        if (this.items.length === 0) {
            console.warn('No itinerary items found for animation');
            return;
        }

        // Configurar Intersection Observer para animaciones de scroll
        this.setupScrollAnimations();

        // Configurar animaciones iniciales
        this.setupInitialAnimations();

        this.isInitialized = true;
        console.log(`✅ Itinerary Animations initialized with ${this.items.length} items`);
    }

    /**
     * Busca y almacena los elementos del itinerario
     */
    findItineraryElements() {
        const timeline = document.querySelector('.itinerary-timeline');
        if (!timeline) {
            console.warn('Itinerary timeline not found');
            return;
        }

        const items = timeline.querySelectorAll('.itinerary-item');
        this.items = Array.from(items).map((item, index) => ({
            element: item,
            index,
            dot: item.querySelector('.itinerary-dot'),
            content: item.querySelector('.itinerary-content'),
            time: item.querySelector('.itinerary-time'),
            isVisible: false,
            hasAnimated: false
        }));

        // Agregar clases necesarias y elementos faltantes
        this.items.forEach(item => {
            // Agregar dot si no existe
            if (!item.dot) {
                const dot = document.createElement('div');
                dot.className = 'itinerary-dot';
                item.element.appendChild(dot);
                item.dot = dot;
            }

            // Agregar clases iniciales
            item.element.classList.add('itinerary-animate');
            
            // Estado inicial: oculto
            item.element.style.opacity = '0';
            item.element.style.transform = 'translateX(40px)';
        });
    }

    /**
     * Configura las animaciones de scroll usando Intersection Observer
     */
    setupScrollAnimations() {
        const options = {
            root: null,
            rootMargin: '-10% 0px -10% 0px', // Trigger cuando el elemento esté 10% visible
            threshold: 0.3
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const item = this.items.find(item => item.element === entry.target);
                if (!item) return;

                if (entry.isIntersecting && !item.hasAnimated) {
                    this.animateItemIn(item);
                }
            });
        }, options);

        // Observar todos los elementos
        this.items.forEach(item => {
            this.observer.observe(item.element);
        });
    }

    /**
     * Configura las animaciones iniciales (entrada secuencial)
     */
    setupInitialAnimations() {
        // Verificar si la sección del itinerario está visible al cargar
        const itinerarySection = document.getElementById('itinerario');
        if (!itinerarySection) return;

        const rect = itinerarySection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible) {
            // Si la sección está visible al cargar, animar inmediatamente
            setTimeout(() => {
                this.animateAllItemsSequentially();
            }, 500);
        }
    }

    /**
     * Anima un elemento individual
     * @param {Object} item - Elemento del itinerario
     */
    animateItemIn(item) {
        if (item.hasAnimated) return;

        item.hasAnimated = true;
        item.isVisible = true;

        // Animar entrada del elemento
        item.element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        item.element.style.opacity = '1';
        item.element.style.transform = 'translateX(0)';

        // Agregar clase para activar animaciones CSS
        setTimeout(() => {
            item.element.classList.add('animate-in');
        }, 100);

        // Animar el dot con retraso
        if (item.dot) {
            setTimeout(() => {
                item.dot.classList.add('animate-in');
            }, 200);
        }

        // Animar el contenido con retraso
        if (item.content) {
            setTimeout(() => {
                item.content.classList.add('animate-in');
            }, 300);
        }

        console.log(`🎭 Animated itinerary item ${item.index + 1}`);
    }

    /**
     * Anima todos los elementos secuencialmente
     */
    animateAllItemsSequentially() {
        this.items.forEach((item, index) => {
            setTimeout(() => {
                this.animateItemIn(item);
            }, index * this.animationDelay);
        });
    }

    /**
     * Resetea las animaciones
     */
    resetAnimations() {
        this.items.forEach(item => {
            item.hasAnimated = false;
            item.isVisible = false;
            item.element.classList.remove('animate-in');
            item.element.style.opacity = '0';
            item.element.style.transform = 'translateX(40px)';
            
            if (item.dot) {
                item.dot.classList.remove('animate-in');
            }
            
            if (item.content) {
                item.content.classList.remove('animate-in');
            }
        });
    }

    /**
     * Fuerza la animación de todos los elementos
     */
    forceAnimateAll() {
        this.resetAnimations();
        setTimeout(() => {
            this.animateAllItemsSequentially();
        }, 100);
    }

    /**
     * Actualiza las animaciones cuando se regenera el contenido
     */
    refresh() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.items = [];
        this.isInitialized = false;
        
        // Reinicializar
        setTimeout(() => {
            this.init();
        }, 100);
    }

    /**
     * Destruye el componente
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        this.items.forEach(item => {
            item.element.classList.remove('itinerary-animate', 'animate-in');
            item.element.style.opacity = '';
            item.element.style.transform = '';
            item.element.style.transition = '';
        });

        this.items = [];
        this.isInitialized = false;

        console.log('🗑️ Itinerary Animations destroyed');
    }

    /**
     * Verifica si las animaciones están activas
     * @returns {boolean}
     */
    isActive() {
        return this.isInitialized && this.items.length > 0;
    }

    /**
     * Obtiene el estado de las animaciones
     * @returns {Object}
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            itemCount: this.items.length,
            animatedCount: this.items.filter(item => item.hasAnimated).length,
            visibleCount: this.items.filter(item => item.isVisible).length
        };
    }
}

// Crear instancia global
const itineraryAnimations = new ItineraryAnimations();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar un poco para que otros componentes se inicialicen
        setTimeout(() => {
            itineraryAnimations.init();
        }, 1000);
    });
} else {
    // DOM ya está listo
    setTimeout(() => {
        itineraryAnimations.init();
    }, 1000);
}

// Exportar para uso en otros módulos
export default itineraryAnimations;

// Hacer disponible globalmente para debugging
window.ItineraryAnimations = itineraryAnimations;
