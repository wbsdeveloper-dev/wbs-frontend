"use client";

import React, { useState, useEffect } from "react";
import { Maximize2, Minimize2, Save, Loader2, Download, Upload, Eye, EyeOff } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText } from "lucide-react";
import { 
  useKertasKerjaTemplates, 
  useKertasKerjaRecords, 
  useBulkUpsertKertasKerjaRecords,
  useKertasKerjaMaster,
  RecordKertasKerja
} from "@/hooks/service/kertas-kerja-api";

interface KertasKerjaTableProps {
  selectedRegion: string;
  selectedYear: number;
  selectedUnit?: string;
  selectedUnitPelaksana?: string;
  canUpdate?: boolean;
}

export default function KertasKerjaTable({ selectedRegion, selectedYear, selectedUnit, selectedUnitPelaksana, canUpdate = true }: KertasKerjaTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [localRecords, setLocalRecords] = useState<Record<string, RecordKertasKerja>>({});
  const [dirtyRecords, setDirtyRecords] = useState<Record<string, Partial<RecordKertasKerja>>>({});

  const { data: templates = [], isLoading: templatesLoading } = useKertasKerjaTemplates();
  const { data: records = [], isLoading: recordsLoading, refetch: refetchRecords } = useKertasKerjaRecords();
  const upsertMutation = useBulkUpsertKertasKerjaRecords();
  const { data: polaOperasiList = [] } = useKertasKerjaMaster("master_pola_operasi");
  
  const filteredTemplates = templates.filter(t => {
    if (selectedRegion && t.site_region !== selectedRegion) return false;
    if (selectedUnit && t.unit_name !== selectedUnit) return false;
    if (selectedUnitPelaksana && t.upk_name !== selectedUnitPelaksana) return false;
    if (!showInactive && t.is_active === false) return false;
    return true;
  });

  const availableUnits = Array.from(
    new Set(filteredTemplates.map(t => t.unit_name).filter(Boolean))
  ) as string[];

  const [activeUnitTab, setActiveUnitTab] = useState<string>("");

  useEffect(() => {
    if (availableUnits.length > 0 && !availableUnits.includes(activeUnitTab)) {
      setActiveUnitTab(availableUnits[0]);
    } else if (availableUnits.length === 0) {
      setActiveUnitTab("");
    }
  }, [availableUnits, activeUnitTab]);

  const displayedTemplates = activeUnitTab 
    ? filteredTemplates.filter(t => t.unit_name === activeUnitTab) 
    : filteredTemplates;

  const isLoading = templatesLoading || recordsLoading;
  const isDirty = Object.keys(dirtyRecords).length > 0;

  useEffect(() => {
    if (records.length > 0) {
      const initial: Record<string, RecordKertasKerja> = {};
      records.forEach(r => {
        initial[`${r.template_kertas_kerja_id}_${r.month_work}`] = r;
      });
      setLocalRecords(initial);
      setDirtyRecords({}); // clear dirty state when fresh data loads
    }
  }, [records]);

  const handleRecordChange = (templateId: string, month: string, field: keyof RecordKertasKerja, val: string) => {
    const key = `${templateId}_${month}`;
    
    setLocalRecords(prev => {
      const existing = prev[key] || {
        template_kertas_kerja_id: templateId,
        month_work: month,
      };
      
      const parsedVal = val === "" ? null : isNaN(Number(val)) ? val : Number(val);
      
      // If the value hasn't changed, don't do anything
      if (existing[field] === parsedVal) {
        return prev;
      }
      
      // Mark as dirty
      setDirtyRecords(dirtyPrev => {
        const dirtyExisting = dirtyPrev[key] || {};
        return {
          ...dirtyPrev,
          [key]: {
            ...dirtyExisting,
            id: existing.id,
            template_kertas_kerja_id: templateId,
            month_work: month,
            [field]: parsedVal
          }
        };
      });

      return {
        ...prev,
        [key]: {
          ...existing,
          [field]: parsedVal
        }
      };
    });
  };

  const handleSave = async () => {
    const payload = Object.values(dirtyRecords);
    if (payload.length === 0) {
      alert("Tidak ada data untuk disimpan.");
      return;
    }
    try {
      await upsertMutation.mutateAsync({ records: payload as RecordKertasKerja[] });
      setDirtyRecords({});
      alert("Perubahan berhasil disimpan!");
    } catch (e: any) {
      alert("Gagal menyimpan: " + e.message);
    }
  };

  const shortYear = String(selectedYear).slice(-2);
  const allMonths = [
    `Jan '${shortYear}`, `Feb '${shortYear}`, `Mar '${shortYear}`, `Apr '${shortYear}`,
    `Mei '${shortYear}`, `Jun '${shortYear}`, `Jul '${shortYear}`, `Agu '${shortYear}`,
    `Sep '${shortYear}`, `Okt '${shortYear}`, `Nov '${shortYear}`, `Des '${shortYear}`,
  ];

  const currentMonthIndex = new Date().getMonth();
  const currentMonth = allMonths[currentMonthIndex] || allMonths[5];

  const displayedMonths = isExpanded ? allMonths : [currentMonth];
  const numMonths = displayedMonths.length;

  const InputCell = ({ 
    defaultValue, 
    onBlur, 
    className = "", 
    readOnly = !canUpdate,
    bgColorClass
  }: { 
    defaultValue: any, 
    onBlur?: (val: string) => void, 
    className?: string, 
    readOnly?: boolean,
    bgColorClass?: string
  }) => {
    const formatValue = (v: any) => {
      if (v == null || v === "") return "";
      const num = Number(v);
      return isNaN(num) ? String(v) : String(num);
    };

    const [val, setVal] = useState(formatValue(defaultValue));
    
    useEffect(() => { 
      setVal(formatValue(defaultValue)); 
    }, [defaultValue]);
    
    return (
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onBlur?.(val as string)}
        readOnly={readOnly}
        placeholder="-"
        className={`w-full min-w-[60px] px-1 py-1 text-xs font-medium border border-transparent hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary rounded outline-none transition-all ${className} ${bgColorClass ? bgColorClass : (readOnly ? "bg-black/5 cursor-default hover:border-transparent focus:border-transparent focus:ring-0 text-gray-700" : "bg-transparent focus:bg-white text-gray-900")}`}
      />
    );
  };

  const getHopColor = (val: any) => {
    const num = Number(val);
    if (isNaN(num) || val === null || val === "" || val === undefined) return "";
    if (num <= 5) return "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 focus:text-white";
    if (num <= 10) return "bg-yellow-300 text-gray-900 hover:bg-yellow-400 focus:bg-yellow-400 focus:text-gray-900";
    return "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 focus:text-white";
  };


const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const unitsToExport = availableUnits.length > 0 ? availableUnits : ["Kertas Kerja"];

    unitsToExport.forEach(unit => {
      const templatesForUnit = availableUnits.length > 0 
        ? filteredTemplates.filter(t => t.unit_name === unit) 
        : filteredTemplates;

      const wsData: any[][] = [];

      const row1 = [
        "NO.", "UNIT PELAKSANA", "JENIS KIT", "PEMBANGKIT", "JENIS BBM", "MODA ANGKUTAN", 
        "TBBM", "", "",
        "TANGKI TIMBUN", "", "", "",
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

      const row2: any[] = [];
      for (let i = 0; i < 6; i++) row2.push("");
      row2.push("NAMA", "JARAK (km)", "Estimasi Pengiriman");
      row2.push("KAP. (kL)", "PEMAKAIAN RATA2 BULAN-1", "FREIGHT COST (Rp)", "HOP (Hari)");
      row2.push("");
      displayedMonths.forEach(() => { row2.push("", "", "", ""); });
      row2.push("TERIMA (kL)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PEMAKAIAN (kL)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("STOK AKHIR BULAN (kL)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("SHOP AKHIR BULAN (Hari)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PESAN (kL)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PROYEKSI SHOP AKHIR BULAN (Hari)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("DELTA TERIMA (kL)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PENCAPAIAN (%)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("PESAN (kL)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("HOP (Hari)"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("");
      row2.push("KETERANGAN"); for (let i = 1; i < numMonths; i++) row2.push("");
      row2.push("DETAIL KETERANGAN"); for (let i = 1; i < numMonths; i++) row2.push("");
      wsData.push(row2);

      const row3: any[] = [];
      for (let i = 0; i < 6; i++) row3.push("");
      row3.push("", "", "Hari");
      row3.push("", "", "", "");
      row3.push("");
      displayedMonths.forEach(() => { row3.push("", "", "", ""); });
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      row3.push("");
      displayedMonths.forEach(m => row3.push(m));
      displayedMonths.forEach(m => row3.push(m));
      wsData.push(row3);

      let excelIdx = 0;
      Object.entries(
        templatesForUnit.reduce((acc, t) => {
          const site = t.upk_name || "Unknown UPK";
          if (!acc[site]) acc[site] = [];
          acc[site].push(t);
          return acc;
        }, {} as Record<string, typeof templatesForUnit>)
      ).forEach(([upkName, siteTemplates]) => {
        
        const getSum = (arr: any[], m: string, field: keyof RecordKertasKerja) => {
          const sum = arr.reduce((s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0), 0);
          return sum === 0 ? "-" : sum;
        };
        
        const getAvg = (arr: any[], m: string, field: keyof RecordKertasKerja) => {
          const sum = arr.reduce((s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0), 0);
          return arr.length === 0 || sum === 0 ? "-" : Number((sum / arr.length).toFixed(2));
        };

        const productsInSite = Array.from(new Set(siteTemplates.map(t => t.product_name || "Unknown Product")));

        productsInSite.forEach((product) => {
          const productTemplates = siteTemplates.filter(t => (t.product_name || "Unknown Product") === product);

          productTemplates.forEach((template) => {
            excelIdx++;
            const trData: any[] = [];
            trData.push(excelIdx);
            trData.push(template.upk_name || "-");
            trData.push(template.kit_name || "-");
            trData.push(template.site_name || "-");
            trData.push(template.product_name || "-");
            trData.push(template.moda_name || "-");
            
            trData.push(template.supplier_name || "-");
            trData.push(template.distance ?? "-");
            trData.push(template.estimated_delivery_time ?? "-");
            
            trData.push(template.site_capacity ?? "-");
            trData.push(template.average_usage ?? "-");
            trData.push(template.freight_costs ?? "-");
            const calcHop = template.site_capacity && template.average_usage ? Math.round(template.site_capacity / template.average_usage) : "-";
            trData.push(calcHop);
            trData.push(template.hop_minimum ?? "-");
            
            displayedMonths.forEach((m) => {
              const rec = localRecords[`${template.id}_${m}`];
              trData.push(rec?.stock ?? "-");
              const calcKet = rec?.stock && template.site_capacity ? ((Number(rec.stock) / template.site_capacity) * 100).toFixed(2) : "-";
              trData.push(calcKet);
              trData.push(rec?.hop ?? "-");
              trData.push(rec?.keterangan_hop_less_than_5 ?? "-");
            });

            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.terima ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.pemakaian ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.stock_akhir_bulan ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.shop_akhir_bulan ?? "-"));
            
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.renominasi_pesan ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.renominaso_proyeksi_akhir_bulan ?? "-"));
            
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.delta_terima ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.pencapaian ?? "-"));
            
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.rencana_pesan ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.rencana_hop ?? "-"));
            
            trData.push("-");
            
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.keterangan ?? "-"));
            displayedMonths.forEach(m => trData.push("-"));
            
            wsData.push(trData);
          });

          const tpData: any[] = [];
          tpData.push("");
          tpData.push(`TOTAL ${product} ${upkName}`);
          for (let i = 0; i < 12; i++) tpData.push("");
          
          displayedMonths.forEach(m => {
            tpData.push(getSum(productTemplates, m, "stock"));
            tpData.push(getAvg(productTemplates, m, "keterisian_tanki"));
            tpData.push(getAvg(productTemplates, m, "hop"));
            tpData.push("-");
          });
          
          displayedMonths.forEach(m => tpData.push(getSum(productTemplates, m, "terima")));
          displayedMonths.forEach(m => tpData.push(getSum(productTemplates, m, "pemakaian")));
          displayedMonths.forEach(m => tpData.push(getSum(productTemplates, m, "stock_akhir_bulan")));
          displayedMonths.forEach(m => tpData.push(getAvg(productTemplates, m, "shop_akhir_bulan")));
          
          displayedMonths.forEach(m => tpData.push(getSum(productTemplates, m, "renominasi_pesan")));
          displayedMonths.forEach(m => tpData.push(getAvg(productTemplates, m, "renominaso_proyeksi_akhir_bulan")));
          
          displayedMonths.forEach(m => tpData.push(getSum(productTemplates, m, "delta_terima")));
          displayedMonths.forEach(m => tpData.push(getAvg(productTemplates, m, "pencapaian")));
          
          displayedMonths.forEach(m => tpData.push(getSum(productTemplates, m, "rencana_pesan")));
          displayedMonths.forEach(m => tpData.push(getAvg(productTemplates, m, "rencana_hop")));
          
          tpData.push("-");
          
          displayedMonths.forEach(m => tpData.push("-"));
          displayedMonths.forEach(m => tpData.push("-"));
          wsData.push(tpData);
        });

        const tsData: any[] = [];
        tsData.push("");
        tsData.push(`TOTAL BBM ${upkName}`);
        for (let i = 0; i < 12; i++) tsData.push("");
        
        displayedMonths.forEach(m => {
          tsData.push(getSum(siteTemplates, m, "stock"));
          tsData.push(getAvg(siteTemplates, m, "keterisian_tanki"));
          tsData.push(getAvg(siteTemplates, m, "hop"));
          tsData.push("-");
        });
        
        displayedMonths.forEach(m => tsData.push(getSum(siteTemplates, m, "terima")));
        displayedMonths.forEach(m => tsData.push(getSum(siteTemplates, m, "pemakaian")));
        displayedMonths.forEach(m => tsData.push(getSum(siteTemplates, m, "stock_akhir_bulan")));
        displayedMonths.forEach(m => tsData.push(getAvg(siteTemplates, m, "shop_akhir_bulan")));
        
        displayedMonths.forEach(m => tsData.push(getSum(siteTemplates, m, "renominasi_pesan")));
        displayedMonths.forEach(m => tsData.push(getAvg(siteTemplates, m, "renominaso_proyeksi_akhir_bulan")));
        
        displayedMonths.forEach(m => tsData.push(getSum(siteTemplates, m, "delta_terima")));
        displayedMonths.forEach(m => tsData.push(getAvg(siteTemplates, m, "pencapaian")));
        
        displayedMonths.forEach(m => tsData.push(getSum(siteTemplates, m, "rencana_pesan")));
        displayedMonths.forEach(m => tsData.push(getAvg(siteTemplates, m, "rencana_hop")));
        
        tsData.push("-");
        
        displayedMonths.forEach(m => tsData.push("-"));
        displayedMonths.forEach(m => tsData.push("-"));
        wsData.push(tsData);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      const merges = [];
      merges.push({ s: { r: 0, c: 0 }, e: { r: 2, c: 0 } });
      merges.push({ s: { r: 0, c: 1 }, e: { r: 2, c: 1 } });
      merges.push({ s: { r: 0, c: 2 }, e: { r: 2, c: 2 } });
      merges.push({ s: { r: 0, c: 3 }, e: { r: 2, c: 3 } });
      merges.push({ s: { r: 0, c: 4 }, e: { r: 2, c: 4 } });
      merges.push({ s: { r: 0, c: 5 }, e: { r: 2, c: 5 } });
      merges.push({ s: { r: 0, c: 6 }, e: { r: 0, c: 8 } });
      merges.push({ s: { r: 0, c: 9 }, e: { r: 0, c: 12 } });
      merges.push({ s: { r: 0, c: 13 }, e: { r: 2, c: 13 } });
      if (merges.length > 0) ws["!merges"] = merges;

      const safeSheetName = unit.substring(0, 31).replace(/[\\/*?:\[\]]/g, '');
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName || "Kertas Kerja");
    });

    const today = new Date().toISOString().split("T")[0];
    const regionName = selectedRegion ? selectedRegion.replace(/\s+/g, "_") : "All_Region";
    XLSX.writeFile(wb, `Kertas_Kerja_BBM_${regionName}_${today}.xlsx`);
  };


  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a1" });
    let isFirst = true;
    const unitsToExport = availableUnits.length > 0 ? availableUnits : ["Kertas Kerja"];

    unitsToExport.forEach(unit => {
      const templatesForUnit = availableUnits.length > 0 
        ? filteredTemplates.filter(t => t.unit_name === unit) 
        : filteredTemplates;

      if (templatesForUnit.length === 0) return;

      const numMonths = displayedMonths.length;
      const wsData: any[][] = [];

      const row1: any[] = [
        { content: "No.", rowSpan: 3 },
        { content: "UNIT PELAKSANA", rowSpan: 3 },
        { content: "JENIS KIT", rowSpan: 3 },
        { content: "PEMBANGKIT", rowSpan: 3 },
        { content: "JENIS BBM", rowSpan: 3 },
        { content: "MODA ANGKUTAN", rowSpan: 3 },
        { content: "TBBM", rowSpan: 3 },
        { content: "JARAK (km)", rowSpan: 3 },
        { content: "Estimasi Pengiriman", rowSpan: 3 },
        { content: "TANGKI TIMBUN", rowSpan: 3 },
        { content: "PEMAKAIAN RATA2 BULAN-1", rowSpan: 3 },
        { content: "FREIGHT COST (Rp)", rowSpan: 3 },
        { content: "HOP (Hari)", rowSpan: 3 },
        { content: "HOP MINIMUM", rowSpan: 3 }
      ];
      displayedMonths.forEach(m => {
        row1.push({ content: `STOK ${m} (kL)`, rowSpan: 3 });
        row1.push({ content: `KETERISIAN TANGKI (%)`, rowSpan: 3 });
        row1.push({ content: `HOP ${m} (Hari)`, rowSpan: 3 });
        row1.push({ content: `KETERANGAN HOP < HOP MIN`, rowSpan: 3 });
      });
      row1.push({ content: "REALISASI (SAP)", colSpan: 4 * numMonths, styles: { halign: 'center', fillColor: [0, 150, 136] } });
      row1.push({ content: "RENOMINASI/KONFIRMASI", colSpan: 2 * numMonths, styles: { halign: 'center', fillColor: [63, 81, 181] } });
      row1.push({ content: "DELTA (REAL - KONF)", colSpan: 2 * numMonths, styles: { halign: 'center', fillColor: [244, 67, 54] } });
      row1.push({ content: "RENCANA (PROGNOSA)", colSpan: 2 * numMonths, styles: { halign: 'center', fillColor: [3, 169, 244] } });
      row1.push({ content: "POLA OPERASI", rowSpan: 3 });
      row1.push({ content: "KETERANGAN", colSpan: 2 * numMonths, styles: { halign: 'center' } });
      wsData.push(row1);

      const row2: any[] = [];
      displayedMonths.forEach(() => { row2.push("", "", "", ""); });
      row2.push({ content: "TERIMA (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [0, 150, 136] } });
      row2.push({ content: "PEMAKAIAN (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [0, 150, 136] } });
      row2.push({ content: "STOK AKHIR BULAN (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [0, 150, 136] } });
      row2.push({ content: "SHOP AKHIR BULAN (Hari)", colSpan: numMonths, styles: { halign: 'center', fillColor: [0, 150, 136] } });
      row2.push({ content: "PESAN (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [63, 81, 181] } });
      row2.push({ content: "PROYEKSI SHOP AKHIR BULAN (Hari)", colSpan: numMonths, styles: { halign: 'center', fillColor: [63, 81, 181] } });
      row2.push({ content: "DELTA TERIMA (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [244, 67, 54] } });
      row2.push({ content: "PENCAPAIAN (%)", colSpan: numMonths, styles: { halign: 'center', fillColor: [244, 67, 54] } });
      row2.push({ content: "PESAN (kL)", colSpan: numMonths, styles: { halign: 'center', fillColor: [3, 169, 244] } });
      row2.push({ content: "HOP (Hari)", colSpan: numMonths, styles: { halign: 'center', fillColor: [3, 169, 244] } });
      row2.push({ content: "KETERANGAN", colSpan: numMonths, styles: { halign: 'center' } });
      row2.push({ content: "DETAIL KETERANGAN", colSpan: numMonths, styles: { halign: 'center' } });
      wsData.push(row2);

      const row3: any[] = [];
      displayedMonths.forEach(() => { row3.push("", "", "", ""); });
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      displayedMonths.forEach(m => row3.push({ content: m, styles: { halign: 'center', fillColor: [200, 200, 200], textColor: [0,0,0] } }));
      wsData.push(row3);

      let excelIdx = 0;
      const bodyData: any[][] = [];

      Object.entries(
        templatesForUnit.reduce((acc, t) => {
          const site = t.upk_name || "Unknown UPK";
          if (!acc[site]) acc[site] = [];
          acc[site].push(t);
          return acc;
        }, {} as Record<string, typeof templatesForUnit>)
      ).forEach(([upkName, siteTemplates]) => {
        
        const getSum = (arr: any[], m: string, field: keyof RecordKertasKerja) => {
          const sum = arr.reduce((s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0), 0);
          return sum === 0 ? "-" : sum;
        };
        
        const getAvg = (arr: any[], m: string, field: keyof RecordKertasKerja) => {
          const sum = arr.reduce((s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0), 0);
          return arr.length === 0 || sum === 0 ? "-" : Number((sum / arr.length).toFixed(2));
        };

        const productsInSite = Array.from(new Set(siteTemplates.map(t => t.product_name || "Unknown Product")));

        productsInSite.forEach((product) => {
          const productTemplates = siteTemplates.filter(t => (t.product_name || "Unknown Product") === product);

          productTemplates.forEach((template) => {
            excelIdx++;
            const trData: any[] = [];
            trData.push(excelIdx);
            trData.push(template.upk_name || "-");
            trData.push(template.kit_name || "-");
            trData.push(template.site_name || "-");
            trData.push(template.product_name || "-");
            trData.push(template.moda_name || "-");
            
            trData.push(template.supplier_name || "-");
            trData.push(template.distance ?? "-");
            trData.push(template.estimated_delivery_time ?? "-");
            
            trData.push(template.site_capacity ?? "-");
            trData.push(template.average_usage ?? "-");
            trData.push(template.freight_costs ?? "-");
            const calcHop = template.site_capacity && template.average_usage ? Math.round(template.site_capacity / template.average_usage) : "-";
            trData.push(calcHop);
            trData.push(template.hop_minimum ?? "-");
            
            displayedMonths.forEach((m) => {
              const rec = localRecords[`${template.id}_${m}`];
              trData.push(rec?.stock ?? "-");
              const calcKet = rec?.stock && template.site_capacity ? ((Number(rec.stock) / template.site_capacity) * 100).toFixed(2) : "-";
              trData.push(calcKet);
              trData.push(rec?.hop ?? "-");
              trData.push(rec?.keterangan_hop_less_than_5 ?? "-");
            });

            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.terima ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.pemakaian ?? "-"));
            
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.stock_akhir_bulan ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.shop_akhir_bulan ?? "-"));
            
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.renominasi_pesan ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.renominaso_proyeksi_akhir_bulan ?? "-"));
            
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.delta_terima ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.pencapaian ?? "-"));
            
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.rencana_pesan ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.rencana_hop ?? "-"));
            
            const polaId = localRecords[`${template.id}_${displayedMonths[0]}`]?.master_pola_id;
            const polaName = polaOperasiList.find(p => p.id === polaId)?.name || "-";
            trData.push(polaName);
            
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.keterangan ?? "-"));
            displayedMonths.forEach(m => trData.push(localRecords[`${template.id}_${m}`]?.detail_keterangan ?? "-"));

            bodyData.push(trData);
          });

          const tsData: any[] = [];
          tsData.push({ content: "TOTAL S.D", colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } });
          tsData.push(upkName || "-");
          tsData.push("", product, "", "", "", "", "");
          
          const sumCap = siteTemplates.reduce((s, t) => s + (t.site_capacity || 0), 0);
          const sumUsage = siteTemplates.reduce((s, t) => s + (t.average_usage || 0), 0);
          tsData.push(sumCap > 0 ? sumCap : "-");
          tsData.push(sumUsage > 0 ? sumUsage : "-");
          tsData.push("-");
          tsData.push(sumCap > 0 && sumUsage > 0 ? Math.round(sumCap / sumUsage) : "-");
          tsData.push("-");

          displayedMonths.forEach((m) => {
            const sStok = getSum(productTemplates, m, "stock");
            tsData.push(sStok);
            const calcKet = sStok !== "-" && sumCap > 0 ? ((Number(sStok) / sumCap) * 100).toFixed(2) : "-";
            tsData.push(calcKet);
            tsData.push(getAvg(productTemplates, m, "hop"));
            tsData.push("-");
          });

          displayedMonths.forEach(m => tsData.push(getSum(productTemplates, m, "terima")));
          displayedMonths.forEach(m => tsData.push(getSum(productTemplates, m, "pemakaian")));
          displayedMonths.forEach(m => tsData.push(getSum(productTemplates, m, "stock_akhir_bulan")));
          displayedMonths.forEach(m => tsData.push(getAvg(productTemplates, m, "shop_akhir_bulan")));
          displayedMonths.forEach(m => tsData.push(getSum(productTemplates, m, "renominasi_pesan")));
          displayedMonths.forEach(m => tsData.push(getAvg(productTemplates, m, "renominaso_proyeksi_akhir_bulan")));
          displayedMonths.forEach(m => tsData.push(getSum(productTemplates, m, "delta_terima")));
          displayedMonths.forEach(m => tsData.push(getAvg(productTemplates, m, "pencapaian")));
          displayedMonths.forEach(m => tsData.push(getSum(productTemplates, m, "rencana_pesan")));
          displayedMonths.forEach(m => tsData.push(getAvg(productTemplates, m, "rencana_hop")));
          
          tsData.push("-");
          
          displayedMonths.forEach(m => tsData.push("-"));
          displayedMonths.forEach(m => tsData.push("-"));
          bodyData.push(tsData);
        });
        
        const totData: any[] = [];
        totData.push({ content: "TOTAL", colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } });
        totData.push(upkName || "-", "", "", "", "", "", "", "");
        
        const sumCap = siteTemplates.reduce((s, t) => s + (t.site_capacity || 0), 0);
        const sumUsage = siteTemplates.reduce((s, t) => s + (t.average_usage || 0), 0);
        totData.push(sumCap > 0 ? sumCap : "-");
        totData.push(sumUsage > 0 ? sumUsage : "-");
        totData.push("-");
        totData.push(sumCap > 0 && sumUsage > 0 ? Math.round(sumCap / sumUsage) : "-");
        totData.push("-");

        displayedMonths.forEach((m) => {
          const sStok = getSum(siteTemplates, m, "stock");
          totData.push(sStok);
          const calcKet = sStok !== "-" && sumCap > 0 ? ((Number(sStok) / sumCap) * 100).toFixed(2) : "-";
          totData.push(calcKet);
          totData.push(getAvg(siteTemplates, m, "hop"));
          totData.push("-");
        });

        displayedMonths.forEach(m => totData.push(getSum(siteTemplates, m, "terima")));
        displayedMonths.forEach(m => totData.push(getSum(siteTemplates, m, "pemakaian")));
        displayedMonths.forEach(m => totData.push(getSum(siteTemplates, m, "stock_akhir_bulan")));
        displayedMonths.forEach(m => totData.push(getAvg(siteTemplates, m, "shop_akhir_bulan")));
        displayedMonths.forEach(m => totData.push(getSum(siteTemplates, m, "renominasi_pesan")));
        displayedMonths.forEach(m => totData.push(getAvg(siteTemplates, m, "renominaso_proyeksi_akhir_bulan")));
        displayedMonths.forEach(m => totData.push(getSum(siteTemplates, m, "delta_terima")));
        displayedMonths.forEach(m => totData.push(getAvg(siteTemplates, m, "pencapaian")));
        displayedMonths.forEach(m => totData.push(getSum(siteTemplates, m, "rencana_pesan")));
        displayedMonths.forEach(m => totData.push(getAvg(siteTemplates, m, "rencana_hop")));
        
        totData.push("-");
        
        displayedMonths.forEach(m => totData.push("-"));
        displayedMonths.forEach(m => totData.push("-"));
        bodyData.push(totData);
      });

      if (!isFirst) doc.addPage();
      isFirst = false;

      doc.setFontSize(14);
      doc.text(`Kertas Kerja - Unit ${unit}`, 40, 40);

      autoTable(doc, {
        startY: 50,
        head: [wsData[0], wsData[1], wsData[2]],
        body: bodyData,
        theme: 'grid',
        styles: { fontSize: 5, cellPadding: 2, halign: 'center', textColor: [50, 50, 50] },
        headStyles: { textColor: 255, fontStyle: 'bold' },
        margin: { top: 50, left: 20, right: 20 },
      });
    });

    const today = new Date().toISOString().split("T")[0];
    const regionName = selectedRegion ? selectedRegion.replace(/\s+/g, "_") : "All_Region";
    doc.save(`Kertas_Kerja_BBM_${regionName}_${today}.pdf`);
  };
  let globalIdx = 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col w-full h-full min-h-0 shadow-sm">
      <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-primary to-primary-dark flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-sm">
        
        <div className="flex flex-col gap-1.5 bg-white/10 rounded p-2 border border-white/20">
          <span className="text-white text-xs font-bold leading-none">Keterangan:</span>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3 bg-red-500 border border-black/10 rounded-sm"></div>
              <span className="text-white text-xs font-medium">: HOP &le;5 Hari</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3 bg-yellow-300 border border-black/10 rounded-sm"></div>
              <span className="text-white text-xs font-medium">: HOP &gt;5 - 10 Hari</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3 bg-green-500 border border-black/10 rounded-sm"></div>
              <span className="text-white text-xs font-medium">: HOP &gt;10 Hari</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors shadow-sm font-semibold"
          >
            {showInactive ? <EyeOff size={14} /> : <Eye size={14} />}
            {showInactive ? "Sembunyikan Non-Aktif" : "Tampilkan Non-Aktif"}
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-rose-400 hover:bg-rose-50 border border-gray-200 rounded-md transition-colors shadow-sm font-bold"
          >
            <FileText size={16} /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-emerald-500 hover:bg-emerald-50 border border-gray-200 rounded-md transition-colors shadow-sm font-bold"
          >
            <Download size={16} /> Export Excel
          </button>
          <button
            onClick={handleSave}
            disabled={upsertMutation.isPending || isLoading || !isDirty || !canUpdate}
            className={`flex items-center gap-2 px-4 py-2 text-sm bg-white rounded-md transition-colors shadow-sm font-bold ${!canUpdate ? 'hidden' : 'text-primary hover:bg-slate-50 disabled:opacity-70'}`}
          >
            {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Save size={16} />}
            {upsertMutation.isPending ? "Menyimpan..." : isDirty ? "Simpan Perubahan*" : "Simpan Perubahan"}
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

      <div className="overflow-auto custom-scrollbar flex-1 w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : null}
        <table className="w-full border-collapse text-xs text-center min-w-max">
          <thead className="sticky top-0 z-30 shadow-sm">
            {/* Row 1 */}
            <tr className="bg-slate-50 text-slate-700">
              <th className="border border-slate-200 p-2 font-bold sticky left-0 z-40 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase text-[10px] w-[40px] min-w-[40px] max-w-[40px]" rowSpan={3}>
                NO.
              </th>
              <th className="border border-slate-200 p-2 font-bold sticky left-[40px] z-40 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase text-[10px] w-[150px] min-w-[150px] max-w-[150px]" rowSpan={3}>
                UNIT PELAKSANA
              </th>
              <th className="border border-slate-200 p-2 font-bold sticky left-[190px] z-40 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase text-[10px] w-[90px] min-w-[90px] max-w-[90px]" rowSpan={3}>
                JENIS KIT
              </th>
              <th className="border border-slate-200 p-2 font-bold sticky left-[280px] z-40 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase text-[10px] w-[180px] min-w-[180px] max-w-[180px]" rowSpan={3}>
                PEMBANGKIT
              </th>
              <th className="border border-slate-200 p-2 font-bold uppercase text-[10px]" rowSpan={3}>
                JENIS BBM
              </th>
              <th className="border border-slate-200 p-2 font-bold uppercase text-[10px]" rowSpan={3}>
                MODA ANGKUTAN
              </th>
              <th className="border border-slate-200 p-2 font-bold uppercase text-[10px] bg-slate-100" colSpan={3}>
                TBBM
              </th>
              <th className="border border-slate-200 p-2 font-bold uppercase text-[10px] bg-slate-100" colSpan={4}>
                TANGKI TIMBUN
              </th>
              <th className="border border-slate-200 p-2 font-bold uppercase text-[10px]" rowSpan={3}>
                HOP MINIMUM
              </th>
              
              {/* Group column per month (Stok, Keterisian, dsb) */}
              {displayedMonths.map((month, i) => (
                <React.Fragment key={`group-1-${i}`}>
                  <th className="border border-slate-200 p-2 font-bold bg-amber-50/80 text-amber-900 border-t-2 border-t-amber-400 uppercase text-[10px]" rowSpan={3}>
                    STOK<br />{month}<br />(kL)
                  </th>
                  <th className="border border-slate-200 p-2 font-bold bg-amber-50/80 text-amber-900 border-t-2 border-t-amber-400 uppercase text-[10px]" rowSpan={3}>
                    KETERISIAN TANGKI<br />(%)
                  </th>
                  <th className="border border-slate-200 p-2 font-bold bg-amber-50/80 text-amber-900 border-t-2 border-t-amber-400 uppercase text-[10px]" rowSpan={3}>
                    HOP<br />{month}<br />(Hari)
                  </th>
                  <th className="border border-slate-200 p-2 font-bold bg-amber-50/80 text-amber-900 border-t-2 border-t-amber-400 uppercase text-[10px]" rowSpan={3}>
                    KETERANGAN<br />HOP &lt; HOP MIN
                  </th>
                </React.Fragment>
              ))}

              <th className="border border-slate-200 p-2 font-bold bg-teal-50/80 text-teal-900 border-t-2 border-t-teal-400 uppercase text-[10px]" colSpan={4 * numMonths}>
                REALISASI (SAP)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-indigo-50/80 text-indigo-900 border-t-2 border-t-indigo-400 uppercase text-[10px]" colSpan={2 * numMonths}>
                RENOMINASI/KONFIRMASI
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-rose-50/80 text-rose-900 border-t-2 border-t-rose-400 uppercase text-[10px]" colSpan={2 * numMonths}>
                DELTA (REAL - KONF)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-sky-50/80 text-sky-900 border-t-2 border-t-sky-400 uppercase text-[10px]" colSpan={2 * numMonths}>
                RENCANA (PROGNOSA)
              </th>
              <th className="border border-slate-200 p-2 font-bold uppercase text-[10px]" rowSpan={3}>
                POLA OPERASI
              </th>
              <th className="border border-slate-200 p-2 font-bold uppercase text-[10px]" colSpan={2 * numMonths}>
                KETERANGAN
              </th>
            </tr>

            {/* Row 2 */}
            <tr className="bg-slate-50 text-slate-700 uppercase text-[10px]">
              {/* TBBM Children */}
              <th className="border border-slate-200 p-2 font-bold bg-slate-100" rowSpan={2}>
                NAMA
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-slate-100" rowSpan={2}>
                JARAK<br />(km)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-slate-100" colSpan={1}>
                Estimasi Pengiriman
              </th>
              {/* Tangki Timbun Children */}
              <th className="border border-slate-200 p-2 font-bold bg-slate-100" rowSpan={2}>
                KAP.<br />(kL)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-slate-100" rowSpan={2}>
                PEMAKAIAN RATA2<br />BULAN-1
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-slate-100" rowSpan={2}>
                FREIGHT COST<br />(Rp)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-slate-100" rowSpan={2}>
                HOP<br />(Hari)
              </th>

              {/* Realisasi Children */}
              <th className="border border-slate-200 p-2 font-bold bg-teal-50/50 text-teal-800" colSpan={numMonths}>
                TERIMA (kL)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-teal-50/50 text-teal-800" colSpan={numMonths}>
                PEMAKAIAN (kL)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-teal-50/50 text-teal-800" colSpan={numMonths}>
                STOK AKHIR BULAN (kL)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-teal-50/50 text-teal-800" colSpan={numMonths}>
                SHOP AKHIR BULAN (Hari)
              </th>

              {/* Renominasi Children */}
              <th className="border border-slate-200 p-2 font-bold bg-indigo-50/50 text-indigo-800" colSpan={numMonths}>
                PESAN (kL)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-indigo-50/50 text-indigo-800" colSpan={numMonths}>
                PROYEKSI SHOP AKHIR BULAN (Hari)
              </th>

              {/* Delta Children */}
              <th className="border border-slate-200 p-2 font-bold bg-rose-50/50 text-rose-800" colSpan={numMonths}>
                DELTA TERIMA (kL)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-rose-50/50 text-rose-800" colSpan={numMonths}>
                PENCAPAIAN (%)
              </th>

              {/* Rencana Children */}
              <th className="border border-slate-200 p-2 font-bold bg-sky-50/50 text-sky-800" colSpan={numMonths}>
                PESAN (kL)
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-sky-50/50 text-sky-800" colSpan={numMonths}>
                HOP (Hari)
              </th>

              {/* Keterangan Children */}
              <th className="border border-slate-200 p-2 font-bold" colSpan={numMonths}>
                KETERANGAN
              </th>
              <th className="border border-slate-200 p-2 font-bold" colSpan={numMonths}>
                DETAIL KETERANGAN
              </th>
            </tr>

            {/* Row 3 */}
            <tr className="bg-slate-50 text-slate-600 uppercase text-[9px]">
              {/* TBBM Hari */}
              <th className="border border-slate-200 p-1 font-semibold bg-slate-100">
                Hari
              </th>
              
              {/* Realisasi Months */}
              {displayedMonths.map((m, i) => <th key={`r-t-${i}`} className="border border-slate-200 p-1 bg-teal-50/30 text-teal-700">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`r-p-${i}`} className="border border-slate-200 p-1 bg-teal-50/30 text-teal-700">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`r-sa-${i}`} className="border border-slate-200 p-1 bg-teal-50/30 text-teal-700">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`r-sh-${i}`} className="border border-slate-200 p-1 bg-teal-50/30 text-teal-700">{m}</th>)}
              
              {/* Renominasi Months */}
              {displayedMonths.map((m, i) => <th key={`rn-p-${i}`} className="border border-slate-200 p-1 bg-indigo-50/30 text-indigo-700">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`rn-pr-${i}`} className="border border-slate-200 p-1 bg-indigo-50/30 text-indigo-700">{m}</th>)}

              {/* Delta Months */}
              {displayedMonths.map((m, i) => <th key={`d-t-${i}`} className="border border-slate-200 p-1 bg-rose-50/30 text-rose-700">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`d-p-${i}`} className="border border-slate-200 p-1 bg-rose-50/30 text-rose-700">{m}</th>)}

              {/* Rencana Months */}
              {displayedMonths.map((m, i) => <th key={`rc-p-${i}`} className="border border-slate-200 p-1 bg-sky-50/30 text-sky-700">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`rc-h-${i}`} className="border border-slate-200 p-1 bg-sky-50/30 text-sky-700">{m}</th>)}

              {/* Keterangan Months */}
              {displayedMonths.map((m, i) => <th key={`k-k-${i}`} className="border border-slate-200 p-1">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`k-d-${i}`} className="border border-slate-200 p-1">{m}</th>)}
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {Object.entries(
              displayedTemplates.reduce((acc, t) => {
                  const site = t.upk_name || "Unknown UPK";
                  if (!acc[site]) acc[site] = [];
                  acc[site].push(t);
                  return acc;
                }, {} as Record<string, typeof displayedTemplates>)
              ).map(([upkName, siteTemplates]) => {
                const productsInSite = Array.from(new Set(siteTemplates.map(t => t.product_name || "Unknown Product")));
                
                const getSum = (arr: typeof displayedTemplates, m: string, field: keyof RecordKertasKerja) => {
                  const sum = arr.reduce((s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0), 0);
                  return sum === 0 ? "-" : sum;
                };
                
                const getAvg = (arr: typeof displayedTemplates, m: string, field: keyof RecordKertasKerja) => {
                  const sum = arr.reduce((s, t) => s + (Number(localRecords[`${t.id}_${m}`]?.[field]) || 0), 0);
                  return arr.length === 0 || sum === 0 ? "-" : Number((sum / arr.length).toFixed(2));
                };

                return (
                  <React.Fragment key={`group-${upkName}`}>
                    {siteTemplates.map((template, idx) => {
                      globalIdx++;
                      return (
                        <tr key={template.id} className={`border-b border-slate-200 transition-colors ${template.is_active === false ? 'bg-amber-100 hover:bg-amber-200/80' : 'hover:bg-slate-50'}`}>
                          <td className={`border-r border-slate-200 p-1 sticky left-0 z-10 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] ${template.is_active === false ? 'bg-amber-100' : 'bg-white'}`}>
                            <InputCell defaultValue={globalIdx} readOnly className="text-center font-medium" />
                          </td>
                      <td className={`border-r border-slate-200 p-1 sticky left-[40px] z-10 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] ${template.is_active === false ? 'bg-amber-100' : 'bg-white'}`}>
                        <InputCell defaultValue={template.upk_name || "-"} readOnly className="text-left font-medium" />
                      </td>
                      <td className={`border-r border-slate-200 p-1 sticky left-[190px] z-10 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] ${template.is_active === false ? 'bg-amber-100' : 'bg-white'}`}>
                        <InputCell defaultValue={template.kit_name || "-"} readOnly className="text-left" />
                      </td>
                      <td className={`border-r border-slate-200 p-1 sticky left-[280px] z-10 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] ${template.is_active === false ? 'bg-amber-100' : 'bg-white'}`}>
                        <InputCell defaultValue={template.site_name || "-"} readOnly className="text-left font-semibold text-slate-800" />
                      </td>
                      <td className="border-r border-slate-200 p-1">
                        <InputCell defaultValue={template.product_name || "-"} readOnly className="text-center w-[80px]" />
                      </td>
                      <td className="border border-gray-200 p-1">
                        <InputCell defaultValue={template.moda_name || "-"} readOnly className="text-center w-[80px]" />
                      </td>
                      
                      <td className="border border-gray-200 p-1">
                        <InputCell defaultValue={template.supplier_name || "-"} readOnly className="text-left w-[150px]" />
                      </td>
                      <td className="border border-gray-200 p-1">
                        <InputCell defaultValue={template.distance} readOnly className="text-center" />
                      </td>
                      <td className="border border-gray-200 p-1">
                        <InputCell defaultValue={template.estimated_delivery_time} readOnly className="text-center" />
                      </td>
                      
                      <td className="border border-gray-200 p-1">
                        <InputCell defaultValue={template.site_capacity ?? "-"} readOnly className="text-right" />
                      </td>
                      <td className="border border-gray-200 p-1">
                        <InputCell defaultValue={template.average_usage ?? "-"} readOnly className="text-right" />
                      </td>
                      <td className="border border-gray-200 p-1">
                        <InputCell 
                          defaultValue={template.freight_costs !== null && template.freight_costs !== undefined ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(template.freight_costs) : "-"} 
                          readOnly 
                          className="text-right" 
                        />
                      </td>
                      <td className="border border-gray-200 p-1">
                        <InputCell 
                          defaultValue={
                            template.site_capacity && template.average_usage 
                              ? Math.round(template.site_capacity / template.average_usage) 
                              : "-"
                          } 
                          readOnly 
                          className="text-right text-gray-700" 
                        />
                      </td>
                      <td className={`border border-gray-200 p-1 ${template.is_active === false ? '' : 'bg-green-50'}`}>
                        <InputCell defaultValue={template.hop_minimum} readOnly className="text-center font-bold text-green-700 bg-transparent" />
                      </td>
                      
                      {displayedMonths.map((m) => {
                        const rec = localRecords[`${template.id}_${m}`];
                        return (
                          <React.Fragment key={`g1-${m}`}>
                            <td className="border border-gray-200 p-1">
                              <InputCell defaultValue={rec?.stock} onBlur={(v) => handleRecordChange(template.id, m, "stock", v)} className="text-right" />
                            </td>
                            <td className="border border-gray-200 p-1">
                              <InputCell 
                                defaultValue={
                                  rec?.stock && template.site_capacity 
                                    ? ((Number(rec.stock) / template.site_capacity) * 100).toFixed(2)
                                    : "-"
                                } 
                                readOnly 
                                className="text-right text-gray-700"
                              />
                            </td>
                            <td className="border border-gray-200 p-1">
                              <InputCell defaultValue={rec?.hop} onBlur={(v) => handleRecordChange(template.id, m, "hop", v)} className="text-right" bgColorClass={getHopColor(rec?.hop)} />
                            </td>
                            <td className="border border-gray-200 p-1">
                              <InputCell defaultValue={rec?.keterangan_hop_less_than_5} onBlur={(v) => handleRecordChange(template.id, m, "keterangan_hop_less_than_5", v)} />
                            </td>
                          </React.Fragment>
                        )
                      })}

                      {displayedMonths.map(m => (
                        <td key={`r-t-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.terima} onBlur={(v) => handleRecordChange(template.id, m, "terima", v)} className="text-right" />
                        </td>
                      ))}
                      {displayedMonths.map(m => (
                        <td key={`r-p-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.pemakaian} onBlur={(v) => handleRecordChange(template.id, m, "pemakaian", v)} className="text-right" />
                        </td>
                      ))}
                      {displayedMonths.map(m => (
                        <td key={`r-s-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.stock_akhir_bulan} onBlur={(v) => handleRecordChange(template.id, m, "stock_akhir_bulan", v)} className="text-right" />
                        </td>
                      ))}
                      {displayedMonths.map(m => (
                        <td key={`r-sh-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.shop_akhir_bulan} onBlur={(v) => handleRecordChange(template.id, m, "shop_akhir_bulan", v)} className="text-right" bgColorClass={getHopColor(localRecords[`${template.id}_${m}`]?.shop_akhir_bulan)} />
                        </td>
                      ))}

                      {displayedMonths.map(m => (
                        <td key={`rn-p-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.renominasi_pesan} onBlur={(v) => handleRecordChange(template.id, m, "renominasi_pesan", v)} className="text-right" />
                        </td>
                      ))}
                      {displayedMonths.map(m => (
                        <td key={`rn-pr-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.renominaso_proyeksi_akhir_bulan} onBlur={(v) => handleRecordChange(template.id, m, "renominaso_proyeksi_akhir_bulan", v)} className="text-right" />
                        </td>
                      ))}

                      {displayedMonths.map(m => (
                        <td key={`d-t-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.delta_terima} onBlur={(v) => handleRecordChange(template.id, m, "delta_terima", v)} className="text-right" />
                        </td>
                      ))}
                      {displayedMonths.map(m => (
                        <td key={`d-p-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.pencapaian} onBlur={(v) => handleRecordChange(template.id, m, "pencapaian", v)} className="text-right" />
                        </td>
                      ))}

                      {displayedMonths.map(m => (
                        <td key={`rc-p-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.rencana_pesan} onBlur={(v) => handleRecordChange(template.id, m, "rencana_pesan", v)} className="text-right" />
                        </td>
                      ))}
                      {displayedMonths.map(m => (
                        <td key={`rc-h-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.rencana_hop} onBlur={(v) => handleRecordChange(template.id, m, "rencana_hop", v)} className="text-right" bgColorClass={getHopColor(localRecords[`${template.id}_${m}`]?.rencana_hop)} />
                        </td>
                      ))}

                      <td className="border border-gray-200 p-1 text-center">
                        <select
                          className="w-full min-w-[100px] px-1 py-1 text-xs font-medium border border-transparent hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary rounded outline-none transition-all bg-transparent focus:bg-white text-gray-900"
                          value={localRecords[`${template.id}_${displayedMonths[0]}`]?.master_pola_id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            displayedMonths.forEach(m => {
                              handleRecordChange(template.id, m, "master_pola_id", val);
                            });
                          }}
                          disabled={!canUpdate}
                        >
                          <option value="">-</option>
                          {polaOperasiList.map((pola) => (
                            <option key={pola.id} value={pola.id}>
                              {pola.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {displayedMonths.map(m => (
                        <td key={`k-k-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.keterangan} onBlur={(v) => handleRecordChange(template.id, m, "keterangan", v)} className="text-left w-full min-w-[120px]" />
                        </td>
                      ))}
                      {displayedMonths.map(m => (
                        <td key={`k-d-${m}`} className="border border-gray-200 p-1">
                          <InputCell defaultValue={localRecords[`${template.id}_${m}`]?.detail_keterangan} onBlur={(v) => handleRecordChange(template.id, m, "detail_keterangan", v)} className="text-left w-full min-w-[120px]" />
                        </td>
                      ))}
                    </tr>
                    );
                  })}
                  
                  {/* Total per Product */}
                  {productsInSite.map((product, pIdx) => {
                    const productTemplates = siteTemplates.filter(t => (t.product_name || "Unknown Product") === product);
                    return (
                      <tr key={`tot-${upkName}-${product}`} className="bg-teal-50/50 text-teal-900 font-bold border-b border-teal-200">
                        <td className="border-r border-teal-200 p-1.5 sticky left-0 z-10 bg-teal-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] text-center">{String.fromCharCode(65 + pIdx)}</td>
                        <td className="border-r border-teal-200 p-1.5 sticky left-[40px] z-10 bg-teal-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] text-left" colSpan={3}>
                          TOTAL {product} {upkName}
                        </td>
                        <td className="border-r border-teal-200 p-1.5 text-center" colSpan={10}>-</td>
                        
                        {displayedMonths.map(m => (
                          <React.Fragment key={`tot-g1-${m}`}>
                            <td className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getSum(productTemplates, m, "stock")}</td>
                            <td className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getAvg(productTemplates, m, "keterisian_tanki")}</td>
                            <td className={`border-r border-teal-200 p-1.5 text-right tabular-nums ${getHopColor(getAvg(productTemplates, m, "hop"))}`}>{getAvg(productTemplates, m, "hop")}</td>
                            <td className="border-r border-teal-200 p-1.5 text-center">-</td>
                          </React.Fragment>
                        ))}
                        
                        {displayedMonths.map(m => <td key={`tot-rt-${m}`} className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getSum(productTemplates, m, "terima")}</td>)}
                        {displayedMonths.map(m => <td key={`tot-rp-${m}`} className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getSum(productTemplates, m, "pemakaian")}</td>)}
                        {displayedMonths.map(m => <td key={`tot-rs-${m}`} className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getSum(productTemplates, m, "stock_akhir_bulan")}</td>)}
                        {displayedMonths.map(m => <td key={`tot-rsh-${m}`} className={`border-r border-teal-200 p-1.5 text-right tabular-nums ${getHopColor(getAvg(productTemplates, m, "shop_akhir_bulan"))}`}>{getAvg(productTemplates, m, "shop_akhir_bulan")}</td>)}
                        
                        {displayedMonths.map(m => <td key={`tot-rnp-${m}`} className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getSum(productTemplates, m, "renominasi_pesan")}</td>)}
                        {displayedMonths.map(m => <td key={`tot-rnpr-${m}`} className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getAvg(productTemplates, m, "renominaso_proyeksi_akhir_bulan")}</td>)}
                        
                        {displayedMonths.map(m => <td key={`tot-dt-${m}`} className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getSum(productTemplates, m, "delta_terima")}</td>)}
                        {displayedMonths.map(m => <td key={`tot-dp-${m}`} className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getAvg(productTemplates, m, "pencapaian")}</td>)}
                        
                        {displayedMonths.map(m => <td key={`tot-rcp-${m}`} className="border-r border-teal-200 p-1.5 text-right tabular-nums">{getSum(productTemplates, m, "rencana_pesan")}</td>)}
                        {displayedMonths.map(m => <td key={`tot-rch-${m}`} className={`border-r border-teal-200 p-1.5 text-right tabular-nums ${getHopColor(getAvg(productTemplates, m, "rencana_hop"))}`}>{getAvg(productTemplates, m, "rencana_hop")}</td>)}
                        
                        <td className="border-r border-teal-200 p-1.5 text-center">-</td>
                        
                        {displayedMonths.map(m => <td key={`tot-kk-${m}`} className="border-r border-teal-200 p-1.5 text-center">-</td>)}
                        {displayedMonths.map(m => <td key={`tot-kd-${m}`} className="border-r border-teal-200 p-1.5 text-center">-</td>)}
                      </tr>
                    );
                  })}
                  
                  {/* Total Site (All Products) */}
                  <tr className="bg-amber-50/80 text-amber-900 font-bold border-b-2 border-amber-300">
                    <td className="border-r border-amber-300 p-1.5 sticky left-0 z-10 bg-amber-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] text-center">{String.fromCharCode(65 + productsInSite.length)}</td>
                    <td className="border-r border-amber-300 p-1.5 sticky left-[40px] z-10 bg-amber-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] text-left" colSpan={3}>
                      TOTAL BBM {upkName}
                    </td>
                    <td className="border-r border-amber-300 p-1.5 text-center" colSpan={10}>-</td>
                    
                    {displayedMonths.map(m => (
                      <React.Fragment key={`tota-g1-${m}`}>
                        <td className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getSum(siteTemplates, m, "stock")}</td>
                        <td className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getAvg(siteTemplates, m, "keterisian_tanki")}</td>
                        <td className={`border-r border-amber-300 p-1.5 text-right tabular-nums ${getHopColor(getAvg(siteTemplates, m, "hop"))}`}>{getAvg(siteTemplates, m, "hop")}</td>
                        <td className="border-r border-amber-300 p-1.5 text-center">-</td>
                      </React.Fragment>
                    ))}
                    
                    {displayedMonths.map(m => <td key={`tota-rt-${m}`} className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getSum(siteTemplates, m, "terima")}</td>)}
                    {displayedMonths.map(m => <td key={`tota-rp-${m}`} className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getSum(siteTemplates, m, "pemakaian")}</td>)}
                    {displayedMonths.map(m => <td key={`tota-rs-${m}`} className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getSum(siteTemplates, m, "stock_akhir_bulan")}</td>)}
                    {displayedMonths.map(m => <td key={`tota-rsh-${m}`} className={`border-r border-amber-300 p-1.5 text-right tabular-nums ${getHopColor(getAvg(siteTemplates, m, "shop_akhir_bulan"))}`}>{getAvg(siteTemplates, m, "shop_akhir_bulan")}</td>)}
                    
                    {displayedMonths.map(m => <td key={`tota-rnp-${m}`} className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getSum(siteTemplates, m, "renominasi_pesan")}</td>)}
                    {displayedMonths.map(m => <td key={`tota-rnpr-${m}`} className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getAvg(siteTemplates, m, "renominaso_proyeksi_akhir_bulan")}</td>)}
                    
                    {displayedMonths.map(m => <td key={`tota-dt-${m}`} className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getSum(siteTemplates, m, "delta_terima")}</td>)}
                    {displayedMonths.map(m => <td key={`tota-dp-${m}`} className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getAvg(siteTemplates, m, "pencapaian")}</td>)}
                    
                    {displayedMonths.map(m => <td key={`tota-rcp-${m}`} className="border-r border-amber-300 p-1.5 text-right tabular-nums">{getSum(siteTemplates, m, "rencana_pesan")}</td>)}
                    {displayedMonths.map(m => <td key={`tota-rch-${m}`} className={`border-r border-amber-300 p-1.5 text-right tabular-nums ${getHopColor(getAvg(siteTemplates, m, "rencana_hop"))}`}>{getAvg(siteTemplates, m, "rencana_hop")}</td>)}
                    
                    <td className="border-r border-amber-300 p-1.5 text-center">-</td>
                    
                    {displayedMonths.map(m => <td key={`tota-kk-${m}`} className="border-r border-amber-300 p-1.5 text-center">-</td>)}
                    {displayedMonths.map(m => <td key={`tota-kd-${m}`} className="border-r border-amber-300 p-1.5 text-center">-</td>)}
                  </tr>
                </React.Fragment>
              );
            })}
            
            {displayedTemplates.length === 0 && !isLoading && (
              <tr>
                <td colSpan={20} className="p-8 text-center text-gray-500">
                  Tidak ada data template kertas kerja.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Tabs */}
      {availableUnits.length > 0 && (
        <div className="flex bg-gray-100 border-t border-gray-200 overflow-x-auto rounded-b-lg px-2 pt-2 gap-1 relative z-20">
          {availableUnits.map((unitName, idx) => {
            const isActive = activeUnitTab === unitName;
            return (
              <button
                key={unitName}
                onClick={() => setActiveUnitTab(unitName)}
                className={`relative px-6 py-2.5 text-sm font-medium rounded-t-xl transition-all duration-300 min-w-max group flex items-center gap-2 ${
                  isActive
                    ? "bg-white text-primary shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border border-b-0 border-gray-200 z-10"
                    : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-200/80 border border-transparent border-b-0"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary rounded-t-xl" />
                )}
                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-500 group-hover:bg-gray-300 group-hover:text-gray-700"
                }`}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {unitName}
                
                {/* Hides the bottom border of the container when active to create a seamless connection */}
                {isActive && (
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
