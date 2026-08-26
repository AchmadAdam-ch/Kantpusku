# Ringkasan Perubahan - Kantpusku

## 1. Logika Antrean & Countdown Real-Time

**File baru:** `api/antrean_engine.php` — "mesin" tunggal yang mengatur semua logika
waktu, dipakai bersama oleh 3 endpoint lain supaya perilakunya konsisten.

- Tabel `antrean` bertambah 2 kolom: `status` (`menunggu` / `dipanggil` / `selesai`)
  dan `mulai_dipanggil_at`. Lihat `kantpusku.sql` (ada juga skrip migrasi ALTER
  di bagian bawah file untuk database yang sudah terlanjur ada isinya).
- **`api/ambil_antrean.php`**: sekarang menentukan status awal pasien baru.
  Kalau poli benar-benar kosong → langsung `dipanggil` (countdown 0 menit).
  Kalau tidak → `menunggu`, dengan estimasi = (jumlah menunggu di depan × 5 menit)
  + sisa waktu pasien yang sedang dipanggil.
- **`api/status_antrean.php`** (baru): endpoint polling. Setiap kali dipanggil,
  ia menjalankan mesin antrean (auto-selesaikan yang sudah lewat 5 menit +
  auto-panggil berikutnya) lalu mengembalikan status & sisa detik terbaru.
- **`js/antrean.js`**: setelah daftar, halaman tiket menampilkan badge status
  dan angka mundur MM:SS. Detak lokal tiap 1 detik (biar halus), sinkron ke
  server tiap 5 detik (biar akurat & auto-update begitu giliran dipanggil).
- Reset harian otomatis: nomor tetap dihitung berdasarkan `created_at` hari ini,
  jadi mulai jam 00:00 nomor otomatis kembali ke 1 tanpa perlu cron job.

## 2. Panel Admin

- **CRUD Puskesmas lengkap**: `api/admin/edit_puskesmas.php` dan
  `api/admin/hapus_puskesmas.php` (baru) melengkapi `tambah_puskesmas.php` yang
  sudah ada. Tombol ✏️ Edit dan 🗑️ Hapus muncul di tiap kartu puskesmas
  (`admin_dashboard.html` + `js/admin.js`), edit lewat modal Bootstrap.
  Menghapus puskesmas otomatis menghapus poli & riwayat antreannya (cascade).
- **Reset manual** ("Reset Antrean") — sudah ada sebelumnya per-poli, tetap
  dipertahankan, sekarang terintegrasi dengan mesin antrean yang baru.
- **Dashboard monitoring real-time** (baru): `api/admin/monitor_antrean.php` +
  bagian "📡 Monitoring Antrean Real-Time" di `admin_dashboard.html`, auto-refresh
  tiap 5 detik, menampilkan siapa yang sedang dipanggil (+ sisa waktu) vs siapa
  saja yang masih menunggu, per poli.

## 3. Keamanan: Password SMTP Tidak Lagi Hardcoded

- Kredensial SMTP dipindah dari `api/kirim_email.php` ke file `.env` (baru,
  sudah dimasukkan ke `.gitignore` sehingga tidak akan ter-commit ke Git).
- `config.php` sekarang memuat `.env` secara otomatis di awal (fungsi `muatEnv()`).
- `.env.example` disediakan sebagai contoh/template untuk developer lain.
- Nilai SMTP yang tadinya hardcoded sudah dipindahkan apa adanya ke `.env` Anda
  supaya aplikasi tetap langsung jalan — cukup jangan sampai file `.env` ini
  ikut ter-upload/ter-commit ke tempat publik.

## Yang Perlu Anda Lakukan Setelah Import Ulang

1. **Database sudah ada isinya?** Jalankan bagian "MIGRASI UNTUK DATABASE LAMA"
   di paling bawah `kantpusku.sql` (ada tambahan 2 baris ALTER TABLE baru untuk
   kolom status/mulai_dipanggil_at).
2. **Database baru dari nol?** Tinggal import `kantpusku.sql` seperti biasa.
3. Pastikan file `.env` ikut di-upload ke server (isinya TIDAK boleh publik),
   dan jangan commit file itu ke Git — `.gitignore` sudah menanganinya.
