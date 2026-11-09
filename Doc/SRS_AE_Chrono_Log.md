# SRS — Æ Chrono Log

> Software Requirements Specification (baseline v1.22; keputusan disusun atas arahan pengguna untuk menuntaskan kebutuhan, 7 November 2026).
> Repositori: https://github.com/hilmi-zam/AE-Chrono-Log

---

## 0. Cara Membaca Dokumen Ini (untuk manusia dan AI)

**Status SRS:** Baseline kebutuhan lengkap untuk MVP dan backlog. Sebelum implementasi, tinjau baseline ini; perubahan selanjutnya dicatat sebagai perubahan scope, bukan asumsi.

**Legenda status requirement**

| Tag | Arti |
|---|---|
| `[DECIDED]` | Sudah disetujui pengguna. Boleh dijadikan dasar implementasi. |
| `[SUPERSEDED]` | Keputusan lama yang sudah diganti keputusan baru. Diabaikan. |

**Legenda prioritas**

| Tag | Arti |
|---|---|
| `MVP` | Masuk tahap awal (Pertanyaan 55). |
| `BACKLOG` | Di luar MVP, dikerjakan setelahnya. |
| `OUT` | Tidak akan dikerjakan pada tahap ini. |

**Konvensi ID**

- `FR-<MODUL>-<nomor>`: Functional Requirement
- `NFR-<nomor>`: Non-Functional Requirement
- `BR-<nomor>`: Business Rule
- `UC-<nomor>`: Use Case
- `AC-<nomor>`: Acceptance Criteria
- `OQ-<nomor>`: Open Question
- `Q<nomor>`: Nomor pertanyaan pada dokumen wawancara asli

**Aturan untuk AI yang memakai dokumen ini**

1. Jangan menambah fitur yang tidak tercantum. Ide baru dicatat sebagai backlog, bukan MVP.
2. Jangan menambah kebutuhan di luar baseline. Jika ada kebutuhan baru, ajukan perubahan scope sebelum implementasi.
3. Prioritaskan fungsi inti sebelum desain UI. Pengguna mudah terdistraksi oleh ide baru dan perubahan UI.
4. Hindari duplikasi data. Satu objek dapat terhubung ke banyak objek lain melalui relasi, bukan salinan.
5. Integrasi AI ditunda ke tahap berikutnya.

---

## 1. Pendahuluan

### 1.1 Tujuan dokumen

Menetapkan kebutuhan fungsional dan non-fungsional Æ Chrono Log sebagai patokan pengembangan agar scope tidak terus melebar.

### 1.2 Ringkasan produk

Æ Chrono Log adalah **personal life management system / second brain** untuk satu pengguna. Aplikasi menghubungkan aktivitas, jadwal, tugas, catatan, pembelajaran, proyek, dan informasi pribadi di satu tempat.

**Pertanyaan utama yang harus dijawab dashboard:**
> "Hari ini aku harus melakukan apa, dan apa yang tidak boleh aku lupakan?"

Aplikasi **bukan** sekadar task manager atau aplikasi catatan.

### 1.3 Latar belakang dan masalah

Pengguna sebelumnya memakai Notion untuk tugas, keuangan, catatan, dan informasi hidup. Masalah yang dirasakan:

- Notion berat/lambat di laptop dengan spesifikasi terbatas.
- Notion membutuhkan internet untuk pengalaman optimal.
- Telegram bot pernah dipertimbangkan tetapi integrasi/akun/layanannya merepotkan.
- Pengembangan sering kehilangan arah karena ide baru dan terlalu banyak mengutak-atik UI sebelum fungsi inti selesai.

**Motivasi utama:** saat membuka aplikasi di pagi hari, pengguna langsung melihat informasi penting hari itu: agenda, kegiatan belajar, tugas, dan hal yang tidak boleh terlupakan.

### 1.4 Tujuan sistem

1. Menjadi pusat informasi harian di satu dashboard.
2. Dapat dipakai offline untuk data inti dan sinkron antar perangkat saat online.
3. Tidak membuat pengguna mencatat informasi yang sama berulang kali.
4. Fleksibel untuk berbagai area kehidupan, tidak terbatas pada kehidupan mahasiswa.

---

## 2. Pengguna dan Batas Penggunaan

| Item | Keputusan | Status |
|---|---|---|
| Pengguna | Satu pemilik sistem (pengguna sendiri) | `[DECIDED]` |
| Multi-user / kolaborasi / berbagi data | Tidak dibutuhkan tahap awal | `[DECIDED]` `OUT` |
| Registrasi publik | Tidak ada | `[DECIDED]` `OUT` |
| Sifat data | Pribadi | `[DECIDED]` |
| Perangkat | Satu akun dipakai di beberapa perangkat milik pengguna (laptop dan ponsel) | `[DECIDED]` |

---

## 3. Ruang Lingkup

### 3.1 Masuk MVP (Q55 — `[DECIDED]`)

1. Dashboard
2. Kalender dan agenda
3. Tugas
4. Mata kuliah
5. Inbox / Quick Capture
6. Notifikasi
7. Offline dan sinkronisasi
8. Login (autentikasi)
9. Backup
10. Global Search (terbatas pada modul MVP yang tersedia)

### 3.2 Backlog (di luar MVP, Q55 — `[DECIDED]`)

1. Area Kehidupan (keputusan realignment 2026-11-06; data MVP tidak diwajibkan memiliki area)
2. Catatan / Knowledge Library
3. Keuangan pribadi
4. Manajemen proyek
5. Tugas berulang dan subtask (Q35)

### 3.3 Keputusan realignment (2026-11-06)

- Global Search masuk MVP, terbatas pada tugas, agenda, mata kuliah, dan Inbox yang tersedia.
- Modul Area Kehidupan penuh ditunda setelah MVP. Objek MVP tidak wajib terhubung ke area; dukungan relasi, arsip, dan pengelolaan area menyusul.
- Konversi Inbox membuat entitas baru yang tertaut ke sumber; sumber ditandai "Dikonversi" dan tidak lagi tampil di Inbox aktif.
- MVP baru berjalan berdampingan dengan v1.0 pada Worker dan database D1 terpisah; data v1.0 tidak dimigrasikan atau diubah.
- Detail MVP mata kuliah, kebijakan sinkronisasi, dan kondisi uji performa ditetapkan pada keputusan OQ-12, OQ-13, dan OQ-18.
- Keputusan teknis dan backlog yang tersisa dilengkapi pada baseline v1.22 (2026-11-07); daftar rinci ada di Bagian 12–14.

### 3.4 Di luar cakupan (`OUT`)

- Habit tracking (ditunda, bisa dipertimbangkan kembali)
- Integrasi AI (tahap berikutnya, bukan fokus MVP)
- Multi-user, kolaborasi, registrasi publik
- Prioritas tugas
- Jam tenang notifikasi (tidak dipilih)
- Input Quick Capture berupa gambar, file, audio
- Zona waktu manual per agenda
- Dukungan Safari / iOS
- Block editor kompleks, nested pages kompleks, visual database ala Notion, drag-and-drop block lanjutan
- Fitur keuangan lanjutan: investasi, utang-piutang kompleks, anggaran lanjutan, analisis finansial mendalam

---

## 4. Platform, Asumsi, dan Batasan

### 4.1 Platform (Q54 — `[DECIDED]`)

- Aplikasi berbentuk **PWA** yang dapat dipasang di laptop dan ponsel.
- Browser yang didukung: **Chrome dan Edge versi terbaru**.
- Safari/iOS tidak termasuk target. Jika kelak memakai iPhone, perilaku push notification dan penyimpanan lokal perlu dievaluasi ulang.

### 4.2 Arsitektur dan koeksistensi data (`[DECIDED]` sebagai baseline)

- MVP dibangun sebagai aplikasi PWA terpisah dengan Service Worker, IndexedDB, API Worker, dan database D1 khusus.
- Aplikasi v1.0 tetap berjalan pada Worker, konfigurasi, dan D1 saat ini. MVP tidak memakai binding atau tabel D1 v1.0 dan tidak mengimpor data transaksi/catatan.
- Perubahan, migrasi skema, backup/restore, atau deployment MVP tidak boleh mengubah atau mengganggu v1.0.
- Sebelum membuat resource Cloudflare atau deploy: pemilik meninjau biaya dan menyetujui resource, domain, serta secrets secara langsung. Dokumen ini tidak mengizinkan perubahan produksi.
- Implementasi lokal diikuti staging terpisah. Sebelum cutover, backup v1.0 harus tersedia dan prosedur restore diuji pada salinan; rilis MVP dapat dibatalkan dengan mengembalikan rute ke v1.0. Migrasi skema MVP memakai migrasi bernomor dan backup database khusus MVP.
- Tidak ada migrasi data v1.0 ke MVP dalam ruang lingkup awal. Jika kelak diperlukan, harus ada persetujuan eksplisit, pemetaan data, backup terverifikasi, dan rencana rollback tersendiri.

### 4.3 Asumsi

- A-01: Pengguna tunggal, sehingga tidak ada manajemen peran.
- A-02: Notifikasi browser membutuhkan izin pengguna dan bergantung pada browser, OS, konfigurasi perangkat, dan koneksi.
- A-03: Waktu perlu disimpan secara konsisten agar sinkronisasi antar perangkat tidak menggeser jam agenda.

---

## 5. Model Data Konseptual

Prinsip utama: **relasi antar-data, bukan salinan data.** Satu objek dapat terhubung ke lebih dari satu objek lain.

| Entitas | Prioritas | Atribut yang sudah diputuskan | Relasi |
|---|---|---|---|
| Area | BACKLOG | nama; dapat diubah, diarsipkan, dihapus | Banyak-ke-banyak dengan objek lain; objek MVP tidak wajib memiliki area |
| Agenda (Event) | MVP | judul; jenis (timed / all-day); jam mulai-selesai (timed); aturan pengulangan; kategori/warna; lokasi fisik (opsional); tautan online (opsional); beberapa pengingat | Tugas, proyek, mata kuliah, area, catatan |
| Pengecualian kejadian agenda | MVP | ubah isi, batalkan, atau pindah satu kejadian | Agenda berulang |
| Tugas | MVP | deskripsi; deadline; status (Belum dikerjakan / Sedang dikerjakan / Revisi / Selesai) | Banyak mata kuliah dan agenda; Area/Proyek setelah modul tersedia |
| Mata kuliah (penawaran per periode) | MVP | nama wajib; kode, pengajar, tahun akademik, label semester/periode, rentang tanggal dan warna opsional; status aktif/arsip | Agenda berulang, tugas, pertemuan |
| Pertemuan mata kuliah | MVP | kejadian agenda yang mewarisi jadwal berulang; perubahan satu pertemuan tidak menghapus jadwal normal; topik/ringkasan teks dan tautan materi opsional | Mata kuliah dan kejadian agenda |
| Item Inbox | MVP | teks atau URL | Dapat dikonversi/dihubungkan (lihat FR-INB) |
| Notifikasi | MVP | jenis (tugas, agenda, jadwal kuliah, proyek); riwayat di pusat notifikasi | Tugas, agenda, mata kuliah, proyek |
| Backup | MVP | format JSON; terenkripsi opsional | Seluruh data |
| Kategori agenda | MVP | kategori/warna yang dapat disesuaikan | Agenda |
| Catatan | BACKLOG | judul; isi; kategori/topik; tag; relasi; lampiran | Mata kuliah, proyek, area |
| Akun/Dompet | BACKLOG | nama; saldo awal | Transaksi |
| Transaksi | BACKLOG | jenis (pemasukan/pengeluaran/transfer); kategori bawaan | Akun/Dompet |
| Proyek | BACKLOG | deskripsi/tujuan; status; tanggal mulai; target selesai | Tugas, agenda, catatan, area |
| Milestone | BACKLOG | judul; tanggal target; status (belum/selesai) | Proyek |

---

## 6. Functional Requirements

### 6.1 Dashboard (FR-DSH) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-DSH-01 | Dashboard menampilkan jadwal hari ini. | `[DECIDED]` |
| FR-DSH-02 | Dashboard menampilkan agenda dan kelas hari ini. | `[DECIDED]` |
| FR-DSH-03 | Dashboard menampilkan target/tugas. | `[DECIDED]` |
| FR-DSH-04 | Dashboard menampilkan kegiatan/acara yang akan datang. | `[DECIDED]` |
| FR-DSH-05 | Dashboard menampilkan pengingat agar hal penting tidak terlupakan. | `[DECIDED]` |
| FR-DSH-06 | Dashboard harus tampil kurang dari 2 detik setelah aplikasi dibuka, termasuk saat offline (lihat NFR-01). | `[DECIDED]` |
| FR-DSH-07 | MVP memakai tata letak dashboard tetap: jadwal hari ini, tugas aktif/terlambat, lalu agenda mendatang. Pengguna tidak dapat menyusun ulang widget pada MVP. | `[DECIDED]` |

Catatan desain: tentukan fungsi dan informasi dulu sebelum membahas detail visual.

### 6.2 Autentikasi dan Keamanan (FR-AUTH) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-AUTH-01 | Autentikasi menggunakan email dan password (Q40). | `[DECIDED]` |
| FR-AUTH-02 | Akun pertama dibuat sekali lewat langkah setup awal oleh pemilik sistem. Setelah akun pertama ada, pendaftaran terkunci (Q44). | `[DECIDED]` |
| FR-AUTH-03 | Sesi login tersimpan di perangkat sehingga aplikasi dapat dibuka saat offline (Q40). | `[DECIDED]` |
| FR-AUTH-04 | Sesi memiliki masa berlaku maksimum 30 hari; refresh token dirotasi saat digunakan dan sesi dicabut saat logout atau perubahan kredensial. Data lokal boleh dibaca offline selama sesi lokal belum kedaluwarsa. | `[DECIDED]` |
| FR-AUTH-05 | PIN lokal bersifat opsional untuk mengunci aplikasi di perangkat (Q40). | `[DECIDED]` |
| FR-AUTH-06 | Jika PIN lokal aktif, aplikasi terkunci setelah 5 menit tidak aktif. Lima PIN salah berturut-turut memicu jeda 1 menit sebelum percobaan berikutnya. | `[DECIDED]` |
| FR-AUTH-07 | Pemulihan akun memakai kode pemulihan sekali pakai yang disimpan sendiri oleh pengguna saat setup, tidak bergantung layanan email (Q45). | `[DECIDED]` |
| FR-AUTH-08 | Kode pemulihan sekali pakai dapat digunakan untuk memulai reset password; setelah berhasil, kode lama langsung tidak berlaku dan pengguna wajib membuat kode baru yang hanya ditampilkan sekali. Pengguna yang masih dapat login dapat merotasi kode setelah autentikasi ulang. Kode yang hilang tidak dapat dipulihkan; jika password dan kode sama-sama hilang, tidak ada bypass atau pemulihan dukungan. | `[DECIDED]` |
| FR-AUTH-09 | Semua koneksi memakai HTTPS; password dan kode pemulihan disimpan hanya sebagai verifier dengan Argon2id melalui implementasi teruji dan parameter yang dapat diperbarui; cookie sesi memakai Secure, HttpOnly, SameSite dan perlindungan CSRF. Akses API dibatasi, login/pemulihan diberi rate limit, dan rahasia tidak disimpan di klien. Data cloud memakai enkripsi at-rest yang dikelola penyedia; data lokal dilindungi profil OS/browser. Pengguna harus logout dan menghapus data lokal di perangkat bersama. | `[DECIDED]` |

### 6.3 Area Kehidupan (FR-AREA) — `BACKLOG`

| ID | Requirement | Status |
|---|---|---|
| FR-AREA-01 | Pengguna dapat membuat area sendiri; tidak dibatasi daftar kategori bawaan. Contoh awal: Pendidikan, Pekerjaan, Organisasi, Personal. | `[DECIDED]` |
| FR-AREA-02 | Area dapat diubah, diarsipkan, atau dihapus. | `[DECIDED]` |
| FR-AREA-03 | Saat area dihapus, data terhubung tetap ada dan menjadi "tanpa area" (Q37). | `[DECIDED]` |
| FR-AREA-04 | Data baru boleh dibuat tanpa area. Data tanpa area tampil di daftar khusus "Tanpa Area" (Q59). | `[DECIDED]` |
| FR-AREA-05 | Area yang diarsipkan disembunyikan sepenuhnya, termasuk dari pencarian (Q60). | `[DECIDED]` |
| FR-AREA-06 | Satu objek dapat terhubung ke lebih dari satu area tanpa salinan data. Contoh: proyek Joglo66 terkait Pendidikan dan Organisasi. | `[DECIDED]` |
| FR-AREA-07 | Arsip menyembunyikan area dari daftar dan pencarian area; tugas/agenda yang terhubung tetap tampil di modul masing-masing. Memulihkan arsip mengembalikan area dan relasinya. | `[DECIDED]` |
| FR-AREA-08 | Area memiliki satu warna opsional dari palet bawaan; tidak ada kategori bertingkat atau pengelolaan palet kustom pada tahap awal. | `[DECIDED]` |

### 6.4 Kalender dan Agenda (FR-CAL) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-CAL-01 | Semua aktivitas berada dalam satu kalender terpadu (kuliah, rapat organisasi, janji, kegiatan pribadi, deadline tugas, acara, agenda proyek). | `[DECIDED]` |
| FR-CAL-02 | Aktivitas dibedakan dengan kategori atau warna; kategori dapat disesuaikan. Contoh: Kuliah, Organisasi, Pribadi, Proyek. | `[DECIDED]` |
| FR-CAL-03 | Tersedia tiga tampilan: harian (berdasarkan jam), mingguan, bulanan. Pengguna dapat berpindah di antaranya. | `[DECIDED]` |
| FR-CAL-04 | Agenda mendukung jenis **Timed** (jam mulai-selesai) dan **All-day** (tanpa kewajiban jam). Keduanya muncul di kalender terpadu (Q30). | `[DECIDED]` |
| FR-CAL-05 | Agenda dapat berulang (misalnya jadwal kuliah mingguan). | `[DECIDED]` |
| FR-CAL-06 | Satu kejadian agenda berulang dapat diubah isinya, dibatalkan, atau dipindahkan ke tanggal/jam lain tanpa memengaruhi kejadian lainnya (Q29). | `[DECIDED]` |
| FR-CAL-07 | Zona waktu mengikuti zona waktu perangkat secara otomatis. Tidak ada zona waktu manual per agenda (Q31). | `[DECIDED]` |
| FR-CAL-08 | Agenda dapat dihubungkan ke tugas, proyek, mata kuliah, area, serta catatan terkait, sebagai relasi dan bukan salinan (Q32). Relasi area dan proyek aktif setelah modul terkait tersedia dan tidak masuk MVP (keputusan 2026-11-06). | `[DECIDED]` |
| FR-CAL-09 | Setiap agenda dapat memiliki lokasi fisik dan/atau tautan online (Google Meet, Zoom). Keduanya opsional dan dapat dimiliki bersamaan (Q33). | `[DECIDED]` |
| FR-CAL-10 | Setiap agenda dapat memiliki beberapa pengingat sekaligus (Q34). Contoh: ujian H-1 dan 30 menit sebelumnya; rapat 15 menit sebelumnya. | `[DECIDED]` |
| FR-CAL-11 | Pilihan waktu pengingat menyediakan preset umum dan durasi khusus; default agenda Timed 30 menit sebelumnya dan All-day 1 hari sebelumnya. Perubahan/pembatalan satu kejadian agenda berulang hanya memengaruhi pengingat kejadian itu (keputusan 2026-11-06). | `[DECIDED]` |
| FR-CAL-12 | Agenda yang dibatalkan tetap tampil dengan label "Dibatalkan" dan pengingatnya dihentikan. Agenda yang dipindahkan tampil pada waktu baru, pengingat mengikuti waktu baru, dan perubahan dicatat di pusat notifikasi (keputusan 2026-11-06). | `[DECIDED]` |
| FR-CAL-13 | Milestone proyek tampil di kalender terpadu (Q58). | `[DECIDED]` `BACKLOG` |

### 6.5 Mata Kuliah (FR-CRS) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-CRS-01 | Setiap mata kuliah memiliki halaman tersendiri berisi informasi mata kuliah. | `[DECIDED]` |
| FR-CRS-02 | Jadwal kuliah mingguan dapat diatur berulang. | `[DECIDED]` |
| FR-CRS-03 | Materi, catatan, tugas, dan informasi pertemuan dapat dikaitkan dengan mata kuliah. Semua informasi terkait terlihat di satu tempat. | `[DECIDED]` |
| FR-CRS-04 | Perubahan pertemuan tertentu dicatat tanpa menghilangkan konteks jadwal normal. Contoh: pertemuan ke-13 Pengujian Perangkat Lunak menjadi online. | `[DECIDED]` |
| FR-CRS-05 | Mata kuliah tersedia offline (konfirmasi Q38). | `[DECIDED]` |
| FR-CRS-06 | Mata kuliah merupakan penawaran terpisah per periode; nama wajib, sedangkan kode, pengajar, label periode/tahun akademik, rentang tanggal, dan warna opsional. Halaman menampilkan jadwal, pertemuan, tugas, topik/ringkasan teks per pertemuan, dan tautan materi. Jadwal mingguan memakai agenda berulang sebagai sumber data; pengecualian mengikuti FR-CAL-06. Penawaran dapat diarsipkan tanpa menghapus riwayat; lampiran dan editor catatan kaya tidak termasuk MVP. | `[DECIDED]` (OQ-12, 2026-11-06) |

### 6.6 Tugas (FR-TSK) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-TSK-01 | Tugas memiliki deskripsi. Informasi tambahan digabung ke deskripsi (tidak ada kolom catatan terpisah). | `[DECIDED]` |
| FR-TSK-02 | Tugas memiliki deadline. | `[DECIDED]` |
| FR-TSK-03 | Tugas memiliki status: Belum dikerjakan, Sedang dikerjakan, Revisi, Selesai. | `[DECIDED]` |
| FR-TSK-04 | Tugas tidak memiliki prioritas. | `[DECIDED]` `OUT` |
| FR-TSK-05 | Pengingat deadline muncul pada H-3, H-1, dan hari-H, lalu berhenti (Q36). Tugas yang lewat deadline tidak diingatkan lagi. | `[DECIDED]` |
| FR-TSK-06 | Tugas berulang dan subtask/checklist tidak masuk MVP (Q35). | `[DECIDED]` `BACKLOG` |
| FR-TSK-07 | Tugas dapat ditautkan ke beberapa mata kuliah dan agenda dalam MVP; relasi ke area/proyek aktif setelah modul tersedia (keputusan 2026-11-06). | `[DECIDED]` |
| FR-TSK-08 | Tugas yang melewati deadline diberi label "Terlambat" selama statusnya belum Selesai; status tidak berubah otomatis dan pengingat tetap berhenti setelah hari-H (keputusan 2026-11-06). | `[DECIDED]` |
| FR-TSK-09 | Lampiran pada tugas. Lampiran hanya didukung pada catatan (Q62), jadi default: tidak ada. | `[DECIDED]` `OUT` |

`[SUPERSEDED]` Keinginan awal "pengingat berulang sampai tugas selesai" diganti oleh FR-TSK-05.

### 6.7 Inbox / Quick Capture (FR-INB) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-INB-01 | Pengguna dapat menyimpan cepat tanpa menentukan kategori/lokasi: teks atau ide, dan tautan/URL. | `[DECIDED]` |
| FR-INB-02 | Gambar, file, dan audio tidak didukung pada tahap awal. | `[DECIDED]` `OUT` |
| FR-INB-03 | Item dapat dibiarkan di Inbox. | `[DECIDED]` |
| FR-INB-04 | Item dapat diubah menjadi tugas, termasuk deadline bila perlu. | `[DECIDED]` |
| FR-INB-05 | Item dapat dihubungkan ke area setelah modul Area Kehidupan tersedia. | `[DECIDED]` `BACKLOG` |
| FR-INB-06 | Item dapat dihapus. | `[DECIDED]` |
| FR-INB-07 | Item dapat diubah menjadi catatan atau dihubungkan ke proyek. Aktif setelah modul catatan/proyek ada. | `[DECIDED]` `BACKLOG` |
| FR-INB-08 | Pada MVP, Inbox dapat dikonversi menjadi tugas atau agenda; konversi ke catatan/proyek tersedia setelah modul terkait ada (keputusan 2026-11-06). | `[DECIDED]` |
| FR-INB-09 | Konversi membuat entitas tugas/agenda baru yang tertaut ke item Inbox asal; sumber ditandai "Dikonversi" dan dikeluarkan dari Inbox aktif, tetapi tetap dapat dilacak. | `[DECIDED]` (keputusan 2026-11-06) |
| FR-INB-10 | Ide baru selama pengembangan dicatat di Inbox Æ Chrono Log sendiri dan ditinjau setiap akhir minggu (Q43). | `[DECIDED]` |

### 6.8 Notifikasi (FR-NTF) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-NTF-01 | Notifikasi muncul di luar aplikasi via notifikasi perangkat/browser (Web Push/PWA) jika memungkinkan. | `[DECIDED]` |
| FR-NTF-02 | Tersedia pusat notifikasi di dalam aplikasi yang menyimpan riwayat pengingat (Q51). | `[DECIDED]` |
| FR-NTF-03 | Pengaturan notifikasi per jenis: tugas, agenda, jadwal kuliah; pengaturan proyek tersedia setelah modul proyek ada (Q50). | `[DECIDED]` |
| FR-NTF-04 | Notifikasi MVP mencakup deadline tugas, agenda, jadwal kuliah atau perubahan jadwal; pengingat proyek menyusul bersama modul proyek. | `[DECIDED]` |
| FR-NTF-05 | Jam tenang tidak masuk cakupan awal. | `[DECIDED]` `OUT` |
| FR-NTF-06 | Sistem tidak menjanjikan push selalu terkirim saat perangkat offline atau browser membatasi proses latar belakang. | `[DECIDED]` |
| FR-NTF-07 | Riwayat disimpan selama 90 hari, maksimum 1.000 notifikasi terbaru; yang lebih lama dihapus otomatis. Setiap pemicu terjadwal menghasilkan satu notifikasi; tidak ada pengulangan tambahan selain jadwal pengingat tugas/agenda yang telah ditetapkan. Perubahan/pembatalan agenda menghasilkan satu notifikasi aktivitas. | `[DECIDED]` |

### 6.9 Offline dan Sinkronisasi (FR-SYN) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-SYN-01 | Pendekatan offline-first: perubahan lokal disimpan terlebih dahulu, lalu disinkronkan ke cloud saat koneksi tersedia. | `[DECIDED]` |
| FR-SYN-02 | Perubahan dari satu perangkat muncul di perangkat lain setelah sinkronisasi. | `[DECIDED]` |
| FR-SYN-03 | Offline-sync MVP mencakup agenda, tugas, Inbox, mata kuliah, dan data yang diperlukan Global Search. Catatan dan keuangan menyusul bersama modul backlog (keputusan 2026-11-06; selaras dengan Q38). | `[DECIDED]` |
| FR-SYN-04 | Proyek tidak wajib tersedia offline (Q38). | `[DECIDED]` |
| FR-SYN-05 | Konflik data terstruktur MVP diselesaikan otomatis dengan versi terbaru; server memberi nomor revisi monotonik, mempertahankan salinan versi yang kalah untuk pemulihan, dan memberi tahu pengguna jika konflik terjadi. Perubahan stale tidak boleh diam-diam menghapus data lokal yang belum terkirim. | `[DECIDED]` (OQ-13) |
| FR-SYN-06 | Konflik catatan panjang (lebih dari 10.000 karakter) meminta pengguna memilih versi. Modul catatan berada di luar MVP; aturan ini berlaku saat modul tersebut tersedia. | `[DECIDED]` |
| FR-SYN-07 | Semua entitas MVP (agenda dan pengecualiannya, tugas, mata kuliah/pertemuan, Inbox, serta relasinya) adalah data terstruktur biasa; tidak ada catatan panjang pada MVP. | `[DECIDED]` (OQ-13) |
| FR-SYN-08 | Status terlihat: Offline, Menunggu sinkronisasi, Menyinkronkan, Tersinkron, atau Perlu perhatian. Sinkronisasi berjalan setelah perubahan lokal, saat aplikasi dibuka/dikembalikan ke foreground, dan saat koneksi pulih. Gagal sementara di-retry dengan exponential backoff+jitter (maksimum jeda 5 menit); retry manual tersedia. Penghapusan dikirim sebagai tombstone agar tidak muncul kembali di perangkat lain; tombstone tidak dihapus otomatis selama masih ada perangkat terdaftar. Operasi diberi ID idempoten agar retry tidak menggandakan data. | `[DECIDED]` (OQ-13) |

### 6.10 Backup dan Pemulihan (FR-BKP) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-BKP-01 | Backup otomatis berkala, ditambah backup/export manual dan pemulihan. | `[DECIDED]` |
| FR-BKP-02 | Frekuensi backup otomatis diatur pengguna: harian, mingguan, atau dimatikan (Q47). | `[DECIDED]` |
| FR-BKP-03 | Pengguna dapat membuat backup manual serta mengunduh/menyimpan backup. | `[DECIDED]` |
| FR-BKP-04 | Sistem menyimpan 30 backup terakhir (Q48). | `[DECIDED]` |
| FR-BKP-05 | Format file backup: JSON (Q48). | `[DECIDED]` |
| FR-BKP-06 | Restore mengganti seluruh data. Sebelum menimpa, sistem otomatis membuat backup data saat ini (Q49). | `[DECIDED]` |
| FR-BKP-07 | Enkripsi backup opsional; pengguna memilihnya saat membuat backup (Q56). | `[DECIDED]` |
| FR-BKP-08 | Setiap backup memiliki versi format dan checksum SHA-256; sebelum restore, format, checksum, dan struktur data divalidasi. Restore gagal tanpa mengganti data jika validasi gagal; restore sukses atomik dan selalu didahului backup otomatis data saat ini. | `[DECIDED]` |
| FR-BKP-09 | Default backup otomatis mingguan dan dapat diubah menjadi harian atau mati. JSON terenkripsi memakai enkripsi terautentikasi AES-256-GCM dan KDF password berversi dari pustaka teruji; password tidak dikirim/disimpan server. Password hilang berarti backup terenkripsi tidak dapat dipulihkan. Backup MVP mencakup semua data MVP; lampiran belum ada di MVP. Backup modul lampiran mendatang harus menyertakan berkas dan metadata dalam satu arsip. | `[DECIDED]` |

### 6.11 Global Search (FR-SRH) — `MVP`

| ID | Requirement | Status |
|---|---|---|
| FR-SRH-01 | Satu fitur pencarian global yang mencari judul dan isi konten. | `[DECIDED]` |
| FR-SRH-02 | Cakupan umum: catatan, materi pembelajaran, proyek, tugas, Inbox, agenda, dan informasi lain dalam sistem. Pada MVP, pencarian terbatas pada tugas, agenda, mata kuliah, dan Inbox yang tersedia. | `[DECIDED]` |
| FR-SRH-03 | Filter berdasarkan jenis data (catatan, tugas, agenda, proyek, dan lainnya) (Q52). | `[DECIDED]` |
| FR-SRH-04 | Hasil diurutkan berdasarkan relevansi (Q52). | `[DECIDED]` |
| FR-SRH-05 | Pencarian dapat dipakai offline untuk data inti yang tersedia offline (Q53). | `[DECIDED]` |
| FR-SRH-06 | Data dari area terarsip tidak muncul di hasil pencarian (FR-AREA-05). | `[DECIDED]` |
| FR-SRH-07 | Global Search masuk MVP dengan cakupan awal pada tugas, agenda, mata kuliah, dan Inbox (keputusan 2026-11-06). | `[DECIDED]` |
| FR-SRH-08 | Pada MVP, pencarian menyediakan filter jenis data dan rentang tanggal; filter area/kategori menunggu modul terkait tersedia. | `[DECIDED]` |

### 6.12 Catatan / Knowledge Library (FR-NOT) — `BACKLOG`

| ID | Requirement | Status |
|---|---|---|
| FR-NOT-01 | Modul Knowledge Library untuk pengetahuan umum di luar materi kuliah (contoh: Laravel, AI, software engineering). | `[DECIDED]` |
| FR-NOT-02 | Pendekatan catatan terstruktur (hybrid): metadata terstruktur (judul, isi, kategori/topik, tag, relasi) dengan editor teks sederhana. | `[DECIDED]` |
| FR-NOT-03 | Editor mendukung: heading/subheading, bold, italic, bullet list, numbered list, checklist, hyperlink. | `[DECIDED]` |
| FR-NOT-04 | Catatan dapat dihubungkan ke mata kuliah, proyek, atau area. | `[DECIDED]` |
| FR-NOT-05 | Kategori/topik dan tag dibuat sendiri oleh pengguna (Q61). | `[DECIDED]` |
| FR-NOT-06 | Tidak ada status draft dan tidak ada riwayat revisi (Q61). | `[DECIDED]` |
| FR-NOT-07 | Lampiran didukung pada catatan saja (Q62). | `[DECIDED]` |
| FR-NOT-08 | BACKLOG: lampiran catatan mendukung PDF, JPEG, dan PNG hingga 10 MB per berkas. Berkas hanya diunduh untuk offline atas permintaan pengguna; backup menyertakan berkas dan metadata. | `[DECIDED]` |
| FR-NOT-09 | BACKLOG: catatan dapat saling menautkan melalui relasi many-to-many tanpa hierarki; tautan balik ditampilkan pada kedua catatan. | `[DECIDED]` |

### 6.13 Keuangan Pribadi (FR-FIN) — `BACKLOG`

Sederhana dan tidak rumit.

| ID | Requirement | Status |
|---|---|---|
| FR-FIN-01 | Mencatat pemasukan dan pengeluaran. | `[DECIDED]` |
| FR-FIN-02 | Transfer antar akun/dompet. | `[DECIDED]` |
| FR-FIN-03 | Pengelolaan akun/dompet dengan saldo awal yang diinput per akun (Q41). | `[DECIDED]` |
| FR-FIN-04 | Pemantauan saldo dan riwayat transaksi. | `[DECIDED]` |
| FR-FIN-05 | Kategori transaksi memakai kategori bawaan saja, tidak dapat dibuat sendiri pada tahap awal (Q41, Q57). | `[DECIDED]` |
| FR-FIN-06 | Kategori bawaan pemasukan: Gaji/Uang saku, Lainnya. | `[DECIDED]` |
| FR-FIN-07 | Kategori bawaan pengeluaran: Makan, Transportasi, Pendidikan, Belanja, Tagihan, Hiburan, Lainnya. | `[DECIDED]` |
| FR-FIN-08 | BACKLOG: tidak ada lampiran transaksi. Laporan bulanan memakai tanggal transaksi; ekspor tersedia sebagai CSV UTF-8. Transfer dicatat sebagai satu operasi atomik dengan nominal positif yang sama pada dua akun. Saldo negatif diizinkan dan ditandai, bukan memblokir pencatatan. Relasi area/proyek tersedia setelah modul terkait ada. | `[DECIDED]` |

### 6.14 Manajemen Proyek (FR-PRJ) — `BACKLOG`

| ID | Requirement | Status |
|---|---|---|
| FR-PRJ-01 | Modul proyek tersendiri, bukan sekadar kategori tugas. | `[DECIDED]` |
| FR-PRJ-02 | BACKLOG: halaman proyek memuat tujuan/deskripsi opsional, status, tugas dan agenda terkait, milestone, serta tautan catatan saat modul catatan tersedia. Tidak ada anggota/tim pada sistem satu pengguna. | `[DECIDED]` |
| FR-PRJ-03 | BACKLOG: status proyek adalah Direncanakan, Sedang berjalan, Ditunda, atau Selesai. Perubahan status dilakukan manual. | `[DECIDED]` |
| FR-PRJ-04 | Proyek dapat dikaitkan dengan lebih dari satu area. | `[DECIDED]` |
| FR-PRJ-05 | Proyek memiliki tanggal mulai, target selesai, dan milestone (Q42). | `[DECIDED]` |
| FR-PRJ-06 | Milestone memiliki judul, tanggal target, dan status (belum/selesai); tampil di kalender terpadu (Q58). | `[DECIDED]` |
| FR-PRJ-07 | BACKLOG: satu milestone hanya milik satu proyek; tugas dapat ditautkan ke beberapa proyek. Progres diturunkan dari proporsi tugas aktif yang Selesai; jika proyek tidak memiliki tugas aktif, progres diturunkan dari milestone selesai. Proyek dapat diarsipkan tanpa menghapus relasi atau datanya; tidak ada anggota/pihak lain. | `[DECIDED]` |

---

## 7. Non-Functional Requirements

| ID | Kategori | Requirement | Status |
|---|---|---|---|
| NFR-01 | Performa | Pada perangkat acuan dan dataset OQ-18, persentil ke-95 dashboard siap digunakan kurang dari 2 detik pada Chrome dan Edge, termasuk saat offline setelah PWA terpasang dan cache awal tersedia. | `[DECIDED]` |
| NFR-02 | Ketersediaan offline | Data inti (FR-SYN-03) dapat dilihat dan dikelola tanpa internet. | `[DECIDED]` |
| NFR-03 | Kompatibilitas | Berjalan di Chrome dan Edge versi terbaru, sebagai PWA yang dapat dipasang di laptop dan ponsel. | `[DECIDED]` |
| NFR-04 | Privasi | Data pribadi, satu pengguna, tanpa pendaftaran publik. | `[DECIDED]` |
| NFR-05 | Integritas data | Waktu agenda disimpan konsisten lintas perangkat agar tidak bergeser (A-03); backup menjaga integritas data. | `[DECIDED]` |
| NFR-06 | Keandalan notifikasi | Push notification tidak dijamin terkirim saat offline/dibatasi browser; notifikasi dalam aplikasi sebagai pelengkap. | `[DECIDED]` |
| NFR-07 | Keringanan sumber daya | Dashboard tetap memenuhi target NFR-01 pada perangkat acuan dengan dataset OQ-18; pengujian mencakup Chrome/Edge dan online/offline. | `[DECIDED]` |
| NFR-08 | Kapasitas | MVP harus mendukung sedikitnya 10.000 rekaman aktif lintas entitas MVP pada satu akun tanpa kehilangan data; pengujian performa memakai dataset yang sama. Ini batas kapasitas yang dijamin, bukan batas keras input. | `[DECIDED]` (OQ-18) |

---

## 8. Business Rules

| ID | Aturan |
|---|---|
| BR-01 | Hanya ada satu akun. Setelah akun pertama dibuat, pendaftaran terkunci (FR-AUTH-02). |
| BR-02 | Satu objek dapat terhubung ke banyak area/objek lain melalui relasi. Tidak ada salinan data (FR-AREA-06, FR-CAL-08). |
| BR-03 | Data boleh tanpa area. Menghapus area tidak menghapus data terhubung, hanya memutus relasi (FR-AREA-03/04). |
| BR-04 | Area terarsip disembunyikan dari daftar/pencarian Area; tugas/agenda terkait tetap tersedia melalui modul masing-masing (FR-AREA-05/07). |
| BR-05 | Perubahan satu kejadian agenda berulang tidak memengaruhi kejadian lainnya (FR-CAL-06). |
| BR-06 | Zona waktu mengikuti perangkat; tidak ada zona waktu per agenda (FR-CAL-07). |
| BR-07 | Pengingat tugas: H-3, H-1, hari-H, lalu berhenti. Tugas lewat deadline tidak diingatkan lagi (FR-TSK-05). |
| BR-08 | Tugas tidak memiliki prioritas dan tidak memiliki kolom catatan terpisah. |
| BR-09 | Konflik sinkronisasi: data biasa memakai perubahan terbaru; catatan panjang meminta pengguna memilih (FR-SYN-05/06). |
| BR-10 | Restore backup mengganti seluruh data dan selalu didahului backup otomatis data saat ini (FR-BKP-06). |
| BR-11 | Sistem menyimpan maksimal 30 backup terakhir (FR-BKP-04). |
| BR-12 | Kategori transaksi hanya kategori bawaan pada tahap awal (FR-FIN-05). |
| BR-13 | Lampiran hanya pada catatan (FR-NOT-07). |
| BR-14 | Ide baru dicatat di Inbox proyek dan ditinjau mingguan. Ide hanya masuk milestone berjalan bila mendukung tujuan MVP, punya skenario penerimaan yang jelas, dan tidak menambah dependensi/scope yang belum disetujui; selain itu tetap di backlog. |

---

## 9. Use Case Utama

### UC-01 Membuka dashboard di pagi hari — `MVP`
- **Aktor:** Pengguna
- **Prasyarat:** Aplikasi terpasang; sesi login masih berlaku (atau PIN dibuka bila aktif).
- **Alur utama:** (1) Pengguna membuka aplikasi. (2) Sistem menampilkan jadwal hari ini, agenda/kelas, tugas, acara mendatang, dan pengingat. (3) Pengguna mengetahui apa yang harus dilakukan dan tidak boleh dilupakan.
- **Alternatif:** Perangkat offline, dashboard tetap tampil dari data lokal.

### UC-02 Setup awal akun — `MVP`
- **Alur utama:** (1) Pemilik membuka aplikasi pertama kali. (2) Membuat akun email/password. (3) Sistem menampilkan kode pemulihan sekali pakai untuk disimpan pengguna. (4) Pendaftaran terkunci.

### UC-03 Menangkap ide cepat lalu mengolahnya — `MVP`
- **Alur utama:** (1) Pengguna memasukkan teks/URL ke Inbox. (2) Item tetap di Inbox atau dikonversi menjadi tugas/agenda baru yang tertaut ke sumber, atau dihapus.
- **Catatan:** Sumber Inbox yang dikonversi tidak tampil di Inbox aktif, tetapi tetap terlacak melalui relasi ke entitas hasil konversi (FR-INB-09).

### UC-04 Memindahkan satu pertemuan kuliah — `MVP`
- **Alur utama:** (1) Jadwal Senin 08.00–10.00 berulang. (2) Pengguna memindahkan satu kejadian ke Rabu 13.00–15.00. (3) Kejadian Senin lain tetap normal.

### UC-05 Mencatat perubahan pertemuan mata kuliah — `MVP`
- **Alur utama:** (1) Pengguna membuka halaman mata kuliah. (2) Mencatat pertemuan ke-13 menjadi online. (3) Konteks jadwal normal tetap ada.

### UC-06 Mengelola tugas dengan pengingat — `MVP`
- **Alur utama:** (1) Pengguna membuat tugas dengan deadline dan status. (2) Sistem mengirim pengingat H-3, H-1, hari-H. (3) Setelah hari-H, pengingat berhenti. (4) Pengguna mengubah status hingga Selesai.

### UC-07 Bekerja offline lalu sinkron — `MVP`
- **Alur utama:** (1) Pengguna mengubah data saat offline; tersimpan lokal. (2) Koneksi kembali; perubahan dikirim ke cloud. (3) Perangkat lain menerima perubahan. (4) Jika konflik, aturan BR-09 berlaku.

### UC-08 Backup dan restore — `MVP`
- **Alur utama:** (1) Backup otomatis berjalan sesuai frekuensi atau pengguna membuat backup manual (dengan enkripsi opsional). (2) Untuk restore, sistem membuat backup data saat ini terlebih dahulu, lalu mengganti seluruh data dari file backup.

### UC-09 Mengarsipkan area — `BACKLOG`
- **Alur utama:** (1) Pengguna mengarsipkan area. (2) Area tersembunyi dari daftar/pencarian Area; data terkait tetap terlihat di modul tugas/agenda. (3) Saat area dipulihkan, relasi dan tampilan Area kembali.

---

## 10. Acceptance Criteria

| ID | Kriteria | Terkait |
|---|---|---|
| AC-01 | **Definisi selesai fitur (Q64):** semua skenario utama fitur berhasil dijalankan di Chrome dan Edge, baik online maupun offline. | Semua fitur |
| AC-02 | Dashboard tampil dalam < 2 detik setelah aplikasi dibuka, termasuk offline. | NFR-01, FR-DSH-06 |
| AC-03 | Memindahkan satu kejadian agenda berulang tidak mengubah kejadian lain dalam seri. | FR-CAL-06 |
| AC-04 | Tugas dengan deadline menghasilkan pengingat tepat pada H-3, H-1, hari-H, dan tidak ada pengingat sesudahnya. | FR-TSK-05 |
| AC-05 | Menghapus area tidak menghapus data terhubung; data muncul di daftar "Tanpa Area". | FR-AREA-03/04 |
| AC-06 | Data dari area terarsip tidak muncul di hasil pencarian. | FR-AREA-05 |
| AC-07 | Perubahan saat offline muncul di perangkat lain setelah sinkronisasi. | FR-SYN-01/02 |
| AC-08 | Setelah restore, seluruh data sama dengan isi backup, dan backup otomatis sebelum restore tersedia. | FR-BKP-06 |
| AC-09 | Backup yang melewati batas menyisakan 30 backup terbaru. | FR-BKP-04 |
| AC-10 | Setelah akun pertama dibuat, upaya pendaftaran akun kedua ditolak. | FR-AUTH-02 |
| AC-11 | Dengan PIN aktif, aplikasi terkunci setelah 5 menit tidak aktif. | FR-AUTH-06 |
| AC-12 | Notifikasi MVP dapat dinyalakan/dimatikan per jenis: tugas, agenda, dan jadwal kuliah. | FR-NTF-03 |
| AC-13 | Agenda dibatalkan tetap terlihat berlabel "Dibatalkan" tanpa pengingat; agenda pindahan terlihat pada waktu baru dengan pengingat yang mengikuti waktu tersebut dan perubahan tercatat di pusat notifikasi. | FR-CAL-12 |
| AC-14 | Tugas yang belum Selesai setelah deadline menampilkan label "Terlambat", status tugas tidak berubah otomatis, dan tidak ada pengingat setelah hari-H. | FR-TSK-05/08 |
| AC-15 | Setelah konversi Inbox, tugas/agenda baru tertaut ke sumber dan sumber tidak lagi muncul di Inbox aktif. | FR-INB-09 |
| AC-16 | Penawaran mata kuliah dari periode berbeda tetap terpisah; arsip tidak menghapus pertemuan/tugas; pengecualian satu pertemuan tidak mengubah jadwal berulang; ringkasan teks dan tautan dapat disimpan tanpa lampiran. | FR-CRS-02/04/06 |
| AC-17 | Saat offline, perubahan tersimpan lokal dan statusnya terlihat; setelah koneksi pulih, retry idempoten menyinkronkan perubahan dan tombstone mencegah item terhapus muncul kembali. | FR-SYN-01/02/08 |
| AC-18 | Pada perangkat acuan OQ-18, P95 waktu dari membuka PWA yang sudah terpasang hingga dashboard dapat digunakan kurang dari 2 detik untuk 10.000 rekaman, diukur terpisah pada Chrome dan Edge dengan 20 cold start online dan 20 offline. | NFR-01/07/08 |
| AC-19 | Deployment atau migrasi MVP tidak mengubah database maupun Worker v1.0; restore backup v1.0 berhasil diuji pada salinan sebelum cutover MVP. | Bagian 4.2 |
| AC-20 | Pemulihan dengan kode sekali pakai menginvalidasi kode lama setelah reset berhasil dan mewajibkan kode baru; kode baru tidak ditampilkan kembali setelah keluar dari layar setup. | FR-AUTH-08 |
| AC-21 | Setelah 5 menit tanpa aktivitas aplikasi meminta PIN; lima PIN salah memblokir percobaan berikutnya selama 1 menit. | FR-AUTH-06 |
| AC-22 | Restore menolak backup dengan versi format tak didukung atau checksum/struktur tidak valid dan mempertahankan data aktif. | FR-BKP-08 |
| AC-23 | Transfer keuangan saat modul tersedia menghasilkan debit/kredit berpasangan yang seimbang atau tidak mengubah saldo sama sekali bila operasi gagal. | FR-FIN-08 |
| AC-24 | Ide baru tidak masuk milestone berjalan jika tidak memenuhi kriteria BR-14; perubahan visual di luar pengecualian OQ-20 ditolak tanpa perubahan scope. | BR-14 |
| AC-25 | Area yang diarsipkan hilang dari daftar/pencarian Area, sementara tugas/agenda terhubung tetap tampil di modulnya; pemulihan mengembalikan area dan relasi. | FR-AREA-05/07 |
| AC-26 | Notifikasi lebih lama dari 90 hari atau di luar 1.000 item terbaru tidak ditampilkan; setiap pemicu hanya menghasilkan satu notifikasi. | FR-NTF-07 |
| AC-27 | Pencarian MVP dapat dibatasi menurut jenis data dan rentang tanggal; filter area/kategori tidak ditawarkan sebelum modul terkait tersedia. | FR-SRH-07/08 |
| AC-28 | Backup terenkripsi dengan password salah/tidak tersedia gagal dipulihkan tanpa mengubah data aktif; password backup tidak dapat direset oleh sistem. | FR-BKP-07/09 |
| AC-29 | Modul catatan menolak lampiran selain PDF/JPEG/PNG atau di atas 10 MB; berkas yang tidak diminta untuk offline tidak diunduh, dan backup catatan menyertakan berkas beserta metadata. | FR-NOT-08 |
| AC-30 | Progres proyek dihitung dari tugas aktif; bila tidak ada tugas aktif, dihitung dari milestone; proyek tanpa keduanya menunjukkan 0%. Pengarsipan tidak menghapus data atau relasi. | FR-PRJ-07 |

---

## 11. Rangkuman Prioritas

**MVP:** FR-DSH, FR-AUTH, FR-CAL, FR-CRS, FR-TSK, FR-INB (capture, konversi tugas/agenda, hapus), FR-NTF, FR-SYN, FR-BKP, FR-SRH (cakupan awal: tugas, agenda, mata kuliah, Inbox).

**BACKLOG:** FR-AREA, FR-NOT, FR-FIN, FR-PRJ, tugas berulang, subtask, relasi area/proyek, konversi Inbox ke catatan/proyek.

**OUT:** habit tracking, AI, multi-user, prioritas tugas, jam tenang, Safari/iOS.

---

## 12. Pertanyaan Terbuka (Open Questions)

Semua pertanyaan kebutuhan pada baseline v1.22 telah ditutup. Tabel ini mempertahankan ringkasan keputusan dan nomor rujukan.

| ID | Pertanyaan / keputusan | Terkait | Status |
|---|---|---|---|
| OQ-01 | (a) **Selesai 2026-11-06:** Global Search masuk MVP, terbatas pada tugas, agenda, mata kuliah, dan Inbox yang tersedia. (b) **Selesai 2026-11-06:** Inbox MVP dapat dikonversi menjadi tugas atau agenda; catatan/proyek menyusul setelah modul tersedia. (c) **Selesai 2026-11-06:** Offline-sync MVP hanya mencakup data modul MVP yang tersedia; catatan/keuangan menyusul. (d) **Selesai 2026-11-06:** Relasi agenda-proyek aktif setelah modul proyek tersedia, bukan di MVP. | FR-SRH, FR-INB, FR-SYN, FR-CAL | Selesai |
| OQ-02 | **Selesai 2026-11-06:** modul Area Kehidupan penuh ditunda setelah MVP; data MVP tidak wajib memiliki area. | FR-AREA | Selesai |
| OQ-03 | **Selesai 2026-11-07:** data aktif tetap tampil di modul masing-masing; pemulihan area mengembalikan area dan relasinya. | FR-AREA-07 | Selesai |
| OQ-04 | **Selesai 2026-11-07:** dashboard MVP memakai tata letak tetap; kustomisasi ditunda. | FR-DSH-07 | Selesai |
| OQ-05 | (a) **Selesai 2026-11-06:** waktu pengingat menyediakan preset umum dan durasi khusus. (b) **Selesai 2026-11-06:** default Timed 30 menit sebelumnya dan All-day 1 hari sebelumnya. (c) **Selesai 2026-11-06:** perubahan/pembatalan satu kejadian hanya memengaruhi pengingat kejadian itu. (d) **Selesai 2026-11-06:** agenda batal tetap terlihat berlabel dan tanpa pengingat; agenda pindahan tampil pada waktu baru dengan pengingat yang menyesuaikan, perubahan tercatat di pusat notifikasi. | FR-CAL-11/12 | Selesai |
| OQ-06 | (a) **Selesai 2026-11-06:** tugas dapat ditautkan ke beberapa mata kuliah dan agenda; relasi area/proyek menyusul setelah modul tersedia. (b) **Selesai 2026-11-06:** tugas terlambat diberi label tanpa perubahan status otomatis dan tanpa pengingat setelah hari-H. | FR-TSK-07/08 | Selesai |
| OQ-07 | **Selesai 2026-11-06:** konversi membuat entitas baru yang tertaut ke sumber; sumber ditandai "Dikonversi" dan dikeluarkan dari Inbox aktif. | FR-INB-09 | Selesai |
| OQ-08 | **Selesai 2026-11-07:** kode pemulihan dapat dirotasi setelah autentikasi ulang; kode lama tidak berlaku. Kode hilang tidak dapat dipulihkan dan tidak ada bypass. | FR-AUTH-08 | Selesai |
| OQ-09 | **Selesai 2026-11-07:** sesi maksimum 30 hari; PIN lokal mengunci setelah 5 menit dan memberi jeda 1 menit setelah 5 kali salah. | FR-AUTH-04/06 | Selesai |
| OQ-10 | **Selesai 2026-11-07:** HTTPS, verifier password Argon2id, cookie aman, CSRF, rate limit, minimisasi secrets, dan batas perlindungan data lokal ditetapkan di FR-AUTH-09. | FR-AUTH-09 | Selesai |
| OQ-11 | **Selesai 2026-11-07:** riwayat notifikasi 90 hari/maksimum 1.000 item; tidak ada pengulangan di luar jadwal pengingat yang telah ditetapkan. | FR-NTF-07 | Selesai |
| OQ-12 | **Selesai 2026-11-06:** penawaran mata kuliah dicatat terpisah per periode; detail, materi, pertemuan, ringkasan/tautan, arsip, dan relasi agenda mengikuti FR-CRS-06. | FR-CRS-06 | Selesai |
| OQ-13 | **Selesai 2026-11-06:** entitas MVP adalah data terstruktur; catatan panjang >10.000 karakter (modul mendatang) memakai pemilihan versi. Status, pemicu, retry, idempotensi, revisi konflik, dan tombstone penghapusan ditetapkan di FR-SYN-05/08. | FR-SYN-05/08 | Selesai |
| OQ-14 | **Selesai 2026-11-07:** backup otomatis default mingguan; enkripsi AES-256-GCM dengan KDF berversi; password hilang tidak dapat dipulihkan; backup masa depan menyertakan lampiran. | FR-BKP-08/09 | Selesai |
| OQ-15 | **Selesai 2026-11-07 (BACKLOG):** lampiran catatan PDF/JPEG/PNG, maksimum 10 MB per berkas; offline atas permintaan; masuk backup. | FR-NOT-08 | Selesai |
| OQ-16 | **Selesai 2026-11-07 (BACKLOG):** tanpa lampiran transaksi; laporan bulanan; ekspor CSV UTF-8; transfer atomik bernominal positif; saldo negatif diizinkan dengan penanda; relasi area/proyek menyusul. | FR-FIN-08 | Selesai |
| OQ-17 | **Selesai 2026-11-07 (BACKLOG):** proyek satu pengguna tanpa anggota; progres dari penyelesaian tugas/milestone; arsip tidak menghapus relasi; rincian di FR-PRJ-02/03/07. | FR-PRJ-02/03/07 | Selesai |
| OQ-18 | **Selesai 2026-11-06:** perangkat Windows 11, CPU 4-core setara ≥2 GHz, RAM 8 GB, SSD, layar 1366×768; Chrome/Edge stable; dataset tetap 10.000 rekaman (100 mata kuliah, 2.000 tugas, 5.000 kejadian agenda, 1.000 Inbox, 1.900 notifikasi); 20 cold start per browser per kondisi online/offline; P95 dashboard siap digunakan <2 detik. Kapasitas yang dijamin minimum 10.000 rekaman. | NFR-01/07/08 | Selesai |
| OQ-19 | **Selesai 2026-11-07:** hanya ide yang mendukung tujuan MVP, punya skenario penerimaan jelas, dan tidak menambah dependensi/scope yang belum disetujui dapat masuk milestone; lainnya tetap backlog. | BR-14 | Selesai |
| OQ-20 | **Selesai 2026-11-07:** desain fungsional MVP dibekukan setelah alur inti; perubahan UI hanya untuk aksesibilitas, responsif, konsistensi, atau bug/usability blocker. | Scope control | Selesai |
---

## 13. Log Keputusan (referensi nomor pertanyaan wawancara)

| Q | Keputusan |
|---|---|
| Q29 | Agenda berulang mendukung pengecualian satu kejadian; boleh dipindahkan |
| Q30 | Agenda Timed dan All-day |
| Q31 | Zona waktu mengikuti perangkat otomatis |
| Q32 | Agenda berelasi dengan data lain, bukan salinan |
| Q33 | Lokasi fisik dan tautan online, opsional |
| Q34 | Beberapa pengingat per agenda |
| Q35 | Tugas berulang dan subtask ke backlog |
| Q36 | Pengingat tugas H-3, H-1, hari-H, lalu berhenti (menggantikan "berulang sampai selesai") |
| Q37 | Hapus area: data tetap, menjadi tanpa area |
| Q38 | Data offline: agenda, tugas, Inbox, catatan, keuangan, mata kuliah; proyek tidak wajib |
| Q39 | Konflik: terbaru menang untuk data biasa; catatan panjang pengguna memilih |
| Q40 | Email/password; sesi tersimpan di perangkat; PIN lokal opsional |
| Q41 | Saldo awal diinput; kategori transaksi bawaan |
| Q42 | Proyek: tanggal mulai, target selesai, milestone |
| Q43 | Ide baru ke Inbox, ditinjau mingguan |
| Q44 | Akun pertama lewat setup awal; pendaftaran lalu terkunci |
| Q45 | Pemulihan akun dengan kode sekali pakai |
| Q46 | Sesi kedaluwarsa; PIN mengunci otomatis saat tidak aktif |
| Q47 | Frekuensi backup otomatis diatur pengguna: harian/mingguan/mati |
| Q48 | 30 backup terakhir; format JSON |
| Q49 | Restore mengganti seluruh data; backup otomatis sebelum menimpa |
| Q50 | Notifikasi diatur per jenis; tanpa jam tenang |
| Q51 | Pusat notifikasi dalam aplikasi dengan riwayat |
| Q52 | Search: filter jenis data, urut relevansi |
| Q53 | Search tersedia offline untuk data inti |
| Q54 | PWA; Chrome dan Edge terbaru |
| Q55 | MVP: dashboard, kalender/agenda, tugas, mata kuliah, Inbox, notifikasi, offline-sync, login, backup. Backlog: catatan, keuangan, proyek |
| Q56 | Enkripsi backup opsional per backup |
| Q57 | Kategori keuangan bawaan (lihat FR-FIN-06/07) |
| Q58 | Milestone: judul, tanggal target, status; tampil di kalender |
| Q59 | Data boleh tanpa area; daftar "Tanpa Area" |
| Q60 | Area terarsip disembunyikan penuh, termasuk dari pencarian |
| Q61 | Kategori/tag buatan sendiri; tanpa draft; tanpa riwayat revisi |
| Q62 | Lampiran hanya pada catatan |
| Q63 | Dashboard < 2 detik, termasuk offline |
| Q64 | Fitur selesai bila skenario utama lolos di Chrome dan Edge, online dan offline |
| OQ-01a | Global Search masuk MVP dengan cakupan awal tugas, agenda, mata kuliah, dan Inbox (keputusan realignment 2026-11-06) |
| OQ-01b | Inbox MVP dapat dikonversi menjadi tugas atau agenda; konversi ke catatan/proyek menyusul setelah modul tersedia (keputusan realignment 2026-11-06) |
| OQ-01c | Offline-sync MVP hanya mencakup data modul MVP yang tersedia; catatan dan keuangan menyusul bersama modul backlog (keputusan realignment 2026-11-06) |
| OQ-01d | Relasi agenda-proyek aktif setelah modul proyek tersedia; bukan bagian MVP (keputusan realignment 2026-11-06) |
| OQ-02 | Modul Area Kehidupan penuh ditunda setelah MVP; objek MVP tidak wajib memiliki area (keputusan realignment 2026-11-06) |
| OQ-05a | Waktu pengingat agenda menyediakan preset umum dan durasi khusus (keputusan realignment 2026-11-06) |
| OQ-05b | Default agenda Timed 30 menit sebelumnya dan All-day 1 hari sebelumnya (keputusan realignment 2026-11-06) |
| OQ-05c | Perubahan/pembatalan satu kejadian agenda berulang hanya memengaruhi pengingat kejadian itu (keputusan realignment 2026-11-06) |
| OQ-05d | Agenda batal tetap terlihat berlabel tanpa pengingat; agenda pindahan tampil pada waktu baru dengan pengingat yang menyesuaikan dan perubahan dicatat di pusat notifikasi (keputusan realignment 2026-11-06) |
| OQ-06a | Satu tugas dapat ditautkan ke beberapa mata kuliah dan agenda; Area/Proyek menyusul setelah modul tersedia (keputusan realignment 2026-11-06) |
| OQ-06b | Tugas lewat deadline diberi label "Terlambat" tanpa perubahan status otomatis; pengingat berhenti setelah hari-H (keputusan realignment 2026-11-06) |
| OQ-07 | Konversi Inbox membuat entitas tugas/agenda baru yang tertaut ke sumber; sumber ditandai "Dikonversi" dan dikeluarkan dari Inbox aktif (keputusan realignment 2026-11-06) |
| OQ-12 | Detail penawaran mata kuliah per periode, pertemuan, materi teks/tautan, jadwal, dan arsip ditetapkan (keputusan realignment 2026-11-06) |
| OQ-13 | Aturan konflik, indikator, pemicu/retry sinkronisasi, idempotensi, dan tombstone penghapusan ditetapkan (keputusan realignment 2026-11-06) |
| OQ-18 | Benchmark: Windows 11, CPU 4-core ≥2 GHz, RAM 8 GB, SSD, 1366×768; Chrome/Edge stable; dataset 100 mata kuliah, 2.000 tugas, 5.000 kejadian agenda, 1.000 Inbox, 1.900 notifikasi; 20 cold start per browser per kondisi (80 run total); P95 dashboard <2 detik (keputusan realignment 2026-11-06) |
| OQ-03/04, 08-11, 14-17, 19-20 | Selesai pada baseline v1.22 tanggal 2026-11-07; rinciannya ada di Bagian 12 dan FR terkait. |

---
## 14. Kriteria Kelengkapan SRS

Baseline v1.22 telah melengkapi kebutuhan MVP dan keputusan backlog yang tercatat dalam SRS. SRS siap menjadi dasar implementasi bertahap setelah baseline ditinjau; persetujuan resource, biaya, secrets, dan deployment Cloudflare tetap harus diberikan terpisah sebelum tindakan produksi.

- [x] Semua OQ 01-20 sudah diputuskan atau ditutup sebagai keputusan realignment.
- [x] Semua requirement yang berlaku memiliki status dan prioritas; fitur backlog tidak termasuk milestone MVP.
- [x] Kriteria penerimaan, kondisi benchmark, serta batas koeksistensi v1.0 tersedia.
- [ ] Persetujuan resource dan deployment Cloudflare (gerbang operasional, bukan pertanyaan kebutuhan SRS).

**AKHIR DOKUMEN**
