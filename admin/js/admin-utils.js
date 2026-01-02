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

/**
 * Actualiza los elementos de estadísticas en el UI
 * @param {Object} stats - Objeto con las estadísticas
 * @param {string} suffix - Sufijo para los IDs de elementos (ej: 'Create' para la sección de crear)
 */
export function updateStatsUI(stats, suffix = '') {
    // Actualizar contadores principales
    const totalInvitationsEl = document.getElementById(`totalInvitations${suffix}`);
    const confirmedPassesEl = document.getElementById(`confirmedPasses${suffix}`);
    const pendingInvitationsEl = document.getElementById(`pendingInvitations${suffix}`);
    const cancelledPassesEl = document.getElementById(`cancelledPasses${suffix}`);
    
    if (totalInvitationsEl) {
        totalInvitationsEl.textContent = stats.totalInvitations;
    }
    
    if (confirmedPassesEl) {
        confirmedPassesEl.textContent = stats.confirmedPasses;
    }
    
    if (pendingInvitationsEl) {
        pendingInvitationsEl.textContent = stats.pendingInvitations;
    }
    
    if (cancelledPassesEl) {
        cancelledPassesEl.textContent = stats.cancelledPasses || 0;
    }
}

/**
 * Actualiza el badge de porcentaje de invitaciones
 * @param {number} totalInvitations - Total de invitaciones actuales
 * @param {number} targetInvitations - Meta de invitaciones
 * @param {string} selector - Selector CSS para el badge
 */
export function updateInvitationPercentageBadge(totalInvitations, targetInvitations, selector = '.stat-card:first-child .stat-badge') {
    const invitationBadge = document.querySelector(selector);
    if (!invitationBadge) return;
    
    const { percentage, badgeClass } = calculatePercentageStats(totalInvitations, targetInvitations);
    
    invitationBadge.textContent = `${percentage}%`;
    invitationBadge.title = `${totalInvitations} de ${targetInvitations} invitaciones enviadas`;
    
    // Actualizar clases
    invitationBadge.classList.remove('primary', 'success', 'warning');
    invitationBadge.classList.add(badgeClass);
}

/**
 * Actualiza los elementos de metas (targets)
 * @param {Object} config - Configuración con targetInvitations y targetTotal
 */
export function updateTargetElements(config) {
    const targetInvitationsEl = document.getElementById('targetInvitations');
    const targetGuestsEl = document.getElementById('targetGuests');
    
    if (targetInvitationsEl && config.targetInvitations) {
        targetInvitationsEl.textContent = config.targetInvitations;
    }
    
    if (targetGuestsEl && config.targetTotal) {
        targetGuestsEl.textContent = config.targetTotal;
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
 * Genera estadísticas de demostración
 * @returns {Object} Objeto con estadísticas demo
 */
export function generateDemoStats() {
    return {
        totalInvitations: 150,
        totalPasses: 220,
        confirmedPasses: 85,
        pendingInvitations: 45,
        cancelledPasses: 20,
        pendingPasses: 115,
        adultPasses: 176,
        childPasses: 33,
        staffPasses: 11
    };
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
    
    let status = 'pending';
    let statusText = 'Pendiente';
    let statusClass = 'pending';
    let statusColor = '#ff9800';
    let statusIcon = 'clock';
    
    if (invitation.confirmed && invitation.confirmationDetails) {
        if (!invitation.confirmationDetails.willAttend) {
            status = 'rejected';
            statusText = 'Rechazado';
            statusClass = 'rejected';
            statusColor = '#f44336';
            statusIcon = 'times-circle';
        } else if (invitation.confirmedPasses < invitation.numberOfPasses) {
            status = 'partial';
            statusText = 'Parcial';
            statusClass = 'partial';
            statusColor = '#ff6b6b';
            statusIcon = 'exclamation-circle';
        } else {
            status = 'accepted';
            statusText = 'Aceptado';
            statusClass = 'confirmed';
            statusColor = '#4caf50';
            statusIcon = 'check-circle';
        }
    }
    
    // Construir HTML del badge
    let html = '';
    
    if (showIcon) {
        // Badge grande con icono (para modales) - usar las mismas clases que los badges normales
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
            return renderInvitationRow(invitation);
    }
}

/**
 * Renderiza una fila para la tabla de invitaciones principal
 * @param {Object} invitation - Objeto de invitación
 * @returns {string} HTML de la fila
 */
function renderInvitationRow(invitation) {
    const cancelledPasses = calculateCancelledPasses(invitation);
    const statusBadge = getStatusBadge(invitation).html;
    
    return `
        <td class="code-cell">${invitation.code}</td>
        <td>${formatGuestNames(invitation.guestNames)}</td>
        <td>${invitation.numberOfPasses}</td>
        <td>${statusBadge}</td>
        <td>${invitation.confirmedPasses || 0}</td>
        <td>${cancelledPasses > 0 ? `<span class="cancelled-count">${cancelledPasses}</span>` : '0'}</td>
        <td>
            <button class="btn-icon" onclick="viewInvitation('${invitation.code}')" title="Ver detalles">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon" onclick="copyInvitationLink('${invitation.code}')" title="Copiar enlace">
                <i class="fas fa-link"></i>
            </button>
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
    const initials = getInitials(invitation.guestNames[0]);
    const timeAgo = getTimeAgo(new Date(invitation.confirmationDate));
    const { className: gradientClass } = getRandomGradient(index);
    const statusBadge = getStatusBadge(invitation).html;
    
    // Format guest names - display each name on a separate line
    const guestNamesFormatted = invitation.guestNames
        .map(name => name.trim())
        .filter(name => name)
        .map(name => `<div>${name}</div>`)
        .join('');
    
    // Use actual tableNumber if available, otherwise use generated one
    const tableNumber = invitation.tableNumber || getTableNumber(invitation.code);
    const passTypeText = invitation.confirmedPasses === 1 ? 'Adulto' : 'Adultos';
    const message = invitation.confirmationDetails?.message;
    
    return `
        <td>
            <div class="guest-cell">
                <div class="guest-avatar ${gradientClass}">${initials}</div>
                <div class="guest-info">
                    <div class="guest-name guest-name-cell">${guestNamesFormatted}</div>
                    <span class="guest-time">${timeAgo}</span>
                </div>
            </div>
        </td>
        <td>${statusBadge}</td>
        <td>
            <span class="passes-count">${invitation.confirmedPasses || 0}</span>
            <span class="passes-type">${passTypeText}</span>
        </td>
        <td>
            <div class="table-cell-center">
                <div class="table-number-display">${tableNumber}</div>
            </div>
        </td>
        <td class="message-column message-cell">
            <span class="message-text">
                ${message ? `"${message}"` : '-'}
            </span>
        </td>
        <td class="table-cell-right">
            <button class="btn-icon" onclick="viewInvitation('${invitation.code}')">
                <i class="fas fa-ellipsis-v"></i>
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
    const initials = getInitials(invitation.guestNames[0]);
    const { style: gradientStyle } = getRandomGradient(index);
    const statusBadge = getStatusBadge(invitation, { showDot: true, animate: true }).html;
    const passTypeText = getPassTypeText(invitation);
    const tableNumber = getTableNumber(invitation.code);
    const timeText = invitation.confirmed && invitation.confirmationDate 
        ? getTimeAgo(new Date(invitation.confirmationDate)) 
        : 'Sin confirmar';
    
    return `
        <td>
            <div class="guest-cell">
                <div class="guest-avatar ${gradientStyle}">
                    ${initials}
                </div>
                <div class="guest-info">
                    <span class="guest-name">${formatGuestNames(invitation.guestNames)}</span>
                    <span class="guest-time guest-time-muted">
                        ${timeText}
                    </span>
                </div>
            </div>
        </td>
        <td>${statusBadge}</td>
        <td class="text-center">
            <span class="pass-count">${invitation.numberOfPasses}</span>
            <span class="pass-type-label">${passTypeText}</span>
        </td>
        <td>
            <span class="table-number">Mesa ${tableNumber}</span>
        </td>
        <td class="text-right">
            <div class="action-buttons">
                <button class="btn-icon" onclick="viewInvitation('${invitation.code}')" title="Ver detalles">
                    <i class="fas fa-ellipsis-v"></i>
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
