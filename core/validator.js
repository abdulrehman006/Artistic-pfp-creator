// ==========================================
// VALIDATION LAYER
// Comprehensive input and state validation
// ==========================================

class Validator {
    constructor(logger) {
        this.logger = logger || console;
    }

    // License key validation
    validateLicenseKey(key) {
        if (!key || typeof key !== 'string') {
            return {
                valid: false,
                error: "License key is required"
            };
        }

        const cleanKey = key.trim().toUpperCase();
        const regex = /^PS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;

        if (!regex.test(cleanKey)) {
            return {
                valid: false,
                error: "Invalid format. Use: PS-XXXX-XXXX-XXXX"
            };
        }

        return { valid: true, key: cleanKey };
    }

    // Validate document exists in Photoshop
    async validateDocument(app) {
        try {
            if (!app) {
                return {
                    valid: false,
                    error: "Photoshop app not available"
                };
            }

            const documents = app.documents;
            if (!documents || documents.length === 0) {
                return {
                    valid: false,
                    error: "No document is open. Please open an image first."
                };
            }

            return { valid: true, document: documents[0] };
        } catch (error) {
            this.logger.error('Document validation failed', error);
            return {
                valid: false,
                error: "Failed to access document"
            };
        }
    }

    // Validate image dimensions
    validateDimensions(width, height, minWidth = 1, minHeight = 1, maxWidth = 30000, maxHeight = 30000) {
        if (!width || !height || width < minWidth || height < minHeight) {
            return {
                valid: false,
                error: `Image must be at least ${minWidth}x${minHeight} pixels`
            };
        }

        if (width > maxWidth || height > maxHeight) {
            return {
                valid: false,
                error: `Image dimensions exceed maximum (${maxWidth}x${maxHeight})`
            };
        }

        return { valid: true };
    }

    // Validate numeric input
    validateNumber(value, min = null, max = null, required = true) {
        if (value === null || value === undefined || value === '') {
            if (required) {
                return {
                    valid: false,
                    error: "Value is required"
                };
            }
            return { valid: true };
        }

        const num = Number(value);
        if (isNaN(num)) {
            return {
                valid: false,
                error: "Value must be a number"
            };
        }

        if (min !== null && num < min) {
            return {
                valid: false,
                error: `Value must be at least ${min}`
            };
        }

        if (max !== null && num > max) {
            return {
                valid: false,
                error: `Value must be at most ${max}`
            };
        }

        return { valid: true, value: num };
    }

    // Validate string input
    validateString(value, minLength = 0, maxLength = null, pattern = null, required = true) {
        if (!value || typeof value !== 'string') {
            if (required) {
                return {
                    valid: false,
                    error: "Value is required"
                };
            }
            return { valid: true };
        }

        if (value.length < minLength) {
            return {
                valid: false,
                error: `Value must be at least ${minLength} characters`
            };
        }

        if (maxLength !== null && value.length > maxLength) {
            return {
                valid: false,
                error: `Value must be at most ${maxLength} characters`
            };
        }

        if (pattern && !pattern.test(value)) {
            return {
                valid: false,
                error: "Value format is invalid"
            };
        }

        return { valid: true, value };
    }

    // Validate email
    validateEmail(email) {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return this.validateString(email, 3, 254, pattern);
    }

    // Validate URL
    validateURL(url) {
        try {
            new URL(url);
            return { valid: true, value: url };
        } catch (error) {
            return {
                valid: false,
                error: "Invalid URL format"
            };
        }
    }

    // Validate enum value
    validateEnum(value, allowedValues, required = true) {
        if (!value) {
            if (required) {
                return {
                    valid: false,
                    error: "Value is required"
                };
            }
            return { valid: true };
        }

        if (!allowedValues.includes(value)) {
            return {
                valid: false,
                error: `Value must be one of: ${allowedValues.join(', ')}`
            };
        }

        return { valid: true, value };
    }

    // Validate object has required properties
    validateObject(obj, requiredProps = [], optionalProps = []) {
        if (!obj || typeof obj !== 'object') {
            return {
                valid: false,
                error: "Value must be an object"
            };
        }

        const missingProps = requiredProps.filter(prop => !(prop in obj));
        if (missingProps.length > 0) {
            return {
                valid: false,
                error: `Missing required properties: ${missingProps.join(', ')}`
            };
        }

        const allowedProps = [...requiredProps, ...optionalProps];
        const extraProps = Object.keys(obj).filter(key => !allowedProps.includes(key));
        if (extraProps.length > 0) {
            this.logger.warn('Extra properties found', extraProps);
        }

        return { valid: true };
    }

    // Validate hex color
    validateHexColor(color) {
        const pattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return this.validateString(color, 4, 7, pattern);
    }

    // Validate RGB color
    validateRGB(r, g, b) {
        const rValid = this.validateNumber(r, 0, 255);
        const gValid = this.validateNumber(g, 0, 255);
        const bValid = this.validateNumber(b, 0, 255);

        if (!rValid.valid || !gValid.valid || !bValid.valid) {
            return {
                valid: false,
                error: "RGB values must be between 0 and 255"
            };
        }

        return { valid: true, r, g, b };
    }
}

// Export
if (typeof window !== 'undefined') {
    window.Validator = Validator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
}
