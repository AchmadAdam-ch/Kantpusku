<?php
// ==========================================
// KONEKSI DATABASE (PDO MySQL)
// ==========================================
// Default XAMPP: host=localhost, user=root, password kosong
// Sesuaikan jika konfigurasi XAMPP/LAMPP Anda berbeda

$host = 'localhost';
$dbname = 'kantpusku_db';
$dbuser = 'root';
$dbpass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $dbuser, $dbpass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal: ' . $e->getMessage()]);
    exit;
}

// Mulai session PHP (dipakai untuk menyimpan status login, menggantikan sessionStorage)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
