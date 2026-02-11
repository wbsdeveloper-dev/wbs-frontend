"use client";

import React, { useState } from "react";
import { Search, X, Plus, WifiOff } from "lucide-react";
import { Switch, Slider } from "@mui/material";
import Image from "next/image";
import Card, { CardHeader } from "@/app/components/ui/Card";
import { BOT_PRIMARY_API, BOT_SECONDARY_API } from "@/hooks/service/bot-api";
import {
  useBotStatus,
  useBotQR,
  useDisconnectBot,
} from "@/hooks/use-bot-status";
import { useBotGroups, useUpdateGroups } from "@/hooks/use-bot-groups";
import {
  useBotKeywords,
  useAddKeyword,
  useDeleteKeyword,
} from "@/hooks/use-bot-keywords";
import {
  useDataCollectionStatus,
  useToggleDataCollection,
} from "@/hooks/use-bot-data-collection";
import {
  useHumanizeConfig,
  useUpdateHumanize,
  useToggleHumanize,
} from "@/hooks/use-bot-humanize";
import ConfirmModal from "@/components/ui/ConfirmModal";

// MUI Switch brand color shared sx
const SWITCH_SX = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: "#14a2bb" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#14a2bb",
  },
};

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function Skeleton({
  width = "100%",
  height = 16,
}: {
  width?: string | number;
  height?: number;
}) {
  return (
    <div
      className="rounded-md"
      style={{
        width,
        height,
        background:
          "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Placeholder card — shown when bot is not connected
// ---------------------------------------------------------------------------

function OfflinePlaceholder({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <WifiOff className="w-8 h-8 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">{message}</p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bot Status Card — 4 states: connected, connecting, standby, offline
// ---------------------------------------------------------------------------

type BotMode = "connected" | "connecting" | "standby" | "offline";

interface BotStatusCardProps {
  title: string;
  mode: BotMode;
  isLoading: boolean;
  lastMessageTime: string | null;
  timestamp: string | null;
  showQRMode: boolean;
  onShowQR: () => void;
  onLogout: () => void;
  onSwitchBot: () => void;
  isProcessing: boolean;
}

const BotStatusCard: React.FC<BotStatusCardProps> = ({
  title,
  mode,
  isLoading,
  lastMessageTime,
  timestamp,
  showQRMode,
  onShowQR,
  onLogout,
  onSwitchBot,
  isProcessing,
}) => {
  // Format "Last Updated: Today - 14:12" or date
  const formatTime = (t: string | null) => {
    if (!t) return "Belum ada pesan";
    const d = new Date(t);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return isToday
      ? `Today - ${time}`
      : d.toLocaleDateString("id-ID", { dateStyle: "short" }) + ` - ${time}`;
  };

  const lastMsg = formatTime(lastMessageTime || timestamp);

  if (isLoading) {
    return (
      <Card>
        <Skeleton width="60%" height={22} />
        <div className="mt-4">
          <Skeleton width="40%" height={14} />
        </div>
        <div className="mt-3">
          <Skeleton height={10} />
        </div>
      </Card>
    );
  }

  const statusConfig = {
    connected: {
      dot: "bg-green-500",
      label: "Online",
      bar: "bg-linear-to-r from-green-400 to-green-600",
      barWidth: "100%",
    },
    connecting: {
      dot: "bg-amber-400",
      label: "Connecting...",
      bar: "bg-linear-to-r from-[#14a2bb] to-[#115d72]",
      barWidth: "60%",
    },
    standby: {
      dot: "bg-amber-400",
      label: "Standby",
      bar: "bg-linear-to-r from-amber-300 to-amber-500",
      barWidth: "50%",
    },
    offline: {
      dot: "bg-red-400",
      label: "Offline",
      bar: "bg-linear-to-r from-red-300 to-red-400",
      barWidth: "0%",
    },
  };

  const { dot, label, bar, barWidth } = statusConfig[mode];

  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                mode === "connected"
                  ? "bg-green-100 text-green-700"
                  : mode === "connecting"
                    ? "bg-amber-100 text-amber-700"
                    : mode === "standby"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
              }`}
            >
              {label}
            </span>
          </div>
        }
      />

      <div className="flex mb-2 justify-between items-center gap-8">
        <div className="w-full">
          <p className="text-xs text-gray-500">Last Updated: {lastMsg}</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${bar}`}
              style={{ width: barWidth }}
            />
          </div>
        </div>

        {mode === "connected" && (
          <button
            onClick={onLogout}
            disabled={isProcessing}
            className="w-[130px] shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 active:scale-95"
          >
            {isProcessing ? "..." : "Logout"}
          </button>
        )}

        {mode === "standby" && (
          <button
            onClick={onSwitchBot}
            disabled={isProcessing}
            className="w-[130px] shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 active:scale-95"
          >
            {isProcessing ? "..." : "Pindah Bot"}
          </button>
        )}

        {(mode === "offline" || mode === "connecting") && (
          <button
            onClick={onShowQR}
            className="w-[130px] shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:scale-95"
          >
            {showQRMode ? "Hide QR" : "Show QR"}
          </button>
        )}
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// QR Card
// ---------------------------------------------------------------------------

function QRCard({ host }: { host: string }) {
  const { data, refetch } = useBotQR(host);
  const qr = data?.qr;

  return (
    <Card className="mt-4 animate-fadeIn">
      <CardHeader
        title="Connect WhatsApp Bot"
        action={
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Refresh
          </button>
        }
      />

      <div className="flex flex-col items-center py-4">
        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-4">
          {qr ? (
            <Image
              src={qr}
              alt="WhatsApp QR Code"
              width={192}
              height={192}
              className="w-48 h-48"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-sm">
              Memuat QR…
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 text-center mb-1">
          Scan menggunakan WhatsApp &gt; Linked Devices
        </p>
        <p className="text-xs text-gray-400">Menunggu koneksi...</p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Groups Config Section
// ---------------------------------------------------------------------------

function GroupsSection({
  host,
  connected,
}: {
  host: string;
  connected: boolean;
}) {
  const { data: groups, isLoading } = useBotGroups(host, connected);
  const updateGroups = useUpdateGroups(host);

  if (!connected) {
    return (
      <OfflinePlaceholder
        title="Konfigurasi Group"
        message="Koneksikan ke WhatsApp untuk konfigurasi grup"
      />
    );
  }

  if (isLoading) {
    return (
      <Card>
        <Skeleton width="50%" height={22} />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={20} />
          ))}
        </div>
      </Card>
    );
  }

  const list = Array.isArray(groups) ? groups : [];
  const activeCount = list.filter((g) => g.enabled).length;

  const handleToggle = (id: string) => {
    const current = list.filter((g) => g.enabled).map((g) => g.id);
    const next = current.includes(id)
      ? current.filter((gid) => gid !== id)
      : [...current, id];
    updateGroups.mutate(next);
  };

  return (
    <Card>
      <CardHeader title="Konfigurasi Group" />

      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
        {list.map((group) => (
          <label
            key={group.id}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2.5 rounded-lg transition-colors"
          >
            <input
              type="checkbox"
              checked={group.enabled}
              onChange={() => handleToggle(group.id)}
              disabled={updateGroups.isPending}
              className="w-4.5 h-4.5 accent-[#14a2bb] rounded border-gray-300 focus:ring-2 focus:ring-[#14a2bb]"
            />
            <span className="text-sm text-gray-700 flex-1 truncate">
              {group.name}{" "}
              <span className="text-gray-400">
                ({group.participants} anggota)
              </span>
            </span>
          </label>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-right mt-3">
        {activeCount} Aktif (dari {list.length})
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Keywords Section
// ---------------------------------------------------------------------------

function KeywordsSection({
  host,
  connected,
}: {
  host: string;
  connected: boolean;
}) {
  const { data: keywords, isLoading } = useBotKeywords(host, connected);
  const addKw = useAddKeyword(host);
  const deleteKw = useDeleteKeyword(host);
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const val = input.trim();
    if (!val) return;
    addKw.mutate(val, { onSuccess: () => setInput("") });
  };

  if (!connected) {
    return (
      <OfflinePlaceholder
        title="Keywords"
        message="Koneksikan ke WhatsApp untuk konfigurasi keyword"
      />
    );
  }

  if (isLoading) {
    return (
      <Card>
        <Skeleton width="30%" height={22} />
        <div className="mt-4">
          <Skeleton height={36} />
        </div>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width={70} height={28} />
          ))}
        </div>
      </Card>
    );
  }

  const list = Array.isArray(keywords) ? keywords : [];

  return (
    <Card>
      <CardHeader
        title="Keywords"
        description="Filter pesan berdasarkan keyword"
      />

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Tambahkan keyword baru"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent transition-all duration-200"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={addKw.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#115d72] text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50"
        >
          <Plus size={16} />
          {addKw.isPending ? "..." : "Tambah"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {list.map((kw, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
          >
            {kw}
            <button
              onClick={() => deleteKw.mutate(kw)}
              disabled={deleteKw.isPending}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {list.length === 0 && (
          <span className="text-sm text-gray-400 italic">
            Belum ada keyword
          </span>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bot Activity (Metrics)
// ---------------------------------------------------------------------------

function BotActivity({
  host,
  connected,
}: {
  host: string;
  connected: boolean;
}) {
  const { data: status, isLoading } = useBotStatus(host, connected);

  if (!connected) {
    return null;
  }

  const queue = status?.queueSize ?? 0;
  const failed = status?.failedDeliveries ?? 0;
  const max = Math.max(queue, failed, 1);

  if (isLoading) {
    return (
      <Card>
        <Skeleton width="40%" height={22} />
        <div className="mt-4 space-y-4">
          <Skeleton height={10} />
          <Skeleton height={10} />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Bot Activity"
        action={
          <span className="text-xs text-gray-500">
            {status?.lastMessageTime
              ? `Last: ${new Date(status.lastMessageTime).toLocaleTimeString("id-ID")}`
              : "No message sent yet"}
          </span>
        }
      />

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700">Outbox Queue</span>
            <span className="text-sm font-semibold text-gray-900">{queue}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-linear-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(queue / max) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700">Failed Deliveries</span>
            <span className="text-sm font-semibold text-gray-900">
              {failed}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-linear-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(failed / max) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Data Collection Toggle
// ---------------------------------------------------------------------------

function DataCollectionSection({
  host,
  connected,
}: {
  host: string;
  connected: boolean;
}) {
  const { data, isLoading } = useDataCollectionStatus(host, connected);
  const toggle = useToggleDataCollection(host);

  const enabled = data?.enabled ?? false;

  if (!connected) {
    return (
      <OfflinePlaceholder
        title="Data Collection"
        message="Koneksikan ke WhatsApp untuk konfigurasi data collection"
      />
    );
  }

  if (isLoading) {
    return (
      <Card className="grow">
        <Skeleton width="50%" height={22} />
        <div className="mt-4">
          <Skeleton width="30%" height={20} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="grow">
      <CardHeader
        title="Data Collection"
        action={
          <span
            className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${
              enabled
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {enabled ? "Enabled" : "Disabled"}
          </span>
        }
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-sm font-medium text-gray-900">
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        <Switch
          checked={enabled}
          onChange={(e) => toggle.mutate(e.target.checked)}
          disabled={toggle.isPending}
          sx={SWITCH_SX}
        />
      </div>

      <p className="text-sm text-gray-500">
        Mengumpulkan chat dan meta data untuk reporting
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Humanize Settings Section
// ---------------------------------------------------------------------------

function HumanizeSection({
  host,
  connected,
}: {
  host: string;
  connected: boolean;
}) {
  const { data: config, isLoading } = useHumanizeConfig(host, connected);
  const update = useUpdateHumanize(host);
  const toggleH = useToggleHumanize(host);

  if (!connected) {
    return (
      <OfflinePlaceholder
        title="Humanize Settings"
        message="Koneksikan ke WhatsApp untuk konfigurasi humanize"
      />
    );
  }

  if (isLoading) {
    return (
      <Card>
        <Skeleton width="50%" height={22} />
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={16} />
          ))}
        </div>
      </Card>
    );
  }

  if (!config) return null;

  const handleSliderChange = (
    field: keyof typeof config,
    value: number | number[],
  ) => {
    update.mutate({ [field]: Array.isArray(value) ? value[0] : value });
  };

  return (
    <Card>
      <CardHeader
        title="Humanize Settings"
        action={
          <Switch
            checked={config.enabled}
            onChange={(e) => toggleH.mutate(e.target.checked)}
            disabled={toggleH.isPending}
            size="small"
            sx={SWITCH_SX}
          />
        }
      />

      <div
        className={`space-y-5 transition-opacity duration-200 ${!config.enabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        {/* Processing Delay */}
        <div>
          <label className="text-sm text-gray-700 mb-1 block">
            Processing Delay ({config.minProcessingDelay}–
            {config.maxProcessingDelay} ms)
          </label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <span className="text-xs text-gray-500">Min</span>
              <Slider
                value={config.minProcessingDelay}
                min={0}
                max={5000}
                step={100}
                size="small"
                onChange={(_e, v) =>
                  handleSliderChange("minProcessingDelay", v)
                }
                disabled={update.isPending}
                sx={{ color: "#14a2bb" }}
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-500">Max</span>
              <Slider
                value={config.maxProcessingDelay}
                min={0}
                max={10000}
                step={100}
                size="small"
                onChange={(_e, v) =>
                  handleSliderChange("maxProcessingDelay", v)
                }
                disabled={update.isPending}
                sx={{ color: "#14a2bb" }}
              />
            </div>
          </div>
        </div>

        {/* Read Delay */}
        <div>
          <label className="text-sm text-gray-700 mb-1 block">
            Read Delay ({config.minReadDelay}–{config.maxReadDelay} ms)
          </label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <span className="text-xs text-gray-500">Min</span>
              <Slider
                value={config.minReadDelay}
                min={0}
                max={3000}
                step={50}
                size="small"
                onChange={(_e, v) => handleSliderChange("minReadDelay", v)}
                disabled={update.isPending}
                sx={{ color: "#14a2bb" }}
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-500">Max</span>
              <Slider
                value={config.maxReadDelay}
                min={0}
                max={5000}
                step={50}
                size="small"
                onChange={(_e, v) => handleSliderChange("maxReadDelay", v)}
                disabled={update.isPending}
                sx={{ color: "#14a2bb" }}
              />
            </div>
          </div>
        </div>

        {/* Presence & Offline Chance */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Show Presence</span>
          <Switch
            checked={config.presenceEnabled}
            onChange={(e) =>
              update.mutate({ presenceEnabled: e.target.checked })
            }
            disabled={update.isPending}
            size="small"
            sx={SWITCH_SX}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 mb-1 block">
            Offline Chance: {config.offlineChance}%
          </label>
          <Slider
            value={config.offlineChance}
            min={0}
            max={100}
            step={1}
            size="small"
            onChange={(_e, v) => handleSliderChange("offlineChance", v)}
            disabled={update.isPending}
            sx={{ color: "#14a2bb" }}
          />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const ManajemenBot: React.FC = () => {
  const [showPrimaryQR, setShowPrimaryQR] = useState(false);
  const [showSecondaryQR, setShowSecondaryQR] = useState(false);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: "logout" | "switch";
    botLabel: string;
    action: () => void;
  } | null>(null);

  // Fetch primary status (always active)
  const { data: primaryStatus, isLoading: primaryLoading } =
    useBotStatus(BOT_PRIMARY_API);

  const primaryConnected = primaryStatus?.connected ?? false;
  const primaryConnectionState =
    primaryStatus?.connectionState ?? "disconnected";

  // Only poll secondary when primary is NOT connected
  const { data: secondaryStatus, isLoading: secondaryLoading } = useBotStatus(
    BOT_SECONDARY_API,
    !primaryConnected,
  );

  const secondaryConnected = secondaryStatus?.connected ?? false;
  const secondaryConnectionState =
    secondaryStatus?.connectionState ?? "disconnected";

  // Any bot connected? (used to gate config sections)
  const anyConnected = primaryConnected || secondaryConnected;

  // Active bot host — primary takes priority
  const activeHost = primaryConnected
    ? BOT_PRIMARY_API
    : secondaryConnected
      ? BOT_SECONDARY_API
      : BOT_PRIMARY_API;

  const disconnectPrimary = useDisconnectBot(BOT_PRIMARY_API);
  const disconnectSecondary = useDisconnectBot(BOT_SECONDARY_API);

  // Derive bot modes (4 states now)
  const primaryMode: BotMode = primaryConnected
    ? "connected"
    : secondaryConnected
      ? "standby"
      : primaryConnectionState === "connecting"
        ? "connecting"
        : "offline";

  const secondaryMode: BotMode = secondaryConnected
    ? "connected"
    : primaryConnected
      ? "standby"
      : secondaryConnectionState === "connecting"
        ? "connecting"
        : "offline";

  // Auto-close QR when connected (derived — no useEffect setState)
  const effectivePrimaryQR = showPrimaryQR && !primaryConnected;
  const effectiveSecondaryQR = showSecondaryQR && !secondaryConnected;

  // ---- Handlers ----

  const handlePrimaryLogout = () =>
    setConfirmAction({
      type: "logout",
      botLabel: "Primary Bot",
      action: () => {
        disconnectPrimary.mutate();
        setConfirmAction(null);
      },
    });

  const handleSecondaryLogout = () =>
    setConfirmAction({
      type: "logout",
      botLabel: "Secondary Bot",
      action: () => {
        disconnectSecondary.mutate();
        setConfirmAction(null);
      },
    });

  const handleSwitchToPrimary = () =>
    setConfirmAction({
      type: "switch",
      botLabel: "Primary Bot",
      action: () => {
        disconnectSecondary.mutate(undefined, {
          onSuccess: () => setShowPrimaryQR(true),
        });
        setConfirmAction(null);
      },
    });

  const handleSwitchToSecondary = () =>
    setConfirmAction({
      type: "switch",
      botLabel: "Secondary Bot",
      action: () => {
        disconnectPrimary.mutate(undefined, {
          onSuccess: () => setShowSecondaryQR(true),
        });
        setConfirmAction(null);
      },
    });

  // Confirm modal text
  const confirmTitle =
    confirmAction?.type === "logout"
      ? `Logout ${confirmAction.botLabel}?`
      : `Pindah ke ${confirmAction?.botLabel}?`;

  const confirmDescription =
    confirmAction?.type === "logout"
      ? `Bot akan diputuskan dari WhatsApp. Semua proses yang sedang berjalan akan dihentikan. Anda perlu scan QR ulang untuk menghubungkan kembali.`
      : `Bot yang sedang aktif akan di-logout terlebih dahulu, kemudian Anda akan diminta scan QR untuk menghubungkan ${confirmAction?.botLabel}. Pastikan tidak ada proses penting yang sedang berjalan.`;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 animate-fadeIn">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="text-gray-400">&gt;</span>
          <span className="text-gray-900 font-medium">Manajemen Bot</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Manajemen Bot
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Kelola bot &amp; monitoring WhatsApp Bot PLN
        </p>
      </div>

      {/* Bot Status Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-fadeIn"
        style={{ animationDelay: "100ms" }}
      >
        <div>
          <BotStatusCard
            title="Primary Bot"
            mode={primaryMode}
            isLoading={primaryLoading}
            lastMessageTime={primaryStatus?.lastMessageTime ?? null}
            timestamp={null}
            showQRMode={effectivePrimaryQR}
            onShowQR={() => setShowPrimaryQR((v) => !v)}
            onLogout={handlePrimaryLogout}
            onSwitchBot={handleSwitchToPrimary}
            isProcessing={
              disconnectPrimary.isPending || disconnectSecondary.isPending
            }
          />
          {effectivePrimaryQR && <QRCard host={BOT_PRIMARY_API} />}
        </div>

        <div>
          <BotStatusCard
            title="Secondary Bot"
            mode={secondaryMode}
            isLoading={!primaryConnected && secondaryLoading}
            lastMessageTime={secondaryStatus?.lastMessageTime ?? null}
            timestamp={null}
            showQRMode={effectiveSecondaryQR}
            onShowQR={() => setShowSecondaryQR((v) => !v)}
            onLogout={handleSecondaryLogout}
            onSwitchBot={handleSwitchToSecondary}
            isProcessing={
              disconnectPrimary.isPending || disconnectSecondary.isPending
            }
          />
          {effectiveSecondaryQR && <QRCard host={BOT_SECONDARY_API} />}
        </div>
      </div>

      {/* Second Row */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-fadeIn"
        style={{ animationDelay: "200ms" }}
      >
        <GroupsSection host={activeHost} connected={anyConnected} />
        <KeywordsSection host={activeHost} connected={anyConnected} />
        <DataCollectionSection host={activeHost} connected={anyConnected} />
      </div>

      {/* Third Row — Bot Activity + Humanize (only when connected) */}
      {anyConnected && (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 animate-fadeIn"
          style={{ animationDelay: "300ms" }}
        >
          <BotActivity host={activeHost} connected={anyConnected} />
          <HumanizeSection host={activeHost} connected={anyConnected} />
        </div>
      )}

      {/* Humanize placeholder when disconnected */}
      {!anyConnected && (
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-fadeIn"
          style={{ animationDelay: "300ms" }}
        >
          <OfflinePlaceholder
            title="Bot Activity"
            message="Koneksikan ke WhatsApp untuk melihat aktivitas bot"
          />
          <OfflinePlaceholder
            title="Humanize Settings"
            message="Koneksikan ke WhatsApp untuk konfigurasi humanize"
          />
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmAction !== null}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={
          confirmAction?.type === "logout" ? "Logout" : "Pindah Bot"
        }
        variant={confirmAction?.type === "logout" ? "danger" : "warning"}
        loading={disconnectPrimary.isPending || disconnectSecondary.isPending}
        onConfirm={() => confirmAction?.action()}
        onCancel={() => setConfirmAction(null)}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ManajemenBot;
