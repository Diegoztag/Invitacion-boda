import { getTimeAgo, formatGuestNames } from '../dashboard-utils.js';

/**
 * Servicio para manejar notificaciones de nuevas confirmaciones.
 * Utiliza Server-Sent Events (SSE) para recibir actualizaciones en tiempo real.
 */
class NotificationService {
    /**
     * @param {object} config - Configuración del servicio.
     * @param {string} config.backendUrl - URL del backend.
     * @param {number} config.maxReconnectAttempts - Intentos máximos de reconexión.
     */
    constructor(config = {}) {
        this.config = {
            backendUrl: window.WEDDING_CONFIG?.api?.backendUrl || '/api',
            maxReconnectAttempts: 5,
            ...config
        };

        this.seenConfirmations = new Set();
        this.notifications = [];
        this.eventSource = null;
        this.soundEnabled = true;
        this.notificationSound = null;
        this.panelOpen = false;

        // Estado de reconexión SSE
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;
        this.isConnected = false;

        this.init();
    }

    /**
     * Inicializa el servicio.
     */
    init() {
        this.loadStateFromStorage();
        this.createNotificationSound();
        this.setupPanelEvents();
    }

    /**
     * Configura los eventos del panel de notificaciones.
     */
    setupPanelEvents() {
        const notificationBtn = document.getElementById('notificationBtn');
        const panel = document.getElementById('notificationPanel');
        const overlay = document.getElementById('notificationOverlay');
        const clearBtn = document.getElementById('notificationClearBtn');
        const closeBtn = document.getElementById('notificationCloseBtn');

        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.togglePanel());
        }

        document.addEventListener('click', event => {
            if (
                this.panelOpen &&
                panel &&
                notificationBtn &&
                !panel.contains(event.target) &&
                !notificationBtn.contains(event.target)
            ) {
                this.closePanel();
            }
        });

        if (overlay) {
            overlay.addEventListener('click', () => this.closePanel());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.markAllAsSeen());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanel());
        }
    }

    /**
     * Alterna la visibilidad del panel de notificaciones.
     */
    togglePanel() {
        if (this.panelOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    /**
     * Abre el panel de notificaciones.
     */
    openPanel() {
        const panel = document.getElementById('notificationPanel');
        const overlay = document.getElementById('notificationOverlay');
        const btn = document.getElementById('notificationBtn');

        if (!panel) {
            return;
        }

        panel.classList.add('active');
        btn?.classList.add('active');
        this.panelOpen = true;
        this.renderNotifications();
        this.markNotificationsAsRead();

        if (overlay && window.innerWidth <= 768) {
            overlay.classList.add('active');
        }
    }

    /**
     * Cierra el panel de notificaciones.
     */
    closePanel() {
        const panel = document.getElementById('notificationPanel');
        const overlay = document.getElementById('notificationOverlay');
        const btn = document.getElementById('notificationBtn');

        if (!panel) {
            return;
        }

        panel.classList.remove('active');
        btn?.classList.remove('active');
        this.panelOpen = false;

        overlay?.classList.remove('active');
    }

    /**
     * Renderiza las notificaciones en el panel.
     */
    renderNotifications() {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) {
            return;
        }

        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No hay notificaciones nuevas</p>
                </div>
            `;
        } else {
            notificationList.innerHTML = this.notifications
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(notification => this.renderNotificationItem(notification))
                .join('');
        }
    }

    /**
     * Genera el HTML para un item de notificación.
     * @param {object} notification - El objeto de notificación.
     * @returns {string} HTML del item.
     */
    renderNotificationItem(notification) {
        const timeAgo = getTimeAgo(notification.date);
        const isUnread = !notification.read;
        const statusClass = notification.willAttend ? 'confirmed' : 'cancelled';
        const iconClass = notification.willAttend ? 'fa-check-circle' : 'fa-times-circle';
        const message = notification.willAttend ? 'Confirmó' : 'Rechazó';

        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" 
                 onclick="window.notificationService.handleNotificationClick('${
                     notification.code
                 }')">
                <div class="notification-item-header">
                    <div class="notification-item-icon ${statusClass}">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="notification-item-content">
                        <div class="notification-item-title">${notification.guestNames}</div>
                        <div class="notification-item-message">${message} su asistencia</div>
                        <div class="notification-item-time">${timeAgo}</div>
                    </div>
                </div>
                ${isUnread ? '<div class="notification-item-badge"></div>' : ''}
            </div>
        `;
    }

    /**
     * Maneja el click en una notificación.
     * @param {string} code - El código de la invitación.
     */
    handleNotificationClick(code) {
        this.closePanel();
        this.viewConfirmation(code);

        const notification = this.notifications.find(n => n.code === code);
        if (notification) {
            notification.read = true;
            this.updateNotificationCount();
        }
    }

    /**
     * Marca todas las notificaciones como leídas.
     */
    markNotificationsAsRead() {
        this.notifications.forEach(n => (n.read = true));
        this.updateNotificationCount();
    }

    /**
     * Inicia la conexión SSE para monitorear confirmaciones.
     */
    startMonitoring() {
        if (this.eventSource) {
            this.eventSource.close();
        }

        try {
            this.eventSource = new EventSource(`${this.config.backendUrl}/notifications/stream`);

            this.eventSource.onopen = () => this.handleSseOpen();
            this.eventSource.addEventListener('confirmation', event =>
                this.handleSseMessage(event)
            );
            this.eventSource.onerror = () => this.handleSseError();
        } catch (err) {
            this.handleSseError(err);
        }
    }

    /**
     * Maneja la apertura de la conexión SSE.
     */
    handleSseOpen() {
        if (!this.isConnected && this.reconnectAttempts > 0) {
            this.showSystemToast('Conexión restablecida', 'success');
        }
        this.isConnected = true;
        this.reconnectAttempts = 0;
    }

    /**
     * Maneja los mensajes recibidos por SSE.
     * @param {MessageEvent} event - El evento SSE.
     */
    handleSseMessage(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_confirmation') {
                this.handleNewConfirmation(data.invitation);
            }
        } catch (err) {
            // Silently ignore parsing errors
        }
    }

    /**
     * Maneja errores en la conexión SSE y programa la reconexión.
     */
    handleSseError() {
        this.eventSource?.close();
        this.isConnected = false;

        if (this.reconnectAttempts === 0) {
            this.showSystemToast('Conexión perdida. Intentando reconectar...', 'warning');
        }

        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
        } else {
            this.showSystemToast(
                'No se pudo conectar al servidor de notificaciones. Recarga la página.',
                'error'
            );
        }
    }

    /**
     * Programa un intento de reconexión con exponential backoff.
     */
    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);

        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.startMonitoring(), delay);
    }

    /**
     * Detiene el monitoreo SSE.
     */
    stopMonitoring() {
        this.eventSource?.close();
        this.eventSource = null;
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
        this.isConnected = false;
    }

    /**
     * Procesa una nueva confirmación recibida.
     * @param {object} invitation - La invitación con la nueva confirmación.
     */
    handleNewConfirmation(invitation) {
        if (this.seenConfirmations.has(invitation.code)) {
            return;
        }

        this.addNotification(invitation);
        this.showNotificationToast(invitation);
        this.updateNotificationCount();
        this.playNotificationSound();

        window.dashboardController?.loadInvitations();
    }

    /**
     * Agrega una notificación a la lista interna.
     * @param {object} invitation - La invitación confirmada.
     */
    addNotification(invitation) {
        const newNotification = {
            code: invitation.code,
            guestNames: formatGuestNames(invitation.guestNames),
            willAttend: invitation.status === 'confirmed' || invitation.status === 'partial',
            date: invitation.confirmationDate,
            read: false
        };

        this.notifications.unshift(newNotification);

        if (this.notifications.length > 20) {
            this.notifications = this.notifications.slice(0, 20);
        }
    }

    /**
     * Muestra una notificación toast.
     * @param {object} invitation - La invitación para la notificación.
     */
    showNotificationToast(invitation) {
        const guestNames = formatGuestNames(invitation.guestNames);
        const isConfirmed = invitation.status === 'confirmed' || invitation.status === 'partial';
        const status = isConfirmed ? 'confirmó' : 'rechazó';

        const toast = this.createToastElement(
            'notification-toast',
            `
            <i class="fas fa-bell toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">Nueva confirmación</div>
                <div class="toast-message">${guestNames} ${status} su asistencia</div>
            </div>
            <button class="toast-action" onclick="window.notificationService.viewConfirmation('${
                invitation.code
            }')">
                Ver
            </button>
        `
        );

        this.displayToast(toast);
    }

    /**
     * Muestra un toast del sistema (errores, reconexiones).
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - El tipo de toast (info, success, warning, error).
     */
    showSystemToast(message, type = 'info') {
        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle'
        };
        const icon = icons[type] || icons.info;

        const toast = this.createToastElement(
            `notification-toast system-toast ${type}`,
            `
            <i class="fas ${icon} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `
        );

        this.displayToast(toast);
    }

    /**
     * Crea un elemento de toast.
     * @param {string} className - Clases CSS para el toast.
     * @param {string} innerHTML - Contenido HTML del toast.
     * @returns {HTMLElement} El elemento de toast creado.
     */
    createToastElement(className, innerHTML) {
        const toast = document.createElement('div');
        toast.className = className;
        toast.innerHTML = innerHTML;
        return toast;
    }

    /**
     * Muestra y oculta un elemento de toast.
     * @param {HTMLElement} toast - El elemento de toast.
     */
    displayToast(toast) {
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    /**
     * Actualiza el contador de notificaciones no leídas.
     */
    updateNotificationCount() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const notificationCountEl = document.getElementById('notificationCount');

        if (notificationCountEl) {
            if (unreadCount > 0) {
                notificationCountEl.textContent = unreadCount > 9 ? '9+' : unreadCount;
                notificationCountEl.style.display = 'flex';
            } else {
                notificationCountEl.style.display = 'none';
            }
        }
    }

    /**
     * Navega a la vista de una confirmación específica.
     * @param {string} code - El código de la invitación.
     */
    viewConfirmation(code) {
        window.location.hash = '#dashboard';
        setTimeout(() => window.viewInvitation?.(code), 300);
    }

    /**
     * Crea un sonido de notificación usando la Web Audio API.
     */
    createNotificationSound() {
        this.notificationSound = {
            play: () => {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.5
                    );

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                } catch (err) {
                    // Silently fail if Web Audio API is not supported
                }
            }
        };
    }

    /**
     * Reproduce el sonido de notificación si está habilitado.
     */
    playNotificationSound() {
        if (this.soundEnabled && this.notificationSound) {
            this.notificationSound.play();
        }
    }

    /**
     * Alterna el estado del sonido de notificaciones.
     * @returns {boolean} El nuevo estado del sonido.
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('notificationSoundEnabled', this.soundEnabled.toString());
        return this.soundEnabled;
    }

    /**
     * Carga el estado (confirmaciones vistas, sonido) desde localStorage.
     */
    loadStateFromStorage() {
        try {
            const savedConfirmations = localStorage.getItem('seenConfirmations');
            if (savedConfirmations) {
                this.seenConfirmations = new Set(JSON.parse(savedConfirmations));
            }
        } catch (err) {
            this.seenConfirmations = new Set();
        }

        const soundPref = localStorage.getItem('notificationSoundEnabled');
        this.soundEnabled = soundPref !== 'false';
    }

    /**
     * Guarda las confirmaciones vistas en localStorage.
     */
    saveSeenConfirmations() {
        localStorage.setItem(
            'seenConfirmations',
            JSON.stringify(Array.from(this.seenConfirmations))
        );
    }

    /**
     * Marca todas las notificaciones como vistas y guarda el estado.
     */
    markAllAsSeen() {
        this.notifications.forEach(n => {
            n.read = true;
            this.seenConfirmations.add(n.code);
        });

        this.saveSeenConfirmations();
        this.updateNotificationCount();

        if (this.panelOpen) {
            this.renderNotifications();
        }
    }

    /**
     * Carga las notificaciones iniciales a partir de una lista de invitaciones.
     * @param {Array} invitations - Lista de invitaciones.
     */
    loadInitialNotifications(invitations = []) {
        const confirmations = invitations
            .filter(
                inv =>
                    ['confirmed', 'partial', 'cancelled'].includes(inv.status) &&
                    inv.confirmationDate
            )
            .sort((a, b) => new Date(b.confirmationDate) - new Date(a.confirmationDate))
            .slice(0, 20);

        this.notifications = confirmations.map(inv => ({
            code: inv.code,
            guestNames: formatGuestNames(inv.guestNames),
            willAttend: inv.status === 'confirmed' || inv.status === 'partial',
            date: inv.confirmationDate,
            read: this.seenConfirmations.has(inv.code)
        }));

        this.updateNotificationCount();
    }
}

// Crear instancia singleton y exponerla globalmente
export const notificationService = new NotificationService();
window.notificationService = notificationService;
