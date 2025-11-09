// ==========================================
// EFFECTS SERVICE
// Artistic filters and effects
// ==========================================

class EffectsService {
    constructor(photoshopService, logger, errorHandler) {
        this.ps = photoshopService;
        this.logger = logger || console;
        this.errorHandler = errorHandler;
        this.lastAppliedEffect = null;
    }

    async applyVibrantPop() {
        try {
            this.logger.info('Applying Vibrant Pop effect');

            await this.ps.createHistorySnapshot('Before Vibrant Pop');

            // Duplicate layer for safety
            await this.ps.duplicateLayer('Vibrant Pop Effect');

            // Increase saturation and adjust hue slightly
            await this.ps.applyHueSaturation(0, 35, 5);

            // Increase brightness and contrast
            await this.ps.applyBrightnessContrast(10, 20);

            this.lastAppliedEffect = 'vibrant';
            this.logger.info('Vibrant Pop effect applied successfully');

            return {
                success: true,
                effect: 'Vibrant Pop',
                description: 'Enhanced colors with increased saturation and contrast'
            };

        } catch (error) {
            this.logger.error('Failed to apply Vibrant Pop effect', error);

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'applyVibrantPop'
                });
            }

            throw error;
        }
    }

    async applyBlackAndWhite() {
        try {
            this.logger.info('Applying Black & White effect');

            await this.ps.createHistorySnapshot('Before Black & White');

            // Duplicate layer
            await this.ps.duplicateLayer('Black & White Effect');

            // Convert to grayscale
            await this.ps.convertToGrayscale();

            // Slight contrast boost
            await this.ps.applyBrightnessContrast(0, 15);

            this.lastAppliedEffect = 'bw';
            this.logger.info('Black & White effect applied successfully');

            return {
                success: true,
                effect: 'Black & White',
                description: 'Classic grayscale with enhanced contrast'
            };

        } catch (error) {
            this.logger.error('Failed to apply Black & White effect', error);

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'applyBlackAndWhite'
                });
            }

            throw error;
        }
    }

    async applyVintageFade() {
        try {
            this.logger.info('Applying Vintage Fade effect');

            await this.ps.createHistorySnapshot('Before Vintage Fade');

            // Duplicate layer
            await this.ps.duplicateLayer('Vintage Fade Effect');

            // Reduce saturation
            await this.ps.applyHueSaturation(10, -20, 0);

            // Reduce brightness slightly, lower contrast
            await this.ps.applyBrightnessContrast(-5, -10);

            this.lastAppliedEffect = 'vintage';
            this.logger.info('Vintage Fade effect applied successfully');

            return {
                success: true,
                effect: 'Vintage Fade',
                description: 'Muted colors with faded look'
            };

        } catch (error) {
            this.logger.error('Failed to apply Vintage Fade effect', error);

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'applyVintageFade'
                });
            }

            throw error;
        }
    }

    async applyWarmGlow() {
        try {
            this.logger.info('Applying Warm Glow effect');

            await this.ps.createHistorySnapshot('Before Warm Glow');

            // Duplicate layer
            await this.ps.duplicateLayer('Warm Glow Effect');

            // Shift hue towards warm tones (orange/yellow)
            await this.ps.applyHueSaturation(15, 10, 5);

            // Increase brightness
            await this.ps.applyBrightnessContrast(15, 5);

            this.lastAppliedEffect = 'warm';
            this.logger.info('Warm Glow effect applied successfully');

            return {
                success: true,
                effect: 'Warm Glow',
                description: 'Warm tones with gentle glow'
            };

        } catch (error) {
            this.logger.error('Failed to apply Warm Glow effect', error);

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'applyWarmGlow'
                });
            }

            throw error;
        }
    }

    async applyCoolTone() {
        try {
            this.logger.info('Applying Cool Tone effect');

            await this.ps.createHistorySnapshot('Before Cool Tone');

            // Duplicate layer
            await this.ps.duplicateLayer('Cool Tone Effect');

            // Shift hue towards cool tones (blue/cyan)
            await this.ps.applyHueSaturation(-15, 5, -5);

            // Adjust brightness and contrast
            await this.ps.applyBrightnessContrast(5, 10);

            this.lastAppliedEffect = 'cool';
            this.logger.info('Cool Tone effect applied successfully');

            return {
                success: true,
                effect: 'Cool Tone',
                description: 'Cool blue tones with crisp look'
            };

        } catch (error) {
            this.logger.error('Failed to apply Cool Tone effect', error);

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'applyCoolTone'
                });
            }

            throw error;
        }
    }

    async applyEffect(effectType) {
        try {
            this.logger.info('Applying effect', { effectType });

            // Check if document is open
            await this.ps.getActiveDocument();

            let result;

            switch (effectType.toLowerCase()) {
                case 'vibrant':
                case 'vibrantpop':
                    result = await this.applyVibrantPop();
                    break;

                case 'bw':
                case 'blackandwhite':
                case 'grayscale':
                    result = await this.applyBlackAndWhite();
                    break;

                case 'vintage':
                case 'vintagefade':
                    result = await this.applyVintageFade();
                    break;

                case 'warm':
                case 'warmglow':
                    result = await this.applyWarmGlow();
                    break;

                case 'cool':
                case 'cooltone':
                    result = await this.applyCoolTone();
                    break;

                default:
                    throw new Error(`Unknown effect type: ${effectType}`);
            }

            return result;

        } catch (error) {
            this.logger.error('Failed to apply effect', error, { effectType });

            if (this.errorHandler) {
                await this.errorHandler.handle('PHOTOSHOP_API_ERROR', error, {
                    operation: 'applyEffect',
                    effectType
                });
            }

            throw error;
        }
    }

    getLastAppliedEffect() {
        return this.lastAppliedEffect;
    }

    getAvailableEffects() {
        return [
            {
                id: 'vibrant',
                name: 'Vibrant Pop',
                description: 'Enhanced colors with increased saturation and contrast',
                icon: '✨'
            },
            {
                id: 'bw',
                name: 'Black & White',
                description: 'Classic grayscale with enhanced contrast',
                icon: '🎭'
            },
            {
                id: 'vintage',
                name: 'Vintage Fade',
                description: 'Muted colors with faded look',
                icon: '📷'
            },
            {
                id: 'warm',
                name: 'Warm Glow',
                description: 'Warm tones with gentle glow',
                icon: '🌅'
            },
            {
                id: 'cool',
                name: 'Cool Tone',
                description: 'Cool blue tones with crisp look',
                icon: '❄️'
            }
        ];
    }
}

// Export
if (typeof window !== 'undefined') {
    window.EffectsService = EffectsService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EffectsService;
}
