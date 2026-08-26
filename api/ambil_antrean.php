<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/antrean_engine.php';
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

try {
    $pdo->beginTransaction();

    // 1. Proses dulu mesin antrean (selesaikan yang sudah lewat 5 menit,
    //    panggil giliran berikutnya) supaya kondisi poli ini paling terbaru
    //    sebelum kita putuskan status pasien baru.
    prosesAntreanPoli($pdo, $puskesmasId, $namaPoli);

    // 2. Hitung nomor antrean berikutnya. Realistis seperti antrean sungguhan:
    //    dihitung ulang dari 1 setiap hari (berpatokan tanggal hari ini), DAN
    //    kalau admin pernah menekan tombol "Reset Antrean" hari ini, hanya
    //    antrean SETELAH waktu reset itu yang dihitung (data lama tidak dihapus).
    $batasScope = ambilBatasWaktuScope($pdo, $puskesmasId, $namaPoli);

    $stmtMax = $pdo->prepare(
        'SELECT MAX(nomor_antrean) AS max_nomor FROM antrean
         WHERE puskesmas_id = ? AND nama_poli = ? AND created_at > ?'
    );
    $stmtMax->execute([$puskesmasId, $namaPoli, $batasScope]);
    $nomorBaru = ((int) ($stmtMax->fetch(PDO::FETCH_ASSOC)['max_nomor'] ?? 0)) + 1;

    // 3. Tentukan status awal: kalau poli ini sedang benar-benar kosong (tidak ada
    //    yang "menunggu" maupun "sedang dipanggil" dalam scope hari ini), pasien
    //    baru langsung masuk poli (status "dipanggil", countdown = 0 menit).
    //    Kalau tidak, pasien masuk barisan "menunggu".
    $stmtAktif = $pdo->prepare(
        "SELECT COUNT(*) AS jumlah FROM antrean
         WHERE puskesmas_id = ? AND nama_poli = ? AND created_at > ?
           AND status IN ('menunggu', 'dipanggil')"
    );
    $stmtAktif->execute([$puskesmasId, $namaPoli, $batasScope]);
    $poliSedangKosong = ((int) $stmtAktif->fetch(PDO::FETCH_ASSOC)['jumlah']) === 0;

    if ($poliSedangKosong) {
        $stmtInsert = $pdo->prepare(
            'INSERT INTO antrean (puskesmas_id, nama_poli, nama_pasien, keluhan, nomor_antrean, status, mulai_dipanggil_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmtInsert->execute([$puskesmasId, $namaPoli, $namaPasien, $keluhan, $nomorBaru, 'dipanggil']);
    } else {
        $stmtInsert = $pdo->prepare(
            'INSERT INTO antrean (puskesmas_id, nama_poli, nama_pasien, keluhan, nomor_antrean, status)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmtInsert->execute([$puskesmasId, $namaPoli, $namaPasien, $keluhan, $nomorBaru, 'menunggu']);
    }
    $antreanId = (int) $pdo->lastInsertId();

    // 4. Ambil info status/countdown final untuk dikirim balik ke pasien
    $info = ambilInfoAntrean($pdo, $antreanId);

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Gagal mendaftarkan antrean: ' . $e->getMessage()]);
    exit;
}

$pesanStatus = $info['status'] === 'dipanggil'
    ? "Berhasil mendaftar! Poli sedang kosong, silakan langsung masuk (Nomor $nomorBaru)."
    : "Berhasil mendaftar! Nomor Antrean Anda adalah: $nomorBaru";

echo json_encode([
    'success' => true,
    'message' => $pesanStatus,
    'tiket' => [
        'id' => $antreanId,
        'puskesmas' => $puskesmas['nama'],
        'poli' => $namaPoli,
        'pasien' => $namaPasien,
        'nomor' => $nomorBaru,
        'waktu' => date('H:i'),
        'status' => $info['status'],
        'sisa_detik' => $info['sisa_detik'],
        'posisi_menunggu' => $info['posisi_menunggu'],
    ]
]);
