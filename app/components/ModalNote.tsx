import { X } from "lucide-react";

type Props = {
  setOpenModal: (value: boolean) => void;
  supplier: string | undefined;
  time: string | undefined;
  date: string;
  note: string;
  setNote: (value: string) => void;
  submitNote: () => void;
};

export default function ModalNote({
  setOpenModal,
  supplier,
  time,
  date,
  note,
  setNote,
  submitNote,
}: Props) {
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
                <p className="font-bold mb-2">
                  {time}, {date}
                </p>
              </div>
              {time == "04.00" && supplier == "Pembangkit 1" ? (
                <div className="border border-gray-200 p-3 rounded-lg">
                  <div className="mt-1">
                    <p>
                      Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                      Animi consectetur laborum odio sapiente exercitationem
                      maiores inventore. Eligendi saepe dolorem enim perferendis
                      dolorum sint! Facilis officia, ea dolor architecto enim,
                      inventore, quae dolores earum perspiciatis at ipsa
                      repudiandae! Neque quibusdam laboriosam fugit distinctio
                      blanditiis? Vitae et quisquam commodi sed nobis. Quaerat
                      repellendus ducimus quae perspiciatis veritatis eos
                      mollitia aut alias dignissimos dicta, fuga, minima maxime
                      doloremque porro temporibus qui blanditiis eum itaque
                      sequi facilis, esse eligendi neque. Minus debitis officia,
                      ut laboriosam fuga animi quaerat placeat error? Facere
                      error similique odit, in beatae temporibus qui quasi alias
                      esse officia officiis rerum?
                    </p>
                  </div>
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
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        focus:border-blue-500
                        resize-none
                      "
                />
                <button
                  className="w-[100] bg-[#14a1bb] hover:bg-[#115d72] text-white font-medium py-2 rounded-lg transition-colors cursor-pointer"
                  onClick={() => submitNote()}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
