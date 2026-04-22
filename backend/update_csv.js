const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

const csvPath = path.join(__dirname, 'MOCK_DATA_Student.csv');
const excelPath = path.join(__dirname, 'name_regd.xlsx');

// 1. Read Excel
const workbook = XLSX.readFile(excelPath);
const newData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
const shuffledNewData = newData.sort(() => Math.random() - 0.5);

// 2. Read CSV
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');
const headers = lines[0];

const updatedLines = [headers];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const cols = line.split(',');
  const identityIndex = i - 1;

  if (identityIndex < shuffledNewData.length) {
    // Update Name (index 0) and Studentid (index 3)
    // CSV structure: name,email,Phone,Studentid,Department
    cols[0] = shuffledNewData[identityIndex].Name;
    cols[3] = shuffledNewData[identityIndex]['Regd No'];
  }
  
  updatedLines.push(cols.join(','));
}

fs.writeFileSync(csvPath, updatedLines.join('\n'), 'utf-8');
console.log('✅ Updated MOCK_DATA_Student.csv with new names and registration numbers.');
