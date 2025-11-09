@echo off
echo.
echo ===================================================
echo LICENSE KEY GENERATOR
echo ===================================================
echo.
cd /d D:\abdul-ai\psplugin\license-server
node scripts/generateLicense.js
echo.
echo ===================================================
echo Press any key to close...
echo ===================================================
pause > nul
