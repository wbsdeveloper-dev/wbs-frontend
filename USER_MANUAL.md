# User Manual WBS PLN EPI

**Sistem Monitoring Gas Pipa, LNG, dan BBM**  
**Versi dokumen:** 1.0  
**Tanggal dokumen:** 22 Oktober 2026

---

## Daftar Isi

1. [Tentang Aplikasi](#1-tentang-aplikasi)
2. [Pengguna dan Hak Akses](#2-pengguna-dan-hak-akses)
3. [Persiapan Penggunaan](#3-persiapan-penggunaan)
4. [Login, Pilih Dashboard, dan Logout](#4-login-pilih-dashboard-dan-logout)
5. [Navigasi Umum](#5-navigasi-umum)
6. [Dashboard Gas Pipa dan LNG](#6-dashboard-gas-pipa-dan-lng)
7. [Manajemen Data Gas](#7-manajemen-data-gas)
8. [Pemasok, Pembangkit, Kontrak, dan Notifikasi Gas](#8-pemasok-pembangkit-kontrak-dan-notifikasi-gas)
9. [Dashboard BBM](#9-dashboard-bbm)
10. [Manajemen Data dan Kertas Kerja BBM](#10-manajemen-data-dan-kertas-kerja-bbm)
11. [TBBM dan Pembangkit](#11-tbbm-dan-pembangkit)
12. [Monitor Rekonsiliasi](#12-monitor-rekonsiliasi)
13. [Konfigurasi Sistem](#13-konfigurasi-sistem)
14. [Manajemen WhatsApp Bot](#14-manajemen-whatsapp-bot)
15. [Alur Kerja Harian yang Disarankan](#15-alur-kerja-harian-yang-disarankan)
16. [Status, Istilah, dan Satuan](#16-status-istilah-dan-satuan)
17. [Penanganan Masalah](#17-penanganan-masalah)
18. [Keamanan dan Praktik Baik](#18-keamanan-dan-praktik-baik)
19. [Ringkasan Menu](#19-ringkasan-menu)

---

## 1. Tentang Aplikasi

WBS PLN EPI merupakan aplikasi web untuk:

- memantau data Gas Pipa, LNG, dan BBM;
- mengelola data operasional pemasok, transportir, TBBM, dan pembangkit;
- melakukan input, validasi, dan rekonsiliasi data;
- mengelola kertas kerja BBM;
- menerima data dari input manual, WhatsApp, email, dan Google Sheets;
- mengatur template ekstraksi dan routing data;
- memantau proses rekonsiliasi secara real-time;
- mengelola pengguna, peran, dan hak akses;
- mengelola WhatsApp Bot utama dan cadangan;
- mencatat aktivitas pengguna melalui log riwayat.

### 1.1 Ruang lingkup dashboard

Aplikasi menyediakan tiga pilihan dari halaman pemilihan dashboard:

| Dashboard | Fungsi                                                             | Cara akses                               |
| --------- | ------------------------------------------------------------------ | ---------------------------------------- |
| Gas Pipa  | Monitoring Gas Pipa dan LNG beserta manajemen data terkait         | Dibuka di aplikasi ini                   |
| BBM       | Monitoring penyaluran, penerimaan, pemakaian, dan kertas kerja BBM | Dibuka di aplikasi ini                   |
| LNG       | Monitoring LNG pada sistem eksternal                               | Dibuka pada tab baru menuju aplikasi LNG |

> **Catatan:** Menu yang terlihat bergantung pada dashboard aktif dan hak akses pengguna.

---

## 2. Pengguna dan Hak Akses

Aplikasi menerapkan hak akses berbasis peran. Setiap modul dapat memiliki izin berbeda:

| Izin       | Fungsi                         |
| ---------- | ------------------------------ |
| **READ**   | Melihat halaman dan data       |
| **CREATE** | Menambah data                  |
| **UPDATE** | Mengubah data atau konfigurasi |
| **DELETE** | Menghapus data                 |

### 2.1 Dampak hak akses

- Menu tanpa izin **READ** tidak ditampilkan pada sidebar.
- Tombol tambah tidak ditampilkan tanpa izin **CREATE**.
- Tombol edit, aktivasi, atau perubahan konfigurasi tidak ditampilkan tanpa izin **UPDATE**.
- Tombol hapus atau revoke tidak ditampilkan tanpa izin **DELETE**.
- Jika URL halaman tanpa izin dibuka langsung, pengguna dialihkan ke halaman **Pilih Dashboard**.

### 2.2 Peran umum

Nama peran dapat dikonfigurasi administrator. Pembagian umum:

- **Viewer:** melihat dashboard, tabel, dan status.
- **Operator:** memasukkan dan memperbarui data operasional.
- **Validator:** memeriksa data, BA, dan hasil rekonsiliasi.
- **Administrator:** mengelola pengguna, sumber data, template, API key, data master, dan bot.

Gunakan akun pribadi. Jangan berbagi akun antarpengguna.

---

## 3. Persiapan Penggunaan

### 3.1 Kebutuhan

- Browser modern: Google Chrome, Microsoft Edge, Safari, atau Firefox versi terbaru.
- Koneksi jaringan menuju server aplikasi.
- Akun aktif yang dibuat administrator.
- Hak akses sesuai tugas.

### 3.2 Rekomendasi layar

- Desktop atau laptop disarankan untuk tabel lebar, konfigurasi, dan validasi.
- Tampilan mobile didukung. Gunakan tombol menu di kiri atas untuk membuka sidebar.
- Gunakan mode layar penuh pada Kertas Kerja BBM bila banyak kolom perlu diperiksa.

### 3.3 Alamat aplikasi

Buka URL aplikasi yang diberikan administrator sistem. URL produksi dapat berbeda untuk setiap lingkungan.

---

## 4. Login, Pilih Dashboard, dan Logout

## 4.1 Login

1. Buka halaman aplikasi.
2. Isi **Email**.
3. Isi **Password**.
4. Tekan ikon mata bila perlu melihat atau menyembunyikan password.
5. Opsional: centang **Ingat saya**.
6. Klik **Sign In**.
7. Tunggu sampai halaman **Pilih Dashboard** terbuka.

Jika login gagal, pesan kesalahan tampil di atas formulir.

> **Keamanan:** Jangan gunakan **Ingat saya** pada komputer bersama. Fitur ini menyimpan kredensial pada penyimpanan browser perangkat tersebut.

### 4.1.1 Lupa password

Tombol **Lupa password?** tersedia pada tampilan login, tetapi alur pemulihan mandiri belum tersedia pada implementasi saat ini. Hubungi administrator untuk reset password.

## 4.2 Memilih dashboard

Setelah login:

1. Pilih **Dashboard Gas Pipa** untuk modul Gas Pipa dan LNG.
2. Pilih **Dashboard BBM** untuk modul BBM.
3. Pilih **Dashboard LNG** untuk membuka aplikasi LNG eksternal pada tab baru.

Pengguna dapat kembali ke halaman ini melalui menu **Pilih Dashboard** di bagian bawah sidebar.

## 4.3 Berpindah dashboard

1. Klik **Pilih Dashboard** pada sidebar.
2. Pilih dashboard tujuan.
3. Sidebar dan menu berubah sesuai dashboard aktif.

## 4.4 Logout

1. Klik **Logout** pada bagian bawah sidebar.
2. Sesi berakhir.
3. Pengguna diarahkan ke halaman login.

Pada halaman **Pilih Dashboard**, tombol **Kembali** juga mengakhiri sesi dan kembali ke login.

---

## 5. Navigasi Umum

## 5.1 Sidebar

Sidebar memuat:

- logo PLN EPI;
- kartu dashboard aktif;
- nama dan email pengguna;
- ikon notifikasi pada dashboard Gas, bila pengguna punya hak akses;
- menu modul;
- tombol tema;
- tombol **Pilih Dashboard**;
- tombol **Logout**.

### Desktop

- Klik tombol panah di header sidebar untuk memperkecil atau memperluas sidebar.
- Pada kondisi ringkas, menu ditampilkan sebagai ikon.

### Mobile

- Klik ikon menu di kiri atas.
- Klik area gelap di luar sidebar atau tombol tutup untuk menutupnya.

## 5.2 Tema tampilan

Klik pengubah tema pada sidebar atau halaman login untuk berpindah antara tema terang dan gelap.

## 5.3 Pola tabel

Sebagian besar tabel menyediakan:

- pencarian;
- filter;
- pengurutan kolom;
- pagination;
- pilihan jumlah baris;
- aksi detail, edit, atau hapus sesuai izin;
- scroll horizontal untuk kolom lebar.

Jika hasil kosong:

1. Periksa filter aktif.
2. Perluas rentang tanggal.
3. Reset filter.
4. Pastikan data sumber telah diproses.

## 5.4 Filter tanggal

- Tanggal awal harus lebih kecil atau sama dengan tanggal akhir.
- Beberapa kartu dashboard memiliki filter tanggal independen.
- Mengubah filter pada satu kartu tidak selalu mengubah kartu lain.
- Data BBM bulanan dikelompokkan berdasarkan bulan laporan.

## 5.5 Notifikasi sistem

Pesan hasil operasi umumnya tampil sebagai:

- hijau: berhasil;
- merah: gagal;
- biru: informasi;
- kuning: peringatan atau perlu tindakan.

Tunggu operasi selesai sebelum menutup modal atau memuat ulang halaman.

---

## 6. Dashboard Gas Pipa dan LNG

Buka **Beranda** pada dashboard Gas Pipa.

Dashboard berisi peta, kartu volume, daftar performa, grafik aliran real-time, dan informasi kontrak terkait.

## 6.1 Peta Gas Pipa dan LNG

Peta menampilkan lokasi operasional untuk komoditas Gas Pipa dan LNG.

Cara pakai:

1. Geser peta untuk melihat wilayah lain.
2. Perbesar atau perkecil peta.
3. Klik penanda lokasi untuk melihat informasi site jika tersedia.
4. Jika penanda tidak muncul, periksa koordinat site pada master lokasi.

## 6.2 Kartu volume Gas Pipa/LNG

Kartu donut menampilkan distribusi volume berdasarkan:

- **Pemasok**; atau
- **Pembangkit**.

Langkah:

1. Pilih tab **Pemasok** atau **Pembangkit**.
2. Pilih komoditas **GAS PIPA** atau **LNG**.
3. Atur tanggal awal dan akhir.
4. Klik grafik untuk membuka detail bila tersedia.
5. Tutup modal detail setelah pemeriksaan.

Setiap kombinasi filter dihitung terpisah. Pesan kosong berarti tidak ada data sesuai komoditas, kategori, dan periode terpilih.

## 6.3 Top 5 volume

Dashboard menampilkan:

- Top 5 Volume Pemasok Gas Pipa;
- Top 5 Volume Pembangkit Gas Pipa;
- Top 5 Volume Pemasok LNG;
- Top 5 Volume Pembangkit LNG.

Setiap kartu mempunyai rentang tanggal sendiri. Nilai Gas/LNG biasanya menggunakan satuan **BBTUD**, sesuai respons data sistem.

## 6.4 Grafik aliran real-time

Grafik digunakan untuk membandingkan aliran berdasarkan pemasok atau pembangkit.

Filter yang tersedia mencakup:

- kategori grafik: pemasok atau pembangkit;
- periode dan interval;
- tanggal awal dan akhir;
- region;
- komoditas;
- pemasok;
- pembangkit.

Pilihan periode umum:

- per jam;
- per hari;
- per bulan;
- per tahun;
- satu bulan;
- tiga bulan;
- enam bulan;
- satu tahun;
- tiga tahun.

Langkah penggunaan:

1. Pilih komoditas dan region.
2. Pilih pemasok atau pembangkit bila perlu.
3. Pilih kategori grafik.
4. Pilih periode atau rentang tanggal.
5. Arahkan kursor pada titik grafik untuk melihat nilai.
6. Periksa informasi kontrak aktif yang tampil untuk relasi pemasok-pembangkit terpilih.

> Mengubah region atau komoditas mengosongkan pilihan pemasok dan pembangkit agar kombinasi filter tetap valid.

---

## 7. Manajemen Data Gas

Menu **Manajemen Data** pada dashboard Gas terdiri dari:

- Data Input;
- Data Transportir;
- File Berita Acara;
- File Email.

## 7.1 Data Input

Halaman ini menampilkan data kegiatan Gas Pipa yang dapat difilter, ditinjau, dan disesuaikan.

### Input satu data

1. Buka **Manajemen Data > Data Input**.
2. Klik **Input Data**.
3. Isi seluruh kolom wajib pada formulir.
4. Periksa tanggal, pemasok, pembangkit, jenis metrik, dan nilai.
5. Simpan data.
6. Pastikan pesan berhasil tampil dan data muncul pada tabel.

### Multi Input Data

1. Klik **Multi Input Data**.
2. Ikuti format berkas yang diminta modal.
3. Pilih atau seret berkas ke area unggah.
4. Jalankan validasi/unggah.
5. Periksa ringkasan baris berhasil dan gagal.
6. Perbaiki berkas jika terdapat kesalahan, lalu unggah ulang.

### Input BA dan validasi

1. Klik **Input BA & Validasi**.
2. Pilih sumber/jenis input sesuai kebutuhan.
3. Unggah Berita Acara atau dokumen pendukung.
4. Isi metadata yang diminta.
5. Jalankan validasi.
6. Periksa hasil pencocokan dan pesan kesalahan.
7. Pantau proses lanjutan pada **Monitor Rekonsiliasi**.

### Mengelola tabel

- Gunakan filter untuk status, pemasok, pembangkit, atau periode.
- Klik aksi pada baris untuk membuka detail/edit jika punya izin.
- Gunakan pagination untuk berpindah halaman.
- Ubah jumlah baris per halaman bila diperlukan.

## 7.2 Data Transportir

Halaman menampilkan ringkasan stock dan rekonsiliasi transportir.

### Memfilter data

1. Buka **Manajemen Data > Data Transportir**.
2. Pilih atau cari shipper.
3. Tentukan tanggal awal dan akhir.
4. Periksa data pada tabel.

### Input data transportir

1. Klik **Input Data Transportir**.
2. Unggah konfigurasi atau data sesuai formulir.
3. Periksa nama file dan isi sebelum menyimpan.
4. Pastikan data muncul pada tabel.

### Input BA dan validasi

Klik **Input BA & Validasi**, lalu ikuti alur pada bagian [Input BA dan validasi](#input-ba-dan-validasi).

## 7.3 File Berita Acara

Menu **File Berita Acara** digunakan untuk melihat dokumen BA yang tersimpan dan terkait dengan data rekonsiliasi.

Gunakan halaman ini untuk:

- mencari file;
- meninjau metadata;
- membuka atau mengunduh file bila aksi tersedia;
- memeriksa keterkaitan file dengan record data.

## 7.4 File Email

Menu **File Email** digunakan untuk melihat file yang diperoleh melalui proses Email Ingest.

Jika file belum tampil:

1. Pastikan koneksi email global aktif.
2. Pastikan rule Email Ingest aktif.
3. Periksa filter subject, sender, label, dan nama attachment.
4. Periksa jadwal polling.
5. Periksa log sinkronisasi dan Monitor Rekonsiliasi.

---

## 8. Pemasok, Pembangkit, Kontrak, dan Notifikasi Gas

## 8.1 Pemasok dan Pembangkit

Menu **Pemasok & Pembangkit** digunakan untuk mengelola site operasional Gas/LNG dan relasinya.

Operasi tersedia sesuai izin:

- melihat daftar site;
- menambah site;
- mengubah site;
- menghapus site;
- mengatur koordinat;
- mengelola hubungan pemasok-pembangkit.

Pastikan nama, tipe site, komoditas, region, dan koordinat benar. Kesalahan master lokasi dapat memengaruhi peta dan filter dashboard.

## 8.2 Kontrak dan Dokumen

Buka **Kontrak & Dokumen** untuk melihat detail kontrak Gas Pipa.

Gunakan tabel untuk:

- mencari kontrak;
- meninjau pemasok dan pembangkit;
- melihat periode dan status kontrak;
- mengelola dokumen sesuai hak akses.

Kontrak berstatus aktif dapat tampil pada grafik Gas saat pemasok atau pembangkit terkait dipilih.

## 8.3 Notifikasi

Ikon lonceng pada kartu pengguna menampilkan jumlah record belum dibaca.

Halaman **Notifikasi** berisi record bermasalah yang membutuhkan perhatian, dengan informasi:

- tanggal laporan;
- pemasok;
- site/pembangkit;
- jenis metrik;
- nilai final;
- status;
- status dibaca.

Langkah pemeriksaan:

1. Klik ikon lonceng.
2. Gunakan filter status, pemasok, site, dan periode.
3. Buka record terkait.
4. Periksa sumber data dan hasil rekonsiliasi.
5. Koreksi melalui **Data Input** bila diperlukan.

---

## 9. Dashboard BBM

Buka **Beranda** pada dashboard BBM.

Dashboard berisi peta, volume BBM, pencapaian nominasi, top penyaluran, grafik analitik, dan tabel data.

## 9.1 Peta BBM

Peta menampilkan lokasi TBBM dan pembangkit.

Jika lokasi tidak muncul, periksa:

- master site BBM;
- nilai latitude dan longitude;
- komoditas site;
- relasi TBBM-pembangkit.

## 9.2 Volume BBM

Kartu donut dapat dikelompokkan berdasarkan:

- **TBBM**; atau
- **Pembangkit**.

Filter:

- tanggal awal;
- tanggal akhir;
- moda transportasi.

Satuan volume: **KL**.

Klik grafik untuk membuka detail distribusi. Data diurutkan dari volume terbesar.

## 9.3 Pencapaian nominasi

Kartu ini membandingkan:

- nominasi;
- realisasi penyaluran;
- pemakaian.

Atur periode untuk melihat persentase pencapaian pada rentang yang diperlukan.

## 9.4 Top 5 penyaluran

Tersedia dua daftar:

- Top 5 Penyaluran ke Pembangkit;
- Top 5 Penyaluran TBBM.

Filter tiap kartu:

- tanggal awal dan akhir;
- produk BBM;
- moda transportasi.

## 9.5 Grafik BBM

Tersedia mode:

1. **Grafik Akumulasi**
   - Bar chart untuk Nominasi, Penyaluran, Penerimaan, Renominasi, dan Pemakaian.
   - Line chart untuk tren BBM nasional.
2. **Grafik Penyaluran**
   - Visualisasi realisasi penyaluran berdasarkan moda transportasi.

### Filter grafik

Panel filter dapat memuat:

- periode;
- interval hari, bulan, atau tahun;
- region;
- instansi/unit;
- unit pelaksana;
- jenis KIT;
- pembangkit;
- pemasok/TBBM;
- produk;
- moda;
- jenis data;
- sumbu X.

Pilihan sumbu X:

- Waktu;
- Pembangkit;
- Pemasok;
- Jenis KIT;
- Instansi/Unit;
- UPK;
- Region;
- Moda Transportasi.

### Menggunakan grafik

1. Pilih mode grafik.
2. Atur periode.
3. Pilih satu atau beberapa filter.
4. Tentukan jenis data yang ingin dibandingkan.
5. Tentukan sumbu X.
6. Arahkan kursor pada batang/titik untuk melihat rincian.
7. Periksa label filter aktif di atas grafik.

### Ekspor grafik

- Klik **PNG** untuk mengunduh gambar grafik.
- Klik **PDF** untuk mengunduh grafik dalam dokumen PDF.

Nama file memuat tanggal ekspor.

## 9.6 Data kosong

Pesan **Belum ada data** berarti tidak ada record yang sesuai filter. Coba:

1. Perluas periode.
2. Kosongkan filter region/unit/site.
3. Pilih produk atau moda lain.
4. Pastikan data BBM sudah diunggah.

---

## 10. Manajemen Data dan Kertas Kerja BBM

## 10.1 Data Input BBM

Buka **Manajemen Data > Data Input**.

### Input manual

1. Klik **Input Data**.
2. Isi periode laporan.
3. Pilih TBBM, pembangkit, produk, dan moda.
4. Isi nilai nominasi, realisasi, penerimaan, renominasi, atau pemakaian sesuai formulir.
5. Periksa satuan dan angka desimal.
6. Simpan.

### Upload Kertas Kerja Rakor BBM

1. Klik **Upload Kertas Kerja Rakor BBM**.
2. Pilih berkas sesuai template yang berlaku.
3. Jalankan unggah.
4. Periksa hasil validasi.
5. Perbaiki baris gagal dan unggah ulang bila diperlukan.

> Gunakan template terbaru. Perubahan nama kolom atau posisi header dapat menyebabkan validasi gagal.

### Mengelola data

Tabel Data Input digunakan untuk:

- melihat record BBM bulanan;
- memfilter record;
- membuka detail;
- mengubah record bila memiliki izin;
- menghapus record bila memiliki izin.

## 10.2 Kertas Kerja BBM

Buka **Manajemen Data > Kertas Kerja**.

### Filter

- Tahun;
- Region;
- Unit Induk;
- Unit Pelaksana.

Daftar region hanya menampilkan region aktif yang memiliki template Kertas Kerja.

### Tab Kertas Kerja

Menampilkan tabel rekapitulasi yang dapat diperbarui sesuai hak akses.

Langkah:

1. Pilih tahun.
2. Pilih region, unit induk, dan unit pelaksana bila perlu.
3. Buka tab **Kertas Kerja**.
4. Periksa nilai setiap periode/kolom.
5. Lakukan perubahan sesuai izin.
6. Pastikan perubahan tersimpan.

### Tab Ringkasan

Buka tab **Ringkasan** untuk melihat agregasi dari filter aktif.

### Mode layar penuh

Klik **Full Screen** untuk memperluas area tabel. Klik **Keluar Full Screen** atau tekan `Esc` untuk kembali.

### Upload dari halaman Kertas Kerja

1. Klik **Upload Kertas Kerja Rakor BBM**.
2. Pilih master/template yang sesuai.
3. Unggah file.
4. Tunggu validasi selesai.
5. Setelah berhasil, tabel dimuat ulang.

Tombol upload dinonaktifkan jika master template masih dimuat atau gagal dimuat.

---

## 11. TBBM dan Pembangkit

Buka menu **TBBM & Pembangkit** pada dashboard BBM.

Tersedia dua tab:

1. **Daftar TBBM & Pembangkit**;
2. **Relasi TBBM - Pembangkit**.

## 11.1 Daftar TBBM dan Pembangkit

### Menambah site

1. Buka tab **Daftar TBBM & Pembangkit**.
2. Klik **Tambah**.
3. Isi nama, tipe, region, komoditas, dan data lokasi.
4. Simpan.

### Mengubah site

1. Cari site pada tabel.
2. Klik aksi edit.
3. Perbarui data.
4. Simpan.

### Update multi data

1. Klik **Download Template**.
2. Isi template tanpa mengubah header.
3. Klik **Update Multi Data**.
4. Unggah file.
5. Periksa hasil pemrosesan.

### Update koordinat

1. Klik **Update Koordinat**.
2. Gunakan file dengan identitas site dan koordinat yang valid.
3. Unggah file.
4. Periksa peta BBM setelah proses berhasil.

Format koordinat harus numerik dan sesuai rentang latitude/longitude.

## 11.2 Relasi TBBM-Pembangkit

Relasi menentukan jalur operasional TBBM menuju pembangkit.

### Menambah relasi

1. Buka tab **Relasi TBBM - Pembangkit**.
2. Klik **Tambah Relasi**.
3. Pilih TBBM dan pembangkit.
4. Isi informasi lain yang diminta.
5. Simpan.

### Update multi relasi

1. Klik **Download Template Relasi**.
2. Isi pasangan TBBM dan pembangkit.
3. Klik **Update Multi Relasi**.
4. Unggah file.
5. Periksa hasil validasi.

Hindari relasi duplikat. Pastikan kedua site sudah ada sebelum membuat relasi.

---

## 12. Monitor Rekonsiliasi

Buka **Konfigurasi Sistem > Monitor Rekonsiliasi** pada dashboard Gas.

Halaman memantau proses dari:

- WhatsApp;
- Email PLN;
- Spreadsheet;
- Input Manual;
- Validasi BA;
- sumber sistem lain.

## 12.1 Kartu status

| Status                      | Arti                                                | Tindakan                                   |
| --------------------------- | --------------------------------------------------- | ------------------------------------------ |
| Sedang Diproses / RUNNING   | Worker sedang memproses job                         | Tunggu dan gunakan auto-refresh            |
| Dalam Antrian / PENDING     | Job menunggu giliran                                | Tunggu; periksa worker bila menumpuk       |
| Menunggu Retry / RETRY_WAIT | Proses gagal sementara dan menunggu percobaan ulang | Periksa pesan error dan konfigurasi sumber |
| Selesai / DONE              | Proses berhasil                                     | Periksa data hasil bila diperlukan         |
| Gagal / FAILED              | Proses berhenti karena kesalahan                    | Buka detail dan tindak lanjuti error       |

## 12.2 Auto-refresh dan refresh manual

- **Live Auto-Refresh** memuat ulang data setiap 3 detik.
- Nonaktifkan jika sedang membaca detail agar tabel tidak sering berubah.
- Klik **Refresh** untuk memuat ulang manual.

## 12.3 Filter

Tersedia filter:

- sumber data;
- status;
- nama pembangkit;
- nama pemasok;
- tanggal awal dan akhir.

Pagination menyediakan 10, 20, 50, atau 100 baris per halaman.

## 12.4 Membuka detail job

1. Cari job pada tabel.
2. Klik **Detail**.
3. Periksa:
   - ID job;
   - tipe job;
   - dedup key;
   - status;
   - jumlah percobaan;
   - waktu retry berikutnya;
   - alasan kegagalan;
   - payload metadata JSON.
4. Catat pesan error untuk perbaikan sumber atau template.
5. Klik **Tutup**.

## 12.5 Menghapus job

Tindakan ini membutuhkan izin **DELETE**.

### Hapus satu job

1. Klik ikon hapus pada baris atau **Hapus Activity Ini** pada detail.
2. Periksa ID, pembangkit, status, dan error.
3. Klik **Ya, Hapus Job**.

### Hapus banyak job

1. Centang beberapa baris.
2. Klik **Hapus (n)**.
3. Periksa jumlah job.
4. Konfirmasi penghapusan.

> **Peringatan:** Penghapusan job bersifat permanen pada database monitor/antrean. Hapus hanya job yang sudah dianalisis dan tidak diperlukan untuk audit operasional.

---

## 13. Konfigurasi Sistem

Menu konfigurasi yang terlihat bergantung pada dashboard dan hak akses.

## 13.1 Pengguna dan peran

Buka **Konfigurasi Sistem > Pengguna**.

### Tab Pengguna

Fungsi:

- mencari pengguna;
- memfilter status;
- menambah pengguna;
- mengubah pengguna;
- reset password;
- mengatur status dan peran.

#### Menambah pengguna

1. Buka tab **Pengguna**.
2. Klik **Tambah Pengguna**.
3. Isi identitas, email, password awal, status, dan peran.
4. Simpan.
5. Informasikan kredensial awal melalui saluran aman.

#### Mengubah pengguna

1. Cari pengguna.
2. Klik edit.
3. Ubah data/peran/status.
4. Simpan.

#### Reset password

1. Klik aksi reset password pada pengguna.
2. Isi password baru sesuai kebijakan.
3. Konfirmasi.
4. Minta pengguna mengganti password jika prosedur organisasi mewajibkan.

### Tab Peran

Fungsi:

- menambah peran;
- mengubah peran;
- mengatur privilege modul;
- melihat daftar pengguna/peran.

Berikan hak minimum sesuai tugas. Hindari memberi **DELETE** atau konfigurasi sistem kepada pengguna yang tidak memerlukannya.

## 13.2 Email Ingest

Buka **Konfigurasi Sistem > Email Ingest**.

Halaman mengelola satu koneksi email global dan beberapa rule ingestion.

### Menghubungkan Google

1. Klik **Hubungkan dengan Google**.
2. Login pada popup Google.
3. Pilih akun email sumber.
4. Setujui izin yang diperlukan.
5. Tunggu status berubah menjadi **Terhubung**.

Jika popup tidak muncul, izinkan popup untuk domain aplikasi.

### Memutus koneksi

1. Klik **Putuskan Koneksi**.
2. Ketik `CONFIRM` pada dialog.
3. Lanjutkan pencabutan akses.

> **Peringatan:** Pemutusan koneksi menghentikan akses polling untuk seluruh rule Email Ingest sampai akun dihubungkan kembali.

### Menambah rule ingestion

1. Klik **Tambah Rule Ingestion**.
2. Isi **Nama**.
3. Atur jadwal cron melalui pemilih jadwal.
4. Opsional: isi **Subject Filter** dengan kata kunci dipisahkan koma.
5. Opsional: isi **Sender Filter**.
6. Isi **Label Filter**, misalnya `INBOX`.
7. Opsional: isi **Filter Nama Attachment** dengan kata kunci dipisahkan koma.
8. Klik **Simpan**.

Hanya attachment dengan nama yang sesuai filter akan diproses bila filter attachment diisi.

### Mengelola rule

- Klik baris untuk membuka detail.
- Ubah filter atau jadwal lalu simpan.
- Jalankan **Test Parse** untuk menguji proses.
- Pilih beberapa rule untuk mengaktifkan atau menonaktifkan secara massal.
- Gunakan pencarian dan filter status.
- Klik **Export Email List CSV** untuk ekspor daftar.
- Klik **Lihat Logs** untuk melihat aktivitas polling.

## 13.3 Template Data/Template Grup

Buka **Konfigurasi Sistem > Template Data**.

Template menentukan cara data dari WhatsApp, spreadsheet, atau email dipetakan menjadi field sistem.

### Scope template

- **WhatsApp Grup**;
- **Spreadsheet**;
- **Email Ingest**.

### Status template

- **DRAFT:** masih disusun;
- **ACTIVE:** digunakan sistem;
- **DEPRECATED:** diarsipkan.

### Membuat template

1. Klik **Buat Template**.
2. Isi nama template.
3. Pilih scope.
4. Untuk WhatsApp Gas Pipa, pilih jenis data **Teks** atau **Gambar**.
5. Pilih pemisah desimal koma atau titik.
6. Pilih komoditas.
7. Klik **Buat**.
8. Pilih template pada panel kiri.
9. Lengkapi sumber, field mapping, transformasi, dan field wajib.
10. Simpan perubahan.
11. Uji template.
12. Aktifkan setelah hasil benar.

Untuk input gambar Gas Pipa, sistem menggunakan OCR dan mode AI Assisted.

### Mengelola template

- Cari berdasarkan nama.
- Filter status dan scope.
- Pilih template untuk membuka editor.
- Duplikasikan template sebagai dasar versi baru.
- Arsipkan template yang tidak digunakan.
- Hapus hanya jika tidak lagi dibutuhkan dan memiliki izin.

### Test Routing WhatsApp

1. Klik **Test Routing**.
2. Pilih WhatsApp Group ID.
3. Pilih jenis data Gas Pipa: teks atau gambar/OCR.
4. Masukkan contoh isi pesan/caption.
5. Klik **Jalankan Tes**.
6. Periksa template yang dipilih, komoditas, parser, keyword, dan alasan routing.

Prioritas routing yang ditampilkan sistem:

1. template yang terhubung ke group dan keyword cocok;
2. catch-all template pada group;
3. template global dengan keyword cocok;
4. template default global.

Jika akses ditolak, sinkronkan group dan pastikan group aktif.

## 13.4 Spreadsheet Source

Buka **Konfigurasi Sistem > Spreadsheet**.

Sumber dikelompokkan berdasarkan Spreadsheet ID. Satu spreadsheet dapat memiliki beberapa sheet.

### Menambah source

1. Klik **Tambah Source**.
2. Isi nama.
3. Tempel URL Google Sheets dengan format `https://docs.google.com/spreadsheets/d/.../edit`.
4. Isi **Sheet Name** persis seperti tab pada Google Sheets.
5. Isi **Data Start Row**.
6. Opsional: isi **Data End Row**; kosongkan untuk membaca sampai baris terakhir.
7. Atur jadwal.
8. Klik **Buat**.

### Menambah sheet pada spreadsheet yang sama

1. Cari kartu Spreadsheet ID.
2. Klik **Tambah Sheet**.
3. URL spreadsheet akan dikunci.
4. Isi nama source, sheet, rentang baris, dan jadwal.
5. Simpan.

### Mengelola source

- Klik toggle untuk mengaktifkan/menonaktifkan.
- Klik edit untuk mengubah konfigurasi.
- Klik hapus lalu konfirmasi.
- Klik ikon tautan luar untuk membuka Google Sheets.
- Pastikan akun layanan/sistem memiliki akses baca ke spreadsheet.

## 13.5 API Keys

Buka **Konfigurasi Sistem > API Keys**.

API key dipakai worker, bot, dan service internal untuk mengakses Platform API.

### Membuat API key

1. Klik **Buat API Key**.
2. Isi nama service menggunakan huruf kecil, angka, dan tanda hubung. Contoh: `wa-bot-primary`.
3. Klik **Generate Key**.
4. Klik ikon salin pada secret.
5. Simpan secret ke secret manager atau konfigurasi aman service.
6. Klik **Saya Sudah Menyimpannya**.

> **Peringatan keamanan:** Secret hanya ditampilkan sekali. Jangan menaruh secret pada dokumen, chat, screenshot, atau repository. Jika secret hilang, buat key baru lalu revoke key lama.

### Revoke API key

1. Klik ikon hapus pada key.
2. Periksa service yang terdampak.
3. Klik **Ya, Revoke**.

> Revoke langsung memutus akses service dan tidak dapat dibatalkan.

## 13.6 Data Master Gas

Buka **Konfigurasi Sistem > Data Master** pada dashboard Gas.

Tab:

- Region Gas Pipa;
- Region LNG.

Gunakan fitur tambah, edit, aktif/nonaktif, dan hapus sesuai hak akses. Nama region memengaruhi filter dashboard, site, dan grafik.

## 13.7 Data Master BBM

Buka **Konfigurasi Sistem > Data Master** pada dashboard BBM.

Tab:

- Jenis Kit;
- Unit Pelaksana;
- Moda;
- Product;
- Region;
- Unit;
- Pola Operasi;
- Mapping CTMS;
- Template Kertas Kerja.

### Praktik pengelolaan

1. Cari record sebelum menambah untuk mencegah duplikasi.
2. Gunakan nama konsisten dengan sumber data.
3. Periksa dampak ke filter, site, grafik, dan template.
4. Nonaktifkan record jika masih dibutuhkan oleh data historis.
5. Hapus hanya jika tidak direferensikan data lain.

### Mapping CTMS

Gunakan tab ini untuk menghubungkan identitas/nama dari CTMS dengan master internal. Mapping yang salah dapat menyebabkan data tidak dikenali atau masuk ke entitas yang salah.

### Template Kertas Kerja

Gunakan tab ini untuk mengatur struktur template Kertas Kerja per region. Hanya region dengan template aktif yang tersedia pada filter Kertas Kerja.

## 13.8 Log Riwayat

Buka **Konfigurasi Sistem > Log Riwayat**.

Log memuat:

- waktu;
- pengguna;
- aksi;
- modul;
- deskripsi;
- IP address;
- status berhasil/gagal.

### Filter log

- email/pengguna;
- jenis aksi;
- modul/resource;
- status;
- tanggal awal;
- tanggal akhir.

Klik **Reset Filter** untuk mengosongkan semua filter. Klik **Ekspor CSV** untuk mengekspor data pada halaman/hasil yang sedang dimuat.

Log disimpan selama **1 tahun**. Data lebih lama dihapus otomatis oleh sistem.

---

## 14. Manajemen WhatsApp Bot

Buka **Manajemen Bot** pada dashboard Gas.

Halaman mengelola:

- Bot Utama;
- Bot Cadangan;
- koneksi QR;
- group WhatsApp;
- kata kunci;
- pengumpulan data;
- aktivitas bot;
- pengaturan humanize;
- outbox/pesan keluar.

## 14.1 Status bot

| Status     | Arti                                          |
| ---------- | --------------------------------------------- |
| Online     | Bot terhubung ke WhatsApp                     |
| Connecting | Bot sedang membuat koneksi                    |
| Standby    | Bot tidak aktif karena bot lain sedang online |
| Offline    | Bot tidak terhubung                           |

Bot Utama diprioritaskan saat keduanya tersedia. Konfigurasi group dan keyword menggunakan bot yang aktif.

## 14.2 Menghubungkan bot

1. Pada bot Offline/Connecting, klik **Show QR**.
2. Buka WhatsApp pada ponsel.
3. Masuk ke **Linked Devices / Perangkat Tertaut**.
4. Pilih **Link a Device / Tautkan Perangkat**.
5. Pindai QR pada aplikasi.
6. Tunggu status berubah menjadi **Online**.
7. Klik **Hide QR** jika QR masih tampil.

Klik **Refresh** pada kartu QR jika kode kedaluwarsa atau belum muncul.

## 14.3 Logout bot

1. Pastikan tidak ada proses penting.
2. Klik **Logout** pada bot Online.
3. Baca peringatan.
4. Konfirmasi.

Logout menghentikan proses aktif. Pemindaian QR diperlukan untuk menghubungkan kembali.

## 14.4 Berpindah bot

1. Klik **Pindah Bot** pada bot Standby.
2. Baca peringatan.
3. Konfirmasi.
4. Bot aktif lama akan logout.
5. Pindai QR untuk bot tujuan.

Gunakan perpindahan saat bot aktif bermasalah atau perlu pemeliharaan.

## 14.5 Konfigurasi group

Fitur hanya tersedia saat bot terhubung.

1. Klik **Sinkronisasi Data** untuk mengambil daftar group terbaru.
2. Centang group yang boleh diproses.
3. Gunakan **Pilih Semua** bila semua group diperlukan.
4. Gunakan **Batalkan Semua** untuk menonaktifkan seluruh pilihan.
5. Periksa jumlah group aktif.

Setelah sinkronisasi, group dapat dipakai pada konfigurasi Template dan Test Routing.

## 14.6 Kata kunci

Kata kunci menyaring pesan yang akan diproses.

### Menambah kata kunci

1. Isi kolom **Tambahkan kata kunci baru**.
2. Klik **Tambah** atau tekan `Enter`.
3. Pastikan kata kunci muncul pada daftar.

### Menghapus kata kunci

Klik ikon `X` pada kata kunci. Periksa dampaknya pada pesan yang sebelumnya bergantung pada kata tersebut.

## 14.7 Pengumpulan data

Gunakan switch **Pengumpulan Data** untuk mengaktifkan atau menonaktifkan pengumpulan chat dan metadata untuk reporting.

- **Enabled:** pesan dari group terpilih dapat dikumpulkan dan diproses.
- **Disabled:** pengumpulan data dihentikan.

## 14.8 Aktivitas bot

Kartu **Aktifitas Bot** menampilkan:

- jumlah antrean pesan keluar;
- jumlah pesan gagal terkirim;
- waktu pesan terakhir.

Antrean yang terus meningkat menandakan masalah koneksi, rate limit, atau service pengiriman.

## 14.9 Humanize Settings

Fitur mengatur perilaku jeda agar interaksi bot lebih natural.

Pengaturan:

- aktif/nonaktif Humanize;
- delay pemrosesan minimum dan maksimum;
- delay pembacaan minimum dan maksimum;
- show presence;
- offline chance.

Gunakan nilai wajar. Delay terlalu besar memperlambat pemrosesan. Offline chance terlalu tinggi dapat mengurangi keandalan pengiriman.

## 14.10 Outbox Logger

Outbox Logger tampil saat bot terhubung. Gunakan untuk meninjau pesan keluar dan status pengiriman.

Jika pesan gagal:

1. Periksa status bot.
2. Periksa jumlah gagal terkirim.
3. Periksa nomor/group tujuan.
4. Periksa antrean.
5. Periksa API key dan koneksi service.
6. Coba kembali setelah koneksi pulih.

---

## 15. Alur Kerja Harian yang Disarankan

## 15.1 Operator Gas

1. Login dan pilih **Dashboard Gas Pipa**.
2. Periksa peta dan grafik volume periode terbaru.
3. Periksa ikon notifikasi.
4. Buka **Monitor Rekonsiliasi** dan cek status Failed/Retry.
5. Buka **Data Input** untuk memeriksa hasil ingestion.
6. Masukkan atau koreksi data bila perlu.
7. Periksa data transportir dan BA.
8. Pastikan grafik menampilkan data terbaru.
9. Logout setelah selesai.

## 15.2 Operator BBM

1. Login dan pilih **Dashboard BBM**.
2. Periksa volume, pencapaian nominasi, dan top penyaluran.
3. Periksa grafik dengan periode berjalan.
4. Buka **Data Input** untuk memeriksa data bulanan.
5. Unggah Kertas Kerja jika ada pembaruan.
6. Periksa tab Kertas Kerja dan Ringkasan.
7. Pastikan TBBM, pembangkit, dan relasi sudah benar.
8. Ekspor grafik bila dibutuhkan untuk laporan.
9. Logout setelah selesai.

## 15.3 Administrator Integrasi

1. Periksa WhatsApp Bot Online.
2. Periksa antrean dan pesan gagal.
3. Periksa koneksi Email Global.
4. Periksa rule Email Ingest aktif.
5. Periksa Spreadsheet Source aktif dan jadwalnya.
6. Periksa Template aktif dan routing.
7. Periksa Monitor Rekonsiliasi.
8. Periksa log aktivitas untuk perubahan konfigurasi.

## 15.4 Penanganan job gagal

1. Buka **Monitor Rekonsiliasi**.
2. Filter status **FAILED**.
3. Buka **Detail**.
4. Catat sumber, payload, dan pesan error.
5. Tentukan kategori masalah:
   - file/format input;
   - master data tidak ditemukan;
   - template salah;
   - koneksi sumber;
   - kredensial/API key;
   - worker/service.
6. Perbaiki sumber masalah.
7. Kirim atau unggah ulang data sesuai prosedur.
8. Pastikan job baru berstatus **DONE**.
9. Hapus job lama hanya jika kebijakan operasional mengizinkan.

---

## 16. Status, Istilah, dan Satuan

## 16.1 Istilah

| Istilah              | Arti                                                       |
| -------------------- | ---------------------------------------------------------- |
| BA                   | Berita Acara                                               |
| BBM                  | Bahan Bakar Minyak                                         |
| LNG                  | Liquefied Natural Gas                                      |
| TBBM                 | Terminal Bahan Bakar Minyak                                |
| KIT                  | Jenis/kelompok unit pembangkit                             |
| UPK                  | Unit Pelaksana                                             |
| CTMS                 | Sistem sumber yang dipetakan ke master internal            |
| Ingestion            | Proses mengambil dan memasukkan data dari sumber eksternal |
| Rekonsiliasi         | Proses mencocokkan dan menentukan hasil data               |
| Nominasi             | Rencana volume                                             |
| Renominasi           | Perubahan terhadap rencana volume                          |
| Penyaluran/Realisasi | Volume aktual yang disalurkan                              |
| Penerimaan           | Volume aktual diterima                                     |
| Pemakaian            | Volume yang digunakan                                      |
| Template             | Aturan pemetaan dan ekstraksi data                         |
| Routing              | Pemilihan template untuk sumber/pesan tertentu             |
| OCR                  | Ekstraksi teks dari gambar                                 |
| Dedup key            | Identitas untuk mencegah pemrosesan duplikat               |

## 16.2 Satuan

| Komoditas    | Satuan umum                               |
| ------------ | ----------------------------------------- |
| Gas Pipa/LNG | BBTUD atau satuan yang dikirim sumber/API |
| BBM          | KL                                        |

Selalu periksa label satuan pada kartu, grafik, atau tabel sebelum membandingkan nilai.

---

## 17. Penanganan Masalah

## 17.1 Tidak dapat login

Periksa:

- email dan password;
- tombol Caps Lock;
- koneksi jaringan;
- status akun;
- URL aplikasi.

Jika tetap gagal, minta administrator memeriksa akun atau mereset password.

## 17.2 Menu tidak terlihat

Penyebab umum:

- dashboard aktif tidak sesuai;
- pengguna tidak memiliki izin READ;
- peran baru belum diterapkan pada sesi.

Tindakan:

1. Klik **Pilih Dashboard**.
2. Pilih dashboard yang benar.
3. Logout lalu login kembali setelah perubahan peran.
4. Hubungi administrator jika menu tetap tidak tersedia.

## 17.3 Data dashboard kosong

1. Reset filter.
2. Perluas periode.
3. Pilih region/komoditas yang benar.
4. Periksa Data Input.
5. Periksa status ingestion dan rekonsiliasi.
6. Periksa master site dan relasi.

## 17.4 Upload gagal

Periksa:

- format file;
- ukuran file;
- nama sheet;
- header dan urutan kolom;
- tipe data angka/tanggal;
- master data yang dirujuk;
- template aktif;
- pesan validasi.

Jangan mengubah struktur template unduhan.

## 17.5 Peta tidak menampilkan lokasi

Periksa data site:

- latitude;
- longitude;
- komoditas;
- tipe site;
- status aktif;
- region.

## 17.6 Email tidak diproses

1. Pastikan koneksi Email Global terhubung.
2. Pastikan rule aktif.
3. Periksa jadwal.
4. Periksa sender, subject, label, dan attachment filter.
5. Pastikan email/attachment memenuhi filter.
6. Periksa log Email Ingest.
7. Periksa Monitor Rekonsiliasi.

## 17.7 Spreadsheet tidak diproses

1. Periksa URL dan Spreadsheet ID.
2. Periksa nama sheet, termasuk kapital dan spasi.
3. Periksa baris awal/akhir.
4. Pastikan source aktif.
5. Pastikan sistem mempunyai akses baca.
6. Periksa jadwal dan template terkait.
7. Periksa Monitor Rekonsiliasi.

## 17.8 WhatsApp Bot offline

1. Periksa jaringan server bot.
2. Klik **Show QR**.
3. Refresh QR bila perlu.
4. Pindai melalui Linked Devices.
5. Jika Bot Utama bermasalah, gunakan Bot Cadangan sesuai prosedur.
6. Setelah Online, sinkronkan group.

## 17.9 Pesan WhatsApp tidak diproses

1. Pastikan bot Online.
2. Pastikan Pengumpulan Data Enabled.
3. Pastikan group aktif.
4. Pastikan keyword sesuai.
5. Pastikan template aktif dan terhubung.
6. Jalankan Test Routing.
7. Periksa Monitor Rekonsiliasi.

## 17.10 Ekspor PNG/PDF gagal

- Tunggu grafik selesai dimuat.
- Pastikan data grafik tersedia.
- Izinkan download pada browser.
- Coba ulang dengan browser terbaru.
- Kurangi zoom browser jika area grafik terlalu lebar.

## 17.11 Halaman terus memuat

1. Tunggu beberapa saat.
2. Muat ulang halaman.
3. Periksa koneksi jaringan.
4. Login ulang jika sesi berakhir.
5. Laporkan URL halaman dan waktu kejadian kepada administrator.

Saat melaporkan masalah, sertakan:

- waktu kejadian;
- akun/peran;
- halaman;
- filter aktif;
- langkah sebelum error;
- pesan error;
- ID job jika terkait rekonsiliasi.

Jangan menyertakan password atau secret API key.

---

## 18. Keamanan dan Praktik Baik

1. Gunakan akun pribadi.
2. Gunakan password kuat dan unik.
3. Jangan centang **Ingat saya** pada perangkat bersama.
4. Logout setelah selesai.
5. Jangan membagikan API key, token OAuth, password, atau QR WhatsApp.
6. Simpan API key di secret manager atau environment service.
7. Periksa file sebelum upload untuk mencegah data salah.
8. Gunakan hak akses minimum.
9. Jangan menghapus job, template, master, atau key tanpa memeriksa dampak.
10. Tinjau Log Riwayat secara berkala.
11. Pastikan dokumen operasional hanya diakses pihak berwenang.
12. Jangan memasukkan data sensitif yang tidak diperlukan ke kolom komentar atau nama konfigurasi.

---

## 19. Ringkasan Menu

### 19.1 Dashboard Gas Pipa

| Menu                 | Submenu/Fungsi                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Beranda              | Peta, volume, top pemasok/pembangkit, grafik Gas/LNG                                                         |
| Manajemen Data       | Data Input, Data Transportir, File Berita Acara, File Email                                                  |
| Pemasok & Pembangkit | Site dan relasi operasional Gas/LNG                                                                          |
| Kontrak & Dokumen    | Kontrak dan dokumen Gas Pipa                                                                                 |
| Konfigurasi Sistem   | Pengguna, Email Ingest, Template Data, Spreadsheet, API Keys, Data Master, Monitor Rekonsiliasi, Log Riwayat |
| Manajemen Bot        | WhatsApp Bot utama/cadangan dan konfigurasinya                                                               |

### 19.2 Dashboard BBM

| Menu               | Submenu/Fungsi                                                |
| ------------------ | ------------------------------------------------------------- |
| Beranda            | Peta, volume, pencapaian nominasi, top penyaluran, grafik BBM |
| Manajemen Data     | Data Input dan Kertas Kerja                                   |
| TBBM & Pembangkit  | Site dan relasi TBBM-pembangkit                               |
| Konfigurasi Sistem | Pengguna, Template Data, Spreadsheet, Data Master             |

### 19.3 Matriks tindakan penting

| Tindakan              | Lokasi                                          |
| --------------------- | ----------------------------------------------- |
| Input data Gas        | Gas > Manajemen Data > Data Input               |
| Input data BBM        | BBM > Manajemen Data > Data Input               |
| Upload Kertas Kerja   | BBM > Manajemen Data > Kertas Kerja             |
| Cek job gagal         | Gas > Konfigurasi Sistem > Monitor Rekonsiliasi |
| Kelola region Gas/LNG | Gas > Konfigurasi Sistem > Data Master          |
| Kelola master BBM     | BBM > Konfigurasi Sistem > Data Master          |
| Hubungkan email       | Gas > Konfigurasi Sistem > Email Ingest         |
| Atur Google Sheets    | Konfigurasi Sistem > Spreadsheet                |
| Atur parsing          | Konfigurasi Sistem > Template Data              |
| Hubungkan WhatsApp    | Gas > Manajemen Bot                             |
| Kelola akun           | Konfigurasi Sistem > Pengguna                   |
| Audit aktivitas       | Gas > Konfigurasi Sistem > Log Riwayat          |

---

## Penutup

Gunakan dashboard untuk pemantauan, halaman manajemen untuk koreksi/input, Monitor Rekonsiliasi untuk diagnosis proses, dan Konfigurasi Sistem untuk pengaturan integrasi. Selalu verifikasi data sumber, periode, master, relasi, dan template sebelum menyimpulkan adanya masalah pada dashboard.
