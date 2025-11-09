@echo off
cls
echo.
echo ===================================================
echo PHOTOSHOP LICENSE SERVER - COMPLETE SETUP
echo ===================================================
echo.

cd /d D:\abdul-ai\psplugin\license-server

echo [1/3] Installing dependencies...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed!
    echo Make sure Node.js is installed.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo [2/3] Generating test license key...
echo ===================================================
echo.
node scripts/generateLicense.js

echo.
echo ===================================================
echo COPY THE LICENSE KEY ABOVE!
echo ===================================================
echo.
echo The license key is in format: PS-XXXX-XXXX-XXXX
echo Copy it now before continuing!
echo.
pause

echo.
echo ===================================================
echo [3/3] Starting license server...
echo ===================================================
echo.
echo Server will start on http://localhost:5000
echo Keep this window open!
echo.
echo Press Ctrl+C to stop the server
echo.
pause

npm start
