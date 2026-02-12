"use client";

import React from "react";

interface ErrorModalProps {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export function ErrorModal({
  open,
  title = "Terjadi Kesalahan",
  message,
  onClose,
}: ErrorModalProps) {
  if (!open) return null;

  return (
    <>
      {/* Styles scoped via unique class names */}
      <style>{`
        @keyframes errorFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes errorScaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes errorPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
        @keyframes errorShake {
          0%, 100% { transform: rotate(0deg); }
          20%      { transform: rotate(-8deg); }
          40%      { transform: rotate(8deg); }
          60%      { transform: rotate(-5deg); }
          80%      { transform: rotate(5deg); }
        }
        @keyframes errorStroke {
          from { stroke-dashoffset: 157; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes errorCross1 {
          from { stroke-dashoffset: 30; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "rgba(0,0,0,0.45)",
          animation: "errorFadeIn 0.25s ease-out",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "min(420px, 90vw)",
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          animation: "errorScaleIn 0.3s ease-out forwards",
          textAlign: "center",
        }}
      >
        {/* Animated error icon */}
        <div
          style={{
            margin: "0 auto 1.25rem",
            width: 80,
            height: 80,
            animation: "errorPulse 1.5s ease-in-out infinite",
          }}
        >
          <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
            {/* Circle */}
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="#EF4444"
              strokeWidth="4"
              strokeDasharray="226"
              strokeDashoffset="0"
              strokeLinecap="round"
              style={{ animation: "errorStroke 0.6s ease-out forwards" }}
            />
            {/* Cross line 1 */}
            <line
              x1="28"
              y1="28"
              x2="52"
              y2="52"
              stroke="#EF4444"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="34"
              strokeDashoffset="0"
              style={{ animation: "errorCross1 0.4s 0.4s ease-out both" }}
            />
            {/* Cross line 2 */}
            <line
              x1="52"
              y1="28"
              x2="28"
              y2="52"
              stroke="#EF4444"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="34"
              strokeDashoffset="0"
              style={{ animation: "errorCross1 0.4s 0.5s ease-out both" }}
            />
          </svg>
        </div>

        {/* Title */}
        <h2
          style={{
            margin: "0 0 0.5rem",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1F2937",
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: "0.9rem",
            color: "#6B7280",
            lineHeight: 1.5,
            wordBreak: "break-word",
          }}
        >
          {message}
        </p>

        {/* Dismiss */}
        <button
          onClick={onClose}
          style={{
            display: "inline-block",
            padding: "0.625rem 2rem",
            backgroundColor: "#EF4444",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.9rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseOver={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#DC2626")
          }
          onMouseOut={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "#EF4444")
          }
        >
          Tutup
        </button>
      </div>
    </>
  );
}
