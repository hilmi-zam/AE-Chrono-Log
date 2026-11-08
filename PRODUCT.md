# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Satu pemilik sistem, yang juga satu-satunya pengguna. Tidak ada multi-user, kolaborasi, berbagi data, atau registrasi publik (SRS §2, `[DECIDED]`). Status studi pemilik sengaja tidak dicatat sebagai identitas produk: modul mata kuliah ada karena kebutuhan nyata, bukan karena produk ditujukan khusus untuk mahasiswa.

Pengguna memakai satu akun di beberapa perangkat miliknya sendiri — laptop dan ponsel — dan sering membuka aplikasi pada pagi hari untuk tahu apa yang harus dikerjakan hari itu.

Pekerjaan inti: menjawab pertanyaan "Hari ini aku harus melakukan apa, dan apa yang tidak boleh aku lupakan?" tanpa mencatat informasi yang sama berulang kali.

## Product Purpose

Æ Chrono Log adalah personal life management system / second brain untuk satu orang. Produk menghubungkan aktivitas, jadwal, tugas, catatan, pembelajaran, proyek, dan informasi pribadi di satu tempat.

Dua keadaan produk hidup berdampingan dan keduanya bagian dari kebenaran produk ini:

- **v1.0 berjalan di produksi** — dashboard keuangan dan catatan (Cloudflare Worker + D1), dipakai dengan data pribadi nyata.
- **MVP target** — PWA terpisah untuk dashboard harian, kalender/agenda, tugas, mata kuliah, Inbox/Quick Capture, notifikasi, offline-sync, login, backup, dan Global Search terbatas modul MVP (SRS v1.22). Prototipe lokalnya ada di `mvp/`.

Kesuksesan berarti: pengguna membuka aplikasi di pagi hari dan langsung melihat informasi penting hari itu; data inti tetap bisa dilihat dan dikelola tanpa internet; dan hal penting tidak terlewat.

## Positioning

Sistem hidup pribadi untuk satu orang yang disusun dari kebutuhan nyata pemiliknya, bukan produk tim atau basis pengguna. Mekanismenya: satu dashboard harian tetap yang menjawab satu pertanyaan pagi, model data yang menghubungkan objek alih-alih menyalinnya, dan PWA yang tetap berguna offline di laptop berspesifikasi terbatas — hal yang tidak dapat ditiru secara jujur oleh alat kolaborasi serbaguna atau aplikasi tugas generik karena keduanya harus melayani banyak pengguna dan banyak cara kerja.

## Operating Context

- Ritme pagi: dashboard dibuka sebelum aktivitas, dengan urutan tetap jadwal hari ini → tugas aktif/terlambat → agenda mendatang (FR-DSH-07). Pengguna tidak dapat menyusun ulang widget pada MVP.
- Perangkat: laptop Windows berspesifikasi terbatas dan ponsel; Chrome dan Edge versi terbaru; PWA dapat dipasang. Safari/iOS bukan target.
- Koneksi tidak selalu tersedia; sebagian penyedia internet bahkan memblokir `*.workers.dev` lewat DNS, sehingga laptop memakai entri `hosts`. Aplikasi harus tetap berguna offline.
- Konteks hidup yang nyata: jadwal kuliah berulang per periode, rapat organisasi, janji, kegiatan pribadi, deadline tugas, dan acara.
- Inbox dipakai untuk menangkap ide cepat, termasuk ide fitur baru; ide ditinjau setiap akhir minggu dan tidak otomatis masuk scope.
- v1.0 dipakai untuk mencatat pemasukan/pengeluaran dalam rupiah dan catatan, dengan ekspor CSV dan backup berkala ke luar repositori.
- Deploy dan resource Cloudflare hanya dilakukan pemilik akun; `wrangler.toml`, D1, secret, dan domain tidak diubah tanpa persetujuan eksplisit.
- Dokumen sumber proyek (SRS, hasil wawancara, status, aturan, backlog) berada di `doc/` dan menjadi rujukan kerja; perubahan scope dicatat, bukan diasumsikan.

## Capabilities and Constraints

**v1.0 yang berjalan (harus dipertahankan):** catat/lihat/ubah/hapus transaksi rupiah; filter bulan; ringkasan pemasukan, pengeluaran, selisih, dan kategori; ekspor CSV tampilan/semua; catatan dengan pencarian judul dan isi, pagination 100 baris; HTTP Basic Authentication dengan rate limit login; dashboard dan API disajikan satu Worker.

**MVP yang sudah ada di prototipe lokal:** dashboard, kalender hari/minggu/bulan, agenda satu kali dan berulang, kategori/warna, lokasi fisik dan tautan online, beberapa pengingat, tugas dengan filter/edit, mata kuliah per periode dengan arsip/pulihkan, relasi tugas–mata kuliah, Inbox dengan jejak konversi, pencarian global, pratinjau notifikasi, pengaturan, app shell offline (IndexedDB + Service Worker), serta ekspor/pemulihan backup JSON dengan checksum, validasi, batas 25 MB, restore atomik, dan snapshot pra-restore.

**Belum tersedia dan tidak boleh diklaim ada:** pengiriman push/notifikasi terjadwal dan riwayat notifikasi, backup otomatis terjadwal, enkripsi backup, autentikasi, sinkronisasi cloud/multi-perangkat, backend MVP, staging, dan deployment MVP.

**Batasan yang mengikat:**

1. Aplikasi v1.0 dan data D1 produksinya tidak boleh diubah, dimigrasikan, atau diganggu tanpa persetujuan eksplisit dan rencana perlindungan data.
2. UI MVP dibekukan setelah alur inti; perubahan UI hanya untuk aksesibilitas, responsif, konsistensi, atau bug/usability blocker (SRS OQ-20).
3. Fungsi inti didahulukan sebelum desain UI; ide baru dicatat sebagai backlog atau Inbox, bukan ditambahkan ke MVP.
4. Relasi antar-data, bukan salinan data; satu objek dapat terhubung ke banyak objek lain.
5. Integrasi AI, multi-user, habit tracking, prioritas tugas, lampiran Quick Capture, dan dukungan Safari/iOS berada di luar scope tahap ini.
6. Performa: dashboard siap digunakan < 2 detik (P95, Chrome dan Edge, online dan offline) pada perangkat acuan Windows 11 (4-core ≥2 GHz, RAM 8 GB, SSD, 1366×768) dengan dataset 10.000 rekaman; kapasitas yang dijamin sedikitnya 10.000 rekaman aktif.
7. Zona waktu mengikuti perangkat otomatis; tidak ada zona waktu manual per agenda.
8. Notifikasi browser tidak dijamin terkirim saat offline/dibatasi browser; notifikasi dalam aplikasi adalah pelengkap.

**Belum diputuskan:** domain kustom untuk v1.0 dan MVP; perangkat/dataset uji performa sudah dibaselinekan tetapi belum diuji pada data nyata; kebijakan konflik sinkronisasi.

**Stack yang berjalan:** dashboard v1.0 memakai Vite + JavaScript tanpa framework; API Cloudflare Workers; database Cloudflare D1. Prototipe MVP memakai Vite + JavaScript tanpa framework, IndexedDB, Service Worker, dan tes lokal; tanpa dependensi baru kecuali disetujui.

## Brand Commitments

- Nama produk: **Æ Chrono Log**, ditulis dengan ligatur Æ; repositori GitHub `hilmi-zam/AE-Chrono-Log`.
- Antarmuka berbahasa Indonesia, termasuk istilah domain (agenda, tugas, mata kuliah, Inbox, pengingat).
- v1.0 mempertahankan nama, URL Worker, dan perilakunya; realignment tidak mengganti merek atau layanan yang sudah berjalan.
- Arah visual MVP yang sudah dipilih adalah sistem warm editorial yang responsif; token rincinya dulu berada di `design/system/DESIGN.md`, tetapi folder `design/` tidak ada di worktree saat init. Perlu diverifikasi sebelum pekerjaan visual berikutnya.
- Suara produk: tenang, langsung, jujur soal batasan; tidak mengklaim fitur yang belum ada.

## Evidence on Hand

- Aplikasi v1.0 nyata di produksi: `https://ae-chrono-log.hilmiizamzamii.workers.dev/`, satu Worker dengan binding D1 `DB`, tabel `transactions` dan `notes`, `schema.sql` dicocokkan dengan D1 pada 2026-11-02.
- Data produksi nyata pernah berisi 11 baris ekspor; keberadaan data uji saat ini belum diperiksa ulang dan tidak boleh diasumsikan atau dihapus tanpa persetujuan.
- Backup pengguna terakhir 2026-11-05 di `E:\zami\ChronoLog-Backup` (CSV dan SQL), di luar repositori.
- Prototipe MVP lokal dengan 13 tes unit lulus dan build berhasil (2026-11-08); uji browser mencakup alur tugas, konversi Inbox, edit agenda, navigasi pratinjau/settings, dan lebar 320 px tanpa overflow horizontal.
- Aset yang ada: `dashboard/public/favicon.svg` dan `mvp/public/favicon.svg`; tidak ada logo lengkap, foto, testimoni, studi kasus, atau materi pemasaran.
- Ekspor desain Stitch yang dirujuk README/PROJECT_STATUS (`design/desktop/`, `design/mobile/`, `design/system/DESIGN.md`) tidak ada di worktree saat init; jangan mengarang isinya.
- Tidak ada pelanggan, benchmark publik, harga, atau bukti sosial. Jangan membuatnya.

## Product Principles

1. **Jawab pertanyaan pagi lebih dulu, termasuk saat offline.** Setiap permukaan dinilai dari seberapa cepat pengguna tahu apa yang harus dilakukan hari ini dan apa yang tidak boleh terlupa; data inti harus terbaca di laptop terbatas tanpa menunggu jaringan.
2. **Fungsi sebelum rupa; setelah itu rupa dijaga.** Alur inti diselesaikan lebih dulu, lalu UI MVP membeku kecuali untuk aksesibilitas, responsif, konsistensi, dan blocker kegunaan.
3. **Hubungkan, jangan duplikasi.** Satu kebenaran data dengan relasi; menyalin data adalah bug produk.
4. **Satu pengguna, privat secara default.** Tidak ada fitur sosial, berbagi, atau pendaftaran; data pribadi tidak keluar dari kendali pemilik.
5. **Jangan sentuh yang sedang berjalan.** v1.0 dan data produksinya hanya berubah dengan persetujuan eksplisit dan rencana pemulihan.

## Accessibility & Inclusion

Tidak ada standar aksesibilitas formal (misalnya level WCAG) yang ditetapkan. Yang faktual: aksesibilitas adalah alasan sah untuk mengubah UI MVP yang sudah dibekukan, dan aplikasi harus tetap terpakai pada layar 320 px tanpa overflow horizontal serta pada perangkat berspesifikasi terbatas.
