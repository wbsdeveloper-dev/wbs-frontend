"use client";

import React, { useState, useMemo } from "react";
import { Maximize2, Minimize2, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";
import {
  useKertasKerjaTemplates,
  useKertasKerjaRecords,
} from "@/hooks/service/kertas-kerja-api";
import RingkasanTBBM from "./RingkasanTBBM";
import RingkasanPembangkit from "./RingkasanPembangkit";

interface RingkasanTableProps {
  selectedRegion: string;
}

type GroupingType = "Regional" | "TBBM" | "Pembangkit";

export default function RingkasanTable({
  selectedRegion,
}: RingkasanTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<GroupingType>("Regional");

  const { data: templates = [], isLoading: templatesLoading } =
    useKertasKerjaTemplates();
  const { data: records = [], isLoading: recordsLoading } =
    useKertasKerjaRecords();

  const isLoading = templatesLoading || recordsLoading;

  const filteredTemplates = useMemo(() => {
    return selectedRegion
      ? templates.filter((t) => t.site_region === selectedRegion)
      : templates;
  }, [templates, selectedRegion]);

  const allMonths = [
    "Jan '26",
    "Feb '26",
    "Mar '26",
    "Apr '26",
    "Mei '26",
    "Jun '26",
    "Jul '26",
    "Agu '26",
    "Sep '26",
    "Okt '26",
    "Nov '26",
    "Des '26",
  ];

  const currentMonthIndex = new Date().getMonth();
  const currentMonth = allMonths[currentMonthIndex] || allMonths[5];
  const displayedMonths = isExpanded ? allMonths : [currentMonth];

  // Aggregation Logic
  const aggregatedData = useMemo(() => {
    const recordMap: Record<string, Record<string, any>> = {};

    // Group records by templateId_month
    records.forEach((r) => {
      recordMap[`${r.template_kertas_kerja_id}_${r.month_work}`] = r;
    });

    const groups: Record<string, any> = {};

    filteredTemplates.forEach((t) => {
      let groupKey = "Unknown";
      if (activeSubTab === "Regional") {
        groupKey = t.unit_name || "Tanpa Unit";
      } else if (activeSubTab === "TBBM") {
        groupKey = t.supplier_name || "Tanpa Supplier";
      } else if (activeSubTab === "Pembangkit") {
        groupKey = t.site_name || "Tanpa Pembangkit";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          name: groupKey,
          count: 0,
          months: {},
        };
      }

      groups[groupKey].count += 1;

      allMonths.forEach((m) => {
        if (!groups[groupKey].months[m]) {
          groups[groupKey].months[m] = {
            terima: 0,
            pemakaian: 0,
            renominasi_pesan: 0,
            delta_terima: 0,
            pencapaian_sum: 0,
            pencapaian_count: 0,
            rencana_pesan: 0,
          };
        }

        const rec = recordMap[`${t.id}_${m}`];
        if (rec) {
          groups[groupKey].months[m].terima += Number(rec.terima) || 0;
          groups[groupKey].months[m].pemakaian += Number(rec.pemakaian) || 0;
          groups[groupKey].months[m].renominasi_pesan +=
            Number(rec.renominasi_pesan) || 0;
          groups[groupKey].months[m].delta_terima +=
            Number(rec.delta_terima) || 0;
          groups[groupKey].months[m].rencana_pesan +=
            Number(rec.rencana_pesan) || 0;

          if (rec.pencapaian != null && !isNaN(Number(rec.pencapaian))) {
            groups[groupKey].months[m].pencapaian_sum += Number(rec.pencapaian);
            groups[groupKey].months[m].pencapaian_count += 1;
          }
        }
      });
    });

    return Object.values(groups).sort((a: any, b: any) =>
      a.name.localeCompare(b.name),
    );
  }, [filteredTemplates, records, activeSubTab, allMonths]);

  const totals = useMemo(() => {
    const tot: Record<string, any> = {};
    allMonths.forEach((m) => {
      tot[m] = {
        terima: 0,
        pemakaian: 0,
        renominasi_pesan: 0,
        delta_terima: 0,
        pencapaian_sum: 0,
        pencapaian_count: 0,
        rencana_pesan: 0,
      };
    });

    aggregatedData.forEach((g: any) => {
      allMonths.forEach((m) => {
        tot[m].terima += g.months[m].terima;
        tot[m].pemakaian += g.months[m].pemakaian;
        tot[m].renominasi_pesan += g.months[m].renominasi_pesan;
        tot[m].delta_terima += g.months[m].delta_terima;
        tot[m].rencana_pesan += g.months[m].rencana_pesan;

        tot[m].pencapaian_sum += g.months[m].pencapaian_sum;
        tot[m].pencapaian_count += g.months[m].pencapaian_count;
      });
    });

    return tot;
  }, [aggregatedData, allMonths]);

  const getColSpan = () => displayedMonths.length;


  const handleExportRingkasanPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a1" });
    let isFirst = true;

    const recordMap: Record<string, any> = {};
    records.forEach(r => {
      recordMap[`${r.template_kertas_kerja_id}_${r.month_work}`] = r;
    });

    const buildPdfPage = (groupType: "Regional" | "TBBM" | "Pembangkit", pageTitle: string) => {
      const groups: Record<string, any> = {};

      filteredTemplates.forEach(t => {
        let groupKey = "Unknown";
        if (groupType === "Regional") {
          groupKey = t.unit_name || "Tanpa Unit";
        } else if (groupType === "TBBM") {
          groupKey = t.supplier_name || "Tanpa Supplier";
        } else if (groupType === "Pembangkit") {
          groupKey = t.site_name || "Tanpa Pembangkit";
        }

        if (!groups[groupKey]) {
          groups[groupKey] = {
            name: groupKey,
            count: 0,
            months: {}
          };
        }
        
        groups[groupKey].count += 1;

        allMonths.forEach(m => {
          if (!groups[groupKey].months[m]) {
            groups[groupKey].months[m] = {
              terima: 0, pemakaian: 0, renominasi_pesan: 0, delta_terima: 0,
              pencapaian_sum: 0, pencapaian_count: 0, rencana_pesan: 0
            };
          }

          const rec = recordMap[`${t.id}_${m}`];
          if (rec) {
            groups[groupKey].months[m].terima += Number(rec.terima) || 0;
            groups[groupKey].months[m].pemakaian += Number(rec.pemakaian) || 0;
            groups[groupKey].months[m].renominasi_pesan += Number(rec.renominasi_pesan) || 0;
            groups[groupKey].months[m].delta_terima += Number(rec.delta_terima) || 0;
            groups[groupKey].months[m].rencana_pesan += Number(rec.rencana_pesan) || 0;

            if (rec.pencapaian != null && !isNaN(Number(rec.pencapaian))) {
              groups[groupKey].months[m].pencapaian_sum += Number(rec.pencapaian);
              groups[groupKey].months[m].pencapaian_count += 1;
            }
          }
        });
      });

      const aggregatedDataLocal = Object.values(groups).sort((a: any, b: any) => a.name.localeCompare(b.name));
      const numMonths = displayedMonths.length;

      // Row 1
      const row1: any[] = [
        { content: "No.", rowSpan: 3 },
        { content: groupType === "Regional" ? "Unit" : groupType === "TBBM" ? "TBBM (Supplier)" : "Pembangkit", rowSpan: 3 },
        { content: "Realisasi SAP (kL)", colSpan: 2 * numMonths, styles: { halign: 'center', fillColor: [0, 150, 136] } },
        { content: "Konfirmasi (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [63, 81, 181] } },
        { content: "Delta (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [244, 67, 54] } },
        { content: "Pencapaian (%)", colSpan: numMonths, styles: { halign: 'center', fillColor: [156, 39, 176] } },
        { content: "Rencana (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [3, 169, 244] } }
      ];

      // Row 2
      const row2: any[] = [
        { content: "Terima (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [0, 150, 136] } },
        { content: "Pemakaian (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [0, 150, 136] } },
        { content: "Renominasi/Konfirmasi (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [63, 81, 181] } },
        { content: "Delta (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [244, 67, 54] } },
        { content: "Pencapaian (%)", colSpan: numMonths, styles: { halign: 'center', fillColor: [156, 39, 176] } },
        { content: "Nominasi (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [3, 169, 244] } }
      ];

      // Row 3
      const row3: any[] = [];
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } })); // Terima
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } })); // Pemakaian
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } })); // Renominasi
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } })); // Delta
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } })); // Pencapaian
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } })); // Rencana

      const bodyData: any[][] = [];
      let idx = 0;
      aggregatedDataLocal.forEach((row: any) => {
        idx++;
        const trData = [idx, row.name];
        
        displayedMonths.forEach(m => trData.push(row.months[m].terima.toLocaleString("en-US")));
        displayedMonths.forEach(m => trData.push(row.months[m].pemakaian.toLocaleString("en-US")));
        displayedMonths.forEach(m => trData.push(row.months[m].renominasi_pesan.toLocaleString("en-US")));
        displayedMonths.forEach(m => trData.push(row.months[m].delta_terima.toLocaleString("en-US")));
        
        displayedMonths.forEach(m => {
          const avg = row.months[m].pencapaian_count > 0 ? (row.months[m].pencapaian_sum / row.months[m].pencapaian_count).toFixed(2) : "-";
          trData.push(avg);
        });

        displayedMonths.forEach(m => trData.push(row.months[m].rencana_pesan.toLocaleString("en-US")));
        bodyData.push(trData);
      });

      // Total row
      const tot: Record<string, any> = {};
      allMonths.forEach(m => {
        tot[m] = {
          terima: 0, pemakaian: 0, renominasi_pesan: 0, delta_terima: 0,
          pencapaian_sum: 0, pencapaian_count: 0, rencana_pesan: 0
        };
      });

      aggregatedDataLocal.forEach((g: any) => {
        allMonths.forEach(m => {
          tot[m].terima += g.months[m].terima;
          tot[m].pemakaian += g.months[m].pemakaian;
          tot[m].renominasi_pesan += g.months[m].renominasi_pesan;
          tot[m].delta_terima += g.months[m].delta_terima;
          tot[m].rencana_pesan += g.months[m].rencana_pesan;
          tot[m].pencapaian_sum += g.months[m].pencapaian_sum;
          tot[m].pencapaian_count += g.months[m].pencapaian_count;
        });
      });

      const totData: any[] = [{ content: "TOTAL", colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }];
      displayedMonths.forEach(m => totData.push(tot[m].terima.toLocaleString("en-US")));
      displayedMonths.forEach(m => totData.push(tot[m].pemakaian.toLocaleString("en-US")));
      displayedMonths.forEach(m => totData.push(tot[m].renominasi_pesan.toLocaleString("en-US")));
      displayedMonths.forEach(m => totData.push(tot[m].delta_terima.toLocaleString("en-US")));
      displayedMonths.forEach(m => {
        const avg = tot[m].pencapaian_count > 0 ? (tot[m].pencapaian_sum / tot[m].pencapaian_count).toFixed(2) : "-";
        totData.push(avg);
      });
      displayedMonths.forEach(m => totData.push(tot[m].rencana_pesan.toLocaleString("en-US")));
      bodyData.push(totData);

      if (!isFirst) doc.addPage();
      isFirst = false;

      doc.setFontSize(14);
      doc.text(pageTitle, 40, 40);

      autoTable(doc, {
        startY: 50,
        head: [row1, row2, row3],
        body: bodyData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2, halign: 'center', textColor: [50, 50, 50] },
        headStyles: { textColor: 255, fontStyle: 'bold' },
        margin: { top: 50, left: 20, right: 20 },
      });
    };

    buildPdfPage("Regional", "Ringkasan Regional");
    buildPdfPage("TBBM", "Ringkasan TBBM");
    buildPdfPage("Pembangkit", "Ringkasan Pembangkit");

    const today = new Date().toISOString().split("T")[0];
    const regionName = selectedRegion ? selectedRegion.replace(/\s+/g, "_") : "All_Region";
    doc.save(`Ringkasan_BBM_${regionName}_${today}.pdf`);
  };

  const handleExportRingkasanExcel = () => {
    const wb = XLSX.utils.book_new();

    const recordMap: Record<string, any> = {};
    records.forEach((r) => {
      recordMap[`${r.template_kertas_kerja_id}_${r.month_work}`] = r;
    });

    const buildSheet = (
      groupType: "Regional" | "TBBM" | "Pembangkit",
      sheetName: string,
    ) => {
      const groups: Record<string, any> = {};

      filteredTemplates.forEach((t) => {
        let groupKey = "Unknown";
        if (groupType === "Regional") {
          groupKey = t.unit_name || "Tanpa Unit";
        } else if (groupType === "TBBM") {
          groupKey = t.supplier_name || "Tanpa Supplier";
        } else if (groupType === "Pembangkit") {
          groupKey = t.site_name || "Tanpa Pembangkit";
        }

        if (!groups[groupKey]) {
          groups[groupKey] = {
            name: groupKey,
            count: 0,
            months: {},
          };
        }

        groups[groupKey].count += 1;

        allMonths.forEach((m) => {
          if (!groups[groupKey].months[m]) {
            groups[groupKey].months[m] = {
              terima: 0,
              pemakaian: 0,
              renominasi_pesan: 0,
              delta_terima: 0,
              pencapaian_sum: 0,
              pencapaian_count: 0,
              rencana_pesan: 0,
            };
          }

          const rec = recordMap[`${t.id}_${m}`];
          if (rec) {
            groups[groupKey].months[m].terima += Number(rec.terima) || 0;
            groups[groupKey].months[m].pemakaian += Number(rec.pemakaian) || 0;
            groups[groupKey].months[m].renominasi_pesan +=
              Number(rec.renominasi_pesan) || 0;
            groups[groupKey].months[m].delta_terima +=
              Number(rec.delta_terima) || 0;
            groups[groupKey].months[m].rencana_pesan +=
              Number(rec.rencana_pesan) || 0;

            if (rec.pencapaian != null && !isNaN(Number(rec.pencapaian))) {
              groups[groupKey].months[m].pencapaian_sum += Number(
                rec.pencapaian,
              );
              groups[groupKey].months[m].pencapaian_count += 1;
            }
          }
        });
      });

      const aggregatedDataLocal = Object.values(groups).sort((a: any, b: any) =>
        a.name.localeCompare(b.name),
      );

      const numMonths = displayedMonths.length;
      const wsData: any[][] = [];

      // Row 1
      const row1 = [
        "No.",
        groupType === "Regional"
          ? "Unit"
          : groupType === "TBBM"
            ? "TBBM (Supplier)"
            : "Pembangkit",
      ];
      row1.push("Realisasi SAP (kL)");
      for (let i = 1; i < 2 * numMonths; i++) row1.push("");
      row1.push("Konfirmasi (kL)");
      for (let i = 1; i < numMonths; i++) row1.push("");
      row1.push("Delta (kL)");
      for (let i = 1; i < numMonths; i++) row1.push("");
      row1.push("Pencapaian (%)");
      for (let i = 1; i < numMonths; i++) row1.push("");
      row1.push("Rencana (kL)");
      for (let i = 1; i < numMonths; i++) row1.push("");
      wsData.push(row1);

      // Row 2
      const row2 = ["", ""];
      row2.push("Terima (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("Pemakaian (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("Renominasi/Konfirmasi (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("Delta (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("Pencapaian (%)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("Nominasi (kL)");
      for (let i = 1; i < numMonths; i++) row2.push("");
      wsData.push(row2);

      // Row 3
      const row3 = ["", ""];
      displayedMonths.forEach((m) => row3.push(m)); // Terima
      displayedMonths.forEach((m) => row3.push(m)); // Pemakaian
      displayedMonths.forEach((m) => row3.push(m)); // Renominasi
      displayedMonths.forEach((m) => row3.push(m)); // Delta
      displayedMonths.forEach((m) => row3.push(m)); // Pencapaian
      displayedMonths.forEach((m) => row3.push(m)); // Rencana
      wsData.push(row3);

      let idx = 0;
      aggregatedDataLocal.forEach((row: any) => {
        idx++;
        const trData = [idx, row.name];

        displayedMonths.forEach((m) => trData.push(row.months[m].terima));
        displayedMonths.forEach((m) => trData.push(row.months[m].pemakaian));
        displayedMonths.forEach((m) =>
          trData.push(row.months[m].renominasi_pesan),
        );
        displayedMonths.forEach((m) => trData.push(row.months[m].delta_terima));

        displayedMonths.forEach((m) => {
          const avg =
            row.months[m].pencapaian_count > 0
              ? (
                  row.months[m].pencapaian_sum / row.months[m].pencapaian_count
                ).toFixed(2)
              : "-";
          trData.push(avg);
        });

        displayedMonths.forEach((m) =>
          trData.push(row.months[m].rencana_pesan),
        );
        wsData.push(trData);
      });

      // Total row
      const tot: Record<string, any> = {};
      allMonths.forEach((m) => {
        tot[m] = {
          terima: 0,
          pemakaian: 0,
          renominasi_pesan: 0,
          delta_terima: 0,
          pencapaian_sum: 0,
          pencapaian_count: 0,
          rencana_pesan: 0,
        };
      });

      aggregatedDataLocal.forEach((g: any) => {
        allMonths.forEach((m) => {
          tot[m].terima += g.months[m].terima;
          tot[m].pemakaian += g.months[m].pemakaian;
          tot[m].renominasi_pesan += g.months[m].renominasi_pesan;
          tot[m].delta_terima += g.months[m].delta_terima;
          tot[m].rencana_pesan += g.months[m].rencana_pesan;
          tot[m].pencapaian_sum += g.months[m].pencapaian_sum;
          tot[m].pencapaian_count += g.months[m].pencapaian_count;
        });
      });

      const totData = ["", "TOTAL"];
      displayedMonths.forEach((m) => totData.push(tot[m].terima));
      displayedMonths.forEach((m) => totData.push(tot[m].pemakaian));
      displayedMonths.forEach((m) => totData.push(tot[m].renominasi_pesan));
      displayedMonths.forEach((m) => totData.push(tot[m].delta_terima));
      displayedMonths.forEach((m) => {
        const avg =
          tot[m].pencapaian_count > 0
            ? (tot[m].pencapaian_sum / tot[m].pencapaian_count).toFixed(2)
            : "-";
        totData.push(avg);
      });
      displayedMonths.forEach((m) => totData.push(tot[m].rencana_pesan));
      wsData.push(totData);

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Simple merges
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 2, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 2, c: 1 } },
      ];
      if (merges.length > 0) ws["!merges"] = merges;

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    buildSheet("Regional", "Ringkasan Regional");
    buildSheet("TBBM", "Ringkasan TBBM");
    buildSheet("Pembangkit", "Ringkasan Pembangkit");

    const today = new Date().toISOString().split("T")[0];
    const regionName = selectedRegion
      ? selectedRegion.replace(/\s+/g, "_")
      : "All_Region";
    XLSX.writeFile(wb, `Ringkasan_BBM_${regionName}_${today}.xlsx`);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow border border-gray-200 flex flex-col flex-1 h-full overflow-hidden min-h-0">
      <div className="w-full overflow-auto relative flex-1 min-h-0 custom-scrollbar">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : null}

        {activeSubTab === "TBBM" ? (
          <RingkasanTBBM
            templates={filteredTemplates}
            records={records}
            displayedMonths={displayedMonths}
            allMonths={allMonths}
            selectedRegion={selectedRegion}
          />
        ) : activeSubTab === "Pembangkit" ? (
          <RingkasanPembangkit
            templates={filteredTemplates}
            records={records}
            displayedMonths={displayedMonths}
            allMonths={allMonths}
            selectedRegion={selectedRegion}
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col w-full h-full min-h-0 shadow-sm">
            <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold sticky top-0 z-20 shrink-0 shadow-sm">
              <div>
                Tabel Ringkasan {activeSubTab}{" "}
                {selectedRegion
                  ? `(Regional ${selectedRegion})`
                  : "(Seluruh Regional)"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportRingkasanExcel}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-primary hover:bg-slate-50 rounded-md transition-colors shadow-sm font-bold"
                >
                  <Download size={16} /> Export Excel
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-primary hover:bg-slate-50 rounded-md transition-colors shadow-sm font-semibold"
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 size={16} /> Ciutkan Bulan
                    </>
                  ) : (
                    <>
                      <Maximize2 size={16} /> Tampilkan Semua Bulan
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="overflow-auto custom-scrollbar flex-1 w-full">
              <table className="w-full border-collapse text-xs text-center min-w-max">
                <thead className="sticky top-0 z-20 shadow-sm">
                  {/* Row 1 */}
                  <tr className="bg-slate-50 text-slate-700">
                    <th
                      className="border border-slate-200 p-3 font-bold sticky left-0 z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]"
                      rowSpan={2}
                      style={{ width: "40px" }}
                    >
                      No.
                    </th>
                    <th
                      className="border border-slate-200 p-3 font-bold sticky left-[40px] z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]"
                      rowSpan={2}
                      style={{ minWidth: "200px" }}
                    >
                      {activeSubTab === "Regional"
                        ? "Unit"
                        : activeSubTab === "TBBM"
                          ? "TBBM (Supplier)"
                          : "Pembangkit"}
                    </th>
                    <th
                      className="border border-slate-200 p-2 font-bold bg-teal-50/80 border-t-2 border-t-teal-400 text-teal-900 uppercase tracking-wider text-[11px]"
                      colSpan={getColSpan() * 2}
                    >
                      Realisasi SAP (kL)
                    </th>
                    <th
                      className="border border-slate-200 p-2 font-bold bg-indigo-50/80 border-t-2 border-t-indigo-400 text-indigo-900 uppercase tracking-wider text-[11px]"
                      colSpan={getColSpan()}
                    >
                      Konfirmasi (kL)
                    </th>
                    <th
                      className="border border-slate-200 p-2 font-bold bg-rose-50/80 border-t-2 border-t-rose-400 text-rose-900 uppercase tracking-wider text-[11px]"
                      colSpan={getColSpan()}
                    >
                      Delta (kL)
                    </th>
                    <th
                      className="border border-slate-200 p-2 font-bold bg-purple-50/80 border-t-2 border-t-purple-400 text-purple-900 uppercase tracking-wider text-[11px]"
                      colSpan={getColSpan()}
                    >
                      Pencapaian (%)
                    </th>
                    <th
                      className="border border-slate-200 p-2 font-bold bg-sky-50/80 border-t-2 border-t-sky-400 text-sky-900 uppercase tracking-wider text-[11px]"
                      colSpan={getColSpan()}
                    >
                      Rencana (kL)
                    </th>
                  </tr>

                  {/* Row 2 */}
                  <tr className="bg-slate-50 text-slate-700 uppercase text-[10px]">
                    {/* Realisasi */}
                    <th
                      className="border border-slate-200 p-1.5 font-bold bg-teal-50/50 text-teal-800"
                      colSpan={getColSpan()}
                    >
                      Terima (kL)
                    </th>
                    <th
                      className="border border-slate-200 p-1.5 font-bold bg-teal-50/50 text-teal-800"
                      colSpan={getColSpan()}
                    >
                      Pemakaian (kL)
                    </th>
                    {/* Konfirmasi */}
                    <th
                      className="border border-slate-200 p-1.5 font-bold bg-indigo-50/50 text-indigo-800"
                      colSpan={getColSpan()}
                    >
                      Renominasi/Konfirmasi (kL)
                    </th>
                    {/* Delta */}
                    <th
                      className="border border-slate-200 p-1.5 font-bold bg-rose-50/50 text-rose-800"
                      colSpan={getColSpan()}
                    >
                      Delta (kL)
                    </th>
                    {/* Pencapaian */}
                    <th
                      className="border border-slate-200 p-1.5 font-bold bg-purple-50/50 text-purple-800"
                      colSpan={getColSpan()}
                    >
                      Pencapaian (%)
                    </th>
                    {/* Rencana */}
                    <th
                      className="border border-slate-200 p-1.5 font-bold bg-sky-50/50 text-sky-800"
                      colSpan={getColSpan()}
                    >
                      Nominasi (kL)
                    </th>
                  </tr>

                  {/* Row 3 - Months */}
                  <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase">
                    <th className="border border-slate-200 p-1 sticky left-0 z-10 bg-slate-50"></th>
                    <th className="border border-slate-200 p-1 sticky left-[40px] z-10 bg-slate-50"></th>

                    {displayedMonths.map((m, i) => (
                      <th
                        key={`rt-${i}`}
                        className="border border-slate-200 p-1.5 font-semibold bg-teal-50/30 text-teal-700"
                      >
                        {m}
                      </th>
                    ))}
                    {displayedMonths.map((m, i) => (
                      <th
                        key={`rp-${i}`}
                        className="border border-slate-200 p-1.5 font-semibold bg-teal-50/30 text-teal-700"
                      >
                        {m}
                      </th>
                    ))}

                    {displayedMonths.map((m, i) => (
                      <th
                        key={`rk-${i}`}
                        className="border border-slate-200 p-1.5 font-semibold bg-indigo-50/30 text-indigo-700"
                      >
                        {m}
                      </th>
                    ))}

                    {displayedMonths.map((m, i) => (
                      <th
                        key={`rd-${i}`}
                        className="border border-slate-200 p-1.5 font-semibold bg-rose-50/30 text-rose-700"
                      >
                        {m}
                      </th>
                    ))}

                    {displayedMonths.map((m, i) => (
                      <th
                        key={`rpe-${i}`}
                        className="border border-slate-200 p-1.5 font-semibold bg-purple-50/30 text-purple-700"
                      >
                        {m}
                      </th>
                    ))}

                    {displayedMonths.map((m, i) => (
                      <th
                        key={`rn-${i}`}
                        className="border border-slate-200 p-1.5 font-semibold bg-sky-50/30 text-sky-700"
                      >
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {aggregatedData.map((group: any, index: number) => (
                    <tr
                      key={group.name}
                      className="hover:bg-slate-50 border-b border-slate-200 transition-colors duration-150"
                    >
                      <td className="border-r border-slate-200 p-2.5 sticky left-0 z-10 bg-white text-center font-medium shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]">
                        {index + 1}
                      </td>
                      <td className="border-r border-slate-200 p-2.5 sticky left-[40px] z-10 bg-white text-left font-semibold text-slate-800 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]">
                        {group.name}
                      </td>

                      {/* Terima */}
                      {displayedMonths.map((m) => (
                        <td
                          key={`v-rt-${m}`}
                          className="border-r border-slate-100 p-2.5 text-right tabular-nums"
                        >
                          {group.months[m].terima.toLocaleString("en-US")}
                        </td>
                      ))}

                      {/* Pemakaian */}
                      {displayedMonths.map((m) => (
                        <td
                          key={`v-rp-${m}`}
                          className="border-r border-slate-100 p-2.5 text-right tabular-nums"
                        >
                          {group.months[m].pemakaian.toLocaleString("en-US")}
                        </td>
                      ))}

                      {/* Renominasi/Konfirmasi */}
                      {displayedMonths.map((m) => (
                        <td
                          key={`v-rk-${m}`}
                          className="border-r border-slate-100 p-2.5 text-right tabular-nums"
                        >
                          {group.months[m].renominasi_pesan.toLocaleString(
                            "en-US",
                          )}
                        </td>
                      ))}

                      {/* Delta */}
                      {displayedMonths.map((m) => {
                        const val = group.months[m].delta_terima;
                        return (
                          <td
                            key={`v-rd-${m}`}
                            className={`border-r border-slate-100 p-2.5 text-right tabular-nums font-medium ${val < 0 ? "text-rose-600 bg-rose-50/30" : val > 0 ? "text-teal-600 bg-teal-50/30" : "text-slate-600"}`}
                          >
                            {val > 0 ? "+" : ""}
                            {val.toLocaleString("en-US")}
                          </td>
                        );
                      })}

                      {/* Pencapaian */}
                      {displayedMonths.map((m) => {
                        const val =
                          group.months[m].pencapaian_count > 0
                            ? Math.round(
                                group.months[m].pencapaian_sum /
                                  group.months[m].pencapaian_count,
                              )
                            : 0;
                        return (
                          <td
                            key={`v-rpe-${m}`}
                            className="border-r border-slate-100 p-2.5 text-right tabular-nums font-medium text-slate-700"
                          >
                            {val > 0 ? `${val}%` : "-"}
                          </td>
                        );
                      })}

                      {/* Rencana */}
                      {displayedMonths.map((m) => (
                        <td
                          key={`v-rn-${m}`}
                          className="border-r border-slate-100 p-2.5 text-right tabular-nums"
                        >
                          {group.months[m].rencana_pesan.toLocaleString(
                            "en-US",
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Total Row */}
                  {aggregatedData.length > 0 && (
                    <tr className="bg-slate-100/80 text-slate-800 font-bold border-t-2 border-slate-300">
                      <td
                        className="border-r border-slate-300 p-2.5 sticky left-0 z-10 bg-slate-100 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] text-center tracking-wide"
                        colSpan={2}
                      >
                        TOTAL{" "}
                        {selectedRegion
                          ? `REGIONAL ${selectedRegion.toUpperCase()}`
                          : "KESELURUHAN"}
                      </td>

                      {displayedMonths.map((m) => (
                        <td
                          key={`tot-rt-${m}`}
                          className="border-r border-slate-200 p-2.5 text-right tabular-nums"
                        >
                          {totals[m].terima.toLocaleString("en-US")}
                        </td>
                      ))}
                      {displayedMonths.map((m) => (
                        <td
                          key={`tot-rp-${m}`}
                          className="border-r border-slate-200 p-2.5 text-right tabular-nums"
                        >
                          {totals[m].pemakaian.toLocaleString("en-US")}
                        </td>
                      ))}
                      {displayedMonths.map((m) => (
                        <td
                          key={`tot-rk-${m}`}
                          className="border-r border-slate-200 p-2.5 text-right tabular-nums"
                        >
                          {totals[m].renominasi_pesan.toLocaleString("en-US")}
                        </td>
                      ))}
                      {displayedMonths.map((m) => (
                        <td
                          key={`tot-rd-${m}`}
                          className="border-r border-slate-200 p-2.5 text-right tabular-nums"
                        >
                          {totals[m].delta_terima === 0
                            ? "-"
                            : totals[m].delta_terima.toLocaleString("en-US")}
                        </td>
                      ))}
                      {displayedMonths.map((m) => {
                        const avg =
                          totals[m].pencapaian_count > 0
                            ? Math.round(
                                totals[m].pencapaian_sum /
                                  totals[m].pencapaian_count,
                              )
                            : 0;
                        return (
                          <td
                            key={`tot-rpe-${m}`}
                            className="border-r border-slate-200 p-2.5 text-right tabular-nums text-slate-700"
                          >
                            {avg > 0 ? `${avg}%` : "-"}
                          </td>
                        );
                      })}
                      {displayedMonths.map((m) => (
                        <td
                          key={`tot-rn-${m}`}
                          className="border-r border-slate-200 p-2.5 text-right tabular-nums"
                        >
                          {totals[m].rencana_pesan.toLocaleString("en-US")}
                        </td>
                      ))}
                    </tr>
                  )}

                  {aggregatedData.length === 0 && !isLoading && (
                    <tr>
                      <td
                        colSpan={2 + getColSpan() * 6}
                        className="p-8 text-center text-slate-500 font-medium"
                      >
                        Tidak ada data untuk region ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Tabs for Grouping */}
      <div className="flex bg-gray-100 border-t border-gray-200 overflow-x-auto rounded-b-lg px-2 pt-2 gap-1 relative z-30 shrink-0">
        {(["Regional", "TBBM", "Pembangkit"] as GroupingType[]).map(
          (tabName, idx) => {
            const isActive = activeSubTab === tabName;
            return (
              <button
                key={tabName}
                onClick={() => setActiveSubTab(tabName)}
                className={`relative px-6 py-2.5 text-sm font-medium rounded-t-xl transition-all duration-300 min-w-max group flex items-center gap-2 ${
                  isActive
                    ? "bg-white text-primary shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border border-b-0 border-gray-200 z-10"
                    : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-200/80 border border-transparent border-b-0"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary rounded-t-xl" />
                )}
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-gray-200 text-gray-500 group-hover:bg-gray-300 group-hover:text-gray-700"
                  }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                {tabName}

                {isActive && (
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white" />
                )}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
