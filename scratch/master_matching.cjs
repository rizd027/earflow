const fs = require('fs');
const path = require('path');

const noKaryawanPath = 'C:/Users/ALJABAR/Downloads/no karyawan.json';
const noKaryawanData = JSON.parse(fs.readFileSync(noKaryawanPath, 'utf8'));

const b1Path = 'C:/Users/ALJABAR/Downloads/download_1785494742021.json';
const b2Path = 'C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31.json';

const b1Data = JSON.parse(fs.readFileSync(b1Path, 'utf8'));
const b2Data = JSON.parse(fs.readFileSync(b2Path, 'utf8'));

// Build Master Map of existing workers keyed by ID or normalized name
const allWorkersMap = new Map();

function addMembersFromBackup(backupObj) {
  (backupObj.data?.teams || []).forEach(team => {
    (team.members || []).forEach(m => {
      if (!allWorkersMap.has(m.id)) {
        allWorkersMap.set(m.id, { ...m, team_id: team.id });
      }
    });
  });
}

addMembersFromBackup(b1Data);
addMembersFromBackup(b2Data);

const backupWorkers = Array.from(allWorkersMap.values());
console.log(`Total unique workers across latest backups: ${backupWorkers.length}`);

function cleanStr(s) {
  return (s || '').toLowerCase().replace(/\\/g, '').replace(/[^a-z0-9]/g, '');
}

function getTokens(s) {
  return (s || '').toLowerCase().replace(/\\/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
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

// Special overrides map for cases where spelling/abbreviation differs
const specialOverrides = {
  '80101': 'W-948647', // Erikan Nur Manda -> Erika Nur Manda
  '80102': 'W-954556', // M. Alfariz -> M. Al Fariz
  '80103': 'W-959878', // Nazzar Putra A -> Nazar Putra A.
  '80104': 'W-015894', // Dewi Masfufah -> Dewi Maspufah / Dewi Masfufah
  '80106': 'W-025708', // Heri Setiawan -> Heri Setyawan
  '80108': 'W-047279', // Afridatun Dina -> Lola Afridatu Dina / Loli Afridah Dina
  '80125': 'W-458035', // Feni Eka -> Feni Eka A
  '80130': 'W-341074', // Fania Dwi -> Fania Dwi W
  '80136': 'W-613645', // Uma Purwati -> Uma Parwati
  '80137': 'W-494484', // Aulia April -> Aulia april liana
  '80138': 'W-593411', // Ardina Vivi -> Ardina vivi Amelia
  '80139': 'W-627527', // Oktavia Nur -> Oktavia Nur R
  '80141': 'W-655433', // Aurelia Shinta -> Aurelia Shinta P
  '80142': 'W-264509', // MAfduka Khoiriyah -> Mafdukha Khoiriyah S
  '80144': 'W-754131', // Dinda Amelia \ -> Dinda Amelia Putri
  '80146': 'W-127471', // Zunia Putri -> Zunia Putri P.
  '80148': 'W-187336', // Wiwik Ernawati -> Wiwik Ermawati
  '80149': 'W-207704', // Ana Choirun Nisa -> Ana Choirohun Nisa
  '80150': 'W-669466', // Aprillia Putri -> Aprillia Putri Cahyani
  '80154': 'W-523871', // Arbecha Trivany -> Arbecha Trivany M.A
  '80159': 'W-046462', // Wulan Khusnul -> Wulan Khusnul K
  '80160': 'W-875083', // Dian Fitnani -> Dina Fitnani
  '80161': 'W-782729', // Keren -> Keren Triesya Despita
  '80162': 'W-458370', // Natasya Dwi -> Natasya Dwi F
  '80163': 'W-987587', // Fatima Aprilia -> Fatima Aprillia
  '80164': 'W-067216', // Nur Fani -> Nur Fani O.
  '80165': 'W-157768', // Saskia -> Saskia
  '80172': 'W-489291', // Elfareta Dwi -> Elfareta Dwi Agustina
  '80173': 'W-150635', // Lutfi Juniar -> Lutfi Juniar Mafikhasani
  '80176': 'W-248744', // Putri Ajar Sari -> Putri Anjar Sari Sulasmi
  '80178': 'W-183557', // Ananda Putri -> Ananda Putri Eronika
  '80179': 'W-573188', // Dwi Sintya -> Dwi Sintya Indah
  '80180': 'W-961017', // Dian Herlina -> Dian Herlina Putri
  '80182': 'W-987445', // Linda Kurnia -> Linda Kurnia R
  '80183': 'W-039254', // Rindi Oktavia -> Rindi Oktaviani
  '80185': 'W-478024', // Alisya Hadi -> Alisya Hadi Putri
  '80186': 'W-518846', // Arum Dwi -> Arum Dwi Cahyani
  '80187': 'W-540105', // Oktavia Tri -> Oktavia Tri Ramadhani
  '80189': 'W-295456', // Rizky Nindi -> Rizky Nindi Bunga H
  '80191': 'W-157768', // wait, Zaskya Ayundhira -> Zaskia Ayundhira (W-157768 or W-...)
  '80192': 'W-946787'  // Tiara Putri -> Tiara
};

const finalMatches = [];

noKaryawanData.forEach(item => {
  const nkNo = item['no karyawan'].trim();
  const nkName = item['nama'].trim();

  let matchedWorker = null;
  let matchType = '';

  // 1. Check special override by NIK key
  if (specialOverrides[nkNo]) {
    const targetId = specialOverrides[nkNo];
    matchedWorker = backupWorkers.find(w => w.id === targetId || w.no_karyawan === targetId);
    if (matchedWorker) matchType = 'OVERRIDE_MATCH';
  }

  // 2. Exact clean match
  if (!matchedWorker) {
    matchedWorker = backupWorkers.find(w => cleanStr(w.full_name) === cleanStr(nkName));
    if (matchedWorker) matchType = 'EXACT_MATCH';
  }

  // 3. High token / fuzzy match
  if (!matchedWorker) {
    const nkTokens = getTokens(nkName);
    let bestScore = 0;
    backupWorkers.forEach(w => {
      const wTokens = getTokens(w.full_name);
      let tCount = 0;
      nkTokens.forEach(t1 => {
        if (wTokens.some(t2 => t1 === t2 || (t1.length >= 3 && t2.length >= 3 && (t1.startsWith(t2) || t2.startsWith(t1))))) {
          tCount++;
        }
      });

      if (tCount === nkTokens.length) {
        const score = 0.9 + (0.1 * (tCount / wTokens.length));
        if (score > bestScore) {
          bestScore = score;
          matchedWorker = w;
        }
      }
    });
    if (matchedWorker) matchType = 'TOKEN_MATCH';
  }

  finalMatches.push({
    nkNo,
    nkName,
    matchedWorker,
    matchType: matchedWorker ? matchType : 'NEW_WORKER'
  });
});

console.log('=== FINAL MATCH SUMMARY ===');
let matchedCnt = 0;
let newCnt = 0;

finalMatches.forEach((m, idx) => {
  if (m.matchedWorker) {
    matchedCnt++;
    console.log(`${(idx + 1).toString().padStart(2, ' ')}. [${m.matchType}] No: ${m.nkNo} | Nama JSON: "${m.nkName}" ==> Nama Backup: "${m.matchedWorker.full_name}" (NIK Lama: ${m.matchedWorker.no_karyawan})`);
  } else {
    newCnt++;
    console.log(`${(idx + 1).toString().padStart(2, ' ')}. [NEW WORKER] No: ${m.nkNo} | Nama JSON: "${m.nkName}" (Worker baru, akan dibuatkan data)`);
  }
});

console.log(`\nMatched: ${matchedCnt} / ${noKaryawanData.length}`);
console.log(`New Workers: ${newCnt}`);
