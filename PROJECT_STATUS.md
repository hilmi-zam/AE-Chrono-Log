# Status Proyek Æ Chrono Log

Terakhir diperbarui: 2026-10-20

Dokumen ini mencatat keadaan proyek yang telah diketahui dan diuji. Baca bersama `PROJECT_GUIDE.md` sebelum melanjutkan pekerjaan. Bedakan hal yang sudah terverifikasi dari perubahan lokal yang belum dikonfirmasi ter-deploy.

## Tujuan

Aplikasi pribadi yang dibuka melalui browser laptop untuk mencatat keuangan dan catatan kuliah/rapat. Prioritas sekarang adalah fondasi, API transaksi, dan ringkasan dasar. Belum ada frontend dashboard dan belum ada fitur AI.

## Komponen yang terverifikasi

- Akun Cloudflare telah dibuat.
- Worker aktif: `ae-chrono-log`.
- URL Worker: `https://ae-chrono-log.hilmiizamzamii.workers.dev/`.
- Worker memakai Cloudflare D1 melalui binding `DB`.
- Database D1 bernama `ae-chrono-log-db` (nama dilaporkan pengguna).
- Database memiliki tabel `transactions` dan `notes`; pengguna memeriksa daftar tabel melalui `sqlite_master`.
- Secret Worker `APP_PASSWORD` telah dibuat. Kode Worker memeriksa HTTP Basic Authentication menggunakan secret itu.
- Autentikasi telah diuji: kata sandi yang benar diterima dan kata sandi berbeda ditolak.
- Endpoint `/api/check-db` telah merespons `{"ok":true,"tables":["notes","transactions"]}`.
- Endpoint `GET /api/transactions` telah diuji dan awalnya mengembalikan `[]`.
- Endpoint `POST /api/transactions` telah diuji berhasil: status `201`, respons `{ "ok": true, "id": 1 }`.
- `GET /api/transactions` setelah itu berhasil mengembalikan transaksi contoh yang dibuat.
- Endpoint ringkasan bulanan `/api/summary?month=2026-10` telah diuji sebelum perubahan rincian kategori. Hasil terverifikasi: pemasukan `0`, pengeluaran `15000`, saldo `-15000`.
- Transaksi contoh masih tersimpan di database: pengeluaran 15000, kategori `Tes`, tanggal `2026-10-20`, catatan `Transaksi percobaan`, ID `1`. Jangan hapus tanpa persetujuan pengguna.

## Status file lokal dan deployment

- File Worker lokal bernama `woker.js` (ejaan persis di folder proyek). Di editor Cloudflare, file entry Worker bernama `worker.js`.
- Folder lokal juga berisi `PROJECT_GUIDE.md` dan folder `.git`. Belum ada frontend, `package.json`, konfigurasi Wrangler, atau tes otomatis yang teridentifikasi.
- `woker.js` lokal saat ini berisi autentikasi, GET/POST transaksi, ringkasan total bulanan, rincian per kategori pada properti `by_category`, dan endpoint pemeriksaan database.
- Sintaks `woker.js` lokal terakhir diperiksa dengan `node --check .\woker.js`, exit code 0.
- Perubahan `/api/summary` untuk menambahkan `by_category` dibuat setelah respons ringkasan total diuji. Belum ada konfirmasi pengguna bahwa perubahan terbaru ini sudah disalin ke Cloudflare, di-deploy, atau diuji.
- Endpoint transaksi dan perhitungan total ringkasan telah diuji pada deployment Cloudflare sebelum perubahan rincian kategori terakhir.

## Struktur database yang diketahui

Tabel `transactions` dibuat dengan kolom:

- `id`: integer primary key autoincrement
- `type`: `income` atau `expense`
- `amount`: integer positif (satuan rupiah)
- `category`: teks wajib
- `transaction_date`: tanggal teks `YYYY-MM-DD`
- `note`: teks opsional
- `created_at`: waktu pembuatan dengan default `CURRENT_TIMESTAMP`

Tabel `notes` dibuat dengan kolom:

- `id`: integer primary key autoincrement
- `title`: teks wajib
- `content`: teks wajib
- `note_date`: tanggal teks wajib
- `created_at`: waktu pembuatan dengan default `CURRENT_TIMESTAMP`

Belum ada endpoint catatan yang dibuat atau diuji.

## Endpoint pada kode Worker lokal

Semua endpoint berada setelah pemeriksaan `APP_PASSWORD`, sehingga memerlukan autentikasi:

- `GET /api/check-db`: membaca nama tabel yang diharapkan.
- `GET /api/transactions`: membaca maksimal 100 transaksi terbaru.
- `POST /api/transactions`: memvalidasi dan menyimpan transaksi JSON.
- `GET /api/summary?month=YYYY-MM`: menghitung pemasukan, pengeluaran, saldo, dan pada kode lokal terbaru jumlah per kategori.
- URL lain merespons `Hello World!`.

Untuk `POST /api/transactions`, body harus JSON dengan `type` (`income` atau `expense`), `amount` integer positif, `category`, `transaction_date` dalam format tanggal valid `YYYY-MM-DD`, dan `note` opsional. Jangan masukkan data keuangan asli selama pengujian.

## Langkah berikutnya yang disarankan

1. Minta pengguna menyalin versi terbaru `woker.js` lokal ke `worker.js` di Cloudflare dan melakukan Deploy.
2. Uji `GET /api/summary?month=2026-10` dan pastikan respons memiliki `by_category` berisi kategori `Tes` dengan total `15000`.
3. Setelah perubahan itu terverifikasi, lanjutkan dengan satu langkah kecil untuk fondasi frontend atau endpoint catatan. Jangan membangun ulang Worker atau database.

## Catatan keamanan dan biaya

- Jangan meminta atau menuliskan nilai `APP_PASSWORD`, token, atau kredensial di chat maupun repo.
- Worker memakai HTTP Basic Authentication. Pastikan pengguna mengaksesnya lewat HTTPS; jangan menganggap ini setara dengan autentikasi aplikasi lengkap. Sebelum menyimpan data pribadi secara rutin, tinjau proteksi akses, pembatasan percobaan login, dan rencana backup.
- Belum ada domain kustom yang tercatat; pengguna melaporkan bagian Websites Cloudflare kosong.
- Jangan menyarankan paket berbayar, mengaktifkan billing, mengubah akses, menghapus data, atau melakukan deployment atas nama pengguna tanpa menjelaskan dampak dan memperoleh persetujuan.
- Saat audit sebelumnya, dokumentasi resmi Cloudflare menyebut kuota D1 Workers Free 5 juta baris dibaca/hari, 100 ribu baris ditulis/hari, dan total penyimpanan 5 GB. Bila keputusan biaya bergantung pada kuota, periksa kembali dokumentasi harga resmi terkini.
