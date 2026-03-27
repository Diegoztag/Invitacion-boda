/**
 * Utilidad de sanitización para limpiar las entradas del usuario.
 */

/**
 * Sanitiza una cadena de texto para prevenir ataques XSS.
 * @param {string} str - La cadena a sanitizar.
 * @returns {string} La cadena sanitizada.
 */
export function sanitize(str) {
    if (typeof str !== 'string') {
        return '';
    }

    const map = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    const reg = /[&<>"'/]/gi;
    return str.replace(reg, match => map[match]);
}
