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

- Pembatasan percobaan login (rate limit) pada Worker: **sudah aktif di produksi dan teruji 2026-11-02** (maksimal 5 percobaan gagal per IP dalam 15 menit, lalu `429`). Hitungan per isolasi Worker dan direset saat di-deploy ulang.
- Review backup dan cara hosting dashboard yang aman.
- Gunakan password manager (mis. Bitwarden atau KeePassXC) untuk menyimpan `APP_PASSWORD`, kredensial Cloudflare, kode 2FA, dan recovery code; simpan salinan darurat di tempat fisik. Jangan menaruhnya di repo, chat, atau catatan biasa.
- Jangan simpan password di `localStorage` dalam bentuk yang terbaca orang lain tanpa keterangan risiko.

## Hosting dan keamanan

- Dashboard sudah di-hosting pada Worker yang sama memakai Workers Static Assets (2026-11-05), sehingga API dan halaman berada di satu origin dan CORS terbatas tidak diperlukan.
- Pertimbangkan `preview_urls = false` bila tidak ingin alamat pratinjau tambahan aktif.
- Domain kustom dan bagian Websites Cloudflare masih kosong (perlu konfirmasi pengguna). Ini juga solusi jangka panjang bila `*.workers.dev` diblokir DNS penyedia.
- Siapkan prosedur backup rutin (ekspor CSV berkala) dan simpan di luar repositori.

## Data besar (indeks / pencarian penuh)

- Pencarian catatan memuat semua halaman hasil `q`; pagination Worker sudah teruji dengan 250 baris tiruan (2026-10-28), tetapi data nyata masih 11 baris.
- Bila data catatan tumbuh besar, tambahkan indeks atau FTS di D1 untuk pencarian yang lebih cepat.
- Uji ekspor dengan lebih dari 100 baris pada kumpulan data nyata (tingkat Worker sudah teruji dengan D1 tiruan).

## Skema resmi

- `schema.sql` sudah ada di repositori (sumber: DDL asli D1, 2026-10-23) dan telah dicocokkan dengan D1 produksi pada 2026-11-02: identik, tanpa indeks/trigger tambahan. Jangan mengubah DDL tanpa persetujuan.

## Catatan

- Fitur di atas di luar lingkup v1.0. Prioritaskan sesuai kebutuhan pengguna dan jangan menunda penyelesaian v1.0.
