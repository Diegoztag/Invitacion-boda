// notification-service.js - Servicio para manejar notificaciones de nuevas confirmaciones

import { store } from '../store.js';
import { getTimeAgo } from '../admin-utils.js';

class NotificationService {
    constructor() {
        this.lastCheckTime = null;
        this.seenConfirmations = new Set();
        this.checkInterval = null;
        this.soundEnabled = true;
        this.notificationSound = null;
        this.notifications = [];
        this.panelOpen = false;
        
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
        
        // Establecer el tiempo de última verificación
        this.lastCheckTime = new Date();
        
        // Marcar todas las confirmaciones actuales como vistas
        const currentConfirmations = store.getState().invitations
            .filter(inv => inv.confirmed);
        
        currentConfirmations.forEach(inv => {
            this.seenConfirmations.add(inv.code);
        });
        
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
        
        // Click en el pseudo-elemento ::after del header (botón cerrar móvil)
        const panelHeader = document.querySelector('.notification-panel-header');
        if (panelHeader) {
            panelHeader.addEventListener('click', (e) => {
                // Detectar si el click fue en el área del botón cerrar
                const rect = panelHeader.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                // Si el click fue en el área derecha superior del header (donde está el botón cerrar)
                // Ajustado para la nueva posición fija del botón
                if (clickX > rect.width - 60 && clickY < 60 && window.innerWidth <= 768) {
                    this.closePanel();
                }
            });
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
        
        if (panel) {
            panel.classList.add('active');
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
        
        if (panel) {
            panel.classList.remove('active');
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
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" 
                 onclick="window.notificationService.handleNotificationClick('${notification.code}')">
                <div class="notification-item-header">
                    <div class="notification-item-icon">
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
     * Inicia el monitoreo de nuevas confirmaciones
     */
    startMonitoring() {
        // Verificar cada 30 segundos
        this.checkInterval = setInterval(() => {
            this.checkForNewConfirmations();
        }, 30000);
        
        // Verificar inmediatamente
        this.checkForNewConfirmations();
    }
    
    /**
     * Detiene el monitoreo
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    
    /**
     * Verifica si hay nuevas confirmaciones
     */
    async checkForNewConfirmations() {
        try {
            // Obtener invitaciones actualizadas del servidor
            const response = await fetch('/api/invitations');
            if (!response.ok) return;
            
            const data = await response.json();
            const invitations = data.invitations || [];
            
            // Actualizar el store
            store.updateInvitations(invitations);
            
            // Buscar nuevas confirmaciones
            const newConfirmations = invitations.filter(inv => {
                return inv.confirmed && 
                       !this.seenConfirmations.has(inv.code) &&
                       new Date(inv.confirmationDate) > this.lastCheckTime;
            });
            
            if (newConfirmations.length > 0) {
                // Agregar a la lista de notificaciones
                newConfirmations.forEach(inv => {
                    this.addNotification(inv);
                    this.seenConfirmations.add(inv.code);
                });
                
                // Mostrar toast si el panel está cerrado
                if (!this.panelOpen) {
                    newConfirmations.forEach(inv => {
                        this.showNotificationToast(inv);
                    });
                }
                
                // Actualizar contador
                this.updateNotificationCount();
                
                // Reproducir sonido
                if (this.soundEnabled) {
                    this.playNotificationSound();
                }
                
                // Guardar confirmaciones vistas
                this.saveSeenConfirmations();
                
                // Actualizar panel si está abierto
                if (this.panelOpen) {
                    this.renderNotifications();
                }
            }
            
            this.lastCheckTime = new Date();
            
        } catch (error) {
            console.error('Error checking for new confirmations:', error);
        }
    }
    
    /**
     * Agrega una notificación a la lista
     */
    addNotification(invitation) {
        this.notifications.push({
            code: invitation.code,
            guestNames: invitation.guestNames.join(' y '),
            willAttend: invitation.confirmationDetails?.willAttend,
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
        const guestNames = invitation.guestNames.join(' y ');
        const status = invitation.confirmationDetails?.willAttend ? 'confirmó' : 'rechazó';
        
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
        
        // NO actualizar el badge del menú lateral - solo queremos notificaciones en el header
        // El badge del menú lateral se mantiene oculto
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
        // Sonido de campanilla suave y melódico
        this.notificationSound = new Audio('data:audio/wav;base64,UklGRh4MAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfoLAACAf4GBgoODg4SEhISEhIWFhYWGhoaGh4eHh4eIiIiIiImJiYmKioqKi4uLi4yMjIyNjY2Njo6Ojo+Pj4+QkJCQkZGRkZKSkpKTk5OTlJSUlJWVlZWWlpaWl5eXl5iYmJiZmZmZmpqampubm5ucnJycnZ2dnZ6enp6fn5+foKCgoKGhoaGioqKio6OjpKSkpKWlpaWmpqampqanp6enqKioqKmpqamqqqqrq6urq6ysrKytra2trq6urq+vr6+wsLCwsbGxsbKysrKzs7OztLS0tLW1tbW2tra2t7e3t7i4uLi5ubm5urq6uru7u7u8vLy8vb29vb6+vr6/v7+/wMDAwMHBwcHCwsLCw8PDw8TExMTFxcXFxsbGxsfHx8fIyMjIycnJycrKysrLy8vLzMzMzM3Nzc3Ozs7Oz8/Pz9DQ0NDR0dHR0tLS0tPT09PU1NTU1dXV1dbW1tbX19fX2NjY2NnZ2dna2tra29vb29zc3Nzd3d3d3t7e3t/f39/g4ODg4eHh4eLi4uLj4+Pj5OTk5OXl5eXm5ubm5+fn5+jo6Ojp6enp6urq6uvr6+vs7Ozs7e3t7e7u7u7v7+/v8PDw8PHx8fHy8vLy8/Pz8/T09PT19fX19vb29vf39/f4+Pj4+fn5+fr6+vr7+/v7/Pz8/P39/f3+/v7+/////wAAAAAAAQEBAQICAgIDAwMDBAQEBAUFBQUGBgYGBwcHBwgICAgJCQkJCgoKCgsLCwsMDAwMDQ0NDQ4ODg4PDw8PEBAQEBEREREREhISEhMTExMUFBQUFRUVFRYWFhYXFxcXGBgYGBkZGRkaGhoaGxsbGxwcHBwdHR0dHh4eHh8fHx8gICAgISEhISIiIiIjIyMjJCQkJCUlJSUmJiYmJycnJygoKCgpKSkpKioqKisrKysrLCwsLC0tLS0uLi4uLy8vLzAwMDAxMTExMjIyMjMzMzM0NDQ0NTU1NTY2NjY3Nzc3ODg4ODk5OTk6Ojo6Ozs7Ozw8PDw9PT09Pj4+Pj8/Pz9AQEBAQUFBQUJCQkJDQ0NDREREREVFRUVGRkZGR0dHR0hISEhJSUlJSkpKSktLS0tMTExMTU1NTU5OTk5PT09PUFBQUFFRUVFSUlJSU1NTU1RUVFRVVVVVVlZWVldXV1dYWFhYWVlZWVpaWlpbW1tbXFxcXF1dXV1eXl5eX19fX2BgYGBhYWFhYmJiYmNjY2NkZGRkZWVlZWZmZmZnZ2dnaGhoaGlpaWlqampqa2tra2xsbGxtbW1tbm5ubm9vb29wcHBwcXFxcXJycnJzc3NzdHR0dHV1dXV2dnZ2d3d3d3h4eHh5eXl5enp6ent7e3t8fHx8fX19fX5+fn5/f39/gICAgH9/f39+fn5+fX19fXx8fHx7e3t7enp6enl5eXl4eHh4d3d3d3Z2dnZ1dXV1dHR0dHNzc3NycnJycXFxcXBwcHBvb29vbm5ubm1tbW1sbGxsa2tra2pqamppqWlpaGhoaGdnZ2dmZmZmZWVlZWRkZGRjY2NjYmJiYmFhYWFgYGBgX19fX15eXl5dXV1dXFxcXFtbW1taWlpaWVlZWVhYWFhXV1dXVlZWVlVVVVVUVFRUU1NTU1JSUlJRUVFRUFBQUE9PT09OTk5OTU1NTUxMTExLS0tLSkpKSklJSUlISEhIR0dHR0ZGRkZFRUVFREREREJCQkJBQUFBQEBAQD8/Pz8+Pj4+PT09PTw8PDw7Ozs7Ojo6Ojk5OTk4ODg4Nzc3NzY2NjY1NTU1NDQ0NDMzMzMyMjIyMTExMTAwMDAvLy8vLi4uLi0tLS0sLCwsKysrKyoqKiopKSkpKCgoKCcnJycmJiYmJSUlJSQkJCQjIyMjIiIiIiEhISEgICAgHx8fHx4eHh4dHR0dHBwcHBsbGxsaGhoaGRkZGRgYGBgXFxcXFhYWFhUVFRUUFBQUExMTExISEhIREREREBAQEA8PDw8ODg4ODQ0NDQwMDAwLCwsLCgoKCgkJCQkICAgIBwcHBwYGBgYFBQUFBAQEBAMDAwMCAgICAgEBAQEAAAAAf39/f35+fn59fX19fHx8fHt7e3t6enp6eXl5eXh4eHh3d3d3dnZ2dnV1dXV0dHR0c3Nzc3JycnJxcXFxcHBwcG9vb29ubm5ubW1tbWxsbGxra2tra2pqamppaWlpaGhoaGdnZ2dmZmZmZWVlZWRkZGRjY2NjYmJiYmFhYWFgYGBgX19fX15eXl5dXV1dXFxcXFtbW1taWlpaWVlZWVhYWFhXV1dXVlZWVlVVVVVUVFRUU1NTU1JSUlJRUVFRUFBQUE9PT09OTk5OTU1NTUxMTExLS0tLSkpKSklJSUlISEhIR0dHR0ZGRkZFRUVFREREREJCQkJBQUFBQEBAQD8/Pz8+Pj4+PT09PTw8PDw7Ozs7Ojo6Ojk5OTk4ODg4Nzc3NzY2NjY1NTU1NDQ0NDMzMzMyMjIyMTExMTAwMDAvLy8vLi4uLi0tLS0sLCwsKysrKyoqKiopKSkpKCgoKCcnJycmJiYmJSUlJSQkJCQjIyMjIiIiIiEhISEgICAgHx8fHx4eHh4dHR0dHBwcHBsbGxsaGhoaGRkZGRgYGBgXFxcXFhYWFhUVFRUUFBQUExMTExISEhIREREREBAQEA8PDw8ODg4ODQ0NDQwMDAwLCwsLCgoKCgkJCQkICAgIBwcHBwYGBgYFBQUFBAQEBAMDAwMCAgICAgEBAQEAAAAA');
        this.notificationSound.volume = 0.3; // Volumen más bajo para que sea más suave
        
        // Pre-cargar el sonido
        this.notificationSound.load();
        
        // Habilitar el sonido con la primera interacción del usuario
        this.enableSoundOnInteraction();
    }
    
    /**
     * Habilita el sonido con la primera interacción del usuario
     */
    enableSoundOnInteraction() {
        const enableSound = () => {
            // Intentar reproducir y pausar inmediatamente para "desbloquear" el audio
            if (this.notificationSound) {
                this.notificationSound.play().then(() => {
                    this.notificationSound.pause();
                    this.notificationSound.currentTime = 0;
                    console.log('Sonido de notificaciones habilitado');
                }).catch(e => {
                    console.log('No se pudo habilitar el sonido automáticamente');
                });
            }
            
            // Remover los listeners después del primer uso
            document.removeEventListener('click', enableSound);
            document.removeEventListener('keydown', enableSound);
        };
        
        // Agregar listeners para la primera interacción
        document.addEventListener('click', enableSound, { once: true });
        document.addEventListener('keydown', enableSound, { once: true });
    }
    
    /**
     * Reproduce el sonido de notificación
     */
    playNotificationSound() {
        if (this.notificationSound && this.soundEnabled) {
            // Clonar el audio para permitir múltiples reproducciones simultáneas
            const soundClone = this.notificationSound.cloneNode();
            soundClone.volume = 0.3; // Mismo volumen que el original para consistencia
            
            soundClone.play().catch(e => {
                console.log('No se pudo reproducir el sonido:', e);
                // Si falla, mostrar un botón para habilitar el sonido manualmente
                this.showSoundEnablePrompt();
            });
        }
    }
    
    /**
     * Muestra un prompt para habilitar el sonido manualmente
     */
    showSoundEnablePrompt() {
        // Solo mostrar una vez por sesión
        if (sessionStorage.getItem('soundPromptShown')) return;
        sessionStorage.setItem('soundPromptShown', 'true');
        
        const prompt = document.createElement('div');
        prompt.className = 'sound-enable-prompt';
        prompt.innerHTML = `
            <div class="sound-prompt-content">
                <i class="fas fa-volume-up"></i>
                <p>Habilitar sonido de notificaciones</p>
                <button onclick="window.notificationService.enableSoundManually(this)">Activar</button>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            prompt.remove();
        }, 5000);
    }
    
    /**
     * Habilita el sonido manualmente
     */
    enableSoundManually(button) {
        this.notificationSound.play().then(() => {
            this.notificationSound.pause();
            this.notificationSound.currentTime = 0;
            showToast('Sonido de notificaciones activado', 'success');
            button.closest('.sound-enable-prompt').remove();
        }).catch(e => {
            showToast('No se pudo activar el sonido', 'error');
        });
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
        const confirmations = store.getState().invitations
            .filter(inv => inv.confirmed);
        
        confirmations.forEach(inv => {
            this.seenConfirmations.add(inv.code);
        });
        
        this.saveSeenConfirmations();
        
        // Marcar todas las notificaciones como leídas
        this.notifications.forEach(n => n.read = true);
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
     */
    loadInitialNotifications() {
        const confirmations = store.getState().invitations
            .filter(inv => inv.confirmed)
            .sort((a, b) => new Date(b.confirmationDate) - new Date(a.confirmationDate))
            .slice(0, 20);
        
        confirmations.forEach(inv => {
            this.notifications.push({
                code: inv.code,
                guestNames: inv.guestNames.join(' y '),
                willAttend: inv.confirmationDetails?.willAttend,
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
