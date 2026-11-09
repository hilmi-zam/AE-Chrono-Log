# Æ Chrono Log

> **Aplikasi yang berjalan:** v1.0 pribadi untuk keuangan dan catatan. Dashboard produksi: [ae-chrono-log.hilmiizamzamii.workers.dev](https://ae-chrono-log.hilmiizamzamii.workers.dev). **Arah produk berikutnya:** MVP personal life management sesuai baseline SRS v1.22; implementasinya belum dimulai dan belum boleh diasumsikan sudah tersedia.

## Status realignment

Repositori saat ini memuat aplikasi lama: dashboard Vite, API Cloudflare Worker, dan D1. Aplikasi lama tetap dipertahankan dan tidak boleh diganti atau dimigrasikan tanpa persetujuan dan rencana perlindungan data.

SRS hasil wawancara menetapkan MVP baru berisi dashboard harian, kalender/agenda, tugas, mata kuliah, Inbox, Global Search pada modul MVP, notifikasi, offline-sync, login, dan backup. Modul Area Kehidupan penuh ditunda; data MVP tidak wajib memiliki area. Baseline kebutuhan v1.22 telah melengkapi keputusan utama MVP dan backlog, tetapi MVP belum dibangun. Baseline teknisnya adalah PWA/Service Worker, IndexedDB, Worker dan D1 terpisah; tidak ada migrasi data atau perubahan Cloudflare yang dilakukan.

Dokumen wawancara dan SRS berada di folder lokal `Doc/`, yang saat ini diabaikan Git oleh perubahan lokal `.gitignore`. Karena itu, dokumen tersebut tidak ikut dalam checkout repositori saat ini.

## Fitur aplikasi v1.0 yang berjalan

- Mencatat dan melihat pemasukan serta pengeluaran dalam rupiah.
- Mengubah dan menghapus transaksi; penghapusan meminta konfirmasi.
- Memilih bulan untuk melihat transaksi dan ringkasan bulan tersebut.
- Melihat total pemasukan, pengeluaran, selisih, dan rincian kategori.
- Mengekspor tampilan yang sedang difilter atau seluruh data ke CSV.
- Menyimpan, membuka, mengubah, dan menghapus catatan.
- Mencari catatan berdasarkan judul dan isi.
- Memuat catatan berikutnya per 100 baris tanpa mengunduh seluruh daftar sekaligus.
- Melindungi permintaan API dengan HTTP Basic Authentication.

## Teknologi

| Bagian    | Teknologi                           |
| --------- | ----------------------------------- |
| Dashboard | Vite dan JavaScript tanpa framework |
| API       | Cloudflare Workers                  |
| Database  | Cloudflare D1                       |

## Menjalankan Dashboard Lokal

### Prasyarat

- Node.js dan npm.
- Worker Cloudflare yang sudah di-deploy dengan binding D1 bernama `DB` dan secret `APP_PASSWORD`.
- Koneksi internet agar dashboard lokal dapat menghubungi Worker.

### Langkah

Jalankan perintah dari folder utama proyek:

```powershell
npm --prefix .\dashboard install
npm --prefix .\dashboard run dev -- --host 127.0.0.1
```

Buka alamat yang ditampilkan Vite, biasanya [http://127.0.0.1:5173/](http://127.0.0.1:5173/). Masukkan password Worker pada layar login. Terminal harus tetap terbuka selama dashboard digunakan; tekan `Ctrl+C` untuk menghentikan server.

Dashboard menggunakan proxy pengembangan yang diatur di `dashboard/vite.config.js` untuk meneruskan permintaan `/api` ke Worker. Proxy ini hanya untuk pengembangan lokal; pada produksi, dashboard dan API disajikan oleh Worker yang sama.

### Dashboard online

Build dashboard diunggah bersama Worker (`wrangler.toml`, blok `[assets]`) sehingga alamatnya sama dengan API:

- Buka [https://ae-chrono-log.hilmiizamzamii.workers.dev](https://ae-chrono-log.hilmiizamzamii.workers.dev).
- Halaman login bersifat publik; data hanya terbuka setelah password Worker dimasukkan.
- Permintaan `/api/*` selalu dijalankan oleh kode Worker (`run_worker_first`), sedangkan berkas statis dilayani Cloudflare.
- Bila `*.workers.dev` tidak dapat dibuka pada suatu jaringan (DNS penyedia memblokir), gunakan DNS terenkripsi atau entri `hosts`; lihat catatan di `PROJECT_STATUS.md`.

### Memeriksa Build

```powershell
npm --prefix .\dashboard run build
```

Hasil build dibuat di `dashboard/dist/`. Jangan mengunggah data ekspor CSV ke repositori.

## Worker dan Database

Kode Worker berada di `worker.js`. Database D1 yang digunakan bernama `ae-chrono-log-db`, dengan binding `DB`.

Endpoint API berikut memerlukan autentikasi:

| Metode     | Endpoint                            | Fungsi                                    |
| ---------- | ----------------------------------- | ----------------------------------------- |
| `GET`    | `/api/check-db`                   | Memeriksa tabel yang tersedia             |
| `GET`    | `/api/transactions`               | Membaca transaksi terbaru                 |
| `GET`    | `/api/transactions?month=YYYY-MM` | Membaca transaksi untuk bulan tertentu    |
| `POST`   | `/api/transactions`               | Menambahkan transaksi                     |
| `PUT`    | `/api/transactions/:id`           | Mengubah transaksi                        |
| `DELETE` | `/api/transactions/:id`           | Menghapus transaksi                       |
| `GET`    | `/api/notes`                      | Membaca catatan                           |
| `GET`    | `/api/notes?q=kata`               | Mencari catatan berdasarkan judul dan isi |
| `POST`   | `/api/notes`                      | Menambahkan catatan                       |
| `PUT`    | `/api/notes/:id`                  | Mengubah catatan                          |
| `DELETE` | `/api/notes/:id`                  | Menghapus catatan                         |
| `GET`    | `/api/summary?month=YYYY-MM`      | Menghitung ringkasan bulanan dan kategori |

Endpoint daftar transaksi dan catatan mendukung `limit` hingga 100 dan `offset` untuk mengambil halaman berikutnya. Endpoint catatan juga menerima `q` (maksimal 100 karakter) untuk mencari pada judul dan isi; karakter `%`, `_`, dan kutip diperlakukan sebagai teks biasa. Pagination sudah diuji dengan 250 baris tiruan; ekspor di atas 100 baris dengan data nyata belum diuji karena data saat ini masih 11 baris.

## Memperbarui Worker dan Dashboard

Sejak 2026-11-05, deploy memakai `wrangler.toml` dan dilakukan sendiri oleh pemilik akun Cloudflare:

1. Jalankan `node --check .\worker.js` dari folder utama proyek.
2. Bangun dashboard: `npm --prefix .\dashboard run build`.
3. Sekali saja: `npx wrangler login` (membuka browser; token disimpan di profil pengguna, bukan di repositori).
4. Deploy: `npx wrangler deploy`.
5. Pada ringkasan wrangler, pastikan muncul `env.DB (ae-chrono-log-db)` dan `env.ASSETS`.
6. Uji URL produksi: halaman login tampil, `curl.exe -I .../api/transactions` tanpa auth menghasilkan `401`, dan login dengan password benar menampilkan data.

`wrangler.toml` memuat nama Worker, binding `DB`, dan folder `dashboard/dist`. Binding yang tidak ditulis di sana akan hilang saat deploy. Secret `APP_PASSWORD` tidak dihapus oleh deploy; jangan pernah menuliskan nilainya di repositori atau chat.

Bila deploy bermasalah, buka **Workers & Pages → ae-chrono-log → Deployments**, pilih versi sebelumnya, lalu **Rollback**. Jangan mengubah kode lewat editor Cloudflare setelah alur ini dipakai, agar kode di repositori dan yang berjalan tidak berbeda.

## Data dan Privasi

- Nilai transaksi disimpan sebagai bilangan bulat rupiah; perhitungan dilakukan oleh program.
- Password dimasukkan pada dashboard dan disimpan sementara di memori tab, bukan di `localStorage`.
- Jangan menaruh password, token, atau secret di kode, dokumentasi, log, atau commit Git.
- File CSV dapat berisi data pribadi. Simpan di luar folder repositori dan jangan commit ke GitHub.
- Sebelum memakai data pribadi secara rutin, siapkan backup dan tinjau autentikasi, pembatasan percobaan login, serta cara hosting dashboard yang aman.
- Batas dan harga layanan Cloudflare dapat berubah. Periksa [dokumentasi harga Workers dan D1](https://developers.cloudflare.com/workers/platform/pricing/) sebelum mengambil keputusan yang berpengaruh pada biaya.

## Status aplikasi v1.0 dan pekerjaan realignment

- Dashboard dan API disajikan oleh satu Worker; deploy dilakukan dengan `npx wrangler deploy` (2026-11-05).
- Pembatasan percobaan login (5 kali gagal per IP per 15 menit) aktif di produksi dan sudah diuji.
- Fitur terverifikasi: tambah/ubah/hapus transaksi dan catatan, filter bulan, ringkasan kategori, ekspor CSV (tampilan/semua), pencarian catatan, perpindahan bulan otomatis, pencegahan kirim ganda, status koneksi, dan tampilan 380 px.
- `schema.sql` tersedia dan telah dicocokkan dengan D1 produksi.
- Realignment masih pada tahap finalisasi kebutuhan; fitur MVP baru belum diimplementasikan.
- Sebelum staging/deployment MVP: verifikasi biaya dan ketersediaan Cloudflare, dapatkan persetujuan pemilik untuk resource/domain/secrets, serta backup dan uji pemulihan v1.0 pada salinan. Dokumen SRS dan wawancara v1.22 berada di `Doc/` lokal dan masih diabaikan Git.
- Catatan: sebagian penyedia internet memblokir `*.workers.dev` melalui DNS; lihat bagian Dashboard online.

Lihat `PROJECT_STATUS.md` untuk catatan status terperinci. Dokumen tersebut diabaikan oleh konfigurasi Git lokal dan tidak diunggah ke repositori.
