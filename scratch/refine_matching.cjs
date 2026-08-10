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

function cleanString(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\\/g, '').replace(/[^a-z0-9]/g, '');
}

function getTokens(str) {
  if (!str) return [];
  return str.toLowerCase().replace(/\\/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function tokenScore(nkTokens, bmTokens) {
  if (nkTokens.length === 0 || bmTokens.length === 0) return 0;
  
  let matches = 0;
  for (const t1 of nkTokens) {
    let matched = false;
    for (const t2 of bmTokens) {
      if (t1 === t2) {
        matched = true;
        break;
      }
      // Check prefix matching for abbreviations or minor typos
      if (t1.length >= 3 && t2.length >= 3) {
        if (t1.startsWith(t2) || t2.startsWith(t1)) {
          matched = true;
          break;
        }
      }
    }
    if (matched) matches++;
  }

  // Weight heavily if all nkTokens match inside bmTokens!
  if (matches === nkTokens.length) {
    return 0.9 + (0.1 * (matches / bmTokens.length));
  }

  return (2 * matches) / (nkTokens.length + bmTokens.length);
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

const evaluatedMatches = [];
const assignedBackupIds = new Set();

noKaryawanData.forEach(nk => {
  const nkName = nk['nama'].trim();
  const nkNo = nk['no karyawan'].trim();

  const nkClean = cleanString(nkName);
  const nkTokens = getTokens(nkName);

  let bestMember = null;
  let bestScore = -1;

  backupMembers.forEach(bm => {
    const bmClean = cleanString(bm.full_name);
    const bmTokens = getTokens(bm.full_name);

    if (nkClean === bmClean) {
      bestScore = 1.0;
      bestMember = bm;
      return;
    }

    const tScore = tokenScore(nkTokens, bmTokens);
    const maxLen = Math.max(nkClean.length, bmClean.length);
    const levSim = maxLen > 0 ? 1 - levenshtein(nkClean, bmClean) / maxLen : 1;

    // Prioritize tokenScore if all tokens matched
    let finalScore = Math.max(tScore, levSim);
    if (tScore >= 0.9) finalScore = tScore;

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMember = bm;
    }
  });

  // Filter out dubious matches where only a single generic last-name token matched (e.g. "Wulandari", "Lestari", "Putri" alone)
  // unless the overall similarity is very high
  let isMatchValid = false;
  if (bestScore >= 0.8) {
    isMatchValid = true;
  } else if (bestScore >= 0.6) {
    // Check if matched tokens are meaningful
    const bmTokens = getTokens(bestMember?.full_name || '');
    const commonTokens = nkTokens.filter(t => bmTokens.includes(t));
    const genericTokens = ['putri', 'wulandari', 'lestari', 'dwi', 'nur', 'ayu', 'sari'];
    const nonGenericCommon = commonTokens.filter(t => !genericTokens.includes(t));

    if (nonGenericCommon.length > 0 || commonTokens.length >= 2) {
      isMatchValid = true;
    }
  }

  evaluatedMatches.push({
    nkNo,
    nkName,
    matchedMember: isMatchValid ? bestMember : null,
    score: isMatchValid ? bestScore : 0,
    rawCandidate: bestMember?.full_name
  });
});

console.log('=== REFINED MATCH RESULTS ===');
let matchedCount = 0;
evaluatedMatches.forEach((m, i) => {
  if (m.matchedMember) {
    matchedCount++;
    console.log(`${(i+1).toString().padStart(2,' ')}. [VALID] ${m.nkNo} - "${m.nkName}" ==> "${m.matchedMember.full_name}" (Old NIK: ${m.matchedMember.no_karyawan}) [Score: ${m.score.toFixed(2)}]`);
  } else {
    console.log(`${(i+1).toString().padStart(2,' ')}. [NEW/UNMATCHED] ${m.nkNo} - "${m.nkName}" (Best raw candidate was "${m.rawCandidate}")`);
  }
});

console.log(`\nMatched: ${matchedCount} / ${noKaryawanData.length}`);
console.log(`New/Unmatched: ${noKaryawanData.length - matchedCount}`);
