// ==========================================
// LICENSE MANAGEMENT SYSTEM
// Optimized with multi-layer error handling
// ==========================================

const { storage } = require("uxp");
const { localFileSystem } = storage;

class LicenseManager {
    constructor(logger, errorHandler, validator) {
        this.logger = logger || console;
        this.errorHandler = errorHandler;
        this.validator = validator;
        this.apiURL = "http://127.0.0.1:5000/api";
        this.activationState = null;
        this.machineId = null;
    }

    // ==========================================
    // MACHINE ID MANAGEMENT
    // ==========================================

    _generateRandomHex(length) {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async getMachineId() {
        try {
            this.logger.debug("Getting machine ID...");

            // Return cached if available
            if (this.machineId) {
                this.logger.debug("Returning cached machine ID", { machineId: this.machineId });
                return this.machineId;
            }

            // Try localStorage first (simpler and more reliable)
            try {
                let machineId = localStorage.getItem('machine_id');
                if (machineId && machineId.length === 32) {
                    this.logger.debug("Found machine ID in localStorage", { machineId });
                    this.machineId = machineId;
                    return machineId;
                }

                // Generate new ID
                machineId = this._generateRandomHex(32);
                localStorage.setItem('machine_id', machineId);
                this.logger.info("Generated new machine ID", { machineId });
                this.machineId = machineId;
                return machineId;
            } catch (err) {
                this.logger.warn("localStorage failed, trying file system", err);
            }

            // Fallback: try file system
            try {
                const folder = await localFileSystem.getDataFolder();
                let file;

                try {
                    file = await folder.getEntry("machine.id");
                    this.logger.debug("Found existing machine ID file");
                } catch (err) {
                    // Create new machine ID
                    this.logger.debug("Creating new machine ID file");
                    file = await folder.createFile("machine.id", { overwrite: false });
                    const id = this._generateRandomHex(32);
                    await file.write(id);
                    this.logger.info("New machine ID created", { id });
                    this.machineId = id;
                    return id;
                }

                const id = await file.read({ format: storage.formats.utf8 });
                this.logger.debug("Read machine ID from file", { id, length: id ? id.length : 0 });

                if (id && id.length === 32) {
                    this.machineId = id;
                    return id;
                } else {
                    // Regenerate if corrupted
                    this.logger.warn("Machine ID corrupted, regenerating");
                    const newId = this._generateRandomHex(32);
                    const newFile = await folder.createFile("machine.id", { overwrite: true });
                    await newFile.write(newId);
                    this.logger.info("Regenerated machine ID", { newId });
                    this.machineId = newId;
                    return newId;
                }
            } catch (err) {
                this.logger.error("File system failed", err);

                // Last resort: generate random ID (won't persist between sessions)
                const fallbackId = this._generateRandomHex(32);
                this.logger.warn("Using fallback machine ID (non-persistent)", { fallbackId });
                this.machineId = fallbackId;

                if (this.errorHandler) {
                    await this.errorHandler.handle('STORAGE_ERROR', err, {
                        operation: 'getMachineId',
                        usingFallback: true
                    });
                }

                return fallbackId;
            }
        } catch (error) {
            this.logger.error("Critical error in getMachineId", error);
            if (this.errorHandler) {
                await this.errorHandler.handle('STORAGE_ERROR', error, { operation: 'getMachineId' });
            }
            throw error;
        }
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    validateLicenseKey(key) {
        try {
            return this.validator.validateLicenseKey(key);
        } catch (error) {
            this.logger.error("License key validation failed", error);
            return {
                valid: false,
                error: "Validation error occurred"
            };
        }
    }

    formatLicenseInput(input) {
        try {
            if (!input || !input.value) {
                return;
            }

            this.logger.debug("Formatting license input", { original: input.value });

            let v = input.value.toUpperCase().replace(/[^A-F0-9-]/g, "");

            // Remove existing dashes
            v = v.replace(/-/g, "");

            // Add "PS-" prefix if not present
            if (!v.startsWith("PS")) {
                if (v.length > 0) {
                    v = "PS" + v;
                }
            }

            // Remove PS prefix temporarily for processing
            if (v.startsWith("PS")) {
                v = v.slice(2);
            }

            // Add dashes at correct positions
            let formatted = "PS";
            if (v.length > 0) formatted += "-" + v.slice(0, 4);
            if (v.length > 4) formatted += "-" + v.slice(4, 8);
            if (v.length > 8) formatted += "-" + v.slice(8, 12);

            input.value = formatted.slice(0, 17); // PS-XXXX-XXXX-XXXX = 17 chars
            this.logger.debug("Formatted license input", { formatted: input.value });
        } catch (error) {
            this.logger.error("Error formatting license input", error);
        }
    }

    // ==========================================
    // ACTIVATION STATE PERSISTENCE
    // ==========================================

    async saveActivationState(isActive, licenseKey = "") {
        try {
            this.logger.info("Saving activation state", { isActive, licenseKey });

            const stateData = {
                active: isActive,
                licenseKey: licenseKey,
                timestamp: Date.now(),
                machineId: this.machineId
            };

            this.activationState = stateData;

            const folder = await localFileSystem.getDataFolder();
            const file = await folder.createFile("activation.state", { overwrite: true });
            await file.write(JSON.stringify(stateData, null, 2));

            this.logger.info("Activation state saved successfully");
            return { success: true };
        } catch (err) {
            this.logger.error("Failed to save activation state", err);

            if (this.errorHandler) {
                await this.errorHandler.handle('STORAGE_ERROR', err, {
                    operation: 'saveActivationState'
                });
            }

            // Return success anyway (state is in memory)
            return { success: false, error: err.message };
        }
    }

    async loadActivationState() {
        try {
            this.logger.debug("Loading activation state...");

            const folder = await localFileSystem.getDataFolder();
            const file = await folder.getEntry("activation.state");
            const content = await file.read();
            const data = JSON.parse(content);

            this.logger.info("Activation state loaded", data);

            // Check if working offline for extended period
            if (data.active && data.timestamp) {
                const daysSinceActivation = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
                if (daysSinceActivation > 90) {
                    this.logger.warn("Activation is over 90 days old - consider revalidating");
                }
            }

            this.activationState = data;
            return data;
        } catch (err) {
            this.logger.debug("No activation state found (first run or reset)");
            return null;
        }
    }

    isActivated() {
        return this.activationState && this.activationState.active === true;
    }

    getActivationInfo() {
        return this.activationState;
    }

    // ==========================================
    // LICENSE ACTIVATION
    // ==========================================

    async activateLicense(licenseKey) {
        try {
            this.logger.info("=== ACTIVATION STARTED ===", { licenseKey });

            // Validate license key format
            const validation = this.validateLicenseKey(licenseKey);
            if (!validation.valid) {
                this.logger.warn("License validation failed", validation);
                return {
                    success: false,
                    error: validation.error,
                    errorType: 'VALIDATION_ERROR'
                };
            }

            // Get machine ID
            let machineId;
            try {
                machineId = await this.getMachineId();
                this.logger.debug("Machine ID retrieved", { machineId });
            } catch (err) {
                this.logger.error("Failed to get machine ID", err);
                return {
                    success: false,
                    error: "Cannot identify device",
                    errorType: 'STORAGE_ERROR'
                };
            }

            // Make API call
            try {
                this.logger.info("Sending activation request to server");

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch(`${this.apiURL}/activate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        licenseKey: validation.key,
                        machineId: machineId
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const data = await response.json();
                this.logger.info("Activation response received", {
                    status: response.status,
                    data
                });

                // Handle different response statuses
                if (response.status === 200 && data.success) {
                    // SUCCESS
                    await this.saveActivationState(true, validation.key);

                    this.logger.info("✓ License activated successfully");

                    return {
                        success: true,
                        message: "License activated successfully",
                        licenseKey: validation.key
                    };
                }
                else if (response.status === 404) {
                    return {
                        success: false,
                        error: "Invalid license key",
                        errorType: 'LICENSE_INVALID'
                    };
                }
                else if (response.status === 410) {
                    return {
                        success: false,
                        error: "License has expired",
                        errorType: 'LICENSE_EXPIRED'
                    };
                }
                else if (response.status === 429) {
                    return {
                        success: false,
                        error: "Activation limit reached. Deactivate another device first.",
                        errorType: 'LICENSE_LIMIT_REACHED'
                    };
                }
                else if (response.status === 403) {
                    return {
                        success: false,
                        error: "License is not active",
                        errorType: 'LICENSE_INVALID'
                    };
                }
                else {
                    return {
                        success: false,
                        error: data.error || "Activation failed",
                        errorType: 'SERVER_ERROR'
                    };
                }

            } catch (err) {
                this.logger.error("Network error during activation", err);

                // Check if it was a timeout
                if (err.name === 'AbortError') {
                    return {
                        success: false,
                        error: "Request timed out. Please check your connection.",
                        errorType: 'TIMEOUT_ERROR'
                    };
                }

                if (this.errorHandler) {
                    await this.errorHandler.handle('NETWORK_ERROR', err, {
                        operation: 'activateLicense'
                    });
                }

                return {
                    success: false,
                    error: "Cannot reach license server. Is it running on localhost:5000?",
                    errorType: 'NETWORK_ERROR'
                };
            }

        } catch (error) {
            this.logger.error("Critical error during activation", error);

            if (this.errorHandler) {
                await this.errorHandler.handle('UNKNOWN_ERROR', error, {
                    operation: 'activateLicense'
                });
            }

            return {
                success: false,
                error: "An unexpected error occurred",
                errorType: 'UNKNOWN_ERROR'
            };
        }
    }

    // ==========================================
    // LICENSE RESET
    // ==========================================

    async resetLicense() {
        try {
            this.logger.info("=== RESET LICENSE STARTED ===");

            // Clear memory state
            this.activationState = null;

            // Delete activation state file
            try {
                const folder = await localFileSystem.getDataFolder();
                try {
                    const stateFile = await folder.getEntry("activation.state");
                    await stateFile.delete();
                    this.logger.info("Activation state file deleted");
                } catch (e) {
                    this.logger.debug("No activation state file to delete");
                }
            } catch (err) {
                this.logger.warn("File deletion error", err);
                // Don't fail - state is already cleared in memory
            }

            this.logger.info("=== RESET LICENSE COMPLETE ===");

            return {
                success: true,
                message: "License reset successfully"
            };

        } catch (error) {
            this.logger.error("Error during license reset", error);

            if (this.errorHandler) {
                await this.errorHandler.handle('STORAGE_ERROR', error, {
                    operation: 'resetLicense'
                });
            }

            // Return success anyway (in-memory state is cleared)
            return {
                success: true,
                warning: "License cleared but file deletion failed"
            };
        }
    }

    // ==========================================
    // LICENSE VALIDATION (check with server)
    // ==========================================

    async validateWithServer(licenseKey = null) {
        try {
            const keyToValidate = licenseKey || this.activationState?.licenseKey;
            if (!keyToValidate) {
                return {
                    valid: false,
                    error: "No license key to validate"
                };
            }

            const machineId = await this.getMachineId();

            const response = await fetch(`${this.apiURL}/validate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    licenseKey: keyToValidate,
                    machineId: machineId
                })
            });

            const data = await response.json();

            if (response.status === 200 && data.valid) {
                this.logger.info("License validation successful");
                return { valid: true, data };
            } else {
                this.logger.warn("License validation failed", data);
                return { valid: false, error: data.error };
            }

        } catch (error) {
            this.logger.error("Server validation error", error);
            // Return true if offline (benefit of doubt)
            return { valid: true, offline: true };
        }
    }

    // ==========================================
    // SERVER STATUS CHECK
    // ==========================================

    async checkServerStatus() {
        try {
            this.logger.debug("Checking license server status");

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

            const response = await fetch(`${this.apiURL}/health`, {
                method: "GET",
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const isOnline = response.ok;
            this.logger.info(`License server status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

            return {
                online: isOnline,
                status: response.status,
                url: this.apiURL
            };

        } catch (error) {
            this.logger.warn("License server is offline or unreachable", error);

            return {
                online: false,
                error: error.name === 'AbortError' ? 'Timeout' : 'Unreachable',
                url: this.apiURL
            };
        }
    }

    // ==========================================
    // OFFLINE MODE HELPERS
    // ==========================================

    getOfflineModeDays() {
        if (!this.activationState || !this.activationState.timestamp) {
            return 0;
        }

        const daysSinceActivation = (Date.now() - this.activationState.timestamp) / (1000 * 60 * 60 * 24);
        return Math.floor(daysSinceActivation);
    }

    isInOfflineMode() {
        return this.isActivated() && this.getOfflineModeDays() > 0;
    }

    shouldWarnAboutOfflineMode() {
        const days = this.getOfflineModeDays();
        return days > 30; // Warn if offline for more than 30 days
    }
}

// Export
if (typeof window !== 'undefined') {
    window.LicenseManager = LicenseManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LicenseManager;
}
