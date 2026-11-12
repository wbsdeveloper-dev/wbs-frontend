import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  ExternalLink,
  Eye,
  FileText,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | WBS PLN EPI",
  description:
    "Kebijakan Privasi Aplikasi WBS PLN EPI, termasuk penggunaan data Google dan Gmail untuk layanan Email Ingest.",
};

const lastUpdated = "12 November 2026";

export default function PrivacyPolicyPage() {
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
              <ShieldCheck size={16} aria-hidden="true" />
              Perlindungan Data dan Transparansi
            </div>
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
              Kebijakan Privasi
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-cyan-50 sm:text-lg">
              Kebijakan ini menjelaskan cara Aplikasi WBS PLN EPI mengakses,
              menggunakan, menyimpan, melindungi, dan menghapus data, termasuk
              data yang diperoleh melalui Google API untuk layanan Email Ingest.
            </p>
            <p className="mt-6 text-sm text-cyan-100">
              Terakhir diperbarui: {lastUpdated}
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:py-14">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav
              aria-label="Daftar isi kebijakan privasi"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daftar Isi
              </p>
              <div className="space-y-1 text-sm">
                {[
                  ["pendahuluan", "Pendahuluan"],
                  ["data", "Data yang Diproses"],
                  ["google", "Data Google"],
                  ["tujuan", "Tujuan Pemrosesan"],
                  ["penyimpanan", "Penyimpanan & Retensi"],
                  ["pembagian", "Pembagian Data"],
                  ["keamanan", "Keamanan"],
                  ["hak", "Hak dan Pilihan"],
                  ["perubahan", "Perubahan Kebijakan"],
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
            <PolicySection id="pendahuluan" icon={FileText} title="Pendahuluan">
              <p>
                WBS PLN EPI adalah aplikasi untuk menghimpun, memvalidasi,
                merekonsiliasi, memonitor, dan menyajikan data operasional
                energi primer. Akses aplikasi dan integrasinya diberikan kepada
                pengguna yang diberi kewenangan oleh organisasi pengelola.
              </p>
              <p>
                Dengan menggunakan aplikasi atau menghubungkan akun Google, Anda
                menyatakan telah membaca kebijakan ini dan memiliki kewenangan
                yang diperlukan untuk menyediakan atau mengotorisasi data yang
                diproses oleh sistem.
              </p>
            </PolicySection>

            <PolicySection
              id="data"
              icon={Database}
              title="1. Data yang Kami Proses"
            >
              <p>Data yang dapat diproses oleh WBS PLN EPI meliputi:</p>
              <ul>
                <li>
                  informasi akun pengguna, seperti nama, email, peran, status
                  akun, dan waktu login;
                </li>
                <li>
                  data operasional Gas Pipa, LNG, dan BBM yang dimasukkan atau
                  diterima oleh sistem;
                </li>
                <li>
                  metadata aktivitas, status pekerjaan, catatan audit, serta
                  informasi teknis untuk keamanan dan pemecahan masalah;
                </li>
                <li>
                  metadata email yang sesuai dengan rule Email Ingest, termasuk
                  pengirim, penerima, subjek, waktu, message ID, label, dan
                  informasi lampiran;
                </li>
                <li>
                  isi email dan lampiran yang memenuhi filter aktif serta
                  diperlukan untuk ekstraksi atau rekonsiliasi data; dan
                </li>
                <li>
                  data integrasi lain yang dikonfigurasi organisasi, seperti
                  spreadsheet, WhatsApp, CTMS, serta dokumen yang diproses
                  melalui OCR/AI.
                </li>
              </ul>
            </PolicySection>

            <PolicySection
              id="google"
              icon={Mail}
              title="2. Akses dan Penggunaan Data Google"
            >
              <p>
                Saat administrator menghubungkan akun Google, WBS PLN EPI
                menggunakan OAuth 2.0 dan Gmail API untuk menjalankan Email
                Ingest. Izin Gmail digunakan hanya untuk:
              </p>
              <ul>
                <li>
                  mencari email berdasarkan filter pengirim, subjek, label,
                  jadwal, dan aturan lampiran yang dikonfigurasi;
                </li>
                <li>
                  membaca email serta mengunduh lampiran yang relevan untuk
                  proses bisnis yang sah;
                </li>
                <li>
                  mencegah pemrosesan email yang sama secara berulang
                  menggunakan identitas pesan; dan
                </li>
                <li>
                  mengubah status pesan, seperti menandai email yang telah
                  diproses sebagai telah dibaca, apabila diperlukan oleh alur
                  Email Ingest.
                </li>
              </ul>
              <p>
                WBS PLN EPI tidak menggunakan data Google untuk iklan, profiling
                pemasaran, atau penjualan data. Penggunaan dan pemindahan
                informasi yang diterima dari Google API mematuhi{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#0f7186] underline decoration-cyan-300 underline-offset-4 hover:text-[#115d72] dark:text-cyan-300"
                >
                  Google API Services User Data Policy
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
                , termasuk persyaratan Limited Use.
              </p>
            </PolicySection>

            <PolicySection
              id="tujuan"
              icon={UserCheck}
              title="3. Tujuan dan Dasar Pemrosesan"
            >
              <p>Data diproses untuk tujuan berikut:</p>
              <ul>
                <li>
                  menyediakan fungsi aplikasi, autentikasi, otorisasi,
                  integrasi, dan dukungan pengguna;
                </li>
                <li>
                  mengambil, mengekstrak, memvalidasi, dan merekonsiliasi data
                  operasional dari sumber yang telah disetujui;
                </li>
                <li>
                  menyajikan dashboard, laporan, notifikasi, serta jejak audit
                  yang dibutuhkan kegiatan operasional;
                </li>
                <li>
                  menjaga keamanan, integritas, ketersediaan, dan keandalan
                  sistem; dan
                </li>
                <li>
                  memenuhi kewajiban organisasi, tata kelola, audit, serta
                  ketentuan hukum yang berlaku.
                </li>
              </ul>
              <p>
                Pemrosesan dilakukan berdasarkan kewenangan organisasi,
                persetujuan atau tindakan pengguna saat menghubungkan integrasi,
                kebutuhan pelaksanaan layanan, dan/atau kewajiban yang berlaku.
              </p>
            </PolicySection>

            <PolicySection
              id="penyimpanan"
              icon={Database}
              title="4. Penyimpanan dan Retensi Data"
            >
              <p>
                Data dapat disimpan pada database, penyimpanan file, log, dan
                infrastruktur yang ditetapkan untuk WBS PLN EPI. Data
                dipertahankan selama diperlukan untuk tujuan operasional,
                keamanan, audit, penyelesaian sengketa, pemulihan sistem, atau
                kewajiban organisasi dan hukum.
              </p>
              <p>
                Setelah masa retensi berakhir atau data tidak lagi diperlukan,
                data akan dihapus, dianonimkan, atau diamankan dari penggunaan
                lebih lanjut sesuai prosedur pengelola. Cadangan sistem dapat
                memerlukan waktu tambahan sebelum terhapus melalui siklus backup
                normal.
              </p>
            </PolicySection>

            <PolicySection
              id="pembagian"
              icon={Eye}
              title="5. Pembagian dan Pengungkapan Data"
            >
              <p>
                Data tidak dijual. Akses atau pengungkapan data dibatasi kepada:
              </p>
              <ul>
                <li>
                  personel dan pengguna berwenang berdasarkan peran serta
                  kebutuhan tugas;
                </li>
                <li>
                  penyedia infrastruktur atau layanan pemrosesan yang diperlukan
                  untuk mengoperasikan aplikasi dan terikat kewajiban
                  perlindungan data;
                </li>
                <li>
                  pemilik proses, auditor, atau fungsi kepatuhan sesuai
                  kewenangannya; dan
                </li>
                <li>
                  otoritas yang berwenang apabila diwajibkan oleh hukum atau
                  diperlukan untuk melindungi keamanan dan hak pihak terkait.
                </li>
              </ul>
              <p>
                Data Google tidak dibagikan kepada pihak ketiga untuk tujuan
                periklanan, pemasaran, atau tujuan lain yang tidak terkait
                langsung dengan fungsi Email Ingest yang dijelaskan dalam
                kebijakan ini.
              </p>
            </PolicySection>

            <PolicySection
              id="keamanan"
              icon={LockKeyhole}
              title="6. Keamanan Data"
            >
              <p>
                Pengelola menerapkan langkah administratif dan teknis yang
                wajar, termasuk autentikasi, kontrol akses berbasis peran,
                koneksi HTTPS, pencatatan aktivitas, pembatasan akses file,
                pengelolaan secret, pemantauan, serta pencadangan sesuai
                konfigurasi lingkungan.
              </p>
              <p>
                Tidak ada metode transmisi atau penyimpanan elektronik yang
                dapat dijamin sepenuhnya aman. Pengguna wajib menjaga
                kredensial, perangkat, dan akses akunnya serta segera melaporkan
                dugaan penyalahgunaan kepada administrator resmi.
              </p>
            </PolicySection>

            <PolicySection
              id="hak"
              icon={UserCheck}
              title="7. Hak, Pilihan, dan Pencabutan Akses"
            >
              <p>
                Sesuai kewenangan dan ketentuan yang berlaku, pengguna dapat
                meminta akses, koreksi, pembatasan, atau penghapusan data
                melalui administrator resmi WBS PLN EPI. Permintaan dapat
                memerlukan verifikasi identitas dan persetujuan pemilik data
                atau proses.
              </p>
              <p>
                Akses Google dapat dicabut melalui fitur{" "}
                <strong>Putuskan Koneksi</strong> pada konfigurasi Email Ingest
                atau melalui halaman keamanan akun Google. Pencabutan
                menghentikan akses baru melalui token tersebut, tetapi tidak
                otomatis menghapus data yang sebelumnya telah diproses secara
                sah dan masih wajib disimpan berdasarkan retensi.
              </p>
            </PolicySection>

            <PolicySection
              id="perubahan"
              icon={FileText}
              title="8. Perubahan Kebijakan"
            >
              <p>
                Kebijakan ini dapat diperbarui untuk mencerminkan perubahan
                fitur, integrasi, praktik keamanan, tata kelola, atau ketentuan
                hukum. Versi terbaru akan ditampilkan pada halaman ini beserta
                tanggal pembaruannya. Perubahan material dapat disampaikan
                melalui kanal resmi organisasi atau pemberitahuan dalam
                aplikasi.
              </p>
            </PolicySection>

            <PolicySection id="kontak" icon={ShieldCheck} title="9. Kontak">
              <p>
                Untuk pertanyaan, permintaan terkait data, atau pelaporan
                insiden privasi, hubungi administrator resmi WBS PLN EPI atau
                unit pemilik proses yang ditunjuk oleh organisasi Anda. Jangan
                mengirim kata sandi, refresh token, atau credential sensitif
                melalui pesan biasa.
              </p>
            </PolicySection>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-slate-700 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-slate-300 sm:p-6">
              <p className="font-semibold text-[#115d72] dark:text-cyan-300">
                Dokumen terkait
              </p>
              <p className="mt-2">
                Penggunaan aplikasi juga tunduk pada{" "}
                <Link
                  href="/terms-of-service"
                  className="font-semibold text-[#0f7186] underline underline-offset-4 hover:text-[#115d72] dark:text-cyan-300"
                >
                  Ketentuan Layanan WBS PLN EPI
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
              className="font-medium text-[#115d72] dark:text-cyan-300"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-[#115d72] dark:hover:text-cyan-300"
            >
              Ketentuan Layanan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

type PolicySectionProps = {
  id: string;
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
};

function PolicySection({
  id,
  icon: Icon,
  title,
  children,
}: PolicySectionProps) {
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
