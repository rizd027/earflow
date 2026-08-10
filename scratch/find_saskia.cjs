const fs = require('fs');
const path = require('path');

const dlDir = 'C:/Users/ALJABAR/Downloads';
const files = fs.readdirSync(dlDir).filter(f => f.endsWith('.json') && f !== 'no karyawan.json');

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(dlDir, file), 'utf8'));
  let members = [];
  if (Array.isArray(data)) members = data;
  else if (data.data?.teams) data.data.teams.forEach(t => (t.members || []).forEach(m => members.push(m)));

  const s = members.find(m => (m.full_name || m.nama || '').toLowerCase().includes('saskia'));
  if (s) {
    console.log(`[File ${file}] Saskia:`, s);
  }
});
