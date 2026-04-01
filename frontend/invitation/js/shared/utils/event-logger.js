class EventLogger {
    constructor(enabled = true) {
        this.enabled = enabled;
    }

    middleware() {
        return (event, data) => {
            if (this.enabled) {
                //
            }
            return data;
        };
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

export const eventLogger = new EventLogger();
