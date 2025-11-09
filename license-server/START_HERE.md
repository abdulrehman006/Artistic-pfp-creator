# 🚀 START HERE - LICENSE SERVER SETUP

## EASIEST WAY - One File Does Everything!

### **Double-click:** `SETUP_AND_RUN.bat`

This will:
1. ✅ Install all dependencies
2. ✅ Generate a test license key (COPY IT!)
3. ✅ Start the server

**That's it!** Everything automated! 🎉

---

## OR Manual Steps (if you prefer)

### Step 1: Install (one-time)
**Double-click:** `install.bat`
- Installs Express, SQLite, etc.
- Wait for "added XX packages"

### Step 2: Generate License Key
**Double-click:** `generate-license.bat`
- Creates a license key like: `PS-A4B3-C8D9-E2F1`
- **COPY THIS KEY!**
- Window will stay open - press any key to close

### Step 3: Start Server
**Double-click:** `start-server.bat`
- Starts server on http://localhost:5000
- **Keep window open!**

---

## 📋 What You Need

**License Key Format:** `PS-XXXX-XXXX-XXXX`

**Example:** `PS-A4B3-C8D9-E2F1`

---

## 🎯 Use the License Key

**In Photoshop Plugin:**
1. Enter the license key
2. Click "Activate License"
3. Done! ✅

---

## ⚡ Quick Test

1. **Double-click:** `SETUP_AND_RUN.bat`
2. **Copy** the license key when it appears
3. **Wait** for "Server running on http://localhost:5000"
4. **Go to Photoshop** plugin
5. **Enter** the license key
6. **Click** Activate
7. **Success!** 🎉

---

## 🐛 Troubleshooting

**Window closes immediately:**
- Check if Node.js is installed
- Run `install.bat` first

**"Cannot find module":**
- Delete `node_modules` folder
- Run `install.bat` again

**Port 5000 in use:**
- Close other apps
- Or change PORT in `.env` file

---

## 📁 Files

- `SETUP_AND_RUN.bat` ← **START HERE!** (does everything)
- `install.bat` - Install dependencies only
- `start-server.bat` - Start server only
- `generate-license.bat` - Generate keys only

---

**Recommendation:** Just use `SETUP_AND_RUN.bat` - it does everything! 🚀
