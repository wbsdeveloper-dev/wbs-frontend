"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Download,
  ChevronDown,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import Card, { CardHeader } from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui";
import TemplateList from "./components/TemplateList";
import TemplateEditor from "./components/TemplateEditor";

// Types
export interface TemplateField {
  id: string;
  orderNo: number;
  fieldKey: string;
  sourceKind: "SHEET_COLUMN" | "WA_REGEX" | "WA_FIXED" | "AI_JSON_PATH";
  sourceRef: string;
  transform?: string;
  isRequired: boolean;
}

export interface Template {
  id: string;
  name: string;
  scope: "WA_GROUP" | "SPREADSHEET_SOURCE";
  status: "DRAFT" | "ACTIVE" | "DEPRECATED";
  parserMode: "RULE_BASED" | "AI_ASSISTED";
  version: number;
  isDefault: boolean;
  groupConfigId?: string;
  spreadsheetSourceId?: string;
  waKeywordHint?: string;
  waSenderHint?: string;
  sheetTabHint?: string;
  sheetHeaderRow?: number;
  aiModel?: string;
  aiPromptTemplate?: string;
  aiOutputSchema?: string;
  lastUpdated: string;
  fields: TemplateField[];
}

// Mock data
const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Template Report Harian",
    scope: "WA_GROUP",
    status: "ACTIVE",
    parserMode: "RULE_BASED",
    version: 3,
    isDefault: true,
    waKeywordHint: "LAPORAN HARIAN",
    waSenderHint: "PLN",
    lastUpdated: "2026-02-08 14:30:00",
    fields: [
      { id: "f1", orderNo: 1, fieldKey: "site_name", sourceKind: "WA_REGEX", sourceRef: "Site:\\s*(.+)", isRequired: true },
      { id: "f2", orderNo: 2, fieldKey: "metric_type", sourceKind: "WA_FIXED", sourceRef: "gas_consumption", isRequired: true },
      { id: "f3", orderNo: 3, fieldKey: "value", sourceKind: "WA_REGEX", sourceRef: "Volume:\\s*(\\d+\\.?\\d*)", isRequired: true },
      { id: "f4", orderNo: 4, fieldKey: "unit", sourceKind: "WA_FIXED", sourceRef: "MMBTU", isRequired: true },
      { id: "f5", orderNo: 5, fieldKey: "period_value", sourceKind: "WA_REGEX", sourceRef: "Tanggal:\\s*(\\d{2}/\\d{2}/\\d{4})", isRequired: true },
    ],
  },
  {
    id: "2",
    name: "Template Gas Pipa",
    scope: "SPREADSHEET_SOURCE",
    status: "ACTIVE",
    parserMode: "RULE_BASED",
    version: 2,
    isDefault: false,
    sheetTabHint: "Gas Pipa",
    sheetHeaderRow: 1,
    lastUpdated: "2026-02-07 10:00:00",
    fields: [
      { id: "f6", orderNo: 1, fieldKey: "site_name", sourceKind: "SHEET_COLUMN", sourceRef: "A", isRequired: true },
      { id: "f7", orderNo: 2, fieldKey: "value", sourceKind: "SHEET_COLUMN", sourceRef: "B", isRequired: true },
      { id: "f8", orderNo: 3, fieldKey: "unit", sourceKind: "SHEET_COLUMN", sourceRef: "C", isRequired: true },
    ],
  },
  {
    id: "3",
    name: "Template AI Parsing",
    scope: "WA_GROUP",
    status: "DRAFT",
    parserMode: "AI_ASSISTED",
    version: 1,
    isDefault: false,
    aiModel: "gpt-4",
    aiPromptTemplate: "Extract the following fields from this message:\n- site_name\n- metric_type\n- value\n- unit\n- period\n\nMessage:\n{{message}}",
    aiOutputSchema: '{"type": "object", "properties": {"site_name": {"type": "string"}}}',
    lastUpdated: "2026-02-06 16:45:00",
    fields: [
      { id: "f9", orderNo: 1, fieldKey: "site_name", sourceKind: "AI_JSON_PATH", sourceRef: "$.site_name", isRequired: true },
      { id: "f10", orderNo: 2, fieldKey: "value", sourceKind: "AI_JSON_PATH", sourceRef: "$.value", isRequired: true },
    ],
  },
  {
    id: "4",
    name: "Template BBM",
    scope: "SPREADSHEET_SOURCE",
    status: "DEPRECATED",
    parserMode: "RULE_BASED",
    version: 5,
    isDefault: false,
    sheetTabHint: "BBM Data",
    sheetHeaderRow: 2,
    lastUpdated: "2026-01-15 09:00:00",
    fields: [],
  },
];

const MOCK_GROUP_CONFIGS = [
  { id: "gc1", name: "PLN Jakarta Group" },
  { id: "gc2", name: "PLN Gresik Group" },
  { id: "gc3", name: "PLN Surabaya Group" },
];

const MOCK_SPREADSHEET_SOURCES = [
  { id: "ss1", name: "Gas Report Sheet" },
  { id: "ss2", name: "BBM Daily Report" },
  { id: "ss3", name: "Monthly Summary" },
];

export default function TemplateGrupPage() {
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateScope, setNewTemplateScope] = useState<"WA_GROUP" | "SPREADSHEET_SOURCE">("WA_GROUP");
  const [groupConfigs, setGroupConfigs] = useState(MOCK_GROUP_CONFIGS);

  // Show notification helper
  const showNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = t.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesScope = scopeFilter === "all" || t.scope === scopeFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesScope && matchesStatus;
    });
  }, [templates, searchQuery, scopeFilter, statusFilter]);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleUpdateTemplate = (updatedTemplate: Template) => {
    setTemplates(
      templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)),
    );
    setSelectedTemplate(updatedTemplate);
    showNotification("success", "Template berhasil diperbarui");
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicated: Template = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
      status: "DRAFT",
      version: 1,
      isDefault: false,
      lastUpdated: new Date().toISOString().replace("T", " ").slice(0, 19),
      fields: template.fields.map((f) => ({
        ...f,
        id: `${f.id}-copy-${crypto.randomUUID()}`,
      })),
    };
    setTemplates([...templates, duplicated]);
    setSelectedTemplate(duplicated);
    showNotification(
      "success",
      `Template "${template.name}" berhasil diduplikasi`,
    );
  };

  const handleArchiveTemplate = (template: Template) => {
    setTemplates(
      templates.map((t) =>
        t.id === template.id ? { ...t, status: "DEPRECATED" as const } : t,
      ),
    );
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate({ ...template, status: "DEPRECATED" });
    }
    showNotification(
      "success",
      `Template "${template.name}" berhasil diarsipkan`,
    );
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      showNotification("error", "Nama template wajib diisi");
      return;
    }

    const newTemplate: Template = {
      id: crypto.randomUUID(),
      name: newTemplateName,
      scope: newTemplateScope,
      status: "DRAFT",
      parserMode: "RULE_BASED",
      version: 1,
      isDefault: false,
      lastUpdated: new Date().toISOString().replace("T", " ").slice(0, 19),
      fields: [],
    };
    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate);
    setIsCreateModalOpen(false);
    setNewTemplateName("");
    showNotification(
      "success",
      `Template "${newTemplateName}" berhasil dibuat`,
    );
  };

  const handleExportJSON = () => {
    if (!selectedTemplate) {
      showNotification("error", "Pilih template terlebih dahulu");
      return;
    }
    const json = JSON.stringify(selectedTemplate, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate.name.replace(/\s+/g, "_")}_v${selectedTemplate.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("success", "Template berhasil diexport");
  };

  const handleAddGroup = (name: string) => {
    const newGroup = { id: `gc-${crypto.randomUUID()}`, name };
    setGroupConfigs((prev) => [...prev, newGroup]);
    showNotification("success", `Group "${name}" berhasil ditambahkan`);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slideIn ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : notification.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          {notification.type === "success" && <CheckCircle size={18} />}
          {notification.type === "error" && <AlertCircle size={18} />}
          {notification.type === "info" && <Clock size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-70"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 md:mb-8 animate-fadeIn">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="text-gray-400">/</span>
          <span>Konfigurasi Sistem</span>
          <span className="text-gray-400">/</span>
          <span className="text-[#115d72] font-medium">Template Grup</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Template Grup
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Buat dan kelola template parsing untuk WA group atau Spreadsheet
          source.
        </p>
      </div>

      {/* Action Bar */}
      <Card className="mb-6 animate-fadeIn" style={{ animationDelay: "100ms" }}>
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Left side - Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <Plus size={18} />
              Buat Template
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:border-gray-400"
            >
              <Download size={18} />
              Export JSON
            </button>
          </div>

          {/* Right side - Search & Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari template..."
                className="w-full md:w-56 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="relative">
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer transition-all duration-200"
              >
                <option value="all">Semua Scope</option>
                <option value="WA_GROUP">WA Group</option>
                <option value="SPREADSHEET_SOURCE">Spreadsheet</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer transition-all duration-200"
              >
                <option value="all">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="DEPRECATED">Deprecated</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content - Split Layout */}
      <div
        className="grid grid-cols-1 lg:grid-cols-10 gap-6 animate-fadeIn"
        style={{ animationDelay: "200ms" }}
      >
        {/* Left Panel - Template List (30%) */}
        <div className="lg:col-span-3">
          <TemplateList
            templates={filteredTemplates}
            selectedTemplate={selectedTemplate}
            onSelect={handleSelectTemplate}
            onDuplicate={handleDuplicateTemplate}
            onArchive={handleArchiveTemplate}
          />
        </div>

        {/* Right Panel - Template Editor (70%) */}
        <div className="lg:col-span-7">
          {selectedTemplate ? (
            <TemplateEditor
              key={selectedTemplate.id}
              template={selectedTemplate}
              onUpdate={handleUpdateTemplate}
              onAddGroup={handleAddGroup}
              groupConfigs={groupConfigs}
              spreadsheetSources={MOCK_SPREADSHEET_SOURCES}
            />
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  Pilih template dari daftar untuk mengedit
                </p>
                <p className="text-xs mt-1">atau buat template baru</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewTemplateName("");
        }}
        title="Buat Template Baru"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Template <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent"
              placeholder="Contoh: Template Report Harian"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Scope
            </label>
            <div className="relative">
              <select
                value={newTemplateScope}
                onChange={(e) =>
                  setNewTemplateScope(
                    e.target.value as "WA_GROUP" | "SPREADSHEET_SOURCE",
                  )
                }
                className="w-full appearance-none px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
              >
                <option value="WA_GROUP">WA Group</option>
                <option value="SPREADSHEET_SOURCE">Spreadsheet Source</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewTemplateName("");
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Batal
            </button>
            <button
              onClick={handleCreateTemplate}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
            >
              Buat
            </button>
          </div>
        </div>
      </Modal>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
