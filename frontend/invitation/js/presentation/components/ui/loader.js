/**
 * Componente Loader para mostrar estados de carga
 * Proporciona diferentes tipos de loaders y animaciones
 */

import { Component } from '../base/component.js';
import { DOMUtils } from '../../../shared/utils/dom-utils.js';

export class LoaderComponent extends Component {
    constructor(element, options = {}) {
        // Crear elemento loader si no se proporciona
        const loaderElement = element || LoaderComponent.createLoaderElement();
        super(loaderElement);
        
        this.options = {
            type: 'spinner', // 'spinner', 'dots', 'pulse', 'bars'
            size: 'medium', // 'small', 'medium', 'large'
            color: 'primary', // 'primary', 'secondary', 'white'
            text: 'Cargando...', // Texto a mostrar
            showText: true, // Mostrar texto
            overlay: false, // Mostrar como overlay
            ...options
        };
        
        this.isVisible = false;
        this.textElement = null;
        this.spinnerElement = null;
    }
    
    /**
     * Crea el elemento loader base
     * @returns {HTMLElement}
     */
    static createLoaderElement() {
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-live', 'polite');
        loader.style.display = 'none';
        
        return loader;
    }
    
    /**
     * Inicializa el componente
     */
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        console.log('⏳ Initializing LoaderComponent...');
        
        // Crear estructura del loader
        this.createLoaderStructure();
        
        // Aplicar configuraciones
        this.applyConfiguration();
        
        await super.init();
        console.log('✅ LoaderComponent initialized');
    }
    
    /**
     * Crea la estructura HTML del loader
     */
    createLoaderStructure() {
        const loaderHTML = this.generateLoaderHTML();
        this.element.innerHTML = loaderHTML;
        
        // Obtener referencias a elementos
        this.textElement = this.find('.loader-text');
        this.spinnerElement = this.find('.loader-spinner');
    }
    
    /**
     * Genera el HTML del loader según el tipo
     * @returns {string}
     */
    generateLoaderHTML() {
        const baseClasses = `loader-container ${this.options.size} ${this.options.color}`;
        
        let spinnerHTML = '';
        
        switch (this.options.type) {
            case 'spinner':
                spinnerHTML = `
                    <div class="loader-spinner spinner">
                        <div class="spinner-border" role="status">
                            <span class="sr-only">Cargando...</span>
                        </div>
                    </div>
                `;
                break;
                
            case 'dots':
                spinnerHTML = `
                    <div class="loader-spinner dots">
                        <div class="dot dot-1"></div>
                        <div class="dot dot-2"></div>
                        <div class="dot dot-3"></div>
                    </div>
                `;
                break;
                
            case 'pulse':
                spinnerHTML = `
                    <div class="loader-spinner pulse">
                        <div class="pulse-circle"></div>
                    </div>
                `;
                break;
                
            case 'bars':
                spinnerHTML = `
                    <div class="loader-spinner bars">
                        <div class="bar bar-1"></div>
                        <div class="bar bar-2"></div>
                        <div class="bar bar-3"></div>
                        <div class="bar bar-4"></div>
                    </div>
                `;
                break;
                
            default:
                spinnerHTML = `
                    <div class="loader-spinner spinner">
                        <div class="spinner-border" role="status">
                            <span class="sr-only">Cargando...</span>
                        </div>
                    </div>
                `;
        }
        
        const textHTML = this.options.showText ? 
            `<div class="loader-text">${this.options.text}</div>` : '';
        
        return `
            <div class="${baseClasses}">
                ${spinnerHTML}
                ${textHTML}
            </div>
        `;
    }
    
    /**
     * Aplica la configuración inicial
     */
    applyConfiguration() {
        // Aplicar clases de tamaño y color
        this.addClass(`loader-${this.options.size}`);
        this.addClass(`loader-${this.options.color}`);
        this.addClass(`loader-${this.options.type}`);
        
        // Configurar como overlay si es necesario
        if (this.options.overlay) {
            this.addClass('loader-overlay');
            this.element.style.position = 'fixed';
            this.element.style.top = '0';
            this.element.style.left = '0';
            this.element.style.width = '100%';
            this.element.style.height = '100%';
            this.element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            this.element.style.zIndex = '9999';
            this.element.style.display = 'flex';
            this.element.style.alignItems = 'center';
            this.element.style.justifyContent = 'center';
        }
    }
    
    /**
     * Muestra el loader
     * @param {string} text - Texto opcional a mostrar
     */
    show(text) {
        if (this.isVisible) {
            return;
        }
        
        // Actualizar texto si se proporciona
        if (text && this.textElement) {
            this.textElement.textContent = text;
        }
        
        // Mostrar elemento
        this.element.style.display = this.options.overlay ? 'flex' : 'block';
        this.element.setAttribute('aria-hidden', 'false');
        
        // Agregar al body si es overlay
        if (this.options.overlay && !document.body.contains(this.element)) {
            document.body.appendChild(this.element);
        }
        
        // Animación de entrada
        requestAnimationFrame(() => {
            this.addClass('loader-visible');
        });
        
        this.isVisible = true;
        console.log('⏳ Loader shown');
    }
    
    /**
     * Oculta el loader
     */
    hide() {
        if (!this.isVisible) {
            return;
        }
        
        // Animación de salida
        this.removeClass('loader-visible');
        
        // Ocultar después de la animación
        setTimeout(() => {
            this.element.style.display = 'none';
            this.element.setAttribute('aria-hidden', 'true');
            
            // Remover del body si es overlay
            if (this.options.overlay && document.body.contains(this.element)) {
                document.body.removeChild(this.element);
            }
        }, 300);
        
        this.isVisible = false;
        console.log('✅ Loader hidden');
    }
    
    /**
     * Alterna la visibilidad del loader
     */
    toggle(text) {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show(text);
        }
    }
    
    /**
     * Actualiza el texto del loader
     * @param {string} text - Nuevo texto
     */
    setText(text) {
        if (this.textElement) {
            this.textElement.textContent = text;
        }
        this.options.text = text;
    }
    
    /**
     * Actualiza el tipo de loader
     * @param {string} type - Nuevo tipo ('spinner', 'dots', 'pulse', 'bars')
     */
    setType(type) {
        if (this.options.type === type) {
            return;
        }
        
        // Remover clase anterior
        this.removeClass(`loader-${this.options.type}`);
        
        // Actualizar tipo
        this.options.type = type;
        
        // Agregar nueva clase
        this.addClass(`loader-${type}`);
        
        // Recrear estructura
        this.createLoaderStructure();
        
        console.log(`🔄 Loader type changed to: ${type}`);
    }
    
    /**
     * Actualiza el tamaño del loader
     * @param {string} size - Nuevo tamaño ('small', 'medium', 'large')
     */
    setSize(size) {
        if (this.options.size === size) {
            return;
        }
        
        // Remover clase anterior
        this.removeClass(`loader-${this.options.size}`);
        
        // Actualizar tamaño
        this.options.size = size;
        
        // Agregar nueva clase
        this.addClass(`loader-${size}`);
        
        console.log(`📏 Loader size changed to: ${size}`);
    }
    
    /**
     * Actualiza el color del loader
     * @param {string} color - Nuevo color ('primary', 'secondary', 'white')
     */
    setColor(color) {
        if (this.options.color === color) {
            return;
        }
        
        // Remover clase anterior
        this.removeClass(`loader-${this.options.color}`);
        
        // Actualizar color
        this.options.color = color;
        
        // Agregar nueva clase
        this.addClass(`loader-${color}`);
        
        console.log(`🎨 Loader color changed to: ${color}`);
    }
    
    /**
     * Configura el loader como overlay
     * @param {boolean} overlay - Si debe ser overlay
     */
    setOverlay(overlay) {
        this.options.overlay = overlay;
        
        if (overlay) {
            this.addClass('loader-overlay');
            this.element.style.position = 'fixed';
            this.element.style.top = '0';
            this.element.style.left = '0';
            this.element.style.width = '100%';
            this.element.style.height = '100%';
            this.element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            this.element.style.zIndex = '9999';
            this.element.style.display = 'flex';
            this.element.style.alignItems = 'center';
            this.element.style.justifyContent = 'center';
        } else {
            this.removeClass('loader-overlay');
            this.element.style.position = '';
            this.element.style.top = '';
            this.element.style.left = '';
            this.element.style.width = '';
            this.element.style.height = '';
            this.element.style.backgroundColor = '';
            this.element.style.zIndex = '';
            this.element.style.display = '';
            this.element.style.alignItems = '';
            this.element.style.justifyContent = '';
        }
    }
    
    /**
     * Verifica si el loader está visible
     * @returns {boolean}
     */
    isLoaderVisible() {
        return this.isVisible;
    }
    
    /**
     * Muestra el loader por un tiempo determinado
     * @param {number} duration - Duración en milisegundos
     * @param {string} text - Texto opcional
     * @returns {Promise}
     */
    showFor(duration, text) {
        return new Promise((resolve) => {
            this.show(text);
            
            setTimeout(() => {
                this.hide();
                resolve();
            }, duration);
        });
    }
    
    /**
     * Muestra el loader mientras se ejecuta una promesa
     * @param {Promise} promise - Promesa a esperar
     * @param {string} text - Texto opcional
     * @returns {Promise}
     */
    async showWhile(promise, text) {
        this.show(text);
        
        try {
            const result = await promise;
            this.hide();
            return result;
        } catch (error) {
            this.hide();
            throw error;
        }
    }
    
    /**
     * Obtiene la configuración actual
     * @returns {Object}
     */
    getOptions() {
        return { ...this.options };
    }
    
    /**
     * Actualiza múltiples opciones
     * @param {Object} newOptions - Nuevas opciones
     */
    updateOptions(newOptions) {
        const oldOptions = { ...this.options };
        this.options = { ...this.options, ...newOptions };
        
        // Aplicar cambios si es necesario
        if (oldOptions.type !== this.options.type) {
            this.setType(this.options.type);
        }
        
        if (oldOptions.size !== this.options.size) {
            this.setSize(this.options.size);
        }
        
        if (oldOptions.color !== this.options.color) {
            this.setColor(this.options.color);
        }
        
        if (oldOptions.overlay !== this.options.overlay) {
            this.setOverlay(this.options.overlay);
        }
        
        if (oldOptions.text !== this.options.text) {
            this.setText(this.options.text);
        }
        
        console.log('⚙️ Loader options updated');
    }
    
    /**
     * Destruye el componente
     */
    destroy() {
        // Ocultar loader si está visible
        if (this.isVisible) {
            this.hide();
        }
        
        // Limpiar referencias
        this.textElement = null;
        this.spinnerElement = null;
        
        // Remover del DOM si es overlay
        if (this.options.overlay && document.body.contains(this.element)) {
            document.body.removeChild(this.element);
        }
        
        super.destroy();
        console.log('🗑️ LoaderComponent destroyed');
    }
}
