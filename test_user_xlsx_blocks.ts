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

const headerRow = jsonData[headerRowIndex];
let firstMonthColIndex = -1;
let numMonths = 0;
for (let i = 0; i < headerRow.length; i++) {
  if (headerRow[i] !== null && String(headerRow[i]).match(/^STOK\s+(.+?)\s*\([kK][lL]\)$/i)) {
    if (firstMonthColIndex === -1) firstMonthColIndex = i;
    numMonths++;
  }
}

console.log(`headerRowIndex = ${headerRowIndex}, firstMonthColIndex = ${firstMonthColIndex}, numMonths = ${numMonths}`);

// Check row 6 (data row)
const row = jsonData[6];
console.log("Pembangkit:", row[3]);
console.log("Jenis BBM:", row[5]);
console.log("Moda:", row[6]);
console.log("TBBM:", row[11]);

let base = firstMonthColIndex;
console.log(`--- Month 0 ---`);
console.log("STOK (base):", row[base]);
console.log("HOP (base + 2):", row[base + 2]);

base += numMonths * 4;
console.log(`TERIMA starts at ${base}`);
console.log("TERIMA (Month 0):", row[base]);
console.log("TERIMA (Month 1):", row[base + 1]);

base += numMonths;
console.log(`PEMAKAIAN starts at ${base}`);
console.log("PEMAKAIAN (Month 0):", row[base]);

base += numMonths;
console.log(`STOK AKHIR starts at ${base}`);
console.log("STOK AKHIR (Month 0):", row[base]);
