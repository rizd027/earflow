const fs = require('fs');
const path = require('path');

const dlPath = 'C:/Users/ALJABAR/Downloads';
try {
  const files = fs.readdirSync(dlPath);
  console.log('Files in Downloads matching json/earflow/backup/karyawan:', 
    files.filter(f => f.toLowerCase().includes('karyawan') || f.toLowerCase().includes('earflow') || f.toLowerCase().includes('backup') || f.endsWith('.json'))
  );
} catch (e) {
  console.error(e);
}
