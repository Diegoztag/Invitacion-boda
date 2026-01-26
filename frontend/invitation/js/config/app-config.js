/**
 * Configuración de la aplicación frontend
 */

export const APP_CONFIG = {
    // Configuración de la aplicación
    app: {
        name: 'Wedding Invitation System',
        version: '2.0.0',
        environment: 'production', // 'development' | 'production'
        debug: false
    },
    
    // Configuración de API
    api: {
        baseUrl: window.location.origin,
        endpoints: {
            invitation: '/api/invitation',
            confirm: '/api/confirm',
            health: '/api/health'
        },
        timeout: 10000, // 10 segundos
        retries: 3
    },
    
    // Configuración de UI
    ui: {
        // Configuración de animaciones
        animations: {
            duration: 300,
            easing: 'ease-in-out',
            enableAnimations: true
        },
        
        // Configuración de scroll
        scroll: {
            offset: 80, // Offset para navegación
            behavior: 'smooth',
            debounceTime: 50
        },
        
        // Configuración de modal
        modal: {
            closeOnBackdrop: true,
            closeOnEscape: true,
            animationDuration: 300
        },
        
        // Configuración de carousel
        carousel: {
            autoplay: true,
            autoplayDelay: 5000,
            transitionDuration: 500,
            pauseOnHover: true
        },
        
        // Configuración de countdown
        countdown: {
            updateInterval: 1000, // 1 segundo
            showMilliseconds: false,
            format: 'DD:HH:MM:SS'
        }
    },
    
    // Configuración de validación
    validation: {
        // Reglas de validación para formularios
        rules: {
            guestName: {
                required: true,
                minLength: 2,
                maxLength: 100,
                pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
            },
            phone: {
                required: false,
                pattern: /^[\d\s\-\+\(\)]+$/,
                minLength: 10,
                maxLength: 15
            },
            email: {
                required: false,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            }
        },
        
        // Mensajes de error
        messages: {
            required: 'Este campo es obligatorio',
            minLength: 'Debe tener al menos {min} caracteres',
            maxLength: 'No puede tener más de {max} caracteres',
            pattern: 'El formato no es válido',
            email: 'Ingrese un email válido',
            phone: 'Ingrese un teléfono válido'
        }
    },
    
    // Configuración de notificaciones
    notifications: {
        duration: 5000, // 5 segundos
        position: 'top-right',
        maxVisible: 3,
        types: {
            success: {
                icon: '✅',
                className: 'notification-success'
            },
            error: {
                icon: '❌',
                className: 'notification-error'
            },
            warning: {
                icon: '⚠️',
                className: 'notification-warning'
            },
            info: {
                icon: 'ℹ️',
                className: 'notification-info'
            }
        }
    },
    
    // Configuración de performance
    performance: {
        // Configuración de debounce/throttle
        debounce: {
            scroll: 10,
            resize: 100,
            input: 300,
            search: 500
        },
        
        // Configuración de lazy loading
        lazyLoading: {
            enabled: true,
            threshold: 0.1,
            rootMargin: '50px'
        },
        
        // Configuración de cache
        cache: {
            enabled: true,
            duration: 300000, // 5 minutos
            maxSize: 50
        }
    },
    
    // Configuración de logging
    logging: {
        enabled: true,
        level: 'info', // 'debug' | 'info' | 'warn' | 'error'
        console: true,
        remote: false
    },
    
    // Configuración de features
    features: {
        // Features que pueden ser habilitadas/deshabilitadas
        enableServiceWorker: false,
        enableAnalytics: false,
        enableErrorReporting: false,
        enablePerformanceMonitoring: false,
        enableA11y: true, // Accessibility
        enableKeyboardNavigation: true
    },
    
    // Configuración de breakpoints para responsive
    breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200,
        large: 1400
    },
    
    // Configuración de meta tags dinámicos
    meta: {
        updateTitle: true,
        updateDescription: true,
        updateOgTags: true,
        updateTwitterTags: true
    }
};

/**
 * Obtiene una configuración por path usando dot notation
 * @param {string} path - Path de la configuración (ej: 'ui.animations.duration')
 * @param {*} defaultValue - Valor por defecto si no se encuentra
 * @returns {*} Valor de la configuración
 */
export function getConfig(path, defaultValue = null) {
    return path.split('.').reduce((obj, key) => {
        return obj && obj[key] !== undefined ? obj[key] : defaultValue;
    }, APP_CONFIG);
}

/**
 * Verifica si una feature está habilitada
 * @param {string} featureName - Nombre de la feature
 * @returns {boolean}
 */
export function isFeatureEnabled(featureName) {
    return getConfig(`features.${featureName}`, false);
}

/**
 * Obtiene la configuración de breakpoints
 * @returns {Object}
 */
export function getBreakpoints() {
    return APP_CONFIG.breakpoints;
}

/**
 * Verifica si estamos en modo debug
 * @returns {boolean}
 */
export function isDebugMode() {
    return getConfig('app.debug', false);
}

/**
 * Obtiene la configuración de API
 * @returns {Object}
 */
export function getApiConfig() {
    return APP_CONFIG.api;
}
