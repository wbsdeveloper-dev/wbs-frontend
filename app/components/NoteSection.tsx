import { useMemo, useState } from "react";
import { useEvents, type DashboardEvent, DASHBOARD_API_HOST } from "@/hooks/service/dashboard-api";
import { getAccessToken } from "@/lib/auth";
import { FileText } from "lucide-react";

type Props = {
  pemasokId?: string;
  pembangkitId?: string;
};

export default function NoteSection({ pemasokId, pembangkitId }: Props) {
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
  // Build a set of relevant siteIds for client-side filtering
  const relevantSiteIds = useMemo(() => {
    const ids = new Set<string>();
    if (pembangkitId) pembangkitId.split(",").forEach((id) => ids.add(id.trim()));
    if (pemasokId) pemasokId.split(",").forEach((id) => ids.add(id.trim()));
    return ids;
  }, [pembangkitId, pemasokId]);

  // Only pass a single siteId to the API; skip if comma-separated
  const apiSiteId = useMemo(() => {
    if (pembangkitId && !pembangkitId.includes(",")) return pembangkitId;
    if (pemasokId && !pemasokId.includes(",")) return pemasokId;
    return undefined;
  }, [pembangkitId, pemasokId]);

  // Fetch events from API — last 90 days
  const today = new Date().toISOString().split("T")[0];
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: eventsData } = useEvents(
    ninetyDaysAgo,
    today,
    100,
    undefined,
    apiSiteId,
    undefined,
  );

  // Client-side filter: if we fetched without siteId, filter by relevant IDs
  const notes = useMemo(() => {
    const allEvents = eventsData?.events || [];
    if (relevantSiteIds.size === 0) return allEvents;
    return allEvents.filter((e) => relevantSiteIds.has(e.siteId));
  }, [eventsData, relevantSiteIds]);

  return (
    <div>
      <div className="text-gray-800 flex justify-between items-center">
        <h3 className="font-bold">Catatan Kejadian</h3>
      </div>
      <div>
        <div className="border border-gray-200 p-5 rounded-lg mt-3 text-gray-800 overflow-auto h-[275px]">
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => {
                const match = note.description ? note.description.match(/\s*\[Bukti:\s*(.*?)\]\s*$/i) : null;
                const cleanDesc = match ? note.description.replace(match[0], "") : note.description;
                const buktiFileName = note.document || (match ? match[1] : null);

                return (
                  <div key={note.id} className="my-4 border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex gap-3">
                      <div className="w-[5px] min-w-[5px] bg-[#14a2bb92] rounded-full"></div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <p className="font-bold">{note.siteName}</p>
                          <div className="text-right">
                            <p className="font-bold text-sm">
                              {note.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(note.occurredAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <p className="text-justify">{cleanDesc}</p>
                        <div className="flex justify-between items-start text-xs text-gray-500 mt-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-3">
                              <span>
                                {new Date(note.createdAt || note.created_at || note.occurredAt).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                              <span>
                                {new Date(note.createdAt || note.created_at || note.occurredAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400">
                              Oleh: <span className="font-semibold text-gray-600">{note.user?.fullName || "Sistem"}</span>
                              {note.user?.roles && note.user.roles.length > 0 ? (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-medium">
                                  {note.user.roles.join(", ")}
                                </span>
                              ) : !note.user?.fullName ? (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500 font-medium">
                                  SYSTEM
                                </span>
                              ) : null}
                            </span>
                          </div>
                          {buktiFileName && (
                            <button
                              onClick={() => handlePreviewBukti(buktiFileName)}
                              className="flex items-center gap-1 text-[#115d72] hover:text-[#0d4a5c] hover:bg-gray-50 px-2 py-1 rounded border border-gray-100 transition-colors cursor-pointer text-[11px] font-semibold h-fit self-end mt-1"
                              title={`Lihat Bukti: ${(() => {
                                const name = buktiFileName || "";
                                const timestampRegex = /^\d+-\d+-/;
                                return timestampRegex.test(name) ? name.replace(timestampRegex, "") : name;
                              })()}`}
                            >
                              <FileText size={12} />
                              <span className="truncate max-w-[120px]">
                                {(() => {
                                  const name = buktiFileName || "";
                                  const timestampRegex = /^\d+-\d+-/;
                                  return timestampRegex.test(name) ? name.replace(timestampRegex, "") : name;
                                })()}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-400">Belum ada catatan kejadian</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
