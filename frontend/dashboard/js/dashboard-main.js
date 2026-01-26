/**
 * Dashboard Main
 * Archivo principal que integra todos los controladores
 */

import { DashboardController } from './controllers/dashboard-controller.js';
import { InvitationsController } from './controllers/invitations-controller.js';
import { NavigationController } from './controllers/navigation-controller.js';
import { showToast } from './components/dashboard-modal.js';
import { notificationService } from './services/notification-service.js';
import { RenderService } from './services/render-service.js';

class AdminApp {
    constructor() {
        this.dashboardController = null;
        this.invitationsController = null;
        this.navigationController = null;
        this.renderService = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🚀 Iniciando Admin App...');
            
            this.initializeDynamicContent();
            await this.initializeControllers();
            this.setupGlobalEventListeners();
            this.setupErrorHandling();
            
            this.isInitialized = true;
            console.log('✅ Admin App inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando Admin App:', error);
            showToast('Error al cargar el sistema', 'error');
        }
    }

    initializeDynamicContent() {
        if (!window.WEDDING_CONFIG) {
            console.warn('WEDDING_CONFIG no disponible');
            return;
        }

        const config = window.WEDDING_CONFIG;
        
        const mobileCoupleNames = document.getElementById('mobileCoupleNames');
        if (mobileCoupleNames) {
            mobileCoupleNames.textContent = config.couple.displayName;
        }

        const weddingTitle = document.getElementById('weddingTitle');
        if (weddingTitle) {
            weddingTitle.textContent = `Boda ${config.couple.displayName}`;
        }

        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Bienvenida, ${config.couple.bride.name}`;
        }

        const welcomeSubtext = document.getElementById('welcomeSubtext');
        if (welcomeSubtext) {
            const formattedDate = `${config.event.dateDisplay.day} de ${config.event.dateDisplay.month}, ${config.event.dateDisplay.year}`;
            welcomeSubtext.textContent = `Aquí tienes el resumen de tu boda del ${formattedDate}.`;
        }

        const welcomeCard = document.getElementById('welcomeCard');
        if (welcomeCard && config.images.heroBackground) {
            welcomeCard.style.backgroundImage = `url('${config.images.heroBackground}')`;
        }

        this.initializeCountdown(config.event.date);
        console.log('✅ Contenido dinámico inicializado');
    }

    initializeCountdown(weddingDate) {
        const countdownTimer = document.getElementById('countdownTimer');
        if (!countdownTimer) return;

        countdownTimer.innerHTML = `
            <div class="timer-unit">
                <div class="timer-value" id="days">00</div>
                <span class="timer-label">Días</span>
            </div>
            <div class="timer-unit">
                <div class="timer-value" id="hours">00</div>
                <span class="timer-label">Hrs</span>
            </div>
            <div class="timer-unit">
                <div class="timer-value" id="minutes">00</div>
                <span class="timer-label">Min</span>
            </div>
            <div class="timer-unit">
                <div class="timer-value" id="seconds">00</div>
                <span class="timer-label">Seg</span>
            </div>
        `;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const eventDate = new Date(weddingDate).getTime();
            const distance = eventDate - now;

            if (distance > 0) {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                const daysEl = document.getElementById('days');
                const hoursEl = document.getElementById('hours');
                const minutesEl = document.getElementById('minutes');
                const secondsEl = document.getElementById('seconds');

                if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
                if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
                if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
                if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
            } else {
                countdownTimer.innerHTML = `
                    <div class="timer-unit timer-finished">
                        <div class="timer-value timer-finished-value">¡Ya nos casamos!</div>
                        <span class="timer-label">🎉</span>
                    </div>
                `;
            }
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    async initializeControllers() {
        this.renderService = new RenderService();
        window.renderService = this.renderService;
        this.renderService.initializeDynamicContainers();
        
        this.dashboardController = new DashboardController();
        await this.dashboardController.init();
        
        this.invitationsController = new InvitationsController();
        await this.invitationsController.init();
        
        this.navigationController = new NavigationController(
            this.dashboardController,
            this.invitationsController
        );
        await this.navigationController.init();
        
        const invitationsData = await this.invitationsController.getInvitationsData();
        notificationService.loadInitialNotifications(invitationsData);
        notificationService.startMonitoring();
        
        // Global access for backward compatibility
        window.dashboardController = this.dashboardController;
        window.invitationsController = this.invitationsController;
        window.navigationController = this.navigationController;
    }

    setupGlobalEventListeners() {
        // Event delegation for data-action buttons
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;

            const action = target.getAttribute('data-action');
            const code = target.getAttribute('data-code');

            switch (action) {
                case 'toggle-filters':
                    if (window.invitationsController && typeof window.invitationsController.toggleFilters === 'function') {
                        window.invitationsController.toggleFilters();
                    }
                    break;
                case 'view-invitation':
                    if (code && window.invitationsController) {
                        window.invitationsController.viewInvitation(code);
                    }
                    break;
                case 'copy-invitation-link':
                    if (code && window.invitationsController) {
                        window.invitationsController.copyInvitationLink(code);
                    }
                    break;
                case 'clear-filters':
                    if (window.invitationsController && typeof window.invitationsController.clearFilters === 'function') {
                        window.invitationsController.clearFilters();
                    }
                    break;
                case 'apply-filters':
                    if (window.invitationsController && typeof window.invitationsController.applyFilters === 'function') {
                        window.invitationsController.applyFilters();
                    }
                    break;
            }
        });

        document.addEventListener('invitationDataChanged', () => {
            if (this.dashboardController) {
                this.dashboardController.loadDashboardData();
            }
        });

        window.addEventListener('resize', () => {
            if (this.dashboardController) {
                this.dashboardController.updateResponsiveLabels();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.refreshCurrentSection();
            }
        });
    }

    setupErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            showToast('Error inesperado en la aplicación', 'error');
        });

        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
    }

    async refreshCurrentSection() {
        if (!this.navigationController) return;
        
        const currentSection = this.navigationController.getCurrentSection();
        
        try {
            switch (currentSection) {
                case 'dashboard':
                    if (this.dashboardController) {
                        await this.dashboardController.loadDashboardData();
                    }
                    break;
                case 'invitations':
                    if (this.invitationsController) {
                        await this.invitationsController.loadInvitationsSectionData();
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error refreshing ${currentSection}:`, error);
        }
    }
}

// Global functions for backward compatibility
window.viewInvitation = function(code) {
    if (window.invitationsController) {
        window.invitationsController.viewInvitation(code);
    }
};

window.exportAllInvitations = function() {
    if (window.invitationsController) {
        window.invitationsController.exportAllInvitations();
    }
};

window.showCreateModal = function() {
    if (window.invitationsController) {
        window.invitationsController.showCreateModal();
    }
};

window.showImportModal = function() {
    if (window.invitationsController) {
        window.invitationsController.showImportModal();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    window.adminApp = new AdminApp();
    await window.adminApp.init();
});

export { AdminApp };
