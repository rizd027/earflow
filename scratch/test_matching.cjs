const fs = require('fs');
const path = require('path');

const noKaryawanData = JSON.parse(fs.readFileSync('C:/Users/ALJABAR/Downloads/no karyawan.json', 'utf8'));
const backupData = JSON.parse(fs.readFileSync('C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31.json', 'utf8'));

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

function normalize(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\\/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTokens(name) {
  return normalize(name).split(' ').filter(t => t.length > 0);
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

function similarity(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);
  if (normA === normB) return 1.0;

  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;

  const dist = levenshtein(normA, normB);
  const sim = 1 - dist / maxLen;

  // Check token containment
  const tokensA = getTokens(normA);
  const tokensB = getTokens(normB);

  // Count matching tokens (full or prefix)
  let tokenMatches = 0;
  for (const tA of tokensA) {
    for (const tB of tokensB) {
      if (tA === tB || (tA.length > 2 && tB.length > 2 && (tA.startsWith(tB) || tB.startsWith(tA)))) {
        tokenMatches++;
        break;
      }
    }
  }

  const tokenSim = (2 * tokenMatches) / (tokensA.length + tokensB.length);
  return Math.max(sim, tokenSim);
}

const results = [];
const matchedBackupIds = new Set();

noKaryawanData.forEach(nkItem => {
  const nkName = nkItem['nama'];
  const nkNo = nkItem['no karyawan'];

  let bestMatch = null;
  let bestScore = 0;

  backupMembers.forEach(bm => {
    const score = similarity(nkName, bm.full_name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = bm;
    }
  });

  results.push({
    nkName,
    nkNo,
    matchedMember: bestMatch,
    score: bestScore
  });

  if (bestMatch && bestScore >= 0.6) {
    matchedBackupIds.add(bestMatch.id);
  }
});

console.log('=== MATCH RESULTS SUMMARY ===');
console.log('Total in no karyawan.json:', noKaryawanData.length);
console.log('Total in backup:', backupMembers.length);

const exactMatches = results.filter(r => r.score >= 0.95);
const fuzzyMatches = results.filter(r => r.score >= 0.6 && r.score < 0.95);
const lowMatches = results.filter(r => r.score < 0.6);

console.log(`Exact/High Matches (>= 0.95): ${exactMatches.length}`);
console.log(`Fuzzy Matches (0.60 - 0.94): ${fuzzyMatches.length}`);
console.log(`Low Matches (< 0.60): ${lowMatches.length}`);

console.log('\n--- FUZZY MATCHES DETAIL ---');
fuzzyMatches.forEach(r => {
  console.log(`[Score: ${r.score.toFixed(2)}] JSON: "${r.nkName}" (${r.nkNo}) <==> Backup: "${r.matchedMember?.full_name}" (Current No: ${r.matchedMember?.no_karyawan})`);
});

console.log('\n--- LOW / UNMATCHED DETAIL ---');
lowMatches.forEach(r => {
  console.log(`[Score: ${r.score.toFixed(2)}] JSON: "${r.nkName}" (${r.nkNo}) <==> Best candidate: "${r.matchedMember?.full_name}"`);
});

const unmatchedBackupMembers = backupMembers.filter(m => !matchedBackupIds.has(m.id));
console.log('\n--- BACKUP MEMBERS NOT MATCHED TO ANY JSON ENTRY ---');
unmatchedBackupMembers.forEach(m => {
  console.log(`Backup: "${m.full_name}" (No: ${m.no_karyawan})`);
});
