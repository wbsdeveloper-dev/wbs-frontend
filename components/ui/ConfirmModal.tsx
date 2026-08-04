"use client";

import React from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const confirmColors =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-amber-500 hover:bg-amber-600 text-white";

  const iconBg =
    variant === "danger"
      ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300"
      : "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300";

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        style={{ animation: "confirmFadeIn 0.2s ease-out" }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ animation: "confirmSlideUp 0.25s ease-out" }}
      >
        <div className="p-6">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-4`}
          >
            {variant === "danger" ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            )}
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 text-center mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-300 text-center leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${confirmColors}`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirmSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
