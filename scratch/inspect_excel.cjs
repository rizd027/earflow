const fs = require('fs');
const path = require('path');

function getStringsFromDir(dirPath) {
  const strings = new Set();
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.xml')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(/<t[^>]*>([^<]+)<\/t>/g) || [];
        matches.forEach(m => {
          const txt = m.replace(/<[^>]+>/g, '').trim();
          if (txt && !/^\d+$/.test(txt)) {
            strings.add(txt);
          }
        });
      }
    }
  }
  walk(dirPath);
  return Array.from(strings);
}

const out1 = path.join(__dirname, 'out_Laporan_Hari_Produksi_Juli_2026.xlsx');
const out2 = path.join(__dirname, 'out_Tabel_Statistik_Produksi.xlsx');

console.log('=== Laporan Hari Produksi Juli 2026 Strings ===');
console.log(getStringsFromDir(out1));

console.log('=== Tabel Statistik Produksi Strings ===');
console.log(getStringsFromDir(out2));
