// ==========================================
// PASSPORT PHOTO SERVICE
// Create professional passport photos
// ==========================================

class PassportService {
    constructor(photoshopService, logger, errorHandler, backgroundService = null) {
        this.ps = photoshopService;
        this.logger = logger || console;
        this.errorHandler = errorHandler;
        this.backgroundService = backgroundService;

        // Passport specifications (in mm converted to pixels at 300 DPI)
        // 300 DPI = 11.811 pixels per mm
        this.presets = {
            us: {
                name: 'US Passport',
                widthMM: 51,
                heightMM: 51,
                widthPx: 602,   // 51mm * 11.811
                heightPx: 602,
                country: 'United States',
                icon: '🇺🇸'
            },
            eu: {
                name: 'EU Passport',
                widthMM: 35,
                heightMM: 45,
                widthPx: 413,   // 35mm * 11.811
                heightPx: 531,  // 45mm * 11.811
                country: 'European Union',
                icon: '🇪🇺'
            },
            uk: {
                name: 'UK Passport',
                widthMM: 35,
                heightMM: 45,
                widthPx: 413,
                heightPx: 531,
                country: 'United Kingdom',
                icon: '🇬🇧'
            },
            india: {
                name: 'India Passport',
                widthMM: 35,
                heightMM: 45,
                widthPx: 413,
                heightPx: 531,
                country: 'India',
                icon: '🇮🇳'
            },
            china: {
                name: 'China Passport',
                widthMM: 33,
                heightMM: 48,
                widthPx: 390,   // 33mm * 11.811
                heightPx: 567,  // 48mm * 11.811
                country: 'China',
                icon: '🇨🇳'
            },
            canada: {
                name: 'Canada Passport',
                widthMM: 35,
                heightMM: 45,
                widthPx: 413,
                heightPx: 531,
                country: 'Canada',
                icon: '🇨🇦'
            },
            australia: {
                name: 'Australia Passport',
                widthMM: 35,
                heightMM: 45,
                widthPx: 413,
                heightPx: 531,
                country: 'Australia',
                icon: '🇦🇺'
            }
        };
    }

    async createPassportPhoto(presetId, resolution = 300, cropMode = 'smart', backgroundColor = null) {
        try {
            this.logger.info('Creating passport photo', { presetId, resolution, cropMode, backgroundColor });

            // Validate preset
            const preset = this.presets[presetId.toLowerCase()];
            if (!preset) {
                throw new Error(`Unknown passport preset: ${presetId}`);
            }

            // Get current document
            const doc = await this.ps.getActiveDocument();
            const originalWidth = doc.width;
            const originalHeight = doc.height;

            this.logger.debug('Original dimensions', { originalWidth, originalHeight });

            // Create snapshot
            await this.ps.createHistorySnapshot('Before Passport Photo Creation');

            // Calculate dimensions based on resolution
            const dpiRatio = resolution / 300;
            const targetWidth = Math.round(preset.widthPx * dpiRatio);
            const targetHeight = Math.round(preset.heightPx * dpiRatio);

            this.logger.info('Target dimensions', { targetWidth, targetHeight, resolution });

            // Step 1: Remove and replace background if requested
            if (backgroundColor && this.backgroundService) {
                this.logger.info('Removing and replacing background', { backgroundColor });
                try {
                    await this.backgroundService.removeAndReplaceBackground(backgroundColor);
                    this.logger.info('Background processed successfully');
                } catch (bgError) {
                    this.logger.warn('Background processing failed, continuing without it', bgError);
                    // Continue with passport photo creation even if background fails
                }
            }

            // Step 2: Crop to correct aspect ratio
            await this._cropToAspectRatio(originalWidth, originalHeight, targetWidth, targetHeight, cropMode);

            // Step 3: Resize to exact dimensions
            await this.ps.resizeImage(targetWidth, targetHeight, 'bicubic');

            // Step 4: Flatten image
            try {
                await this.ps.flattenImage();
                this.logger.info('Image flattened');
            } catch (error) {
                this.logger.warn('Could not flatten image', error);
            }

            this.logger.info(`${preset.name} photo created successfully`, {
                finalSize: `${targetWidth}x${targetHeight}`,
                resolution,
                backgroundProcessed: !!backgroundColor
            });

            return {
                success: true,
                preset: preset.name,
                country: preset.country,
                dimensions: {
                    width: targetWidth,
                    height: targetHeight,
                    widthMM: preset.widthMM,
                    heightMM: preset.heightMM
                },
                resolution,
                backgroundColor: backgroundColor || 'original',
                originalDimensions: { width: originalWidth, height: originalHeight }
            };

        } catch (error) {
            this.logger.error('Failed to create passport photo', error, { presetId, resolution });

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'createPassportPhoto',
                    presetId,
                    resolution
                });
            }

            throw error;
        }
    }

    async _cropToAspectRatio(currentWidth, currentHeight, targetWidth, targetHeight, cropMode) {
        const targetRatio = targetWidth / targetHeight;
        const currentRatio = currentWidth / currentHeight;

        let cropBounds;

        if (cropMode === 'smart' || cropMode === 'center') {
            // Center crop
            if (currentRatio > targetRatio) {
                // Image is wider - crop width
                const newWidth = currentHeight * targetRatio;
                const offset = (currentWidth - newWidth) / 2;
                cropBounds = {
                    left: offset,
                    top: 0,
                    right: offset + newWidth,
                    bottom: currentHeight
                };
            } else {
                // Image is taller - crop height from bottom (keep head at top)
                const newHeight = currentWidth / targetRatio;
                cropBounds = {
                    left: 0,
                    top: 0,  // Keep top for passport photos (head should be at top)
                    right: currentWidth,
                    bottom: newHeight
                };
            }
        } else {
            // Top-left crop
            if (currentRatio > targetRatio) {
                const newWidth = currentHeight * targetRatio;
                cropBounds = {
                    left: 0,
                    top: 0,
                    right: newWidth,
                    bottom: currentHeight
                };
            } else {
                const newHeight = currentWidth / targetRatio;
                cropBounds = {
                    left: 0,
                    top: 0,
                    right: currentWidth,
                    bottom: newHeight
                };
            }
        }

        this.logger.debug('Cropping to aspect ratio', {
            cropBounds,
            targetRatio,
            currentRatio
        });

        await this.ps.cropImage(
            cropBounds.left,
            cropBounds.top,
            cropBounds.right,
            cropBounds.bottom
        );
    }

    async createCustomPassport(widthMM, heightMM, resolution = 300, cropMode = 'smart') {
        try {
            this.logger.info('Creating custom passport photo', { widthMM, heightMM, resolution });

            // Get current document
            const doc = await this.ps.getActiveDocument();
            const originalWidth = doc.width;
            const originalHeight = doc.height;

            // Create snapshot
            await this.ps.createHistorySnapshot('Before Custom Passport Creation');

            // Convert mm to pixels (300 DPI = 11.811 pixels per mm)
            const pixelsPerMM = resolution / 25.4;
            const targetWidth = Math.round(widthMM * pixelsPerMM);
            const targetHeight = Math.round(heightMM * pixelsPerMM);

            this.logger.info('Calculated dimensions', { targetWidth, targetHeight });

            // Crop to aspect ratio
            await this._cropToAspectRatio(originalWidth, originalHeight, targetWidth, targetHeight, cropMode);

            // Resize
            await this.ps.resizeImage(targetWidth, targetHeight, 'bicubic');

            // Flatten
            try {
                await this.ps.flattenImage();
            } catch (error) {
                this.logger.warn('Could not flatten image', error);
            }

            this.logger.info('Custom passport photo created successfully');

            return {
                success: true,
                dimensions: {
                    width: targetWidth,
                    height: targetHeight,
                    widthMM,
                    heightMM
                },
                resolution,
                originalDimensions: { width: originalWidth, height: originalHeight }
            };

        } catch (error) {
            this.logger.error('Failed to create custom passport photo', error);

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'createCustomPassport',
                    widthMM,
                    heightMM,
                    resolution
                });
            }

            throw error;
        }
    }

    getPresetsList() {
        return Object.entries(this.presets).map(([key, value]) => ({
            id: key,
            name: value.name,
            country: value.country,
            dimensions: `${value.widthMM}x${value.heightMM}mm`,
            icon: value.icon
        }));
    }

    getPreset(presetId) {
        return this.presets[presetId.toLowerCase()];
    }
}

// Export
if (typeof window !== 'undefined') {
    window.PassportService = PassportService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PassportService;
}
