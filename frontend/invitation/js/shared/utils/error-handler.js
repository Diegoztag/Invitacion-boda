import { toastService } from '../../presentation/components/ui/toast.js';

/**
 * Manejador de errores centralizado
 * Captura, registra y muestra errores de forma consistente
 */
export class ErrorHandler {
    constructor(logger, alertService = toastService) {
        this.logger = logger;
        this.alertService = alertService;
        this.init();
    }

    init() {
        window.addEventListener('error', event => this.handleGlobalError(event.error));
        window.addEventListener('unhandledrejection', event =>
            this.handleGlobalError(event.reason)
        );
    }

    handleGlobalError(error) {
        this.handle(error, 'Global');
    }

    /**
     * Maneja un error
     * @param {Error} error - El objeto de error
     * @param {string} context - Contexto donde ocurrió el error
     */
    handle(error, context = 'General') {
        const errorMessage = this.extractErrorMessage(error);
        const errorDetails = {
            message: errorMessage,
            context,
            stack: error.stack,
            name: error.name
        };

        if (this.logger) {
            this.logger.error(`Error en ${context}: ${errorMessage}`, errorDetails);
        } else {
            console.error(`Error en ${context}: ${errorMessage}`, errorDetails);
        }

        if (this.alertService) {
            if (errorMessage.includes('CSRF')) {
                this.alertService.showError(
                    'Error de seguridad. Por favor, recarga la página e intenta de nuevo.'
                );
            } else {
                this.alertService.showError(
                    `Ocurrió un error en ${context.toLowerCase()}: ${errorMessage}`
                );
            }
        } else {
            alert(`Ocurrió un error en ${context.toLowerCase()}: ${errorMessage}`);
        }
    }

    /**
     * Extrae el mensaje de error de diferentes tipos de objetos de error
     * @param {any} error - El error
     * @returns {string} El mensaje de error
     */
    extractErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (error instanceof Error) {
            return error.message;
        }
        if (error && error.data && error.data.error) {
            return error.data.error;
        }
        return 'Error desconocido';
    }
}

export const errorHandler = new ErrorHandler();
