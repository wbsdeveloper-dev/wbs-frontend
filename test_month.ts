function normalizeMonthWork(rawLabel: string): string {
    if (!rawLabel) return "";
    
    let s = rawLabel.toLowerCase().trim();
    
    const monthMap: Record<string, string> = {
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
      if (/^\d+$/.test(w)) continue; // skip numbers
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
}

const tests = [
  "04 DES 2025",
  "04 Jan 2026",
  "4 FEB 2026",
  "03 MAR 2026",
  "09 APR 2026",
  "5 MEI 2026",
  "04 JUNI 2026",
  "02 Juli 2026",
  "3 AGUSTUS 2026",
  "2 SEPT 2026",
  "2 OKT 2026",
  "4 NOV 2026",
  "05 JAN 2027",
  "Jan '26",
  "FEB '26"
];

for (const t of tests) {
  console.log(`${t} -> ${normalizeMonthWork(t)}`);
}
