<?php
require_once __DIR__ . '/_guard.php'; // wajib login sebagai admin

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID puskesmas tidak valid.']);
    exit;
}

$stmt = $pdo->prepare('SELECT nama FROM puskesmas WHERE id = ?');
$stmt->execute([$id]);
$puskesmas = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$puskesmas) {
    echo json_encode(['success' => false, 'message' => 'Puskesmas tidak ditemukan.']);
    exit;
}

// Poli, riwayat antrean, dan log reset milik puskesmas ini ikut terhapus
// otomatis lewat ON DELETE CASCADE di database.
$pdo->prepare('DELETE FROM puskesmas WHERE id = ?')->execute([$id]);

echo json_encode([
    'success' => true,
    'message' => "Puskesmas \"{$puskesmas['nama']}\" beserta seluruh poli dan riwayat antreannya berhasil dihapus."
]);
