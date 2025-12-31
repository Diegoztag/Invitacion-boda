// admin/js/performance.js - Optimizaciones de rendimiento para el panel de administración

/**
 * Utilidades y optimizaciones de rendimiento
 */

/**
 * Función debounce mejorada con opción inmediata
 * @param {Function} func - Función a la que aplicar debounce
 * @param {number} wait - Tiempo de espera en milisegundos
 * @param {boolean} immediate - Ejecutar en el borde inicial
 * @returns {Function} Función con debounce aplicado
 */
export function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func(...args);
    };
}

/**
 * Función throttle para limitar la tasa de ejecución
 * @param {Function} func - Función a la que aplicar throttle
 * @param {number} limit - Límite de tiempo en milisegundos
 * @returns {Function} Función con throttle aplicado
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Polyfill para requestIdleCallback
 * @param {Function} callback - Callback a ejecutar
 * @returns {number} ID de la solicitud
 */
export const requestIdleCallback = window.requestIdleCallback || 
    function(callback) {
        const start = Date.now();
        return setTimeout(() => {
            callback({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
            });
        }, 1);
    };

/**
 * Polyfill para cancelIdleCallback
 * @param {number} id - ID de solicitud a cancelar
 */
export const cancelIdleCallback = window.cancelIdleCallback || 
    function(id) {
        clearTimeout(id);
    };

/**
 * Gestor de Caché del DOM
 * Almacena en caché elementos del DOM accedidos frecuentemente
 */
export class DOMCache {
    constructor() {
        this.cache = new Map();
        this.observers = new Map();
    }
    
    /**
     * Obtener elemento del caché o consultar el DOM
     * @param {string} selector - Selector CSS
     * @param {boolean} forceRefresh - Forzar actualización del caché
     * @returns {Element|null} Elemento del DOM
     */
    get(selector, forceRefresh = false) {
        if (!forceRefresh && this.cache.has(selector)) {
            return this.cache.get(selector);
        }
        
        const element = document.querySelector(selector);
        if (element) {
            this.cache.set(selector, element);
            this.observeElement(selector, element);
        }
        
        return element;
    }
    
    /**
     * Obtener múltiples elementos del caché o consultar el DOM
     * @param {string} selector - Selector CSS
     * @param {boolean} forceRefresh - Forzar actualización del caché
     * @returns {NodeList} Elementos del DOM
     */
    getAll(selector, forceRefresh = false) {
        const cacheKey = `all:${selector}`;
        
        if (!forceRefresh && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const elements = document.querySelectorAll(selector);
        this.cache.set(cacheKey, elements);
        
        return elements;
    }
    
    /**
     * Observar elemento para detectar su eliminación del DOM
     * @param {string} selector - Selector CSS
     * @param {Element} element - Elemento del DOM
     */
    observeElement(selector, element) {
        if (this.observers.has(selector)) return;
        
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.removedNodes) {
                    if (node === element || node.contains(element)) {
                        this.cache.delete(selector);
                        observer.disconnect();
                        this.observers.delete(selector);
                        break;
                    }
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        this.observers.set(selector, observer);
    }
    
    /**
     * Limpiar caché
     */
    clear() {
        this.cache.clear();
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

/**
 * Gestor de Delegación de Eventos
 * Maneja eventos eficientemente usando delegación
 */
export class EventDelegator {
    constructor(rootElement = document.body) {
        this.root = rootElement;
        this.handlers = new Map();
        this.activeListeners = new Map();
    }
    
    /**
     * Agregar listener de evento delegado
     * @param {string} eventType - Tipo de evento (ej: 'click')
     * @param {string} selector - Selector CSS para elementos objetivo
     * @param {Function} handler - Función manejadora del evento
     * @returns {Function} Función para remover el listener
     */
    on(eventType, selector, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Map());
            this.addRootListener(eventType);
        }
        
        const eventHandlers = this.handlers.get(eventType);
        if (!eventHandlers.has(selector)) {
            eventHandlers.set(selector, new Set());
        }
        
        eventHandlers.get(selector).add(handler);
        
        // Retornar función para remover este handler específico
        return () => this.off(eventType, selector, handler);
    }
    
    /**
     * Remover listener de evento delegado
     * @param {string} eventType - Tipo de evento
     * @param {string} selector - Selector CSS
     * @param {Function} handler - Función manejadora del evento
     */
    off(eventType, selector, handler) {
        const eventHandlers = this.handlers.get(eventType);
        if (!eventHandlers) return;
        
        const selectorHandlers = eventHandlers.get(selector);
        if (!selectorHandlers) return;
        
        selectorHandlers.delete(handler);
        
        // Limpiar sets vacíos
        if (selectorHandlers.size === 0) {
            eventHandlers.delete(selector);
        }
        
        if (eventHandlers.size === 0) {
            this.handlers.delete(eventType);
            this.removeRootListener(eventType);
        }
    }
    
    /**
     * Agregar listener raíz para tipo de evento
     * @param {string} eventType - Tipo de evento
     */
    addRootListener(eventType) {
        const listener = (event) => {
            const eventHandlers = this.handlers.get(eventType);
            if (!eventHandlers) return;
            
            for (const [selector, handlers] of eventHandlers) {
                const target = event.target.closest(selector);
                if (target && this.root.contains(target)) {
                    handlers.forEach(handler => {
                        try {
                            handler.call(target, event);
                        } catch (error) {
                            console.error('Error en manejador de evento delegado:', error);
                        }
                    });
                }
            }
        };
        
        this.root.addEventListener(eventType, listener);
        this.activeListeners.set(eventType, listener);
    }
    
    /**
     * Remover listener raíz para tipo de evento
     * @param {string} eventType - Tipo de evento
     */
    removeRootListener(eventType) {
        const listener = this.activeListeners.get(eventType);
        if (listener) {
            this.root.removeEventListener(eventType, listener);
            this.activeListeners.delete(eventType);
        }
    }
    
    /**
     * Limpiar todos los listeners de eventos
     */
    clear() {
        this.activeListeners.forEach((listener, eventType) => {
            this.root.removeEventListener(eventType, listener);
        });
        
        this.handlers.clear();
        this.activeListeners.clear();
    }
}

/**
 * Lista Virtual para renderizar grandes conjuntos de datos
 * Solo renderiza elementos visibles para mejor rendimiento
 */
export class VirtualList {
    constructor(options) {
        this.container = options.container;
        this.itemHeight = options.itemHeight || 50;
        this.renderItem = options.renderItem;
        this.items = [];
        this.visibleRange = { start: 0, end: 0 };
        
        this.scrollHandler = throttle(() => this.updateVisibleRange(), 100);
        this.resizeHandler = debounce(() => this.updateVisibleRange(), 250);
        
        this.init();
    }
    
    init() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        
        this.content = document.createElement('div');
        this.content.style.position = 'relative';
        this.container.appendChild(this.content);
        
        this.container.addEventListener('scroll', this.scrollHandler);
        window.addEventListener('resize', this.resizeHandler);
        
        this.updateVisibleRange();
    }
    
    /**
     * Establecer elementos a renderizar
     * @param {Array} items - Array de elementos
     */
    setItems(items) {
        this.items = items;
        this.content.style.height = `${items.length * this.itemHeight}px`;
        this.updateVisibleRange();
    }
    
    /**
     * Actualizar rango visible basado en la posición del scroll
     */
    updateVisibleRange() {
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;
        
        const start = Math.floor(scrollTop / this.itemHeight);
        const end = Math.ceil((scrollTop + containerHeight) / this.itemHeight);
        
        // Agregar buffer para scroll más suave
        const bufferSize = 5;
        this.visibleRange = {
            start: Math.max(0, start - bufferSize),
            end: Math.min(this.items.length, end + bufferSize)
        };
        
        this.render();
    }
    
    /**
     * Renderizar elementos visibles
     */
    render() {
        // Limpiar elementos existentes
        this.content.innerHTML = '';
        
        // Renderizar solo elementos visibles
        for (let i = this.visibleRange.start; i < this.visibleRange.end; i++) {
            const item = this.items[i];
            if (!item) continue;
            
            const element = this.renderItem(item, i);
            element.style.position = 'absolute';
            element.style.top = `${i * this.itemHeight}px`;
            element.style.height = `${this.itemHeight}px`;
            element.style.width = '100%';
            
            this.content.appendChild(element);
        }
    }
    
    /**
     * Destruir lista virtual
     */
    destroy() {
        this.container.removeEventListener('scroll', this.scrollHandler);
        window.removeEventListener('resize', this.resizeHandler);
        this.content.remove();
    }
}

/**
 * Cargador de Imágenes Diferido
 * Carga imágenes solo cuando son visibles
 */
export class LazyImageLoader {
    constructor(options = {}) {
        this.rootMargin = options.rootMargin || '50px';
        this.threshold = options.threshold || 0.01;
        this.images = new Set();
        
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                rootMargin: this.rootMargin,
                threshold: this.threshold
            }
        );
    }
    
    /**
     * Observar imagen para carga diferida
     * @param {HTMLImageElement} img - Elemento de imagen
     */
    observe(img) {
        if (img.dataset.src) {
            this.images.add(img);
            this.observer.observe(img);
        }
    }
    
    /**
     * Manejar cambios de intersección
     * @param {Array} entries - Entradas del intersection observer
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
            }
        });
    }
    
    /**
     * Cargar imagen
     * @param {HTMLImageElement} img - Elemento de imagen
     */
    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;
        
        // Crear nueva imagen para precargar
        const newImg = new Image();
        newImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            delete img.dataset.src;
            
            this.observer.unobserve(img);
            this.images.delete(img);
        };
        
        newImg.onerror = () => {
            img.classList.add('error');
            this.observer.unobserve(img);
            this.images.delete(img);
        };
        
        newImg.src = src;
    }
    
    /**
     * Desconectar observador
     */
    disconnect() {
        this.observer.disconnect();
        this.images.clear();
    }
}

// Crear instancias singleton
export const domCache = new DOMCache();
export const eventDelegator = new EventDelegator();
export const lazyImageLoader = new LazyImageLoader();

// Utilidades de monitoreo de rendimiento
export const performanceMonitor = {
    /**
     * Medir tiempo de ejecución de función
     * @param {string} name - Nombre de la medición
     * @param {Function} fn - Función a medir
     * @returns {*} Resultado de la función
     */
    measure(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`[Rendimiento] ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    },
    
    /**
     * Crear marca de rendimiento
     * @param {string} name - Nombre de la marca
     */
    mark(name) {
        if (performance.mark) {
            performance.mark(name);
        }
    },
    
    /**
     * Medir entre marcas
     * @param {string} name - Nombre de la medición
     * @param {string} startMark - Nombre de la marca inicial
     * @param {string} endMark - Nombre de la marca final
     */
    measureBetween(name, startMark, endMark) {
        if (performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name)[0];
                console.log(`[Rendimiento] ${name}: ${measure.duration.toFixed(2)}ms`);
            } catch (e) {
                console.error('Error en medición de rendimiento:', e);
            }
        }
    }
};
