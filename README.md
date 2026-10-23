# Æ Chrono Log

> **Status: Dalam pengembangan.** Dashboard saat ini dijalankan secara lokal. Worker produksi sudah tersedia, tetapi setiap perubahan kode Worker tetap harus di-deploy oleh pemilik akun Cloudflare. Jangan gunakan data pribadi rutin sebelum backup dan perlindungan akses ditinjau.

## Fitur

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

Dashboard menggunakan proxy pengembangan yang diatur di `dashboard/vite.config.js` untuk meneruskan permintaan `/api` ke Worker. Proxy ini hanya untuk pengembangan lokal dan bukan konfigurasi hosting produksi.

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

Endpoint daftar transaksi dan catatan mendukung `limit` hingga 100 dan `offset` untuk mengambil halaman berikutnya. Endpoint catatan juga menerima `q` (maksimal 100 karakter) untuk mencari pada judul dan isi; karakter `%`, `_`, dan kutip diperlakukan sebagai teks biasa. Pengambilan banyak halaman dan ekspor dengan lebih dari 100 baris belum diverifikasi dengan kumpulan data sebesar itu.

## Memperbarui Worker

Deployment produksi dilakukan sendiri oleh pemilik akun Cloudflare:

1. Jalankan `node --check .\worker.js` dari folder utama proyek.
2. Buka Worker `ae-chrono-log` di dashboard Cloudflare dan buka editor kode.
3. Salin isi `worker.js` lokal ke editor.
4. Pastikan binding `DB` tetap mengarah ke database yang benar dan secret bernama `APP_PASSWORD` tetap tersedia. Jangan menyalin atau membagikan nilai secret.
5. Deploy, lalu uji endpoint yang berubah di URL Worker produksi.

Deploy mengganti kode Worker yang sedang aktif. Jangan melanjutkan jika nama binding atau secret tidak sesuai.

## Data dan Privasi

- Nilai transaksi disimpan sebagai bilangan bulat rupiah; perhitungan dilakukan oleh program.
- Password dimasukkan pada dashboard dan disimpan sementara di memori tab, bukan di `localStorage`.
- Jangan menaruh password, token, atau secret di kode, dokumentasi, log, atau commit Git.
- File CSV dapat berisi data pribadi. Simpan di luar folder repositori dan jangan commit ke GitHub.
- Sebelum memakai data pribadi secara rutin, siapkan backup dan tinjau autentikasi, pembatasan percobaan login, serta cara hosting dashboard yang aman.
- Batas dan harga layanan Cloudflare dapat berubah. Periksa [dokumentasi harga Workers dan D1](https://developers.cloudflare.com/workers/platform/pricing/) sebelum mengambil keputusan yang berpengaruh pada biaya.

## Status dan Pekerjaan Berikutnya

- Filter bulan dan ekspor CSV transaksi/catatan telah dicoba pengguna.
- Pencarian catatan telah di-deploy dan pengguna melaporkan hasilnya berhasil.
- Dropdown kategori sudah dibuat secara lokal; interaksi pilihan belum dikonfirmasi pengguna.
- Perbaikan frontend berikut masih lokal dan belum diuji pengguna: tanggal/bulan mengikuti waktu lokal, tombol "Muat 100 catatan lagi", dua tombol ekspor (tampilan/semua), pencegahan kirim ganda, status koneksi, dan pemisahan pemuatan data per halaman.
- `schema.sql` belum tersedia sebagai skema resmi proyek.
- Dashboard belum di-host sebagai situs publik. Proxy Vite hanya untuk pengembangan lokal.
- Pengujian ekspor dengan lebih dari 100 baris belum dilakukan.

Lihat `PROJECT_STATUS.md` untuk catatan status terperinci. Dokumen tersebut diabaikan oleh konfigurasi Git lokal dan tidak diunggah ke repositori.
