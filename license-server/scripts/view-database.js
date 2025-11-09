// View Database Contents
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'licenses.db');
const db = new sqlite3.Database(dbPath);

console.log('\n========================================');
console.log('LICENSE DATABASE VIEWER');
console.log('========================================\n');

// View all licenses
db.all('SELECT * FROM licenses', [], (err, licenses) => {
  if (err) {
    console.error('Error reading licenses:', err);
    return;
  }

  console.log('📋 LICENSES:');
  console.log('─────────────────────────────────────────');
  if (licenses.length === 0) {
    console.log('No licenses found.');
  } else {
    licenses.forEach((license, index) => {
      console.log(`\n${index + 1}. License Key: ${license.license_key}`);
      console.log(`   Status: ${license.status}`);
      console.log(`   Max Devices: ${license.max_devices}`);
      console.log(`   Created: ${new Date(license.created_at).toLocaleString()}`);
      console.log(`   Expires: ${license.expires_at ? new Date(license.expires_at).toLocaleString() : 'Never'}`);
    });
  }

  console.log('\n');

  // View all activations
  db.all('SELECT * FROM activations', [], (err, activations) => {
    if (err) {
      console.error('Error reading activations:', err);
      db.close();
      return;
    }

    console.log('🔐 ACTIVATIONS:');
    console.log('─────────────────────────────────────────');
    if (activations.length === 0) {
      console.log('No activations found.');
    } else {
      activations.forEach((activation, index) => {
        console.log(`\n${index + 1}. License: ${activation.license_key}`);
        console.log(`   Machine ID: ${activation.machine_id}`);
        console.log(`   Activated: ${new Date(activation.activated_at).toLocaleString()}`);
        console.log(`   Last Validated: ${new Date(activation.last_validated).toLocaleString()}`);
      });
    }

    console.log('\n');

    // View validation logs (last 10) - check if table exists first
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='validation_logs'", [], (err, table) => {
      if (err || !table) {
        console.log('📊 RECENT VALIDATION LOGS:');
        console.log('─────────────────────────────────────────');
        console.log('Validation logs table not found (will be created on first server run).');
        console.log('\n========================================');
        console.log('Database path: ' + dbPath);
        console.log('========================================\n');
        db.close();
        return;
      }

      db.all('SELECT * FROM validation_logs ORDER BY created_at DESC LIMIT 10', [], (err, logs) => {
        if (err) {
          console.log('📊 RECENT VALIDATION LOGS:');
          console.log('─────────────────────────────────────────');
          console.log('Error reading logs (table schema may need updating)');
          console.log('\n========================================');
          console.log('Database path: ' + dbPath);
          console.log('========================================\n');
          db.close();
          return;
        }

        console.log('📊 RECENT VALIDATION LOGS (Last 10):');
        console.log('─────────────────────────────────────────');
        if (logs.length === 0) {
          console.log('No validation logs found.');
        } else {
          logs.forEach((log, index) => {
            const timeField = log.timestamp || log.created_at;
            console.log(`\n${index + 1}. Time: ${timeField ? new Date(timeField).toLocaleString() : 'N/A'}`);
            console.log(`   License: ${log.license_key}`);
            console.log(`   Machine: ${log.machine_id ? log.machine_id.substring(0, 8) + '...' : 'N/A'}`);
            console.log(`   Action: ${log.action}`);
            console.log(`   Status: ${log.status}`);
          });
        }

        console.log('\n========================================');
        console.log('Database path: ' + dbPath);
        console.log('========================================\n');

        db.close();
      });
    });
  });
});
