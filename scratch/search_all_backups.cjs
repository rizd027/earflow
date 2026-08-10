const fs = require('fs');
const path = require('path');

const dlDir = 'C:/Users/ALJABAR/Downloads';
const files = fs.readdirSync(dlDir).filter(f => f.endsWith('.json') && f !== 'no karyawan.json');

const unmatchedNames = [
  "Novi Wulandari", "Rahel", "Heni Ning Azizah", "Zahrotul Irnanda",
  "Wahyu Tirta Ningtyas", "Cantika", "Inayah Firdaus", "Ernawati",
  "Intan Lestari", "Dewi Putri Anjani", "Alfin Nabila Maulidiyah",
  "Ziya", "Kamilatus Zahra", "Lissel Nazua Lauren", "Saskia", "Tiara Putri"
];

console.log('Searching unmatched names across all backup JSON files...');

files.forEach(file => {
  const content = JSON.parse(fs.readFileSync(path.join(dlDir, file), 'utf8'));
  let members = [];
  if (Array.isArray(content)) {
    members = content;
  } else if (content.data?.teams) {
    content.data.teams.forEach(t => (t.members || []).forEach(m => members.push(m)));
  }

  unmatchedNames.forEach(un => {
    const found = members.filter(m => {
      const fn = m.full_name || m.nama || '';
      return fn.toLowerCase().includes(un.toLowerCase().split(' ')[0]);
    });
    if (found.length > 0) {
      console.log(`[File: ${file}] Name query "${un}" matched:`, found.map(m => m.full_name || m.nama));
    }
  });
});
