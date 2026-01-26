/**
 * Función debounce para limitar la frecuencia de ejecución de funciones
 * Útil para eventos como scroll, resize, input, etc.
 */

/**
 * Crea una función debounced que retrasa la ejecución hasta que hayan pasado
 * los milisegundos especificados desde la última vez que fue invocada
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en milisegundos
 * @param {boolean} immediate - Si debe ejecutarse inmediatamente en el primer call
 * @returns {Function} Función debounced
 */
export function debounce(func, wait, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        
        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(this, args);
    };
}

/**
 * Función throttle para limitar la ejecución a una vez por intervalo
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Intervalo mínimo entre ejecuciones en milisegundos
 * @returns {Function} Función throttled
 */
export function throttle(func, limit) {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
