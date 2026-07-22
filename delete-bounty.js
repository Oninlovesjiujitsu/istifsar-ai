const fs = require('fs');
fs.rmSync('src/app/(archive)/bounty', { recursive: true, force: true });
fs.rmSync('src/app/(workspace)/bounties', { recursive: true, force: true });
console.log('Deleted successfully.');
