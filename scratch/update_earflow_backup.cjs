const fs = require('fs');
const path = require('path');

const noKaryawanPath = 'C:/Users/ALJABAR/Downloads/no karyawan.json';
const noKaryawanData = JSON.parse(fs.readFileSync(noKaryawanPath, 'utf8'));

const bPath = 'C:/Users/ALJABAR/Downloads/download_1785494742021.json';
const backupData = JSON.parse(fs.readFileSync(bPath, 'utf8'));

// Full Mapping Table (JSON NIK -> Target Old Worker ID / Backup NIK)
const mapping = {
  "80098": { nkName: "Siti Rohmawati", matchId: "W-850461" },
  "80099": { nkName: "Syaifira Ila", matchId: "W-941829" },
  "80100": { nkName: "Hidayatus Sholikhah", matchId: "W-944738" },
  "80101": { nkName: "Erikan Nur Manda", matchId: "W-948647" },
  "80102": { nkName: "M. Alfariz", matchId: "W-954556" },
  "80103": { nkName: "Nazzar Putra A", matchId: "W-959878" },
  "80104": { nkName: "Dewi Masfufah", matchId: "W-015894" },
  "80105": { nkName: "Erika Cahya", matchId: "W-009880" },
  "80106": { nkName: "Heri Setiawan", matchId: "W-025708" },
  "80107": { nkName: "Aisyatul Khasanah", matchId: "W-037491" },
  "80108": { nkName: "Afridatun Dina", matchId: "W-047279" },
  "80109": { nkName: "Novi Wulandari", isNew: true },
  "80110": { nkName: "Rahel", isNew: true },
  "80111": { nkName: "Heni Ning Azizah", isNew: true },
  "80112": { nkName: "Zahrotul Irnanda", isNew: true },
  "80113": { nkName: "Wahyu Tirta Ningtyas", isNew: true },
  "80114": { nkName: "Cantika", isNew: true },
  "80115": { nkName: "Inayah Firdaus", isNew: true },
  "80116": { nkName: "Ernawati", isNew: true },
  "80117": { nkName: "Intan Lestari", isNew: true },
  "80118": { nkName: "Dewi Putri Anjani", isNew: true },
  "80119": { nkName: "Alfin Nabila Maulidiyah", isNew: true },
  "80120": { nkName: "Ziya", isNew: true },
  "80121": { nkName: "Kamilatus Zahra", isNew: true },
  "80122": { nkName: "Lissel Nazua Lauren", isNew: true },
  "80123": { nkName: "Yanti Oktavia", matchId: "W-420358" },
  "80124": { nkName: "Desi Handayani", matchId: "W-932523" },
  "80125": { nkName: "Feni Eka", matchId: "W-458035" },
  "80126": { nkName: "Sabita Alya", matchId: "W-364522" },
  "80127": { nkName: "Nur Aini", matchId: "W-332522" },
  "80128": { nkName: "Vanida Herawati", matchId: "W-154829" },
  "80129": { nkName: "Faiq Ardha Sava", matchId: "W-141028" },
  "80130": { nkName: "Fania Dwi", matchId: "W-341074" },
  "80131": { nkName: "Lintang M", matchId: "W-470806" },
  "80132": { nkName: "Nandita Aurelia", matchId: "W-217984" },
  "80133": { nkName: "Purwati", matchId: "W-101120" },
  "80134": { nkName: "Sylvana Damayanti", matchId: "W-090091" },
  "80135": { nkName: "Sarah Wulandari", matchId: "W-090120" },
  "80136": { nkName: "Uma Purwati", matchId: "W-613645" },
  "80137": { nkName: "Aulia April", matchId: "W-494484" },
  "80138": { nkName: "Ardina Vivi", matchId: "W-593411" },
  "80139": { nkName: "Oktavia Nur", matchId: "W-627527" },
  "80140": { nkName: "Putrinika", matchId: "W-638843" },
  "80141": { nkName: "Aurelia Shinta", matchId: "W-655433" },
  "80142": { nkName: "MAfduka Khoiriyah", matchId: "W-264509" },
  "80143": { nkName: "Henny Wulandari", matchId: "W-175626" },
  "80144": { nkName: "Dinda Amelia \\", matchId: "W-754131" },
  "80145": { nkName: "Rini Ristanti", matchId: "W-117040" },
  "80146": { nkName: "Zunia Putri", matchId: "W-127471" },
  "80147": { nkName: "Siti Aisah", matchId: "W-137948" },
  "80148": { nkName: "Wiwik Ernawati", matchId: "W-187336" },
  "80149": { nkName: "Ana Choirun Nisa", matchId: "W-207704" },
  "80150": { nkName: "Aprillia Putri", matchId: "W-669466" },
  "80151": { nkName: "Esti Armilatus", matchId: "W-315236" },
  "80152": { nkName: "Athala Rania", matchId: "W-130867" },
  "80153": { nkName: "Anisa Bil Hikmah", matchId: "W-351697" },
  "80154": { nkName: "Arbecha Trivany", matchId: "W-523871" },
  "80155": { nkName: "Fitri Permatasari", matchId: "W-651190" },
  "80156": { nkName: "Kovivah", matchId: "W-455582" },
  "80157": { nkName: "Nadin Candra Winata", matchId: "W-536199" },
  "80158": { nkName: "Nur Hidayah", matchId: "W-584636" },
  "80159": { nkName: "Wulan Khusnul", matchId: "W-046462" },
  "80160": { nkName: "Dian Fitnani", matchId: "W-875083" },
  "80161": { nkName: "Keren", matchId: "W-782729" },
  "80162": { nkName: "Natasya Dwi", matchId: "W-458370" },
  "80163": { nkName: "Fatima Aprilia", matchId: "W-987587" },
  "80164": { nkName: "Nur Fani", matchId: "W-067216" },
  "80165": { nkName: "Saskia", matchId: "W-157768" },
  "80166": { nkName: "Anesa Putri", matchId: "W-196607" },
  "80167": { nkName: "Nabila Dwi", matchId: "W-228523" },
  "80168": { nkName: "Nurul Afidatun", matchId: "W-489700" },
  "80169": { nkName: "Ayu Maulida", matchId: "W-442562" },
  "80170": { nkName: "Ayu Afrani", matchId: "W-464822" },
  "80171": { nkName: "Secma Agustina", matchId: "W-501728" },
  "80172": { nkName: "Elfareta Dwi", matchId: "W-489291" },
  "80173": { nkName: "Lutfi Juniar", matchId: "W-150635" },
  "80174": { nkName: "Martha Soraya", matchId: "W-219796" },
  "80175": { nkName: "Nunik Wigiastutik", matchId: "W-714463" },
  "80176": { nkName: "Putri Ajar Sari", matchId: "W-248744" },
  "80177": { nkName: "Lintang Saputri", matchId: "W-599482" },
  "80178": { nkName: "Ananda Putri", matchId: "W-183557" },
  "80179": { nkName: "Dwi Sintya", matchId: "W-573188" },
  "80180": { nkName: "Dian Herlina", matchId: "W-961017" },
  "80181": { nkName: "Roudlotul Jannah", matchId: "W-057445" },
  "80182": { nkName: "Linda Kurnia", matchId: "W-987445" },
  "80183": { nkName: "Rindi Oktavia", matchId: "W-039254" },
  "80184": { nkName: "Dini Triarinda", matchId: "W-110028" },
  "80185": { nkName: "Alisya Hadi", matchId: "W-478024" },
  "80186": { nkName: "Arum Dwi", matchId: "W-518846" },
  "80187": { nkName: "Oktavia Tri", matchId: "W-540105" },
  "80188": { nkName: "Sinta Rahayu", matchId: "W-381197" },
  "80189": { nkName: "Rizky Nindi", matchId: "W-295456" },
  "80190": { nkName: "Tasya Alicya", matchId: "W-234885" },
  "80191": { nkName: "Zaskya Ayundhira", matchId: "W-157768" },
  "80192": { nkName: "Tiara Putri", matchId: "W-946787" }
};

// Inverse map matchId -> NIK
const idToNikMap = new Map();
Object.entries(mapping).forEach(([nik, info]) => {
  if (info.matchId) {
    idToNikMap.set(info.matchId, nik);
  }
});

let updatedCount = 0;
let createdCount = 0;

// Clone backup data
const updatedBackup = JSON.parse(JSON.stringify(backupData));
updatedBackup.timestamp = new Date().toISOString();

// Find unassigned team or default team
let unassignedTeam = updatedBackup.data.teams.find(t => t.id === 'unassigned');
if (!unassignedTeam && updatedBackup.data.teams.length > 0) {
  unassignedTeam = updatedBackup.data.teams[0];
}

// 1. Update existing workers
updatedBackup.data.teams.forEach(team => {
  (team.members || []).forEach(member => {
    const newNik = idToNikMap.get(member.id) || idToNikMap.get(member.no_karyawan);
    if (newNik) {
      member.no_karyawan = newNik;
      updatedCount++;
    }
  });
});

// 2. Add new workers
Object.entries(mapping).forEach(([nik, info]) => {
  if (info.isNew) {
    const newWorkerObj = {
      id: `W-${nik}`,
      full_name: info.nkName.trim().replace(/\\/g, ''),
      role: 'Operator Solder',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(info.nkName)}`,
      no_karyawan: nik,
      joined_date: '2026-07-31',
      phone_number: '-',
      shift: 'Shift Pagi',
      status: 'Baru'
    };
    unassignedTeam.members.push(newWorkerObj);
    createdCount++;
  }
});

const outputPath = 'C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31_updated_no_karyawan.json';
fs.writeFileSync(outputPath, JSON.stringify(updatedBackup, null, 2));

console.log('=== UPDATED BACKUP CREATED ===');
console.log('Saved to:', outputPath);
console.log('Updated existing workers:', updatedCount);
console.log('Added new workers:', createdCount);
console.log('Total workers now in backup:', unassignedTeam.members.length);
