/**
 * Admin Main - Refactored
 * Archivo principal refactorizado que integra todos los controladores
 * Fase 1 de la refactorización crítica
 */

import { DashboardController } from './controllers/dashboard-controller.js';
import { InvitationsController } from './controllers/invitations-controller.js';
import { NavigationController } from './controllers/navigation-controller.js';
import { adminAPI } from './admin-api.js';
import { showToast } from './components/admin-modal.js';
import { notificationService } from './services/notification-service.js';

/**
 * Clase principal de la aplicación admin refactorizada
 */
class AdminApp {
    constructor() {
        this.dashboardController = null;
        this.invitationsController = null;
        this.navigationController = null;
        this.isInitialized = false;
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        try {
            console.log('🚀 Iniciando Admin App Refactorizada...');
            
            // Initialize controllers
            await this.initializeControllers();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ Admin App inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando Admin App:', error);
            showToast('Error al cargar el sistema', 'error');
        }
    }

    /**
     * Inicializa todos los controladores
     */
    async initializeControllers() {
        // Initialize Dashboard Controller
        this.dashboardController = new DashboardController();
        await this.dashboardController.init();
        
        // Initialize Invitations Controller
        this.invitationsController = new InvitationsController();
        await this.invitationsController.init();
        
        // Initialize Navigation Controller with references to other controllers
        this.navigationController = new NavigationController(
            this.dashboardController,
            this.invitationsController
        );
        await this.navigationController.init();
        
        // Initialize Notification Service
        // Load initial notifications with current invitations data
        const invitationsData = await this.invitationsController.getInvitationsData();
        notificationService.loadInitialNotifications(invitationsData);
        notificationService.startMonitoring();
        
        // Make controllers globally available for backward compatibility
        window.dashboardController = this.dashboardController;
        window.invitationsController = this.invitationsController;
        window.navigationController = this.navigationController;
    }

    /**
     * Configura event listeners globales
     */
    setupGlobalEventListeners() {
        // Handle data changes between controllers
        document.addEventListener('invitationDataChanged', () => {
            // Refresh dashboard when invitation data changes
            if (this.dashboardController) {
                this.dashboardController.loadDashboardData();
            }
        });

        // Handle section changes
        document.addEventListener('sectionChanged', (e) => {
            const { section, previousSection } = e.detail;
            console.log(`📍 Navegando de ${previousSection} a ${section}`);
        });

        // Handle window resize for responsive updates
        window.addEventListener('resize', () => {
            if (this.dashboardController) {
                this.dashboardController.updateResponsiveLabels();
            }
        });

        // Handle visibility change to refresh data when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.refreshCurrentSection();
            }
        });
    }

    /**
     * Configura manejo global de errores
     */
    setupErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            showToast('Error inesperado en la aplicación', 'error');
        });

        // Handle general errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
    }

    /**
     * Refresca la sección actual
     */
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

    /**
     * Obtiene el controlador del dashboard
     */
    getDashboardController() {
        return this.dashboardController;
    }

    /**
     * Obtiene el controlador de invitaciones
     */
    getInvitationsController() {
        return this.invitationsController;
    }

    /**
     * Obtiene el controlador de navegación
     */
    getNavigationController() {
        return this.navigationController;
    }

    /**
     * Verifica si la aplicación está inicializada
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Limpia recursos de la aplicación
     */
    cleanup() {
        if (this.navigationController) {
            this.navigationController.cleanup();
        }
        
        this.isInitialized = false;
        console.log('🧹 Admin App limpiada');
    }
}

// Global functions for backward compatibility
// These will be gradually removed as we complete the refactoring

/**
 * Función global para ver invitación (backward compatibility)
 */
window.viewInvitation = function(code) {
    if (window.invitationsController) {
        window.invitationsController.viewInvitation(code);
    } else {
        console.error('InvitationsController not available');
    }
};

/**
 * Función global para exportar invitaciones (backward compatibility)
 */
window.exportAllInvitations = function() {
    if (window.invitationsController) {
        window.invitationsController.exportAllInvitations();
    } else {
        console.error('InvitationsController not available');
    }
};

/**
 * Función global para mostrar modal de creación (backward compatibility)
 */
window.showCreateModal = function() {
    if (window.invitationsController) {
        window.invitationsController.showCreateModal();
    } else {
        console.error('InvitationsController not available');
    }
};

/**
 * Función global para mostrar modal de importación (backward compatibility)
 */
window.showImportModal = function() {
    if (window.invitationsController) {
        window.invitationsController.showImportModal();
    } else {
        console.error('InvitationsController not available');
    }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Create and initialize the main app
    window.adminApp = new AdminApp();
    await window.adminApp.init();
});

// Export for module usage
export { AdminApp };
