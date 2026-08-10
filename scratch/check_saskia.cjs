const fs = require('fs');

const f = 'C:/Users/ALJABAR/Downloads/download_1785494742021.json';
const data = JSON.parse(fs.readFileSync(f, 'utf8'));

let found = [];
(data.data?.teams || []).forEach(t => {
  (t.members || []).forEach(m => {
    if (m.full_name.toLowerCase().includes('saskia')) {
      found.push({ ...m, team: t.name });
    }
  });
});

console.log('Saskia in download_1785494742021.json:', found);
