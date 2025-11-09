// ==========================================
// PHOTOSHOP SERVICE LAYER
// Centralized Photoshop API operations with error handling
// ==========================================

const { app } = require('photoshop');

class PhotoshopService {
    constructor(logger, errorHandler, validator) {
        this.logger = logger || console;
        this.errorHandler = errorHandler;
        this.validator = validator;
        this.app = app;
    }

    // ==========================================
    // DOCUMENT OPERATIONS
    // ==========================================

    async getActiveDocument() {
        try {
            const validation = await this.validator.validateDocument(this.app);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const doc = this.app.activeDocument;
            this.logger.debug('Active document retrieved', {
                name: doc.name,
                width: doc.width,
                height: doc.height
            });

            return doc;
        } catch (error) {
            this.logger.error('Failed to get active document', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('NO_DOCUMENT', error);
            }
            throw error;
        }
    }

    async getDocumentInfo() {
        try {
            const doc = await this.getActiveDocument();

            const info = {
                name: doc.name,
                width: doc.width,
                height: doc.height,
                resolution: doc.resolution,
                mode: doc.mode,
                colorProfileName: doc.colorProfileName,
                bitsPerChannel: doc.bitsPerChannel,
                layers: doc.layers.length
            };

            this.logger.info('Document info retrieved', info);
            return info;
        } catch (error) {
            this.logger.error('Failed to get document info', error);
            throw error;
        }
    }

    async createNewDocument(width, height, resolution = 300, name = 'Untitled', mode = 'RGBColorMode') {
        try {
            this.logger.info('Creating new document', { width, height, resolution, name });

            const result = await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'make',
                    _target: [{ _ref: 'document' }],
                    artboard: false,
                    autoPromoteBackgroundLayer: false,
                    documentPreset: {
                        _obj: 'documentPreset',
                        name: name,
                        width: { _unit: 'pixelsUnit', _value: width },
                        height: { _unit: 'pixelsUnit', _value: height },
                        resolution: { _unit: 'densityUnit', _value: resolution },
                        mode: { _enum: 'newDocumentMode', _value: mode },
                        depth: { _value: 8 },
                        fill: { _enum: 'fill', _value: 'white' }
                    }
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'CreateDocument' });

            this.logger.info('Document created successfully');
            return await this.getActiveDocument();
        } catch (error) {
            this.logger.error('Failed to create document', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, { operation: 'createDocument' });
            }
            throw error;
        }
    }

    // ==========================================
    // IMAGE TRANSFORMATION
    // ==========================================

    async resizeImage(width, height, resampleMethod = 'bicubic') {
        try {
            const doc = await this.getActiveDocument();

            const dimValidation = this.validator.validateDimensions(width, height, 1, 1, 30000, 30000);
            if (!dimValidation.valid) {
                throw new Error(dimValidation.error);
            }

            this.logger.info('Resizing image', { width, height, resampleMethod });

            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'imageSize',
                    width: { _unit: 'pixelsUnit', _value: width },
                    height: { _unit: 'pixelsUnit', _value: height },
                    interfaceIconFrameDimmed: { _enum: 'interpolationType', _value: resampleMethod },
                    scaleStyles: true,
                    constrainProportions: false
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'ResizeImage' });

            this.logger.info('Image resized successfully');
            return { success: true, width, height };
        } catch (error) {
            this.logger.error('Failed to resize image', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, { operation: 'resizeImage' });
            }
            throw error;
        }
    }

    async cropImage(left, top, right, bottom) {
        try {
            const doc = await this.getActiveDocument();

            this.logger.info('Cropping image', { left, top, right, bottom });

            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'crop',
                    to: {
                        _obj: 'rectangle',
                        top: { _unit: 'pixelsUnit', _value: top },
                        left: { _unit: 'pixelsUnit', _value: left },
                        bottom: { _unit: 'pixelsUnit', _value: bottom },
                        right: { _unit: 'pixelsUnit', _value: right }
                    },
                    angle: 0,
                    delete: true,
                    cropAway: false
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'CropImage' });

            this.logger.info('Image cropped successfully');
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to crop image', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, { operation: 'cropImage' });
            }
            throw error;
        }
    }

    async cropToSquare(size, method = 'center') {
        try {
            const doc = await this.getActiveDocument();
            const docWidth = doc.width;
            const docHeight = doc.height;

            let cropBounds;

            if (method === 'center') {
                // Center crop
                const minDim = Math.min(docWidth, docHeight);
                const left = (docWidth - minDim) / 2;
                const top = (docHeight - minDim) / 2;
                cropBounds = {
                    left,
                    top,
                    right: left + minDim,
                    bottom: top + minDim
                };
            } else {
                // Top-left crop
                const minDim = Math.min(docWidth, docHeight);
                cropBounds = {
                    left: 0,
                    top: 0,
                    right: minDim,
                    bottom: minDim
                };
            }

            await this.cropImage(cropBounds.left, cropBounds.top, cropBounds.right, cropBounds.bottom);

            if (size && size !== Math.min(docWidth, docHeight)) {
                await this.resizeImage(size, size);
            }

            this.logger.info('Square crop completed', { size, method });
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to crop to square', error);
            throw error;
        }
    }

    // ==========================================
    // LAYER OPERATIONS
    // ==========================================

    async duplicateLayer(layerName = null) {
        try {
            this.logger.info('Duplicating layer', { layerName });

            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'duplicate',
                    _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
                    name: layerName || 'Layer copy'
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'DuplicateLayer' });

            this.logger.info('Layer duplicated successfully');
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to duplicate layer', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, { operation: 'duplicateLayer' });
            }
            throw error;
        }
    }

    async flattenImage() {
        try {
            this.logger.info('Flattening image');

            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'flattenImage'
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'FlattenImage' });

            this.logger.info('Image flattened successfully');
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to flatten image', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, { operation: 'flattenImage' });
            }
            throw error;
        }
    }

    // ==========================================
    // FILTER/ADJUSTMENT OPERATIONS
    // ==========================================

    async applyHueSaturation(hue = 0, saturation = 0, lightness = 0) {
        try {
            this.logger.info('Applying Hue/Saturation', { hue, saturation, lightness });

            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'hueSaturation',
                    adjustment: [{
                        _obj: 'hueSaturationAdjustmentV2',
                        hue: hue,
                        saturation: saturation,
                        lightness: lightness
                    }]
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'ApplyHueSaturation' });

            this.logger.info('Hue/Saturation applied successfully');
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to apply Hue/Saturation', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, { operation: 'hueSaturation' });
            }
            throw error;
        }
    }

    async convertToGrayscale() {
        try {
            this.logger.info('Converting to grayscale');

            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'desaturate'
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'ConvertGrayscale' });

            this.logger.info('Converted to grayscale successfully');
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to convert to grayscale', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, { operation: 'grayscale' });
            }
            throw error;
        }
    }

    async applyBrightnessContrast(brightness = 0, contrast = 0) {
        try {
            this.logger.info('Applying Brightness/Contrast', { brightness, contrast });

            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'brightnessContrast',
                    brightness: brightness,
                    contrast: contrast,
                    useLegacy: false
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'ApplyBrightnessContrast' });

            this.logger.info('Brightness/Contrast applied successfully');
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to apply Brightness/Contrast', error);
            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, { operation: 'brightnessContrast' });
            }
            throw error;
        }
    }

    // ==========================================
    // HISTORY OPERATIONS
    // ==========================================

    async createHistorySnapshot(name = 'Snapshot') {
        try {
            this.logger.info('Creating history snapshot', { name });

            await require('photoshop').core.executeAsModal(async () => {
                const batchCommands = [{
                    _obj: 'make',
                    _target: [{ _ref: 'snapshotClass' }],
                    from: { _ref: 'historyState', _property: 'currentHistoryState' },
                    name: name
                }];

                await require('photoshop').action.batchPlay(batchCommands, {});
            }, { commandName: 'CreateSnapshot' });

            this.logger.info('Snapshot created successfully');
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to create snapshot', error);
            throw error;
        }
    }

    async undo(steps = 1) {
        try {
            this.logger.info('Undoing steps', { steps });

            await require('photoshop').core.executeAsModal(async () => {
                for (let i = 0; i < steps; i++) {
                    await require('photoshop').action.batchPlay([{
                        _obj: 'undo'
                    }], {});
                }
            }, { commandName: 'Undo' });

            this.logger.info('Undo completed successfully');
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to undo', error);
            throw error;
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.PhotoshopService = PhotoshopService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotoshopService;
}
