/**
 * Controlador de Contenido
 * Maneja la actualización dinámica de contenido y elementos de la página
 */

import { EVENTS } from '../../shared/constants/events.js';
import { SELECTORS } from '../../shared/constants/selectors.js';
import { DOMUtils } from '../../shared/utils/dom-utils.js';

export class ContentController {
    constructor(container, metaService, options = {}) {
        this.container = container;
        this.metaService = metaService;
        this.options = {
            autoUpdateMeta: true,
            enableAnimations: true,
            animationDuration: 300,
            ...options
        };
        
        this.contentElements = new Map();
        this.dynamicElements = new Map();
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
        
        console.log('📄 Initializing ContentController...');
        
        // Descubrir elementos de contenido dinámico
        this.discoverContentElements();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Actualizar contenido inicial
        await this.updateInitialContent();
        
        this.isInitialized = true;
        console.log('✅ ContentController initialized');
    }
    
    /**
     * Descubre elementos de contenido dinámico
     */
    discoverContentElements() {
        // Elementos con data-content
        const contentElements = this.container.querySelectorAll('[data-content]');
        contentElements.forEach(element => {
            const contentKey = element.getAttribute('data-content');
            if (contentKey) {
                this.contentElements.set(contentKey, {
                    element: element,
                    key: contentKey,
                    type: element.getAttribute('data-content-type') || 'text',
                    format: element.getAttribute('data-content-format') || null,
                    fallback: element.getAttribute('data-content-fallback') || '',
                    originalContent: element.innerHTML
                });
            }
        });
        
        // Elementos dinámicos especiales
        this.discoverSpecialElements();
        
        console.log(`📋 Discovered ${this.contentElements.size} content elements`);
    }
    
    /**
     * Descubre elementos dinámicos especiales
     */
    discoverSpecialElements() {
        // Fechas dinámicas
        const dateElements = this.container.querySelectorAll('[data-date]');
        dateElements.forEach(element => {
            const dateKey = element.getAttribute('data-date');
            this.dynamicElements.set(`date-${dateKey}`, {
                element: element,
                type: 'date',
                key: dateKey,
                format: element.getAttribute('data-date-format') || 'default'
            });
        });
        
        // Contadores
        const counterElements = this.container.querySelectorAll('[data-counter]');
        counterElements.forEach(element => {
            const counterKey = element.getAttribute('data-counter');
            this.dynamicElements.set(`counter-${counterKey}`, {
                element: element,
                type: 'counter',
                key: counterKey,
                start: parseInt(element.getAttribute('data-counter-start')) || 0,
                end: parseInt(element.getAttribute('data-counter-end')) || 100,
                duration: parseInt(element.getAttribute('data-counter-duration')) || 2000
            });
        });
        
        // Elementos condicionales
        const conditionalElements = this.container.querySelectorAll('[data-show-if], [data-hide-if]');
        conditionalElements.forEach(element => {
            const showCondition = element.getAttribute('data-show-if');
            const hideCondition = element.getAttribute('data-hide-if');
            const key = showCondition || hideCondition;
            
            this.dynamicElements.set(`conditional-${key}`, {
                element: element,
                type: 'conditional',
                condition: showCondition ? 'show' : 'hide',
                key: key
            });
        });
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Escuchar cambios de datos
        this.container.addEventListener('dataChanged', (e) => {
            this.handleDataChange(e.detail);
        });
        
        // Escuchar eventos de navegación para actualizar contenido
        this.container.addEventListener(EVENTS.NAVIGATION.SECTION_CHANGED, (e) => {
            this.handleSectionChange(e.detail);
        });
    }
    
    /**
     * Actualiza el contenido inicial
     */
    async updateInitialContent() {
        // Actualizar meta tags si está habilitado
        if (this.options.autoUpdateMeta && this.metaService) {
            await this.updateMetaTags();
        }
        
        // Inicializar contadores
        this.initializeCounters();
        
        // Evaluar elementos condicionales
        this.evaluateConditionalElements();
    }
    
    /**
     * Actualiza un elemento de contenido específico
     * @param {string} key - Clave del contenido
     * @param {*} value - Nuevo valor
     * @param {Object} options - Opciones de actualización
     */
    async updateContent(key, value, options = {}) {
        const contentElement = this.contentElements.get(key);
        if (!contentElement) {
            console.warn(`Content element not found: ${key}`);
            return;
        }
        
        console.log(`📝 Updating content: ${key}`);
        
        // Formatear valor según el tipo
        const formattedValue = this.formatValue(value, contentElement);
        
        // Aplicar animación si está habilitada
        if (this.options.enableAnimations && !options.skipAnimation) {
            await this.animateContentChange(contentElement.element, formattedValue);
        } else {
            this.setElementContent(contentElement.element, formattedValue, contentElement.type);
        }
        
        // Emitir evento de contenido actualizado
        this.emit(EVENTS.CONTENT.UPDATED, {
            key: key,
            value: value,
            formattedValue: formattedValue,
            element: contentElement.element
        });
    }
    
    /**
     * Actualiza múltiples elementos de contenido
     * @param {Object} data - Objeto con claves y valores
     * @param {Object} options - Opciones de actualización
     */
    async updateMultipleContent(data, options = {}) {
        const updates = Object.entries(data).map(([key, value]) => 
            this.updateContent(key, value, options)
        );
        
        await Promise.all(updates);
    }
    
    /**
     * Formatea un valor según el tipo de contenido
     * @param {*} value - Valor a formatear
     * @param {Object} contentElement - Elemento de contenido
     * @returns {string}
     */
    formatValue(value, contentElement) {
        if (value === null || value === undefined) {
            return contentElement.fallback;
        }
        
        switch (contentElement.type) {
            case 'date':
                return this.formatDate(value, contentElement.format);
            
            case 'number':
                return this.formatNumber(value, contentElement.format);
            
            case 'currency':
                return this.formatCurrency(value, contentElement.format);
            
            case 'html':
                return value; // HTML sin escapar
            
            case 'text':
            default:
                return String(value);
        }
    }
    
    /**
     * Formatea una fecha
     * @param {Date|string} date - Fecha a formatear
     * @param {string} format - Formato de fecha
     * @returns {string}
     */
    formatDate(date, format) {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            return 'Fecha inválida';
        }
        
        switch (format) {
            case 'short':
                return dateObj.toLocaleDateString('es-ES');
            
            case 'long':
                return dateObj.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            
            case 'time':
                return dateObj.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            
            case 'datetime':
                return dateObj.toLocaleString('es-ES');
            
            default:
                return dateObj.toLocaleDateString('es-ES');
        }
    }
    
    /**
     * Formatea un número
     * @param {number} number - Número a formatear
     * @param {string} format - Formato de número
     * @returns {string}
     */
    formatNumber(number, format) {
        const num = parseFloat(number);
        
        if (isNaN(num)) {
            return '0';
        }
        
        switch (format) {
            case 'integer':
                return Math.round(num).toLocaleString('es-ES');
            
            case 'decimal':
                return num.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            
            case 'percentage':
                return (num * 100).toLocaleString('es-ES', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }) + '%';
            
            default:
                return num.toLocaleString('es-ES');
        }
    }
    
    /**
     * Formatea una moneda
     * @param {number} amount - Cantidad a formatear
     * @param {string} currency - Código de moneda
     * @returns {string}
     */
    formatCurrency(amount, currency = 'EUR') {
        const num = parseFloat(amount);
        
        if (isNaN(num)) {
            return '0 €';
        }
        
        return num.toLocaleString('es-ES', {
            style: 'currency',
            currency: currency
        });
    }
    
    /**
     * Establece el contenido de un elemento
     * @param {HTMLElement} element - Elemento
     * @param {string} content - Contenido
     * @param {string} type - Tipo de contenido
     */
    setElementContent(element, content, type) {
        switch (type) {
            case 'html':
                element.innerHTML = content;
                break;
            
            case 'attribute':
                const attrName = element.getAttribute('data-content-attribute') || 'value';
                element.setAttribute(attrName, content);
                break;
            
            case 'text':
            default:
                element.textContent = content;
                break;
        }
    }
    
    /**
     * Anima el cambio de contenido
     * @param {HTMLElement} element - Elemento
     * @param {string} newContent - Nuevo contenido
     * @returns {Promise}
     */
    animateContentChange(element, newContent) {
        return new Promise((resolve) => {
            // Fade out
            element.style.transition = `opacity ${this.options.animationDuration / 2}ms ease`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                // Cambiar contenido
                this.setElementContent(element, newContent, 
                    this.getElementContentType(element));
                
                // Fade in
                element.style.opacity = '1';
                
                setTimeout(() => {
                    element.style.transition = '';
                    resolve();
                }, this.options.animationDuration / 2);
            }, this.options.animationDuration / 2);
        });
    }
    
    /**
     * Obtiene el tipo de contenido de un elemento
     * @param {HTMLElement} element - Elemento
     * @returns {string}
     */
    getElementContentType(element) {
        return element.getAttribute('data-content-type') || 'text';
    }
    
    /**
     * Inicializa contadores animados
     */
    initializeCounters() {
        this.dynamicElements.forEach((element, key) => {
            if (element.type === 'counter') {
                this.animateCounter(element);
            }
        });
    }
    
    /**
     * Anima un contador
     * @param {Object} counterElement - Elemento contador
     */
    animateCounter(counterElement) {
        const { element, start, end, duration } = counterElement;
        const startTime = performance.now();
        const difference = end - start;
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.round(start + (difference * easeOutQuart));
            
            element.textContent = currentValue.toLocaleString('es-ES');
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }
    
    /**
     * Evalúa elementos condicionales
     * @param {Object} data - Datos para evaluación
     */
    evaluateConditionalElements(data = {}) {
        this.dynamicElements.forEach((element, key) => {
            if (element.type === 'conditional') {
                const shouldShow = this.evaluateCondition(element.key, element.condition, data);
                
                if (shouldShow) {
                    element.element.style.display = '';
                    element.element.removeAttribute('hidden');
                } else {
                    element.element.style.display = 'none';
                    element.element.setAttribute('hidden', '');
                }
            }
        });
    }
    
    /**
     * Evalúa una condición
     * @param {string} key - Clave de la condición
     * @param {string} type - Tipo de condición ('show' o 'hide')
     * @param {Object} data - Datos para evaluación
     * @returns {boolean}
     */
    evaluateCondition(key, type, data) {
        // Lógica simple de evaluación
        // Puede expandirse para condiciones más complejas
        const value = data[key];
        const shouldShow = Boolean(value);
        
        return type === 'show' ? shouldShow : !shouldShow;
    }
    
    /**
     * Actualiza meta tags
     */
    async updateMetaTags(data = {}) {
        if (!this.metaService) return;
        
        try {
            await this.metaService.updateFromData(data);
        } catch (error) {
            console.error('Error updating meta tags:', error);
        }
    }
    
    /**
     * Maneja cambios de datos
     * @param {Object} data - Datos cambiados
     */
    handleDataChange(data) {
        // Actualizar contenido dinámico
        this.updateMultipleContent(data, { skipAnimation: false });
        
        // Evaluar elementos condicionales
        this.evaluateConditionalElements(data);
        
        // Actualizar meta tags si es necesario
        if (this.options.autoUpdateMeta) {
            this.updateMetaTags(data);
        }
    }
    
    /**
     * Maneja cambios de sección
     * @param {Object} sectionData - Datos de la sección
     */
    handleSectionChange(sectionData) {
        // Emitir evento de cambio de sección para contenido
        this.emit(EVENTS.CONTENT.SECTION_CHANGED, sectionData);
        
        // Actualizar contenido específico de la sección si es necesario
        const sectionSpecificData = this.getSectionSpecificData(sectionData.current);
        if (sectionSpecificData) {
            this.updateMultipleContent(sectionSpecificData);
        }
    }
    
    /**
     * Obtiene datos específicos de una sección
     * @param {string} sectionId - ID de la sección
     * @returns {Object|null}
     */
    getSectionSpecificData(sectionId) {
        // Esta función puede ser extendida para manejar datos específicos por sección
        // Por ahora retorna null, pero puede ser implementada según necesidades
        return null;
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
     * Obtiene todos los elementos de contenido
     * @returns {Map}
     */
    getAllContentElements() {
        return new Map(this.contentElements);
    }
    
    /**
     * Obtiene todos los elementos dinámicos
     * @returns {Map}
     */
    getAllDynamicElements() {
        return new Map(this.dynamicElements);
    }
    
    /**
     * Resetea el contenido a su estado original
     * @param {string[]} keys - Claves específicas a resetear (opcional)
     */
    resetContent(keys = null) {
        const elementsToReset = keys ? 
            keys.filter(key => this.contentElements.has(key)) :
            Array.from(this.contentElements.keys());
        
        elementsToReset.forEach(key => {
            const contentElement = this.contentElements.get(key);
            if (contentElement) {
                this.setElementContent(
                    contentElement.element, 
                    contentElement.originalContent, 
                    'html'
                );
            }
        });
        
        console.log(`🔄 Content reset for ${elementsToReset.length} elements`);
    }
    
    /**
     * Actualiza las opciones del controlador
     * @param {Object} newOptions - Nuevas opciones
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        console.log('⚙️ Content controller options updated');
    }
    
    /**
     * Destruye el controlador y limpia recursos
     */
    destroy() {
        // Limpiar event listeners
        this.eventListeners.clear();
        
        // Limpiar referencias
        this.contentElements.clear();
        this.dynamicElements.clear();
        this.container = null;
        this.metaService = null;
        
        this.isInitialized = false;
        console.log('🗑️ ContentController destroyed');
    }
}
