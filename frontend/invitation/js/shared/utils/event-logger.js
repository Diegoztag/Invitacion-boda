/**
 * Middleware de logging para el EventBus.
 * @param {string} event - El nombre del evento.
 * @param {*} data - Los datos del evento.
 * @returns {*} - Los datos sin modificar.
 */
export const eventLogger = (event, data) => data;
