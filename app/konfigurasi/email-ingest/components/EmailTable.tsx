"use client";

import React from "react";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { EmailAddress } from "../page";

interface EmailTableProps {
  emails: EmailAddress[];
  selectedRows: string[];
  onSelectRows: (ids: string[]) => void;
  onRowClick: (email: EmailAddress) => void;
  onDelete: (id: string) => void;
}

export default function EmailTable({
  emails,
  selectedRows,
  onSelectRows,
  onRowClick,
  onDelete,
}: EmailTableProps) {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectRows(emails.map((email) => email.id));
    } else {
      onSelectRows([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      onSelectRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      onSelectRows([...selectedRows, id]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-12 px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedRows.length === emails.length && emails.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-[#115d72] border-gray-300 rounded focus:ring-[#14a2bb] cursor-pointer"
                />
              </th>
              <th className="px-4 py-4 text-left">
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  Email
                  <span className="text-gray-400">↕</span>
                </div>
              </th>
              <th className="px-4 py-4 text-left">
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  Provider
                  <span className="text-gray-400">↕</span>
                </div>
              </th>
              <th className="px-4 py-4 text-left">
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  Site Mapping
                  <span className="text-gray-400">↕</span>
                </div>
              </th>
              <th className="px-4 py-4 text-left">
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  Template
                </div>
              </th>
              <th className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-700">
                  Status
                  <span className="text-gray-400">↕</span>
                </div>
              </th>
              <th className="px-4 py-4 text-center">
                <div className="text-sm font-semibold text-gray-700">
                  Aksi
                  <span className="text-gray-400 ml-1">↕</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email, index) => (
              <tr
                key={email.id}
                className={`border-b border-gray-100 hover:bg-[#f0fdfa] transition-colors duration-150 cursor-pointer ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                }`}
                onClick={() => onRowClick(email)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(email.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectRow(email.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-[#115d72] border-gray-300 rounded focus:ring-[#14a2bb] cursor-pointer"
                  />
                </td>
                <td className="px-4 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {email.email}
                    </div>
                    <div className="text-xs text-gray-500">{email.label}</div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-700">{email.provider}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-sm ${email.siteMapping ? "text-gray-700" : "text-gray-400 italic"}`}>
                    {email.siteMapping || "Belum dimapping"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-sm ${email.appliedTemplate ? "text-gray-700" : "text-gray-400 italic"}`}>
                    {email.appliedTemplate || "Tidak ada"}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      email.status === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <CheckCircle size={12} />
                    {email.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(email);
                      }}
                      className="p-2 text-gray-500 hover:text-[#115d72] hover:bg-[#115d72]/10 rounded-lg transition-all duration-200"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(email.id);
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  Tidak ada data email ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Menampilkan {emails.length} email
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Previous
          </button>
          <button className="px-3 py-1.5 text-sm text-white bg-[#115d72] rounded-lg">
            1
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
