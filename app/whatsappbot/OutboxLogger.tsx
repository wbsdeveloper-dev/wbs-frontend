"use client";

import React, { useState } from "react";
import { AlertCircle, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import Card, { CardHeader } from "@/app/components/ui/Card";
import { useBotOutbox, type OutboxMessage } from "@/hooks/use-bot-outbox";
import { useBotGroups } from "@/hooks/use-bot-groups";

export function OutboxLogger({
  host,
  connected,
}: {
  host: string;
  connected: boolean;
}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, refetch, isRefetching } = useBotOutbox(
    host,
    page,
    limit,
    statusFilter,
    connected,
  );

  const { data: groups } = useBotGroups(host, connected);

  if (!connected) {
    return null; // Don't show logger if bot is offline
  }

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const StatusBadge = ({ status }: { status: OutboxMessage["status"] }) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-md">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-md">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
            {status}
          </span>
        );
    }
  };

  const getTargetLabel = (payloadStr: string) => {
    try {
      const payload = JSON.parse(payloadStr);
      const targetId = payload.group_id || payload.sender_id;

      if (!targetId) return "Unknown";

      // Try to find group name mapping
      const groupMatch = groups?.find((g) => g.id === targetId);
      if (groupMatch) {
        return groupMatch.name;
      }

      return targetId;
    } catch {
      return "Malformed payload";
    }
  };

  const getMessagePreview = (payloadStr: string) => {
    try {
      const payload = JSON.parse(payloadStr);
      if (payload.event_type === "message") {
        return (
          payload.text_content ||
          `[Media: ${payload.media_metadata?.mime_type || "Unknown Media"}]`
        );
      }
      return `[Action: ${payload.event_type}]`;
    } catch {
      return "Malformed payload";
    }
  };

  return (
    <Card className="mt-8 overflow-hidden flex flex-col">
      <CardHeader
        title="Antrian Pesan Keluar"
        description="Pantau antrian pesan dan status pengiriman bot"
        action={
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#14a2bb]"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        }
      />

      <div className="overflow-x-auto border-t border-gray-100 mt-2">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">ID Group/Kontak</th>
              <th className="px-4 py-3 w-1/3 min-w-[200px]">Isi Pesan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Percobaan</th>
              <th className="px-4 py-3">Detail Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
                  Memuat data...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
                    Sedang tidak ada antrian pesan.
                  </div>
                </td>
              </tr>
            ) : (
              items.map((msg) => (
                <tr
                  key={msg.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex flex-col">
                      <span>
                        {new Date(msg.created_at).toLocaleDateString("id-ID")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleTimeString("id-ID")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-700">
                      {getTargetLabel(msg.payload)}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-gray-600">
                    {getMessagePreview(msg.payload)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={msg.status} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {msg.attempt_count}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-red-600 text-xs">
                    {msg.last_error || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 mt-auto">
          <div className="text-sm text-gray-500">
            Total <span className="font-medium text-gray-900">{total}</span>{" "}
            pesan
          </div>

          <div className="flex items-center gap-4">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
            >
              <option value="10">10 / hal</option>
              <option value="25">25 / hal</option>
              <option value="50">50 / hal</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600 px-2 min-w-16 text-center">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
