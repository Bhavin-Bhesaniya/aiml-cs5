class Logger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        this.currentLevel = this.logLevels.INFO;
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? JSON.stringify(args) : '';
        return `[${timestamp}] ${level}: ${message} ${formattedArgs}`;
    }

    error(message, ...args) {
        if (this.currentLevel >= this.logLevels.ERROR) {
            console.error(this.formatMessage('ERROR', message, ...args));
        }
    }

    warn(message, ...args) {
        if (this.currentLevel >= this.logLevels.WARN) {
            console.warn(this.formatMessage('WARN', message, ...args));
        }
    }

    info(message, ...args) {
        if (this.currentLevel >= this.logLevels.INFO) {
            console.log(this.formatMessage('INFO', message, ...args));
        }
    }

    debug(message, ...args) {
        if (this.currentLevel >= this.logLevels.DEBUG) {
            console.debug(this.formatMessage('DEBUG', message, ...args));
        }
    }

    setLevel(level) {
        if (this.logLevels[level] !== undefined) {
            this.currentLevel = this.logLevels[level];
        }
    }
}

module.exports = new Logger();
