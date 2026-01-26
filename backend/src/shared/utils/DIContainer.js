/**
 * Dependency Injection Container
 * Contenedor de inyección de dependencias para Clean Architecture
 */

class DIContainer {
    constructor() {
        this.dependencies = new Map();
        this.singletons = new Map();
    }

    /**
     * Registra una dependencia en el contenedor
     * @param {string} name - Nombre de la dependencia
     * @param {Function} factory - Función factory para crear la instancia
     * @param {Object} options - Opciones de configuración
     */
    register(name, factory, options = {}) {
        if (typeof name !== 'string') {
            throw new Error('Dependency name must be a string');
        }

        if (typeof factory !== 'function') {
            throw new Error('Factory must be a function');
        }

        this.dependencies.set(name, {
            factory,
            options: {
                singleton: options.singleton || false,
                ...options
            }
        });
    }

    /**
     * Resuelve una dependencia del contenedor
     * @param {string} name - Nombre de la dependencia
     * @returns {*} Instancia de la dependencia
     */
    resolve(name) {
        if (!this.dependencies.has(name)) {
            throw new Error(`Dependency '${name}' not found in container`);
        }

        const { factory, options } = this.dependencies.get(name);

        // Si es singleton y ya existe, devolver la instancia existente
        if (options.singleton && this.singletons.has(name)) {
            return this.singletons.get(name);
        }

        // Crear nueva instancia
        const instance = factory();

        // Si es singleton, guardar la instancia
        if (options.singleton) {
            this.singletons.set(name, instance);
        }

        return instance;
    }

    /**
     * Verifica si una dependencia está registrada
     * @param {string} name - Nombre de la dependencia
     * @returns {boolean} True si está registrada
     */
    has(name) {
        return this.dependencies.has(name);
    }

    /**
     * Elimina una dependencia del contenedor
     * @param {string} name - Nombre de la dependencia
     */
    remove(name) {
        this.dependencies.delete(name);
        this.singletons.delete(name);
    }

    /**
     * Limpia todas las dependencias
     */
    clear() {
        this.dependencies.clear();
        this.singletons.clear();
    }

    /**
     * Obtiene la lista de dependencias registradas
     * @returns {Array<string>} Lista de nombres de dependencias
     */
    getRegisteredDependencies() {
        return Array.from(this.dependencies.keys());
    }

    /**
     * Obtiene información sobre una dependencia
     * @param {string} name - Nombre de la dependencia
     * @returns {Object} Información de la dependencia
     */
    getDependencyInfo(name) {
        if (!this.dependencies.has(name)) {
            return null;
        }

        const { options } = this.dependencies.get(name);
        return {
            name,
            singleton: options.singleton,
            isInstantiated: this.singletons.has(name)
        };
    }
}

module.exports = DIContainer;
