/**
 * Un bus de eventos simple para la comunicación entre componentes.
 */
class EventBus {
    constructor() {
        this.events = {};
        this.middleware = [];
    }

    /**
     * Se suscribe a un evento.
     * @param {string} event - El nombre del evento.
     * @param {Function} callback - La función a ejecutar cuando el evento es emitido.
     * @returns {Function} - Una función para desuscribirse.
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return () => this.off(event, callback);
    }

    /**
     * Se suscribe a un evento una sola vez.
     * @param {string} event - El nombre del evento.
     * @param {Function} callback - La función a ejecutar.
     */
    once(event, callback) {
        const onceCallback = data => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }

    /**
     * Se desuscribe de un evento.
     * @param {string} event - El nombre del evento.
     * @param {Function} callback - La función a remover.
     */
    off(event, callback) {
        if (!this.events[event]) {
            return;
        }
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * Emite un evento.
     * @param {string} event - El nombre del evento.
     * @param {*} data - Los datos a pasar a los suscriptores.
     */
    emit(event, data) {
        if (!this.events[event]) {
            return;
        }

        // Ejecutar middleware
        let finalData = data;
        for (const mw of this.middleware) {
            finalData = mw(event, finalData);
        }

        this.events[event].forEach(callback => callback(finalData));
    }

    /**
     * Añade un middleware.
     * @param {Function} middleware - La función de middleware.
     */
    use(middleware) {
        this.middleware.push(middleware);
    }
}

export const eventBus = new EventBus();
