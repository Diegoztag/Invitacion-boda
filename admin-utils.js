// admin-utils.js - Funciones utilitarias para el panel de administración

import { TIME_CONFIG, TIME_LABELS, GRADIENT_STYLES, AVATAR_GRADIENTS } from './admin-constants.js';

/**
 * Calcula los pases cancelados para una invitación
 * @param {Object} invitation - Objeto de invitación
 * @returns {number} Número de pases cancelados
 */
export function calculateCancelledPasses(invitation) {
    if (!invitation.confirmed || !invitation.confirmationDetails) {
        return 0;
    }
    
    const { willAttend } = invitation.confirmationDetails;
    
    if (!willAttend) {
        // Si no asistirán, todos los pases están cancelados
        return invitation.numberOfPasses;
    }
    
    // Si asistirán pero confirmaron menos pases de los asignados
    if (invitation.confirmedPasses < invitation.numberOfPasses) {
        return invitation.numberOfPasses - invitation.confirmedPasses;
    }
    
    return 0;
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} fullName - Nombre completo
 * @param {number} maxLength - Máximo de caracteres (default: 2)
 * @returns {string} Iniciales en mayúsculas
 */
export function getInitials(fullName, maxLength = 2) {
    if (!fullName || typeof fullName !== 'string') return '';
    
    return fullName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, maxLength);
}

/**
 * Formatea nombres de invitados para mostrar
 * @param {Array<string>} names - Array de nombres
 * @param {boolean} asHtml - Si debe retornar HTML con divs separados
 * @returns {string} Nombres formateados
 */
export function formatGuestNames(names, asHtml = false) {
    if (!Array.isArray(names) || names.length === 0) return '';
    
    const cleanNames = names
        .map(name => name.trim())
        .filter(name => name.length > 0);
    
    if (asHtml) {
        return cleanNames
            .map(name => `<div>${name}</div>`)
            .join('');
    }
    
    return cleanNames.join(' y ');
}

/**
 * Obtiene un gradiente aleatorio para avatares
 * @param {number} index - Índice opcional para gradiente consistente
 * @returns {Object} Objeto con className y style
 */
export function getRandomGradient(index = null) {
    const gradientIndex = index !== null 
        ? index % GRADIENT_STYLES.length 
        : Math.floor(Math.random() * GRADIENT_STYLES.length);
    
    return {
        className: AVATAR_GRADIENTS[gradientIndex % AVATAR_GRADIENTS.length],
        style: GRADIENT_STYLES[gradientIndex]
    };
}

/**
 * Calcula el tiempo transcurrido desde una fecha
 * @param {Date} date - Fecha a comparar
 * @returns {string} Texto descriptivo del tiempo transcurrido
 */
export function getTimeAgo(date) {
    if (!date || !(date instanceof Date)) {
        date = new Date(date);
    }
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) {
        return 'hace un momento';
    } else if (minutes < TIME_CONFIG.MINUTES_IN_HOUR) {
        return `hace ${minutes} ${minutes === 1 ? TIME_LABELS.MINUTE_SINGULAR : TIME_LABELS.MINUTE_PLURAL}`;
    } else if (hours < TIME_CONFIG.HOURS_IN_DAY) {
        return `hace ${hours} ${hours === 1 ? TIME_LABELS.HOUR_SINGULAR : TIME_LABELS.HOUR_PLURAL}`;
    } else if (days === 1) {
        return TIME_LABELS.YESTERDAY;
    } else if (days < TIME_CONFIG.RECENT_DAYS) {
        return `hace ${days} ${TIME_LABELS.DAYS_AGO}`;
    } else {
        return date.toLocaleDateString('es-MX', { 
            day: 'numeric',
            month: 'short'
        });
    }
}

/**
 * Determina el tipo de pase basado en la invitación
 * @param {Object} invitation - Objeto de invitación
 * @returns {string} Texto descriptivo del tipo de pase
 */
export function getPassTypeText(invitation) {
    if (invitation.invitationType === 'family') {
        return 'familia';
    } else if (invitation.invitationType === 'staff') {
        return 'staff';
    } else if (invitation.numberOfPasses === 1) {
        return 'adulto';
    } else {
        return 'adultos';
    }
}

/**
 * Genera un número de mesa aleatorio (temporal hasta implementar asignación real)
 * @param {string} invitationCode - Código de invitación para generar consistentemente
 * @returns {number} Número de mesa entre 1 y 10
 */
export function getTableNumber(invitationCode) {
    // Usar el código para generar un número consistente
    let hash = 0;
    for (let i = 0; i < invitationCode.length; i++) {
        hash = ((hash << 5) - hash) + invitationCode.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return (Math.abs(hash) % 10) + 1;
}

/**
 * Formatea una fecha para mostrar
 * @param {Date|string} date - Fecha a formatear
 * @param {boolean} includeTime - Si incluir la hora
 * @returns {string} Fecha formateada
 */
export function formatDate(date, includeTime = true) {
    if (!date) return '-';
    
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const options = {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('es-MX', options);
}

/**
 * Valida si un string es un número de teléfono válido
 * @param {string} phone - Número de teléfono
 * @returns {boolean} True si es válido
 */
export function isValidPhone(phone) {
    if (!phone) return false;
    // Remover espacios y guiones
    const cleaned = phone.replace(/[\s-]/g, '');
    // Verificar formato mexicano básico
    return /^\+?52?\d{10}$/.test(cleaned);
}

/**
 * Limpia y formatea un número de teléfono
 * @param {string} phone - Número de teléfono
 * @returns {string} Teléfono formateado
 */
export function formatPhone(phone) {
    if (!phone) return '';
    
    // Remover caracteres no numéricos excepto +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Si no tiene código de país, agregar +52
    if (!cleaned.startsWith('+')) {
        if (!cleaned.startsWith('52')) {
            cleaned = '+52' + cleaned;
        } else {
            cleaned = '+' + cleaned;
        }
    }
    
    return cleaned;
}

/**
 * Calcula estadísticas de porcentaje con umbrales
 * @param {number} current - Valor actual
 * @param {number} target - Valor objetivo
 * @returns {Object} Objeto con percentage y badgeClass
 */
export function calculatePercentageStats(current, target) {
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
    
    let badgeClass = 'warning';
    if (percentage >= 100) {
        badgeClass = 'success';
    } else if (percentage >= 75) {
        badgeClass = 'primary';
    }
    
    return {
        percentage,
        badgeClass
    };
}

/**
 * Genera un ID único simple
 * @returns {string} ID único
 */
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce function para optimizar búsquedas
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función con debounce
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Parsea un CSV simple
 * @param {string} text - Contenido CSV
 * @returns {Array} Array de objetos con los datos
 */
export function parseSimpleCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const invitations = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles basic cases)
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length >= 2) {
            const names = parts[0].split(/\s+y\s+/i).map(n => n.trim());
            const passes = parseInt(parts[1]);
            const phone = parts[2] || '';
            const adultPasses = parts[3] ? parseInt(parts[3]) : passes;
            const childPasses = parts[4] ? parseInt(parts[4]) : 0;
            const invitationType = parts[5] || 'adults';
            
            if (names.length > 0 && !isNaN(passes) && passes > 0) {
                invitations.push({
                    guestNames: names,
                    numberOfPasses: passes,
                    phone: formatPhone(phone),
                    adultPasses,
                    childPasses,
                    invitationType
                });
            }
        }
    }
    
    return invitations;
}
