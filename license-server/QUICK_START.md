# 🚀 LICENSE SERVER - QUICK START

## Step 1: Install Dependencies (One-time only)

**Double-click:** `install.bat`

This will install Express, CORS, SQLite, etc.

**Wait for:** "added XX packages" message

---

## Step 2: Start Server

**Double-click:** `start-server.bat`

**You should see:**
```
==================================================
Photoshop License Server
==================================================
Server running on http://localhost:5000
Environment: development
==================================================
```

**Keep this window open!** Server must stay running.

---

## Step 3: Generate License Key

**Double-click:** `generate-license.bat`

**You'll see output like:**
```
==================================================
License Key Generator
==================================================
Generating 1 license(s) with 2 max activation(s) each

✓ License 1/1: PS-A4B3-C8D9-E2F1
  - Max activations: 2
  - Status: active
  - Database ID: 1
==================================================
```

**Copy the license key:** `PS-A4B3-C8D9-E2F1`

---

## Step 4: Use in Plugin

1. Go to Photoshop plugin
2. Enter the license key
3. Click "Activate License"
4. Done! ✅

---

## Files You Can Double-Click

- `install.bat` - Install dependencies (run once)
- `start-server.bat` - Start the license server
- `generate-license.bat` - Create new license keys

---

## Troubleshooting

**"npm not found"**
- Install Node.js from https://nodejs.org

**Port 5000 already in use**
- Close other apps using port 5000
- Or change PORT in .env file

**Database locked**
- Close all terminals
- Delete licenses.db file
- Restart server

---

**That's it!** Simple as double-clicking files! 🎉
