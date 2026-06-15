"use client";

import React from "react";
import {
  Mail,
  ExternalLink,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Switch } from "@mui/material";
import Card, { CardHeader } from "@/app/components/ui/Card";
import {
  useEmailSources,
  useUpdateEmailSource,
  useTriggerEmailPoll,
} from "@/hooks/service/config-api";

const SWITCH_SX = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: "#14a2bb" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#14a2bb",
  },
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Belum pernah";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", { dateStyle: "short" });
}

export default function EmailSourcePanel({
  sourceIds,
}: {
  sourceIds: string[];
}) {
  const { data: sources = [], isLoading, isError } = useEmailSources();
  const updateMutation = useUpdateEmailSource();
  const triggerPollMutation = useTriggerEmailPoll();

  const handleToggle = (id: string, currentEnabled: boolean) => {
    updateMutation.mutate({ id, payload: { isEnabled: !currentEnabled } });
  };

  const handleTriggerPoll = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    triggerPollMutation.mutate(id);
  };

  const linkedSources = sources.filter((s) => sourceIds.includes(s.id));

  return (
    <Card>
      <CardHeader
        title="Email Terkait"
        description="Pengaturan source email polling"
        action={
          <a
            href="/konfigurasi/email-ingest"
            className="flex items-center gap-1 text-xs font-medium text-[#115d72] hover:underline"
          >
            Kelengkapan Email
            <ExternalLink size={12} />
          </a>
        }
      />

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Memuat info email...</span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-8 text-red-400 gap-2">
            <AlertCircle size={16} />
            <span className="text-sm">Gagal memuat email source</span>
          </div>
        ) : linkedSources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Mail className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Tidak ada email source terhubung</p>
            <p className="text-xs mt-1">
              Hubungkan template ini ke email source di editor
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {linkedSources.map((source) => (
              <div
                key={source.id}
                className="rounded-lg border border-gray-200 bg-white overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-3 bg-gray-50">
                  <div
                    className={`shrink-0 w-2.5 h-2.5 rounded-full ${source.isEnabled ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {source.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {source.emailAddress}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      source.isEnabled
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {source.isEnabled ? (
                      <CheckCircle size={10} />
                    ) : (
                      <XCircle size={10} />
                    )}
                    {source.isEnabled ? "Aktif" : "Nonaktif"}
                  </span>

                  <button
                    onClick={(e) => handleTriggerPoll(e, source.id)}
                    disabled={triggerPollMutation.isPending}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-[#115d72] hover:bg-[#115d72]/10 rounded-lg transition-all duration-150 disabled:opacity-50"
                    title="Trigger poll sekarang"
                  >
                    {triggerPollMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                  </button>

                  <Switch
                    checked={source.isEnabled}
                    onChange={() => handleToggle(source.id, source.isEnabled)}
                    disabled={updateMutation.isPending}
                    size="small"
                    sx={SWITCH_SX}
                  />
                </div>

                {/* Detail rows */}
                <div className="px-3 pb-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Cron</span>
                    <span className="text-gray-600 font-mono">
                      {source.cronSchedule || "—"}
                    </span>
                  </div>
                  {source.subjectFilter && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Subject</span>
                      <span
                        className="text-gray-600 truncate max-w-[180px]"
                        title={source.subjectFilter}
                      >
                        {source.subjectFilter}
                      </span>
                    </div>
                  )}
                  {source.senderFilter && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Sender</span>
                      <span
                        className="text-gray-600 truncate max-w-[180px]"
                        title={source.senderFilter}
                      >
                        {source.senderFilter}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Label</span>
                    <span className="text-gray-600">
                      {source.labelFilter || "INBOX"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Terakhir Poll</span>
                    <span className="text-gray-600">
                      {formatRelativeTime(source.lastPolledAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="text-xs text-gray-500 bg-blue-50/50 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle
                size={14}
                className="mt-0.5 text-[#115d72] shrink-0"
              />
              <p>
                Template ini akan dieksekusi setiap kali email masuk ke source
                di atas yang cocok dengan filter.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
