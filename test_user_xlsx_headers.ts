import * as XLSX from "xlsx";
import * as fs from "fs";

const filePath = "/Users/sbuhmpm/development/WBS_PLN_EPI/Salinan dari 2026 Kertas Kerja Rakor BBM Kalimantan.xlsx";
const buf = fs.readFileSync(filePath);

const readWb = XLSX.read(buf, { type: "buffer" });
const readWs = readWb.Sheets["01. PNP"];
const jsonData = XLSX.utils.sheet_to_json<any[]>(readWs, { header: 1, defval: null });

const headerRowIndex = 3;
const headerRow = jsonData[headerRowIndex];

for (let i = 0; i < 25; i++) {
  console.log(`Col ${i}:`, headerRow[i]);
}
