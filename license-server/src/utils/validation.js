/**
 * Validate license key format
 * Format: PS-XXXX-XXXX-XXXX (where X is A-F or 0-9)
 */
function validateLicenseKeyFormat(key) {
  if (!key || typeof key !== 'string') {
    return false;
  }

  const regex = /^PS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  return regex.test(key.toUpperCase());
}

/**
 * Generate a new license key
 * Returns: PS-XXXX-XXXX-XXXX format
 */
function generateLicenseKey() {
  const chars = 'ABCDEF0123456789';

  const segment = () => {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return `PS-${segment()}-${segment()}-${segment()}`;
}

/**
 * Validate machine ID format
 */
function validateMachineId(machineId) {
  if (!machineId || typeof machineId !== 'string') {
    return false;
  }

  // Machine ID should be 32 character hex string
  return /^[a-f0-9]{32}$/i.test(machineId);
}

module.exports = {
  validateLicenseKeyFormat,
  generateLicenseKey,
  validateMachineId
};
