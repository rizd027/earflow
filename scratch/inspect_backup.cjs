const fs = require('fs');

const backupPath = 'C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31.json';
if (fs.existsSync(backupPath)) {
  const content = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log('App:', content.app);
  console.log('Timestamp:', content.timestamp);
  console.log('Teams count:', content.data?.teams?.length);
  if (content.data?.teams) {
    let totalMembers = 0;
    content.data.teams.forEach(t => {
      console.log(`Team "${t.name}" (${t.id}): ${t.members?.length || 0} members`);
      totalMembers += t.members?.length || 0;
    });
    console.log('Total members across teams:', totalMembers);
  }
} else {
  console.log('Backup file not found');
}
