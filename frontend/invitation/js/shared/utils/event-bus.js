/**
 * Un bus de eventos simple para la comunicación entre componentes.
 */
class EventBus {
    constructor() {
        this.events = {};
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
        this.events[event].forEach(callback => callback(data));
    }
}

export const eventBus = new EventBus();
