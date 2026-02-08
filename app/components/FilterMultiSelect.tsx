"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface FilterMultiSelectProps {
  label?: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export default function FilterMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select options",
}: FilterMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const displayValue = value.length === 0
    ? placeholder
    : value.length === options.length
    ? "Semua"
    : value.length === 1
    ? value[0]
    : `${value.length} dipilih`;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm
          bg-white border border-gray-300 rounded-lg
          hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
          transition-all duration-200"
      >
        <span className={`truncate ${value.length === 0 ? "text-gray-400" : "text-gray-700"}`}>
          {displayValue}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Select All Option */}
          <button
            type="button"
            onClick={handleSelectAll}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700
              hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                ${value.length === options.length
                  ? "bg-[#115d72] border-[#115d72]"
                  : value.length > 0
                  ? "bg-[#115d72]/50 border-[#115d72]/50"
                  : "border-gray-300"
                }`}
            >
              {value.length > 0 && (
                <Check size={12} className="text-white" strokeWidth={3} />
              )}
            </div>
            <span className="font-medium">Pilih Semua</span>
          </button>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {options.map((option) => {
              const isSelected = value.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleToggle(option)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700
                    hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                      ${isSelected
                        ? "bg-[#115d72] border-[#115d72]"
                        : "border-gray-300"
                      }`}
                  >
                    {isSelected && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
