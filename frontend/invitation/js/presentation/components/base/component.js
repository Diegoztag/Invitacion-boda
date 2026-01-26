/**
 * Clase base para todos los componentes de la aplicación
 * Proporciona funcionalidad común como manejo de eventos y lifecycle
 */
export class Component {
    constructor(element) {
        this.element = element;
        this.events = new Map();
        this.isInitialized = false;
        this.isDestroyed = false;
    }
    
    /**
     * Inicializa el componente
     * Debe ser sobrescrito por las clases hijas
     */
    async init() {
        if (this.isInitialized) {
            console.warn(`Component ${this.constructor.name} is already initialized`);
            return;
        }
        
        this.isInitialized = true;
        console.log(`✅ ${this.constructor.name} initialized`);
    }
    
    /**
     * Renderiza el componente
     * Debe ser sobrescrito por las clases hijas si es necesario
     */
    render() {
        // Override in child classes if needed
    }
    
    /**
     * Destruye el componente y limpia recursos
     */
    destroy() {
        if (this.isDestroyed) {
            return;
        }
        
        this.removeAllEventListeners();
        this.events.clear();
        this.element = null;
        this.isDestroyed = true;
        this.isInitialized = false;
        
        console.log(`🗑️ ${this.constructor.name} destroyed`);
    }
    
    /**
     * Registra un event listener
     * @param {string} event - Nombre del evento
     * @param {Function} handler - Función manejadora
     * @param {Object} options - Opciones del event listener
     */
    on(event, handler, options = {}) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        const eventInfo = { handler, options };
        this.events.get(event).push(eventInfo);
        
        // Si el elemento existe, agregar el listener inmediatamente
        if (this.element) {
            this.element.addEventListener(event, handler, options);
        }
    }
    
    /**
     * Remueve un event listener específico
     * @param {string} event - Nombre del evento
     * @param {Function} handler - Función manejadora a remover
     */
    off(event, handler) {
        if (!this.events.has(event)) {
            return;
        }
        
        const eventHandlers = this.events.get(event);
        const index = eventHandlers.findIndex(item => item.handler === handler);
        
        if (index !== -1) {
            eventHandlers.splice(index, 1);
            
            if (this.element) {
                this.element.removeEventListener(event, handler);
            }
        }
    }
    
    /**
     * Emite un evento personalizado
     * @param {string} event - Nombre del evento
     * @param {*} data - Datos del evento
     */
    emit(event, data) {
        if (this.element) {
            const customEvent = new CustomEvent(event, { 
                detail: data,
                bubbles: true,
                cancelable: true
            });
            this.element.dispatchEvent(customEvent);
        }
    }
    
    /**
     * Remueve todos los event listeners
     */
    removeAllEventListeners() {
        if (!this.element) return;
        
        this.events.forEach((handlers, event) => {
            handlers.forEach(({ handler }) => {
                this.element.removeEventListener(event, handler);
            });
        });
    }
    
    /**
     * Verifica si el componente está inicializado
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized && !this.isDestroyed && this.element;
    }
    
    /**
     * Encuentra un elemento hijo por selector
     * @param {string} selector - Selector CSS
     * @returns {Element|null}
     */
    find(selector) {
        return this.element ? this.element.querySelector(selector) : null;
    }
    
    /**
     * Encuentra múltiples elementos hijos por selector
     * @param {string} selector - Selector CSS
     * @returns {NodeList}
     */
    findAll(selector) {
        return this.element ? this.element.querySelectorAll(selector) : [];
    }
    
    /**
     * Agrega una clase CSS al elemento
     * @param {string} className - Nombre de la clase
     */
    addClass(className) {
        if (this.element && className) {
            this.element.classList.add(className);
        }
    }
    
    /**
     * Remueve una clase CSS del elemento
     * @param {string} className - Nombre de la clase
     */
    removeClass(className) {
        if (this.element && className) {
            this.element.classList.remove(className);
        }
    }
    
    /**
     * Alterna una clase CSS en el elemento
     * @param {string} className - Nombre de la clase
     */
    toggleClass(className) {
        if (this.element && className) {
            this.element.classList.toggle(className);
        }
    }
    
    /**
     * Verifica si el elemento tiene una clase CSS
     * @param {string} className - Nombre de la clase
     * @returns {boolean}
     */
    hasClass(className) {
        return this.element ? this.element.classList.contains(className) : false;
    }
}
