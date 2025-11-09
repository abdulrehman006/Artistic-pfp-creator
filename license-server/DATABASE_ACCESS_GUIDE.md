# Database Access Guide

## Database Location
```
D:\abdul-ai\psplugin\license-server\licenses.db
```

## 🚀 Quick Access Methods

### ⭐ Method 1: view-database.bat (Easiest - Just Created!)

**Double-click**: `view-database.bat`

Shows complete database contents:
- All licenses with details
- All activations
- Last 10 validation logs

### ⭐ Method 2: TEST_SCENARIOS.bat (Interactive Management)

**Double-click**: `TEST_SCENARIOS.bat`

Interactive menu:
```
1. View all licenses
2. Generate new license
3. Deactivate a license
4. Set expiration date
5. View all activations
6. Clear all activations
7. Delete a license
8. Exit
```

### ⭐ Method 3: DB Browser for SQLite (GUI Tool)

**Download**: https://sqlitebrowser.org/dl/

1. Install DB Browser for SQLite
2. Open the application
3. Click "Open Database"
4. Select: `D:\abdul-ai\psplugin\license-server\licenses.db`
5. Browse/edit tables visually

**Tables Available**:
- `licenses` - All license keys and their status
- `activations` - Which devices are activated
- `validation_logs` - Complete usage history

### Method 4: Custom SQL Queries (Advanced)

**Command Line**:
```bash
cd D:\abdul-ai\psplugin\license-server
node scripts/run-query.js "SELECT * FROM licenses"
```

**Example Queries**:
```bash
# View all licenses
node scripts/run-query.js "SELECT * FROM licenses"

# View only active licenses
node scripts/run-query.js "SELECT * FROM licenses WHERE status = 'active'"

# Count total licenses
node scripts/run-query.js "SELECT COUNT(*) as total FROM licenses"

# View all activations
node scripts/run-query.js "SELECT * FROM activations"

# View recent validation logs
node scripts/run-query.js "SELECT * FROM validation_logs ORDER BY timestamp DESC LIMIT 20"

# Find specific license
node scripts/run-query.js "SELECT * FROM licenses WHERE license_key = 'PS-1234-5678-ABCD'"
```

## 📊 Database Schema

### Table: licenses
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| license_key | TEXT | License key (PS-XXXX-XXXX-XXXX) |
| status | TEXT | active / inactive / expired |
| max_devices | INTEGER | Max activations allowed (default: 2) |
| created_at | TEXT | When license was created |
| expires_at | TEXT | Expiration date (NULL = never expires) |

### Table: activations
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| license_key | TEXT | Which license is activated |
| machine_id | TEXT | Unique device identifier (32-char hex) |
| activated_at | TEXT | When device was activated |
| last_validated | TEXT | Last check-in time |

### Table: validation_logs
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| license_key | TEXT | License used in action |
| machine_id | TEXT | Device performing action |
| action | TEXT | activate / validate / deactivate |
| status | TEXT | success / failed / expired / limit_reached |
| timestamp | TEXT | When action occurred |

## 🛠️ Common Database Operations

### View All Your Licenses
```bash
# Easiest: Double-click view-database.bat

# Or command line:
node scripts/run-query.js "SELECT license_key, status, created_at FROM licenses"
```

### Check How Many Devices Using Each License
```bash
node scripts/run-query.js "SELECT license_key, COUNT(*) as devices FROM activations GROUP BY license_key"
```

### Find Which Devices Use a Specific License
```bash
node scripts/run-query.js "SELECT * FROM activations WHERE license_key = 'PS-XXXX-XXXX-XXXX'"
```

### View Licenses Expiring Soon (Next 30 Days)
```bash
node scripts/run-query.js "SELECT * FROM licenses WHERE expires_at BETWEEN datetime('now') AND datetime('now', '+30 days')"
```

### Clear All Activations for a License (Free Up Slots)
**Use TEST_SCENARIOS.bat → Option 6** (Interactive)

Or manually:
```bash
node scripts/run-query.js "DELETE FROM activations WHERE license_key = 'PS-XXXX-XXXX-XXXX'"
```

### Deactivate a Specific Device
```bash
node scripts/run-query.js "DELETE FROM activations WHERE machine_id = 'abc123...'"
```

## ✏️ Manual Database Editing

### Set License Expiration (1 Year from Now)
```sql
UPDATE licenses
SET expires_at = datetime('now', '+365 days')
WHERE license_key = 'PS-XXXX-XXXX-XXXX';
```

### Make License Inactive
```sql
UPDATE licenses
SET status = 'inactive'
WHERE license_key = 'PS-XXXX-XXXX-XXXX';
```

### Increase Max Devices Allowed
```sql
UPDATE licenses
SET max_devices = 5
WHERE license_key = 'PS-XXXX-XXXX-XXXX';
```

### Completely Delete a License
```sql
DELETE FROM activations WHERE license_key = 'PS-XXXX-XXXX-XXXX';
DELETE FROM validation_logs WHERE license_key = 'PS-XXXX-XXXX-XXXX';
DELETE FROM licenses WHERE license_key = 'PS-XXXX-XXXX-XXXX';
```

## 📁 Batch Files Quick Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `view-database.bat` | View all data | Check database contents |
| `TEST_SCENARIOS.bat` | Manage licenses | Interactive database operations |
| `generate-license.bat` | Create license | Generate new license key |
| `start-server.bat` | Run server | Start API server |
| `install.bat` | Setup | First-time installation only |

## 🔧 Troubleshooting

### "Database is locked"
- **Cause**: Another program is using the database
- **Fix**: Close any programs accessing `licenses.db`, stop server, try again

### "Table doesn't exist"
- **Cause**: Database not initialized
- **Fix**: Run `start-server.bat` once (creates tables automatically)

### "Cannot find module sqlite3"
- **Cause**: Dependencies not installed
- **Fix**: Run `install.bat` or `npm install`

### "No such file: licenses.db"
- **Cause**: Database hasn't been created yet
- **Fix**: Run `start-server.bat` (creates database on first run)

## 💾 Backup & Restore

### Backup Database
**Simple Copy**:
1. Stop the server (`Ctrl+C` in server window)
2. Copy `licenses.db` to safe location
3. Rename with date: `licenses-2025-01-15.db`

**Command Line**:
```bash
copy D:\abdul-ai\psplugin\license-server\licenses.db D:\abdul-ai\psplugin\license-server\backups\licenses-backup.db
```

### Restore Database
1. Stop the server
2. Replace `licenses.db` with your backup file
3. Restart server

## 🔒 Security Notes

⚠️ **Important**:
- Database contains all license keys and activation data
- Keep regular backups of `licenses.db`
- Don't expose database file publicly
- When deploying to production, secure the server
- Consider moving to PostgreSQL for production
- Use environment variables for sensitive config

## 🎯 Quick Start Guide

### Want to View Database Right Now?

**Option 1** (Quickest):
```
Double-click: view-database.bat
```

**Option 2** (Most Powerful):
```
1. Download DB Browser for SQLite
2. Open licenses.db
3. Browse visually
```

**Option 3** (Interactive):
```
Double-click: TEST_SCENARIOS.bat
Choose Option 1 (View all licenses)
```

---

## That's It!

You now have complete access to your license database. The easiest way to start is:

1. **Double-click `view-database.bat`** to see everything
2. **Double-click `TEST_SCENARIOS.bat`** to manage licenses interactively
3. **Download DB Browser** for visual database editing

All tools are ready to use! 🚀
