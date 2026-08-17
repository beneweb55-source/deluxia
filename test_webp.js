const fs = require('fs');

const buf = Buffer.alloc(16);
buf.write('RIFF', 0);
buf.writeUInt32LE(0, 4);
buf.write('WEBP', 8);
buf.write('VP8 ', 12);

console.log('0-4:', buf.toString('ascii', 0, 4));
console.log('8-12:', buf.toString('ascii', 8, 12));
console.log('12-16:', buf.toString('ascii', 12, 16));
