/**
 * Clase base Component
 * Proporciona funcionalidad común para todos los componentes de la aplicación
 */

export class Component {
    constructor(container = null) {
        this.container = container;
        this.eventListeners = new Map();
        this.isDestroyed = false;
        
        // Bind methods para mantener contexto
        this.emit = this.emit.bind(this);
        this.on = this.on.bind(this);
        this.off = this.off.bind(this);
        this.destroy = this.destroy.bind(this);
    }
    
    /**
     * Emite un evento personalizado
     * @param {string} eventName - Nombre del evento
     * @param {*} data - Datos del evento
     */
    emit(eventName, data = null) {
        if (this.isDestroyed) {
            console.warn(`Cannot emit event '${eventName}' on destroyed component`);
            return;
        }
        
        const listeners = this.eventListeners.get(eventName) || [];
        listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error(`Error in event listener for '${eventName}':`, error);
            }
        });
        
        // También emitir como evento DOM si hay container
        if (this.container && this.container.dispatchEvent) {
            const customEvent = new CustomEvent(eventName, {
                detail: data,
                bubbles: true,
                cancelable: true
            });
            this.container.dispatchEvent(customEvent);
        }
    }
    
    /**
     * Registra un listener para un evento
     * @param {string} eventName - Nombre del evento
     * @param {Function} callback - Función callback
     */
    on(eventName, callback) {
        if (this.isDestroyed) {
            console.warn(`Cannot add listener for '${eventName}' on destroyed component`);
            return;
        }
        
        if (typeof callback !== 'function') {
            console.error(`Callback for event '${eventName}' must be a function`);
            return;
        }
        
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        
        this.eventListeners.get(eventName).push(callback);
    }
    
    /**
     * Remueve un listener de un evento
     * @param {string} eventName - Nombre del evento
     * @param {Function} callback - Función callback a remover
     */
    off(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            return;
        }
        
        const listeners = this.eventListeners.get(eventName);
        const index = listeners.indexOf(callback);
        
        if (index > -1) {
            listeners.splice(index, 1);
        }
        
        // Si no quedan listeners, remover la entrada
        if (listeners.length === 0) {
            this.eventListeners.delete(eventName);
        }
    }
    
    /**
     * Remueve todos los listeners de un evento o todos los eventos
     * @param {string} eventName - Nombre del evento (opcional)
     */
    removeAllListeners(eventName = null) {
        if (eventName) {
            this.eventListeners.delete(eventName);
        } else {
            this.eventListeners.clear();
        }
    }
    
    /**
     * Encuentra un elemento dentro del container
     * @param {string} selector - Selector CSS
     * @returns {Element|null}
     */
    find(selector) {
        if (!this.container) {
            return document.querySelector(selector);
        }
        
        return this.container.querySelector(selector);
    }
    
    /**
     * Encuentra todos los elementos dentro del container
     * @param {string} selector - Selector CSS
     * @returns {NodeList}
     */
    findAll(selector) {
        if (!this.container) {
            return document.querySelectorAll(selector);
        }
        
        return this.container.querySelectorAll(selector);
    }
    
    /**
     * Añade una clase CSS al container
     * @param {string} className - Nombre de la clase
     */
    addClass(className) {
        if (this.container && this.container.classList) {
            this.container.classList.add(className);
        }
    }
    
    /**
     * Remueve una clase CSS del container
     * @param {string} className - Nombre de la clase
     */
    removeClass(className) {
        if (this.container && this.container.classList) {
            this.container.classList.remove(className);
        }
    }
    
    /**
     * Alterna una clase CSS en el container
     * @param {string} className - Nombre de la clase
     */
    toggleClass(className) {
        if (this.container && this.container.classList) {
            this.container.classList.toggle(className);
        }
    }
    
    /**
     * Verifica si el container tiene una clase CSS
     * @param {string} className - Nombre de la clase
     * @returns {boolean}
     */
    hasClass(className) {
        if (this.container && this.container.classList) {
            return this.container.classList.contains(className);
        }
        return false;
    }
    
    /**
     * Establece un atributo en el container
     * @param {string} name - Nombre del atributo
     * @param {string} value - Valor del atributo
     */
    setAttribute(name, value) {
        if (this.container && this.container.setAttribute) {
            this.container.setAttribute(name, value);
        }
    }
    
    /**
     * Obtiene un atributo del container
     * @param {string} name - Nombre del atributo
     * @returns {string|null}
     */
    getAttribute(name) {
        if (this.container && this.container.getAttribute) {
            return this.container.getAttribute(name);
        }
        return null;
    }
    
    /**
     * Remueve un atributo del container
     * @param {string} name - Nombre del atributo
     */
    removeAttribute(name) {
        if (this.container && this.container.removeAttribute) {
            this.container.removeAttribute(name);
        }
    }
    
    /**
     * Establece el contenido HTML del container
     * @param {string} html - Contenido HTML
     */
    setHTML(html) {
        if (this.container) {
            this.container.innerHTML = html;
        }
    }
    
    /**
     * Obtiene el contenido HTML del container
     * @returns {string}
     */
    getHTML() {
        if (this.container) {
            return this.container.innerHTML;
        }
        return '';
    }
    
    /**
     * Establece el contenido de texto del container
     * @param {string} text - Contenido de texto
     */
    setText(text) {
        if (this.container) {
            this.container.textContent = text;
        }
    }
    
    /**
     * Obtiene el contenido de texto del container
     * @returns {string}
     */
    getText() {
        if (this.container) {
            return this.container.textContent;
        }
        return '';
    }
    
    /**
     * Muestra el container
     */
    show() {
        if (this.container) {
            this.container.style.display = '';
            this.removeClass('hidden');
        }
    }
    
    /**
     * Oculta el container
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.addClass('hidden');
        }
    }
    
    /**
     * Alterna la visibilidad del container
     */
    toggle() {
        if (this.container) {
            if (this.container.style.display === 'none' || this.hasClass('hidden')) {
                this.show();
            } else {
                this.hide();
            }
        }
    }
    
    /**
     * Verifica si el container está visible
     * @returns {boolean}
     */
    isVisible() {
        if (!this.container) return false;
        
        return this.container.style.display !== 'none' && 
               !this.hasClass('hidden') &&
               this.container.offsetParent !== null;
    }
    
    /**
     * Añade un event listener DOM al container
     * @param {string} event - Tipo de evento
     * @param {Function} handler - Manejador del evento
     * @param {Object} options - Opciones del event listener
     */
    addEventListener(event, handler, options = {}) {
        if (this.container && this.container.addEventListener) {
            this.container.addEventListener(event, handler, options);
            
            // Guardar referencia para cleanup
            if (!this._domListeners) {
                this._domListeners = [];
            }
            this._domListeners.push({ event, handler, options });
        }
    }
    
    /**
     * Remueve un event listener DOM del container
     * @param {string} event - Tipo de evento
     * @param {Function} handler - Manejador del evento
     */
    removeEventListener(event, handler) {
        if (this.container && this.container.removeEventListener) {
            this.container.removeEventListener(event, handler);
        }
    }
    
    /**
     * Destruye el componente y limpia recursos
     */
    destroy() {
        if (this.isDestroyed) {
            return;
        }
        
        // Limpiar event listeners personalizados
        this.removeAllListeners();
        
        // Limpiar event listeners DOM
        if (this._domListeners) {
            this._domListeners.forEach(({ event, handler }) => {
                this.removeEventListener(event, handler);
            });
            this._domListeners = [];
        }
        
        // Marcar como destruido
        this.isDestroyed = true;
        
        // Limpiar referencia al container
        this.container = null;
        
        console.log(`Component destroyed: ${this.constructor.name}`);
    }
    
    /**
     * Verifica si el componente está destruido
     * @returns {boolean}
     */
    isDestroyed() {
        return this.isDestroyed;
    }
    
    /**
     * Obtiene información de debug del componente
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            className: this.constructor.name,
            isDestroyed: this.isDestroyed,
            hasContainer: !!this.container,
            eventListeners: Array.from(this.eventListeners.keys()),
            domListeners: this._domListeners ? this._domListeners.length : 0
        };
    }
}

/**
 * Clase base para componentes que manejan formularios
 */
export class FormComponent extends Component {
    constructor(container) {
        super(container);
        this.formData = new Map();
        this.validators = new Map();
        this.errors = new Map();
    }
    
    /**
     * Obtiene el valor de un campo del formulario
     * @param {string} fieldName - Nombre del campo
     * @returns {*}
     */
    getFieldValue(fieldName) {
        const field = this.find(`[name="${fieldName}"]`);
        if (!field) return null;
        
        if (field.type === 'checkbox') {
            return field.checked;
        } else if (field.type === 'radio') {
            const checked = this.find(`[name="${fieldName}"]:checked`);
            return checked ? checked.value : null;
        } else {
            return field.value;
        }
    }
    
    /**
     * Establece el valor de un campo del formulario
     * @param {string} fieldName - Nombre del campo
     * @param {*} value - Valor a establecer
     */
    setFieldValue(fieldName, value) {
        const field = this.find(`[name="${fieldName}"]`);
        if (!field) return;
        
        if (field.type === 'checkbox') {
            field.checked = !!value;
        } else if (field.type === 'radio') {
            const radio = this.find(`[name="${fieldName}"][value="${value}"]`);
            if (radio) radio.checked = true;
        } else {
            field.value = value;
        }
    }
    
    /**
     * Obtiene todos los datos del formulario
     * @returns {Object}
     */
    getFormData() {
        const form = this.container.tagName === 'FORM' ? this.container : this.find('form');
        if (!form) return {};
        
        const formData = new FormData(form);
        return Object.fromEntries(formData.entries());
    }
    
    /**
     * Valida el formulario
     * @returns {boolean}
     */
    validate() {
        this.errors.clear();
        let isValid = true;
        
        for (const [fieldName, validator] of this.validators) {
            const value = this.getFieldValue(fieldName);
            const result = validator(value);
            
            if (result !== true) {
                this.errors.set(fieldName, result);
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    /**
     * Añade un validador para un campo
     * @param {string} fieldName - Nombre del campo
     * @param {Function} validator - Función validadora
     */
    addValidator(fieldName, validator) {
        this.validators.set(fieldName, validator);
    }
    
    /**
     * Obtiene los errores de validación
     * @returns {Object}
     */
    getErrors() {
        return Object.fromEntries(this.errors);
    }
}
