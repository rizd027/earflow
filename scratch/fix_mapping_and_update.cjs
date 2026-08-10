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

// Special dictionary for names where spelling or abbreviation differs between JSON & Backup
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

// All backup members
const backupMembers = [];
(backupData.data?.teams || []).forEach(team => {
  (team.members || []).forEach(member => {
    backupMembers.push({ member, team });
  });
});

const usedMemberIds = new Set();
const matchResults = [];

noKaryawanData.forEach(item => {
  const nkNo = item['no karyawan'].trim();
  const nkName = item['nama'].trim().replace(/\\/g, '');
  const nkClean = cleanStr(nkName);

  let matchedObj = null;

  // 1. Direct clean match
  matchedObj = backupMembers.find(bm => !usedMemberIds.has(bm.member.id) && cleanStr(bm.member.full_name) === nkClean);

  // 2. Alias match
  if (!matchedObj && nameAliasMap[nkClean]) {
    const aliases = nameAliasMap[nkClean];
    matchedObj = backupMembers.find(bm => !usedMemberIds.has(bm.member.id) && aliases.includes(cleanStr(bm.member.full_name)));
  }

  // 3. Token match
  if (!matchedObj) {
    const nkTokens = getTokens(nkName);
    matchedObj = backupMembers.find(bm => {
      if (usedMemberIds.has(bm.member.id)) return false;
      const bmTokens = getTokens(bm.member.full_name);
      let matchCount = 0;
      nkTokens.forEach(t1 => {
        if (bmTokens.some(t2 => t1 === t2 || (t1.length >= 3 && t2.length >= 3 && (t1.startsWith(t2) || t2.startsWith(t1))))) {
          matchCount++;
        }
      });
      return matchCount === nkTokens.length;
    });
  }

  if (matchedObj) {
    usedMemberIds.add(matchedObj.member.id);
    matchedObj.member.no_karyawan = nkNo;
    matchResults.push({ nkNo, nkName, status: 'UPDATED', backupName: matchedObj.member.full_name, oldId: matchedObj.member.id });
  } else {
    matchResults.push({ nkNo, nkName, status: 'NEW' });
  }
});

// Add new workers to unassigned team
let unassignedTeam = backupData.data.teams.find(t => t.id === 'unassigned') || backupData.data.teams[0];

matchResults.filter(r => r.status === 'NEW').forEach(r => {
  const newMemberObj = {
    id: `W-${r.nkNo}`,
    full_name: r.nkName,
    role: 'Operator Solder',
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.nkName)}`,
    no_karyawan: r.nkNo,
    joined_date: '2026-07-31',
    phone_number: '-',
    shift: 'Shift Pagi',
    status: 'Baru'
  };
  unassignedTeam.members.push(newMemberObj);
});

// Update timestamp
backupData.timestamp = new Date().toISOString();

const updatedFile = 'C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31_updated_no_karyawan.json';
fs.writeFileSync(updatedFile, JSON.stringify(backupData, null, 2));

console.log('=== MATCH & UPDATE SUMMARY ===');
console.log('Total JSON entries:', noKaryawanData.length);
console.log('Successfully UPDATED existing workers:', matchResults.filter(r => r.status === 'UPDATED').length);
console.log('Newly CREATED workers:', matchResults.filter(r => r.status === 'NEW').length);
console.log('Saved final updated backup to:', updatedFile);

fs.writeFileSync('d:/Website/earflow/scratch/final_matched_results.json', JSON.stringify(matchResults, null, 2));
