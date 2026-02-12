"use client";

import React from "react";
import {
  Copy,
  Archive,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Card from "@/app/components/ui/Card";
import type { Template } from "@/hooks/service/config-api";

interface TemplateListProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onSelect: (template: Template) => void;
  onDuplicate: (template: Template) => void;
  onArchive: (template: Template) => void;
}

export default function TemplateList({
  templates,
  selectedTemplate,
  onSelect,
  onDuplicate,
  onArchive,
}: TemplateListProps) {
  const getScopeBadge = (scope: Template["scope"]) => {
    if (scope === "WA_GROUP") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
          <MessageSquare size={10} />
          WA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
        <FileSpreadsheet size={10} />
        Sheet
      </span>
    );
  };

  const getStatusBadge = (status: Template["status"]) => {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          <CheckCircle size={10} />
          Active
        </span>
      );
    }
    if (status === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
          <Clock size={10} />
          Draft
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
        <AlertTriangle size={10} />
        Deprecated
      </span>
    );
  };

  const getHintPreview = (template: Template) => {
    if (template.scope === "WA_GROUP") {
      return template.waKeywordHint || template.waSenderHint || "No hint";
    }
    return template.sheetTabHint || "No hint";
  };

  if (templates.length === 0) {
    return (
      <Card className="h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">Tidak ada template ditemukan</p>
          <p className="text-xs mt-1">Buat template baru atau ubah filter</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto p-1 -m-1">
      {templates.map((template, index) => (
        <Card
          key={template.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedTemplate?.id === template.id
              ? "ring-2 ring-[#115d72] bg-[#115d72]/5"
              : "hover:border-gray-300"
          }`}
          padding="sm"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div onClick={() => onSelect(template)}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                {template.name}
              </h4>
              <span className="text-xs text-gray-400 shrink-0">
                v{template.version}
              </span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-2">
              {getScopeBadge(template.scope)}
              {getStatusBadge(template.status)}
              {template.isDefault && (
                <span className="px-2 py-0.5 text-xs font-medium bg-[#115d72]/10 text-[#115d72] rounded-full">
                  Default
                </span>
              )}
            </div>

            {/* Hint Preview */}
            <p className="text-xs text-gray-500 truncate mb-2">
              Hint: {getHintPreview(template)}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {new Date(template.updatedAt).toLocaleDateString("id-ID")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(template);
                  }}
                  className="p-1.5 text-gray-400 hover:text-[#115d72] hover:bg-gray-100 rounded transition-colors"
                  title="Duplikasi"
                >
                  <Copy size={14} />
                </button>
                {template.status !== "DEPRECATED" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(template);
                    }}
                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                    title="Arsipkan"
                  >
                    <Archive size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
