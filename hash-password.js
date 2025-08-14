// hash-password.js
const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.error('Please provide a password to hash. Usage: node hash-password.js <your_password>');
  process.exit(1);
}

const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('--- Hashed Password ---');
  console.log(hash);
  console.log('-----------------------');
  console.log('\nCopy this hash and update the password_hash column for your user in the Supabase `users` table.');
});
