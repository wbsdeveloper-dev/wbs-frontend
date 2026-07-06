import * as XLSX from "xlsx";
import * as fs from "fs";

const filePath = "/Users/sbuhmpm/development/WBS_PLN_EPI/Salinan dari 2026 Kertas Kerja Rakor BBM Kalimantan.xlsx";
const buf = fs.readFileSync(filePath);

const readWb = XLSX.read(buf, { type: "buffer" });

const readWs = readWb.Sheets["01. PNP"];
const jsonData = XLSX.utils.sheet_to_json<any[]>(readWs, { header: 1, defval: null });

let headerRowIndex = -1;
for (let r = 0; r < Math.min(jsonData.length, 10); r++) {
  const row = jsonData[r];
  if (row && row.some(cell => cell !== null && cell !== undefined && String(cell).match(/^STOK\s+(.+?)\s*\([kK][lL]\)$/i))) {
    headerRowIndex = r;
    break;
  }
}
console.log(`Sheet "01. PNP": headerRowIndex = ${headerRowIndex}`);

for (let rIdx = headerRowIndex; rIdx < headerRowIndex + 10; rIdx++) {
  console.log(`Row ${rIdx}:`, jsonData[rIdx]);
}
