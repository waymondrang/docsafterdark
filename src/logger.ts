/////////////
// LOGGING //
/////////////

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, OFF: 4 };

class Logger {
    static currentLevel = __IS_PRODUCTION__
        ? LOG_LEVELS.INFO
        : LOG_LEVELS.DEBUG;
    static prefixName = "DocsAfterDark";

    static setName(name: string) {
        this.prefixName = name;
    }

    static debug(...args: unknown[]) {
        if (this.currentLevel <= LOG_LEVELS.DEBUG) {
            console.debug(`[${this.prefixName}][DEBG]`, ...args);
        }
    }

    static info(...args: unknown[]) {
        if (this.currentLevel <= LOG_LEVELS.INFO) {
            console.info(`[${this.prefixName}][INFO]`, ...args);
        }
    }

    static warn(...args: unknown[]) {
        if (this.currentLevel <= LOG_LEVELS.WARN) {
            console.warn(`[${this.prefixName}][WARN]`, ...args);
        }
    }

    static error(...args: unknown[]) {
        if (this.currentLevel <= LOG_LEVELS.ERROR) {
            console.error(`[${this.prefixName}][ERRO]`, ...args);
        }
    }
}

export { Logger };
