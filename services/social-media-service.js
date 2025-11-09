// ==========================================
// SOCIAL MEDIA SERVICE
// Social media profile picture creation
// ==========================================

class SocialMediaService {
    constructor(photoshopService, logger, errorHandler) {
        this.ps = photoshopService;
        this.logger = logger || console;
        this.errorHandler = errorHandler;

        // Platform specifications
        this.platforms = {
            instagram: { size: 1080, name: 'Instagram' },
            facebook: { size: 400, name: 'Facebook' },
            twitter: { size: 180, name: 'Twitter' },
            linkedin: { size: 400, name: 'LinkedIn' },
            youtube: { size: 800, name: 'YouTube' },
            tiktok: { size: 200, name: 'TikTok' }
        };
    }

    async createProfilePicture(platform, cropMode = 'center') {
        try {
            this.logger.info('Creating profile picture', { platform, cropMode });

            // Validate platform
            const platformConfig = this.platforms[platform.toLowerCase()];
            if (!platformConfig) {
                throw new Error(`Unknown platform: ${platform}`);
            }

            // Get current document
            const doc = await this.ps.getActiveDocument();
            const originalWidth = doc.width;
            const originalHeight = doc.height;

            this.logger.debug('Original dimensions', { originalWidth, originalHeight });

            // Create snapshot for undo capability
            await this.ps.createHistorySnapshot('Before Profile Pic Creation');

            // Step 1: Crop to square
            this.logger.info('Cropping to square', { method: cropMode });
            await this.ps.cropToSquare(null, cropMode);

            // Step 2: Resize to target platform size
            this.logger.info('Resizing to platform size', { size: platformConfig.size });
            await this.ps.resizeImage(platformConfig.size, platformConfig.size, 'bicubic');

            // Step 3: Flatten for optimization
            try {
                await this.ps.flattenImage();
                this.logger.info('Image flattened for optimization');
            } catch (error) {
                this.logger.warn('Could not flatten image, may already be flattened', error);
            }

            this.logger.info(`${platformConfig.name} profile picture created successfully`, {
                finalSize: platformConfig.size
            });

            return {
                success: true,
                platform: platformConfig.name,
                size: platformConfig.size,
                originalDimensions: { width: originalWidth, height: originalHeight }
            };

        } catch (error) {
            this.logger.error('Failed to create profile picture', error, { platform, cropMode });

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'createProfilePicture',
                    platform,
                    cropMode
                });
            }

            throw error;
        }
    }

    async createCustomSize(width, height, cropMode = 'center') {
        try {
            this.logger.info('Creating custom size profile picture', { width, height, cropMode });

            // Get current document
            const doc = await this.ps.getActiveDocument();
            const originalWidth = doc.width;
            const originalHeight = doc.height;

            // Create snapshot
            await this.ps.createHistorySnapshot('Before Custom Resize');

            // Calculate crop dimensions
            const targetRatio = width / height;
            const currentRatio = originalWidth / originalHeight;

            let cropBounds;

            if (cropMode === 'center') {
                if (currentRatio > targetRatio) {
                    // Image is wider - crop width
                    const newWidth = originalHeight * targetRatio;
                    const offset = (originalWidth - newWidth) / 2;
                    cropBounds = {
                        left: offset,
                        top: 0,
                        right: offset + newWidth,
                        bottom: originalHeight
                    };
                } else {
                    // Image is taller - crop height
                    const newHeight = originalWidth / targetRatio;
                    const offset = (originalHeight - newHeight) / 2;
                    cropBounds = {
                        left: 0,
                        top: offset,
                        right: originalWidth,
                        bottom: offset + newHeight
                    };
                }
            } else {
                // Smart/top-left crop
                if (currentRatio > targetRatio) {
                    const newWidth = originalHeight * targetRatio;
                    cropBounds = {
                        left: 0,
                        top: 0,
                        right: newWidth,
                        bottom: originalHeight
                    };
                } else {
                    const newHeight = originalWidth / targetRatio;
                    cropBounds = {
                        left: 0,
                        top: 0,
                        right: originalWidth,
                        bottom: newHeight
                    };
                }
            }

            // Crop to target ratio
            await this.ps.cropImage(
                cropBounds.left,
                cropBounds.top,
                cropBounds.right,
                cropBounds.bottom
            );

            // Resize to final dimensions
            await this.ps.resizeImage(width, height, 'bicubic');

            // Flatten
            try {
                await this.ps.flattenImage();
            } catch (error) {
                this.logger.warn('Could not flatten image', error);
            }

            this.logger.info('Custom size profile picture created successfully', { width, height });

            return {
                success: true,
                width,
                height,
                originalDimensions: { width: originalWidth, height: originalHeight }
            };

        } catch (error) {
            this.logger.error('Failed to create custom size', error);

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'createCustomSize',
                    width,
                    height,
                    cropMode
                });
            }

            throw error;
        }
    }

    getPlatformsList() {
        return Object.entries(this.platforms).map(([key, value]) => ({
            id: key,
            name: value.name,
            size: value.size
        }));
    }
}

// Export
if (typeof window !== 'undefined') {
    window.SocialMediaService = SocialMediaService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialMediaService;
}
