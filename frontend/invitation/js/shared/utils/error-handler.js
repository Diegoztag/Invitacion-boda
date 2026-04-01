class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('error', event => this.handleGlobalError(event.error));
        window.addEventListener('unhandledrejection', event =>
            this.handleGlobalError(event.reason)
        );
    }

    handleGlobalError(error) {
        this.logError(error, 'Global');
    }

    logError(error, context = 'General') {
        //
    }

    showUserError(message) {
        // Implementar la lógica para mostrar el error en la UI.
        // Por ejemplo, usando un modal o un toast.
        alert(message);
    }
}

export const errorHandler = new ErrorHandler();
