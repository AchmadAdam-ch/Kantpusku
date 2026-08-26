-- ==========================================
-- DATABASE: kantpusku_db
-- Import file ini lewat phpMyAdmin (XAMPP) sebelum menjalankan aplikasi
--
-- CATATAN UNTUK YANG SUDAH PERNAH IMPORT VERSI LAMA:
-- Kalau database kantpusku_db kamu SUDAH ADA dan sudah ada isinya,
-- jangan import ulang dari atas (nanti kena error "table already exists").
-- Cukup jalankan bagian "MIGRASI UNTUK DATABASE LAMA" di paling bawah file ini.
-- Kalau kamu mulai dari NOL (database baru), tinggal import file ini semuanya.
-- ==========================================

CREATE DATABASE IF NOT EXISTS kantpusku_db;
USE kantpusku_db;

-- ==========================================
-- TABEL USERS (untuk Login & Register)
-- Kolom "role" membedakan akun biasa (user) dan akun admin (admin)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- disimpan dalam bentuk hash (password_hash)
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABEL PUSKESMAS
-- ==========================================
CREATE TABLE IF NOT EXISTS puskesmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    alamat VARCHAR(255) NOT NULL,
    gambar VARCHAR(255),
    info TEXT -- info tambahan (jam buka, kontak, dsb), diisi oleh admin
);

-- ==========================================
-- TABEL POLI (setiap Puskesmas punya banyak Poli)
-- ==========================================
CREATE TABLE IF NOT EXISTS poli (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puskesmas_id INT NOT NULL,
    nama_poli VARCHAR(50) NOT NULL,
    FOREIGN KEY (puskesmas_id) REFERENCES puskesmas(id) ON DELETE CASCADE
);

-- ==========================================
-- TABEL ANTREAN (riwayat & nomor urut antrean)
-- Nomor urut dihitung ulang otomatis tiap hari (lihat api/ambil_antrean.php)
-- karena berpatokan pada created_at = hari ini
--
-- Kolom "status" membedakan 3 kondisi nyata sebuah nomor antrean:
--   'menunggu'  -> pasien belum masuk poli, sedang mengantre
--   'dipanggil' -> pasien sedang dilayani (dapat jatah waktu 5 menit,
--                  dihitung dari "mulai_dipanggil_at")
--   'selesai'   -> 5 menit sudah lewat, pasien dianggap selesai dilayani
-- Lihat logikanya di api/antrean_engine.php
-- ==========================================
CREATE TABLE IF NOT EXISTS antrean (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puskesmas_id INT NOT NULL,
    nama_poli VARCHAR(50) NOT NULL,
    nama_pasien VARCHAR(100) NOT NULL,
    keluhan TEXT,
    nomor_antrean INT NOT NULL,
    status ENUM('menunggu', 'dipanggil', 'selesai') NOT NULL DEFAULT 'menunggu',
    mulai_dipanggil_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (puskesmas_id) REFERENCES puskesmas(id) ON DELETE CASCADE
);

-- ==========================================
-- TABEL RESET LOG
-- Dipakai kalau ADMIN menekan tombol "Reset Antrean" di tengah hari.
-- Kita TIDAK menghapus data antrean lama (biar riwayat tetap aman),
-- cukup catat "jam reset"-nya di sini. Nomor antrean berikutnya akan
-- dihitung ulang mulai dari 1, terhitung sejak waktu reset ini.
-- ==========================================
CREATE TABLE IF NOT EXISTS reset_antrean_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puskesmas_id INT NOT NULL,
    nama_poli VARCHAR(50) NOT NULL,
    reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    direset_oleh VARCHAR(50), -- username admin yang menekan reset
    FOREIGN KEY (puskesmas_id) REFERENCES puskesmas(id) ON DELETE CASCADE
);

-- ==========================================
-- SEED DATA: Akun Admin
-- Username: Admin
-- Password: 123456  (sudah dalam bentuk hash bcrypt, bukan teks polos)
-- ==========================================
INSERT INTO users (username, password, role)
VALUES ('Admin', '$2y$10$rUl4tLKvdT6otJ1H9lqYo.eHcOzCDFFss1E.h7B/qAi1p/AF9sEDi', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin';

-- ==========================================
-- SEED DATA: Puskesmas & Poli (sama seperti data lama di dashboard.js)
-- ==========================================
INSERT INTO puskesmas (id, nama, alamat, gambar) VALUES
(1, 'Puskesmas Melati', 'Jl. Kesehatan No. 1, Jakarta', 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?auto=format&fit=crop&w=400&q=80'),
(2, 'Puskesmas Mawar', 'Jl. Kesembuhan No. 2, Bandung', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80'),
(3, 'Puskesmas Anggrek', 'Jl. Kebugaran No. 3, Surabaya', 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=400&q=80')
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

INSERT INTO poli (puskesmas_id, nama_poli) VALUES
(1, 'Poli Umum'), (1, 'Poli Gigi'), (1, 'Poli KIA'),
(2, 'Poli Umum'), (2, 'Poli Anak'),
(3, 'Poli Umum'), (3, 'Poli Gigi'), (3, 'Poli Mata'), (3, 'Poli Gizi');


-- ==========================================
-- MIGRASI UNTUK DATABASE LAMA
-- Jalankan baris-baris di bawah ini SATU PER SATU lewat tab "SQL" di
-- phpMyAdmin HANYA JIKA database kantpusku_db kamu sudah ada isinya
-- sebelumnya (skip bagian CREATE TABLE / INSERT di atas).
-- ==========================================

-- ALTER TABLE users ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user';
-- ALTER TABLE puskesmas ADD COLUMN info TEXT;
-- ALTER TABLE antrean ADD COLUMN status ENUM('menunggu','dipanggil','selesai') NOT NULL DEFAULT 'menunggu';
-- ALTER TABLE antrean ADD COLUMN mulai_dipanggil_at TIMESTAMP NULL DEFAULT NULL;
-- -- Tandai semua data antrean LAMA (sebelum update ini) sebagai 'selesai' supaya
-- -- tidak ikut diproses ulang oleh mesin antrean yang baru:
-- UPDATE antrean SET status = 'selesai' WHERE status = 'menunggu' AND mulai_dipanggil_at IS NULL;
-- CREATE TABLE IF NOT EXISTS reset_antrean_log (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     puskesmas_id INT NOT NULL,
--     nama_poli VARCHAR(50) NOT NULL,
--     reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     direset_oleh VARCHAR(50),
--     FOREIGN KEY (puskesmas_id) REFERENCES puskesmas(id) ON DELETE CASCADE
-- );
-- INSERT INTO users (username, password, role)
-- VALUES ('Admin', '$2y$10$rUl4tLKvdT6otJ1H9lqYo.eHcOzCDFFss1E.h7B/qAi1p/AF9sEDi', 'admin')
-- ON DUPLICATE KEY UPDATE role = 'admin';
