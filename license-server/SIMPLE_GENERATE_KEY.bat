@echo off
cls
cd /d D:\abdul-ai\psplugin\license-server

echo.
echo ===================================================
echo GENERATING LICENSE KEY
echo ===================================================
echo.
echo Please wait...
echo.

node scripts/generateLicense.js 2>&1

echo.
echo.
echo ===================================================
echo If you see a license key above (PS-XXXX-XXXX-XXXX),
echo COPY IT NOW before closing this window!
echo ===================================================
echo.
echo If you see errors instead, press any key and
echo show me the error message.
echo.
pause
