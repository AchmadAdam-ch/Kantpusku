<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

$stmtPuskesmas = $pdo->query('SELECT id, nama, alamat, gambar FROM puskesmas ORDER BY id');
$daftarPuskesmas = $stmtPuskesmas->fetchAll(PDO::FETCH_ASSOC);

// Untuk setiap puskesmas, ambil daftar poli-nya
foreach ($daftarPuskesmas as &$puskesmas) {
    $stmtPoli = $pdo->prepare('SELECT nama_poli FROM poli WHERE puskesmas_id = ?');
    $stmtPoli->execute([$puskesmas['id']]);
    $puskesmas['poli'] = $stmtPoli->fetchAll(PDO::FETCH_COLUMN);
}
unset($puskesmas);

echo json_encode(['success' => true, 'data' => $daftarPuskesmas]);
