"use client";

import React from "react";

import { Paperclip, Loader2 } from "lucide-react";

import { useGetEmailInbox, type EmailInboxRecord } from "@/hooks/service/config-api";

export default function EmailInboxTable() {
  const { data: inbox = [], isLoading, isError } = useGetEmailInbox();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-emerald-500" />
        <p>Memuat data email masuk...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Gagal memuat data email masuk. Silakan coba lagi.</p>
      </div>
    );
  }

  if (inbox.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-50/50 rounded-lg border border-slate-200 border-dashed">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Paperclip className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-medium text-slate-900">Belum ada email masuk</h3>
        <p className="mt-1 text-sm text-slate-500">
          Email yang berhasil di-fetch oleh worker akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-sm font-semibold text-gray-900 w-[180px]">Waktu Diterima</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-900">Nama Rule</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-900">Pengirim</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-900 min-w-[250px]">Subjek</th>
            <th className="px-4 py-3 text-sm font-semibold text-gray-900 text-right w-[120px]">Attachment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {inbox.map((email: EmailInboxRecord) => (
            <tr key={email.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                {new Date(email.received_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(/\./g, ":")}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {email.source_name || "Tanpa Rule"}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                <span className="truncate block max-w-[200px]" title={email.sender}>
                  {email.sender.replace(/<.*>/, "").trim() || email.sender}
                </span>
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {email.subject || "(Tanpa Subjek)"}
              </td>
              <td className="px-4 py-3 text-right">
                {email.attachment_refs && email.attachment_refs.length > 0 ? (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <Paperclip className="h-3 w-3 mr-1" />
                    {email.attachment_refs.length} File
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
