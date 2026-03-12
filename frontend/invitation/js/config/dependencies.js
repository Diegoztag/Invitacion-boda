/**
 * Configuración de dependencias para el contenedor DI
 * Define cómo se crean e inyectan las dependencias en la aplicación
 */

// Importaciones de infraestructura
import { ApiClient } from '../infrastructure/api/api-client.js';

// Importaciones de servicios core
import { InvitationService } from '../core/services/invitation-service.js';
import { MetaService } from '../core/services/meta-service.js';
import { ValidationService } from '../core/services/validation-service.js';

// Importaciones de controladores
import { AppController } from '../presentation/controllers/app-controller.js';
import { NavigationController } from '../presentation/controllers/navigation-controller.js';
import { RSVPController } from '../presentation/controllers/rsvp-controller.js';
import { ContentController } from '../presentation/controllers/content-controller.js';
import { CarouselController } from '../presentation/controllers/carousel-controller.js';

// Importaciones de componentes UI
import { CountdownComponent } from '../presentation/components/ui/countdown.js';
import { ModalComponent } from '../presentation/components/ui/modal.js';
import { LoaderComponent } from '../presentation/components/ui/loader.js';

// Importaciones de configuración
import { getApiConfig } from './app-config.js';

/**
 * Configura todas las dependencias en el contenedor DI
 * @param {DIContainer} container - Contenedor de dependencias
 */
export function setupDependencies(container) {
    console.log('🔧 Setting up dependencies...');

    // ========================================
    // INFRASTRUCTURE LAYER
    // ========================================

    // API Client - Singleton para reutilizar conexiones
    container.register(
        'apiClient',
        c => {
            const apiConfig = getApiConfig();
            return new ApiClient(apiConfig.baseUrl, apiConfig);
        },
        true
    );

    // ========================================
    // CORE SERVICES LAYER
    // ========================================

    // Invitation Service - Maneja la lógica de negocio de invitaciones
    container.register(
        'invitationService',
        c => {
            return new InvitationService(c.resolve('apiClient'));
        },
        true
    );

    // Meta Service - Maneja meta tags dinámicos
    container.register(
        'metaService',
        c => {
            return new MetaService();
        },
        true
    );

    // Validation Service - Maneja validaciones de formularios
    container.register(
        'validationService',
        c => {
            return new ValidationService();
        },
        true
    );

    // ========================================
    // UI COMPONENTS LAYER
    // ========================================

    // Countdown Component - Componente de cuenta regresiva
    container.register('countdownComponent', c => {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) {
            console.warn('Countdown element not found, skipping registration');
            return null;
        }

        // Obtener fecha objetivo desde WEDDING_CONFIG
        const targetDate = new Date(window.WEDDING_CONFIG?.event?.date || '2024-12-31');
        return new CountdownComponent(countdownElement, targetDate);
    });

    // Modal Component - Componente modal reutilizable
    container.register('modalComponent', c => {
        return new ModalComponent();
    });

    // Loader Component - Componente de carga
    container.register('loaderComponent', c => {
        return new LoaderComponent();
    });

    // ========================================
    // CONTROLLERS LAYER
    // ========================================

    // Navigation Controller - Maneja navegación y scroll
    container.register('navigationController', c => {
        return new NavigationController();
    });

    // RSVP Controller - Maneja formulario de confirmación
    container.register('rsvpController', c => {
        return new RSVPController(c.resolve('invitationService'), c.resolve('validationService'));
    });

    // Content Controller - Maneja contenido dinámico
    container.register('contentController', c => {
        return new ContentController(c.resolve('metaService'));
    });

    // Carousel Controller - Maneja carousel de fotos
    container.register('carouselController', c => {
        return new CarouselController();
    });

    // ========================================
    // MAIN APP CONTROLLER
    // ========================================

    // App Controller - Controlador principal que coordina todo
    // Nota: AppController se maneja directamente en app.js, no a través del DI
    // container.register('appController', (c) => {
    //     return new AppController(document.body, {});
    // }, true);

    console.log('✅ Dependencies configured successfully');
    console.log('📋 Registered services:', container.getRegisteredServices());
}

/**
 * Verifica que todas las dependencias críticas estén disponibles
 * @param {DIContainer} container - Contenedor de dependencias
 * @returns {boolean} - true si todas las dependencias están disponibles
 */
export function validateDependencies(container) {
    const criticalServices = [
        'apiClient',
        'invitationService',
        'metaService',
        'validationService',
        'navigationController',
        'contentController'
    ];

    const missingServices = criticalServices.filter(service => !container.has(service));

    if (missingServices.length > 0) {
        console.error('❌ Missing critical services:', missingServices);
        return false;
    }

    console.log('✅ All critical dependencies are available');
    return true;
}

/**
 * Inicializa servicios que requieren configuración especial
 * @param {DIContainer} container - Contenedor de dependencias
 */
export async function initializeServices(container) {
    console.log('🚀 Initializing services...');

    try {
        // Inicializar Meta Service
        const metaService = container.resolve('metaService');
        await metaService.init();

        // Verificar conectividad de API
        const apiClient = container.resolve('apiClient');
        await apiClient.healthCheck();

        console.log('✅ Services initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing services:', error);
        throw error;
    }
}

/**
 * Limpia recursos de servicios (útil para testing o cleanup)
 * @param {DIContainer} container - Contenedor de dependencias
 */
export function cleanupServices(container) {
    console.log('🧹 Cleaning up services...');

    // Limpiar componentes que puedan tener timers o event listeners
    const componentsToCleanup = [
        'countdownComponent',
        'modalComponent',
        'navigationController',
        'carouselController'
    ];

    componentsToCleanup.forEach(serviceName => {
        try {
            const service = container.resolve(serviceName);
            if (service && typeof service.destroy === 'function') {
                service.destroy();
            }
        } catch (error) {
            console.warn(`Warning cleaning up ${serviceName}:`, error);
        }
    });

    // Limpiar el contenedor
    container.clear();

    console.log('✅ Services cleaned up');
}
