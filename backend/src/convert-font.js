const fs = require('fs');

const font = fs.readFileSync(
  'NotoSansDevanagari-Regular.ttf'
);

const base64 = font.toString('base64');

fs.writeFileSync(
  'noto-devanagari-base64.txt',
  base64
);

console.log('Font converted to Base64');
