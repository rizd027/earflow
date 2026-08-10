const fs = require('fs');

const bPath = 'C:/Users/ALJABAR/Downloads/download_1785494742021.json';
const backupData = JSON.parse(fs.readFileSync(bPath, 'utf8'));

let z1 = null, s1 = null;
(backupData.data?.teams || []).forEach(t => {
  (t.members || []).forEach(m => {
    if (m.full_name.toLowerCase().includes('zaskia')) z1 = m;
    if (m.full_name.toLowerCase() === 'saskia') s1 = m;
  });
});

console.log('Zaskia in backup:', z1);
console.log('Saskia in backup:', s1);
