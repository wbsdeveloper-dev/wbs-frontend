import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  FileCheck2,
  Gavel,
  KeyRound,
  Link2,
  Scale,
  ServerCog,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Ketentuan Layanan | WBS PLN EPI",
  description:
    "Ketentuan penggunaan Aplikasi WBS PLN EPI dan integrasinya, termasuk layanan Email Ingest melalui Google OAuth dan Gmail API.",
};

const lastUpdated = "12 November 2026";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/auth/login"
            className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          >
            <Image
              src="/logos/pln-epi.png"
              alt="PLN Energi Primer Indonesia"
              width={112}
              height={38}
              className="h-9 w-auto object-contain"
              priority
            />
            <span className="hidden border-l border-slate-200 pl-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200 sm:block">
              WBS PLN EPI
            </span>
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-[#115d72] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Kembali ke Login
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-cyan-100 bg-gradient-to-br from-[#115d72] via-[#0f7186] to-[#14a2bb] text-white dark:border-slate-800 dark:from-slate-900 dark:via-[#103e4a] dark:to-[#115d72]">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-medium text-cyan-50">
              <FileCheck2 size={16} aria-hidden="true" />
              Ketentuan Penggunaan Aplikasi
            </div>
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
              Ketentuan Layanan
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-cyan-50 sm:text-lg">
              Ketentuan ini mengatur akses dan penggunaan Aplikasi WBS PLN EPI,
              termasuk dashboard, pengelolaan data, integrasi, Email Ingest, dan
              layanan pendukung lainnya.
            </p>
            <p className="mt-6 text-sm text-cyan-100">
              Terakhir diperbarui: {lastUpdated}
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:py-14">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav
              aria-label="Daftar isi ketentuan layanan"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daftar Isi
              </p>
              <div className="space-y-1 text-sm">
                {[
                  ["penerimaan", "Penerimaan Ketentuan"],
                  ["layanan", "Ruang Lingkup"],
                  ["akses", "Akun dan Akses"],
                  ["penggunaan", "Penggunaan yang Diizinkan"],
                  ["larangan", "Larangan"],
                  ["integrasi", "Integrasi Pihak Ketiga"],
                  ["data", "Data dan Kepemilikan"],
                  ["ketersediaan", "Ketersediaan Layanan"],
                  ["penghentian", "Penghentian Akses"],
                  ["tanggung-jawab", "Tanggung Jawab"],
                  ["perubahan", "Perubahan Ketentuan"],
                  ["kontak", "Kontak"],
                ].map(([id, label]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-lg px-2 py-2 text-slate-600 transition hover:bg-cyan-50 hover:text-[#115d72] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          <article className="min-w-0 space-y-6">
            <TermsSection
              id="penerimaan"
              icon={Scale}
              title="Penerimaan Ketentuan"
            >
              <p>
                Dengan mengakses, menggunakan, atau menghubungkan layanan pihak
                ketiga ke WBS PLN EPI, pengguna menyetujui Ketentuan Layanan ini
                dan{" "}
                <Link
                  href="/privacy-policy"
                  className="font-semibold text-[#0f7186] underline underline-offset-4 hover:text-[#115d72] dark:text-cyan-300"
                >
                  Kebijakan Privasi
                </Link>
                . Jika pengguna bertindak atas nama organisasi, pengguna
                menyatakan memiliki kewenangan untuk melakukan tindakan
                tersebut.
              </p>
              <p>
                Pengguna yang tidak menyetujui ketentuan ini tidak diperkenankan
                menggunakan aplikasi atau menghubungkan akun dan sumber data.
              </p>
            </TermsSection>

            <TermsSection
              id="layanan"
              icon={ServerCog}
              title="1. Ruang Lingkup Layanan"
            >
              <p>
                WBS PLN EPI menyediakan fungsi untuk menghimpun, memvalidasi,
                merekonsiliasi, memonitor, dan menyajikan data operasional
                energi primer. Fitur dapat mencakup:
              </p>
              <ul>
                <li>
                  dashboard dan laporan operasional Gas Pipa, LNG, dan BBM;
                </li>
                <li>
                  pengelolaan data, master, kontrak, dokumen, rekonsiliasi, dan
                  notifikasi;
                </li>
                <li>
                  integrasi input melalui email, spreadsheet, WhatsApp, CTMS,
                  OCR/AI, atau kanal lain yang disetujui; dan
                </li>
                <li>
                  pengelolaan pengguna, peran, hak akses, template, rule, serta
                  catatan audit.
                </li>
              </ul>
              <p>
                Ketersediaan fitur ditentukan oleh konfigurasi lingkungan,
                peran, privilege, kebijakan organisasi, dan status layanan
                eksternal.
              </p>
            </TermsSection>

            <TermsSection
              id="akses"
              icon={KeyRound}
              title="2. Akun, Kewenangan, dan Keamanan Akses"
            >
              <ul>
                <li>
                  Pengguna hanya boleh mengakses aplikasi dengan akun yang
                  diberikan atau disetujui organisasi.
                </li>
                <li>
                  Pengguna wajib memberikan informasi yang benar dan menjaga
                  kerahasiaan kata sandi, token, perangkat, serta credential
                  lain.
                </li>
                <li>
                  Akun tidak boleh dibagikan, dipinjamkan, dialihkan, atau
                  digunakan untuk menyamarkan identitas pelaku.
                </li>
                <li>
                  Pengguna wajib segera melaporkan dugaan akses tanpa izin,
                  kehilangan credential, atau insiden keamanan.
                </li>
                <li>
                  Administrator dapat menerapkan autentikasi, pembatasan akses,
                  pemantauan, dan tindakan keamanan tambahan.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id="penggunaan"
              icon={CheckCircle2}
              title="3. Penggunaan yang Diizinkan"
            >
              <p>Pengguna wajib menggunakan aplikasi hanya untuk:</p>
              <ul>
                <li>
                  tujuan pekerjaan dan proses bisnis yang sah serta telah
                  disetujui;
                </li>
                <li>
                  mengolah data yang pengguna berwenang akses, unggah, kirim,
                  atau integrasikan;
                </li>
                <li>
                  menjalankan fungsi sesuai peran dan privilege yang diberikan;
                </li>
                <li>
                  mematuhi prosedur operasional, klasifikasi informasi, retensi,
                  keamanan, dan tata kelola organisasi; serta
                </li>
                <li>
                  mematuhi hukum, kontrak, kebijakan penyedia layanan, dan hak
                  pihak lain yang berlaku.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id="larangan"
              icon={Ban}
              title="4. Penggunaan yang Dilarang"
            >
              <p>Pengguna dilarang:</p>
              <ul>
                <li>mengakses data, akun, modul, atau sistem tanpa izin;</li>
                <li>
                  mengunggah malware, kode berbahaya, data ilegal, atau konten
                  yang melanggar hak pihak lain;
                </li>
                <li>
                  melewati kontrol akses, menguji kerentanan tanpa persetujuan,
                  mengganggu layanan, atau membebani sistem secara tidak wajar;
                </li>
                <li>
                  mengubah, menghapus, memalsukan, atau menyembunyikan data dan
                  jejak audit secara tidak sah;
                </li>
                <li>
                  menggunakan data Google atau data operasional untuk iklan,
                  pemasaran, penjualan, profiling yang tidak sah, atau tujuan di
                  luar layanan;
                </li>
                <li>
                  merekayasa balik, menyalin, mendistribusikan, atau
                  mengeksploitasi aplikasi kecuali secara tegas diizinkan; dan
                </li>
                <li>
                  menghubungkan mailbox, spreadsheet, grup, atau sumber data
                  yang tidak berada dalam kewenangannya.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id="integrasi"
              icon={Link2}
              title="5. Integrasi Google dan Layanan Pihak Ketiga"
            >
              <p>
                Fitur tertentu bergantung pada Google OAuth, Gmail API, Google
                Spreadsheet, WhatsApp, CTMS, OCR/AI, atau layanan lain. Dengan
                menghubungkan suatu integrasi, pengguna menyatakan bahwa:
              </p>
              <ul>
                <li>
                  pengguna memiliki hak dan kewenangan untuk memberikan akses
                  yang diminta;
                </li>
                <li>
                  pengguna memahami scope atau izin yang ditampilkan pada layar
                  persetujuan;
                </li>
                <li>
                  pemrosesan data akan mengikuti rule dan konfigurasi yang
                  ditetapkan administrator; dan
                </li>
                <li>
                  penggunaan layanan pihak ketiga juga tunduk pada ketentuan dan
                  kebijakan privasi penyedia tersebut.
                </li>
              </ul>
              <p>
                Akses Google dapat dicabut melalui konfigurasi Email Ingest atau
                pengaturan keamanan akun Google. Gangguan, perubahan API,
                pembatasan kuota, pencabutan token, atau penghentian layanan
                pihak ketiga dapat memengaruhi fungsi aplikasi dan berada di
                luar kendali penuh pengelola WBS PLN EPI.
              </p>
            </TermsSection>

            <TermsSection
              id="data"
              icon={ShieldCheck}
              title="6. Data, Akurasi, dan Kepemilikan"
            >
              <ul>
                <li>
                  Hak atas data tetap mengikuti kepemilikan, kontrak, dan tata
                  kelola organisasi serta pihak sumber data yang berlaku.
                </li>
                <li>
                  Pengguna bertanggung jawab memastikan keabsahan, kewenangan,
                  kelengkapan, dan ketepatan data yang dimasukkan atau
                  dihubungkan.
                </li>
                <li>
                  Hasil ekstraksi, OCR/AI, pemetaan, atau rekonsiliasi dapat
                  memerlukan pemeriksaan manusia sebelum digunakan untuk
                  keputusan penting.
                </li>
                <li>
                  Pengguna wajib memeriksa hasil aplikasi dan tidak boleh
                  menganggap keluaran otomatis selalu bebas dari kesalahan.
                </li>
                <li>
                  Pengelola dapat menyimpan metadata, log, dan jejak audit untuk
                  keamanan, dukungan, kepatuhan, serta ketertelusuran proses.
                </li>
              </ul>
            </TermsSection>

            <TermsSection
              id="ketersediaan"
              icon={ServerCog}
              title="7. Ketersediaan, Pemeliharaan, dan Perubahan Layanan"
            >
              <p>
                Pengelola berupaya menjaga aplikasi tersedia dan berfungsi
                dengan baik, tetapi tidak menjamin bahwa layanan akan selalu
                tanpa gangguan, penundaan, kesalahan, atau kehilangan
                konektivitas. Pemeliharaan, pembaruan keamanan, perubahan
                konfigurasi, keadaan darurat, dan ketergantungan eksternal dapat
                menyebabkan layanan dibatasi atau dihentikan sementara.
              </p>
              <p>
                Fitur dapat ditambah, diubah, dibatasi, atau dihentikan untuk
                memenuhi kebutuhan bisnis, keamanan, kepatuhan, dan operasional.
              </p>
            </TermsSection>

            <TermsSection
              id="penghentian"
              icon={UserRoundCheck}
              title="8. Penangguhan dan Penghentian Akses"
            >
              <p>
                Administrator atau pengelola dapat membatasi, menangguhkan, atau
                menghentikan akses apabila akun tidak lagi berwenang, terdapat
                dugaan pelanggaran, risiko keamanan, permintaan organisasi,
                kewajiban hukum, atau kebutuhan pemeliharaan sistem.
              </p>
              <p>
                Setelah akses dihentikan, data yang telah diproses dapat tetap
                disimpan sesuai retensi, audit, backup, penyelesaian kewajiban,
                dan ketentuan hukum. Penghentian akun tidak menghapus kewajiban
                yang secara sifatnya tetap berlaku.
              </p>
            </TermsSection>

            <TermsSection
              id="tanggung-jawab"
              icon={AlertTriangle}
              title="9. Batasan dan Tanggung Jawab"
            >
              <p>
                Sejauh diizinkan oleh ketentuan yang berlaku, aplikasi
                disediakan untuk mendukung proses operasional dan tidak
                menggantikan penilaian profesional, persetujuan pejabat
                berwenang, atau kontrol bisnis yang diwajibkan. Pengguna
                bertanggung jawab atas keputusan dan tindakan yang dibuat
                berdasarkan data serta keluaran aplikasi.
              </p>
              <p>
                Pengelola tidak bertanggung jawab atas gangguan atau kerugian
                yang timbul dari penggunaan tanpa izin, data sumber yang salah,
                credential pengguna yang bocor, kegagalan layanan eksternal,
                atau pelanggaran terhadap ketentuan ini, sepanjang batas
                tersebut diizinkan oleh hukum dan tata kelola organisasi.
              </p>
            </TermsSection>

            <TermsSection
              id="perubahan"
              icon={Gavel}
              title="10. Perubahan Ketentuan"
            >
              <p>
                Ketentuan ini dapat diperbarui untuk menyesuaikan perubahan
                fitur, integrasi, keamanan, tata kelola, atau hukum. Versi
                terbaru akan ditampilkan pada halaman ini beserta tanggal
                pembaruannya. Penggunaan aplikasi setelah perubahan berlaku
                dianggap sebagai penerimaan terhadap ketentuan terbaru,
                sepanjang diizinkan oleh ketentuan yang berlaku.
              </p>
            </TermsSection>

            <TermsSection
              id="kontak"
              icon={FileCheck2}
              title="11. Kontak dan Penyelesaian Masalah"
            >
              <p>
                Pertanyaan, laporan pelanggaran, masalah akses, atau permintaan
                terkait ketentuan ini harus disampaikan kepada administrator
                resmi WBS PLN EPI atau unit pemilik proses yang ditunjuk oleh
                organisasi. Pengguna wajib mengikuti jalur eskalasi dan
                penyelesaian sengketa internal yang berlaku.
              </p>
            </TermsSection>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-slate-700 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-slate-300 sm:p-6">
              <p className="font-semibold text-[#115d72] dark:text-cyan-300">
                Perlindungan data
              </p>
              <p className="mt-2">
                Informasi mengenai pengumpulan, penggunaan, penyimpanan, dan
                penghapusan data tersedia pada{" "}
                <Link
                  href="/privacy-policy"
                  className="font-semibold text-[#0f7186] underline underline-offset-4 hover:text-[#115d72] dark:text-cyan-300"
                >
                  Kebijakan Privasi WBS PLN EPI
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:text-slate-400">
          <p>© 2026 WBS PLN EPI. Hak cipta dilindungi.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/privacy-policy"
              className="hover:text-[#115d72] dark:hover:text-cyan-300"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/terms-of-service"
              className="font-medium text-[#115d72] dark:text-cyan-300"
            >
              Ketentuan Layanan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

type TermsSectionProps = {
  id: string;
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
};

function TermsSection({ id, icon: Icon, title, children }: TermsSectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#0f7186] dark:bg-cyan-950/40 dark:text-cyan-300">
          <Icon size={20} aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="space-y-4 leading-7 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2 dark:[&_strong]:text-white">
        {children}
      </div>
    </section>
  );
}
