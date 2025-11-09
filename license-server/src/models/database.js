const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../licenses.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create tables
db.serialize(() => {
  // Licenses table
  db.run(`
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      max_activations INTEGER DEFAULT 2,
      current_activations INTEGER DEFAULT 0,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    )
  `, (err) => {
    if (err) console.error('Error creating licenses table:', err);
    else console.log('Licenses table ready');
  });

  // Activations table
  db.run(`
    CREATE TABLE IF NOT EXISTS activations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      activated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_validated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(license_key, machine_id),
      FOREIGN KEY (license_key) REFERENCES licenses(license_key)
    )
  `, (err) => {
    if (err) console.error('Error creating activations table:', err);
    else console.log('Activations table ready');
  });

  // Validation logs
  db.run(`
    CREATE TABLE IF NOT EXISTS validation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT,
      machine_id TEXT,
      success INTEGER,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating logs table:', err);
    else console.log('Validation logs table ready');
  });
});

module.exports = db;
