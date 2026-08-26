<?php
// ==========================================
// STATUS ANTREAN REAL-TIME
// Dipanggil berkala (polling) oleh halaman tiket pasien untuk mengetahui
// status terkini ("menunggu" / "dipanggil" / "selesai") dan sisa waktu
// countdown-nya. Setiap request juga men-trigger mesin antrean supaya
// perpindahan status terjadi otomatis walau tidak ada admin yang mengklik apapun.
// ==========================================
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/antrean_engine.php';
header('Content-Type: application/json');

$antreanId = intval($_GET['id'] ?? 0);

if ($antreanId <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID antrean tidak valid.']);
    exit;
}

$stmt = $pdo->prepare('SELECT puskesmas_id, nama_poli FROM antrean WHERE id = ?');
$stmt->execute([$antreanId]);
$antrean = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$antrean) {
    echo json_encode(['success' => false, 'message' => 'Data antrean tidak ditemukan.']);
    exit;
}

try {
    $pdo->beginTransaction();
    prosesAntreanPoli($pdo, (int) $antrean['puskesmas_id'], $antrean['nama_poli']);
    $info = ambilInfoAntrean($pdo, $antreanId);
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Gagal memproses status: ' . $e->getMessage()]);
    exit;
}

echo json_encode(['success' => true] + $info);
