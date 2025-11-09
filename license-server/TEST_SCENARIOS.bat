@echo off
cls
echo.
echo ===================================================
echo LICENSE SERVER - TEST SCENARIOS
echo ===================================================
echo.
echo This will help you test different license scenarios
echo.
cd /d D:\abdul-ai\psplugin\license-server

:MENU
echo.
echo Choose a test scenario:
echo.
echo 1. View all existing licenses
echo 2. Generate NEW valid license
echo 3. Deactivate a license (set status to inactive)
echo 4. Set license to expired
echo 5. View activations (which machines are using licenses)
echo 6. Clear all activations for a license
echo 7. Delete a license completely
echo 8. Exit
echo.
set /p choice="Enter choice (1-8): "

if "%choice%"=="1" goto VIEW_LICENSES
if "%choice%"=="2" goto GENERATE
if "%choice%"=="3" goto DEACTIVATE
if "%choice%"=="4" goto EXPIRE
if "%choice%"=="5" goto VIEW_ACTIVATIONS
if "%choice%"=="6" goto CLEAR_ACTIVATIONS
if "%choice%"=="7" goto DELETE_LICENSE
if "%choice%"=="8" goto END
goto MENU

:VIEW_LICENSES
echo.
echo ===================================================
echo EXISTING LICENSES
echo ===================================================
node -e "const db = require('./src/models/database'); db.all('SELECT * FROM licenses', (err, rows) => { if (err) console.error(err); else { rows.forEach(r => console.log(`ID: ${r.id} | Key: ${r.license_key} | Status: ${r.status} | Activations: ${r.current_activations}/${r.max_activations} | Expires: ${r.expires_at || 'Never'}`)); } process.exit(0); });"
pause
goto MENU

:GENERATE
echo.
echo Generating new license...
node scripts/generateLicense.js
pause
goto MENU

:DEACTIVATE
echo.
set /p key="Enter license key to deactivate (PS-XXXX-XXXX-XXXX): "
node -e "const db = require('./src/models/database'); db.run('UPDATE licenses SET status = ? WHERE license_key = ?', ['inactive', '%key%'], function(err) { if (err) console.error(err); else if (this.changes === 0) console.log('License not found!'); else console.log('License deactivated!'); process.exit(0); });"
echo.
echo Now try to activate this license in the plugin - it should fail!
pause
goto MENU

:EXPIRE
echo.
set /p key="Enter license key to expire (PS-XXXX-XXXX-XXXX): "
node -e "const db = require('./src/models/database'); db.run('UPDATE licenses SET expires_at = ? WHERE license_key = ?', ['2020-01-01 00:00:00', '%key%'], function(err) { if (err) console.error(err); else if (this.changes === 0) console.log('License not found!'); else console.log('License set to expired (2020-01-01)!'); process.exit(0); });"
echo.
echo Now try to activate this license in the plugin - it should say "expired"!
pause
goto MENU

:VIEW_ACTIVATIONS
echo.
echo ===================================================
echo ACTIVE ACTIVATIONS
echo ===================================================
node -e "const db = require('./src/models/database'); db.all('SELECT * FROM activations', (err, rows) => { if (err) console.error(err); else { if (rows.length === 0) console.log('No activations found.'); rows.forEach(r => console.log(`License: ${r.license_key} | Machine: ${r.machine_id.substring(0,16)}... | Activated: ${r.activated_at}`)); } process.exit(0); });"
pause
goto MENU

:CLEAR_ACTIVATIONS
echo.
set /p key="Enter license key to clear activations (PS-XXXX-XXXX-XXXX): "
node -e "const db = require('./src/models/database'); db.run('DELETE FROM activations WHERE license_key = ?', ['%key%'], function(err) { if (err) console.error(err); else console.log('Cleared ' + this.changes + ' activation(s)'); db.run('UPDATE licenses SET current_activations = 0 WHERE license_key = ?', ['%key%']); process.exit(0); });"
echo.
echo Activations cleared! License can be re-activated on new devices.
pause
goto MENU

:DELETE_LICENSE
echo.
set /p key="Enter license key to DELETE permanently (PS-XXXX-XXXX-XXXX): "
echo WARNING: This cannot be undone!
set /p confirm="Type YES to confirm: "
if /i "%confirm%"=="YES" (
    node -e "const db = require('./src/models/database'); db.run('DELETE FROM activations WHERE license_key = ?', ['%key%']); db.run('DELETE FROM licenses WHERE license_key = ?', ['%key%'], function(err) { if (err) console.error(err); else if (this.changes === 0) console.log('License not found!'); else console.log('License deleted!'); process.exit(0); });"
) else (
    echo Cancelled.
)
pause
goto MENU

:END
echo.
echo Goodbye!
exit /b 0
