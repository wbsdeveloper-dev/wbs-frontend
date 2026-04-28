import { X } from "lucide-react";
import { useState, useMemo } from "react";
import {
  useEvents,
  useCreateEvent,
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
  selectedTimestamp?: string;
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
  selectedTimestamp,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Determine the siteId to filter events by
  const siteId = pembangkitId || pemasokId;

  // Fetch existing events — wide date range to show all recent events
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: eventsData, refetch } = useEvents(
    thirtyDaysAgo,
    today,
    50,
    undefined,
    siteId,
    undefined,
  );

  const createEvent = useCreateEvent();

  // Show only events matching the selected point's date and hour
  const existingNotes = useMemo(() => {
    const allEvents = eventsData?.events || [];
    if (!selectedTimestamp) return allEvents;

    const clickedDate = new Date(selectedTimestamp);
    const clickedYear = clickedDate.getFullYear();
    const clickedMonth = clickedDate.getMonth();
    const clickedDay = clickedDate.getDate();
    const clickedHour = clickedDate.getHours();

    return allEvents.filter((event) => {
      const eventDate = new Date(event.occurredAt);
      return (
        eventDate.getFullYear() === clickedYear &&
        eventDate.getMonth() === clickedMonth &&
        eventDate.getDate() === clickedDay &&
        eventDate.getHours() === clickedHour
      );
    });
  }, [eventsData, selectedTimestamp]);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);

    try {
      await createEvent.mutateAsync({
        siteId: siteId,
        siteName: supplier || "Unknown",
        occurredAt: selectedTimestamp || new Date().toISOString(),
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
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>
                          {new Date(n.occurredAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span>
                          {new Date(n.occurredAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
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
