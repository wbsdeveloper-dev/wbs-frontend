"use client";

import React, { useState } from "react";
import {
  Save,
  Rocket,
  Copy,
  ChevronDown,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Play,
  AlertCircle,
  CheckCircle,
  Upload,
  Download,
} from "lucide-react";
import { downloadFieldsCSV } from "../utils/csvExport";
import CSVImportModal from "./CSVImportModal";
import Card, { CardHeader } from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui";
import type { Template, TemplateField } from "@/hooks/service/config-api";
import { useAiModels } from "@/hooks/service/config-api";

interface TemplateEditorProps {
  template: Template;
  onUpdate: (template: Template) => void;
  onActivate?: (template: Template) => void;
  onAddGroup?: (name: string) => void;
  groupConfigs: { id: string; name: string }[];
  spreadsheetSources: { id: string; name: string }[];
}

const FIELD_KEY_OPTIONS = [
  "report_date",
  "site_name",
  "metric_type",
  "period_value",
  "value",
  "unit",
  "supplier",
  "transportir",
  "records",
  "notes",
  "custom",
];

const SOURCE_KIND_OPTIONS: {
  value: TemplateField["sourceKind"];
  label: string;
}[] = [
  { value: "SHEET_COLUMN", label: "Sheet Column" },
  { value: "WA_REGEX", label: "WA Regex" },
  { value: "WA_REGEX_RECORDS", label: "WA Regex Records" },
  { value: "WA_FIXED", label: "WA Fixed Value" },
  { value: "AI_JSON_PATH", label: "AI JSON Path" },
];

export default function TemplateEditor({
  template,
  onUpdate,
  onActivate,
  onAddGroup,
  groupConfigs,
  spreadsheetSources,
}: TemplateEditorProps) {
  // Normalize WA_REGEX_RECORDS fields when loading from API
  const normalizedTemplate = {
    ...template,
    fields: (template.fields ?? []).map((field) => {
      if (field.sourceKind === "WA_REGEX_RECORDS") {
        try {
          const parsed = JSON.parse(field.sourceRef);
          return {
            ...field,
            sourceRef: JSON.stringify(parsed),
          };
        } catch {
          return field;
        }
      }
      return field;
    }),
  };

  const [formData, setFormData] = useState<Template>(normalizedTemplate);
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);
  const { data: aiModels = [], isLoading: isLoadingModels } = useAiModels();
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    data?: Record<string, string>;
    error?: string;
  } | null>(null);

  // Field form state
  const [fieldForm, setFieldForm] = useState({
    fieldKey: "",
    customFieldKey: "",
    sourceKind: "SHEET_COLUMN" as TemplateField["sourceKind"],
    sourceRef: "",
    transform: "",
    isRequired: true,
  });

  // Inline add-group form state
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Reset is handled by the parent via key={template.id}

  const handleSaveDraft = () => {
    onUpdate({
      ...formData,
      fields: formData.fields.map((f, i) => ({ ...f, orderNo: i + 1 })),
    });
  };

  const handleActivate = () => {
    if (formData.parserMode === "AI_ASSISTED" && formData.aiOutputSchema) {
      // aiOutputSchema is already an object from the API; validate it's truthy
      if (typeof formData.aiOutputSchema !== "object") {
        alert("AI Output Schema harus valid JSON");
        return;
      }
    }
    if (onActivate) {
      onActivate(formData);
    } else {
      // Fallback: use onUpdate
      onUpdate({
        ...formData,
        status: "ACTIVE",
        version: formData.version + 1,
      });
    }
  };

  const handleAddField = () => {
    const key =
      fieldForm.fieldKey === "custom"
        ? fieldForm.customFieldKey
        : fieldForm.fieldKey;
    if (!key) return;

    // Check uniqueness
    if (
      formData.fields.some(
        (f) => f.fieldKey === key && f.id !== editingField?.id,
      )
    ) {
      alert("Field key harus unik");
      return;
    }

    // Validate and normalize sourceRef for WA_REGEX_RECORDS
    let normalizedSourceRef = fieldForm.sourceRef;
    if (fieldForm.sourceKind === "WA_REGEX_RECORDS") {
      try {
        const parsed = JSON.parse(fieldForm.sourceRef);
        normalizedSourceRef = JSON.stringify(parsed);
      } catch (error) {
        // Attempt to auto-fix common regex backslash issues (e.g. \s -> \\s)
        try {
          // Replace backslashes that are NOT followed by valid JSON escape chars
          const fixed = fieldForm.sourceRef.replace(
            /\\(?![/\"\\bfnrtu])/g,
            "\\\\",
          );
          const parsed = JSON.parse(fixed);
          normalizedSourceRef = JSON.stringify(parsed);
        } catch {
          alert(
            "sourceRef harus berupa valid JSON. Pastikan escape characters (\\) ditulis double (\\\\) atau gunakan format yang benar.",
          );
          return;
        }
      }
    }

    if (editingField) {
      // Update existing field
      setFormData({
        ...formData,
        fields: formData.fields.map((f) =>
          f.id === editingField.id
            ? {
                ...f,
                fieldKey: key,
                sourceKind: fieldForm.sourceKind,
                sourceRef: normalizedSourceRef,
                transform: fieldForm.transform || null,
                isRequired: fieldForm.isRequired,
              }
            : f,
        ),
      });
    } else {
      // Add new field
      const newField: TemplateField = {
        id: crypto.randomUUID(),
        ingestionTemplateId: formData.id,
        orderNo: formData.fields.length + 1,
        fieldKey: key,
        sourceKind: fieldForm.sourceKind,
        sourceRef: normalizedSourceRef,
        transform: fieldForm.transform || null,
        isRequired: fieldForm.isRequired,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setFormData({
        ...formData,
        fields: [...formData.fields, newField],
      });
    }

    resetFieldForm();
  };

  const resetFieldForm = () => {
    setFieldForm({
      fieldKey: "",
      customFieldKey: "",
      sourceKind: "SHEET_COLUMN",
      sourceRef: "",
      transform: "",
      isRequired: true,
    });
    setEditingField(null);
    setIsFieldModalOpen(false);
  };

  const handleEditField = (field: TemplateField) => {
    const isCustom = !FIELD_KEY_OPTIONS.slice(0, -1).includes(field.fieldKey);
    setFieldForm({
      fieldKey: isCustom ? "custom" : field.fieldKey,
      customFieldKey: isCustom ? field.fieldKey : "",
      sourceKind: field.sourceKind,
      sourceRef: field.sourceRef,
      transform: field.transform || "",
      isRequired: field.isRequired,
    });
    setEditingField(field);
    setIsFieldModalOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields
        .filter((f) => f.id !== fieldId)
        .map((f, idx) => ({ ...f, orderNo: idx + 1 })),
    });
  };

  const handleMoveField = (fromIndex: number, direction: "up" | "down") => {
    const newFields = [...formData.fields];
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= newFields.length) return;

    [newFields[fromIndex], newFields[toIndex]] = [
      newFields[toIndex],
      newFields[fromIndex],
    ];
    setFormData({
      ...formData,
      fields: newFields.map((f, idx) => ({ ...f, orderNo: idx + 1 })),
    });
  };

  const handleTestParse = () => {
    if (!testInput.trim()) {
      setTestResult({ success: false, error: "Masukkan sample untuk test" });
      return;
    }

    // Mock parsing based on fields
    const result: Record<string, string> = {};
    let hasError = false;

    formData.fields.forEach((field) => {
      if (field.sourceKind === "WA_REGEX") {
        try {
          const regex = new RegExp(field.sourceRef);
          const match = testInput.match(regex);
          if (match && match[1]) {
            result[field.fieldKey] = match[1];
          } else if (field.isRequired) {
            hasError = true;
          }
        } catch {
          hasError = true;
        }
      } else if (field.sourceKind === "WA_REGEX_RECORDS") {
        try {
          const regexConfigs = JSON.parse(field.sourceRef);
          const matches: string[] = [];
          regexConfigs.forEach((config: { regex: string }) => {
            const regex = new RegExp(config.regex, "g");
            let m: RegExpExecArray | null;
            while ((m = regex.exec(testInput)) !== null) {
              if (m[1]) matches.push(m[1]);
            }
          });
          if (matches.length > 0) {
            result[field.fieldKey] = matches.join(", ");
          } else if (field.isRequired) {
            hasError = true;
          }
        } catch {
          hasError = true;
        }
      } else if (field.sourceKind === "WA_FIXED") {
        result[field.fieldKey] = field.sourceRef;
      } else {
        // Mock values for other kinds
        result[field.fieldKey] = `[${field.sourceRef}]`;
      }
    });

    if (hasError) {
      setTestResult({
        success: false,
        error: "Beberapa required field tidak ditemukan",
        data: result,
      });
    } else {
      setTestResult({ success: true, data: result });
    }
  };

  const handleExportCSV = () => {
    try {
      downloadFieldsCSV(formData.fields, formData.name);
    } catch (error) {
      alert("Gagal mengekspor CSV: " + (error as Error).message);
    }
  };

  const handleImportFields = (importedFields: TemplateField[]) => {
    setFormData({
      ...formData,
      fields: importedFields.map((f, i) => ({
        ...f,
        orderNo: i + 1,
        ingestionTemplateId: formData.id,
      })),
    });
  };

  return (
    <div className="space-y-4">
      {/* Form Section */}
      <Card>
        <CardHeader
          title={formData.name}
          description={`Version ${formData.version} • ${formData.status}`}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <Save size={16} />
                Simpan Draft
              </button>
              {formData.status !== "ACTIVE" && (
                <button
                  onClick={handleActivate}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200"
                >
                  <Rocket size={16} />
                  Activate
                </button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
            />
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Scope
            </label>
            <div className="relative">
              <select
                value={formData.scope}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scope: e.target.value as Template["scope"],
                  })
                }
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
                disabled={formData.status === "ACTIVE"}
              >
                <option value="WA_GROUP">WA Group</option>
                <option value="SPREADSHEET_SOURCE">Spreadsheet Source</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Parser Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Parser Mode
            </label>
            <div className="relative">
              <select
                value={formData.parserMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parserMode: e.target.value as Template["parserMode"],
                  })
                }
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
              >
                <option value="RULE_BASED">Rule Based</option>
                <option value="AI_ASSISTED">AI Assisted</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Group Config (for WA_GROUP) */}
          {formData.scope === "WA_GROUP" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Group Config
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={formData.groupConfigId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        groupConfigId: e.target.value || null,
                      })
                    }
                    className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
                  >
                    <option value="">Pilih Group</option>
                    {groupConfigs.map((gc) => (
                      <option key={gc.id} value={gc.id}>
                        {gc.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {onAddGroup && (
                  <button
                    type="button"
                    onClick={() => setIsAddingGroup(true)}
                    className="shrink-0 px-2.5 py-2.5 text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 active:scale-95"
                    title="Tambah Group Baru"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Spreadsheet Source (for SPREADSHEET_SOURCE) */}
          {formData.scope === "SPREADSHEET_SOURCE" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Spreadsheet Source
              </label>
              <div className="relative">
                <select
                  value={formData.spreadsheetSourceId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      spreadsheetSourceId: e.target.value || null,
                    })
                  }
                  className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
                >
                  <option value="">Pilih Source</option>
                  {spreadsheetSources.map((ss) => (
                    <option key={ss.id} value={ss.id}>
                      {ss.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Is Default */}
          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="w-4 h-4 text-[#115d72] border-gray-300 rounded focus:ring-[#14a2bb]"
              />
              <span className="text-sm text-gray-700">Set as Default</span>
            </label>
          </div>
        </div>

        {/* Hints Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Hints & Config
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.scope === "WA_GROUP" && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    WA Keyword Hint
                  </label>
                  <input
                    type="text"
                    value={formData.waKeywordHint || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        waKeywordHint: e.target.value,
                      })
                    }
                    placeholder="e.g., LAPORAN HARIAN"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    WA Sender Hint
                  </label>
                  <input
                    type="text"
                    value={formData.waSenderHint || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, waSenderHint: e.target.value })
                    }
                    placeholder="e.g., PLN"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]"
                  />
                </div>
              </>
            )}
            {formData.scope === "SPREADSHEET_SOURCE" && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Sheet Tab Hint
                  </label>
                  <input
                    type="text"
                    value={formData.sheetTabHint || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, sheetTabHint: e.target.value })
                    }
                    placeholder="e.g., Gas Pipa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Sheet Header Row
                  </label>
                  <input
                    type="number"
                    value={formData.sheetHeaderRow || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sheetHeaderRow: parseInt(e.target.value) || null,
                      })
                    }
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Settings */}
        {formData.parserMode === "AI_ASSISTED" && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              AI Settings
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  AI Model
                </label>
                <div className="relative">
                  <select
                    value={formData.aiModel || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, aiModel: e.target.value })
                    }
                    className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
                  >
                    <option value="">Pilih Model</option>
                    {isLoadingModels ? (
                      <option disabled>Memuat model...</option>
                    ) : (
                      aiModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                          {model.isDefault ? " (Default)" : ""}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  AI Prompt Template
                </label>
                <textarea
                  value={formData.aiPromptTemplate || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aiPromptTemplate: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Use {{message}} as placeholder..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] resize-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  AI Output Schema (JSON)
                </label>
                <textarea
                  value={
                    formData.aiOutputSchema
                      ? JSON.stringify(formData.aiOutputSchema, null, 2)
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    try {
                      const parsed = raw ? JSON.parse(raw) : null;
                      setFormData({ ...formData, aiOutputSchema: parsed });
                    } catch {
                      // Allow typing invalid JSON mid-edit; store raw as-is
                      // by wrapping in a simple object so it doesn't break the type
                      setFormData({
                        ...formData,
                        aiOutputSchema: { __raw: raw } as Record<
                          string,
                          unknown
                        >,
                      });
                    }
                  }}
                  rows={3}
                  placeholder='{"type": "object", "properties": {...}}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] resize-none font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Fields Table Section */}
      <Card>
        <CardHeader
          title="Template Fields"
          description={`${formData.fields.length} field(s) defined`}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCSVImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                title="Import Fields from CSV"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                title="Export Fields to CSV"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => {
                  resetFieldForm();
                  setIsFieldModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200"
              >
                <Plus size={16} />
                Add Field
              </button>
            </div>
          }
        />

        {formData.fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Belum ada field</p>
            <p className="text-xs mt-1">
              Klik &quot;Add Field&quot; untuk menambahkan
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-10 px-2 py-3 text-left text-xs font-semibold text-gray-600">
                    #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">
                    Field Key
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">
                    Source Kind
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">
                    Source Ref
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">
                    Required
                  </th>
                  <th className="w-24 px-3 py-3 text-right text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.fields.map((field, index) => (
                  <tr
                    key={field.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveField(index, "up")}
                          disabled={index === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <GripVertical size={14} />
                        </button>
                        <span className="text-xs text-gray-400">
                          {field.orderNo}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {field.fieldKey}
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {field.sourceKind}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-600 max-w-[200px] truncate">
                      {field.sourceRef}
                    </td>
                    <td className="px-3 py-3">
                      {field.isRequired ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditField(field)}
                          className="p-1.5 text-gray-400 hover:text-[#115d72] hover:bg-[#115d72]/10 rounded transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Preview & Test Section */}
      <Card>
        <CardHeader
          title="Preview & Test"
          description="Test template dengan sample data"
        />
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {formData.scope === "WA_GROUP"
                ? "Sample WA Message"
                : "Sample Sheet Row (JSON)"}
            </label>
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={3}
              placeholder={
                formData.scope === "WA_GROUP"
                  ? "Paste sample WA message here..."
                  : '{"A": "value1", "B": "value2", ...}'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] resize-none"
            />
          </div>
          <button
            onClick={handleTestParse}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200"
          >
            <Play size={16} />
            Run Test
          </button>

          {testResult && (
            <div
              className={`p-4 rounded-lg ${
                testResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}
                >
                  {testResult.success ? "Parsing Berhasil" : testResult.error}
                </span>
              </div>
              {testResult.data && (
                <pre className="text-xs font-mono bg-white p-2 rounded border overflow-auto max-h-40">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Field Modal */}
      <Modal
        isOpen={isFieldModalOpen}
        onClose={resetFieldForm}
        title={editingField ? "Edit Field" : "Add Field"}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Field Key
            </label>
            <div className="relative">
              <select
                value={fieldForm.fieldKey}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, fieldKey: e.target.value })
                }
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] bg-white cursor-pointer pr-10"
              >
                <option value="">Pilih Field Key</option>
                {FIELD_KEY_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {fieldForm.fieldKey === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Custom Field Key
              </label>
              <input
                type="text"
                value={fieldForm.customFieldKey}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, customFieldKey: e.target.value })
                }
                placeholder="e.g., custom_field"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Source Kind
            </label>
            <div className="relative">
              <select
                value={fieldForm.sourceKind}
                onChange={(e) =>
                  setFieldForm({
                    ...fieldForm,
                    sourceKind: e.target.value as TemplateField["sourceKind"],
                  })
                }
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] bg-white cursor-pointer pr-10"
              >
                {SOURCE_KIND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {fieldForm.sourceKind === "WA_REGEX_RECORDS" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Source Ref
                <span className="text-xs text-gray-400 ml-1">
                  (JSON array of record configs)
                </span>
              </label>
              <textarea
                value={fieldForm.sourceRef}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, sourceRef: e.target.value })
                }
                rows={6}
                placeholder={
                  '[\n  {"metric_type": "FLOWRATE_MMSCFD", "period_type": "hour", "regex": "Flow[\\s\\S]*?Current\\s+Rate\\s*:\\s*([\\d.,]+)\\s*MMSCFD", "unit": "MMSCFD"}\n]'
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] font-mono resize-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Source Ref
                {fieldForm.sourceKind === "WA_REGEX" && (
                  <span className="text-xs text-gray-400 ml-1">
                    (Regex pattern)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={fieldForm.sourceRef}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, sourceRef: e.target.value })
                }
                placeholder={
                  fieldForm.sourceKind === "SHEET_COLUMN"
                    ? "e.g., A or Column Name"
                    : fieldForm.sourceKind === "WA_REGEX"
                      ? "e.g., Site:\\s*(.+)"
                      : fieldForm.sourceKind === "AI_JSON_PATH"
                        ? "e.g., $.site_name"
                        : "Fixed value"
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Transform{" "}
              <span className="text-xs text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <select
                value={fieldForm.transform}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, transform: e.target.value })
                }
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] bg-white cursor-pointer pr-10"
              >
                <option value="">None</option>
                <option value="date">Date (→ YYYY-MM-DD)</option>
                <option value="number">Number</option>
                <option value="integer">Integer</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="trim">Trim</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldForm.isRequired}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, isRequired: e.target.checked })
                }
                className="w-4 h-4 text-[#115d72] border-gray-300 rounded focus:ring-[#14a2bb]"
              />
              <span className="text-sm text-gray-700">Required Field</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={resetFieldForm}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Batal
            </button>
            <button
              onClick={handleAddField}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200"
            >
              {editingField ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Group Modal */}
      <Modal
        isOpen={isAddingGroup}
        onClose={() => {
          setNewGroupName("");
          setIsAddingGroup(false);
        }}
        title="Tambah Group Baru"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Group <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newGroupName.trim()) {
                  onAddGroup?.(newGroupName.trim());
                  setNewGroupName("");
                  setIsAddingGroup(false);
                }
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
              placeholder="Contoh: PLN Bandung Group"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setNewGroupName("");
                setIsAddingGroup(false);
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (newGroupName.trim()) {
                  onAddGroup?.(newGroupName.trim());
                  setNewGroupName("");
                  setIsAddingGroup(false);
                }
              }}
              disabled={!newGroupName.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tambah
            </button>
          </div>
        </div>
      </Modal>
      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVImportModalOpen}
        onClose={() => setIsCSVImportModalOpen(false)}
        onImport={handleImportFields}
        existingFields={formData.fields}
        template={formData}
      />
    </div>
  );
}
