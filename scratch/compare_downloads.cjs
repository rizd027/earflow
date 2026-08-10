const fs = require('fs');

const f1 = 'C:/Users/ALJABAR/Downloads/earflow_backup_2026-07-31.json';
const f2 = 'C:/Users/ALJABAR/Downloads/download_1785494742021.json';

const data1 = JSON.parse(fs.readFileSync(f1, 'utf8'));
const data2 = JSON.parse(fs.readFileSync(f2, 'utf8'));

console.log('F1 timestamp:', data1.timestamp);
console.log('F2 timestamp:', data2.timestamp);

let m1 = [], m2 = [];
(data1.data?.teams || []).forEach(t => (t.members || []).forEach(m => m1.push(m)));
(data2.data?.teams || []).forEach(t => (t.members || []).forEach(m => m2.push(m)));

console.log('F1 members:', m1.length);
console.log('F2 members:', m2.length);

// Compare names in m2 that are not in m1
const names1 = new Set(m1.map(m => m.full_name.toLowerCase().trim()));
const diff = m2.filter(m => !names1.has(m.full_name.toLowerCase().trim()));
console.log('Members in F2 not in F1:', diff.map(m => m.full_name));
