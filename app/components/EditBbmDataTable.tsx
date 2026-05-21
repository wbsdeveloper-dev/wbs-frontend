"use client";

import { useState, useMemo } from "react";
import {
  Pencil,
  Trash2,
  Menu,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { BbmRecord } from "@/hooks/service/bbm-api";
import { usePrivilege } from "@/hooks/usePrivilege";

interface EditBbmDataTableProps {
  records: BbmRecord[];
  isLoading: boolean;
}

const ActionButtons = ({
  id,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: {
  id: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}) => (
  <div className="flex items-center justify-center gap-1">
    {canUpdate && (
      <button
        onClick={() => onEdit(id)}
        className="p-1.5 text-[#115d72] hover:bg-[#115d72]/10 rounded-lg transition-colors"
        title="Edit"
      >
        <Pencil size={16} />
      </button>
    )}
    {canDelete && (
      <button
        onClick={() => onDelete(id)}
        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Hapus"
      >
        <Trash2 size={16} />
      </button>
    )}
  </div>
);

export default function EditBbmDataTable({
  records,
  isLoading,
}: EditBbmDataTableProps) {
  const router = useRouter();
  const { hasPrivilege } = usePrivilege();
  const canUpdate = hasPrivilege("data_management", "UPDATE");
  const canDelete = hasPrivilege("data_management", "DELETE");
  const hasAction = canUpdate || canDelete;

  type SortField = keyof BbmRecord;
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortField(null);
      setSortDir("asc");
    }
  };

  const sortedRecords = useMemo(() => {
    if (!sortField) return records;
    return [...records].sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [records, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronsUpDown size={12} className="ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="ml-1 text-[#115d72]" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-[#115d72]" />
    );
  };

  const Th = ({
    label,
    field,
    align = "center",
  }: {
    label: string;
    field?: SortField;
    align?: "left" | "center" | "right";
  }) => (
    <th
      className={`px-4 py-3 text-${align} text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
        field
          ? "cursor-pointer select-none hover:bg-gray-100 transition-colors"
          : ""
      }`}
      onClick={field ? () => handleSort(field) : undefined}
    >
      <span className="inline-flex items-center justify-center">
        {label}
        {field && <SortIcon field={field} />}
      </span>
    </th>
  );

  const fmt = (val: number | null | undefined): string => {
    if (val == null) return "-";
    return val.toLocaleString("id-ID");
  };

  const handleDeleteClick = (id: string, name: string) => {
    // TBD: connect to a delete API if needed
    if (window.confirm(`Apakah Anda yakin ingin menghapus record ${name}?`)) {
        alert("Delete action triggered for " + id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <Menu size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Tabel BBM Monthly
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th label="No" />
              <Th label="Bulan" field="reportDate" />
              <Th label="TBBM" field="tbbm" align="left" />
              <Th label="Pembangkit" field="pembangkit" align="left" />
              <Th label="Produk" field="product" />
              <Th label="Nominasi" field="nomination" />
              <Th label="Usage" field="usage" />
              <Th label="Realization" field="realization" />
              {hasAction && <Th label="Aksi" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={hasAction ? 9 : 8}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin text-[#14a2bb]" size={20} />
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td
                  colSpan={hasAction ? 9 : 8}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Tidak ada data BBM
                </td>
              </tr>
            ) : (
              sortedRecords.map((record, index) => {
                const rowId = record.id || `${record.pembangkit}-${record.reportDate}-${index}`;
                return (
                  <tr
                    key={rowId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-gray-700">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">
                      {record.reportDate}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.tbbm}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {record.pembangkit}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {record.product}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono">
                      {fmt(record.nomination)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono">
                      {fmt(record.usage)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 font-mono font-medium">
                      {fmt(record.realization)}
                    </td>
                    {hasAction && (
                      <td className="px-4 py-3 text-center">
                        <ActionButtons
                          id={rowId}
                          onEdit={(id) => router.push(`/edit-bbm/${id}`)}
                          onDelete={(id) =>
                            handleDeleteClick(
                              id,
                              `${record.pembangkit} - ${record.reportDate}`
                            )
                          }
                          canUpdate={canUpdate}
                          canDelete={canDelete}
                        />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
