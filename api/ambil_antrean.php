<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$puskesmasId = intval($data['puskesmas_id'] ?? 0);
$namaPoli = trim($data['nama_poli'] ?? '');
$namaPasien = trim($data['nama_pasien'] ?? '');
$keluhan = trim($data['keluhan'] ?? '');

if ($puskesmasId <= 0 || $namaPoli === '' || $namaPasien === '') {
    echo json_encode(['success' => false, 'message' => 'Data antrean tidak lengkap.']);
    exit;
}

// Ambil data puskesmas untuk ditampilkan di tiket
$stmt = $pdo->prepare('SELECT nama FROM puskesmas WHERE id = ?');
$stmt->execute([$puskesmasId]);
$puskesmas = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$puskesmas) {
    echo json_encode(['success' => false, 'message' => 'Puskesmas tidak ditemukan.']);
    exit;
}

// Hitung nomor antrean berikutnya khusus untuk kombinasi puskesmas + poli tersebut
$stmt = $pdo->prepare('SELECT MAX(nomor_antrean) AS max_nomor FROM antrean WHERE puskesmas_id = ? AND nama_poli = ?');
$stmt->execute([$puskesmasId, $namaPoli]);
$hasil = $stmt->fetch(PDO::FETCH_ASSOC);
$nomorBaru = ($hasil['max_nomor'] ?? 0) + 1;

// Simpan antrean baru ke database
$stmt = $pdo->prepare('INSERT INTO antrean (puskesmas_id, nama_poli, nama_pasien, keluhan, nomor_antrean) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$puskesmasId, $namaPoli, $namaPasien, $keluhan, $nomorBaru]);

echo json_encode([
    'success' => true,
    'message' => "Berhasil mendaftar! Nomor Antrean Anda adalah: $nomorBaru",
    'tiket' => [
        'puskesmas' => $puskesmas['nama'],
        'poli' => $namaPoli,
        'pasien' => $namaPasien,
        'nomor' => $nomorBaru,
        'waktu' => date('H:i')
    ]
]);
