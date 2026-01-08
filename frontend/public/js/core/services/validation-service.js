/**
 * Servicio de validación para formularios y datos
 * Centraliza todas las reglas de validación de la aplicación
 */

import { getConfig } from '../../config/app-config.js';

export class ValidationService {
    constructor() {
        this.rules = getConfig('validation.rules', {});
        this.messages = getConfig('validation.messages', {});
        this.customValidators = new Map();
    }
    
    /**
     * Valida un campo individual
     * @param {string} fieldName - Nombre del campo
     * @param {*} value - Valor a validar
     * @param {Object} customRules - Reglas personalizadas (opcional)
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    validateField(fieldName, value, customRules = {}) {
        const rules = { ...this.rules[fieldName], ...customRules };
        const errors = [];
        
        if (!rules) {
            return { isValid: true, errors: [] };
        }
        
        // Validación de campo requerido
        if (rules.required && this.isEmpty(value)) {
            errors.push(this.getMessage('required', fieldName));
        }
        
        // Si el campo está vacío y no es requerido, no validar más reglas
        if (this.isEmpty(value) && !rules.required) {
            return { isValid: true, errors: [] };
        }
        
        // Validación de longitud mínima
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(this.getMessage('minLength', fieldName, { min: rules.minLength }));
        }
        
        // Validación de longitud máxima
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(this.getMessage('maxLength', fieldName, { max: rules.maxLength }));
        }
        
        // Validación de patrón
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(this.getMessage('pattern', fieldName));
        }
        
        // Validaciones específicas por tipo de campo
        if (fieldName === 'email' && value) {
            if (!this.isValidEmail(value)) {
                errors.push(this.getMessage('email', fieldName));
            }
        }
        
        if (fieldName === 'phone' && value) {
            if (!this.isValidPhone(value)) {
                errors.push(this.getMessage('phone', fieldName));
            }
        }
        
        // Validadores personalizados
        if (this.customValidators.has(fieldName)) {
            const customValidator = this.customValidators.get(fieldName);
            const customResult = customValidator(value, rules);
            if (!customResult.isValid) {
                errors.push(...customResult.errors);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Valida un formulario completo
     * @param {HTMLFormElement|Object} formOrData - Formulario DOM o objeto con datos
     * @param {Object} customRules - Reglas personalizadas por campo
     * @returns {Object} { isValid: boolean, errors: Object, fieldErrors: Object }
     */
    validateForm(formOrData, customRules = {}) {
        let data;
        
        if (formOrData instanceof HTMLFormElement) {
            data = this.extractFormData(formOrData);
        } else {
            data = formOrData;
        }
        
        const fieldErrors = {};
        const allErrors = [];
        let isValid = true;
        
        // Validar cada campo
        Object.keys(data).forEach(fieldName => {
            const fieldRules = customRules[fieldName] || {};
            const result = this.validateField(fieldName, data[fieldName], fieldRules);
            
            if (!result.isValid) {
                fieldErrors[fieldName] = result.errors;
                allErrors.push(...result.errors);
                isValid = false;
            }
        });
        
        // Validaciones cruzadas (entre campos)
        const crossValidationResult = this.validateCrossFields(data, customRules);
        if (!crossValidationResult.isValid) {
            allErrors.push(...crossValidationResult.errors);
            isValid = false;
        }
        
        return {
            isValid,
            errors: allErrors,
            fieldErrors
        };
    }
    
    /**
     * Valida datos de confirmación de RSVP
     * @param {Object} data - Datos de confirmación
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    validateRSVPData(data) {
        const errors = [];
        
        // Validar asistencia
        if (!data.attendance) {
            errors.push('Debe seleccionar si asistirá o no al evento');
        }
        
        // Si confirma asistencia, validar campos adicionales
        if (data.attendance === 'yes') {
            // Validar número de invitados
            if (!data.guestCount || data.guestCount < 1) {
                errors.push('Debe indicar el número de invitados que asistirán');
            }
            
            if (data.maxGuests && data.guestCount > data.maxGuests) {
                errors.push(`El número de invitados no puede ser mayor a ${data.maxGuests}`);
            }
        }
        
        // Validar nombre del invitado
        const guestNameResult = this.validateField('guestName', data.guestName);
        if (!guestNameResult.isValid) {
            errors.push(...guestNameResult.errors);
        }
        
        // Validar teléfono si se proporciona
        if (data.phone) {
            const phoneResult = this.validateField('phone', data.phone);
            if (!phoneResult.isValid) {
                errors.push(...phoneResult.errors);
            }
        }
        
        // Validar email si se proporciona
        if (data.email) {
            const emailResult = this.validateField('email', data.email);
            if (!emailResult.isValid) {
                errors.push(...emailResult.errors);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Valida código de invitación
     * @param {string} code - Código a validar
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    validateInvitationCode(code) {
        const errors = [];
        
        if (!code || typeof code !== 'string') {
            errors.push('El código de invitación es requerido');
            return { isValid: false, errors };
        }
        
        const trimmedCode = code.trim();
        
        if (trimmedCode.length === 0) {
            errors.push('El código de invitación no puede estar vacío');
        }
        
        if (trimmedCode.length < 3) {
            errors.push('El código debe tener al menos 3 caracteres');
        }
        
        if (trimmedCode.length > 20) {
            errors.push('El código no puede tener más de 20 caracteres');
        }
        
        // Verificar caracteres válidos
        if (!/^[A-Za-z0-9\-_]+$/.test(trimmedCode)) {
            errors.push('El código solo puede contener letras, números y guiones');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Validaciones cruzadas entre campos
     * @param {Object} data - Datos del formulario
     * @param {Object} customRules - Reglas personalizadas
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    validateCrossFields(data, customRules) {
        const errors = [];
        
        // Validar que si se proporciona email, también se proporcione teléfono (o viceversa)
        if (customRules.requireContactInfo && data.attendance === 'yes') {
            if (!data.phone && !data.email) {
                errors.push('Debe proporcionar al menos un método de contacto (teléfono o email)');
            }
        }
        
        // Validar coherencia en número de invitados vs nombres
        if (data.guestCount && data.guestNames && Array.isArray(data.guestNames)) {
            if (data.guestNames.length !== data.guestCount) {
                errors.push('El número de nombres debe coincidir con el número de invitados');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Verifica si un valor está vacío
     * @param {*} value - Valor a verificar
     * @returns {boolean}
     */
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }
    
    /**
     * Valida formato de email
     * @param {string} email - Email a validar
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Valida formato de teléfono
     * @param {string} phone - Teléfono a validar
     * @returns {boolean}
     */
    isValidPhone(phone) {
        // Permitir números, espacios, guiones, paréntesis y signo +
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(phone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
    }
    
    /**
     * Obtiene un mensaje de error
     * @param {string} type - Tipo de error
     * @param {string} fieldName - Nombre del campo
     * @param {Object} params - Parámetros para el mensaje
     * @returns {string}
     */
    getMessage(type, fieldName, params = {}) {
        let message = this.messages[type] || `Error de validación en ${fieldName}`;
        
        // Reemplazar parámetros en el mensaje
        Object.keys(params).forEach(key => {
            message = message.replace(`{${key}}`, params[key]);
        });
        
        return message;
    }
    
    /**
     * Extrae datos de un formulario DOM
     * @param {HTMLFormElement} form - Formulario DOM
     * @returns {Object}
     */
    extractFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            // Manejar checkboxes y radio buttons
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    data[key] = input.checked;
                } else if (input.type === 'radio') {
                    data[key] = form.querySelector(`[name="${key}"]:checked`)?.value || '';
                } else {
                    data[key] = value;
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    /**
     * Registra un validador personalizado
     * @param {string} fieldName - Nombre del campo
     * @param {Function} validator - Función validadora
     */
    registerCustomValidator(fieldName, validator) {
        this.customValidators.set(fieldName, validator);
        console.log(`📝 Custom validator registered for field: ${fieldName}`);
    }
    
    /**
     * Remueve un validador personalizado
     * @param {string} fieldName - Nombre del campo
     */
    removeCustomValidator(fieldName) {
        this.customValidators.delete(fieldName);
        console.log(`🗑️ Custom validator removed for field: ${fieldName}`);
    }
    
    /**
     * Sanitiza un valor de entrada
     * @param {string} value - Valor a sanitizar
     * @param {Object} options - Opciones de sanitización
     * @returns {string}
     */
    sanitize(value, options = {}) {
        if (typeof value !== 'string') return value;
        
        let sanitized = value;
        
        // Trim por defecto
        if (options.trim !== false) {
            sanitized = sanitized.trim();
        }
        
        // Remover caracteres especiales
        if (options.removeSpecialChars) {
            sanitized = sanitized.replace(/[<>\"'&]/g, '');
        }
        
        // Convertir a lowercase
        if (options.toLowerCase) {
            sanitized = sanitized.toLowerCase();
        }
        
        // Convertir a uppercase
        if (options.toUpperCase) {
            sanitized = sanitized.toUpperCase();
        }
        
        // Remover espacios extra
        if (options.normalizeSpaces) {
            sanitized = sanitized.replace(/\s+/g, ' ');
        }
        
        return sanitized;
    }
    
    /**
     * Valida y sanitiza datos de entrada
     * @param {Object} data - Datos a procesar
     * @param {Object} rules - Reglas de validación y sanitización
     * @returns {Object} { isValid: boolean, data: Object, errors: string[] }
     */
    validateAndSanitize(data, rules = {}) {
        const sanitizedData = {};
        const errors = [];
        
        // Sanitizar datos primero
        Object.keys(data).forEach(key => {
            const sanitizeRules = rules[key]?.sanitize || {};
            sanitizedData[key] = this.sanitize(data[key], sanitizeRules);
        });
        
        // Luego validar
        const validationResult = this.validateForm(sanitizedData, rules);
        
        return {
            isValid: validationResult.isValid,
            data: sanitizedData,
            errors: validationResult.errors,
            fieldErrors: validationResult.fieldErrors
        };
    }
    
    /**
     * Obtiene las reglas de validación actuales
     * @returns {Object}
     */
    getRules() {
        return { ...this.rules };
    }
    
    /**
     * Actualiza las reglas de validación
     * @param {Object} newRules - Nuevas reglas
     */
    updateRules(newRules) {
        this.rules = { ...this.rules, ...newRules };
        console.log('📝 Validation rules updated');
    }
    
    /**
     * Destruye el servicio
     */
    destroy() {
        this.customValidators.clear();
        console.log('🗑️ ValidationService destroyed');
    }
}
