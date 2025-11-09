// Run Custom SQL Query
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'licenses.db');
const db = new sqlite3.Database(dbPath);

// Get query from command line arguments
const query = process.argv[2];

if (!query) {
  console.log('\nUsage: node scripts/run-query.js "SELECT * FROM licenses"');
  console.log('\nExample queries:');
  console.log('  node scripts/run-query.js "SELECT * FROM licenses"');
  console.log('  node scripts/run-query.js "SELECT * FROM activations"');
  console.log('  node scripts/run-query.js "SELECT COUNT(*) as total FROM licenses"');
  console.log('  node scripts/run-query.js "SELECT * FROM licenses WHERE status = \'active\'"');
  process.exit(1);
}

console.log('\n========================================');
console.log('RUNNING QUERY:');
console.log(query);
console.log('========================================\n');

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('❌ Query failed:', err.message);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('No results found.');
  } else {
    console.table(rows);
    console.log(`\n✓ ${rows.length} row(s) returned`);
  }

  console.log('\n========================================\n');
  db.close();
});
