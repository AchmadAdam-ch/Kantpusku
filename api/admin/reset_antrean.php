<?php
require_once __DIR__ . '/_guard.php'; // wajib login sebagai admin

$data = json_decode(file_get_contents('php://input'), true);
$puskesmasId = intval($data['puskesmas_id'] ?? 0);
$namaPoli = trim($data['nama_poli'] ?? '');

if ($puskesmasId <= 0 || $namaPoli === '') {
    echo json_encode(['success' => false, 'message' => 'Puskesmas dan poli wajib dipilih.']);
    exit;
}

// Catat waktu reset. Data antrean lama TIDAK dihapus (tetap aman sebagai riwayat),
// tapi mulai sekarang nomor antrean untuk poli ini dihitung ulang dari 1
// (lihat logikanya di api/ambil_antrean.php).
$stmt = $pdo->prepare(
    'INSERT INTO reset_antrean_log (puskesmas_id, nama_poli, direset_oleh) VALUES (?, ?, ?)'
);
$stmt->execute([$puskesmasId, $namaPoli, $_SESSION['username']]);

echo json_encode([
    'success' => true,
    'message' => "Nomor antrean untuk \"$namaPoli\" berhasil direset. Pendaftar berikutnya akan mulai dari nomor 1."
]);
