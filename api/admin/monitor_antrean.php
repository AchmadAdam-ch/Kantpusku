<?php
// ==========================================
// MONITORING ANTREAN UNTUK ADMIN
// Menjalankan mesin antrean untuk setiap poli, lalu mengembalikan daftar
// pasien "Sedang Dipanggil" vs "Menunggu" per poli, real-time.
// ==========================================
require_once __DIR__ . '/_guard.php'; // wajib login sebagai admin
require_once __DIR__ . '/../antrean_engine.php';

$stmtPoli = $pdo->query(
    'SELECT p.id AS puskesmas_id, p.nama AS nama_puskesmas, pl.nama_poli
     FROM poli pl
     JOIN puskesmas p ON p.id = pl.puskesmas_id
     ORDER BY p.nama, pl.nama_poli'
);
$daftarPoli = $stmtPoli->fetchAll(PDO::FETCH_ASSOC);

$hasil = [];

foreach ($daftarPoli as $poli) {
    $puskesmasId = (int) $poli['puskesmas_id'];
    $namaPoli = $poli['nama_poli'];

    try {
        $pdo->beginTransaction();
        prosesAntreanPoli($pdo, $puskesmasId, $namaPoli);
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
    }

    $batasScope = ambilBatasWaktuScope($pdo, $puskesmasId, $namaPoli);

    $stmtDipanggil = $pdo->prepare(
        "SELECT nomor_antrean, nama_pasien, mulai_dipanggil_at FROM antrean
         WHERE puskesmas_id = ? AND nama_poli = ? AND status = 'dipanggil' AND created_at > ?
         LIMIT 1"
    );
    $stmtDipanggil->execute([$puskesmasId, $namaPoli, $batasScope]);
    $dipanggil = $stmtDipanggil->fetch(PDO::FETCH_ASSOC);

    $stmtMenunggu = $pdo->prepare(
        "SELECT nomor_antrean, nama_pasien FROM antrean
         WHERE puskesmas_id = ? AND nama_poli = ? AND status = 'menunggu' AND created_at > ?
         ORDER BY nomor_antrean ASC"
    );
    $stmtMenunggu->execute([$puskesmasId, $namaPoli, $batasScope]);
    $menunggu = $stmtMenunggu->fetchAll(PDO::FETCH_ASSOC);

    $infoDipanggil = null;
    if ($dipanggil) {
        $selesaiPada = strtotime($dipanggil['mulai_dipanggil_at']) + DURASI_LAYANAN_DETIK;
        $infoDipanggil = [
            'nomor' => (int) $dipanggil['nomor_antrean'],
            'pasien' => $dipanggil['nama_pasien'],
            'sisa_detik' => max(0, $selesaiPada - time()),
        ];
    }

    $hasil[] = [
        'puskesmas_id' => $puskesmasId,
        'nama_puskesmas' => $poli['nama_puskesmas'],
        'nama_poli' => $namaPoli,
        'dipanggil' => $infoDipanggil,
        'menunggu' => array_map(function ($row) {
            return ['nomor' => (int) $row['nomor_antrean'], 'pasien' => $row['nama_pasien']];
        }, $menunggu),
    ];
}

echo json_encode(['success' => true, 'data' => $hasil]);
