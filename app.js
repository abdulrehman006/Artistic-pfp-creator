// ==========================================
// MAIN APPLICATION CONTROLLER
// Ties all services together with error handling
// ==========================================

class App {
    constructor() {
        this.logger = null;
        this.errorHandler = null;
        this.validator = null;
        this.uiController = null;
        this.licenseManager = null;
        this.photoshopService = null;
        this.socialMediaService = null;
        this.passportService = null;
        this.effectsService = null;
        this.initialized = false;
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    async initialize() {
        try {
            console.log('=== APPLICATION INITIALIZING ===');

            // Step 1: Initialize core systems
            this.logger = new Logger('App');
            this.logger.info('Logger initialized');

            this.errorHandler = new ErrorHandler(this.logger);
            this.logger.info('Error handler initialized');

            // Setup error handler callback for UI
            this.errorHandler.onError((errorInfo) => {
                this.handleGlobalError(errorInfo);
            });

            this.validator = new Validator(this.logger);
            this.logger.info('Validator initialized');

            this.uiController = new UIController(this.logger, this.errorHandler);
            this.logger.info('UI Controller initialized');

            // Step 2: Initialize license system
            this.licenseManager = new LicenseManager(this.logger, this.errorHandler, this.validator);
            this.logger.info('License Manager initialized');

            // Step 3: Initialize services
            this.photoshopService = new PhotoshopService(this.logger, this.errorHandler, this.validator);
            this.logger.info('Photoshop Service initialized');

            this.backgroundService = new BackgroundService(this.photoshopService, this.logger, this.errorHandler);
            this.logger.info('Background Service initialized');

            this.socialMediaService = new SocialMediaService(this.photoshopService, this.logger, this.errorHandler);
            this.logger.info('Social Media Service initialized');

            this.passportService = new PassportService(this.photoshopService, this.logger, this.errorHandler, this.backgroundService);
            this.logger.info('Passport Service initialized');

            this.effectsService = new EffectsService(this.photoshopService, this.logger, this.errorHandler);
            this.logger.info('Effects Service initialized');

            // Step 4: Load activation state
            const activationState = await this.licenseManager.loadActivationState();
            if (activationState && activationState.active) {
                this.logger.info('License is activated, navigating to home');
                this.uiController.showPage('pageHome');
                this.updateLicenseUI(true, activationState.licenseKey);
            } else {
                this.logger.info('No active license, showing license page');
                this.uiController.showPage('pageLicense');
            }

            this.initialized = true;
            this.logger.info('=== APPLICATION INITIALIZED SUCCESSFULLY ===');

        } catch (error) {
            console.error('CRITICAL: Application initialization failed', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('UNKNOWN_ERROR', error, {
                    operation: 'initialize'
                });
            }
            // Show error to user in the UI
            const statusElement = document.getElementById('licenseStatus');
            if (statusElement) {
                statusElement.innerHTML = '<span style="color: #e53935;">⚠️ Application failed to initialize. Please reload the plugin.</span>';
                statusElement.style.display = 'block';
            }
        }
    }

    // ==========================================
    // LICENSE OPERATIONS
    // ==========================================

    async activateLicense() {
        if (!this.initialized) {
            this.logger.error('App not initialized');
            return;
        }

        try {
            this.logger.info('Activate license requested');

            // Get license key from input
            const licenseKey = this.uiController.getInputValue('licenseInput');
            if (!licenseKey) {
                this.uiController.showError('status', 'Please enter a license key');
                return;
            }

            // Update UI to loading state
            this.uiController.setButtonLoading('activateBtn', 'Activating...');
            this.uiController.clearStatus('status');

            // Attempt activation
            const result = await this.licenseManager.activateLicense(licenseKey);

            // Handle result
            if (result.success) {
                this.uiController.showSuccess('status', '✓ License Activated! Loading tools...');
                this.updateLicenseUI(true, result.licenseKey);

                // Navigate to home after 1 second
                setTimeout(() => {
                    this.uiController.showPage('pageHome');
                }, 1000);
            } else {
                this.uiController.showError('status', result.error || 'Activation failed');
                this.uiController.resetButton('activateBtn');
            }

        } catch (error) {
            this.logger.error('Activation failed with exception', error);
            this.uiController.showError('status', 'An unexpected error occurred');
            this.uiController.resetButton('activateBtn');
        }
    }

    async resetLicense() {
        if (!this.initialized) return;

        try {
            this.logger.info('Reset license requested');

            const result = await this.licenseManager.resetLicense();

            if (result.success) {
                this.updateLicenseUI(false);
                this.uiController.clearStatus('status');
                this.uiController.setInputValue('licenseInput', '');
                this.uiController.enableInput('licenseInput');
                this.uiController.focusInput('licenseInput');
                this.uiController.showPage('pageLicense');
                this.uiController.showSuccess('status', '✓ License reset successfully. Enter new key to activate.');
            }

        } catch (error) {
            this.logger.error('Reset failed', error);
            this.uiController.showError('status', 'Failed to reset license');
        }
    }

    updateLicenseUI(isActivated, licenseKey = '') {
        if (isActivated) {
            this.uiController.setInputValue('licenseInput', licenseKey);
            this.uiController.disableInput('licenseInput');
            this.uiController.hideElement('activateBtn');
            this.uiController.showElement('resetBtn');
            this.uiController.showElement('backToHomeBtn');
            this.uiController.updateText('status', '✓ License Active');
            this.uiController.addClass('status', 'status-success');
        } else {
            this.uiController.setInputValue('licenseInput', '');
            this.uiController.enableInput('licenseInput');
            this.uiController.showElement('activateBtn');
            this.uiController.hideElement('resetBtn');
            this.uiController.hideElement('backToHomeBtn');
            this.uiController.resetButton('activateBtn');
        }
    }

    formatLicenseInput(input) {
        if (this.licenseManager) {
            this.licenseManager.formatLicenseInput(input);
        }
    }

    // ==========================================
    // SOCIAL MEDIA OPERATIONS
    // ==========================================

    async createSocialMediaPost() {
        if (!this.initialized) return;

        try {
            this.logger.info('Create social media post requested');

            // Get settings
            const platform = this.uiController.getInputValue('outputSize');
            const cropMode = this.uiController.getInputValue('cropMode');

            this.logger.debug('Settings', { platform, cropMode });

            // Validate document exists
            const docValidation = await this.validator.validateDocument(require('photoshop').app);
            if (!docValidation.valid) {
                this.uiController.showError('socialStatus', docValidation.error);
                return;
            }

            // Show loading
            this.uiController.setButtonLoading('cropBtn', 'Processing...');
            this.uiController.clearStatus('socialStatus');
            this.uiController.showLoadingOverlay('Creating social media post...');

            // Create post
            let result;
            if (platform === 'original') {
                // Just crop to square
                await this.photoshopService.cropToSquare(null, cropMode);
                result = { success: true, platform: 'Original Size' };
            } else {
                // Platform-specific
                const platformMap = {
                    '1080': 'instagram',
                    '400': 'facebook',
                    '180': 'twitter'
                };
                result = await this.socialMediaService.createProfilePicture(
                    platformMap[platform] || 'instagram',
                    cropMode
                );
            }

            // Show success
            this.uiController.hideLoadingOverlay();
            this.uiController.showSuccess('socialStatus', `✓ ${result.platform} profile picture created successfully!`);
            this.uiController.resetButton('cropBtn');

        } catch (error) {
            this.logger.error('Failed to create social media post', error);
            this.uiController.hideLoadingOverlay();
            this.uiController.showError('socialStatus', error.message || 'Failed to create post');
            this.uiController.resetButton('cropBtn');
        }
    }

    // ==========================================
    // PASSPORT OPERATIONS
    // ==========================================

    async createPassportPhoto() {
        if (!this.initialized) return;

        try {
            this.logger.info('Create passport photo requested');

            // Get settings
            const preset = this.uiController.getInputValue('passportPreset');
            const resolution = parseInt(this.uiController.getInputValue('passportResolution')) || 300;

            this.logger.debug('Settings', { preset, resolution });

            // Validate document exists
            const docValidation = await this.validator.validateDocument(require('photoshop').app);
            if (!docValidation.valid) {
                this.uiController.showError('passportStatus', docValidation.error);
                return;
            }

            // Validate resolution
            const resValidation = this.validator.validateNumber(resolution, 72, 600);
            if (!resValidation.valid) {
                this.uiController.showError('passportStatus', resValidation.error);
                this.uiController.highlightInvalidInput('passportResolution', resValidation.error);
                return;
            }

            // Get background color option
            const backgroundColor = this.uiController.getInputValue('passportBackground');

            // Show loading
            this.uiController.setButtonLoading('passportBtn', 'Processing...');
            this.uiController.clearStatus('passportStatus');
            this.uiController.clearInputError('passportResolution');
            this.uiController.showLoadingOverlay(
                backgroundColor && backgroundColor !== 'none'
                    ? 'Removing background and creating passport photo...'
                    : 'Creating passport photo...'
            );

            // Create passport photo (with optional background replacement)
            const bgColor = backgroundColor === 'none' ? null : backgroundColor;
            const result = await this.passportService.createPassportPhoto(preset, resolution, 'smart', bgColor);

            // Show success
            this.uiController.hideLoadingOverlay();
            const bgMessage = result.backgroundColor !== 'original'
                ? ` with ${result.backgroundColor} background`
                : '';
            this.uiController.showSuccess('passportStatus',
                `✓ ${result.preset} photo created${bgMessage}! Dimensions: ${result.dimensions.widthMM}x${result.dimensions.heightMM}mm`
            );
            this.uiController.resetButton('passportBtn');

        } catch (error) {
            this.logger.error('Failed to create passport photo', error);
            this.uiController.hideLoadingOverlay();
            this.uiController.showError('passportStatus', error.message || 'Failed to create passport photo');
            this.uiController.resetButton('passportBtn');
        }
    }

    // ==========================================
    // EFFECTS OPERATIONS
    // ==========================================

    async applyEffect() {
        if (!this.initialized) return;

        try {
            this.logger.info('Apply effect requested');

            // Get effect type
            const effectType = this.uiController.getInputValue('effectPicker');

            this.logger.debug('Effect type', { effectType });

            // Validate document exists
            const docValidation = await this.validator.validateDocument(require('photoshop').app);
            if (!docValidation.valid) {
                this.uiController.showError('effectStatus', docValidation.error);
                return;
            }

            // Show loading
            this.uiController.setButtonLoading('applyEffect', 'Applying...');
            this.uiController.clearStatus('effectStatus');
            this.uiController.showLoadingOverlay('Applying effect...');

            // Apply effect
            const result = await this.effectsService.applyEffect(effectType);

            // Show success
            this.uiController.hideLoadingOverlay();
            this.uiController.showSuccess('effectStatus',
                `✓ ${result.effect} applied successfully! ${result.description}`
            );
            this.uiController.resetButton('applyEffect');

        } catch (error) {
            this.logger.error('Failed to apply effect', error);
            this.uiController.hideLoadingOverlay();
            this.uiController.showError('effectStatus', error.message || 'Failed to apply effect');
            this.uiController.resetButton('applyEffect');
        }
    }

    // ==========================================
    // ERROR HANDLING
    // ==========================================

    handleGlobalError(errorInfo) {
        this.logger.error('Global error handler triggered', null, errorInfo);

        // Show user-friendly message
        if (errorInfo.userMessage) {
            // Determine which status element to use based on current page
            const statusElements = {
                'pageLicense': 'status',
                'pageSocial': 'socialStatus',
                'pagePassport': 'passportStatus',
                'pageEffects': 'effectStatus'
            };

            const statusId = statusElements[this.uiController.getCurrentPage()] || 'status';
            this.uiController.showError(statusId, errorInfo.userMessage);
        }
    }

    // ==========================================
    // PAGE NAVIGATION
    // ==========================================

    showPage(pageId) {
        if (this.uiController) {
            this.uiController.showPage(pageId);
        }
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    async getDocumentInfo() {
        if (!this.photoshopService) return null;

        try {
            return await this.photoshopService.getDocumentInfo();
        } catch (error) {
            this.logger.error('Failed to get document info', error);
            return null;
        }
    }

    getLogs(level = null, limit = 100) {
        if (this.logger) {
            return this.logger.getLogs(level, limit);
        }
        return [];
    }

    clearLogs() {
        if (this.logger) {
            this.logger.clearLogs();
        }
    }

    setLogLevel(level) {
        if (this.logger) {
            this.logger.setLogLevel(level);
        }
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.App = App;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
