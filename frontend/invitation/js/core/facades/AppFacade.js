/**
 * @file AppFacade.js
 *
 * @description This file contains the AppFacade class, which simplifies interactions
 * with the application's core services during initialization and data loading.
 * It provides a unified interface for the AppController.
 */

export class AppFacade {
    /**
     * Creates an instance of AppFacade.
     * @param {import('../../config/di-container.js').DIContainer} diContainer - The dependency injection container.
     */
    constructor(diContainer) {
        this.diContainer = diContainer;
    }

    /**
     * Initializes all core services.
     * @returns {Promise<Object>} An object containing the initialized services.
     */
    async initializeServices() {
        // 1. Generar estructura HTML primero (SectionGeneratorService)
        const sectionGeneratorService = await this.diContainer.get('sectionGeneratorService');
        if (sectionGeneratorService) {
            sectionGeneratorService.generateEnabledSections();
        }

        // 2. Aplicar configuración y contenido sobre la estructura generada (ConfigurationService)
        const configurationService = await this.diContainer.get('configurationService');
        if (configurationService && configurationService.init) {
            await configurationService.init();
        }

        // 3. Inicializar resto de servicios
        const invitationService = await this.diContainer.get('invitationService');
        if (invitationService && invitationService.init) {
            await invitationService.init();
        }

        const metaService = await this.diContainer.get('metaService');
        if (metaService && metaService.init) {
            await metaService.init();
        }

        const validationService = await this.diContainer.get('validationService');
        if (validationService && validationService.init) {
            await validationService.init();
        }

        return {
            sectionGeneratorService,
            configurationService,
            invitationService,
            metaService,
            validationService
        };
    }

    /**
     * Loads initial data for the application.
     * @param {string|null} invitationId - The ID of the invitation to load, if any.
     * @returns {Promise<Object|null>} The loaded invitation data, or null.
     */
    async loadInitialData(invitationId) {
        const metaService = await this.diContainer.get('metaService');
        if (metaService) {
            await metaService.loadDefaultMeta();
        }

        if (invitationId) {
            const invitationService = await this.diContainer.get('invitationService');
            if (invitationService) {
                return await invitationService.loadInvitation(invitationId);
            }
        }

        return null;
    }
}
