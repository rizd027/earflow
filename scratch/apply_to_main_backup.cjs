const fs = require('fs');

const updatedFile = 'C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31_updated_no_karyawan.json';
const mainBackupFile = 'C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31.json';

if (fs.existsSync(updatedFile)) {
  fs.copyFileSync(updatedFile, mainBackupFile);
  console.log('Successfully updated C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31.json with new employee numbers!');
}
