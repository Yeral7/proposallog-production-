// check-env.js
require('dotenv').config({ path: './.env.local' });

console.log('\n--- Checking Environment Variables ---');
console.log('JWT_SECRET from script:', process.env.JWT_SECRET);
console.log('------------------------------------\n');
