# BACKLOG — Æ Chrono Log

Daftar ide dan tugas di luar versi aktif v1.0. Dokumen ini bukan aturan kerja; aturan utama ada di `PROJECT_RULES.md`, dan kondisi saat ini ada di `PROJECT_STATUS.md`.

## v1.1 (AI dan pengingat)

- Ringkasan AI untuk transaksi dan catatan bulan ini (misal: "Pengeluaran terbesar bulan ini adalah Makanan").
- Pengingat / notifikasi catatan pada tanggal tertentu.
- Saran kategori otomatis berdasarkan kata kunci catatan.

## v1.2 (tugas dan pengingat)

- Manajemen tugas sederhana terpisah dari catatan.
- Tandai catatan sebagai selesai / diarsipkan.
- Filter catatan berdasarkan tanggal pembuatan.

## Proteksi akses (penting sebelum data pribadi disimpan rutin)

- Pembatasan percobaan login (rate limit) pada Worker, atau minimal catatan risiko dan keputusan pengguna untuk menerimanya.
- Review backup dan cara hosting dashboard yang aman.
- Jangan simpan password di `localStorage` dalam bentuk yang terbaca orang lain tanpa keterangan risiko.

## Hosting dan keamanan

- Hosting dashboard sebagai situs publik (saat ini hanya lokal melalui Vite).
- CORS hanya mengizinkan origin dashboard.
- Review autentikasi dan konfigurasi frontend production; proxy Vite hanya untuk pengembangan lokal.
- Domain kustom dan bagian Websites Cloudflare masih kosong (perlu konfirmasi pengguna).

## Data besar (indeks / pencarian penuh)

- Saat ini pencarian catatan memuat semua halaman hasil `q` dan memerlukan `limit`/`offset` manual.
- Bila data catatan tumbuh besar, tambahkan indeks atau FTS di D1 untuk pencarian yang lebih cepat.
- Uji ekspor dengan lebih dari 100 baris pada kumpulan data nyata.

## Skema resmi

- `schema.sql` belum tersedia. Harus dibuat dari DDL asli D1 (`SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name IN ('transactions', 'notes');`). Jangan mengarang.

## Catatan

- Fitur di atas di luar lingkup v1.0. Prioritaskan sesuai kebutuhan pengguna dan jangan menunda penyelesaian v1.0.
