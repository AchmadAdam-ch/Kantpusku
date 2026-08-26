<?php
// ==========================================
// PENJAGA AKSES ADMIN
// File ini di-include di AWAL setiap file api/admin/*.php
// Fungsinya: menolak request kalau yang login bukan admin.
// ==========================================
require_once __DIR__ . '/../../config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Akses ditolak. Halaman ini khusus Admin.']);
    exit;
}
