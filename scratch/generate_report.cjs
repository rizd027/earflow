const fs = require('fs');

const noKaryawanData = JSON.parse(fs.readFileSync('C:/Users/ALJABAR/Downloads/no karyawan.json', 'utf8'));
const backupData = JSON.parse(fs.readFileSync('C:/Users/ALJABAR/Downloads/download_1785494742021.json', 'utf8'));

const backupMembers = [];
(backupData.data?.teams || []).forEach(team => {
  (team.members || []).forEach(member => {
    backupMembers.push({
      ...member,
      team_id: team.id,
      team_name: team.name
    });
  });
});

function cleanName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\\/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeTokens(str) {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/\\/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

// Special dictionary mappings for names where spelling or abbreviations are unique
const specialMap = {
  'Siti Zulfahil': 'Siti Zulfatul',
  'Syaifira Ila': 'Syafifa Ila',
  'Hidayatus Sholikhah': 'Hidayatur Sholikhah',
  'Erikan Nur Manda': 'Erika Nur Manda',
  'M. Alfariz': 'M. Al Fariz',
  'Nazzar Putra A': 'Nazar Putra A.',
  'Dewi Masfufah': 'Dewi Maspufah',
  'Heri Setiawan': 'Heri Setyawan',
  'Afridatun Dina': 'Lola Afridatu Dina', // or Loli Afridah Dina
  'Intan Lestari': 'Anggun Lestari', // wait, check if Intan Lestari is different or Anggun Lestari
  'Vanida Herawati': 'Vanida Herawati', // vs Yanida Herawati
  'Faiq Ardha Sava': 'Faiq Ardha Sava', // vs Fajri Ardha Sava
  'Nandita Aurelia': 'Nandita Aurelia', // vs Nandira Auralia
  'Sylvana Damayanti': 'Sylvana Damayanti', // vs Silvana Damayanti
  'Uma Purwati': 'Uma Parwati',
  'Rini Ristanti': 'Rini Ristanti', // vs Rini Rifianti
  'Wiwik Ernawati': 'Wiwik Ermawati',
  'Ana Choirun Nisa': 'Ana Choirohun Nisa',
  'Fatima Aprilia': 'Fatima Aprillia',
  'Keren': 'Keren Triesya Despita',
  'Anesa Putri': 'Anesa Putri', // vs Anisa Putri
  'Putri Ajar Sari': 'Putri Anjar Sari Sulasmi',
  'Rindi Oktavia': 'Rindi Oktaviani',
  'Zaskya Ayundhira': 'Zaskia Ayundhira',
  'Tiara Putri': 'Tiara'
};

const report = [];

noKaryawanData.forEach((nk, idx) => {
  const nkName = nk['nama'].trim();
  const nkNo = nk['no karyawan'].trim();

  let matchedBm = null;

  // Direct special match override if present
  const mappedName = specialMap[nkName];
  if (mappedName) {
    matchedBm = backupMembers.find(bm => bm.full_name.toLowerCase().trim() === mappedName.toLowerCase().trim());
  }

  if (!matchedBm) {
    // Exact match
    matchedBm = backupMembers.find(bm => cleanName(bm.full_name) === cleanName(nkName));
  }

  if (!matchedBm) {
    // Fuzzy matching
    let bestScore = 0;
    const nkTokens = normalizeTokens(nkName);

    backupMembers.forEach(bm => {
      const bmTokens = normalizeTokens(bm.full_name);
      let tokenMatches = 0;
      nkTokens.forEach(t1 => {
        if (bmTokens.some(t2 => t1 === t2 || (t1.length >= 3 && t2.length >= 3 && (t1.startsWith(t2) || t2.startsWith(t1))))) {
          tokenMatches++;
        }
      });

      const tokenScore = tokenMatches / Math.max(nkTokens.length, bmTokens.length);
      const levSim = 1 - levenshtein(cleanName(nkName), cleanName(bm.full_name)) / Math.max(cleanName(nkName).length, cleanName(bm.full_name).length);

      const score = Math.max(tokenScore, levSim);
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        matchedBm = bm;
      }
    });
  }

  report.push({
    index: idx + 1,
    nkNo,
    nkName,
    matchedNameInBackup: matchedBm ? matchedBm.full_name : null,
    currentNikInBackup: matchedBm ? matchedBm.no_karyawan : null,
    backupMemberId: matchedBm ? matchedBm.id : null,
    status: matchedBm ? (cleanName(nkName) === cleanName(matchedBm.full_name) ? 'EXACT' : 'FUZZY_MATCH') : 'UNMATCHED'
  });
});

fs.writeFileSync('d:/Website/earflow/scratch/match_report.json', JSON.stringify(report, null, 2));

console.log('Total entries:', report.length);
console.log('EXACT matches:', report.filter(r => r.status === 'EXACT').length);
console.log('FUZZY matches:', report.filter(r => r.status === 'FUZZY_MATCH').length);
console.log('UNMATCHED:', report.filter(r => r.status === 'UNMATCHED').length);

console.log('\n--- UNMATCHED LIST ---');
console.log(report.filter(r => r.status === 'UNMATCHED'));

console.log('\n--- FUZZY MATCHES LIST ---');
report.filter(r => r.status === 'FUZZY_MATCH').forEach(r => {
  console.log(`[${r.nkNo}] "${r.nkName}" ==> "${r.matchedNameInBackup}" (Old NIK: ${r.currentNikInBackup})`);
});
