// notification-service.js - Servicio para manejar notificaciones de nuevas confirmaciones

import { getTimeAgo, formatGuestNames } from '../dashboard-utils.js';

class NotificationService {
    constructor() {
        this.seenConfirmations = new Set();
        this.eventSource = null;
        this.soundEnabled = true;
        this.notificationSound = null;
        this.notifications = [];
        this.panelOpen = false;
        this.backendUrl = 'http://localhost:3000/api';
        
        this.init();
    }
    
    /**
     * Inicializa el servicio de notificaciones
     */
    init() {
        // Cargar confirmaciones vistas del localStorage
        this.loadSeenConfirmations();
        
        // Crear el elemento de audio para notificaciones
        this.createNotificationSound();
        
        // Marcar todas las confirmaciones actuales como vistas
        // Se inicializará cuando se carguen las invitaciones
        this.saveSeenConfirmations();
        
        // Configurar eventos del panel
        this.setupPanelEvents();
    }
    
    /**
     * Configura los eventos del panel de notificaciones
     */
    setupPanelEvents() {
        // Botón de notificaciones
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.togglePanel());
        }
        
        // Click fuera del panel para cerrarlo
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notificationPanel');
            const btn = document.getElementById('notificationBtn');
            
            if (this.panelOpen && panel && btn && 
                !panel.contains(e.target) && !btn.contains(e.target)) {
                this.closePanel();
            }
        });
        
        // Click en el overlay para cerrar (móvil)
        const overlay = document.getElementById('notificationOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closePanel());
        }
        
        // Botón "Marcar todas como leídas"
        const clearBtn = document.getElementById('notificationClearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.markAllAsSeen());
        }
        
        // Botón de cerrar del panel
        const closeBtn = document.getElementById('notificationCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanel());
        }
    }
    
    /**
     * Alterna el panel de notificaciones
     */
    togglePanel() {
        if (this.panelOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }
    
    /**
     * Abre el panel de notificaciones
     */
    openPanel() {
        const panel = document.getElementById('notificationPanel');
        const overlay = document.getElementById('notificationOverlay');
        const btn = document.getElementById('notificationBtn');
        
        if (panel) {
            panel.classList.add('active');
            if (btn) btn.classList.add('active');
            this.panelOpen = true;
            this.renderNotifications();
            
            // Marcar notificaciones como vistas
            this.markNotificationsAsRead();
            
            // Mostrar overlay en móvil
            if (overlay && window.innerWidth <= 768) {
                overlay.classList.add('active');
            }
        }
    }
    
    /**
     * Cierra el panel de notificaciones
     */
    closePanel() {
        const panel = document.getElementById('notificationPanel');
        const overlay = document.getElementById('notificationOverlay');
        const btn = document.getElementById('notificationBtn');
        
        if (panel) {
            panel.classList.remove('active');
            if (btn) btn.classList.remove('active');
            this.panelOpen = false;
        }
        
        // Ocultar overlay
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    /**
     * Renderiza las notificaciones en el panel
     */
    renderNotifications() {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;
        
        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No hay notificaciones nuevas</p>
                </div>
            `;
            return;
        }
        
        notificationList.innerHTML = this.notifications
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(notification => this.renderNotificationItem(notification))
            .join('');
    }
    
    /**
     * Renderiza un item de notificación
     */
    renderNotificationItem(notification) {
        const timeAgo = getTimeAgo(notification.date);
        const isUnread = !notification.read;
        const statusClass = notification.willAttend ? 'confirmed' : 'cancelled';
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" 
                 onclick="window.notificationService.handleNotificationClick('${notification.code}')">
                <div class="notification-item-header">
                    <div class="notification-item-icon ${statusClass}">
                        <i class="fas ${notification.willAttend ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    </div>
                    <div class="notification-item-content">
                        <div class="notification-item-title">${notification.guestNames}</div>
                        <div class="notification-item-message">
                            ${notification.willAttend ? 'Confirmó' : 'Rechazó'} su asistencia
                        </div>
                        <div class="notification-item-time">${timeAgo}</div>
                    </div>
                </div>
                ${isUnread ? '<div class="notification-item-badge"></div>' : ''}
            </div>
        `;
    }
    
    /**
     * Maneja el click en una notificación
     */
    handleNotificationClick(code) {
        // Cerrar panel
        this.closePanel();
        
        // Navegar a la confirmación
        this.viewConfirmation(code);
        
        // Marcar como leída
        const notification = this.notifications.find(n => n.code === code);
        if (notification) {
            notification.read = true;
            this.updateNotificationCount();
        }
    }
    
    /**
     * Marca todas las notificaciones como leídas
     */
    markNotificationsAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateNotificationCount();
    }
    
    /**
     * Inicia el monitoreo de nuevas confirmaciones usando SSE
     */
    startMonitoring() {
        if (this.eventSource) {
            this.eventSource.close();
        }

        this.eventSource = new EventSource(`${this.backendUrl}/notifications/stream`);

        this.eventSource.onopen = () => {
            console.log('Conexión SSE establecida');
        };

        this.eventSource.addEventListener('confirmation', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'new_confirmation') {
                    this.handleNewConfirmation(data.invitation);
                }
            } catch (error) {
                console.error('Error procesando notificación:', error);
            }
        });

        this.eventSource.onerror = (error) => {
            console.error('Error en conexión SSE:', error);
            // Intentar reconectar en 5 segundos si se pierde la conexión
            this.eventSource.close();
            setTimeout(() => this.startMonitoring(), 5000);
        };
    }
    
    /**
     * Detiene el monitoreo
     */
    stopMonitoring() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    /**
     * Maneja una nueva confirmación recibida por SSE
     */
    handleNewConfirmation(invitation) {
        // Verificar si ya vimos esta confirmación
        if (this.seenConfirmations.has(invitation.code)) {
            return;
        }

        this.addNotification(invitation);
        this.showNotificationToast(invitation);
        this.updateNotificationCount();
        
        if (this.soundEnabled) {
            this.playNotificationSound();
        }

        // Actualizar lista de invitaciones si estamos en el dashboard
        if (window.dashboardController) {
            window.dashboardController.loadInvitations();
        }
    }
    
    
    /**
     * Agrega una notificación a la lista
     */
    addNotification(invitation) {
        this.notifications.push({
            code: invitation.code,
            guestNames: formatGuestNames(invitation.guestNames),
            willAttend: invitation.status === 'confirmed' || invitation.status === 'partial',
            date: invitation.confirmationDate,
            read: false
        });
        
        // Mantener solo las últimas 20 notificaciones
        if (this.notifications.length > 20) {
            this.notifications = this.notifications.slice(-20);
        }
    }
    
    /**
     * Muestra una notificación toast
     */
    showNotificationToast(invitation) {
        const guestNames = formatGuestNames(invitation.guestNames);
        const isConfirmed = invitation.status === 'confirmed' || invitation.status === 'partial';
        const status = isConfirmed ? 'confirmó' : 'rechazó';
        
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <i class="fas fa-bell toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">Nueva confirmación</div>
                <div class="toast-message">${guestNames} ${status} su asistencia</div>
            </div>
            <button class="toast-action" onclick="window.notificationService.viewConfirmation('${invitation.code}')">
                Ver
            </button>
        `;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
    
    /**
     * Actualiza el contador de notificaciones
     */
    updateNotificationCount() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        // Actualizar contador en el botón del header
        const notificationCount = document.getElementById('notificationCount');
        if (notificationCount) {
            if (unreadCount > 0) {
                notificationCount.textContent = unreadCount > 9 ? '9+' : unreadCount;
                notificationCount.style.display = 'flex';
            } else {
                notificationCount.style.display = 'none';
            }
        }
    }
    
    /**
     * Navega a una confirmación específica
     */
    viewConfirmation(code) {
        // Cambiar a la sección de dashboard
        window.location.hash = '#dashboard';
        
        // Abrir el modal de detalles después de un pequeño delay
        setTimeout(() => {
            if (window.viewInvitation) {
                window.viewInvitation(code);
            }
        }, 300);
    }
    
    /**
     * Crea el elemento de audio para notificaciones
     */
    createNotificationSound() {
        // Crear un sonido simple usando Web Audio API
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
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                } catch (e) {
                    console.log('Audio not supported');
                }
            }
        };
    }
    
    /**
     * Reproduce el sonido de notificación
     */
    playNotificationSound() {
        if (this.soundEnabled && this.notificationSound) {
            this.notificationSound.play();
        }
    }
    
    /**
     * Alterna el sonido de notificaciones
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('notificationSoundEnabled', this.soundEnabled);
        return this.soundEnabled;
    }
    
    /**
     * Carga las confirmaciones vistas del localStorage
     */
    loadSeenConfirmations() {
        const saved = localStorage.getItem('seenConfirmations');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.seenConfirmations = new Set(parsed);
            } catch (e) {
                this.seenConfirmations = new Set();
            }
        }
        
        // Cargar preferencia de sonido
        const soundPref = localStorage.getItem('notificationSoundEnabled');
        this.soundEnabled = soundPref !== 'false';
    }
    
    /**
     * Guarda las confirmaciones vistas en localStorage
     */
    saveSeenConfirmations() {
        const toSave = Array.from(this.seenConfirmations);
        localStorage.setItem('seenConfirmations', JSON.stringify(toSave));
    }
    
    /**
     * Marca todas las confirmaciones como vistas
     */
    markAllAsSeen() {
        // Marcar todas las notificaciones como leídas
        this.notifications.forEach(n => {
            n.read = true;
            this.seenConfirmations.add(n.code);
        });
        
        this.saveSeenConfirmations();
        this.updateNotificationCount();
        
        // Re-renderizar si el panel está abierto
        if (this.panelOpen) {
            this.renderNotifications();
        }
    }
    
    /**
     * Obtiene el número de confirmaciones no vistas
     */
    getUnseenCount() {
        return this.notifications.filter(n => !n.read).length;
    }
    
    /**
     * Carga las notificaciones iniciales
     * @param {Array} invitations - Array de invitaciones para inicializar
     */
    loadInitialNotifications(invitations = []) {
        const confirmations = invitations
            .filter(inv => inv.status === 'confirmed' || inv.status === 'partial' || inv.status === 'cancelled')
            .filter(inv => inv.confirmationDate) // Ensure there is a confirmation date
            .sort((a, b) => new Date(b.confirmationDate) - new Date(a.confirmationDate))
            .slice(0, 20);
        
        confirmations.forEach(inv => {
            this.notifications.push({
                code: inv.code,
                guestNames: formatGuestNames(inv.guestNames),
                willAttend: inv.status === 'confirmed' || inv.status === 'partial',
                date: inv.confirmationDate,
                read: this.seenConfirmations.has(inv.code)
            });
        });
        
        this.updateNotificationCount();
    }
}

// Crear instancia singleton
export const notificationService = new NotificationService();

// Exponer globalmente para acceso desde HTML
window.notificationService = notificationService;
