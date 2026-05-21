"use client";

import React, { useState } from "react";
import {
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  FileText,
} from "lucide-react";
import { Modal } from "@/app/components/ui";
import type { TemplateField } from "@/hooks/service/config-api";
import type { Template } from "@/hooks/service/config-api";
import {
  parseCSV,
  csvFieldsToTemplateFields,
  validateCSVImport,
  type CSVFieldRow,
} from "../utils/csvExport";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (fields: TemplateField[]) => void;
  existingFields: TemplateField[];
  template: Template;
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onImport,
  existingFields,
  template,
}: CSVImportModalProps) {
  const [csvFields, setCsvFields] = useState<CSVFieldRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importStrategy, setImportStrategy] = useState<"merge" | "replace">("merge");
  const [selectedFields, setSelectedFields] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Parse CSV
        const parsedFields = parseCSV(content);
        
        // Validate the import
        const validation = validateCSVImport(parsedFields);
        
        if (!validation.valid) {
          setValidationErrors(validation.errors);
          setCsvFields(parsedFields);
          return;
        }

        setValidationErrors([]);
        setCsvFields(parsedFields);
        // Select all fields by default
        setSelectedFields(new Set(parsedFields.map((_, i) => i)));
      } catch (error) {
        setValidationErrors([`Failed to parse CSV file: ${(error as Error).message}`]);
        setCsvFields([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (csvFields.length === 0 || selectedFields.size === 0) return;

    setIsProcessing(true);

    // Get selected fields
    const fieldsToImport = csvFields.filter((_, i) => selectedFields.has(i));

    // Convert to TemplateField format
    const templateFields = csvFieldsToTemplateFields(fieldsToImport, template.id);

    // Apply import strategy
    let finalFields: TemplateField[];
    
    if (importStrategy === "replace") {
      finalFields = templateFields.map((f, i) => ({ ...f, orderNo: i + 1 }));
    } else {
      // Merge strategy
      finalFields = [...existingFields];
      
      templateFields.forEach((imported) => {
        const existingIndex = finalFields.findIndex(
          (f) => f.fieldKey === imported.fieldKey
        );

        if (existingIndex >= 0) {
          // Update existing field
          finalFields[existingIndex] = {
            ...imported,
            id: finalFields[existingIndex].id,
            ingestionTemplateId: finalFields[existingIndex].ingestionTemplateId,
            createdAt: finalFields[existingIndex].createdAt,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Add new field
          finalFields.push(imported);
        }
      });

      // Update order numbers
      finalFields = finalFields.map((f, i) => ({ ...f, orderNo: i + 1 }));
    }

    setTimeout(() => {
      onImport(finalFields);
      handleClose();
      setIsProcessing(false);
    }, 500);
  };

  const handleClose = () => {
    setCsvFields([]);
    setValidationErrors([]);
    setSelectedFields(new Set());
    setImportStrategy("merge");
    setFileName("");
    onClose();
  };

  const getSourceKindBadge = (sourceKind: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      SHEET_COLUMN: { color: "bg-blue-100 text-blue-700", label: "Sheet" },
      WA_REGEX: { color: "bg-purple-100 text-purple-700", label: "Regex" },
      WA_REGEX_RECORDS: { color: "bg-purple-100 text-purple-700", label: "Regex Records" },
      WA_FIXED: { color: "bg-gray-100 text-gray-700", label: "Fixed" },
      AI_JSON_PATH: { color: "bg-green-100 text-green-700", label: "AI Path" },
    };

    const badge = badges[sourceKind] || { color: "bg-gray-100 text-gray-700", label: sourceKind };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const hasConflict = (fieldKey: string) => {
    return existingFields.some(f => f.fieldKey === fieldKey);
  };

  const toggleFieldSelection = (index: number) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFields(newSelected);
  };

  const toggleAllFields = () => {
    if (selectedFields.size === csvFields.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(csvFields.map((_, i) => i)));
    }
  };

  const conflictCount = csvFields.filter((f) => hasConflict(f.fieldKey)).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Template Fields from CSV">
      <div className="space-y-6">
        {/* File Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#14a2bb] transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-import-input"
          />
          <label
            htmlFor="csv-import-input"
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 bg-[#14a2bb]/10 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#14a2bb]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                CSV files with template field data
              </p>
            </div>
          </label>
        </div>

        {/* File Name Display */}
        {fileName && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <FileText size={16} className="text-gray-600" />
            <span className="text-sm text-gray-700">{fileName}</span>
            <span className="text-xs text-gray-500">
              ({csvFields.length} fields)
            </span>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Import Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Imported Fields Preview */}
        {csvFields.length > 0 && validationErrors.length === 0 && (
          <>
            {/* Import Strategy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Import Strategy
              </label>
              <div className="relative">
                <select
                  value={importStrategy}
                  onChange={(e) => setImportStrategy(e.target.value as "merge" | "replace")}
                  className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white cursor-pointer pr-10"
                >
                  <option value="merge">Merge with existing fields</option>
                  <option value="replace">Replace all fields</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {conflictCount > 0 && importStrategy === "merge" && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {conflictCount} field{conflictCount > 1 ? "s" : ""} will be updated
                </p>
              )}
            </div>

            {/* Conflict Warning */}
            {conflictCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {conflictCount} Field Conflict{conflictCount > 1 ? "s" : ""} Detected
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {importStrategy === "merge"
                      ? "Conflicting fields will be updated with imported values."
                      : "All existing fields will be replaced."}
                  </p>
                </div>
              </div>
            )}

            {/* Fields Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedFields.size === csvFields.length}
                  onChange={toggleAllFields}
                  className="w-4 h-4 rounded border-gray-300 text-[#14a2bb] focus:ring-[#14a2bb] cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-600 flex-1">
                  {selectedFields.size} of {csvFields.length} fields selected
                </span>
                <span className="text-xs text-gray-500">Source</span>
                <span className="text-xs text-gray-500">Transform</span>
                <span className="text-xs text-gray-500">Required</span>
              </div>

              {/* Table Body */}
              <div className="max-h-64 overflow-y-auto">
                {csvFields.map((field, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      hasConflict(field.fieldKey) ? "bg-amber-50/50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.has(index)}
                      onChange={() => toggleFieldSelection(index)}
                      className="w-4 h-4 rounded border-gray-300 text-[#14a2bb] focus:ring-[#14a2bb] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {field.fieldKey}
                        </span>
                        {hasConflict(field.fieldKey) && (
                          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                        )}
                      </div>
                      {field.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {getSourceKindBadge(field.sourceKind)}
                    </div>
                    <div className="shrink-0 text-xs text-gray-600 truncate max-w-32">
                      {field.transform || "-"}
                    </div>
                    <div className="shrink-0">
                      {field.isRequired === "true" ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={selectedFields.size === 0 || isProcessing}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>
                      Import {selectedFields.size} Field{selectedFields.size !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
