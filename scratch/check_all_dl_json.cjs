const fs = require('fs');
const path = require('path');

const dlDir = 'C:/Users/ALJABAR/Downloads';
const files = fs.readdirSync(dlDir).filter(f => f.endsWith('.json'));

files.forEach(f => {
  try {
    const filePath = path.join(dlDir, f);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`\n=== File: ${f} ===`);
    if (Array.isArray(content)) {
      console.log(`Array of ${content.length} items. Keys in first item:`, Object.keys(content[0] || {}));
    } else if (typeof content === 'object') {
      console.log('Object keys:', Object.keys(content));
      if (content.data?.teams) {
        let count = 0;
        content.data.teams.forEach(t => count += (t.members?.length || 0));
        console.log(`Contains ${content.data.teams.length} teams, total ${count} members`);
      }
    }
  } catch (e) {
    console.log(`Error reading ${f}: ${e.message}`);
  }
});
