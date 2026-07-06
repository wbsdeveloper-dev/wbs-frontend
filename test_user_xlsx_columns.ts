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
for (let i = 0; i < headerRow.length; i++) {
  if (headerRow[i] !== null && String(headerRow[i]).match(/^STOK\s+(.+?)\s*\([kK][lL]\)$/i)) {
    if (firstMonthColIndex === -1) firstMonthColIndex = i;
  }
}

let colSite = 3, colProduct = 4, colModa = 5, colSupplier = 6;
for (let i = 0; i < firstMonthColIndex; i++) {
  const h = String(headerRow[i] || "").toUpperCase().replace(/\s+/g, " ").trim();
  if (h.includes("PEMBANGKIT") && !h.includes("JENIS")) colSite = i;
  else if (h.includes("JENIS BBM") || h.includes("PRODUK")) colProduct = i;
  else if (h.includes("MODA")) colModa = i;
  else if (h.includes("TBBM") || h.includes("SUPPLIER")) colSupplier = i;
}

console.log(`Indices -> Site: ${colSite}, Product: ${colProduct}, Moda: ${colModa}, Supplier: ${colSupplier}`);

for (let rIdx = headerRowIndex + 3; rIdx < headerRowIndex + 10; rIdx++) {
  const row = jsonData[rIdx];
  if (!row || row.length === 0) continue;
  
  const no = row[0];
  if (no === null || no === undefined || isNaN(Number(no)) || String(no).trim() === "") continue;

  const siteName = String(row[colSite] || "").trim();
  const productName = String(row[colProduct] || "").trim();
  const modaName = String(row[colModa] || "").trim();
  const supplierName = String(row[colSupplier] || "").trim();
  
  console.log(`Row ${rIdx}: Site="${siteName}", Product="${productName}", Moda="${modaName}", Supplier="${supplierName}"`);
}
