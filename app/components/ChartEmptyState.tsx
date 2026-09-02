"use client";

import { FileText } from "lucide-react";

interface ChartEmptyStateProps {
  title: string;
  description: string;
  className?: string;
}

export default function ChartEmptyState({
  title,
  description,
  className = "h-full",
}: ChartEmptyStateProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center text-center px-6 py-12 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileText className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="text-xs text-gray-500 mt-1 max-w-[300px]">{description}</p>
    </div>
  );
}
