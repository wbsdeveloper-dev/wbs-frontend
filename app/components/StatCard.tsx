"use client";

import { Info } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  description?: string;
  color?: "blue" | "gray";
  showProgress?: boolean;
  fillLevel?: number;
  maxLevel?: number;
}

export default function StatCard({
  title,
  value,
  subtitle,
  color = "gray",
  showProgress = false,
  fillLevel = 0,
  maxLevel = 20000,
}: StatCardProps) {
  const percentage = (fillLevel / maxLevel) * 100;

  return (
    <div
      className={`rounded-xl p-6 ${
        color === "blue"
          ? "bg-blue-600 text-white"
          : "bg-white border border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className={`text-sm font-medium ${
            color === "blue" ? "text-white" : "text-gray-600"
          }`}
        >
          {title}
        </h3>
        <Info
          className={`w-4 h-4 ${
            color === "blue" ? "text-white" : "text-gray-400"
          }`}
        />
      </div>
      <p
        className={`text-3xl font-bold mb-1 ${
          color === "blue" ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {showProgress && (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Filling Level</span>
            <span>{maxLevel.toLocaleString()} BBTU</span>
          </div>
          <div className="w-full bg-blue-400 rounded-full h-2">
            <div
              className="bg-blue-200 h-2 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
      {subtitle && (
        <p
          className={`text-xs mt-2 ${
            color === "blue" ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
