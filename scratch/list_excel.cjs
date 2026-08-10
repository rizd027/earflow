const fs = require('fs');
const path = require('path');

function listDir(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      listDir(full, prefix + f + '/');
    } else {
      console.log(prefix + f);
    }
  }
}

listDir('d:/Website/earflow/scratch/excel_extracted');
