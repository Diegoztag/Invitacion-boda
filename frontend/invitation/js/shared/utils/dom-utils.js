/**
 * Utilidades para manipulación del DOM
 * Proporciona métodos seguros y consistentes para trabajar con elementos DOM
 */
export class DOMUtils {
    /**
     * Obtiene un elemento por su ID
     * @param {string} id - ID del elemento
     * @returns {Element|null}
     */
    static getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    }
    
    /**
     * Obtiene elementos por selector CSS
     * @param {string} selector - Selector CSS
     * @param {Element} context - Contexto de búsqueda (opcional)
     * @returns {Element|null}
     */
    static querySelector(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return null;
        }
    }
    
    /**
     * Obtiene múltiples elementos por selector CSS
     * @param {string} selector - Selector CSS
     * @param {Element} context - Contexto de búsqueda (opcional)
     * @returns {NodeList}
     */
    static querySelectorAll(selector, context = document) {
        try {
            return context.querySelectorAll(selector);
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return [];
        }
    }
    
    /**
     * Establece el contenido de texto de un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} text - Texto a establecer
     */
    static setTextContent(elementOrId, text) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element) {
            element.textContent = text || '';
        }
    }
    
    /**
     * Establece el HTML interno de un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} html - HTML a establecer
     */
    static setInnerHTML(elementOrId, html) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element) {
            element.innerHTML = html || '';
        }
    }
    
    /**
     * Agrega una clase CSS a un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} className - Nombre de la clase
     */
    static addClass(elementOrId, className) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element && className) {
            element.classList.add(className);
        }
    }
    
    /**
     * Remueve una clase CSS de un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} className - Nombre de la clase
     */
    static removeClass(elementOrId, className) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element && className) {
            element.classList.remove(className);
        }
    }
    
    /**
     * Alterna una clase CSS en un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} className - Nombre de la clase
     * @returns {boolean} - true si la clase fue agregada, false si fue removida
     */
    static toggleClass(elementOrId, className) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element && className) {
            return element.classList.toggle(className);
        }
        return false;
    }
    
    /**
     * Verifica si un elemento tiene una clase CSS
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} className - Nombre de la clase
     * @returns {boolean}
     */
    static hasClass(elementOrId, className) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        return element ? element.classList.contains(className) : false;
    }
    
    /**
     * Muestra un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} display - Tipo de display (opcional, default: 'block')
     */
    static show(elementOrId, display = 'block') {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element) {
            element.style.display = display;
        }
    }
    
    /**
     * Oculta un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     */
    static hide(elementOrId) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element) {
            element.style.display = 'none';
        }
    }
    
    /**
     * Alterna la visibilidad de un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} display - Tipo de display cuando se muestra (opcional)
     */
    static toggle(elementOrId, display = 'block') {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element) {
            if (element.style.display === 'none') {
                element.style.display = display;
            } else {
                element.style.display = 'none';
            }
        }
    }
    
    /**
     * Establece un atributo en un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} attribute - Nombre del atributo
     * @param {string} value - Valor del atributo
     */
    static setAttribute(elementOrId, attribute, value) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element) {
            element.setAttribute(attribute, value);
        }
    }
    
    /**
     * Obtiene el valor de un atributo
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} attribute - Nombre del atributo
     * @returns {string|null}
     */
    static getAttribute(elementOrId, attribute) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        return element ? element.getAttribute(attribute) : null;
    }
    
    /**
     * Remueve un atributo de un elemento
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} attribute - Nombre del atributo
     */
    static removeAttribute(elementOrId, attribute) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element) {
            element.removeAttribute(attribute);
        }
    }
    
    /**
     * Crea un elemento DOM
     * @param {string} tagName - Nombre de la etiqueta
     * @param {Object} options - Opciones del elemento
     * @param {string} options.className - Clases CSS
     * @param {string} options.id - ID del elemento
     * @param {string} options.textContent - Contenido de texto
     * @param {string} options.innerHTML - HTML interno
     * @param {Object} options.attributes - Atributos adicionales
     * @returns {Element}
     */
    static createElement(tagName, options = {}) {
        const element = document.createElement(tagName);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.id) {
            element.id = options.id;
        }
        
        if (options.textContent) {
            element.textContent = options.textContent;
        }
        
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        return element;
    }
    
    /**
     * Remueve un elemento del DOM
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     */
    static remove(elementOrId) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
    
    /**
     * Verifica si un elemento está visible
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @returns {boolean}
     */
    static isVisible(elementOrId) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0';
    }
    
    /**
     * Espera a que el DOM esté listo
     * @returns {Promise}
     */
    static ready() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    /**
     * Agrega un event listener de forma segura
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} event - Nombre del evento
     * @param {Function} handler - Función manejadora
     * @param {Object} options - Opciones del event listener
     */
    static addEventListener(elementOrId, event, handler, options = {}) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler, options);
        }
    }
    
    /**
     * Remueve un event listener
     * @param {string|Element} elementOrId - ID del elemento o elemento DOM
     * @param {string} event - Nombre del evento
     * @param {Function} handler - Función manejadora
     */
    static removeEventListener(elementOrId, event, handler) {
        const element = typeof elementOrId === 'string' 
            ? this.getElementById(elementOrId) 
            : elementOrId;
            
        if (element && typeof handler === 'function') {
            element.removeEventListener(event, handler);
        }
    }
}
