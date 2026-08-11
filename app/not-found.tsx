"use client";

import Link from "next/link";
import { ArrowLeft, Home, MapPinOff } from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      />
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute -right-24 bottom-16 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle compact />
      </div>

      <section
        aria-labelledby="not-found-title"
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/90 p-6 text-center shadow-2xl shadow-slate-200/60 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-black/30 sm:p-10 md:p-12"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg shadow-primary/25 sm:h-20 sm:w-20">
          <MapPinOff aria-hidden="true" className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>

        <p className="mb-2 bg-gradient-to-r from-secondary to-primary bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-7xl">
          404
        </p>
        <h1
          id="not-found-title"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
        >
          Halaman Tidak Ditemukan
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
          Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau alamat
          yang dimasukkan tidak tersedia.
        </p>

        <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-primary/40 hover:bg-slate-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-primary/60 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            aria-label="Kembali ke halaman sebelumnya"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Halaman Sebelumnya
          </button>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary to-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
