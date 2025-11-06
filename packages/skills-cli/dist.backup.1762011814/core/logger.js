export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static log(level, message, context) {
        const entry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context
        };
        const prefix = level.toUpperCase().padEnd(5);
        // eslint-disable-next-line no-console
        console.log(`${prefix} ${entry.timestamp} ${message}`);
        if (process.env.CI === 'true') {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(entry));
        }
    }
    static info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    static warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    static error(message, context) {
        this.log(LogLevel.ERROR, message, context);
    }
    static success(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
}
//# sourceMappingURL=logger.js.map