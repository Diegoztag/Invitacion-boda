/**
 * Validation Service
 * Servicio para validaciones y sanitización de datos
 * Sigue principios SOLID: Single Responsibility
 */

class ValidationService {
    constructor() {
        // Expresiones regulares para validaciones
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\+]?[1-9][\d]{0,15}$/,
            phoneLoose: /^[\+\-\s\(\)0-9]{7,20}$/,
            alphanumeric: /^[a-zA-Z0-9\s]+$/,
            name: /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-\.\']+$/,
            code: /^[a-zA-Z0-9]{4,20}$/
        };

        // Caracteres peligrosos para sanitización
        this.dangerousChars = /<script|<\/script|javascript:|on\w+\s*=|<iframe|<object|<embed/gi;
    }

    /**
     * Valida un email
     * @param {string} email - Email a validar
     * @returns {boolean}
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }
        return this.patterns.email.test(email.trim());
    }

    /**
     * Valida un número de teléfono
     * @param {string} phone - Teléfono a validar
     * @returns {boolean}
     */
    validatePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            return false;
        }
        
        // Limpiar el teléfono de espacios y caracteres especiales
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Validar formato estricto
        return this.patterns.phone.test(cleanPhone);
    }

    /**
     * Valida un teléfono con formato más flexible
     * @param {string} phone - Teléfono a validar
     * @returns {boolean}
     */
    validatePhoneLoose(phone) {
        if (!phone || typeof phone !== 'string') {
            return false;
        }
        return this.patterns.phoneLoose.test(phone.trim());
    }

    /**
     * Valida un nombre
     * @param {string} name - Nombre a validar
     * @returns {boolean}
     */
    validateName(name) {
        if (!name || typeof name !== 'string') {
            return false;
        }
        
        const trimmedName = name.trim();
        return trimmedName.length >= 2 && 
               trimmedName.length <= 100 && 
               this.patterns.name.test(trimmedName);
    }

    /**
     * Valida un código de invitación
     * @param {string} code - Código a validar
     * @returns {boolean}
     */
    validateInvitationCode(code) {
        if (!code || typeof code !== 'string') {
            return false;
        }
        return this.patterns.code.test(code.trim());
    }

    /**
     * Valida que un número esté en un rango
     * @param {number} value - Valor a validar
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {boolean}
     */
    validateNumberRange(value, min, max) {
        return typeof value === 'number' && 
               !isNaN(value) && 
               value >= min && 
               value <= max;
    }

    /**
     * Valida que un string tenga una longitud específica
     * @param {string} str - String a validar
     * @param {number} minLength - Longitud mínima
     * @param {number} maxLength - Longitud máxima
     * @returns {boolean}
     */
    validateStringLength(str, minLength, maxLength) {
        if (typeof str !== 'string') {
            return false;
        }
        const length = str.trim().length;
        return length >= minLength && length <= maxLength;
    }

    /**
     * Sanitiza un string eliminando caracteres peligrosos
     * @param {string} str - String a sanitizar
     * @returns {string}
     */
    sanitizeString(str) {
        if (!str || typeof str !== 'string') {
            return '';
        }

        return str
            .trim()
            .replace(this.dangerousChars, '')
            .replace(/[<>]/g, '')
            .substring(0, 1000); // Limitar longitud máxima
    }

    /**
     * Sanitiza un teléfono
     * @param {string} phone - Teléfono a sanitizar
     * @returns {string}
     */
    sanitizePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            return '';
        }

        // Mantener solo números, +, -, (, ), espacios
        return phone
            .trim()
            .replace(/[^\d\+\-\(\)\s]/g, '')
            .substring(0, 20);
    }

    /**
     * Sanitiza un email
     * @param {string} email - Email a sanitizar
     * @returns {string}
     */
    sanitizeEmail(email) {
        if (!email || typeof email !== 'string') {
            return '';
        }

        return email
            .trim()
            .toLowerCase()
            .replace(/[^\w@\.\-]/g, '')
            .substring(0, 254);
    }

    /**
     * Valida un objeto con múltiples campos
     * @param {Object} data - Datos a validar
     * @param {Object} rules - Reglas de validación
     * @returns {Object} Resultado de validación
     */
    validateObject(data, rules) {
        const errors = {};
        const sanitized = {};

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            
            try {
                // Verificar si es requerido
                if (rule.required && (value === undefined || value === null || value === '')) {
                    errors[field] = `${field} es requerido`;
                    continue;
                }

                // Si no es requerido y está vacío, continuar
                if (!rule.required && (value === undefined || value === null || value === '')) {
                    sanitized[field] = rule.default || null;
                    continue;
                }

                // Aplicar validaciones específicas
                if (rule.type === 'string') {
                    if (typeof value !== 'string') {
                        errors[field] = `${field} debe ser un string`;
                        continue;
                    }

                    const sanitizedValue = this.sanitizeString(value);
                    
                    if (rule.minLength && sanitizedValue.length < rule.minLength) {
                        errors[field] = `${field} debe tener al menos ${rule.minLength} caracteres`;
                        continue;
                    }

                    if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
                        errors[field] = `${field} no puede exceder ${rule.maxLength} caracteres`;
                        continue;
                    }

                    if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
                        errors[field] = `${field} tiene un formato inválido`;
                        continue;
                    }

                    sanitized[field] = sanitizedValue;
                }
                else if (rule.type === 'number') {
                    const numValue = Number(value);
                    
                    if (isNaN(numValue)) {
                        errors[field] = `${field} debe ser un número`;
                        continue;
                    }

                    if (rule.min !== undefined && numValue < rule.min) {
                        errors[field] = `${field} debe ser mayor o igual a ${rule.min}`;
                        continue;
                    }

                    if (rule.max !== undefined && numValue > rule.max) {
                        errors[field] = `${field} debe ser menor o igual a ${rule.max}`;
                        continue;
                    }

                    if (rule.integer && !Number.isInteger(numValue)) {
                        errors[field] = `${field} debe ser un entero`;
                        continue;
                    }

                    sanitized[field] = numValue;
                }
                else if (rule.type === 'email') {
                    if (!this.validateEmail(value)) {
                        errors[field] = `${field} debe ser un email válido`;
                        continue;
                    }

                    sanitized[field] = this.sanitizeEmail(value);
                }
                else if (rule.type === 'phone') {
                    if (!this.validatePhoneLoose(value)) {
                        errors[field] = `${field} debe ser un teléfono válido`;
                        continue;
                    }

                    sanitized[field] = this.sanitizePhone(value);
                }
                else if (rule.type === 'array') {
                    if (!Array.isArray(value)) {
                        errors[field] = `${field} debe ser un array`;
                        continue;
                    }

                    if (rule.minItems && value.length < rule.minItems) {
                        errors[field] = `${field} debe tener al menos ${rule.minItems} elementos`;
                        continue;
                    }

                    if (rule.maxItems && value.length > rule.maxItems) {
                        errors[field] = `${field} no puede tener más de ${rule.maxItems} elementos`;
                        continue;
                    }

                    // Sanitizar elementos del array si es de strings
                    if (rule.itemType === 'string') {
                        sanitized[field] = value.map(item => this.sanitizeString(item));
                    } else {
                        sanitized[field] = value;
                    }
                }
                else if (rule.type === 'boolean') {
                    if (typeof value !== 'boolean') {
                        errors[field] = `${field} debe ser un boolean`;
                        continue;
                    }

                    sanitized[field] = value;
                }
                else {
                    // Tipo no reconocido, usar valor tal como está
                    sanitized[field] = value;
                }

            } catch (error) {
                errors[field] = `Error validando ${field}: ${error.message}`;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            sanitized
        };
    }

    /**
     * Crea reglas de validación para invitación
     * @returns {Object}
     */
    getInvitationValidationRules() {
        return {
            guestNames: {
                type: 'array',
                required: true,
                minItems: 1,
                maxItems: 10,
                itemType: 'string'
            },
            numberOfPasses: {
                type: 'number',
                required: true,
                min: 1,
                max: 20,
                integer: true
            },
            phone: {
                type: 'phone',
                required: false
            },
            adultPasses: {
                type: 'number',
                required: false,
                min: 0,
                max: 20,
                integer: true
            },
            childPasses: {
                type: 'number',
                required: false,
                min: 0,
                max: 20,
                integer: true
            },
            staffPasses: {
                type: 'number',
                required: false,
                min: 0,
                max: 20,
                integer: true
            },
            tableNumber: {
                type: 'number',
                required: false,
                min: 1,
                max: 100,
                integer: true
            },
            status: {
                type: 'string',
                required: false,
                pattern: /^(pending|confirmed|partial|cancelled|inactive)$/
            },
            confirmedPasses: {
                type: 'number',
                required: false,
                min: 0,
                max: 20,
                integer: true
            }
        };
    }

    /**
     * Crea reglas de validación para confirmación
     * @returns {Object}
     */
    getConfirmationValidationRules() {
        return {
            willAttend: {
                type: 'boolean',
                required: true
            },
            attendingGuests: {
                type: 'number',
                required: false,
                min: 0,
                max: 20,
                integer: true
            },
            attendingNames: {
                type: 'array',
                required: false,
                maxItems: 20,
                itemType: 'string'
            },
            phone: {
                type: 'phone',
                required: false
            },
            dietaryRestrictions: {
                type: 'string',
                required: false,
                maxLength: 200
            },
            message: {
                type: 'string',
                required: false,
                maxLength: 500
            }
        };
    }

    /**
     * Valida datos de invitación
     * @param {Object} data - Datos a validar
     * @returns {Object}
     */
    validateInvitationData(data) {
        const rules = this.getInvitationValidationRules();
        return this.validateObject(data, rules);
    }

    /**
     * Valida datos de confirmación
     * @param {Object} data - Datos a validar
     * @returns {Object}
     */
    validateConfirmationData(data) {
        const rules = this.getConfirmationValidationRules();
        return this.validateObject(data, rules);
    }
}

module.exports = ValidationService;
