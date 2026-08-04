"use client";

import { X } from "lucide-react";
import { ReactNode, useCallback, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  title?: string;
}

/**
 * Reusable Modal component with backdrop and accessibility features
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-5xl",
  showCloseButton = true,
  title,
}: ModalProps) {
  // Close on escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={`relative bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 text-gray-900 dark:text-slate-100 w-full ${maxWidth} rounded-xl shadow-lg p-4 md:p-6 z-10 max-h-[90vh] overflow-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-slate-100"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-slate-300" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
