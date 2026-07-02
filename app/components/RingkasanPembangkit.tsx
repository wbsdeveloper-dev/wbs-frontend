"use client";

import React, { useMemo } from "react";
import { TemplateKertasKerja, RecordKertasKerja } from "@/hooks/service/kertas-kerja-api";

interface RingkasanPembangkitProps {
  templates: TemplateKertasKerja[];
  records: RecordKertasKerja[];
  displayedMonths: string[];
  allMonths: string[];
  selectedRegion: string;
}

const formatNumber = (val: number) => val === 0 ? "-" : val.toLocaleString("en-US");

export default function RingkasanPembangkit({ templates, records, displayedMonths, allMonths, selectedRegion }: RingkasanPembangkitProps) {
  
  const recordMap = useMemo(() => {
    const map: Record<string, RecordKertasKerja> = {};
    records.forEach(r => {
      map[`${r.template_kertas_kerja_id}_${r.month_work}`] = r;
    });
    return map;
  }, [records]);

  const products = useMemo(() => {
    const defaultProds = ["B40", "HSD", "MFO"];
    const foundProds = templates.map(t => t.product_name).filter(Boolean) as string[];
    return Array.from(new Set([...defaultProds, ...foundProds]));
  }, [templates]);

  // --- DATA HIERARCHY (Regional -> UP -> Product) ---
  const tableData = useMemo(() => {
    const hierarchy: Record<string, any> = {};

    templates.forEach(t => {
      const regional = t.unit_name || "Tanpa Regional";
      const up = t.upk_name || "Tanpa UP";
      const product = t.product_name || "Unknown";

      if (!hierarchy[regional]) {
        hierarchy[regional] = { ups: {} };
      }
      if (!hierarchy[regional].ups[up]) {
        hierarchy[regional].ups[up] = { products: {} };
        products.forEach(p => {
          hierarchy[regional].ups[up].products[p] = { months: {} };
          allMonths.forEach(m => {
            hierarchy[regional].ups[up].products[p].months[m] = { nominasi: 0, renominasi: 0, terima: 0, pemakaian: 0 };
          });
        });
      }

      if (products.includes(product)) {
        allMonths.forEach(m => {
          const rec = recordMap[`${t.id}_${m}`];
          if (rec) {
            const mObj = hierarchy[regional].ups[up].products[product].months[m];
            mObj.nominasi += Number(rec.rencana_pesan) || 0;
            mObj.renominasi += Number(rec.renominasi_pesan) || 0;
            mObj.terima += Number(rec.terima) || 0;
            mObj.pemakaian += Number(rec.pemakaian) || 0;
          }
        });
      }
    });

    // Compute Totals per Regional
    Object.keys(hierarchy).forEach(regional => {
      hierarchy[regional].totals = {};
      products.forEach(p => {
        hierarchy[regional].totals[p] = { months: {} };
        allMonths.forEach(m => {
          let sumN = 0, sumR = 0, sumT = 0, sumP = 0;
          Object.values(hierarchy[regional].ups).forEach((upData: any) => {
            const mObj = upData.products[p].months[m];
            sumN += mObj.nominasi;
            sumR += mObj.renominasi;
            sumT += mObj.terima;
            sumP += mObj.pemakaian;
          });
          hierarchy[regional].totals[p].months[m] = { nominasi: sumN, renominasi: sumR, terima: sumT, pemakaian: sumP };
        });
      });
    });

    // Grand Totals
    const grandTotals: Record<string, any> = {};
    products.forEach(p => {
      grandTotals[p] = { months: {} };
      allMonths.forEach(m => {
        let sumN = 0, sumR = 0, sumT = 0, sumP = 0;
        Object.values(hierarchy).forEach((regionalData: any) => {
          const mObj = regionalData.totals[p].months[m];
          sumN += mObj.nominasi;
          sumR += mObj.renominasi;
          sumT += mObj.terima;
          sumP += mObj.pemakaian;
        });
        grandTotals[p].months[m] = { nominasi: sumN, renominasi: sumR, terima: sumT, pemakaian: sumP };
      });
    });

    return { hierarchy, grandTotals };
  }, [templates, recordMap, products, allMonths]);

  const hasAnyData = (monthsData: Record<string, any>) => {
    return allMonths.some(m => {
      const d = monthsData[m];
      return d && (d.nominasi > 0 || d.renominasi > 0 || d.terima > 0 || d.pemakaian > 0);
    });
  };

  const getColSpan = () => displayedMonths.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col w-full h-full min-h-0 shadow-sm">
      <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold sticky top-0 z-20 shrink-0 shadow-sm flex items-center">
        Nominasi BBM {selectedRegion ? `Regional ${selectedRegion}` : "Seluruh Regional"} <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">Tampilan Pembangkit</span>
      </div>
      <div className="overflow-auto custom-scrollbar flex-1 w-full">
        <table className="w-full border-collapse text-xs text-center min-w-max">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr className="bg-slate-50 text-slate-700">
              <th className="border border-slate-200 p-3 w-[200px] font-bold sticky left-0 z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]" rowSpan={2}>
                INSTANSI/REGIONAL
              </th>
              <th className="border border-slate-200 p-3 w-[250px] font-bold sticky left-[200px] z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]" rowSpan={2}>
                UP
              </th>
              <th className="border border-slate-200 p-3 w-[100px] font-bold sticky left-[450px] z-20 bg-slate-50 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] uppercase tracking-wider text-[11px]" rowSpan={2}>
                JENIS BBM
              </th>
              <th className="border border-slate-200 p-2 font-bold bg-sky-50/80 border-t-2 border-t-sky-400 text-sky-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Nominasi (M-1)</th>
              <th className="border border-slate-200 p-2 font-bold bg-indigo-50/80 border-t-2 border-t-indigo-400 text-indigo-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Re-nominasi (M-0)</th>
              <th className="border border-slate-200 p-2 font-bold bg-teal-50/80 border-t-2 border-t-teal-400 text-teal-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Terima</th>
              <th className="border border-slate-200 p-2 font-bold bg-rose-50/80 border-t-2 border-t-rose-400 text-rose-900 uppercase tracking-wider text-[11px]" colSpan={getColSpan()}>Pemakaian</th>
            </tr>
            <tr className="bg-slate-50 text-slate-700 text-[10px] uppercase">
              {displayedMonths.map((m, i) => <th key={`p-n-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-sky-50/50 text-sky-800">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`p-r-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-indigo-50/50 text-indigo-800">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`p-t-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-teal-50/50 text-teal-800">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`p-p-${i}`} className="border border-slate-200 p-1.5 font-semibold bg-rose-50/50 text-rose-800">{m}</th>)}
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {Object.keys(tableData.hierarchy).length === 0 && (
              <tr>
                <td colSpan={3 + 4 * getColSpan()} className="p-8 text-center text-gray-500">Tidak ada data.</td>
              </tr>
            )}
            {Object.keys(tableData.hierarchy).map((regional) => {
              const ups = tableData.hierarchy[regional].ups;
              const upKeys = Object.keys(ups).filter(up => {
                return products.some(prod => hasAnyData(ups[up].products[prod].months));
              });

              if (upKeys.length === 0) return null;

              // Calculate rowSpan for the entire regional
              let rowSpanForRegional = 0;
              upKeys.forEach(up => {
                const validProds = products.filter(prod => hasAnyData(ups[up].products[prod].months));
                rowSpanForRegional += validProds.length;
              });
              
              // Add totals rows
              const validTotalProds = products.filter(prod => hasAnyData(tableData.hierarchy[regional].totals[prod].months));
              rowSpanForRegional += validTotalProds.length;

              return (
                <React.Fragment key={`reg-${regional}`}>
                  {upKeys.map((up, uIdx) => {
                    const validProds = products.filter(prod => hasAnyData(ups[up].products[prod].months));
                    
                    return validProds.map((prod, pIdx) => {
                      const isFirstUp = uIdx === 0;
                      const isFirstProd = pIdx === 0;
                      const dataMonths = ups[up].products[prod].months;

                      return (
                        <tr key={`reg-${regional}-up-${up}-p-${prod}`} className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-150">
                          {isFirstUp && isFirstProd && (
                            <td className="border-r border-slate-200 p-2.5 sticky left-0 z-10 bg-white font-semibold align-top shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]" rowSpan={rowSpanForRegional}>
                              <div className="sticky top-3">{regional}</div>
                            </td>
                          )}
                          {isFirstProd && (
                            <td className="border-r border-slate-200 p-2.5 sticky left-[200px] z-10 bg-white text-left align-top shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]" rowSpan={validProds.length}>
                              <div className="sticky top-3 text-slate-600">{up}</div>
                            </td>
                          )}
                          <td className="border-r border-slate-200 p-2.5 sticky left-[450px] z-10 bg-white shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] font-medium text-slate-800">
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

                  {/* Regional Totals */}
                  {validTotalProds.map((prod, pIdx) => {
                    const dataMonths = tableData.hierarchy[regional].totals[prod].months;
                    const isFirstProd = pIdx === 0;
                    return (
                      <tr key={`reg-${regional}-tot-${prod}`} className="bg-slate-100/80 text-slate-800 font-bold border-b border-slate-300">
                        {isFirstProd && (
                          <td className="border-r border-slate-300 p-2.5 sticky left-[200px] z-10 bg-slate-100 text-right shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]" rowSpan={validTotalProds.length}>
                            <div className="sticky top-3">Total {regional}</div>
                          </td>
                        )}
                        <td className="border-r border-slate-300 p-2.5 sticky left-[450px] z-10 bg-slate-100 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]">
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

            {/* Grand Totals */}
            {Object.keys(tableData.hierarchy).length > 0 && (() => {
              const validGrandTotalProds = products.filter(prod => hasAnyData(tableData.grandTotals[prod].months));
              return validGrandTotalProds.map((prod, pIdx) => {
                const dataMonths = tableData.grandTotals[prod].months;
                const isFirstProd = pIdx === 0;
                return (
                  <tr key={`gtot-${prod}`} className="bg-slate-100/80 text-slate-800 font-bold border-b border-slate-300">
                    {isFirstProd && (
                      <td className="border-r border-slate-300 p-2.5 sticky left-0 z-10 bg-slate-100 text-right shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]" rowSpan={validGrandTotalProds.length}>
                        <div className="sticky top-3 tracking-wide">TOTAL</div>
                      </td>
                    )}
                    <td className="border-r border-slate-300 p-2.5 sticky left-[200px] z-10 bg-slate-100 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]"></td>
                    <td className="border-r border-slate-300 p-2.5 sticky left-[450px] z-10 bg-slate-100 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)]">
                      {prod}
                    </td>
                    {/* Nominasi */}
                    {displayedMonths.map(m => (
                      <td key={`gtot-n-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].nominasi)}</td>
                    ))}
                    {/* Renominasi */}
                    {displayedMonths.map(m => (
                      <td key={`gtot-r-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].renominasi)}</td>
                    ))}
                    {/* Terima */}
                    {displayedMonths.map(m => (
                      <td key={`gtot-t-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].terima)}</td>
                    ))}
                    {/* Pemakaian */}
                    {displayedMonths.map(m => (
                      <td key={`gtot-p-${m}`} className="p-2.5 border-r border-slate-200 text-right tabular-nums">{formatNumber(dataMonths[m].pemakaian)}</td>
                    ))}
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
