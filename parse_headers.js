const XLSX = require('xlsx');
const file = process.argv[2];
const workbook = XLSX.readFile(file);
const worksheet = workbook.Sheets['01. PNP'];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

let headerRowIndex = 3;
const row3 = jsonData[headerRowIndex];
const row4 = jsonData[headerRowIndex + 1] || [];
const row5 = jsonData[headerRowIndex + 2] || [];

const normalizeMonthWork = (rawLabel) => {
    if (!rawLabel) return "";
    let s = String(rawLabel).toLowerCase().trim();
    const monthMap = {
      jan: "Jan", janu: "Jan", january: "Jan", januari: "Jan",
      feb: "Feb", peb: "Feb", february: "Feb", februari: "Feb", pebruari: "Feb",
      mar: "Mar", maret: "Mar", march: "Mar",
      apr: "Apr", april: "Apr",
      mei: "Mei", may: "Mei",
      jun: "Jun", juni: "Jun", june: "Jun",
      jul: "Jul", juli: "Jul", july: "Jul",
      agu: "Agu", agus: "Agu", agustus: "Agu", aug: "Agu", august: "Agu",
      sep: "Sep", sept: "Sep", september: "Sep",
      okt: "Okt", oct: "Okt", oktober: "Okt", october: "Okt",
      nov: "Nov", nop: "Nov", november: "Nov", nopember: "Nov",
      des: "Des", dec: "Des", desember: "Des", december: "Des"
    };

    let foundMonth = "";
    const words = s.replace(/[^a-z0-9]/gi, ' ').split(' ').filter(Boolean);
    for (const w of words) {
      if (/^\d+$/.test(w)) continue;
      for (const key of Object.keys(monthMap)) {
        if (w.startsWith(key)) {
          foundMonth = monthMap[key];
          break;
        }
      }
      if (foundMonth) break;
    }

    let foundYear = "";
    const yearMatch4 = s.match(/\b(20\d{2})\b/);
    if (yearMatch4) {
      foundYear = yearMatch4[1].substring(2);
    } else {
      const nums = s.match(/\b\d{2}\b/g);
      if (nums && nums.length > 0) {
         foundYear = nums[nums.length - 1];
      }
    }

    if (foundMonth && foundYear) {
      return `${foundMonth} '${foundYear}`;
    }
    return rawLabel;
};


const detectedMonths = [];
let firstMonthColIndex = -1;
for (let i = 0; i < row3.length; i++) {
    const cell = row3[i];
    if (cell !== undefined && cell !== null) {
        const cellStr = String(cell).trim();
        const match = cellStr.match(/^STOK\s+(.+?)\s*\([kK][lL]\)$/i);
        if (match) {
            if (firstMonthColIndex === -1) firstMonthColIndex = i;
            const m = match[1].trim();
            if (m) detectedMonths.push(m);
        }
    }
}

const row3Map = [];
let lastRow3 = null;
for (let c = 0; c < 300; c++) {
    if (row3[c]) {
        if (lastRow3) lastRow3.end = c - 1;
        lastRow3 = { name: String(row3[c]).trim().toUpperCase(), start: c, end: 300 };
        row3Map.push(lastRow3);
    }
}

const getSubCategoryCols = (row3Match, row4Match) => {
    const cols = [];
    // Allow matching independent of row3 if row3Match is null
    const cats = row3Match ? row3Map.filter(x => x.name.includes(row3Match)) : row3Map;
    if (cats.length === 0) return cols;
    
    for (const cat of cats) {
        let inSubCat = false;
        for (let c = cat.start; c <= cat.end; c++) {
            if (row4[c]) {
                if (String(row4[c]).toUpperCase().includes(row4Match)) {
                    inSubCat = true;
                } else {
                    inSubCat = false;
                }
            }
            if (inSubCat) cols.push(c);
        }
    }
    // If empty, search globally in row4 just in case row 3 was malformed
    if (cols.length === 0) {
        for (let c = 0; c < 300; c++) {
            if (row4[c] && String(row4[c]).toUpperCase().includes(row4Match)) {
                // assume it's one column per month if not merged
                for (let k = c; k < c + 30; k++) {
                   if (row4[k] && String(row4[k]).toUpperCase().includes(row4Match) === false) break;
                   cols.push(k);
                }
                break;
            }
        }
    }
    return cols;
};

const findColForMonth = (cols, targetMonth) => {
    const target = normalizeMonthWork(targetMonth);
    for (const c of cols) {
        if (row5[c] && normalizeMonthWork(String(row5[c])) === target) return c;
        if (row4[c] && normalizeMonthWork(String(row4[c])) === target) return c;
    }
    // Fallback: search row 4 and row 5 globally from col 70 onwards
    for (let c = 70; c < 300; c++) {
        if (row5[c] && normalizeMonthWork(String(row5[c])) === target) return c;
    }
    return -1;
};

const monthMaps = {};
const terimaCols = getSubCategoryCols("REALISASI", "TERIMA");
const pemakaianCols = getSubCategoryCols("REALISASI", "PEMAKAIAN");
const rencanaPesanCols = getSubCategoryCols("RENCANA", "PESAN");

for (const m of detectedMonths) {
    monthMaps[m] = {
       terima: findColForMonth(terimaCols, m),
       pemakaian: findColForMonth(pemakaianCols, m),
       rencanaPesan: findColForMonth(rencanaPesanCols, m)
    };
}
console.log(monthMaps);
