const fs = require('fs');
const child_process = require('child_process');
const path = require('path');

const tmpZip = path.join(__dirname, 'temp_excel.zip');
const outDir = path.join(__dirname, 'excel_extracted');

fs.copyFileSync('d:/Website/earflow/docs/Laporan_Hari_Produksi_Juli_2026.xlsx', tmpZip);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

child_process.execSync(`powershell -Command "Expand-Archive -Force '${tmpZip}' '${outDir}'"`);

const stringsXml = fs.readFileSync(path.join(outDir, 'xl/sharedStrings.xml'), 'utf8');
const strings = [];
const stringMatches = stringsXml.match(/<t[^>]*>([^<]*)<\/t>/g);
if (stringMatches) {
  stringMatches.forEach(m => {
    const val = m.replace(/<[^>]+>/g, '');
    strings.push(val);
  });
}
console.log('--- SHARED STRINGS ---');
strings.forEach((str, i) => console.log(`[${i}] ${str}`));
