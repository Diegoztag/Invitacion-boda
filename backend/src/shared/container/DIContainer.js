/**
 * Dependency Injection Container
 * Implementa el patrón Dependency Injection para gestionar dependencias
 * Sigue principios SOLID: Dependency Inversion Principle
 */

class DIContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
        this.instances = new Map();
    }

    /**
     * Registra un servicio en el contenedor
     * @param {string} name - Nombre del servicio
     * @param {Function} factory - Función factory para crear el servicio
     * @param {Object} options - Opciones de configuración
     * @param {boolean} options.singleton - Si el servicio debe ser singleton
     * @param {Array} options.dependencies - Dependencias del servicio
     */
    register(name, factory, options = {}) {
        if (typeof name !== 'string') {
            throw new Error('Service name must be a string');
        }

        if (typeof factory !== 'function') {
            throw new Error('Service factory must be a function');
        }

        this.services.set(name, {
            factory,
            options: {
                singleton: options.singleton || false,
                dependencies: options.dependencies || [],
                ...options
            }
        });

        return this;
    }

    /**
     * Registra un singleton en el contenedor
     * @param {string} name - Nombre del servicio
     * @param {Function} factory - Función factory para crear el servicio
     * @param {Object} options - Opciones adicionales
     */
    registerSingleton(name, factory, options = {}) {
        return this.register(name, factory, { ...options, singleton: true });
    }

    /**
     * Registra una instancia directamente
     * @param {string} name - Nombre del servicio
     * @param {*} instance - Instancia del servicio
     */
    registerInstance(name, instance) {
        this.instances.set(name, instance);
        return this;
    }

    /**
     * Resuelve un servicio del contenedor
     * @param {string} name - Nombre del servicio a resolver
     * @returns {*} Instancia del servicio
     */
    resolve(name) {
        // Verificar si es una instancia registrada directamente
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }

        // Verificar si el servicio está registrado
        if (!this.services.has(name)) {
            throw new Error(`Service '${name}' not found in container`);
        }

        const serviceDefinition = this.services.get(name);
        const { factory, options } = serviceDefinition;

        // Si es singleton y ya existe, devolverlo
        if (options.singleton && this.singletons.has(name)) {
            return this.singletons.get(name);
        }

        // Resolver dependencias
        const dependencies = this.resolveDependencies(options.dependencies);

        // Crear la instancia
        const instance = factory(...dependencies);

        // Si es singleton, guardarlo
        if (options.singleton) {
            this.singletons.set(name, instance);
        }

        return instance;
    }

    /**
     * Resuelve múltiples dependencias
     * @param {Array} dependencies - Array de nombres de dependencias
     * @returns {Array} Array de instancias resueltas
     */
    resolveDependencies(dependencies) {
        return dependencies.map(dep => this.resolve(dep));
    }

    /**
     * Verifica si un servicio está registrado
     * @param {string} name - Nombre del servicio
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name) || this.instances.has(name);
    }

    /**
     * Obtiene información sobre un servicio registrado
     * @param {string} name - Nombre del servicio
     * @returns {Object|null}
     */
    getServiceInfo(name) {
        if (this.services.has(name)) {
            const service = this.services.get(name);
            return {
                name,
                singleton: service.options.singleton,
                dependencies: service.options.dependencies,
                isInstantiated: service.options.singleton ? this.singletons.has(name) : false
            };
        }

        if (this.instances.has(name)) {
            return {
                name,
                singleton: true,
                dependencies: [],
                isInstantiated: true,
                isDirectInstance: true
            };
        }

        return null;
    }

    /**
     * Lista todos los servicios registrados
     * @returns {Array}
     */
    listServices() {
        const services = [];
        
        for (const [name] of this.services) {
            services.push(this.getServiceInfo(name));
        }

        for (const [name] of this.instances) {
            if (!this.services.has(name)) {
                services.push(this.getServiceInfo(name));
            }
        }

        return services;
    }

    /**
     * Limpia el contenedor
     */
    clear() {
        this.services.clear();
        this.singletons.clear();
        this.instances.clear();
    }

    /**
     * Crea un scope hijo del contenedor
     * @returns {DIContainer}
     */
    createScope() {
        const scope = new DIContainer();
        
        // Copiar servicios del padre
        for (const [name, definition] of this.services) {
            scope.services.set(name, definition);
        }

        // Copiar instancias del padre
        for (const [name, instance] of this.instances) {
            scope.instances.set(name, instance);
        }

        return scope;
    }

    /**
     * Ejecuta una función con dependencias inyectadas
     * @param {Function} fn - Función a ejecutar
     * @param {Array} dependencies - Dependencias a inyectar
     * @returns {*}
     */
    call(fn, dependencies = []) {
        const resolvedDependencies = this.resolveDependencies(dependencies);
        return fn(...resolvedDependencies);
    }

    /**
     * Middleware para Express que inyecta el contenedor en req
     * @returns {Function}
     */
    middleware() {
        return (req, res, next) => {
            req.container = this;
            next();
        };
    }
}

module.exports = DIContainer;
