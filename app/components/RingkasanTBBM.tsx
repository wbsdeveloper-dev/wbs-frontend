"use client";

import React, { useMemo } from "react";
import { TemplateKertasKerja, RecordKertasKerja } from "@/hooks/service/kertas-kerja-api";

interface RingkasanTBBMProps {
  templates: TemplateKertasKerja[];
  records: RecordKertasKerja[];
  displayedMonths: string[];
  allMonths: string[];
  selectedRegion: string;
}

const formatNumber = (val: number) => val === 0 ? "-" : val.toLocaleString("en-US");

export default function RingkasanTBBM({ templates, records, displayedMonths, allMonths, selectedRegion }: RingkasanTBBMProps) {
  
  const recordMap = useMemo(() => {
    const map: Record<string, RecordKertasKerja> = {};
    records.forEach(r => {
      map[`${r.template_kertas_kerja_id}_${r.month_work}`] = r;
    });
    return map;
  }, [records]);

  // Find all available products, guaranteeing B40, HSD, MFO exist at least to match reference images closely
  const products = useMemo(() => {
    const defaultProds = ["B40", "HSD", "MFO"];
    const foundProds = templates.map(t => t.product_name).filter(Boolean) as string[];
    return Array.from(new Set([...defaultProds, ...foundProds]));
  }, [templates]);

  // --- LEFT TABLE DATA (Unit -> TBBM -> Product) ---
  const leftData = useMemo(() => {
    const leftHierarchy: Record<string, any> = {};

    templates.forEach(t => {
      const unit = t.unit_name || "Tanpa Unit";
      const supplier = t.supplier_name || "Tanpa Supplier";
      const product = t.product_name || "Unknown";

      if (!leftHierarchy[unit]) {
        leftHierarchy[unit] = { suppliers: {} };
      }
      if (!leftHierarchy[unit].suppliers[supplier]) {
        leftHierarchy[unit].suppliers[supplier] = { products: {} };
        products.forEach(p => {
          leftHierarchy[unit].suppliers[supplier].products[p] = { months: {} };
          allMonths.forEach(m => {
            leftHierarchy[unit].suppliers[supplier].products[p].months[m] = { nominasi: 0, renominasi: 0, terima: 0, pemakaian: 0 };
          });
        });
      }

      if (products.includes(product)) {
        allMonths.forEach(m => {
          const rec = recordMap[`${t.id}_${m}`];
          if (rec) {
            const mObj = leftHierarchy[unit].suppliers[supplier].products[product].months[m];
            mObj.nominasi += Number(rec.rencana_pesan) || 0;
            mObj.renominasi += Number(rec.renominasi_pesan) || 0;
            mObj.terima += Number(rec.terima) || 0;
            mObj.pemakaian += Number(rec.pemakaian) || 0;
          }
        });
      }
    });

    // Compute Totals per Unit
    Object.keys(leftHierarchy).forEach(unit => {
      leftHierarchy[unit].totals = {};
      products.forEach(p => {
        leftHierarchy[unit].totals[p] = { months: {} };
        allMonths.forEach(m => {
          let sumN = 0, sumR = 0, sumT = 0, sumP = 0;
          Object.values(leftHierarchy[unit].suppliers).forEach((sup: any) => {
            const mObj = sup.products[p].months[m];
            sumN += mObj.nominasi;
            sumR += mObj.renominasi;
            sumT += mObj.terima;
            sumP += mObj.pemakaian;
          });
          leftHierarchy[unit].totals[p].months[m] = { nominasi: sumN, renominasi: sumR, terima: sumT, pemakaian: sumP };
        });
      });
    });

    return leftHierarchy;
  }, [templates, recordMap, products, allMonths]);

  // --- RIGHT TABLE DATA (TBBM -> Product) ---
  const rightData = useMemo(() => {
    const rightHierarchy: Record<string, any> = {};

    templates.forEach(t => {
      const supplier = t.supplier_name || "Tanpa Supplier";
      const product = t.product_name || "Unknown";

      if (!rightHierarchy[supplier]) {
        rightHierarchy[supplier] = { products: {} };
        products.forEach(p => {
          rightHierarchy[supplier].products[p] = { months: {} };
          allMonths.forEach(m => {
            rightHierarchy[supplier].products[p].months[m] = { nominasi: 0, renominasi: 0, terima: 0, pemakaian: 0 };
          });
        });
      }

      if (products.includes(product)) {
        allMonths.forEach(m => {
          const rec = recordMap[`${t.id}_${m}`];
          if (rec) {
            const mObj = rightHierarchy[supplier].products[product].months[m];
            mObj.nominasi += Number(rec.rencana_pesan) || 0;
            mObj.renominasi += Number(rec.renominasi_pesan) || 0;
            mObj.terima += Number(rec.terima) || 0;
            mObj.pemakaian += Number(rec.pemakaian) || 0;
          }
        });
      }
    });

    // Grand Total
    const rightTotal: Record<string, any> = {};
    products.forEach(p => {
      rightTotal[p] = { months: {} };
      allMonths.forEach(m => {
        let sumN = 0, sumR = 0, sumT = 0, sumP = 0;
        Object.values(rightHierarchy).forEach((sup: any) => {
          const mObj = sup.products[p].months[m];
          sumN += mObj.nominasi;
          sumR += mObj.renominasi;
          sumT += mObj.terima;
          sumP += mObj.pemakaian;
        });
        rightTotal[p].months[m] = { nominasi: sumN, renominasi: sumR, terima: sumT, pemakaian: sumP };
      });
    });

    return { suppliers: rightHierarchy, total: rightTotal };
  }, [templates, recordMap, products, allMonths]);

  const hasAnyData = (monthsData: Record<string, any>) => {
    return allMonths.some(m => {
      const d = monthsData[m];
      return d && (d.nominasi > 0 || d.renominasi > 0 || d.terima > 0 || d.pemakaian > 0);
    });
  };

  const getColSpan = () => displayedMonths.length;

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 h-full w-full overflow-hidden min-h-0">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col w-full h-full min-h-0 shadow-sm">
        <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold sticky top-0 z-20 shrink-0 shadow-sm flex items-center">
          Nominasi BBM {selectedRegion ? `Regional ${selectedRegion}` : "Seluruh Regional"} <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">Tampilan Instansi</span>
        </div>
        <div className="overflow-auto custom-scrollbar flex-1 w-full">
          <table className="w-full border-collapse text-xs text-center min-w-max">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-slate-50 text-slate-700">
                <th className="border border-slate-200 p-3 w-[150px] font-bold sticky left-0 z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]" rowSpan={2}>
                  INSTANSI/REGIONAL
                </th>
                <th className="border border-slate-200 p-3 w-[250px] font-bold sticky left-[150px] z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]" rowSpan={2}>
                  TBBM
                </th>
                <th className="border border-slate-200 p-3 w-[100px] font-bold sticky left-[400px] z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]" rowSpan={2}>
                  JENIS BBM
                </th>
                <th className="border border-slate-200 p-2 font-bold bg-sky-50/80 border-t-2 border-t-sky-400 text-sky-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Nominasi (M-1)</th>
                <th className="border border-slate-200 p-2 font-bold bg-indigo-50/80 border-t-2 border-t-indigo-400 text-indigo-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Re-nominasi (M-0)</th>
                <th className="border border-slate-200 p-2 font-bold bg-teal-50/80 border-t-2 border-t-teal-400 text-teal-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Terima</th>
                <th className="border border-slate-200 p-2 font-bold bg-rose-50/80 border-t-2 border-t-rose-400 text-rose-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Pemakaian</th>
              </tr>
              <tr className="bg-slate-50 text-slate-700 text-[10px] uppercase">
                {displayedMonths.map((m, i) => <th key={`l-n-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-sky-50/50 text-sky-800">{m}</th>)}
                {displayedMonths.map((m, i) => <th key={`l-r-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-indigo-50/50 text-indigo-800">{m}</th>)}
                {displayedMonths.map((m, i) => <th key={`l-t-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-teal-50/50 text-teal-800">{m}</th>)}
                {displayedMonths.map((m, i) => <th key={`l-p-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-rose-50/50 text-rose-800">{m}</th>)}
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {Object.keys(leftData).length === 0 && (
                <tr>
                  <td colSpan={3 + 4 * getColSpan()} className="p-8 text-center text-gray-500">Tidak ada data.</td>
                </tr>
              )}
              {Object.keys(leftData).map((unit) => {
                const suppliers = leftData[unit].suppliers;
                const suppKeys = Object.keys(suppliers).filter(supp => {
                  return products.some(prod => hasAnyData(suppliers[supp].products[prod].months));
                });

                if (suppKeys.length === 0) return null;

                // Calculate rowSpan for the entire unit
                let rowSpanForUnit = 0;
                suppKeys.forEach(supp => {
                  const validProds = products.filter(prod => hasAnyData(suppliers[supp].products[prod].months));
                  rowSpanForUnit += validProds.length;
                });
                
                // Add totals rows
                const validTotalProds = products.filter(prod => hasAnyData(leftData[unit].totals[prod].months));
                rowSpanForUnit += validTotalProds.length;

                return (
                  <React.Fragment key={`u-${unit}`}>
                    {suppKeys.map((supp, sIdx) => {
                      const validProds = products.filter(prod => hasAnyData(suppliers[supp].products[prod].months));
                      
                      return validProds.map((prod, pIdx) => {
                        const isFirstSupp = sIdx === 0;
                        const isFirstProd = pIdx === 0;
                        const dataMonths = suppliers[supp].products[prod].months;

                        return (
                          <tr key={`u-${unit}-s-${supp}-p-${prod}`} className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150">
                            {isFirstSupp && isFirstProd && (
                              <td className="border-r border-slate-200 p-2.5 sticky left-0 z-10 bg-white font-semibold align-top shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]" rowSpan={rowSpanForUnit}>
                                <div className="sticky top-3">{unit}</div>
                              </td>
                            )}
                            {isFirstProd && (
                              <td className="border-r border-slate-200 p-2.5 sticky left-[150px] z-10 bg-white text-left align-top shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]" rowSpan={validProds.length}>
                                <div className="sticky top-3 text-slate-600">{supp}</div>
                              </td>
                            )}
                            <td className="border-r border-slate-200 p-2.5 sticky left-[400px] z-10 bg-white shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] font-medium text-slate-800">
                              {prod}
                            </td>

                            {/* Nominasi */}
                            {displayedMonths.map(m => (
                              <td key={`v-n-${m}`} className="p-2.5 border-r border-slate-100 text-right tabular-nums">{formatNumber(dataMonths[m].nominasi)}</td>
                            ))}
                            {/* Renominasi */}
                            {displayedMonths.map(m => (
                              <td key={`v-r-${m}`} className="p-2.5 border-r border-slate-100 text-right tabular-nums">{formatNumber(dataMonths[m].renominasi)}</td>
                            ))}
                            {/* Terima */}
                            {displayedMonths.map(m => (
                              <td key={`v-t-${m}`} className="p-2.5 border-r border-slate-100 text-right tabular-nums">{formatNumber(dataMonths[m].terima)}</td>
                            ))}
                            {/* Pemakaian */}
                            {displayedMonths.map(m => (
                              <td key={`v-p-${m}`} className="p-2.5 border-r border-slate-100 text-right tabular-nums">{formatNumber(dataMonths[m].pemakaian)}</td>
                            ))}
                          </tr>
                        );
                      });
                    })}

                    {/* Unit Totals */}
                    {validTotalProds.map((prod, pIdx) => {
                      const dataMonths = leftData[unit].totals[prod].months;
                      const isFirstProd = pIdx === 0;
                      return (
                        <tr key={`u-${unit}-tot-${prod}`} className="bg-slate-100/80 text-slate-800 font-bold border-b border-slate-300">
                          {isFirstProd && (
                            <td className="border-r border-slate-300 p-2.5 sticky left-[150px] z-10 bg-slate-100 text-right shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]" rowSpan={validTotalProds.length}>
                              <div className="sticky top-3">Total {unit}</div>
                            </td>
                          )}
                          <td className="border-r border-slate-300 p-2.5 sticky left-[400px] z-10 bg-slate-100 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]">
                            {prod}
                          </td>
                          {/* Nominasi */}
                          {displayedMonths.map(m => (
                            <td key={`tot-n-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].nominasi)}</td>
                          ))}
                          {/* Renominasi */}
                          {displayedMonths.map(m => (
                            <td key={`tot-r-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].renominasi)}</td>
                          ))}
                          {/* Terima */}
                          {displayedMonths.map(m => (
                            <td key={`tot-t-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].terima)}</td>
                          ))}
                          {/* Pemakaian */}
                          {displayedMonths.map(m => (
                            <td key={`tot-p-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].pemakaian)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col w-full h-full min-h-0 shadow-sm">
        <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold sticky top-0 z-20 shrink-0 shadow-sm flex items-center">
          Nominasi BBM {selectedRegion ? `Regional ${selectedRegion}` : "Seluruh Regional"} <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">Tampilan TBBM</span>
        </div>
        <div className="overflow-auto custom-scrollbar flex-1 w-full">
          <table className="w-full border-collapse text-xs text-center min-w-max">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-slate-50 text-slate-700">
                <th className="border border-slate-200 p-3 w-[250px] font-bold sticky left-0 z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]" rowSpan={2}>
                  TBBM
                </th>
                <th className="border border-slate-200 p-3 w-[100px] font-bold sticky left-[250px] z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]" rowSpan={2}>
                  JENIS BBM
                </th>
                <th className="border border-slate-200 p-2 font-bold bg-sky-50/80 border-t-2 border-t-sky-400 text-sky-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Nominasi (M-1)</th>
                <th className="border border-slate-200 p-2 font-bold bg-indigo-50/80 border-t-2 border-t-indigo-400 text-indigo-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Re-nominasi (M-0)</th>
                <th className="border border-slate-200 p-2 font-bold bg-teal-50/80 border-t-2 border-t-teal-400 text-teal-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Terima</th>
                <th className="border border-slate-200 p-2 font-bold bg-rose-50/80 border-t-2 border-t-rose-400 text-rose-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Pemakaian</th>
              </tr>
              <tr className="bg-slate-50 text-slate-700 text-[10px] uppercase">
                {displayedMonths.map((m, i) => <th key={`r-n-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-sky-50/50 text-sky-800">{m}</th>)}
                {displayedMonths.map((m, i) => <th key={`r-r-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-indigo-50/50 text-indigo-800">{m}</th>)}
                {displayedMonths.map((m, i) => <th key={`r-t-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-teal-50/50 text-teal-800">{m}</th>)}
                {displayedMonths.map((m, i) => <th key={`r-p-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-rose-50/50 text-rose-800">{m}</th>)}
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {Object.keys(rightData.suppliers).length === 0 && (
                <tr>
                  <td colSpan={2 + 4 * getColSpan()} className="p-8 text-center text-gray-500">Tidak ada data.</td>
                </tr>
              )}
              {Object.keys(rightData.suppliers).map((supp) => {
                const validProds = products.filter(prod => hasAnyData(rightData.suppliers[supp].products[prod].months));
                if (validProds.length === 0) return null;

                return validProds.map((prod, pIdx) => {
                  const isFirstProd = pIdx === 0;
                  const dataMonths = rightData.suppliers[supp].products[prod].months;

                  return (
                    <tr key={`r-s-${supp}-p-${prod}`} className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150">
                      {isFirstProd && (
                        <td className="border-r border-slate-200 p-2.5 sticky left-0 z-10 bg-white text-left align-top shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] font-medium" rowSpan={validProds.length}>
                          <div className="sticky top-3 text-slate-700">{supp}</div>
                        </td>
                      )}
                      <td className="border-r border-slate-200 p-2.5 sticky left-[250px] z-10 bg-white shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] font-medium text-slate-800">
                        {prod}
                      </td>
                      {/* Nominasi */}
                      {displayedMonths.map(m => (
                        <td key={`r-v-n-${m}`} className="p-2.5 border-r border-slate-100 text-right tabular-nums">{formatNumber(dataMonths[m].nominasi)}</td>
                      ))}
                      {/* Renominasi */}
                      {displayedMonths.map(m => (
                        <td key={`r-v-r-${m}`} className="p-2.5 border-r border-slate-100 text-right tabular-nums">{formatNumber(dataMonths[m].renominasi)}</td>
                      ))}
                      {/* Terima */}
                      {displayedMonths.map(m => (
                        <td key={`r-v-t-${m}`} className="p-2.5 border-r border-slate-100 text-right tabular-nums">{formatNumber(dataMonths[m].terima)}</td>
                      ))}
                      {/* Pemakaian */}
                      {displayedMonths.map(m => (
                        <td key={`r-v-p-${m}`} className="p-2.5 border-r border-slate-100 text-right tabular-nums">{formatNumber(dataMonths[m].pemakaian)}</td>
                      ))}
                    </tr>
                  );
                });
              })}

              {/* Grand Totals */}
              {Object.keys(rightData.suppliers).length > 0 && (() => {
                const validTotalProds = products.filter(prod => hasAnyData(rightData.total[prod].months));
                return validTotalProds.map((prod, pIdx) => {
                  const dataMonths = rightData.total[prod].months;
                  const isFirstProd = pIdx === 0;
                  return (
                    <tr key={`r-tot-${prod}`} className="bg-slate-100/80 text-slate-800 font-bold border-b border-slate-300">
                      {isFirstProd && (
                        <td className="border-r border-slate-300 p-2.5 sticky left-0 z-10 bg-slate-100 text-right shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]" rowSpan={validTotalProds.length}>
                          <div className="sticky top-3 tracking-wide">TOTAL</div>
                        </td>
                      )}
                      <td className="border-r border-slate-300 p-2.5 sticky left-[250px] z-10 bg-slate-100 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]">
                        {prod}
                      </td>
                      {/* Nominasi */}
                      {displayedMonths.map(m => (
                        <td key={`rtot-n-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].nominasi)}</td>
                      ))}
                      {/* Renominasi */}
                      {displayedMonths.map(m => (
                        <td key={`rtot-r-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].renominasi)}</td>
                      ))}
                      {/* Terima */}
                      {displayedMonths.map(m => (
                        <td key={`rtot-t-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].terima)}</td>
                      ))}
                      {/* Pemakaian */}
                      {displayedMonths.map(m => (
                        <td key={`rtot-p-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].pemakaian)}</td>
                      ))}
                    </tr>
                );
              });
            })()}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
