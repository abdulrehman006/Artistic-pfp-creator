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

## Database Schema

### licenses
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| license_key | TEXT | Unique license key (PS-XXXX-XXXX-XXXX) |
| status | TEXT | 'active', 'inactive', 'expired' |
| max_activations | INTEGER | Maximum allowed activations (default: 2) |
| current_activations | INTEGER | Current active count |
| expires_at | TEXT | Expiration date (null = lifetime) |
| created_at | TEXT | Creation timestamp |
| metadata | TEXT | Additional JSON data |

### activations
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| license_key | TEXT | Foreign key to licenses |
| machine_id | TEXT | Unique machine identifier |
| activated_at | TEXT | Activation timestamp |
| last_validated_at | TEXT | Last validation timestamp |

### validation_logs
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| license_key | TEXT | License key attempted |
| machine_id | TEXT | Machine attempting validation |
| success | INTEGER | 1 = success, 0 = failed |
| reason | TEXT | Failure reason or success note |
| created_at | TEXT | Log timestamp |

## Configuration

Edit `.env` file:

```env
PORT=5000
NODE_ENV=development
SECRET_KEY=your-secret-key-here
```

## Deployment

### Local Development
```bash
npm run dev
```

### Production (Railway/Render)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy!

### Production (Manual Server)
```bash
npm install --production
NODE_ENV=production npm start
```

## Security Notes

- ✅ CORS enabled for UXP plugin access
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ Machine ID validation (32-char hex)
- ✅ License format validation (PS-XXXX-XXXX-XXXX)
- ⚠️ Add rate limiting for production
- ⚠️ Add HTTPS in production
- ⚠️ Change SECRET_KEY before deployment

## Testing

### Test with curl:

**Activate License:**
```bash
curl -X POST http://localhost:5000/api/activate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"PS-ABCD-1234-EFGH","machineId":"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"}'
```

**Validate License:**
```bash
curl -X POST http://localhost:5000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"PS-ABCD-1234-EFGH","machineId":"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"}'
```

## License Management

### View all licenses:
```bash
sqlite3 licenses.db "SELECT * FROM licenses;"
```

### View all activations:
```bash
sqlite3 licenses.db "SELECT * FROM activations;"
```

### Manually deactivate all for a license:
```bash
sqlite3 licenses.db "DELETE FROM activations WHERE license_key='PS-XXXX-XXXX-XXXX';"
sqlite3 licenses.db "UPDATE licenses SET current_activations=0 WHERE license_key='PS-XXXX-XXXX-XXXX';"
```

### Reset database:
```bash
rm licenses.db
npm start
# Database will be recreated automatically
```

## Troubleshooting

**Server won't start:**
- Check if port 5000 is already in use
- Run: `netstat -ano | findstr :5000` (Windows)
- Change PORT in .env

**License not activating:**
- Check server logs for error details
- Verify license exists in database
- Check activation limit not exceeded
- Verify machineId format (32-char hex)

**CORS errors:**
- Server is running on localhost:5000
- Plugin is making requests to correct URL
- Check browser/UXP console for details

## Support

For issues or questions, check:
- Server logs in console
- Database contents with sqlite3
- Validation logs table for failed attempts

---

**Version:** 1.0.0
**License:** ISC
**Author:** Your Name
