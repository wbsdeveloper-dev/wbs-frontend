"use client";

import React, { useState } from "react";
import { useGetEmailInbox, useTestTemplateParse } from "../../../../hooks/service/config-api";
import type { UpdateTemplatePayload, EmailInboxRecord } from "../../../../hooks/service/config-api";
import { useQueryClient } from "@tanstack/react-query";

interface TestExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateData: Partial<UpdateTemplatePayload>;
}

const FIELD_LABELS: Record<string, string> = {
  report_date: "Tanggal Laporan",
  site_name: "Pembangkit",
  supplier: "Pemasok",
  metric_type: "Jenis Metrik",
  period_type: "Tipe Periode",
  period_value: "Nilai Periode",
  value: "Nilai",
  unit: "Satuan",
};

function ReconciliationRow({ row, index }: { row: any; index: number }) {
  const overrides = row._overrides_applied || {};
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden mb-3">
      <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 flex-wrap border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-600 mr-auto">Record #{index + 1}</span>
        {(overrides.supplier_from_fixed_field || overrides.site_name_from_fixed_field) && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            ✓ Pemasok/Pembangkit dari Field Tetap
          </span>
        )}
        {overrides.metric_type_overridden && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
            ✓ Metric Type di-override
          </span>
        )}
        {overrides.converted_to_bbtud && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            ✓ Dikonversi ke BBTUD (÷1000)
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4">
        {Object.entries(row)
          .filter(([key]) => !key.startsWith("_"))
          .map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                {FIELD_LABELS[key] || key}
              </span>
              <span className={`text-sm font-semibold mt-0.5 ${val === null || val === undefined ? "text-gray-300 italic" : "text-gray-900"}`}>
                {val === null || val === undefined ? "—" : String(val)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export function TestExtractionModal({ isOpen, onClose, templateData }: TestExtractionModalProps) {
  const { data: inbox } = useGetEmailInbox();
  const qc = useQueryClient();
  const testParseMutation = useTestTemplateParse({
    onSuccess: (data) => {
      // Invalidate email inbox so is_processed reflects correctly
      qc.invalidateQueries({ queryKey: ["email-inbox"] });

      console.log("=== OUTPUT FORMAT AFTER AI PROCESSING (parsedResult) ===");
      console.log(data?.parsedResult);
      console.log("======================================================");

      console.log("=== DATA BEFORE SAVE TO RECONCILIATION (reconciliationPreview) ===");
      console.log(data?.reconciliationPreview);
      console.log("==================================================================");
    },
  });
  const [selectedInboxId, setSelectedInboxId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"preview" | "raw" | "ocr">("preview");

  if (!isOpen) return null;

  const filteredInbox = inbox?.filter(
    (item: EmailInboxRecord) => templateData.spreadsheetSourceId ? item.email_source_id === templateData.spreadsheetSourceId : true
  ) || [];

  const handleTest = () => {
    if (!selectedInboxId) return;
    testParseMutation.mutate({
      inboxId: selectedInboxId,
      template: templateData,
      fields: (templateData as any).fields || []
    });
  };

  const result = testParseMutation.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Uji Coba Ekstraksi</h2>
            <p className="text-xs text-gray-500 mt-0.5">Lihat hasil ekstraksi sebelum data masuk ke sistem</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Email selector */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Email (Inbox)</label>
              <select
                value={selectedInboxId}
                onChange={(e) => setSelectedInboxId(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm sm:text-sm p-2.5 border focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="">-- Pilih Email untuk Diuji --</option>
                {filteredInbox.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {new Date(item.received_at).toLocaleString("id-ID")} — {item.subject} ({item.sender})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleTest}
              disabled={!selectedInboxId || testParseMutation.isPending}
              className="bg-secondary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {testParseMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : "Jalankan Uji Coba"}
            </button>
          </div>

          {/* Error */}
          {testParseMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <p className="font-bold mb-1">Error</p>
              <p>{testParseMutation.error?.message || "Terjadi kesalahan saat mengekstrak data"}</p>
            </div>
          )}

          {/* Results */}
          {testParseMutation.isSuccess && result && (
            <div className="flex flex-col gap-3 flex-1">
              {/* Save status banner */}
              {result.saved && (
                <div className={`p-3 rounded-lg border text-sm ${
                  result.saved.errors?.length > 0
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : result.saved.count > 0
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}>
                  {result.saved.count > 0 ? (
                    <p className="font-medium">
                      ✅ {result.saved.count} record berhasil disimpan ke <code>reconciliation_results</code> ({"pln_value"} diisi) dan email ditandai <code>is_processed = true</code>.
                    </p>
                  ) : (
                    <p className="font-medium">⚠️ Tidak ada record yang berhasil disimpan ke database.</p>
                  )}
                  {result.saved.errors?.length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-xs opacity-80">
                      {result.saved.errors.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-200">
                {[
                  { key: "preview", label: "📋 Preview Rekonsiliasi" },
                  { key: "raw", label: "📦 Data Mentah (JSON)" },
                  { key: "ocr", label: "📄 Teks OCR" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-secondary text-secondary"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab: Reconciliation Preview */}
              {activeTab === "preview" && (
                <div className="flex flex-col gap-2">
                  {result.reconciliationPreview?.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mb-1">
                        <strong>{result.reconciliationPreview.length}</strong> record siap dimasukkan ke <code>reconciliation_results</code>.{" "}
                        Nilai dengan <span className="bg-blue-100 text-blue-700 px-1 rounded">Override dari Field Tetap</span> berasal dari field <strong>Nilai Tetap (WA_FIXED)</strong> di template — bukan dari AI.
                      </p>
                      {result.reconciliationPreview.map((row: any, i: number) => (
                        <ReconciliationRow key={i} row={row} index={i} />
                      ))}
                    </>
                  ) : (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      Tidak ada record yang berhasil diekstrak. Periksa konfigurasi template Anda.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Raw JSON */}
              {activeTab === "raw" && (
                <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-auto flex-1 whitespace-pre-wrap min-h-[300px]">
                  {JSON.stringify({ context: result.context, parsedResult: result.parsedResult }, null, 2)}
                </pre>
              )}

              {/* Tab: OCR Text */}
              {activeTab === "ocr" && (
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-auto flex-1 whitespace-pre-wrap min-h-[300px]">
                  {result.extractedText}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
