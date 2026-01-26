/**
 * Componente FormValidator para validación de formularios en tiempo real
 * Proporciona validación visual y funcional de formularios
 */

import { Component } from '../base/component.js';
import { EVENTS } from '../../../shared/constants/events.js';
import { debounce } from '../../../shared/helpers/debounce.js';

export class FormValidatorComponent extends Component {
    constructor(formElement, validationService, options = {}) {
        super(formElement);
        
        this.validationService = validationService;
        this.options = {
            validateOnInput: true,
            validateOnBlur: true,
            validateOnSubmit: true,
            showErrorsInline: true,
            showErrorsSummary: false,
            debounceTime: 300,
            errorClass: 'is-invalid',
            successClass: 'is-valid',
            errorMessageClass: 'invalid-feedback',
            ...options
        };
        
        this.fields = new Map();
        this.errors = new Map();
        this.isValid = false;
        this.errorSummaryElement = null;
        
        // Debounced validation function
        this.debouncedValidate = debounce(
            this.validateField.bind(this), 
            this.options.debounceTime
        );
    }
    
    /**
     * Inicializa el componente
     */
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        console.log('📝 Initializing FormValidatorComponent...');
        
        // Descubrir campos del formulario
        this.discoverFields();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Crear elementos de error si es necesario
        this.setupErrorElements();
        
        await super.init();
        console.log('✅ FormValidatorComponent initialized');
    }
    
    /**
     * Descubre los campos del formulario
     */
    discoverFields() {
        const inputs = this.element.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.name) {
                this.fields.set(input.name, {
                    element: input,
                    rules: this.extractRulesFromElement(input),
                    errorElement: null,
                    isValid: null
                });
            }
        });
        
        console.log(`📋 Discovered ${this.fields.size} form fields`);
    }
    
    /**
     * Extrae reglas de validación del elemento HTML
     * @param {HTMLElement} element - Elemento del formulario
     * @returns {Object}
     */
    extractRulesFromElement(element) {
        const rules = {};
        
        // Required
        if (element.hasAttribute('required')) {
            rules.required = true;
        }
        
        // Min/Max length
        if (element.hasAttribute('minlength')) {
            rules.minLength = parseInt(element.getAttribute('minlength'));
        }
        
        if (element.hasAttribute('maxlength')) {
            rules.maxLength = parseInt(element.getAttribute('maxlength'));
        }
        
        // Pattern
        if (element.hasAttribute('pattern')) {
            rules.pattern = new RegExp(element.getAttribute('pattern'));
        }
        
        // Type-specific rules
        if (element.type === 'email') {
            rules.email = true;
        }
        
        if (element.type === 'tel') {
            rules.phone = true;
        }
        
        // Custom validation rules from data attributes
        if (element.hasAttribute('data-validation-rules')) {
            try {
                const customRules = JSON.parse(element.getAttribute('data-validation-rules'));
                Object.assign(rules, customRules);
            } catch (e) {
                console.warn('Invalid validation rules JSON:', e);
            }
        }
        
        return rules;
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Validación en input
        if (this.options.validateOnInput) {
            this.element.addEventListener('input', (e) => {
                if (e.target.name && this.fields.has(e.target.name)) {
                    this.debouncedValidate(e.target.name, e.target.value);
                }
            });
        }
        
        // Validación en blur
        if (this.options.validateOnBlur) {
            this.element.addEventListener('blur', (e) => {
                if (e.target.name && this.fields.has(e.target.name)) {
                    this.validateField(e.target.name, e.target.value);
                }
            }, true);
        }
        
        // Validación en submit
        if (this.options.validateOnSubmit) {
            this.element.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validateForm().then(isValid => {
                    if (isValid) {
                        this.emit(EVENTS.FORM.VALID_SUBMIT, {
                            form: this.element,
                            data: this.getFormData()
                        });
                    } else {
                        this.emit(EVENTS.FORM.INVALID_SUBMIT, {
                            form: this.element,
                            errors: this.getAllErrors()
                        });
                    }
                });
            });
        }
    }
    
    /**
     * Configura elementos de error
     */
    setupErrorElements() {
        // Crear elementos de error inline para cada campo
        if (this.options.showErrorsInline) {
            this.fields.forEach((field, fieldName) => {
                const errorElement = this.createErrorElement(fieldName);
                field.errorElement = errorElement;
                
                // Insertar después del campo
                field.element.parentNode.insertBefore(
                    errorElement, 
                    field.element.nextSibling
                );
            });
        }
        
        // Crear elemento de resumen de errores
        if (this.options.showErrorsSummary) {
            this.errorSummaryElement = this.createErrorSummaryElement();
            this.element.insertBefore(this.errorSummaryElement, this.element.firstChild);
        }
    }
    
    /**
     * Crea un elemento de error para un campo
     * @param {string} fieldName - Nombre del campo
     * @returns {HTMLElement}
     */
    createErrorElement(fieldName) {
        const errorElement = document.createElement('div');
        errorElement.className = this.options.errorMessageClass;
        errorElement.id = `${fieldName}-error`;
        errorElement.style.display = 'none';
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'polite');
        
        return errorElement;
    }
    
    /**
     * Crea el elemento de resumen de errores
     * @returns {HTMLElement}
     */
    createErrorSummaryElement() {
        const summaryElement = document.createElement('div');
        summaryElement.className = 'form-error-summary alert alert-danger';
        summaryElement.style.display = 'none';
        summaryElement.setAttribute('role', 'alert');
        summaryElement.innerHTML = `
            <h4>Por favor, corrige los siguientes errores:</h4>
            <ul class="error-list"></ul>
        `;
        
        return summaryElement;
    }
    
    /**
     * Valida un campo específico
     * @param {string} fieldName - Nombre del campo
     * @param {*} value - Valor del campo
     * @returns {Promise<boolean>}
     */
    async validateField(fieldName, value) {
        if (!this.fields.has(fieldName)) {
            return true;
        }
        
        const field = this.fields.get(fieldName);
        
        // Usar el valor actual si no se proporciona
        if (value === undefined) {
            value = field.element.value;
        }
        
        try {
            // Validar usando el servicio de validación
            const result = this.validationService.validateField(fieldName, value, field.rules);
            
            // Actualizar estado del campo
            field.isValid = result.isValid;
            
            if (result.isValid) {
                this.clearFieldError(fieldName);
                this.errors.delete(fieldName);
            } else {
                this.showFieldError(fieldName, result.errors);
                this.errors.set(fieldName, result.errors);
            }
            
            // Emitir evento de validación de campo
            this.emit(EVENTS.FORM.FIELD_VALIDATED, {
                fieldName,
                value,
                isValid: result.isValid,
                errors: result.errors
            });
            
            // Actualizar estado general del formulario
            this.updateFormValidationState();
            
            return result.isValid;
            
        } catch (error) {
            console.error(`Error validating field ${fieldName}:`, error);
            return false;
        }
    }
    
    /**
     * Valida todo el formulario
     * @returns {Promise<boolean>}
     */
    async validateForm() {
        const formData = this.getFormData();
        
        try {
            // Validar usando el servicio de validación
            const result = this.validationService.validateForm(formData);
            
            // Limpiar errores anteriores
            this.clearAllErrors();
            
            // Mostrar errores si los hay
            if (!result.isValid) {
                Object.keys(result.fieldErrors).forEach(fieldName => {
                    this.showFieldError(fieldName, result.fieldErrors[fieldName]);
                    this.errors.set(fieldName, result.fieldErrors[fieldName]);
                });
                
                // Actualizar resumen de errores
                this.updateErrorSummary();
            }
            
            // Actualizar estado de campos individuales
            this.fields.forEach((field, fieldName) => {
                field.isValid = !result.fieldErrors[fieldName];
                this.updateFieldVisualState(fieldName);
            });
            
            this.isValid = result.isValid;
            
            // Emitir evento de validación de formulario
            this.emit(EVENTS.FORM.VALIDATED, {
                isValid: result.isValid,
                errors: result.errors,
                fieldErrors: result.fieldErrors
            });
            
            return result.isValid;
            
        } catch (error) {
            console.error('Error validating form:', error);
            return false;
        }
    }
    
    /**
     * Muestra error en un campo específico
     * @param {string} fieldName - Nombre del campo
     * @param {string[]} errors - Lista de errores
     */
    showFieldError(fieldName, errors) {
        const field = this.fields.get(fieldName);
        if (!field) return;
        
        // Actualizar estado visual del campo
        field.element.classList.remove(this.options.successClass);
        field.element.classList.add(this.options.errorClass);
        field.element.setAttribute('aria-invalid', 'true');
        
        // Mostrar mensaje de error inline
        if (field.errorElement && this.options.showErrorsInline) {
            field.errorElement.textContent = errors[0]; // Mostrar primer error
            field.errorElement.style.display = 'block';
            field.element.setAttribute('aria-describedby', field.errorElement.id);
        }
    }
    
    /**
     * Limpia el error de un campo específico
     * @param {string} fieldName - Nombre del campo
     */
    clearFieldError(fieldName) {
        const field = this.fields.get(fieldName);
        if (!field) return;
        
        // Actualizar estado visual del campo
        field.element.classList.remove(this.options.errorClass);
        field.element.classList.add(this.options.successClass);
        field.element.setAttribute('aria-invalid', 'false');
        
        // Ocultar mensaje de error inline
        if (field.errorElement) {
            field.errorElement.style.display = 'none';
            field.element.removeAttribute('aria-describedby');
        }
    }
    
    /**
     * Actualiza el estado visual de un campo
     * @param {string} fieldName - Nombre del campo
     */
    updateFieldVisualState(fieldName) {
        const field = this.fields.get(fieldName);
        if (!field) return;
        
        if (field.isValid === true) {
            this.clearFieldError(fieldName);
        } else if (field.isValid === false) {
            const errors = this.errors.get(fieldName) || ['Error de validación'];
            this.showFieldError(fieldName, errors);
        }
    }
    
    /**
     * Limpia todos los errores
     */
    clearAllErrors() {
        this.fields.forEach((field, fieldName) => {
            this.clearFieldError(fieldName);
        });
        
        this.errors.clear();
        
        // Ocultar resumen de errores
        if (this.errorSummaryElement) {
            this.errorSummaryElement.style.display = 'none';
        }
    }
    
    /**
     * Actualiza el resumen de errores
     */
    updateErrorSummary() {
        if (!this.errorSummaryElement || !this.options.showErrorsSummary) {
            return;
        }
        
        const errorList = this.errorSummaryElement.querySelector('.error-list');
        errorList.innerHTML = '';
        
        if (this.errors.size > 0) {
            this.errors.forEach((errors, fieldName) => {
                errors.forEach(error => {
                    const li = document.createElement('li');
                    li.textContent = error;
                    errorList.appendChild(li);
                });
            });
            
            this.errorSummaryElement.style.display = 'block';
        } else {
            this.errorSummaryElement.style.display = 'none';
        }
    }
    
    /**
     * Actualiza el estado general de validación del formulario
     */
    updateFormValidationState() {
        let allValid = true;
        
        this.fields.forEach(field => {
            if (field.isValid === false) {
                allValid = false;
            }
        });
        
        this.isValid = allValid && this.errors.size === 0;
        
        // Actualizar clases del formulario
        if (this.isValid) {
            this.addClass('form-valid');
            this.removeClass('form-invalid');
        } else {
            this.addClass('form-invalid');
            this.removeClass('form-valid');
        }
    }
    
    /**
     * Obtiene los datos del formulario
     * @returns {Object}
     */
    getFormData() {
        const formData = new FormData(this.element);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
    
    /**
     * Obtiene todos los errores actuales
     * @returns {Object}
     */
    getAllErrors() {
        const allErrors = {};
        
        this.errors.forEach((errors, fieldName) => {
            allErrors[fieldName] = errors;
        });
        
        return allErrors;
    }
    
    /**
     * Verifica si el formulario es válido
     * @returns {boolean}
     */
    isFormValid() {
        return this.isValid;
    }
    
    /**
     * Obtiene el estado de un campo específico
     * @param {string} fieldName - Nombre del campo
     * @returns {Object|null}
     */
    getFieldState(fieldName) {
        const field = this.fields.get(fieldName);
        if (!field) return null;
        
        return {
            isValid: field.isValid,
            errors: this.errors.get(fieldName) || [],
            value: field.element.value
        };
    }
    
    /**
     * Establece reglas personalizadas para un campo
     * @param {string} fieldName - Nombre del campo
     * @param {Object} rules - Reglas de validación
     */
    setFieldRules(fieldName, rules) {
        const field = this.fields.get(fieldName);
        if (field) {
            field.rules = { ...field.rules, ...rules };
            console.log(`📝 Custom rules set for field: ${fieldName}`);
        }
    }
    
    /**
     * Resetea el formulario y limpia validaciones
     */
    reset() {
        // Limpiar errores
        this.clearAllErrors();
        
        // Resetear estado de campos
        this.fields.forEach(field => {
            field.isValid = null;
            field.element.classList.remove(this.options.errorClass, this.options.successClass);
            field.element.removeAttribute('aria-invalid');
        });
        
        // Resetear formulario
        this.element.reset();
        
        this.isValid = false;
        
        console.log('🔄 Form validator reset');
    }
    
    /**
     * Destruye el componente
     */
    destroy() {
        // Limpiar errores
        this.clearAllErrors();
        
        // Remover elementos de error creados
        this.fields.forEach(field => {
            if (field.errorElement && field.errorElement.parentNode) {
                field.errorElement.parentNode.removeChild(field.errorElement);
            }
        });
        
        // Remover resumen de errores
        if (this.errorSummaryElement && this.errorSummaryElement.parentNode) {
            this.errorSummaryElement.parentNode.removeChild(this.errorSummaryElement);
        }
        
        // Limpiar referencias
        this.fields.clear();
        this.errors.clear();
        this.validationService = null;
        this.debouncedValidate = null;
        this.errorSummaryElement = null;
        
        super.destroy();
        console.log('🗑️ FormValidatorComponent destroyed');
    }
}
