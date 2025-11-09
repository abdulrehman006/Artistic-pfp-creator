const db = require('../src/models/database');
const { generateLicenseKey } = require('../src/utils/validation');

// Get command line arguments
const args = process.argv.slice(2);
const maxActivations = args[0] ? parseInt(args[0]) : 2;
const count = args[1] ? parseInt(args[1]) : 1;

console.log('\n' + '='.repeat(50));
console.log('License Key Generator');
console.log('='.repeat(50));
console.log(`Generating ${count} license(s) with ${maxActivations} max activation(s) each\n`);

let generated = 0;

function generateOne() {
  const key = generateLicenseKey();

  db.run(
    'INSERT INTO licenses (license_key, max_activations, status) VALUES (?, ?, ?)',
    [key, maxActivations, 'active'],
    function(err) {
      if (err) {
        console.error('❌ Error creating license:', err.message);
      } else {
        console.log(`✓ License ${generated + 1}/${count}: ${key}`);
        console.log(`  - Max activations: ${maxActivations}`);
        console.log(`  - Status: active`);
        console.log(`  - Database ID: ${this.lastID}\n`);
      }

      generated++;

      if (generated < count) {
        generateOne();
      } else {
        console.log('='.repeat(50));
        console.log(`✓ Successfully generated ${count} license key(s)`);
        console.log('='.repeat(50) + '\n');
        process.exit(0);
      }
    }
  );
}

// Wait for database to be ready
setTimeout(() => {
  generateOne();
}, 500);
