// ==========================================
// UI CONTROLLER
// Centralized UI management with error handling
// ==========================================

class UIController {
    constructor(logger, errorHandler) {
        this.logger = logger || console;
        this.errorHandler = errorHandler;
        this.currentPage = 'pageLicense';
        this.statusTimeouts = new Map();
    }

    // ==========================================
    // PAGE NAVIGATION
    // ==========================================

    showPage(pageId) {
        try {
            this.logger.debug('Navigating to page', { pageId });

            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });

            // Show target page
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                this.currentPage = pageId;
                this.logger.info('Page shown successfully', { pageId });
            } else {
                this.logger.warn('Page not found', { pageId });
                this.showError('Navigation error', 'Page not found');
            }
        } catch (error) {
            this.logger.error('Error showing page', error, { pageId });
            if (this.errorHandler) {
                this.errorHandler.handle('UNKNOWN_ERROR', error, { operation: 'showPage', pageId });
            }
        }
    }

    getCurrentPage() {
        return this.currentPage;
    }

    // ==========================================
    // STATUS MESSAGES
    // ==========================================

    showStatus(elementId, message, type = 'info', autoClear = null) {
        try {
            const statusEl = document.getElementById(elementId);
            if (!statusEl) {
                this.logger.warn('Status element not found', { elementId });
                return;
            }

            // Clear previous timeout for this element
            if (this.statusTimeouts.has(elementId)) {
                clearTimeout(this.statusTimeouts.get(elementId));
                this.statusTimeouts.delete(elementId);
            }

            // Update status
            statusEl.textContent = message;
            statusEl.className = type === 'error' ? 'status-error' : 'status-success';

            this.logger.debug('Status message shown', { elementId, message, type });

            // Auto-clear if specified
            if (autoClear) {
                const timeoutId = setTimeout(() => {
                    this.clearStatus(elementId);
                }, autoClear);
                this.statusTimeouts.set(elementId, timeoutId);
            }
        } catch (error) {
            this.logger.error('Error showing status', error, { elementId, message });
        }
    }

    showSuccess(elementId, message, autoClear = 5000) {
        this.showStatus(elementId, message, 'success', autoClear);
    }

    showError(elementId, message, autoClear = 8000) {
        this.showStatus(elementId, message, 'error', autoClear);
    }

    clearStatus(elementId) {
        try {
            const statusEl = document.getElementById(elementId);
            if (statusEl) {
                statusEl.textContent = '';
                statusEl.className = '';
            }

            // Clear timeout if exists
            if (this.statusTimeouts.has(elementId)) {
                clearTimeout(this.statusTimeouts.get(elementId));
                this.statusTimeouts.delete(elementId);
            }
        } catch (error) {
            this.logger.error('Error clearing status', error, { elementId });
        }
    }

    // ==========================================
    // BUTTON STATES
    // ==========================================

    setButtonLoading(buttonId, loadingText = 'Processing...') {
        try {
            const btn = document.getElementById(buttonId);
            if (!btn) {
                this.logger.warn('Button not found', { buttonId });
                return;
            }

            btn.dataset.originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = loadingText;

            this.logger.debug('Button set to loading', { buttonId, loadingText });
        } catch (error) {
            this.logger.error('Error setting button loading', error, { buttonId });
        }
    }

    resetButton(buttonId) {
        try {
            const btn = document.getElementById(buttonId);
            if (!btn) {
                this.logger.warn('Button not found', { buttonId });
                return;
            }

            btn.disabled = false;
            if (btn.dataset.originalText) {
                btn.textContent = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }

            this.logger.debug('Button reset', { buttonId });
        } catch (error) {
            this.logger.error('Error resetting button', error, { buttonId });
        }
    }

    disableButton(buttonId, text = null) {
        try {
            const btn = document.getElementById(buttonId);
            if (!btn) return;

            btn.disabled = true;
            if (text) {
                btn.dataset.originalText = btn.textContent;
                btn.textContent = text;
            }
        } catch (error) {
            this.logger.error('Error disabling button', error, { buttonId });
        }
    }

    enableButton(buttonId) {
        try {
            const btn = document.getElementById(buttonId);
            if (!btn) return;

            btn.disabled = false;
            if (btn.dataset.originalText) {
                btn.textContent = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }
        } catch (error) {
            this.logger.error('Error enabling button', error, { buttonId });
        }
    }

    // ==========================================
    // INPUT MANAGEMENT
    // ==========================================

    getInputValue(inputId) {
        try {
            const input = document.getElementById(inputId);
            if (!input) {
                this.logger.warn('Input not found', { inputId });
                return null;
            }
            return input.value;
        } catch (error) {
            this.logger.error('Error getting input value', error, { inputId });
            return null;
        }
    }

    setInputValue(inputId, value) {
        try {
            const input = document.getElementById(inputId);
            if (!input) {
                this.logger.warn('Input not found', { inputId });
                return;
            }
            input.value = value;
        } catch (error) {
            this.logger.error('Error setting input value', error, { inputId });
        }
    }

    disableInput(inputId) {
        try {
            const input = document.getElementById(inputId);
            if (input) {
                input.disabled = true;
            }
        } catch (error) {
            this.logger.error('Error disabling input', error, { inputId });
        }
    }

    enableInput(inputId) {
        try {
            const input = document.getElementById(inputId);
            if (input) {
                input.disabled = false;
            }
        } catch (error) {
            this.logger.error('Error enabling input', error, { inputId });
        }
    }

    focusInput(inputId) {
        try {
            const input = document.getElementById(inputId);
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
        } catch (error) {
            this.logger.error('Error focusing input', error, { inputId });
        }
    }

    // ==========================================
    // ELEMENT VISIBILITY
    // ==========================================

    showElement(elementId) {
        try {
            const el = document.getElementById(elementId);
            if (el) {
                el.style.display = 'block';
            }
        } catch (error) {
            this.logger.error('Error showing element', error, { elementId });
        }
    }

    hideElement(elementId) {
        try {
            const el = document.getElementById(elementId);
            if (el) {
                el.style.display = 'none';
            }
        } catch (error) {
            this.logger.error('Error hiding element', error, { elementId });
        }
    }

    toggleElement(elementId) {
        try {
            const el = document.getElementById(elementId);
            if (el) {
                el.style.display = el.style.display === 'none' ? 'block' : 'none';
            }
        } catch (error) {
            this.logger.error('Error toggling element', error, { elementId });
        }
    }

    // ==========================================
    // MODAL/DIALOG HANDLING
    // ==========================================

    async showConfirm(message, title = 'Confirm') {
        try {
            // For now, use native confirm
            // In production, you'd want a custom modal
            return confirm(`${title}\n\n${message}`);
        } catch (error) {
            this.logger.error('Error showing confirm dialog', error);
            return false;
        }
    }

    async showAlert(message, title = 'Alert') {
        try {
            alert(`${title}\n\n${message}`);
        } catch (error) {
            this.logger.error('Error showing alert', error);
        }
    }

    // ==========================================
    // FORM VALIDATION UI
    // ==========================================

    highlightInvalidInput(inputId, message = null) {
        try {
            const input = document.getElementById(inputId);
            if (!input) return;

            input.style.borderColor = '#dc3545';
            input.style.borderWidth = '2px';

            if (message) {
                // Find or create error message element
                let errorEl = document.getElementById(`${inputId}-error`);
                if (!errorEl) {
                    errorEl = document.createElement('div');
                    errorEl.id = `${inputId}-error`;
                    errorEl.className = 'input-error';
                    errorEl.style.cssText = 'color: #dc3545; font-size: 11px; margin-top: 4px;';
                    input.parentNode.insertBefore(errorEl, input.nextSibling);
                }
                errorEl.textContent = message;
            }
        } catch (error) {
            this.logger.error('Error highlighting invalid input', error, { inputId });
        }
    }

    clearInputError(inputId) {
        try {
            const input = document.getElementById(inputId);
            if (input) {
                input.style.borderColor = '';
                input.style.borderWidth = '';
            }

            const errorEl = document.getElementById(`${inputId}-error`);
            if (errorEl) {
                errorEl.remove();
            }
        } catch (error) {
            this.logger.error('Error clearing input error', error, { inputId });
        }
    }

    // ==========================================
    // PROGRESS/LOADING INDICATORS
    // ==========================================

    showLoadingOverlay(message = 'Processing...') {
        try {
            let overlay = document.getElementById('loading-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'loading-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                `;
                document.body.appendChild(overlay);
            }
            overlay.textContent = message;
            overlay.style.display = 'flex';
        } catch (error) {
            this.logger.error('Error showing loading overlay', error);
        }
    }

    hideLoadingOverlay() {
        try {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        } catch (error) {
            this.logger.error('Error hiding loading overlay', error);
        }
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    updateText(elementId, text) {
        try {
            const el = document.getElementById(elementId);
            if (el) {
                el.textContent = text;
            }
        } catch (error) {
            this.logger.error('Error updating text', error, { elementId });
        }
    }

    addClass(elementId, className) {
        try {
            const el = document.getElementById(elementId);
            if (el) {
                el.classList.add(className);
            }
        } catch (error) {
            this.logger.error('Error adding class', error, { elementId, className });
        }
    }

    removeClass(elementId, className) {
        try {
            const el = document.getElementById(elementId);
            if (el) {
                el.classList.remove(className);
            }
        } catch (error) {
            this.logger.error('Error removing class', error, { elementId, className });
        }
    }

    toggleClass(elementId, className) {
        try {
            const el = document.getElementById(elementId);
            if (el) {
                el.classList.toggle(className);
            }
        } catch (error) {
            this.logger.error('Error toggling class', error, { elementId, className });
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.UIController = UIController;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}
