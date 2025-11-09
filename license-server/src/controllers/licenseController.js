const db = require('../models/database');
const { validateLicenseKeyFormat, validateMachineId } = require('../utils/validation');

/**
 * Activate a license on a new machine
 */
exports.activate = (req, res) => {
  const { licenseKey, machineId } = req.body;

  console.log('Activation request:', { licenseKey, machineId });

  // Validation
  if (!licenseKey || !machineId) {
    return res.status(400).json({
      success: false,
      error: 'Missing licenseKey or machineId'
    });
  }

  if (!validateLicenseKeyFormat(licenseKey)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid license key format'
    });
  }

  if (!validateMachineId(machineId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid machine ID format'
    });
  }

  // Check if license exists
  db.get(
    'SELECT * FROM licenses WHERE license_key = ?',
    [licenseKey],
    (err, license) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error'
        });
      }

      if (!license) {
        logValidation(licenseKey, machineId, false, 'License not found');
        return res.status(404).json({
          success: false,
          error: 'Invalid license key'
        });
      }

      // Check if inactive
      if (license.status !== 'active') {
        logValidation(licenseKey, machineId, false, 'License inactive');
        return res.status(403).json({
          success: false,
          error: 'License is not active'
        });
      }

      // Check if expired
      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        logValidation(licenseKey, machineId, false, 'License expired');
        return res.status(410).json({
          success: false,
          error: 'License has expired'
        });
      }

      // Check if already activated on this machine
      db.get(
        'SELECT * FROM activations WHERE license_key = ? AND machine_id = ?',
        [licenseKey, machineId],
        (err, activation) => {
          if (activation) {
            // Already activated - update last validated
            db.run(
              'UPDATE activations SET last_validated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [activation.id]
            );
            logValidation(licenseKey, machineId, true, 'Re-validation successful');
            console.log('Re-activation successful for existing machine');
            return res.json({
              success: true,
              message: 'License already activated on this device'
            });
          }

          // Check activation limit
          if (license.current_activations >= license.max_activations) {
            logValidation(licenseKey, machineId, false, 'Activation limit reached');
            return res.status(429).json({
              success: false,
              error: 'Activation limit reached. Deactivate another device first.'
            });
          }

          // Create new activation
          db.run(
            'INSERT INTO activations (license_key, machine_id) VALUES (?, ?)',
            [licenseKey, machineId],
            function(err) {
              if (err) {
                console.error('Activation error:', err);
                return res.status(500).json({
                  success: false,
                  error: 'Failed to activate'
                });
              }

              // Update activation count
              db.run(
                'UPDATE licenses SET current_activations = current_activations + 1 WHERE license_key = ?',
                [licenseKey],
                (err) => {
                  if (err) {
                    console.error('Error updating activation count:', err);
                  }
                }
              );

              logValidation(licenseKey, machineId, true, 'Activation successful');
              console.log('New activation successful. ID:', this.lastID);

              res.json({
                success: true,
                message: 'License activated successfully',
                activationId: this.lastID
              });
            }
          );
        }
      );
    }
  );
};

/**
 * Validate an existing license
 */
exports.validate = (req, res) => {
  const { licenseKey, machineId } = req.body;

  console.log('Validation request:', { licenseKey, machineId });

  if (!licenseKey || !machineId) {
    return res.status(400).json({
      success: false,
      error: 'Missing parameters'
    });
  }

  db.get(
    `SELECT l.*, a.id as activation_id
     FROM licenses l
     LEFT JOIN activations a ON l.license_key = a.license_key AND a.machine_id = ?
     WHERE l.license_key = ?`,
    [machineId, licenseKey],
    (err, result) => {
      if (err) {
        console.error('Validation error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error'
        });
      }

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'License not found'
        });
      }

      if (!result.activation_id) {
        return res.status(403).json({
          success: false,
          error: 'License not activated on this device'
        });
      }

      if (result.expires_at && new Date(result.expires_at) < new Date()) {
        return res.status(410).json({
          success: false,
          error: 'License expired'
        });
      }

      // Update last validated timestamp
      db.run(
        'UPDATE activations SET last_validated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [result.activation_id]
      );

      res.json({
        success: true,
        status: result.status,
        expiresAt: result.expires_at
      });
    }
  );
};

/**
 * Deactivate a license on a machine
 */
exports.deactivate = (req, res) => {
  const { licenseKey, machineId } = req.body;

  console.log('Deactivation request:', { licenseKey, machineId });

  if (!licenseKey || !machineId) {
    return res.status(400).json({
      success: false,
      error: 'Missing parameters'
    });
  }

  db.run(
    'DELETE FROM activations WHERE license_key = ? AND machine_id = ?',
    [licenseKey, machineId],
    function(err) {
      if (err) {
        console.error('Deactivation error:', err);
        return res.status(500).json({
          success: false,
          error: 'Deactivation failed'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Activation not found'
        });
      }

      // Update activation count
      db.run(
        'UPDATE licenses SET current_activations = current_activations - 1 WHERE license_key = ?',
        [licenseKey],
        (err) => {
          if (err) {
            console.error('Error updating activation count:', err);
          }
        }
      );

      console.log('Deactivation successful');
      res.json({
        success: true,
        message: 'License deactivated'
      });
    }
  );
};

/**
 * Helper: Log validation attempts for analytics and fraud detection
 */
function logValidation(licenseKey, machineId, success, reason) {
  db.run(
    'INSERT INTO validation_logs (license_key, machine_id, success, reason) VALUES (?, ?, ?, ?)',
    [licenseKey, machineId, success ? 1 : 0, reason],
    (err) => {
      if (err) {
        console.error('Error logging validation:', err);
      }
    }
  );
}
