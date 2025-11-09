// ==========================================
// CENTRALIZED ERROR HANDLING SYSTEM
// Comprehensive error management with recovery
// ==========================================

class ErrorHandler {
    constructor(logger) {
        this.logger = logger || (window.logger || console);
        this.errorCallbacks = [];
        this.recoveryStrategies = new Map();
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Catch unhandled promise rejections
        if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', (event) => {
                this.logger.error('Unhandled Promise Rejection', event.reason);
                this.handle('UNHANDLED_PROMISE', event.reason);
            });

            // Catch global errors
            window.addEventListener('error', (event) => {
                this.logger.error('Global Error', event.error, {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });
        }
    }

    // Register error callback for UI updates
    onError(callback) {
        this.errorCallbacks.push(callback);
    }

    // Register recovery strategy for specific error types
    registerRecovery(errorType, strategyFn) {
        this.recoveryStrategies.set(errorType, strategyFn);
    }

    // Main error handling method
    async handle(errorType, error, context = {}) {
        const errorInfo = this._categorizeError(errorType, error);

        this.logger.error(`Error handled: ${errorType}`, error, context);

        // Notify all callbacks
        this.errorCallbacks.forEach(callback => {
            try {
                callback(errorInfo);
            } catch (err) {
                this.logger.error('Error in error callback', err);
            }
        });

        // Attempt recovery
        const recovery = this.recoveryStrategies.get(errorType);
        if (recovery) {
            try {
                await recovery(error, context);
                this.logger.info(`Recovery successful for ${errorType}`);
                return { recovered: true, error: errorInfo };
            } catch (recoveryError) {
                this.logger.error(`Recovery failed for ${errorType}`, recoveryError);
            }
        }

        return { recovered: false, error: errorInfo };
    }

    _categorizeError(type, error) {
        const categories = {
            // Network errors
            NETWORK_ERROR: {
                severity: 'HIGH',
                userMessage: 'Network connection failed. Please check your internet connection.',
                canRetry: true
            },
            SERVER_ERROR: {
                severity: 'HIGH',
                userMessage: 'Server error occurred. Please try again later.',
                canRetry: true
            },
            TIMEOUT_ERROR: {
                severity: 'MEDIUM',
                userMessage: 'Request timed out. Please try again.',
                canRetry: true
            },

            // License errors
            LICENSE_INVALID: {
                severity: 'HIGH',
                userMessage: 'Invalid license key. Please check and try again.',
                canRetry: true
            },
            LICENSE_EXPIRED: {
                severity: 'HIGH',
                userMessage: 'Your license has expired. Please renew.',
                canRetry: false
            },
            LICENSE_LIMIT_REACHED: {
                severity: 'HIGH',
                userMessage: 'Activation limit reached. Deactivate another device first.',
                canRetry: false
            },

            // Photoshop errors
            NO_DOCUMENT: {
                severity: 'MEDIUM',
                userMessage: 'No document is open. Please open an image in Photoshop.',
                canRetry: false
            },
            INVALID_DOCUMENT: {
                severity: 'MEDIUM',
                userMessage: 'The current document is not valid for this operation.',
                canRetry: false
            },
            PHOTOSHOP_API_ERROR: {
                severity: 'HIGH',
                userMessage: 'Photoshop operation failed. Please try again.',
                canRetry: true
            },

            // File system errors
            STORAGE_ERROR: {
                severity: 'MEDIUM',
                userMessage: 'Failed to save data. Using temporary storage.',
                canRetry: true
            },
            FILE_NOT_FOUND: {
                severity: 'LOW',
                userMessage: 'File not found.',
                canRetry: false
            },

            // Validation errors
            VALIDATION_ERROR: {
                severity: 'LOW',
                userMessage: 'Invalid input. Please check your data.',
                canRetry: false
            },

            // Unknown errors
            UNKNOWN_ERROR: {
                severity: 'HIGH',
                userMessage: 'An unexpected error occurred. Please try again.',
                canRetry: true
            },

            UNHANDLED_PROMISE: {
                severity: 'HIGH',
                userMessage: 'An unexpected error occurred.',
                canRetry: false
            }
        };

        const category = categories[type] || categories.UNKNOWN_ERROR;

        return {
            type,
            severity: category.severity,
            userMessage: category.userMessage,
            canRetry: category.canRetry,
            originalError: error,
            timestamp: new Date().toISOString(),
            details: error?.message || String(error)
        };
    }

    // Wrap async functions with error handling
    wrapAsync(fn, errorType = 'UNKNOWN_ERROR', context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                await this.handle(errorType, error, context);
                throw error; // Re-throw after handling
            }
        };
    }

    // Wrap sync functions with error handling
    wrapSync(fn, errorType = 'UNKNOWN_ERROR', context = {}) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handle(errorType, error, context);
                throw error;
            }
        };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
