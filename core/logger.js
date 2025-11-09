// ==========================================
// CENTRALIZED LOGGING SYSTEM
// Multi-level logging with error tracking
// ==========================================

class Logger {
    constructor(moduleName = 'App') {
        this.moduleName = moduleName;
        this.logLevel = 'DEBUG'; // DEBUG, INFO, WARN, ERROR
        this.logs = [];
        this.maxLogs = 1000; // Keep last 1000 logs in memory
    }

    _shouldLog(level) {
        const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
        return levels[level] >= levels[this.logLevel];
    }

    _formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const formatted = {
            timestamp,
            level,
            module: this.moduleName,
            message,
            data
        };

        // Store in memory
        this.logs.push(formatted);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        return formatted;
    }

    debug(message, data = null) {
        if (!this._shouldLog('DEBUG')) return;
        const log = this._formatMessage('DEBUG', message, data);
        console.log(`[${log.timestamp}] [${this.moduleName}] DEBUG: ${message}`, data || '');
    }

    info(message, data = null) {
        if (!this._shouldLog('INFO')) return;
        const log = this._formatMessage('INFO', message, data);
        console.log(`[${log.timestamp}] [${this.moduleName}] INFO: ${message}`, data || '');
    }

    warn(message, data = null) {
        if (!this._shouldLog('WARN')) return;
        const log = this._formatMessage('WARN', message, data);
        console.warn(`[${log.timestamp}] [${this.moduleName}] WARN: ${message}`, data || '');
    }

    error(message, error = null, data = null) {
        if (!this._shouldLog('ERROR')) return;
        const log = this._formatMessage('ERROR', message, {
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null,
            ...data
        });
        console.error(`[${log.timestamp}] [${this.moduleName}] ERROR: ${message}`, error || '', data || '');
    }

    getLogs(level = null, limit = 100) {
        let filtered = this.logs;
        if (level) {
            filtered = this.logs.filter(log => log.level === level);
        }
        return filtered.slice(-limit);
    }

    clearLogs() {
        this.logs = [];
    }

    setLogLevel(level) {
        if (['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(level)) {
            this.logLevel = level;
            this.info(`Log level changed to ${level}`);
        }
    }
}

// Export singleton instance
if (typeof window !== 'undefined') {
    window.Logger = Logger;
    window.logger = new Logger('Main');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
