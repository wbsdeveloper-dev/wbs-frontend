export default function NoteSection() {
  return (
    <div>
      <div className="text-gray-800 flex justify-between items-center">
        <h3 className="font-bold">Catatan Kejadian</h3>
        {/* <div>
          <button className="bg-[#14a1bb] hover:bg-[#115d72] text-white font-medium p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
            <Plus className="w-5" />
            Tambah Catatan
          </button>
        </div> */}
      </div>
      <div>
        <div className="border border-gray-200 p-5 rounded-lg mt-3 text-gray-800 overflow-auto h-[220px]">
          <div className="my-1">
            <div className="flex gap-3">
              <div className="w-[30px] bg-[#14a2bb92] rounded-full"></div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="font-bold">Pembangkit 1</p>
                  <p className="font-bold">04.00, 25 Januari 2026</p>
                </div>
                <p className="text-justify">
                  Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                  Animi consectetur laborum odio sapiente exercitationem maiores
                  inventore. Eligendi saepe dolorem enim perferendis dolorum
                  sint! Facilis officia, ea dolor architecto enim, inventore,
                  quae dolores earum perspiciatis at ipsa repudiandae! Neque
                  quibusdam laboriosam fugit distinctio blanditiis? Vitae et
                  quisquam commodi sed nobis. Quaerat repellendus ducimus quae
                  perspiciatis veritatis eos mollitia aut alias dignissimos
                  dicta, fuga, minima maxime doloremque porro temporibus qui
                  blanditiis eum itaque sequi facilis, esse eligendi neque.
                  Minus debitis officia, ut laboriosam fuga animi quaerat
                  placeat error? Facere error similique odit, in beatae
                  temporibus qui quasi alias esse officia officiis rerum?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
