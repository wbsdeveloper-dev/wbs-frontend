"use client";

import { Loader2 } from "lucide-react";
import type { ContractInfoResponse } from "@/hooks/service/dashboard-api";

interface SupplierResumeTableProps {
  contractData?: ContractInfoResponse | null;
  isLoading?: boolean;
}

export default function SupplierResumeTable({
  contractData,
  isLoading,
}: SupplierResumeTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-[#14a2bb]" size={32} />
      </div>
    );
  }

  const contract = contractData?.contract;

  console.log("contract", contract);

  return (
    <div className="w-full text-sm text-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">Jenis Kontrak</div>
          <div className="bg-white px-2">
            {contract?.jenisKontrak ?? "Perjanjian Jual Beli Gas (PJBG)"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white  font-semibold px-2">Region</div>
          <div className="bg-white px-2">
            {contract?.region ?? "Sumatera Tengah"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">Nomor Kontrak</div>
          <div className="bg-white px-2">
            <ul className="list-disc list-inside">
              <li>
                {contract?.nomorKontrak ?? "0233.Pj/EPI.01.02/c01050000/2022"}
              </li>
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white  font-semibold  px-2">Jangka Waktu</div>
          <div className="bg-white px-2">
            {contract?.jangkaWaktu
              ? `${contract.jangkaWaktu.start} s/d ${contract.jangkaWaktu.end}`
              : "31 Desember 2026"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white  font-semibold  px-2">Volume JPH</div>
          <div className="bg-white px-2">
            <ul className="list-disc list-inside space-y-1">
              {contract?.volumeJph ? (
                <li>
                  {contract.volumeJph.value} {contract.volumeJph.unit}
                  {contract.volumeJph.notes
                    ? ` (${contract.volumeJph.notes})`
                    : ""}
                </li>
              ) : (
                <>
                  <li>
                    34,80 BBTUD (WK Bentu : 32,8 BBTUD &amp; WK Korinci: 2 BBTUD
                    (Tahun 2025)
                  </li>
                  <li>37,10 BBTUD (Tahun 2026)</li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] ">
          <div className="bg-white  font-semibold  px-2">Volume TOP</div>
          <div className="bg-white px-2">
            {contract?.volumeTop
              ? `${contract.volumeTop.percentage}% x JPH = ${contract.volumeTop.value} BBTUD`
              : "70% x JPH = 24,36 BBTUD (Tahun 2025) [Tahunan]"}
            {contract?.volumeTop?.notes ? ` (${contract.volumeTop.notes})` : ""}
          </div>
        </div>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white  font-semibold  px-2">Volume JPMH</div>
          <div className="bg-white px-2">
            110% x JPH = 38,28 BBTUD (Tahun 2025)
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white  font-semibold  px-2">Unit yang dipasok</div>
          <div className="bg-white px-2">
            <ul className="list-disc list-inside space-y-1">
              {contract?.unitYangDipasok &&
              contract.unitYangDipasok.length > 0 ? (
                contract.unitYangDipasok.map(
                  (unit: {
                    siteId: string;
                    name: string;
                    siteType: string;
                  }) => (
                    <li key={unit.siteId}>
                      {unit.name} ({unit.siteType})
                    </li>
                  ),
                )
              ) : (
                <>
                  <li>Balai Pungut Duri (Via Pipa: TGI Sumbagteng)</li>
                  <li>PLTGU Riau MRPR (Via Pipa: TGI Sumbagteng/ SGP 2)</li>
                  <li>Teluk lembu (plant gate)</li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr]">
          <div className="bg-white  font-semibold  px-2">Harga PJBG</div>
          <div className="bg-white px-2">
            <ul className="list-disc list-inside space-y-1">
              {contract?.hargaPjbg ? (
                <li>
                  {contract.hargaPjbg.value} {contract.hargaPjbg.unit}
                </li>
              ) : (
                <>
                  <li>6,00 $/mmbtu : WK Bentu</li>
                  <li>4,00 $/mmbtu : WK Korinci</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
