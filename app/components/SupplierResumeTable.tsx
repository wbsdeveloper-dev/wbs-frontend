"use client";

import { Loader2 } from "lucide-react";
import type { Contract } from "@/hooks/service/contract-api";

interface SupplierResumeTableProps {
  contracts?: Contract[] | null;
  isLoading?: boolean;
}

function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return isoStr;
  }
}

function ContractCard({ contract }: { contract: Contract }) {
  return (
    <div className="w-full text-sm text-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">Jenis Kontrak</div>
          <div className="bg-white px-2">{contract.doc_type || "-"}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">Region</div>
          <div className="bg-white px-2">{contract.region || "-"}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">Nomor Kontrak</div>
          <div className="bg-white px-2">
            <ul className="list-disc list-inside">
              <li>
                {contract.no_kontrak_terbaru || contract.no_kontrak_awal || "-"}
              </li>
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">Jangka Waktu</div>
          <div className="bg-white px-2">
            {contract.awal_perjanjian || contract.akhir_perjanjian
              ? `${formatDate(contract.awal_perjanjian)} s/d ${formatDate(contract.akhir_perjanjian)}`
              : "-"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr]">
          <div className="bg-white font-semibold px-2">Pemasok</div>
          <div className="bg-white px-2">{contract.pemasok_name || "-"}</div>
        </div>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">Volume JPMH</div>
          <div className="bg-white px-2">
            {contract.volume_jpmh_bbtud != null
              ? `${contract.volume_jpmh_bbtud} BBTUD`
              : "-"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">TJK</div>
          <div className="bg-white px-2">
            {contract.tjk_bbtud != null ? `${contract.tjk_bbtud} BBTUD` : "-"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">Pembangkit</div>
          <div className="bg-white px-2">{contract.pembangkit_name || "-"}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] border-b border-gray-300 mb-1 border-dashed">
          <div className="bg-white font-semibold px-2">Harga PJBG</div>
          <div className="bg-white px-2">
            {contract.price_value != null
              ? `${contract.price_value || ""}`
              : "-"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr]">
          <div className="bg-white font-semibold px-2">Status</div>
          <div className="bg-white px-2">{contract.status || "-"}</div>
        </div>
      </div>
    </div>
  );
}

export default function SupplierResumeTable({
  contracts,
  isLoading,
}: SupplierResumeTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-[#14a2bb]" size={32} />
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className="w-full text-sm text-gray-800 flex items-center justify-center py-8">
        <p>Data kontrak tidak ditemukan, mohon pastikan pemasok sudah sesuai</p>
      </div>
    );
  }

  return (
    <div
      className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1
  [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {contracts.map((contract, idx) => (
        <div
          key={contract.id}
          className="min-w-[300px] w-full flex-shrink-0 snap-start"
        >
          {contracts.length > 1 && (
            <p className="text-xs font-semibold text-[#115d72] mb-2 uppercase tracking-wide">
              {contract.pembangkit_name ? `${contract.pembangkit_name}` : ""}
            </p>
          )}

          <ContractCard contract={contract} />
        </div>
      ))}
    </div>
  );
}
