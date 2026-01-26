// dashboard-utils.js - Funciones utilitarias para el panel de administración

import { TIME_CONFIG, TIME_LABELS, GRADIENT_STYLES, AVATAR_GRADIENTS } from './dashboard-constants.js';

/**
 * Calcula los pases cancelados de una invitación
 * @param {Object} invitation - Datos de la invitación
 * @returns {number} Número de pases cancelados
 */
function calculateCancelledPasses(invitation) {
    if (!invitation) return 0;
    
    // Si la invitación está cancelada, todos los pases están cancelados
    if (invitation.status === 'cancelled') {
        return invitation.numberOfPasses || 0;
    }
    
    // Si está confirmada parcialmente, calcular pases no confirmados
    if (invitation.status === 'partial') {
        const numberOfPasses = invitation.numberOfPasses || 0;
        const confirmedPasses = invitation.confirmedPasses || 0;
        return Math.max(0, numberOfPasses - confirmedPasses);
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
    
    if (cleanNames.length === 0) return '';
    if (cleanNames.length === 1) return cleanNames[0];
    if (cleanNames.length === 2) return cleanNames.join(' y ');
    
    const last = cleanNames[cleanNames.length - 1];
    const others = cleanNames.slice(0, -1);
    return `${others.join(', ')} y ${last}`;
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
    // Determinar tipo basado en la composición de pases
    if (invitation.childPasses && invitation.childPasses > 0) {
        return 'familia';
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
 * Obtiene un valor seguro, con fallback si es undefined/null
 * @param {*} value - Valor a verificar
 * @param {*} fallback - Valor de fallback (default: 0)
 * @returns {*} Valor seguro
 */
export function getSafeValue(value, fallback = 0) {
    return (value !== undefined && value !== null) ? value : fallback;
}

/**
 * Actualiza los elementos de estadísticas en el UI usando la nueva estructura optimizada
 * @param {Object} stats - Objeto con las estadísticas (nueva estructura sin duplicaciones)
 * @param {string} suffix - Sufijo para los IDs de elementos (ej: 'Stats' para la sección de invitaciones)
 */
export function updateStatsUI(stats, suffix = '') {
    // Validar que stats existe y es un objeto
    if (!stats || typeof stats !== 'object') {
        console.warn('updateStatsUI: stats is not a valid object', stats);
        return;
    }
    
    // Extraer datos de la nueva estructura optimizada
    const invitations = stats.invitations || {};
    const confirmations = stats.confirmations || {};
    const rates = stats.rates || {};
    
    // Actualizar contadores principales
    const totalInvitationsEl = document.getElementById(`totalInvitations${suffix}`);
    const confirmedPassesEl = document.getElementById(`confirmedPasses${suffix}`);
    const pendingInvitationsEl = document.getElementById(`pendingInvitations${suffix}`);
    const cancelledPassesEl = document.getElementById(`cancelledPasses${suffix}`);
    
    if (totalInvitationsEl) {
        // En el dashboard (sin sufijo), mostrar totalPasses
        // En la sección de invitaciones (con sufijo 'Stats'), mostrar totalInvitations
        let totalValue;
        if (suffix === 'Stats') {
            totalValue = getSafeValue(invitations.total);
        } else {
            totalValue = getSafeValue(invitations.totalPasses, getSafeValue(invitations.total));
        }
        totalInvitationsEl.textContent = totalValue;
        console.log(`Updated totalInvitations${suffix}:`, totalValue);
    }
    
    if (confirmedPassesEl) {
        // En el dashboard, mostrar confirmedPasses
        // En la sección de invitaciones, mostrar número de invitaciones confirmadas
        let confirmedValue;
        if (suffix === 'Stats') {
            // Para la sección de invitaciones, contar invitaciones confirmadas
            confirmedValue = getSafeValue(invitations.confirmed, getSafeValue(confirmations.totalConfirmedGuests));
        } else {
            confirmedValue = getSafeValue(confirmations.totalConfirmedGuests);
        }
        confirmedPassesEl.textContent = confirmedValue;
        console.log(`Updated confirmedPasses${suffix}:`, confirmedValue);
    }
    
    if (pendingInvitationsEl) {
        // En el dashboard, mostrar pendingPasses
        // En la sección de invitaciones, mostrar pendingInvitations
        let pendingValue;
        if (suffix === 'Stats') {
            pendingValue = getSafeValue(invitations.pending, getSafeValue(confirmations.pendingPasses));
        } else {
            pendingValue = getSafeValue(confirmations.pendingPasses, getSafeValue(invitations.pending));
        }
        pendingInvitationsEl.textContent = pendingValue;
        console.log(`Updated pendingInvitations${suffix}:`, pendingValue);
    }
    
    if (cancelledPassesEl) {
        // Mostrar pases/invitaciones canceladas según el contexto
        // CORRECCIÓN: Usar solo el valor de canceladas, no sumar inactivas
        let cancelledValue = getSafeValue(invitations.cancelled, 0);
        
        cancelledPassesEl.textContent = cancelledValue;
        console.log(`Updated cancelledPasses${suffix}:`, cancelledValue);
    }
    
    // Actualizar elementos adicionales si existen
    const confirmationRateEl = document.getElementById(`confirmationRate${suffix}`);
    if (confirmationRateEl && rates.confirmationRate) {
        confirmationRateEl.textContent = `${rates.confirmationRate}%`;
    }
    
    const attendanceRateEl = document.getElementById(`attendanceRate${suffix}`);
    if (attendanceRateEl && rates.attendanceRate) {
        attendanceRateEl.textContent = `${rates.attendanceRate}%`;
    }
}

/**
 * Actualiza el indicador de cambio de confirmaciones
 * @param {number} recentConfirmations - Número de confirmaciones recientes
 */
export function updateConfirmedChangeIndicator(recentConfirmations) {
    const confirmedChange = document.getElementById('confirmedChange');
    if (!confirmedChange) return;
    
    if (recentConfirmations > 0) {
        confirmedChange.innerHTML = `<i class="fas fa-arrow-up trend-icon"></i> +${recentConfirmations}`;
        confirmedChange.classList.remove('warning', 'danger');
        confirmedChange.classList.add('success');
    } else {
        confirmedChange.innerHTML = `<i class="fas fa-minus trend-icon"></i> 0`;
        confirmedChange.classList.remove('success', 'danger');
        confirmedChange.classList.add('warning');
    }
}

/**
 * Actualiza elementos con valores objetivo/meta
 * @param {Object} targets - Objeto con valores objetivo
 * @param {number} targets.targetTotal - Meta total de pases
 */
export function updateTargetElements(targets) {
    const { targetTotal } = targets;
    
    // Actualizar elementos que muestran la meta total
    const targetTotalElements = document.querySelectorAll('[data-target="total"]');
    targetTotalElements.forEach(el => {
        el.textContent = getSafeValue(targetTotal, 250);
    });
    
    // Actualizar elementos específicos por ID si existen
    const targetTotalEl = document.getElementById('targetTotal');
    if (targetTotalEl) {
        targetTotalEl.textContent = getSafeValue(targetTotal, 250);
    }
    
    console.log('Updated target elements:', { targetTotal });
}


/**
 * Genera un badge de estado para una invitación
 * @param {Object} invitation - Objeto de invitación
 * @param {Object} options - Opciones adicionales
 * @param {boolean} options.showIcon - Si mostrar icono (para badges grandes)
 * @param {boolean} options.showDot - Si mostrar punto indicador
 * @param {boolean} options.animate - Si animar el punto (para pendientes)
 * @returns {Object} Objeto con HTML, clase, texto, color e icono
 */
export function getStatusBadge(invitation, options = {}) {
    const { showIcon = false, showDot = false, animate = false } = options;
    
    // Usar el estado directamente del objeto, con fallback a 'pending'
    const rawStatus = invitation.status || 'pending';
    
    let status = rawStatus;
    let statusText = 'Pendiente';
    let statusClass = 'pending';
    let statusColor = '#ff9800';
    let statusIcon = 'clock';
    
    switch (rawStatus) {
        case 'confirmed':
        case 'accepted': // Legacy support
            status = 'confirmed';
            statusText = 'Confirmado';
            statusClass = 'confirmed';
            statusColor = '#4caf50';
            statusIcon = 'check-circle';
            break;
            
        case 'partial':
            status = 'partial';
            statusText = 'Parcial';
            statusClass = 'partial';
            statusColor = '#ff6b6b';
            statusIcon = 'exclamation-circle';
            break;
            
        case 'cancelled':
        case 'rejected': // Legacy support
            status = 'cancelled';
            statusText = 'Cancelado';
            statusClass = 'rejected'; // Mantener clase visual 'rejected' para rojo
            statusColor = '#f44336';
            statusIcon = 'times-circle';
            break;
            
        case 'inactive':
            status = 'inactive';
            statusText = 'Inactivo';
            statusClass = 'inactive';
            statusColor = '#9e9e9e';
            statusIcon = 'power-off';
            break;
            
        case 'pending':
        default:
            status = 'pending';
            statusText = 'Pendiente';
            statusClass = 'pending';
            statusColor = '#ff9800';
            statusIcon = 'clock';
            break;
    }
    
    // Construir HTML del badge
    let html = '';
    
    if (showIcon) {
        // Badge grande con icono (para modales)
        html = `<span class="status-badge status-badge-large ${statusClass}">
            <i class="fas fa-${statusIcon}"></i> ${statusText}
        </span>`;
    } else {
        // Badge normal
        let dotHtml = '';
        if (showDot) {
            const animationClass = animate && status === 'pending' ? 'status-dot-animated' : '';
            dotHtml = `<span class="status-dot ${animationClass}"></span>`;
        }
        html = `<span class="status-badge ${statusClass}">${dotHtml}${statusText}</span>`;
    }
    
    return {
        html,
        status,
        statusText,
        statusClass,
        statusColor,
        statusIcon
    };
}

/**
 * Genera un badge para estadísticas
 * @param {number} value - Valor a mostrar
 * @param {string} type - Tipo de badge (percentage, count, trend)
 * @param {Object} options - Opciones adicionales
 * @returns {string} HTML del badge
 */
export function renderStatBadge(value, type = 'count', options = {}) {
    const {
        title = '',
        threshold = null,
        showTrend = false,
        trendDirection = 'up',
        badgeClass = ''
    } = options;
    
    let html = '';
    let finalBadgeClass = badgeClass;
    
    switch (type) {
        case 'percentage':
            // Determinar clase basada en umbral
            if (!badgeClass && threshold !== null) {
                if (value >= 100) {
                    finalBadgeClass = 'success';
                } else if (value >= threshold) {
                    finalBadgeClass = 'primary';
                } else {
                    finalBadgeClass = 'warning';
                }
            }
            html = `<span class="stat-badge ${finalBadgeClass}" ${title ? `title="${title}"` : ''}>${value}%</span>`;
            break;
            
        case 'trend':
            // Badge con tendencia
            const trendIcon = trendDirection === 'up' ? 'arrow-up' : trendDirection === 'down' ? 'arrow-down' : 'minus';
            const trendClass = value > 0 ? 'success' : value < 0 ? 'danger' : 'warning';
            html = `<span class="stat-badge ${trendClass}">
                <i class="fas fa-${trendIcon} trend-icon"></i> ${value > 0 ? '+' : ''}${value}
            </span>`;
            break;
            
        case 'count':
        default:
            // Badge simple de conteo
            html = `<span class="stat-badge ${finalBadgeClass}" ${title ? `title="${title}"` : ''}>${value}</span>`;
            break;
    }
    
    return html;
}

/**
 * Determina el tipo de badge basado en el valor y configuración
 * @param {number} current - Valor actual
 * @param {number} target - Valor objetivo
 * @param {Object} thresholds - Umbrales para determinar el tipo
 * @returns {string} Clase CSS del badge
 */
export function getBadgeType(current, target, thresholds = { high: 75, medium: 50 }) {
    const percentage = target > 0 ? (current / target) * 100 : 0;
    
    if (percentage >= 100) return 'success';
    if (percentage >= thresholds.high) return 'primary';
    if (percentage >= thresholds.medium) return 'warning';
    return 'danger';
}

/**
 * Renderiza una fila de tabla para invitaciones
 * @param {Object} invitation - Objeto de invitación
 * @param {string} tableType - Tipo de tabla ('invitations', 'recent', 'create')
 * @param {number} index - Índice para gradientes consistentes
 * @returns {string} HTML de la fila
 */
export function renderTableRow(invitation, tableType = 'invitations', index = 0) {
    switch (tableType) {
        case 'recent':
            return renderRecentConfirmationRow(invitation, index);
        case 'create':
            return renderCreateSectionRow(invitation, index);
        case 'invitations':
        default:
            return renderInvitationRow(invitation, index);
    }
}

/**
 * Renderiza una fila para la tabla de invitaciones principal
 * @param {Object} invitation - Objeto de invitación
 * @param {number} index - Índice para gradiente
 * @returns {string} HTML de la fila
 */
function renderInvitationRow(invitation, index = 0) {
    // Validaciones defensivas
    if (!invitation) {
        console.warn('renderInvitationRow: invitation is null or undefined');
        return '<tr><td colspan="6">Error: Invitación no válida</td></tr>';
    }
    
    const invitationCode = invitation.code || 'UNKNOWN';
    const statusBadge = getStatusBadge(invitation).html;
    
    // Procesar nombres de invitados con validación
    let guestNames = [];
    if (Array.isArray(invitation.guestNames) && invitation.guestNames.length > 0) {
        guestNames = invitation.guestNames.filter(name => name && name.trim());
    } else if (typeof invitation.guestNames === 'string' && invitation.guestNames.trim()) {
        guestNames = invitation.guestNames
            .split(/[|&y]/)
            .map(name => name.trim())
            .filter(name => name && name.length > 0);
    }
    
    // Si no hay nombres válidos, usar código como fallback
    const displayNames = guestNames.length > 0 ? formatGuestNames(guestNames) : `Invitación ${invitationCode}`;
    
    // Preparar datos para el avatar y estructura rica
    const firstGuestName = guestNames.length > 0 ? guestNames[0] : invitationCode;
    const initials = getInitials(firstGuestName);
    const { className: gradientClass } = getRandomGradient(index);
    
    // Formatear nombres para mostrar en líneas separadas si son múltiples
    const guestNamesFormatted = guestNames.length > 0 
        ? guestNames.map(name => `<div class="guest-name-item">${escapeHtml(name)}</div>`).join('')
        : `<div class="guest-name-item fallback">${escapeHtml(displayNames)}</div>`;

    const numberOfPasses = getSafeValue(invitation.numberOfPasses, 1);
    const confirmedPasses = getSafeValue(invitation.confirmedPasses, 0);
    const tableNumber = invitation.tableNumber || getTableNumber(invitationCode);
    const message = invitation.generalMessage;
    
    // Mostrar pases como "Confirmados / Total" si hay confirmados, o solo Total
    const passesDisplay = confirmedPasses > 0 
        ? `<span class="passes-confirmed">${confirmedPasses}</span> / <span class="passes-total">${numberOfPasses}</span>`
        : `<span class="passes-total">${numberOfPasses}</span>`;
    
    return `
        <td>
            <div class="guest-cell">
                <div class="guest-avatar ${gradientClass}">${initials}</div>
                <div class="guest-info">
                    <div class="guest-name-cell">${guestNamesFormatted}</div>
                </div>
            </div>
        </td>
        <td>${statusBadge}</td>
        <td>${passesDisplay}</td>
        <td>
            <div class="table-cell-center">
                <div class="table-number-display">${tableNumber}</div>
            </div>
        </td>
        <td>
            <span class="message-text">
                ${message ? `"${escapeHtml(message)}"` : '-'}
            </span>
        </td>
        <td class="table-cell-right">
            <div class="action-buttons">
                <button class="btn btn-sm btn-secondary" data-action="view-invitation" data-code="${invitationCode}" title="Ver detalles">
                    <i class="fas fa-eye"></i> <span class="d-none d-md-inline">Detalles</span>
                </button>
                <button class="btn btn-sm btn-ghost" data-action="copy-invitation-link" data-code="${invitationCode}" title="Copiar enlace">
                    <i class="fas fa-link"></i>
                </button>
            </div>
        </td>
    `;
}

/**
 * Renderiza una fila para la tabla de confirmaciones recientes
 * @param {Object} invitation - Objeto de invitación
 * @param {number} index - Índice para gradiente
 * @returns {string} HTML de la fila
 */
function renderRecentConfirmationRow(invitation, index) {
    // Validaciones defensivas
    if (!invitation) {
        console.warn('renderRecentConfirmationRow: invitation is null or undefined');
        return '<tr><td colspan="6">Error: Invitación no válida</td></tr>';
    }
    
    // Validar que el código existe
    const invitationCode = invitation.code || `FALLBACK_${Date.now()}`;
    
    // Procesar nombres de invitados con mejor manejo de errores
    let guestNames = [];
    let hasValidNames = false;
    
    if (Array.isArray(invitation.guestNames) && invitation.guestNames.length > 0) {
        guestNames = invitation.guestNames.filter(name => name && name.trim());
        hasValidNames = guestNames.length > 0;
    } else if (typeof invitation.guestNames === 'string' && invitation.guestNames.trim()) {
        // Si es un string, dividir por separadores comunes
        guestNames = invitation.guestNames
            .split(/[|&y]/)
            .map(name => name.trim())
            .filter(name => name && name.length > 0);
        hasValidNames = guestNames.length > 0;
    }
    
    // Si no hay nombres válidos, usar el código como fallback
    if (!hasValidNames) {
        console.info(`renderRecentConfirmationRow: No valid guest names for invitation ${invitationCode}, using code as fallback`);
        guestNames = [`Invitación ${invitationCode}`];
    }
    
    const firstGuestName = guestNames[0];
    const initials = getInitials(firstGuestName);
    const timeAgo = invitation.confirmationDate ? getTimeAgo(new Date(invitation.confirmationDate)) : '';
    const { className: gradientClass } = getRandomGradient(index);
    const statusBadge = getStatusBadge(invitation).html;
    
    // Format guest names - display each name on a separate line with better styling
    const guestNamesFormatted = guestNames.map(name => {
        const escapedName = escapeHtml(name);
        return `<div class="guest-name-item">${escapedName}</div>`;
    }).join('');
    
    // Use actual tableNumber if available, otherwise use generated one
    const tableNumber = invitation.tableNumber || getTableNumber(invitationCode);
    const confirmedPasses = getSafeValue(invitation.confirmedPasses, 0);
    const numberOfPasses = getSafeValue(invitation.numberOfPasses, 1);
    
    const message = invitation.generalMessage;
    const displayPasses = confirmedPasses > 0 ? confirmedPasses : numberOfPasses;
    
    return `
        <td>
            <div class="guest-cell">
                <div class="guest-avatar ${gradientClass}">${initials}</div>
                <div class="guest-info">
                    <div class="guest-name-cell">${guestNamesFormatted}</div>
                    <span class="guest-time">${timeAgo}</span>
                </div>
            </div>
        </td>
        <td>${statusBadge}</td>
        <td>
            <span class="passes-count">${displayPasses}</span>
        </td>
        <td>
            <div class="table-cell-center">
                <div class="table-number-display">${tableNumber}</div>
            </div>
        </td>
        <td>
            <span class="message-text">
                ${message ? `"${escapeHtml(message)}"` : '-'}
            </span>
        </td>
        <td class="table-cell-right">
            <button class="btn btn-sm btn-ghost btn-icon-only" data-action="view-invitation" data-code="${invitationCode}" title="Ver Detalle">
                <i class="fas fa-eye"></i>
            </button>
        </td>
    `;
}

/**
 * Renderiza una fila para la tabla de la sección crear
 * @param {Object} invitation - Objeto de invitación
 * @param {number} index - Índice para gradiente
 * @returns {string} HTML de la fila
 */
function renderCreateSectionRow(invitation, index) {
    // Validaciones defensivas
    if (!invitation) {
        console.warn('renderCreateSectionRow: invitation is null or undefined');
        return '<tr><td colspan="5">Error: Invitación no válida</td></tr>';
    }
    
    // Asegurar que guestNames existe y es un array
    const guestNames = Array.isArray(invitation.guestNames) ? invitation.guestNames : [];
    const firstGuestName = guestNames.length > 0 ? guestNames[0] : 'Invitado';
    
    const initials = getInitials(firstGuestName);
    const { className: gradientClass } = getRandomGradient(index);
    const statusBadge = getStatusBadge(invitation, { showDot: true, animate: true }).html;
    const passTypeText = getPassTypeText(invitation);
    const invitationCode = invitation.code || 'UNKNOWN';
    const tableNumber = getTableNumber(invitationCode);
    const timeText = invitation.confirmationDate 
        ? getTimeAgo(new Date(invitation.confirmationDate)) 
        : '';
    
    // Formatear nombres para mostrar en líneas separadas si son múltiples
    const guestNamesFormatted = guestNames.length > 0 
        ? guestNames.map(name => `<div class="guest-name-item">${escapeHtml(name)}</div>`).join('')
        : `<div class="guest-name-item fallback">Invitado</div>`;

    return `
        <td>
            <div class="guest-cell">
                <div class="guest-avatar ${gradientClass}">
                    ${initials}
                </div>
                <div class="guest-info">
                    <div class="guest-name-cell">${guestNamesFormatted}</div>
                    <span class="guest-time">
                        ${timeText}
                    </span>
                </div>
            </div>
        </td>
        <td>${statusBadge}</td>
        <td class="table-cell-center">
            <span class="pass-count">${getSafeValue(invitation.numberOfPasses, 0)}</span>
            <span class="pass-type-label">${passTypeText}</span>
        </td>
        <td>
            <span class="table-number">Mesa ${tableNumber}</span>
        </td>
        <td class="table-cell-right">
            <div class="action-buttons">
                <button class="btn btn-sm btn-secondary w-full" data-action="view-invitation" data-code="${invitationCode}" title="Ver detalles">
                    <i class="fas fa-eye mr-1"></i> Ver Detalle
                </button>
            </div>
        </td>
    `;
}

/**
 * Actualiza los controles de paginación
 * @param {Object} config - Configuración de paginación
 * @param {number} config.currentPage - Página actual
 * @param {number} config.totalPages - Total de páginas
 * @param {string} config.prevBtnId - ID del botón anterior
 * @param {string} config.nextBtnId - ID del botón siguiente
 * @param {string} config.numbersContainerId - ID del contenedor de números
 * @param {Function} config.onPageChange - Callback al cambiar de página
 */
export function updateTablePagination(config) {
    const {
        currentPage,
        totalPages,
        prevBtnId,
        nextBtnId,
        numbersContainerId,
        onPageChange
    } = config;
    
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    const numbersContainer = document.getElementById(numbersContainerId);
    
    if (!prevBtn || !nextBtn || !numbersContainer) return;
    
    // Update prev/next buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    // Update page numbers
    numbersContainer.innerHTML = '';
    
    if (totalPages === 0) return;
    
    // Show max 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Add first page if not visible
    if (startPage > 1) {
        const firstBtn = createPageButton(1, currentPage === 1, () => onPageChange(1));
        numbersContainer.appendChild(firstBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            numbersContainer.appendChild(ellipsis);
        }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        const btn = createPageButton(i, i === currentPage, () => onPageChange(i));
        numbersContainer.appendChild(btn);
    }
    
    // Add last page if not visible
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            numbersContainer.appendChild(ellipsis);
        }
        
        const lastBtn = createPageButton(totalPages, currentPage === totalPages, () => onPageChange(totalPages));
        numbersContainer.appendChild(lastBtn);
    }
    
    // Set up prev/next button handlers
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };
    
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };
}

/**
 * Crea un botón de página
 * @param {number} pageNumber - Número de página
 * @param {boolean} isActive - Si es la página activa
 * @param {Function} onClick - Handler de click
 * @returns {HTMLElement} Elemento botón
 */
function createPageButton(pageNumber, isActive, onClick) {
    const btn = document.createElement('button');
    btn.className = 'pagination-number';
    btn.textContent = pageNumber;
    if (isActive) {
        btn.classList.add('active');
    }
    btn.onclick = onClick;
    return btn;
}

/**
 * Calcula información de paginación
 * @param {number} totalItems - Total de elementos
 * @param {number} currentPage - Página actual
 * @param {number} itemsPerPage - Elementos por página
 * @returns {Object} Información de paginación
 */
export function calculatePaginationInfo(totalItems, currentPage, itemsPerPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    return {
        totalPages,
        startIndex,
        endIndex,
        showingFrom: totalItems > 0 ? startIndex + 1 : 0,
        showingTo: endIndex,
        totalCount: totalItems
    };
}
