// ==========================================
// BACKGROUND SERVICE
// Background removal and replacement
// ==========================================

// Note: We don't import photoshop at the top level to avoid variable conflicts
// with other services. We use require('photoshop') inline where needed.

class BackgroundService {
    constructor(photoshopService, logger, errorHandler) {
        this.ps = photoshopService;
        this.logger = logger || console;
        this.errorHandler = errorHandler;
    }

    // ==========================================
    // BACKGROUND REMOVAL METHODS
    // ==========================================

    async removeBackground(method = 'selectSubject') {
        try {
            this.logger.info('Starting background removal', { method });

            const doc = await this.ps.getActiveDocument();

            // Create snapshot for undo
            await this.ps.createHistorySnapshot('Before Background Removal');

            // Duplicate layer for safety
            await this.ps.duplicateLayer('Background Removal Working Layer');

            if (method === 'selectSubject') {
                // Use Photoshop's AI-powered Select Subject
                await this._removeBackgroundWithSelectSubject();
            } else if (method === 'colorRange') {
                // Use color range selection (for simple backgrounds)
                await this._removeBackgroundWithColorRange();
            } else if (method === 'magicWand') {
                // Use magic wand (manual click required)
                await this._removeBackgroundWithMagicWand();
            } else {
                throw new Error(`Unknown background removal method: ${method}`);
            }

            this.logger.info('Background removed successfully', { method });

            return {
                success: true,
                method,
                message: 'Background removed successfully'
            };

        } catch (error) {
            this.logger.error('Failed to remove background', error, { method });

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'removeBackground',
                    method
                });
            }

            throw error;
        }
    }

    async _removeBackgroundWithSelectSubject() {
        try {
            this.logger.debug('Using Select Subject AI');

            await require('photoshop').core.executeAsModal(async () => {
                // Use Select Subject (Photoshop AI)
                const batchCommands = [{
                    _obj: 'autoCutout',
                    sampleAllLayers: false
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'SelectSubject' });

            // Invert selection to select background
            await this._invertSelection();

            // Delete selected background
            await this._deleteSelection();

            // Deselect
            await this._deselect();

            this.logger.info('Select Subject background removal completed');

        } catch (error) {
            this.logger.error('Select Subject failed', error);
            throw new Error('AI background removal failed. Your Photoshop version may not support Select Subject, or the image may be too complex.');
        }
    }

    async _removeBackgroundWithColorRange() {
        try {
            this.logger.debug('Using Color Range method');

            // This would need user interaction or specific color values
            // For now, this is a placeholder
            throw new Error('Color Range method requires manual selection');

        } catch (error) {
            this.logger.error('Color Range failed', error);
            throw error;
        }
    }

    async _removeBackgroundWithMagicWand() {
        try {
            this.logger.debug('Using Magic Wand method');

            // This would need user to click on background
            throw new Error('Magic Wand method requires manual interaction');

        } catch (error) {
            this.logger.error('Magic Wand failed', error);
            throw error;
        }
    }

    // ==========================================
    // BACKGROUND REPLACEMENT METHODS
    // ==========================================

    async replaceBackground(color = 'white') {
        try {
            this.logger.info('Replacing background', { color });

            const doc = await this.ps.getActiveDocument();

            // Create snapshot
            await this.ps.createHistorySnapshot('Before Background Replacement');

            // First remove the background
            await this.removeBackground('selectSubject');

            // Then fill with color
            await this._fillBackground(color);

            // Flatten image
            await this.ps.flattenImage();

            this.logger.info('Background replaced successfully', { color });

            return {
                success: true,
                color,
                message: `Background replaced with ${color}`
            };

        } catch (error) {
            this.logger.error('Failed to replace background', error, { color });

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'replaceBackground',
                    color
                });
            }

            throw error;
        }
    }

    async _fillBackground(color) {
        try {
            this.logger.debug('Filling background with color', { color });

            // Create a new layer below current layer
            await require('photoshop').core.executeAsModal(async () => {
                // Create new layer
                const createLayer = [{
                    _obj: 'make',
                    _target: [{ _ref: 'layer' }],
                    layerID: 999
                }];
                await require('photoshop').action.batchPlay(createLayer, {});

                // Move it below active layer
                const moveLayer = [{
                    _obj: 'move',
                    _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
                    to: {
                        _ref: 'layer',
                        _enum: 'ordinal',
                        _value: 'next'
                    }
                }];
                await require('photoshop').action.batchPlay(moveLayer, {});

                // Fill the layer with color
                const rgbColor = this._parseColor(color);
                const fillLayer = [{
                    _obj: 'fill',
                    using: {
                        _enum: 'fillContents',
                        _value: 'color'
                    },
                    color: {
                        _obj: 'RGBColor',
                        red: rgbColor.r,
                        grain: rgbColor.g,
                        blue: rgbColor.b
                    },
                    opacity: {
                        _unit: 'percentUnit',
                        _value: 100
                    },
                    mode: {
                        _enum: 'blendMode',
                        _value: 'normal'
                    }
                }];
                await require('photoshop').action.batchPlay(fillLayer, {});

            }, { commandName: 'FillBackground' });

            this.logger.info('Background filled successfully', { color });

        } catch (error) {
            this.logger.error('Failed to fill background', error);
            throw error;
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    async _invertSelection() {
        try {
            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'inverse'
                }];
                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'InvertSelection' });
        } catch (error) {
            this.logger.error('Failed to invert selection', error);
            throw error;
        }
    }

    async _deleteSelection() {
        try {
            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'delete'
                }];
                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'DeleteSelection' });
        } catch (error) {
            this.logger.error('Failed to delete selection', error);
            throw error;
        }
    }

    async _deselect() {
        try {
            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'set',
                    _target: [{ _ref: 'channel', _property: 'selection' }],
                    to: { _enum: 'ordinal', _value: 'none' }
                }];
                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'Deselect' });
        } catch (error) {
            this.logger.error('Failed to deselect', error);
            throw error;
        }
    }

    _parseColor(color) {
        // Parse color name or hex to RGB
        const colorMap = {
            'white': { r: 255, g: 255, b: 255 },
            'lightgray': { r: 211, g: 211, b: 211 },
            'gray': { r: 128, g: 128, b: 128 },
            'lightblue': { r: 173, g: 216, b: 230 },
            'blue': { r: 0, g: 0, b: 255 },
            'black': { r: 0, g: 0, b: 0 }
        };

        if (colorMap[color.toLowerCase()]) {
            return colorMap[color.toLowerCase()];
        }

        // Try to parse hex color
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16)
            };
        }

        // Default to white
        return { r: 255, g: 255, b: 255 };
    }

    // ==========================================
    // VALIDATION METHODS
    // ==========================================

    async checkSelectSubjectAvailable() {
        try {
            // Check Photoshop version
            const { app } = require('photoshop');
            const psVersion = app.version;
            const majorVersion = parseInt(psVersion.split('.')[0]);

            // Select Subject requires Photoshop 2020 (v21.0) or later
            const isAvailable = majorVersion >= 21;

            this.logger.info('Select Subject availability check', {
                version: psVersion,
                majorVersion,
                available: isAvailable
            });

            return {
                available: isAvailable,
                version: psVersion,
                minVersion: '21.0 (Photoshop 2020)',
                message: isAvailable
                    ? 'Select Subject is available'
                    : 'Select Subject requires Photoshop 2020 or later'
            };

        } catch (error) {
            this.logger.error('Failed to check Select Subject availability', error);
            return {
                available: false,
                error: error.message
            };
        }
    }

    // ==========================================
    // COMBINED OPERATION
    // ==========================================

    async removeAndReplaceBackground(color = 'white') {
        try {
            this.logger.info('Remove and replace background operation', { color });

            // Check if Select Subject is available
            const availability = await this.checkSelectSubjectAvailable();
            if (!availability.available) {
                throw new Error(availability.message);
            }

            // Get document
            const doc = await this.ps.getActiveDocument();

            // Create snapshot
            await this.ps.createHistorySnapshot('Before Background Processing');

            // Step 1: Remove background using AI
            this.logger.info('Step 1: Removing background...');
            await this.removeBackground('selectSubject');

            // Step 2: Fill with new background color
            this.logger.info('Step 2: Adding new background...');
            await this._fillBackground(color);

            // Step 3: Flatten (optional - can be skipped to keep layers)
            this.logger.info('Step 3: Flattening image...');
            try {
                await this.ps.flattenImage();
            } catch (err) {
                this.logger.warn('Could not flatten image, keeping layers', err);
            }

            this.logger.info('Background removed and replaced successfully');

            return {
                success: true,
                color,
                message: `Background removed and replaced with ${color}`
            };

        } catch (error) {
            this.logger.error('Failed to remove and replace background', error);

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'removeAndReplaceBackground',
                    color
                });
            }

            throw error;
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.BackgroundService = BackgroundService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundService;
}
