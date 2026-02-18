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
  Loader2,
} from "lucide-react";
import Card from "@/app/components/ui/Card";
import { Modal } from "@/app/components/ui";
import TemplateList from "./components/TemplateList";
import TemplateEditor from "./components/TemplateEditor";
import {
  useTemplates,
  useTemplate,
  useGroups,
  useCreateTemplate,
  useUpdateTemplate,
  useDuplicateTemplate,
  useDeprecateTemplate,
  useCreateGroup,
  useActivateTemplate,
  type Template,
  type TemplateField,
  type TemplateListFilters,
} from "@/hooks/service/config-api";

// Wrapper component to fetch full details
function TemplateEditorWrapper({
  templateId,
  //  initialData, // Removed to force loading state
  onUpdate,
  onActivate,
  onAddGroup,
  groupConfigs,
  spreadsheetSources,
}: {
  templateId: string;
  //  initialData: Template; // Removed
  onUpdate: (t: Template) => void;
  onActivate: (t: Template) => void;
  onAddGroup: (name: string) => void;
  groupConfigs: { id: string; name: string }[];
  spreadsheetSources: { id: string; name: string }[];
}) {
  const { data: fullTemplate, isLoading, isError } = useTemplate(templateId); // No initialData

  if (isLoading) {
    return (
      <Card className="h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#14a2bb]" />
          <p className="text-sm">Memuat detail template...</p>
        </div>
      </Card>
    );
  }

  if (isError || !fullTemplate) {
    return (
      <Card className="h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm">Gagal memuat detail template</p>
        </div>
      </Card>
    );
  }

  return (
    <TemplateEditor
      key={fullTemplate.id} // Re-mount when ID changes (or data loads if strict)
      template={fullTemplate}
      onUpdate={onUpdate}
      onActivate={onActivate}
      onAddGroup={onAddGroup}
      groupConfigs={groupConfigs}
      spreadsheetSources={spreadsheetSources}
    />
  );
}

// Re-export types so downstream components can import from page.tsx if needed
export type { Template, TemplateField };

// Spreadsheet sources are not yet from API — keep as static for now
const MOCK_SPREADSHEET_SOURCES = [
  { id: "ss1", name: "Gas Report Sheet" },
  { id: "ss2", name: "BBM Daily Report" },
  { id: "ss3", name: "Monthly Summary" },
];

export default function TemplateGrupPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateScope, setNewTemplateScope] = useState<
    "WA_GROUP" | "SPREADSHEET_SOURCE"
  >("WA_GROUP");

  // ---------------------------------------------------------------------------
  // API queries
  // ---------------------------------------------------------------------------
  const filters: TemplateListFilters = useMemo(
    () => ({
      scope: scopeFilter !== "all" ? scopeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchQuery || undefined,
    }),
    [scopeFilter, statusFilter, searchQuery],
  );

  const {
    data: templates = [],
    isLoading: isLoadingTemplates,
    isError: isErrorTemplates,
  } = useTemplates(filters);

  const { data: groupConfigs = [] } = useGroups();

  // ---------------------------------------------------------------------------
  // API mutations
  // ---------------------------------------------------------------------------
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();
  const duplicateTemplateMutation = useDuplicateTemplate();
  const deprecateTemplateMutation = useDeprecateTemplate();
  const activateTemplateMutation = useActivateTemplate();
  const createGroupMutation = useCreateGroup();

  // Show notification helper
  const showNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter templates client-side when the API doesn't support search
  // (the API query params handle filtering server-side,
  //  but we keep the useMemo for safety if the API doesn't filter)
  const filteredTemplates = templates;

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleUpdateTemplate = (updatedTemplate: Template) => {
    updateTemplateMutation.mutate(
      {
        id: updatedTemplate.id,
        payload: {
          name: updatedTemplate.name,
          scope: updatedTemplate.scope,
          parserMode: updatedTemplate.parserMode,
          groupConfigId: updatedTemplate.groupConfigId,
          spreadsheetSourceId: updatedTemplate.spreadsheetSourceId,
          waKeywordHint: updatedTemplate.waKeywordHint,
          waSenderHint: updatedTemplate.waSenderHint,
          sheetTabHint: updatedTemplate.sheetTabHint,
          sheetHeaderRow: updatedTemplate.sheetHeaderRow,
          aiModel: updatedTemplate.aiModel,
          aiPromptTemplate: updatedTemplate.aiPromptTemplate,
          aiOutputSchema: updatedTemplate.aiOutputSchema,
          fields: updatedTemplate.fields.map((f, i) => ({
            fieldKey: f.fieldKey,
            sourceKind: f.sourceKind,
            sourceRef: f.sourceRef,
            transform: f.transform || null,
            isRequired: f.isRequired,
            orderNo: i + 1,
          })),
        },
      },
      {
        onSuccess: (data) => {
          setSelectedTemplate(data);
          showNotification("success", "Template berhasil diperbarui");
        },
        onError: (err) => {
          showNotification(
            "error",
            `Gagal memperbarui template: ${err.message}`,
          );
        },
      },
    );
  };

  const handleActivateTemplate = (template: Template) => {
    activateTemplateMutation.mutate(template.id, {
      onSuccess: (data) => {
        setSelectedTemplate(data);
        showNotification(
          "success",
          `Template "${template.name}" berhasil diaktifkan`,
        );
      },
      onError: (err) => {
        showNotification(
          "error",
          `Gagal mengaktifkan template: ${err.message}`,
        );
      },
    });
  };

  const handleDuplicateTemplate = (template: Template) => {
    duplicateTemplateMutation.mutate(template.id, {
      onSuccess: (data) => {
        setSelectedTemplate(data);
        showNotification(
          "success",
          `Template "${template.name}" berhasil diduplikasi`,
        );
      },
      onError: (err) => {
        showNotification(
          "error",
          `Gagal menduplikasi template: ${err.message}`,
        );
      },
    });
  };

  const handleArchiveTemplate = (template: Template) => {
    deprecateTemplateMutation.mutate(template.id, {
      onSuccess: (data) => {
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(data);
        }
        showNotification(
          "success",
          `Template "${template.name}" berhasil diarsipkan`,
        );
      },
      onError: (err) => {
        showNotification(
          "error",
          `Gagal mengarsipkan template: ${err.message}`,
        );
      },
    });
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      showNotification("error", "Nama template wajib diisi");
      return;
    }

    createTemplateMutation.mutate(
      {
        name: newTemplateName,
        scope: newTemplateScope,
      },
      {
        onSuccess: (data) => {
          setSelectedTemplate(data);
          setIsCreateModalOpen(false);
          setNewTemplateName("");
          showNotification(
            "success",
            `Template "${newTemplateName}" berhasil dibuat`,
          );
        },
        onError: (err) => {
          showNotification("error", `Gagal membuat template: ${err.message}`);
        },
      },
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
    createGroupMutation.mutate(
      { groupId: name.toLowerCase().replace(/\s+/g, "-"), name },
      {
        onSuccess: () => {
          showNotification("success", `Group "${name}" berhasil ditambahkan`);
        },
        onError: (err) => {
          showNotification("error", `Gagal menambahkan group: ${err.message}`);
        },
      },
    );
  };

  // Map GroupConfig[] to the shape TemplateEditor expects
  const groupConfigsForEditor = groupConfigs.map((g) => ({
    id: g.id,
    name: g.name,
  }));

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
          {isLoadingTemplates ? (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#14a2bb]" />
                <p className="text-sm">Memuat template...</p>
              </div>
            </Card>
          ) : isErrorTemplates ? (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center text-red-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-3" />
                <p className="text-sm">Gagal memuat template</p>
                <p className="text-xs mt-1 text-gray-400">
                  Periksa koneksi API Anda
                </p>
              </div>
            </Card>
          ) : (
            <TemplateList
              templates={filteredTemplates}
              selectedTemplate={selectedTemplate}
              onSelect={handleSelectTemplate}
              onDuplicate={handleDuplicateTemplate}
              onArchive={handleArchiveTemplate}
            />
          )}
        </div>

        {/* Right Panel - Template Editor (70%) */}
        <div className="lg:col-span-7">
          {selectedTemplate ? (
            <TemplateEditorWrapper
              templateId={selectedTemplate.id}
              onUpdate={handleUpdateTemplate}
              onActivate={handleActivateTemplate}
              onAddGroup={handleAddGroup}
              groupConfigs={groupConfigsForEditor}
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
              disabled={createTemplateMutation.isPending}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createTemplateMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Membuat...
                </span>
              ) : (
                "Buat"
              )}
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
