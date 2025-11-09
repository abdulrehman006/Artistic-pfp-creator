const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'online',
        message: 'License server is running',
        timestamp: new Date().toISOString()
    });
});

// Activate a license
router.post('/activate', licenseController.activate);

// Validate an existing license
router.post('/validate', licenseController.validate);

// Deactivate a license
router.post('/deactivate', licenseController.deactivate);

module.exports = router;
