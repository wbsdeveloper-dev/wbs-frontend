import { X, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import {
  useEvents,
  useCreateEvent,
  useDeleteEvent,
  type DashboardEvent,
} from "@/hooks/service/dashboard-api";

type Props = {
  setOpenModal: (value: boolean) => void;
  supplier: string | undefined;
  time: string | undefined;
  date: string;
  note: string;
  setNote: (value: string) => void;
  submitNote: () => void;
  pemasokId?: string;
  pembangkitId?: string;
  seriesSiteId?: string;
  selectedTimestamp?: string;
  period?: string;
};

export default function ModalNote({
  setOpenModal,
  supplier,
  time,
  date,
  note,
  setNote,
  submitNote,
  pemasokId,
  pembangkitId,
  seriesSiteId,
  selectedTimestamp,
  period,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Determine the siteId to filter events by. Avoid comma-separated IDs.
  const apiSiteId = seriesSiteId || (pembangkitId && !pembangkitId.includes(",") ? pembangkitId : pemasokId && !pemasokId.includes(",") ? pemasokId : undefined);

  // Fetch existing events — date range that covers the selected timestamp
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // If selectedTimestamp is older than 30 days ago, extend the window to include it
  const queryStartDate = useMemo(() => {
    if (!selectedTimestamp) return thirtyDaysAgo;
    const tsDate = new Date(selectedTimestamp).toISOString().split("T")[0];
    return tsDate < thirtyDaysAgo ? tsDate : thirtyDaysAgo;
  }, [selectedTimestamp, thirtyDaysAgo]);

  const { data: eventsData, refetch } = useEvents(
    queryStartDate,
    today,
    100,
    undefined,
    apiSiteId,
    undefined,
  );

  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  // Show only events matching the selected point's date (and hour if in 1D view)
  const existingNotes = useMemo(() => {
    const allEvents = eventsData?.events || [];
    if (!selectedTimestamp) return allEvents;

    const clicked = new Date(selectedTimestamp);

    // Use UTC-based comparison to avoid local timezone inconsistencies
    const clickedYear = clicked.getUTCFullYear();
    const clickedMonth = clicked.getUTCMonth();
    const clickedDay = clicked.getUTCDate();
    const clickedHour = clicked.getUTCHours();

    return allEvents.filter((event) => {
      // Filter by the specific series clicked
      const isCorrectSite = seriesSiteId
        ? event.siteId === seriesSiteId
        : event.siteName === supplier;
      if (!isCorrectSite) return false;

      const eventD = new Date(event.occurredAt);

      // Always check year/month/day match
      if (
        eventD.getUTCFullYear() !== clickedYear ||
        eventD.getUTCMonth() !== clickedMonth ||
        eventD.getUTCDate() !== clickedDay
      ) {
        return false;
      }

      // For hourly view, also check hour match
      if (period === "1D") {
        return eventD.getUTCHours() === clickedHour;
      }

      return true;
    });
  }, [eventsData, selectedTimestamp, period, seriesSiteId, supplier]);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);

    try {
      await createEvent.mutateAsync({
        siteId: seriesSiteId || undefined,
        siteName: supplier || "Unknown",
        occurredAt: selectedTimestamp ? new Date(selectedTimestamp).toISOString() : new Date().toISOString(),
        title: `Catatan ${supplier} - ${time}`,
        description: note.trim(),
        severity: "INFO",
      });

      setNote("");
      setSavedSuccess(true);
      submitNote();
      refetch();

      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error("Gagal menyimpan catatan:", err);
      alert("Gagal menyimpan catatan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteEvent.mutateAsync(id);
      setConfirmDeleteId(null);
      refetch();
    } catch (err) {
      console.error("Gagal menghapus catatan:", err);
      alert("Gagal menghapus catatan. Silakan coba lagi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpenModal(false)}
      />
      <div className="relative bg-white w-full max-w-5xl rounded-xl shadow-lg p-6 z-10">
        <div className="text-right text-gray-900">
          <button
            onClick={() => setOpenModal(false)}
            className="cursor-pointer"
          >
            <X />
          </button>
        </div>
        <div>
          <div className="grid grid-cols-2 text-gray-900 gap-8">
            <div>
              <div className="flex justify-between">
                <h3 className="font-bold mb-2">Catatan {supplier}</h3>
                <div className="text-right">
                  <p className="font-bold mb-1">{time}</p>
                  {selectedTimestamp && (
                    <p className="text-xs text-gray-500">
                      {new Date(selectedTimestamp).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
              {existingNotes.length > 0 ? (
                <div className="border border-gray-200 p-3 rounded-lg max-h-[300px] overflow-y-auto space-y-3">
                  {existingNotes.map((n) => (
                    <div
                      key={n.id}
                      className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0"
                    >
                      <p className="text-sm">{n.description}</p>
                      <div className="flex justify-between items-start text-xs text-gray-500 mt-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-3">
                            <span>
                              {new Date(n.occurredAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                            {period === "1D" && (
                              <span>
                                {new Date(n.occurredAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400">
                            Oleh: <span className="font-semibold text-gray-600">{n.user?.fullName || "Sistem"}</span>
                            {n.user?.roles && n.user.roles.length > 0 ? (
                              <span className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-medium">
                                {n.user.roles.join(", ")}
                              </span>
                            ) : !n.user?.fullName ? (
                              <span className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-medium">
                                SYSTEM
                              </span>
                            ) : null}
                          </span>
                        </div>

                        {/* Delete button / confirm */}
                        {confirmDeleteId === n.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-red-500 text-xs">
                              Hapus catatan ini?
                            </span>
                            <button
                              onClick={() => handleDelete(n.id)}
                              disabled={deletingId === n.id}
                              className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {deletingId === n.id ? "Menghapus..." : "Ya"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded border border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(n.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-0.5 rounded hover:bg-red-50"
                            title="Hapus catatan"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 p-3 rounded-lg h-[200px] flex justify-center items-center">
                  <div className="mt-1">
                    <p>Tidak ada catatan kejadian</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold mb-2">Tambah Catatan Baru</h3>
              <div>
                <textarea
                  id="message"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tulis catatan di sini..."
                  className="
                        w-full rounded-lg border border-gray-200
                        px-4 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-200
                        focus:border-blue-200
                        resize-none
                      "
                />
                <div className="flex items-center gap-3">
                  <button
                    className={`w-[100] font-medium py-2 rounded-lg transition-colors cursor-pointer text-white ${saving || !note.trim()
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#115d72] hover:bg-[#0d4a5c]"
                      }`}
                    onClick={handleSave}
                    disabled={saving || !note.trim()}
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                  {savedSuccess && (
                    <span className="text-green-600 text-sm font-medium animate-fade-in">
                      ✓ Catatan berhasil disimpan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
