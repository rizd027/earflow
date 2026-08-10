const fs = require('fs');

const updatedPath = 'C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31_updated_no_karyawan.json';
const data = JSON.parse(fs.readFileSync(updatedPath, 'utf8'));

let wPrefixCount = 0;
let numericNikCount = 0;
const wList = [];

(data.data?.teams || []).forEach(team => {
  (team.members || []).forEach(member => {
    if (/^\d{5}$/.test(member.no_karyawan)) {
      numericNikCount++;
    } else {
      wPrefixCount++;
      wList.push({ name: member.full_name, id: member.id, nik: member.no_karyawan });
    }
  });
});

console.log('=== VERIFICATION SUMMARY ===');
console.log('Numeric 5-digit NIKs:', numericNikCount);
console.log('Legacy W- NIKs remaining:', wPrefixCount);

if (wList.length > 0) {
  console.log('\nWorkers still having W- NIKs:');
  wList.forEach(w => console.log(`- "${w.name}" (ID: ${w.id}, NIK: ${w.nik})`));
}
