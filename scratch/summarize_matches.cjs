const fs = require('fs');

const noKaryawanPath = 'C:/Users/ALJABAR/Downloads/no karyawan.json';
const noKaryawanData = JSON.parse(fs.readFileSync(noKaryawanPath, 'utf8'));

const results = JSON.parse(fs.readFileSync('d:/Website/earflow/scratch/final_matched_results.json', 'utf8'));

const tableData = results.map((r, i) => {
  let note = 'Nama Persis';
  if (r.status === 'NEW') {
    note = 'Karyawan Baru (Ditambahkan)';
  } else if (r.nkName.toLowerCase().replace(/\s+/g, '') !== r.backupName.toLowerCase().replace(/\s+/g, '')) {
    note = `Variasi/Singkatan ("${r.backupName}")`;
  }
  return {
    no: r.nkNo,
    namaJson: r.nkName,
    namaSystem: r.backupName || r.nkName,
    status: note
  };
});

fs.writeFileSync('d:/Website/earflow/scratch/summary_table.json', JSON.stringify(tableData, null, 2));
console.log(`Generated summary table for ${tableData.length} records.`);
