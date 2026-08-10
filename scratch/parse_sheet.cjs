const fs = require('fs');
const path = require('path');

function parseSheet(xmlPath) {
  console.log('=== ' + xmlPath + ' ===');
  const xml = fs.readFileSync(xmlPath, 'utf8');
  
  // Find all row tags
  const rowMatches = xml.match(/<row[^>]*>.*?<\/row>/gs);
  if (!rowMatches) {
    console.log('No rows found');
    return;
  }

  rowMatches.forEach(r => {
    const rowNumMatch = r.match(/r="(\d+)"/);
    const rowNum = rowNumMatch ? rowNumMatch[1] : '?';
    
    // Find all c tags inside row
    const cellMatches = r.match(/<c[^>]*>.*?<\/c>/gs) || r.match(/<c[^>]*\/>/gs);
    if (!cellMatches) return;

    const cells = [];
    cellMatches.forEach(c => {
      const refMatch = c.match(/r="([A-Z]+\d+)"/);
      const ref = refMatch ? refMatch[1] : '';
      
      let val = '';
      const vMatch = c.match(/<v>([^<]*)<\/v>/);
      const tMatch = c.match(/<is><t[^>]*>([^<]*)<\/t><\/is>/);
      
      if (tMatch) {
        val = tMatch[1];
      } else if (vMatch) {
        val = vMatch[1];
      }
      if (val || ref) {
        cells.push(`${ref}:${val}`);
      }
    });

    if (cells.length > 0) {
      console.log(`Row ${rowNum}: ${cells.join(' | ')}`);
    }
  });
}

parseSheet('d:/Website/earflow/scratch/excel_extracted/xl/worksheets/sheet1.xml');
parseSheet('d:/Website/earflow/scratch/excel_extracted/xl/worksheets/sheet2.xml');
