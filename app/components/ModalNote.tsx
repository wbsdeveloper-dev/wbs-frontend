import { X, Trash2, Paperclip, Eye, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import {
  useEvents,
  useCreateEvent,
  useDeleteEvent,
  uploadEventFile,
  DASHBOARD_API_HOST,
  type DashboardEvent,
} from "@/hooks/service/dashboard-api";
import { getAccessToken } from "@/lib/auth";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Hanya file PDF dan Gambar yang diperbolehkan sebagai bukti.");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  };

  const handlePreviewBukti = (fileName: string) => {
    if (!fileName) return;

    // Check if it is a legacy note or new uploaded file
    const isLegacy = !fileName.includes("-");
    if (isLegacy) {
      const newTab = window.open("", "_blank");
      if (newTab) {
        newTab.document.write(`
          <html>
            <head>
              <title>Preview Bukti - ${fileName}</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                body { background: #f3f4f6; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
              </style>
            </head>
            <body class="flex flex-col items-center justify-center min-h-screen text-gray-800 p-6">
              <div class="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center border border-gray-100 transform transition-all duration-300 scale-100 hover:scale-101">
                <div class="w-20 h-20 mx-auto rounded-3xl bg-[#115d72]/10 flex items-center justify-center text-[#115d72] mb-6">
                  <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2 truncate" title="${fileName}">${fileName}</h1>
                <p class="text-sm text-gray-500 mb-6">Dokumen Bukti Catatan Kejadian (Legacy)</p>
                
                <div class="bg-blue-50/50 rounded-xl p-4 mb-6 border border-blue-100/50 text-left">
                  <div class="flex items-center gap-2 mb-2 text-xs font-semibold text-[#115d72]">
                    <span class="w-2 h-2 rounded-full bg-[#115d72] animate-pulse"></span>
                    <span>STATUS DOKUMEN: TERVERIFIKASI (LEGACY)</span>
                  </div>
                  <p class="text-xs text-gray-600 leading-relaxed">
                    Berkas bukti ini dirujuk secara legacy di deskripsi catatan kejadian.
                  </p>
                </div>

                <div class="flex gap-4 justify-center">
                  <button onclick="window.close()" class="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer">
                    Tutup Pratinjau
                  </button>
                </div>
              </div>
              <footer class="mt-8 text-xs text-gray-400">WBS Platform &copy; ${new Date().getFullYear()}</footer>
            </body>
          </html>
        `);
        newTab.document.close();
      }
    } else {
      window.open(`${DASHBOARD_API_HOST}/dashboard/events/files/${encodeURIComponent(fileName)}?token=${getAccessToken()}`, "_blank");
    }
  };

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
      let uploadedFilename = undefined;
      if (selectedFile) {
        const uploadResult = await uploadEventFile(selectedFile);
        uploadedFilename = uploadResult.filename;
      }

      await createEvent.mutateAsync({
        siteId: seriesSiteId || undefined,
        siteName: supplier || "Unknown",
        occurredAt: selectedTimestamp ? new Date(selectedTimestamp).toISOString() : new Date().toISOString(),
        title: `Catatan ${supplier} - ${time}`,
        description: note.trim(),
        severity: "INFO",
        document: uploadedFilename,
      });

      setNote("");
      setSelectedFile(null);
      setSavedSuccess(true);
      submitNote();
      refetch();

      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      console.error("Gagal menyimpan catatan:", err);
      alert(err.message || "Gagal menyimpan catatan. Silakan coba lagi.");
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
                  {existingNotes.map((n) => {
                    const match = n.description ? n.description.match(/\s*\[Bukti:\s*(.*?)\]\s*$/i) : null;
                    const cleanDesc = match ? n.description.replace(match[0], "") : n.description;
                    const buktiFileName = n.document || (match ? match[1] : null);

                    return (
                      <div
                        key={n.id}
                        className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0"
                      >
                        <p className="text-sm">{cleanDesc}</p>
                        <div className="flex justify-between items-end text-xs text-gray-500 mt-2">
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

                          <div className="flex items-center gap-1.5">
                            {buktiFileName && (
                              <button
                                onClick={() => handlePreviewBukti(buktiFileName)}
                                className="text-[#115d72] hover:text-[#0d4a5c] hover:bg-gray-100 p-1 rounded transition-colors cursor-pointer"
                                title={`Lihat Bukti: ${(() => {
                                  const name = buktiFileName || "";
                                  const timestampRegex = /^\d+-\d+-/;
                                  return timestampRegex.test(name) ? name.replace(timestampRegex, "") : name;
                                })()}`}
                              >
                                <FileText size={16} />
                              </button>
                            )}

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
                      </div>
                    );
                  })}
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
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
                      <Paperclip size={14} className="text-gray-500" />
                      <span>{selectedFile ? selectedFile.name : "Unggah Bukti"}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    {selectedFile && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      className={`w-[100px] font-medium py-2 rounded-lg transition-colors cursor-pointer text-white ${saving || !note.trim()
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-[#115d72] hover:bg-[#0d4a5c]"
                        }`}
                      onClick={handleSave}
                      disabled={saving || !note.trim()}
                    >
                      {saving ? "Menyimpan..." : "Simpan"}
                    </button>
                    {savedSuccess && (
                      <span className="text-green-600 text-xs font-medium animate-fade-in">
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
    </div>
  );
}
