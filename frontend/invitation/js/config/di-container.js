/**
 * Dependency Injection Container
 * Gestiona la creación y resolución de dependencias en la aplicación
 */
export class DIContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
        this.isInitialized = false;
    }

    /**
     * Obtiene la instancia singleton del contenedor
     * @returns {DIContainer}
     */
    static getInstance() {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    /**
     * Inicializa el contenedor con los servicios por defecto
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        // Registrar servicios básicos
        await this.registerDefaultServices();

        this.isInitialized = true;
    }

    /**
     * Registra los servicios por defecto
     */
    async registerDefaultServices() {
        const serviceFactories = {
            apiClient: this.createApiClient,
            invitationService: this.createInvitationService,
            metaService: this.createMetaService,
            configurationService: this.createConfigurationService,
            i18nService: this.createI18nService,
            validationService: this.createValidationService,
            sectionGeneratorService: this.createSectionGeneratorService,
            appFacade: this.createAppFacade,
            rsvpFacade: this.createRSVPFacade
        };

        for (const [name, factory] of Object.entries(serviceFactories)) {
            this.register(name, factory.bind(this), true);
        }
    }

    async createApiClient() {
        const { ApiClient } = await import('../infrastructure/api/api-client.js');
        const backendUrl = window.WEDDING_CONFIG?.api?.backendUrl || '/api';
        return new ApiClient(backendUrl);
    }

    async createInvitationService(container) {
        const { InvitationService } = await import('../core/services/invitation-service.js');
        const apiClient = await container.resolve('apiClient');
        return new InvitationService(apiClient);
    }

    async createMetaService() {
        const { MetaService } = await import('../core/services/meta-service.js');
        const metaService = new MetaService();
        await metaService.init();
        return metaService;
    }

    async createConfigurationService() {
        const { ConfigurationService } = await import('../core/services/configuration-service.js');
        const configurationService = new ConfigurationService();
        await configurationService.init();
        return configurationService;
    }

    async createI18nService() {
        const { I18nService } = await import('../core/services/i18n-service.js');
        const i18nService = new I18nService();
        i18nService.init();
        return i18nService;
    }

    async createValidationService() {
        const { ValidationService } = await import('../core/services/validation-service.js');
        return new ValidationService();
    }

    async createSectionGeneratorService() {
        const { SectionGeneratorService } =
            await import('../core/services/section-generator-service.js');
        const sectionGeneratorService = new SectionGeneratorService();
        sectionGeneratorService.init();
        return sectionGeneratorService;
    }

    async createAppFacade(container) {
        const { AppFacade } = await import('../core/facades/AppFacade.js');
        return new AppFacade(container);
    }

    async createRSVPFacade(container) {
        const { RSVPFacade } = await import('../core/facades/RSVPFacade.js');
        const { RSVPService } = await import('../core/services/rsvp-service.js');
        const apiClient = await container.resolve('apiClient');
        const rsvpService = new RSVPService(apiClient);
        return new RSVPFacade(rsvpService);
    }

    /**
     * Registra un servicio en el contenedor
     * @param {string} name - Nombre del servicio
     * @param {Function} factory - Función factory que crea el servicio
     * @param {boolean} singleton - Si debe ser singleton (una sola instancia)
     */
    register(name, factory, singleton = false) {
        this.services.set(name, { factory, singleton });
    }

    /**
     * Resuelve y retorna una instancia del servicio
     * @param {string} name - Nombre del servicio a resolver
     * @returns {*} Instancia del servicio
     */
    async resolve(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(
                `Service '${name}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`
            );
        }

        if (service.singleton) {
            if (!this.singletons.has(name)) {
                const instance = await service.factory(this);
                this.singletons.set(name, instance);
            }
            return this.singletons.get(name);
        }

        return await service.factory(this);
    }

    /**
     * Alias para resolve() - para compatibilidad
     * @param {string} name - Nombre del servicio a resolver
     * @returns {*} Instancia del servicio
     */
    async get(name) {
        return await this.resolve(name);
    }

    /**
     * Verifica si un servicio está registrado
     * @param {string} name - Nombre del servicio
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Lista todos los servicios registrados
     * @returns {string[]}
     */
    getRegisteredServices() {
        return Array.from(this.services.keys());
    }

    /**
     * Limpia el contenedor (útil para testing)
     */
    clear() {
        this.services.clear();
        this.singletons.clear();
    }
}
