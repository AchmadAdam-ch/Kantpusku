<?php
require_once __DIR__ . '/_guard.php'; // wajib login sebagai admin

$data = json_decode(file_get_contents('php://input'), true);

$nama = trim($data['nama'] ?? '');
$alamat = trim($data['alamat'] ?? '');
$gambar = trim($data['gambar'] ?? '');
$info = trim($data['info'] ?? '');
$daftarPoli = $data['poli'] ?? []; // contoh: ["Poli Umum", "Poli Gigi"]

if ($nama === '' || $alamat === '') {
    echo json_encode(['success' => false, 'message' => 'Nama dan alamat puskesmas wajib diisi.']);
    exit;
}

if (!is_array($daftarPoli) || count($daftarPoli) === 0) {
    echo json_encode(['success' => false, 'message' => 'Minimal isi 1 poli untuk puskesmas ini.']);
    exit;
}

// Default gambar kalau admin tidak isi link gambar
if ($gambar === '') {
    $gambar = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80';
}

try {
    $pdo->beginTransaction();

    // 1. Simpan data puskesmas
    $stmt = $pdo->prepare('INSERT INTO puskesmas (nama, alamat, gambar, info) VALUES (?, ?, ?, ?)');
    $stmt->execute([$nama, $alamat, $gambar, $info]);
    $puskesmasId = $pdo->lastInsertId();

    // 2. Simpan tiap poli yang dimasukkan admin
    $stmtPoli = $pdo->prepare('INSERT INTO poli (puskesmas_id, nama_poli) VALUES (?, ?)');
    $jumlahPoli = 0;
    foreach ($daftarPoli as $namaPoli) {
        $namaPoli = trim($namaPoli);
        if ($namaPoli !== '') {
            $stmtPoli->execute([$puskesmasId, $namaPoli]);
            $jumlahPoli++;
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Puskesmas \"$nama\" berhasil ditambahkan beserta $jumlahPoli poli.",
        'puskesmas_id' => $puskesmasId
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan: ' . $e->getMessage()]);
}
