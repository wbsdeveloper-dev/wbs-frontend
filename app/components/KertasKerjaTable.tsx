"use client";

import React, { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export default function KertasKerjaTable() {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Use current month index (0-11). If out of bounds for some reason, fallback to Jun '26 (index 5)
  const currentMonthIndex = new Date().getMonth();
  const currentMonth = allMonths[currentMonthIndex] || allMonths[5];

  const displayedMonths = isExpanded ? allMonths : [currentMonth];
  const numMonths = displayedMonths.length;

  const InputCell = ({ defaultValue, className = "text-center", readOnly = false }: { defaultValue?: string, className?: string, readOnly?: boolean }) => (
    <input
      type="text"
      defaultValue={defaultValue}
      readOnly={readOnly}
      className={`w-full min-w-[60px] px-1 py-1 text-xs font-medium text-gray-900 border border-transparent hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary rounded outline-none bg-transparent focus:bg-white transition-all ${className} ${readOnly ? "bg-gray-50 cursor-default hover:border-transparent focus:border-transparent focus:ring-0 text-gray-700" : ""}`}
    />
  );

  return (
    <div className="w-full bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4 border-b border-gray-100 flex justify-end">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
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

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-xs text-center min-w-max">
          <thead>
            {/* Row 1 */}
            <tr className="bg-[#3b9fdf] text-white">
              <th className="border border-gray-300 p-2 font-semibold sticky left-0 z-10 bg-[#3b9fdf]" rowSpan={3}>
                NO.
              </th>
              <th className="border border-gray-300 p-2 font-semibold sticky left-[40px] z-10 bg-[#3b9fdf]" rowSpan={3}>
                UNIT PELAKSANA
              </th>
              <th className="border border-gray-300 p-2 font-semibold sticky left-[160px] z-10 bg-[#3b9fdf]" rowSpan={3}>
                JENIS KIT
              </th>
              <th className="border border-gray-300 p-2 font-semibold sticky left-[240px] z-10 bg-[#3b9fdf]" rowSpan={3}>
                PEMBANGKIT
              </th>
              <th className="border border-gray-300 p-2 font-semibold" rowSpan={3}>
                JENIS BBM
              </th>
              <th className="border border-gray-300 p-2 font-semibold" rowSpan={3}>
                MODA ANGKUTAN
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={3}>
                TBBM
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={3}>
                TANGKI TIMBUN
              </th>
              <th className="border border-gray-300 p-2 font-semibold" rowSpan={3}>
                HOP MINIMUM
              </th>
              
              {/* Group column per month (Stok, Keterisian, dsb) */}
              {displayedMonths.map((month, i) => (
                <React.Fragment key={`group-1-${i}`}>
                  <th className="border border-gray-300 p-2 font-semibold" rowSpan={3}>
                    STOK<br />{month}<br />(kL)
                  </th>
                  <th className="border border-gray-300 p-2 font-semibold" rowSpan={3}>
                    KETERISIAN TANGKI<br />(%)
                  </th>
                  <th className="border border-gray-300 p-2 font-semibold" rowSpan={3}>
                    HOP<br />{month}<br />(Hari)
                  </th>
                  <th className="border border-gray-300 p-2 font-semibold" rowSpan={3}>
                    KETERANGAN<br />HOP &lt; HOP MIN
                  </th>
                </React.Fragment>
              ))}

              <th className="border border-gray-300 p-2 font-semibold" colSpan={4 * numMonths}>
                REALISASI (SAP)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={2 * numMonths}>
                RENOMINASI/KONFIRMASI
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={2 * numMonths}>
                DELTA (REAL - KONF)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={2 * numMonths}>
                RENCANA (PROGNOSA)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" rowSpan={3}>
                POLA OPERASI
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={2 * numMonths}>
                KETERANGAN
              </th>
            </tr>

            {/* Row 2 */}
            <tr className="bg-[#3b9fdf] text-white">
              {/* TBBM Children */}
              <th className="border border-gray-300 p-2 font-semibold" rowSpan={2}>
                NAMA
              </th>
              <th className="border border-gray-300 p-2 font-semibold" rowSpan={2}>
                JARAK<br />(km)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={1}>
                Estimasi Pengiriman
              </th>
              {/* Tangki Timbun Children */}
              <th className="border border-gray-300 p-2 font-semibold" rowSpan={2}>
                KAP.<br />(kL)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" rowSpan={2}>
                PEMAKAIAN RATA2<br />BULAN-1
              </th>
              <th className="border border-gray-300 p-2 font-semibold" rowSpan={2}>
                HOP<br />(Hari)
              </th>

              {/* Realisasi Children */}
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                TERIMA (kL)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                PEMAKAIAN (kL)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                STOK AKHIR BULAN (kL)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                SHOP AKHIR BULAN (Hari)
              </th>

              {/* Renominasi Children */}
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                PESAN (kL)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                PROYEKSI SHOP AKHIR BULAN (Hari)
              </th>

              {/* Delta Children */}
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                DELTA TERIMA (kL)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                PENCAPAIAN (%)
              </th>

              {/* Rencana Children */}
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                PESAN (kL)
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                HOP (Hari)
              </th>

              {/* Keterangan Children */}
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                KETERANGAN
              </th>
              <th className="border border-gray-300 p-2 font-semibold" colSpan={numMonths}>
                DETAIL KETERANGAN
              </th>
            </tr>

            {/* Row 3 */}
            <tr className="bg-[#3b9fdf] text-white">
              {/* TBBM Hari */}
              <th className="border border-gray-300 p-1 font-semibold text-[10px]">
                Hari
              </th>
              
              {/* Realisasi Months */}
              {displayedMonths.map((m, i) => <th key={`r-t-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`r-p-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`r-sa-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`r-sh-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}
              
              {/* Renominasi Months */}
              {displayedMonths.map((m, i) => <th key={`rn-p-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`rn-pr-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}

              {/* Delta Months */}
              {displayedMonths.map((m, i) => <th key={`d-t-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`d-p-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}

              {/* Rencana Months */}
              {displayedMonths.map((m, i) => <th key={`rc-p-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`rc-h-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}

              {/* Keterangan Months */}
              {displayedMonths.map((m, i) => <th key={`k-k-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}
              {displayedMonths.map((m, i) => <th key={`k-d-${i}`} className="border border-gray-300 p-1 text-[10px]">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
              <td className="border border-gray-200 p-1 sticky left-0 z-10 bg-white">
                <InputCell defaultValue="1" readOnly className="text-center font-medium w-[30px] min-w-[30px]" />
              </td>
              <td className="border border-gray-200 p-1 sticky left-[40px] z-10 bg-white">
                <InputCell defaultValue="PLN NP" className="text-left font-medium w-full min-w-[120px]" />
              </td>
              <td className="border border-gray-200 p-1 sticky left-[160px] z-10 bg-white">
                <InputCell defaultValue="PLTG" className="text-left w-[80px]" />
              </td>
              <td className="border border-gray-200 p-1 sticky left-[240px] z-10 bg-white">
                <InputCell defaultValue="Paya Pasir" className="text-left w-full min-w-[150px]" />
              </td>
              <td className="border border-gray-200 p-1">
                <InputCell defaultValue="HSD" className="text-center w-[80px]" />
              </td>
              <td className="border border-gray-200 p-1">
                <InputCell defaultValue="Pipa" className="text-center w-[80px]" />
              </td>
              
              <td className="border border-gray-200 p-1">
                <InputCell defaultValue="TBBM Medan Group" className="text-left w-[150px]" />
              </td>
              <td className="border border-gray-200 p-1">
                <InputCell defaultValue="20" className="text-center" />
              </td>
              <td className="border border-gray-200 p-1">
                <InputCell defaultValue="1" className="text-center" />
              </td>

              <td className="border border-gray-200 p-1">
                <InputCell defaultValue="5,000" className="text-right" />
              </td>
              <td className="border border-gray-200 p-1">
                <InputCell defaultValue="200" className="text-right" />
              </td>
              <td className="border border-gray-200 p-1">
                <InputCell defaultValue="25" className="text-center" />
              </td>
              <td className="border border-gray-200 p-1 bg-green-50">
                <InputCell defaultValue="15" className="text-center font-bold text-green-700 bg-transparent" />
              </td>
              
              {/* Cols for Stok/Keterisian */}
              {Array.from({ length: 4 * numMonths }).map((_, i) => (
                <td key={`stok-${i}`} className="border border-gray-200 p-1">
                  <InputCell defaultValue="-" className="text-center" />
                </td>
              ))}
              
              {/* Cols for Realisasi */}
              {Array.from({ length: 4 * numMonths }).map((_, i) => (
                <td key={`realisasi-${i}`} className="border border-gray-200 p-1">
                  <InputCell defaultValue="0" className="text-right" />
                </td>
              ))}

              {/* Cols for Renominasi */}
              {Array.from({ length: 2 * numMonths }).map((_, i) => (
                <td key={`renominasi-${i}`} className="border border-gray-200 p-1">
                  <InputCell defaultValue="0" className="text-right" />
                </td>
              ))}

              {/* Cols for Delta */}
              {Array.from({ length: 2 * numMonths }).map((_, i) => (
                <td key={`delta-${i}`} className="border border-gray-200 p-1">
                  <InputCell defaultValue="0" className="text-right" />
                </td>
              ))}

              {/* Cols for Rencana */}
              {Array.from({ length: 2 * numMonths }).map((_, i) => (
                <td key={`rencana-${i}`} className="border border-gray-200 p-1">
                  <InputCell defaultValue="0" className="text-right" />
                </td>
              ))}

              <td className="border border-gray-200 p-1">
                <InputCell defaultValue="Baseload" className="text-center italic w-[100px]" />
              </td>

              {/* Cols for Keterangan */}
              {Array.from({ length: 2 * numMonths }).map((_, i) => (
                <td key={`ket-${i}`} className="border border-gray-200 p-1">
                  <InputCell defaultValue="" className="text-left w-full min-w-[120px]" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
