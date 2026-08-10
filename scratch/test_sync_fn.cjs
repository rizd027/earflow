const fs = require('fs');

const noKaryawanPath = 'C:/Users/ALJABAR/Downloads/no karyawan.json';
const noKaryawanData = JSON.parse(fs.readFileSync(noKaryawanPath, 'utf8'));

const bPath = 'C:/Users/ALJABAR/Downloads/download_1785494742021.json';
const backupData = JSON.parse(fs.readFileSync(bPath, 'utf8'));

function cleanStr(s) {
  return (s || '').toLowerCase().replace(/\\/g, '').replace(/[^a-z0-9]/g, '');
}

function getTokens(s) {
  return (s || '').toLowerCase().replace(/\\/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

const nameAliasMap = {
  "sitirohmawati": ["sitirohmawati", "sitirohmawah"],
  "syaifiraila": ["syafifaila", "syaifiraila"],
  "hidayatussholikhah": ["hidayatursholikhah", "hidayatussholikhah"],
  "erikannurmanda": ["erikanurmanda", "erikannurmanda"],
  "malfariz": ["malfarizd", "malfariz"],
  "nazzarputraa": ["nazarputraa", "nazzarputraa"],
  "dewimasfufah": ["dewimaspufah", "dewimasfufah"],
  "herisetiawan": ["herisetyawan", "herisetiawan"],
  "afridatundina": ["lolaafridatudina", "loliafridahdina", "afridatundina"],
  "fenieka": ["feniekaa", "fenieka"],
  "faniadwi": ["faniadwiw", "faniadwi"],
  "umapurwati": ["umaparwati", "umapurwati"],
  "auliaapril": ["auliaaprilliana", "auliaaprilizina", "auliaapril"],
  "ardinavivi": ["ardinaviviamelia", "ardinavivi"],
  "oktavianur": ["oktavianurr", "oktavianur"],
  "aureliashinta": ["aureliashintap", "aureliashinta"],
  "mafdukakhoiriyah": ["mafdukhakhoiriyahs", "mafdukakhoiriyah"],
  "dindaamelia": ["dindaameliaputri", "dindaamelia"],
  "zuniaputri": ["zuniaputrip", "zuniaputri"],
  "wiwikernawati": ["wiwikermawati", "wiwikernawati"],
  "anachoirunnisa": ["anachoirohunnisa", "anachoirunnisa"],
  "aprilliaputri": ["aprilliaputricahyani", "aprilliaputri"],
  "arbechatrivany": ["arbechatrivanyma", "arbechatrivany"],
  "wulankhusnul": ["wulankhusnulk", "wulankhusnul"],
  "dianfitnani": ["dinafitnani", "dianfitnani"],
  "keren": ["kerentricsyadespita", "kerentriesyadespita", "keren"],
  "natasyadwi": ["natasyadwif", "natasyadwi"],
  "fatimaaprilia": ["fatimaaprillia", "fatimaaprilia"],
  "nurfani": ["nurfanio", "nurfani"],
  "elfaretadwi": ["elfaretadwiagustina", "elfaretadwi"],
  "lutfijuniar": ["lutfijuniarmafikhasani", "lutfijuniar"],
  "putriajarsari": ["putrianjarsarisulasmi", "putriajarsari"],
  "anandaputri": ["anandaputrieronika", "anandaputri"],
  "dwisintya": ["dwisintyaindah", "dwisintya"],
  "dianherlina": ["dianherlinaputri", "dianherlina"],
  "lindakurnia": ["lindakurniar", "lindakurnia"],
  "rindioktavia": ["rindioktaviani", "rindioktavia"],
  "alisyahadi": ["alisyahadiputri", "alisyahadi"],
  "arumdwi": ["arumdwicahyani", "arumdwi"],
  "oktaviatri": ["oktaviatriramadhani", "oktaviatri"],
  "rizkynindi": ["rizkynindibungah", "rizkynindi"],
  "zaskyayundhira": ["zaskiaayundhira", "zaskyayundhira"],
  "tiaraputri": ["tiara", "tiaraputri"]
};

function matchWorkerToNikRecord(workerName) {
  const clean = cleanStr(workerName);
  for (const item of noKaryawanData) {
    const nkNo = item['no karyawan'].trim();
    const nkName = item['nama'].trim().replace(/\\/g, '');
    const nkClean = cleanStr(nkName);

    if (clean === nkClean) return { no_karyawan: nkNo, matchedName: nkName };

    if (nameAliasMap[nkClean] && nameAliasMap[nkClean].includes(clean)) {
      return { no_karyawan: nkNo, matchedName: nkName };
    }

    const nkTokens = getTokens(nkName);
    const wTokens = getTokens(workerName);
    let mCount = 0;
    nkTokens.forEach(t1 => {
      if (wTokens.some(t2 => t1 === t2 || (t1.length >= 3 && t2.length >= 3 && (t1.startsWith(t2) || t2.startsWith(t1))))) {
        mCount++;
      }
    });
    if (mCount === nkTokens.length) {
      return { no_karyawan: nkNo, matchedName: nkName };
    }
  }
  return null;
}

// Test on current backup
let updatedCount = 0;
(backupData.data?.teams || []).forEach(team => {
  (team.members || []).forEach(m => {
    const match = matchWorkerToNikRecord(m.full_name);
    if (match) {
      m.no_karyawan = match.no_karyawan;
      updatedCount++;
    }
  });
});

console.log(`Sync test successful! ${updatedCount} members got updated NIKs.`);
