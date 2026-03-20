/**
 * Security Service
 * Servicio centralizado para protección contra XSS y CSRF
 * Sanitización de inputs y outputs
 */

class SecurityService {
    /**
     * Entidades HTML que deben ser escapadas
     */
    static HTML_ESCAPE_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };

    /**
     * Escapar HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    static escapeHtml(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        return text.replace(/[&<>"'\/]/g, char => {
            return SecurityService.HTML_ESCAPE_MAP[char] || char;
        });
    }

    /**
     * Sanitizar texto para uso en HTML
     * @param {string} text - Texto a sanitizar
     * @returns {string} Texto seguro
     */
    static sanitizeText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        return SecurityService.escapeHtml(text.trim());
    }

    /**
     * Sanitizar atributo HTML
     * @param {string} attr - Atributo a sanitizar
     * @returns {string} Atributo seguro
     */
    static sanitizeAttribute(attr) {
        if (!attr || typeof attr !== 'string') {
            return '';
        }
        // Remover javascript: y evento handlers
        const dangerous = /^javascript:|on\w+\s*=/gi;
        if (dangerous.test(attr)) {
            return '';
        }
        return SecurityService.escapeHtml(attr);
    }

    /**
     * Sanitizar URL
     * @param {string} url - URL a sanitizar
     * @returns {string} URL segura o vacía
     */
    static sanitizeUrl(url) {
        if (!url || typeof url !== 'string') {
            return '';
        }

        const trimmedUrl = url.trim();

        // Bloquear javascript:, data:, vbscript:
        if (/^(javascript|data|vbscript):/i.test(trimmedUrl)) {
            return '';
        }

        // Permitir URLs relativas y https/http
        if (/^(https?:\/\/|\/|\.)/.test(trimmedUrl)) {
            return SecurityService.escapeHtml(trimmedUrl);
        }

        // Rutas relativas sin protocolo
        if (!/[<>"'`]/g.test(trimmedUrl)) {
            return trimmedUrl;
        }

        return '';
    }

    /**
     * Limpiar objeto de datos (sanitización recursiva)
     * @param {Object} data - Objeto a limpiar
     * @returns {Object} Objeto limpio
     */
    static sanitizeObject(data) {
        if (data === null || data === undefined) {
            return null;
        }

        if (typeof data === 'string') {
            return SecurityService.sanitizeText(data);
        }

        if (Array.isArray(data)) {
            return data.map(item => SecurityService.sanitizeObject(item));
        }

        if (typeof data === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                // Sanitizar también la clave
                const cleanKey = SecurityService.sanitizeText(key);
                sanitized[cleanKey] = SecurityService.sanitizeObject(value);
            }
            return sanitized;
        }

        return data;
    }

    /**
     * Crear elemento DOM de forma segura
     * @param {string} tag - Etiqueta HTML
     * @param {Object} attrs - Atributos
     * @param {string} content - Contenido de texto (se escapará)
     * @returns {HTMLElement}
     */
    static createElement(tag, attrs = {}, content = '') {
        const element = document.createElement(tag);

        // Establecer atributos de forma segura
        for (const [key, value] of Object.entries(attrs)) {
            const safeValue = SecurityService.sanitizeAttribute(value);
            if (safeValue) {
                element.setAttribute(key, safeValue);
            }
        }

        // Establecer contenido de forma segura
        if (content) {
            element.textContent = SecurityService.sanitizeText(content);
        }

        return element;
    }

    /**
     * Validar y sanitizar email
     * @param {string} email - Email a validar
     * @returns {Object} { isValid: boolean, sanitized: string }
     */
    static validateAndSanitizeEmail(email) {
        if (!email || typeof email !== 'string') {
            return { isValid: false, sanitized: '' };
        }

        const cleaned = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return {
            isValid: emailRegex.test(cleaned),
            sanitized: SecurityService.escapeHtml(cleaned)
        };
    }

    /**
     * Validar y sanitizar nombre
     * @param {string} name - Nombre a validar
     * @returns {Object} { isValid: boolean, sanitized: string }
     */
    static validateAndSanitizeName(name) {
        if (!name || typeof name !== 'string') {
            return { isValid: false, sanitized: '' };
        }

        const cleaned = SecurityService.sanitizeText(name);
        // Permitir letras, espacios, guiones, apóstrofes
        const isValid = /^[a-záéíóúñ\s\-'\.]{2,100}$/i.test(cleaned);

        return {
            isValid,
            sanitized: cleaned
        };
    }

    /**
     * Generar token CSRF (client-side)
     * @returns {string} Token CSRF
     */
    static generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Obtener token CSRF del DOM
     * @returns {string|null} Token CSRF o null
     */
    static getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : null;
    }

    /**
     * Establecer token CSRF en meta tag
     * @param {string} token - Token CSRF
     */
    static setCSRFToken(token) {
        let meta = document.querySelector('meta[name="csrf-token"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'csrf-token');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', token);
    }

    /**
     * Hacer fetch con protección CSRF automática
     * @param {string} url - URL a llamar
     * @param {Object} options - Opciones de fetch
     * @returns {Promise<Response>}
     */
    static async secureFetch(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        // Agregar token CSRF para requests que no son GET
        if (options.method && options.method !== 'GET') {
            const csrfToken = SecurityService.getCSRFToken();
            if (csrfToken) {
                defaultHeaders['X-CSRF-Token'] = csrfToken;
            }
        }

        const mergedOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        return fetch(url, mergedOptions);
    }

    /**
     * Validar respuesta JSON del servidor
     * @param {Object} data - Datos JSON del servidor
     * @returns {boolean}
     */
    static isValidServerResponse(data) {
        // Validar que es un objeto
        if (typeof data !== 'object' || data === null) {
            return false;
        }

        // Esperar que tenga propiedades comunes
        return typeof data.success === 'boolean' || Array.isArray(data);
    }

    /**
     * Log seguro de errores (sin exponer datos sensibles)
     * @param {string} message - Mensaje
     * @param {Object} context - Contexto (se sanitiza)
     */
    static logError(message, context = {}) {
        const sanitized = {
            message: SecurityService.sanitizeText(message),
            timestamp: new Date().toISOString()
        };

        // Sanitizar contexto pero evitar exponer datos sensibles
        const safeContext = {};
        for (const [key, value] of Object.entries(context)) {
            if (!key.toLowerCase().includes('password') && !key.toLowerCase().includes('token')) {
                safeContext[key] = SecurityService.sanitizeObject(value);
            }
        }

        console.warn('SecurityService:', {
            ...sanitized,
            ...safeContext
        });
    }

    /**
     * Detectar y prevenir ataques comunes
     * @param {string} input - Input a verificar
     * @returns {Object} { isSafe: boolean, threat: string|null }
     */
    static detectThreats(input) {
        if (!input || typeof input !== 'string') {
            return { isSafe: true, threat: null };
        }

        const threats = [
            { pattern: /javascript:/gi, name: 'JavaScript Protocol' },
            { pattern: /<script[^>]*>.*?<\/script>/gi, name: 'Script Tag' },
            { pattern: /on\w+\s*=/gi, name: 'Event Handler' },
            { pattern: /<iframe/gi, name: 'IFrame' },
            { pattern: /eval\s*\(/gi, name: 'Eval Function' },
            { pattern: /data:text\/html/gi, name: 'Data URL HTML' },
            { pattern: /vbscript:/gi, name: 'VBScript Protocol' }
        ];

        for (const { pattern, name } of threats) {
            if (pattern.test(input)) {
                return { isSafe: false, threat: name };
            }
        }

        return { isSafe: true, threat: null };
    }
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityService;
}

// Hacer disponible globalmente en navegador
if (typeof window !== 'undefined') {
    window.SecurityService = SecurityService;
}
