import { useEvents, type DashboardEvent } from "@/hooks/service/dashboard-api";

type Props = {
  pemasokId?: string;
  pembangkitId?: string;
};

export default function NoteSection({ pemasokId, pembangkitId }: Props) {
  const siteId = pembangkitId || pemasokId;

  // Fetch events from API — last 30 days
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: eventsData } = useEvents(
    thirtyDaysAgo,
    today,
    50,
    undefined,
    siteId,
    undefined,
  );

  const notes = eventsData?.events || [];

  return (
    <div>
      <div className="text-gray-800 flex justify-between items-center">
        <h3 className="font-bold">Catatan Kejadian</h3>
      </div>
      <div>
        <div className="border border-gray-200 p-5 rounded-lg mt-3 text-gray-800 overflow-auto h-[220px]">
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="my-4 border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex gap-3">
                    <div className="w-[5px] min-w-[5px] bg-[#14a2bb92] rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="font-bold">{note.siteName}</p>
                        <p className="font-bold text-sm">
                          {note.title}
                        </p>
                      </div>
                      <p className="text-justify">{note.description}</p>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {new Date(note.occurredAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span>
                          {new Date(note.occurredAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
