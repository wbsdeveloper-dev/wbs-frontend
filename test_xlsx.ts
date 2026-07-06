import * as XLSX from "xlsx";
import * as fs from "fs";

const wsData: any[][] = [];
const displayedMonths = ["Jan '26", "Feb '26"];
const numMonths = 2;

const row1 = [
  "NO.", "UNIT PELAKSANA", "JENIS KIT", "PEMBANGKIT", "JENIS BBM", "MODA ANGKUTAN", 
  "TBBM", "", "",
  "TANGKI TIMBUN", "", "",
  "HOP MINIMUM"
];
displayedMonths.forEach(m => {
  row1.push(`STOK ${m} (kL)`, `KETERISIAN TANGKI (%)`, `HOP ${m} (Hari)`, `KETERANGAN HOP < HOP MIN`);
});
row1.push("REALISASI (SAP)"); for (let i = 1; i < 4 * numMonths; i++) row1.push("");
row1.push("RENOMINASI/KONFIRMASI"); for (let i = 1; i < 2 * numMonths; i++) row1.push("");
row1.push("DELTA (REAL - KONF)"); for (let i = 1; i < 2 * numMonths; i++) row1.push("");
row1.push("RENCANA (PROGNOSA)"); for (let i = 1; i < 2 * numMonths; i++) row1.push("");
row1.push("POLA OPERASI");
row1.push("KETERANGAN"); for (let i = 1; i < 2 * numMonths; i++) row1.push("");
wsData.push(row1);

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(wsData);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

const readWb = XLSX.read(buf, { type: "buffer" });
const readWs = readWb.Sheets["Sheet1"];
const jsonData = XLSX.utils.sheet_to_json<any[]>(readWs, { header: 1, defval: null });

const headerRow = jsonData[0];
console.log("headerRow length:", headerRow.length);
console.log("headerRow[13]:", headerRow[13]);

const detectedMonths: string[] = [];
for (let i = 13; i < headerRow.length; i++) {
  const cell = headerRow[i];
  if (typeof cell === 'string' && cell.startsWith("STOK ") && cell.includes("(kL)")) {
    const m = cell.replace("STOK ", "").replace(" (kL)", "").trim();
    if (m) detectedMonths.push(m);
  }
}
console.log("detectedMonths:", detectedMonths);
