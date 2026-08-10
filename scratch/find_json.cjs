const fs = require('fs');
const path = require('path');

function findFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('out_')) {
        results = results.concat(findFiles(fullPath, ext));
      }
    } else {
      if (fullPath.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('JSON files in repo:', findFiles('d:/Website/earflow', '.json'));
