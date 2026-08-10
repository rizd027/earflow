const fs = require('fs');

const noKaryawanData = JSON.parse(fs.readFileSync('C:/Users/ALJABAR/Downloads/no karyawan.json', 'utf8'));
const backupData = JSON.parse(fs.readFileSync('C:/Users/ALJABAR/Downloads/download_1785494742021.json', 'utf8'));

// Extract members from backup
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

const customMatches = {
  // Manual overrides for known abbreviations or variations if any
};

const matches = [];
const usedBackupIds = new Set();

noKaryawanData.forEach(nk => {
  const nkName = nk['nama'];
  const nkNo = nk['no karyawan'];
  const nkClean = cleanName(nkName);
  const nkTokens = normalizeTokens(nkName);

  let bestMember = null;
  let bestScore = 0;
  let matchReason = '';

  backupMembers.forEach(bm => {
    const bmName = bm.full_name;
    const bmClean = cleanName(bmName);
    const bmTokens = normalizeTokens(bmName);

    // 1. Exact clean match
    if (nkClean === bmClean) {
      bestMember = bm;
      bestScore = 1.0;
      matchReason = 'Exact clean match';
      return;
    }

    // 2. Token prefix / substring match
    // Check if one name's tokens are a subset/prefix of the other
    let tokenMatchCount = 0;
    nkTokens.forEach(t1 => {
      if (bmTokens.some(t2 => t1 === t2 || (t1.length >= 3 && t2.length >= 3 && (t1.startsWith(t2) || t2.startsWith(t1))))) {
        tokenMatchCount++;
      }
    });

    const tokenRatio = (2 * tokenMatchCount) / (nkTokens.length + bmTokens.length);

    // Levenshtein similarity on cleaned string
    const maxLen = Math.max(nkClean.length, bmClean.length);
    const levDist = levenshtein(nkClean, bmClean);
    const levSim = maxLen > 0 ? 1 - levDist / maxLen : 1;

    const combinedScore = Math.max(tokenRatio, levSim);

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestMember = bm;
      matchReason = tokenRatio > levSim ? `Token match (${tokenMatchCount}/${nkTokens.length})` : `Levenshtein sim ${(levSim * 100).toFixed(0)}%`;
    }
  });

  matches.push({
    nkName,
    nkNo,
    bestMember,
    bestScore,
    matchReason
  });
});

console.log('=== MATCHING ANALYSIS REPORT ===');
matches.forEach((m, idx) => {
  const isHigh = m.bestScore >= 0.75;
  const isMed = m.bestScore >= 0.55 && m.bestScore < 0.75;
  const status = isHigh ? 'HIGH' : isMed ? 'MEDIUM' : 'LOW/UNMATCHED';
  console.log(`${(idx + 1).toString().padStart(2, ' ')}. [${status}] "${m.nkName}" (${m.nkNo}) => "${m.bestMember?.full_name || 'NONE'}" (Current NIK: ${m.bestMember?.no_karyawan || '-'}) [Score: ${m.bestScore.toFixed(2)} - ${m.matchReason}]`);
});
