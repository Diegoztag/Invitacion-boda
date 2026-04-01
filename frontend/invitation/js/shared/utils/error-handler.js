/**
 * Maneja los errores de la aplicación de forma centralizada.
 * @param {Error} error - El error a manejar.
 * @param {string} context - El contexto en el que ocurrió el error.
 */
export function handleError(error, context = 'General') {
    //
}

/**
 * Muestra un mensaje de error al usuario.
 * @param {string} message - El mensaje a mostrar.
 */
export function showUserError(message) {
    // Implementar la lógica para mostrar el error en la UI.
    // Por ejemplo, usando un modal o un toast.
    alert(message);
}
