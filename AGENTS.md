# AGENTS.md — Æ Chrono Log

File ini adalah penunjuk singkat untuk AI agent. Aturan kerja proyek lengkap ada di dokumen berikut:

- `PROJECT_RULES.md` — aturan utama yang wajib diikuti (batasan kerja, keamanan, pengujian, deployment, dokumen).
- `PROJECT_STATUS.md` — kondisi saat ini: komponen terverifikasi, lokal belum di-deploy, dan langkah berikutnya.
- `BACKLOG.md` — ide dan fitur di luar versi aktif (v1.1, v1.2, proteksi akses, hosting, data besar).

Penting:

- Jangan meminta atau menulis kredensial (password, token, secret) di chat atau repo.
- Jangan mengarang `schema.sql`; gunakan DDL asli dari konsol D1.
- Deployment Worker dilakukan oleh pemilik akun Cloudflare sendiri.
- Tanpa dependensi baru dan tanpa refactor besar; pertahankan kontrak endpoint yang sudah teruji.
- Setiap perubahan utama: periksa `node --check` dan build sebelum menyelesaikan.

File ini bukan pengganti `PROJECT_RULES.md` dan tidak berisi aturan baru.
