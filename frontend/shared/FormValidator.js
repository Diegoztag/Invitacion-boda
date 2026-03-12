/**
 * Form Validator
 * Validación de formularios en cliente con mensajes en tiempo real
 * Integrado con SecurityService para prevención de XSS
 */

class FormValidator {
    /**
     * Reglas de validación predefinidas
     */
    static RULES = {
        required: {
            validate: value => value && value.trim().length > 0,
            message: 'Este campo es obligatorio'
        },
        email: {
            validate: value => {
                if (!value) {
                    return true;
                } // Optional
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message: 'Por favor ingresa un email válido'
        },
        phone: {
            validate: value => {
                if (!value) {
                    return true;
                } // Optional
                return /^[\+]?[1-9][\d\s\-\(\)]{0,15}$/.test(value);
            },
            message: 'Por favor ingresa un teléfono válido'
        },
        minLength: {
            validate: (value, min) => !value || value.length >= min,
            message: (_, min) => `Mínimo ${min} caracteres`
        },
        maxLength: {
            validate: (value, max) => !value || value.length <= max,
            message: (_, max) => `Máximo ${max} caracteres`
        },
        min: {
            validate: (value, min) => !value || parseInt(value) >= min,
            message: (_, min) => `Mínimo ${min}`
        },
        max: {
            validate: (value, max) => !value || parseInt(value) <= max,
            message: (_, max) => `Máximo ${max}`
        },
        number: {
            validate: value => !value || (!isNaN(value) && isFinite(value)),
            message: 'Debe ser un número'
        },
        integer: {
            validate: value => !value || Number.isInteger(parseInt(value)),
            message: 'Debe ser un número entero'
        },
        url: {
            validate: value => {
                if (!value) {
                    return true;
                }
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            message: 'Por favor ingresa una URL válida'
        },
        match: {
            validate: (value, fieldName, formData) => value === formData[fieldName],
            message: (_, fieldName) => `Debe coincidir con ${fieldName}`
        }
    };

    constructor(formElement) {
        this.form = formElement;
        this.errors = {};
        this.setupListeners();
    }

    /**
     * Configurar listeners para validación en tiempo real
     */
    setupListeners() {
        const inputs = this.form.querySelectorAll('[data-validate]');

        inputs.forEach(input => {
            // Validar al perder el foco
            input.addEventListener('blur', () => this.validateField(input));

            // Validar en tiempo real (para feedback visual)
            input.addEventListener('input', () => {
                // Sanitizar mientras escribe
                if (input.type !== 'number' && input.type !== 'email') {
                    const sanitized = SecurityService.sanitizeText(input.value);
                    if (sanitized !== input.value) {
                        input.value = sanitized;
                    }
                }
            });

            // Prevenir caracteres peligrosos
            input.addEventListener('keypress', e => {
                const threat = SecurityService.detectThreats(e.key);
                if (!threat.isSafe) {
                    e.preventDefault();
                    console.warn(`Carácter bloqueado: ${threat.threat}`);
                }
            });
        });
    }

    /**
     * Validar un campo individual
     * @param {HTMLElement} field - Campo a validar
     * @returns {boolean} Es válido
     */
    validateField(field) {
        const name = field.name;
        const value = field.value;
        const rules = field.dataset.validate?.split(',').map(r => r.trim()) || [];
        const params = {};

        // Parsear parámetros de validación (ej: minLength:5)
        rules.forEach(rule => {
            const [ruleName, param] = rule.split(':');
            if (!params[ruleName]) {
                params[ruleName] = param;
            }
        });

        // Ejecutar validaciones
        const fieldErrors = [];

        for (const ruleName of Object.keys(params)) {
            const rule = FormValidator.RULES[ruleName];
            if (!rule) {
                continue;
            }

            const param = params[ruleName];
            const isValid = rule.validate(value, param, this.getFormData());

            if (!isValid) {
                const message =
                    typeof rule.message === 'function' ? rule.message(value, param) : rule.message;
                fieldErrors.push(message);
            }
        }

        // Detectar amenazas de seguridad
        if (value && !fieldErrors.includes('Error de seguridad')) {
            const threat = SecurityService.detectThreats(value);
            if (!threat.isSafe) {
                fieldErrors.push(`Contenido potencialmente peligroso detectado: ${threat.threat}`);
            }
        }

        // Actualizar errores
        if (fieldErrors.length > 0) {
            this.errors[name] = fieldErrors;
            this.showFieldError(field, fieldErrors);
            return false;
        } else {
            delete this.errors[name];
            this.clearFieldError(field);
            return true;
        }
    }

    /**
     * Validar todos los campos del formulario
     * @returns {boolean} Formulario válido
     */
    validate() {
        this.errors = {};
        const fields = this.form.querySelectorAll('[data-validate]');

        let isValid = true;
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Mostrar error en un campo
     * @param {HTMLElement} field - Campo
     * @param {Array} messages - Mensajes de error
     */
    showFieldError(field, messages) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');

        // Remover mensaje anterior
        const existingError = field.parentElement?.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }

        // Crear nuevo mensaje
        const errorDiv = SecurityService.createElement('div', {
            class: 'invalid-feedback d-block'
        });

        const messagesList = SecurityService.createElement('ul', {
            class: 'mb-0 ps-3'
        });

        messages.forEach(msg => {
            const li = SecurityService.createElement('li', { class: 'small' }, msg);
            messagesList.appendChild(li);
        });

        errorDiv.appendChild(messagesList);
        field.parentElement?.appendChild(errorDiv);
    }

    /**
     * Limpiar error de un campo
     * @param {HTMLElement} field - Campo
     */
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');

        const errorDiv = field.parentElement?.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Obtener datos del formulario sanitizados
     * @returns {Object}
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            // Sanitizar cada valor
            data[key] = SecurityService.sanitizeText(value);
        }

        return data;
    }

    /**
     * Limpiar formulario
     */
    reset() {
        this.form.reset();
        this.errors = {};
        const fields = this.form.querySelectorAll('[data-validate]');
        fields.forEach(field => {
            this.clearFieldError(field);
        });
    }

    /**
     * Mostrar todos los errores
     */
    showAllErrors() {
        const fields = this.form.querySelectorAll('[data-validate]');
        fields.forEach(field => this.validateField(field));
    }

    /**
     * Obtener resumen de errores
     * @returns {Object}
     */
    getErrors() {
        return { ...this.errors };
    }

    /**
     * Transformar datos del formulario a objeto estructurado
     * @param {Function} transformer - Función para transformar datos
     * @returns {Object|null} Datos transformados o null si hay errores
     */
    getData(transformer) {
        if (!this.validate()) {
            return null;
        }

        const data = this.getFormData();
        return transformer ? transformer(data) : data;
    }
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.FormValidator = FormValidator;
}
