// CSV Export/Import Utilities for Template Fields

import type { TemplateField, Template } from "@/hooks/service/config-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CSVFieldRow {
  fieldKey: string;
  sourceKind: string;
  sourceRef: string;
  transform: string;
  isRequired: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// CSV Export Functions
// ---------------------------------------------------------------------------

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
  if (!value) return "";
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

/**
 * Convert template fields to CSV format
 */
export function fieldsToCSV(fields: TemplateField[]): string {
  const headers = ["fieldKey", "sourceKind", "sourceRef", "transform", "isRequired", "description"];
  const rows = fields.map((field) => [
    escapeCSVValue(field.fieldKey),
    escapeCSVValue(field.sourceKind),
    escapeCSVValue(field.sourceRef),
    escapeCSVValue(field.transform || ""),
    escapeCSVValue(field.isRequired ? "true" : "false"),
    escapeCSVValue(getFieldDescription(field)),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCSVValue).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Download fields as CSV file
 */
export function downloadFieldsCSV(fields: TemplateField[], templateName: string): void {
  const csvContent = fieldsToCSV(fields);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${templateName.replace(/\s+/g, "_")}_fields_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get human-readable description for a field
 */
function getFieldDescription(field: TemplateField): string {
  const sourceDescriptions: Record<TemplateField["sourceKind"], string> = {
    SHEET_COLUMN: "Extract from spreadsheet column",
    WA_REGEX: "Extract using regex pattern",
    WA_REGEX_RECORDS: "Extract multiple records using regex",
    WA_FIXED: "Fixed value",
    AI_JSON_PATH: "Extract using AI JSON path",
  };

  let desc = sourceDescriptions[field.sourceKind] || "Custom field";
  
  if (field.transform) {
    desc += ` (transform: ${field.transform})`;
  }
  
  if (field.isRequired) {
    desc += " [required]";
  }
  
  return desc;
}

// ---------------------------------------------------------------------------
// CSV Import Functions
// ---------------------------------------------------------------------------

/**
 * Parse CSV content to field rows
 */
export function parseCSV(csvContent: string): CSVFieldRow[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  
  if (lines.length < 2) {
    throw new Error("CSV file must contain at least a header row and one data row");
  }

  const headers = parseCSVLine(lines[0]);
  const rows: CSVFieldRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      console.warn(`Row ${i} has ${values.length} values but ${headers.length} headers, skipping`);
      continue;
    }

    const row: CSVFieldRow = {
      fieldKey: values[0] || "",
      sourceKind: values[1] || "",
      sourceRef: values[2] || "",
      transform: values[3] || "",
      isRequired: values[4]?.toLowerCase() || "false",
      description: values[5] || "",
    };

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line (handles quoted values)
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Comma separator (not inside quotes)
      values.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  // Add the last value
  values.push(currentValue);

  return values;
}

/**
 * Validate CSV field row
 */
export function validateCSVFieldRow(row: CSVFieldRow): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate fieldKey
  if (!row.fieldKey || row.fieldKey.trim() === "") {
    errors.push("fieldKey is required");
  }

  // Validate sourceKind
  const validSourceKinds: TemplateField["sourceKind"][] = [
    "SHEET_COLUMN",
    "WA_REGEX",
    "WA_REGEX_RECORDS",
    "WA_FIXED",
    "AI_JSON_PATH",
  ];

  if (!validSourceKinds.includes(row.sourceKind as TemplateField["sourceKind"])) {
    errors.push(`Invalid sourceKind: ${row.sourceKind}. Valid values: ${validSourceKinds.join(", ")}`);
  }

  // Validate isRequired
  if (row.isRequired !== "true" && row.isRequired !== "false") {
    errors.push(`isRequired must be "true" or "false", got: ${row.isRequired}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert CSV field rows to template fields
 */
export function csvFieldsToTemplateFields(
  csvFields: CSVFieldRow[],
  templateId: string
): TemplateField[] {
  return csvFields.map((field, index) => ({
    id: crypto.randomUUID(),
    ingestionTemplateId: templateId,
    fieldKey: field.fieldKey.trim(),
    sourceKind: field.sourceKind as TemplateField["sourceKind"],
    sourceRef: field.sourceRef.trim(),
    transform: field.transform.trim() || null,
    isRequired: field.isRequired.toLowerCase() === "true",
    orderNo: index + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Validate entire CSV import
 */
export function validateCSVImport(csvFields: CSVFieldRow[]): {
  valid: boolean;
  errors: string[];
} {
  const allErrors: string[] = [];

  // Check for duplicate field keys
  const fieldKeys = csvFields.map((f) => f.fieldKey.trim());
  const uniqueKeys = new Set(fieldKeys);
  
  if (uniqueKeys.size !== fieldKeys.length) {
    allErrors.push(`Duplicate field keys found: ${fieldKeys.length - uniqueKeys.size} duplicates`);
  }

  // Validate each row
  csvFields.forEach((row, index) => {
    const validation = validateCSVFieldRow(row);
    if (!validation.valid) {
      allErrors.push(...validation.errors.map((err) => `Row ${index + 1}: ${err}`));
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
