const fs = require('fs');
const path = require('path');

const noKaryawanPath = 'C:/Users/ALJABAR/Downloads/no karyawan.json';
const noKaryawanData = JSON.parse(fs.readFileSync(noKaryawanPath, 'utf8'));

console.log(`Loaded ${noKaryawanData.length} records from no karyawan.json`);

// Check backups in Downloads
const dlDir = 'C:/Users/ALJABAR/Downloads';
const backupFiles = fs.readdirSync(dlDir).filter(f => f.startsWith('earflow_backup_') && f.endsWith('.json'));

backupFiles.forEach(bf => {
  console.log('\n--- Analyzing Backup:', bf, '---');
  const backup = JSON.parse(fs.readFileSync(path.join(dlDir, bf), 'utf8'));
  const teams = backup.data?.teams || [];
  let allMembers = [];
  teams.forEach(t => {
    (t.members || []).forEach(m => {
      allMembers.push({ ...m, team_id: t.id, team_name: t.name });
    });
  });
  console.log(`Total members in ${bf}:`, allMembers.length);

  // Print sample members
  console.log('Sample members:', allMembers.slice(0, 5).map(m => ({ id: m.id, full_name: m.full_name, no_karyawan: m.no_karyawan })));
});
