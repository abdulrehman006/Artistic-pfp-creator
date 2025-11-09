# Photoshop Plugin License Server

Node.js backend server for validating Photoshop plugin licenses.

## Features

- ✅ License key validation
- ✅ Machine ID binding (hardware-locked)
- ✅ Activation limit enforcement
- ✅ SQLite database (lightweight, portable)
- ✅ CORS enabled for UXP plugins
- ✅ Validation logging for analytics

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Test License Keys

```bash
npm run generate-license
```

This will create a license key with 2 max activations.

To generate multiple licenses or change activation limit:
```bash
node scripts/generateLicense.js 3 5
# Args: maxActivations count
# This creates 5 licenses with 3 activations each
```

### 3. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### POST /api/activate
Activate a license on a new machine.

**Request:**
```json
{
  "licenseKey": "PS-XXXX-XXXX-XXXX",
  "machineId": "32-character-hex-string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "License activated successfully",
  "activationId": 1
}
```

**Error Responses:**
- `400` - Invalid format
- `404` - License not found
- `410` - License expired
- `429` - Activation limit reached

### POST /api/validate
Check if license is valid and activated on this machine.

**Request:**
```json
{
  "licenseKey": "PS-XXXX-XXXX-XXXX",
  "machineId": "32-character-hex-string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "status": "active",
  "expiresAt": null
}
```

### POST /api/deactivate
Remove license activation from a machine.

**Request:**
```json
{
  "licenseKey": "PS-XXXX-XXXX-XXXX",
  "machineId": "32-character-hex-string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "License deactivated"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-07T...",
  "uptime": 123.456
}
```

## Support

For technical support or questions, please contact: **abdulrehmann.swe@gmail.com**

---

**Version:** 1.0.0
