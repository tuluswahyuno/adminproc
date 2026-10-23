# SPJ Pengadaan — RSUD dr. Soeratno Gemolong

Aplikasi web untuk membuat dokumen **A2 (Surat Bukti Pengeluaran, A5)** dan **Lembar Verifikasi** (Word & PDF) dari satu kali input.

## Fitur Fase 1
- Login multi-pengguna (admin / staf), ganti password.
- Impor Excel **Realisasi Belanja** → kode rekening, pagu, realisasi, PPKom/PPTK/Pejabat Pengadaan.
- Input SPJ: pilih kode rekening → pejabat terisi otomatis; terbilang & pajak (PPN 11% + PPh 22 1,5%, rumus sama dengan contoh Excel) dihitung otomatis.
- Kategori nilai otomatis: 0–2 jt, 2–10 jt, 10–50 jt, 50–750 jt (dasar untuk Fase 2).
- Cetak A2 & Verifikasi → PDF atau Word, dengan pratinjau.
- Verifikator/KPA/Bendahara dikelola di Pengaturan; setiap SPJ menyimpan pejabat saat dibuat (aman jika verifikator berganti tahun depan).
- Peringatan jika melebihi sisa pagu.
- **Monitoring Nomor**: buku register semua nomor surat; nomor kembar ditandai merah, dicek langsung saat mengisi dokumen (server menolak simpan bila kembar), pencarian menurut tanggal untuk menyisipkan nomor manual di atas/bawah nomor yang ada.
- **Rekap SPPD** (dalam / luar daerah): rekap perjalanan dinas per periode, diisi per kegiatan (satu orang atau rombongan, kode booking/tiket/hotel per orang). Total rekap menjadi realisasi kode rekening Perjalanan Dinas (realisasi awal impor RBA tidak dihitung lagi bila rekening sudah punya rekap, agar tidak ganda). Unduh Excel format "FULL REKAP SPPD", satu sheet per periode; luar daerah punya versi ringkas (sampai JUMLAH + tanda tangan PPK) dan versi lengkap (+ armada & hotel). Akses: Administrator/Super User dan Pejabat Pengadaan pengampu rekening Perjalanan Dinas.

## Menjalankan (butuh Node.js 22+ dan MySQL)
```bash
npm run install:all          # sekali saja
npm start                    # build web + jalankan server di http://localhost:3001
```
Database baru: impor dulu `database/dbper21102026.sql` ke MySQL, lalu salin `server/.env.example` menjadi `server/.env`.

Akun awal (`tulus`, `superuser`, `pep`) dibuat otomatis bila belum ada, dengan password acak yang dicetak **sekali** di console server (atau isi env `SEED_PASSWORD`). Akun dari file SQL memakai password lama — server memberi peringatan di console bila ada akun yang masih memakai password umum; **segera ganti** lewat tombol Password.

`server/data/secret.key` (kunci tanda tangan sesi) dibuat otomatis, tidak di-commit. Di produksi, isi env `APP_SECRET`.

Mode pengembangan: `npm run dev:server` dan `npm run dev:web` (http://localhost:5173).

## Deploy ke server kantor / VPS
```bash
npm run install:all && npm run build
PORT=3001 APP_SECRET=<string-acak-panjang> node server/index.js     # atau pm2 start server/index.js
```
## Konfigurasi Database (MySQL Laragon)
Aplikasi terhubung ke MySQL (Laragon):
- Host: `127.0.0.1` (Port: `3306`)
- User: `root`
- Password: *(kosong)*
- Database: `db_spj_proc`

Konfigurasi dapat diatur melalui file `server/.env`:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=db_spj_proc
PORT=3001
```

## Struktur
- `server/` — Express + MySQL (`mysql2/promise`), pembuat dokumen (`lib/docs.js`: `docx` + `pdfkit`), impor Excel.
- `web/` — React + Vite + Tailwind.
