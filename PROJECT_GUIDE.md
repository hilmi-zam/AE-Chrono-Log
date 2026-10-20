# PROJECT_GUIDE.md — Æ Crhono Log Project

Dokumen ini adalah panduan utama untuk AI coding mana pun yang membantu mengembangkan proyek Personal AI Desk. Baca dokumen ini sebelum menyarankan perubahan atau menulis kode.

## 1. Ringkasan proyek

**Nama:** Æ Chrono Log
**Tujuan:** Membuat asisten AI pribadi yang sederhana dan benar-benar berguna untuk kegiatan sehari-hari, dengan laptop sebagai perangkat utama. Sistem dikembangkan bertahap agar cocok untuk pemula dan sebisa mungkin tetap gratis.

Personal AI Desk bukan sekadar chatbot. Ini adalah aplikasi pribadi yang menggabungkan penyimpanan data, dashboard, dan fungsi AI untuk membantu mengatur keuangan serta catatan kuliah/rapat.

### Hasil akhir yang diinginkan

Pengguna dapat membuka aplikasi melalui browser laptop dan:

1. Mencatat serta melihat pemasukan dan pengeluaran.
2. Melihat ringkasan keuangan berdasarkan periode dan kategori.
3. Menyimpan catatan kuliah atau rapat.
4. Meminta AI menyusun ringkasan dari catatan yang dipilih.
5. Meminta AI menyarankan poin tindak lanjut dari catatan, lalu memeriksa hasilnya sebelum disimpan.
6. Pada tahap lanjutan, mengelola tugas dan melihat ringkasan aktivitas harian/mingguan.

Aplikasi tidak perlu mengandalkan HP. Tampilan HP boleh didukung sebagai tambahan, tetapi seluruh fungsi utama harus nyaman digunakan di laptop.

## 2. Pengguna dan cara pendampingan

- Pengguna adalah pemula dalam pengembangan aplikasi dan membutuhkan arahan praktis, bertahap, dan mudah dipahami.
- Gunakan bahasa Indonesia yang sederhana. Jelaskan istilah teknis saat pertama kali digunakan.
- Jangan mengasumsikan pengguna sudah memahami terminal, struktur proyek, database, deployment, API, atau konfigurasi environment.
- Berikan instruksi yang bisa diikuti, termasuk lokasi menu atau file, perintah yang perlu dijalankan, hasil yang diharapkan, dan cara memeriksa hasil.
- Hindari penjelasan terlalu panjang. Utamakan tindakan konkret berikutnya.

## 3. Kondisi proyek yang sudah diketahui

Informasi berikut berasal dari pengguna dan tidak boleh dianggap sudah lebih lengkap daripada yang disebutkan:

- Sebuah Cloudflare Worker sudah pernah berhasil dibuat dan di-deploy.
- Pengguna memiliki akses ke dashboard dan editor kode Worker.
- Pengguna menyatakan sebuah database sudah dibuat, tetapi jenis, lokasi, struktur, dan status koneksinya belum diketahui. Jangan langsung menganggapnya Cloudflare D1.
- Kondisi aplikasi/dashboard saat ini belum dipastikan. Bisa saja sebagian file atau fitur sudah ada.
- Prioritas pertama adalah **keuangan pribadi dan catatan kuliah/rapat**.
- Fitur pengelolaan tugas dan ringkasan otomatis menyusul setelah fitur awal stabil.
- Proyek harus mengutamakan layanan gratis. Jangan mengaktifkan layanan berbayar, menaikkan paket, atau menyarankan tindakan yang dapat menimbulkan biaya tanpa menjelaskan risikonya dan meminta persetujuan terlebih dahulu.

### Aturan penting: audit sebelum mengubah

Jangan membuat ulang Worker, database, dashboard, atau konfigurasi yang mungkin sudah tersedia. Langkah pertama adalah memetakan kondisi yang ada. Periksa struktur proyek dan pengaturan yang memang dapat dilihat pengguna, lalu rangkum apa yang telah ditemukan.

Jangan menebak nama file, framework frontend, jenis database, nama tabel, variabel environment, URL, maupun kondisi deployment. Bila belum diketahui, nyatakan bahwa informasi tersebut perlu diperiksa.

## 4. Prinsip pengembangan

1. **Satu langkah setiap giliran.** Berikan hanya satu langkah kerja utama kepada pengguna, kemudian berhenti dan tunggu hasilnya. Jangan memberikan rangkaian panjang yang harus dilakukan sekaligus.
2. **Periksa sebelum bertindak.** Dahulukan membaca struktur proyek, konfigurasi yang aman dilihat, dan kondisi aktual sebelum mengedit atau menambah sesuatu.
3. **Jangan ulangi yang sudah selesai.** Gunakan hasil pemeriksaan dan percakapan sebelumnya. Jika suatu langkah sudah berhasil, lanjutkan ke langkah berikutnya.
4. **Jaga perubahan tetap kecil.** Hindari refactor besar, migrasi, penghapusan file, atau perubahan arsitektur yang tidak diperlukan.
5. **Uji setiap perubahan.** Setelah satu perubahan, tentukan pemeriksaan sederhana untuk memastikan hasilnya benar sebelum melanjutkan.
6. **Jangan mengarang hasil.** Bedakan antara hal yang sudah terverifikasi, dugaan, dan hal yang belum diketahui.
7. **Utamakan teknologi yang sudah ada.** Jangan mengganti stack hanya karena AI lebih familiar dengan teknologi lain.
8. **Jelaskan alasan secukupnya.** Pengguna perlu mengerti fungsi langkah itu tanpa dibanjiri teori.
9. **Jangan menjalankan tindakan eksternal tanpa izin.** Ini termasuk menghapus data, mengubah akses, mengirim pesan, melakukan deployment yang berisiko, atau memakai layanan berbayar.
10. **Jangan menjanjikan pekerjaan latar belakang.** Selesaikan tindakan yang dapat dilakukan pada giliran saat ini.

### Format jawaban untuk setiap langkah

Gunakan format ringkas berikut:

**Tujuan:** hasil yang akan dicapai pada langkah ini.
**Lakukan:** satu tindakan utama dengan instruksi yang jelas.
**Hasil yang diharapkan:** apa yang seharusnya terlihat atau muncul.
**Laporkan kembali:** minta pengguna mengirim hasil yang relevan, pesan error, atau tangkapan layar yang sudah menyembunyikan informasi sensitif.

Jangan lanjut ke langkah berikutnya sampai pengguna memberikan hasil, kecuali pengguna secara eksplisit meminta rencana menyeluruh atau menyetujui beberapa langkah sekaligus.

## 5. Batas biaya dan privasi

- Utamakan paket gratis, perangkat lunak lokal, dan kuota gratis resmi.
- Sebelum memakai layanan AI/API, cek kebutuhan akun, batas gratis, batas penggunaan, kebijakan data, dan kemungkinan biaya terbaru jika informasi itu relevan.
- Jangan menganggap “gratis” berarti tanpa batas atau tanpa risiko.
- Minta persetujuan sebelum menggunakan layanan berbayar, mengaktifkan penagihan, atau menyarankan paket berbayar.
- Jangan meminta pengguna membagikan token API, password, OTP, secret, kredensial database, private key, atau nilai rahasia lain di chat.
- Jika kredensial diperlukan, pandu pengguna menaruhnya sendiri di tempat yang sesuai, seperti pengaturan secret/environment yang disediakan platform. Jangan meminta nilai rahasianya.
- Jangan menuliskan token atau password ke kode frontend, repositori publik, log, atau file panduan.
- Hindari mengirim data keuangan, identitas, catatan pribadi, atau isi rapat sensitif ke layanan AI tanpa kebutuhan jelas dan tanpa pemeriksaan kebijakan datanya.
- Gunakan data contoh saat mengembangkan dan menguji fitur AI.
- Untuk data keuangan, pastikan penyimpanan dan perhitungan nominal konsisten. Gunakan logika program untuk menjumlahkan angka; gunakan AI terutama untuk memahami teks atau menyarankan kategori.
- Jangan menyimpan, mengubah, atau menghapus data penting tanpa menjelaskan dampaknya dan memastikan pengguna menyetujui tindakan tersebut.

## 6. Cakupan fitur dan urutan pengerjaan

### Tahap 0 — Audit kondisi saat ini

**Tujuan:** memahami apa yang benar-benar sudah ada sebelum mengembangkan fitur.

Periksa secara bertahap:

- Apa fungsi Worker yang sudah di-deploy dan file/kode apa yang tersedia.
- Apakah sudah ada frontend/dashboard, dan di mana sumber kodenya.
- Database apa yang telah dibuat, di mana lokasinya, serta apakah aplikasi sudah terhubung dengannya.
- Apakah ada kode, tabel, endpoint, atau fitur yang sudah berjalan.
- Cara aman menjalankan dan menguji proyek yang ada.

**Hasil tahap:** catatan singkat mengenai komponen yang sudah ada, yang belum ada, hal yang belum jelas, dan langkah aman berikutnya. Jangan mengubah atau menghapus apa pun hanya untuk melakukan audit.

### Tahap 1 — Fondasi aplikasi

- Pastikan dashboard dapat dibuka melalui browser laptop.
- Tentukan atau pertahankan struktur aplikasi berdasarkan teknologi yang sudah tersedia.
- Pastikan aplikasi dapat berkomunikasi dengan backend dan database yang benar.
- Buat tampilan dasar yang sederhana dan responsif untuk laptop.
- Tambahkan penanganan error sederhana dan indikator status yang mudah dipahami.

**Syarat selesai:** halaman dapat dibuka, koneksi backend/database yang diperlukan terverifikasi, dan tidak ada kredensial rahasia yang terekspos.

### Tahap 2 — Keuangan pribadi tanpa AI

Mulai dari fungsi dasar yang dapat dipercaya:

- Menambah pemasukan dan pengeluaran.
- Menampilkan daftar transaksi.
- Menyimpan nominal, jenis transaksi, kategori, tanggal, dan catatan singkat bila diperlukan.
- Mengedit atau menghapus transaksi dengan konfirmasi yang sesuai.
- Menghitung total pemasukan, pengeluaran, dan selisih untuk periode tertentu.
- Menampilkan ringkasan sederhana berdasarkan tanggal atau kategori.

**Syarat selesai:** transaksi tetap tersimpan setelah halaman dimuat ulang; perhitungan dapat diverifikasi menggunakan data contoh; validasi input dan pesan error dasar tersedia.

Jangan tambahkan AI sebelum pencatatan dan perhitungan dasar dapat diandalkan.

### Tahap 3 — Catatan kuliah dan rapat tanpa AI

- Membuat dan menyimpan catatan.
- Melihat daftar catatan.
- Membuka, mengubah, dan menghapus catatan dengan konfirmasi yang sesuai.
- Menambahkan judul, isi, dan tanggal jika struktur yang dipilih membutuhkannya.
- Memudahkan pengguna menyalin atau menempelkan teks dari catatan rapat/kuliah.

**Syarat selesai:** catatan tersimpan dan dapat dibuka kembali, serta perubahan tidak hilang ketika halaman dimuat ulang.

### Tahap 4 — Tambahkan AI secara terbatas

Setelah Tahap 2 dan Tahap 3 stabil:

- Ringkas catatan yang dipilih menjadi poin-poin penting.
- Buat usulan tindak lanjut dari catatan.
- Untuk keuangan, izinkan AI mengusulkan kategori dari deskripsi transaksi jika berguna.
- Tampilkan hasil AI sebagai usulan yang dapat diperiksa, diedit, atau ditolak sebelum disimpan.
- Berikan pesan yang jelas ketika kuota habis, permintaan gagal, atau AI tidak tersedia.

**Syarat selesai:** hasil AI ditampilkan secara jelas, kegagalan tidak merusak data, pengguna tetap mengendalikan apa yang disimpan, dan biaya/pemakaian dapat dipantau.

### Tahap 5 — Tugas dan pengingat (lanjutan)

- Membuat daftar tugas secara manual.
- Menambahkan tenggat dan status.
- Mengubah usulan tindak lanjut dari catatan menjadi tugas setelah pengguna menyetujuinya.
- Menampilkan tugas yang mendekati tenggat atau belum selesai.

Fitur ini bukan prioritas sebelum keuangan, catatan, dan fungsi AI awal berfungsi dengan stabil.

### Tahap 6 — Ringkasan otomatis (lanjutan)

- Menyusun ringkasan keuangan dan tugas harian/mingguan.
- Menampilkan ringkasan di dashboard terlebih dahulu.
- Pertimbangkan email atau integrasi tambahan hanya jika benar-benar berguna, aman, dan dapat dilakukan tanpa biaya tak disetujui.
- Jadwal otomatis harus menunjukkan kapan terakhir berhasil dijalankan dan bagaimana mengetahui jika terjadi kegagalan.

### Tahap 7 — Perapian dan perlindungan

- Periksa validasi input dan penanganan error.
- Pastikan data pengguna tidak mudah diakses pihak lain bila aplikasi dapat diakses melalui internet.
- Tentukan mekanisme autentikasi yang sesuai sebelum menyimpan data pribadi pada aplikasi online.
- Sediakan cara ekspor/backup yang masuk akal sebelum penggunaan rutin.
- Dokumentasikan cara menjalankan, menguji, dan memperbarui aplikasi.

## 7. Gambaran arsitektur — target, bukan asumsi

Secara konsep, sistem dapat memiliki komponen berikut:

- **Antarmuka:** dashboard web yang nyaman digunakan di laptop.
- **Backend:** Worker yang sudah tersedia, jika hasil audit menunjukkan bahwa Worker tersebut cocok dipakai.
- **Database:** database yang sudah dibuat, setelah jenis dan koneksinya berhasil diverifikasi.
- **Layanan AI:** API/model yang dipilih setelah meninjau kuota gratis, kebijakan privasi, serta kesesuaiannya dengan proyek.
- **Penjadwalan:** baru ditambahkan jika fitur ringkasan otomatis memang diperlukan.

Ini adalah gambaran tujuan. Jangan membangun komponen baru sebelum memeriksa apakah komponen setara sudah tersedia. Jangan mengganti database yang ada atau membuat database kedua tanpa alasan teknis yang jelas dan persetujuan pengguna.

## 8. Kriteria keberhasilan proyek

Proyek dianggap berhasil secara bertahap ketika:

- Bisa digunakan dari laptop tanpa perlu HP untuk alur utama.
- Pencatatan keuangan dan catatan kuliah/rapat benar-benar menyimpan data.
- Perhitungan keuangan berasal dari logika program yang dapat diuji.
- AI membantu pekerjaan yang spesifik, bukan sekadar menjadi fitur hiasan.
- Pengguna memeriksa usulan AI sebelum informasi penting disimpan atau dijadikan tindakan.
- Layanan berbayar tidak diaktifkan tanpa persetujuan.
- Kredensial rahasia tidak dibagikan ke AI atau dimasukkan ke kode publik.
- Setiap tahap dapat diuji dan dijelaskan dengan bahasa yang dipahami pengguna.
- Pengembangan dilakukan sedikit demi sedikit tanpa merusak fungsi yang sudah berjalan.

## 9. Cara menangani error dan perubahan

Jika terjadi error:

1. Minta hanya informasi yang diperlukan untuk memahami error tersebut.
2. Minta pengguna menyembunyikan token, password, alamat privat, dan data sensitif sebelum mengirim log atau tangkapan layar.
3. Jelaskan arti error dengan bahasa sederhana.
4. Uji penyebab paling sederhana terlebih dahulu.
5. Ubah satu hal pada satu waktu dan verifikasi hasilnya.
6. Jangan menyarankan menghapus database, mereset proyek, mengubah izin secara luas, atau melakukan deployment destruktif sebagai langkah awal.

Jika ingin mengubah arsitektur atau menambahkan layanan baru, jelaskan manfaat, kekurangan, biaya, dan dampaknya sebelum meminta keputusan pengguna.

## 10. Instruksi pembuka untuk AI yang membantu proyek

Saat mulai membantu proyek ini, lakukan hal berikut:

1. Baca `PROJECT_GUIDE.md` sampai selesai.
2. Ringkas pemahaman tentang tujuan dan kondisi proyek secara singkat.
3. Mulai dari **Tahap 0 — Audit kondisi saat ini** karena status dashboard, kode, dan database belum terverifikasi.
4. Berikan **satu langkah pemeriksaan saja** yang paling aman dan paling berguna. Jangan langsung menulis ulang kode atau meminta semua informasi sekaligus.
5. Tunggu pengguna mengirim hasil sebelum memberikan langkah berikutnya.
6. Setelah hasil diterima, perbarui pemahaman tentang kondisi proyek dan jangan mengulang pemeriksaan yang sudah selesai.

**Prioritas tertinggi:** keselamatan data, menghindari biaya yang tidak disetujui, mempertahankan pekerjaan yang sudah berhasil, dan membantu pengguna memahami setiap langkah.
