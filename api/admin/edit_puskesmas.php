<?php
require_once __DIR__ . '/_guard.php'; // wajib login sebagai admin

$data = json_decode(file_get_contents('php://input'), true);

$id = intval($data['id'] ?? 0);
$nama = trim($data['nama'] ?? '');
$alamat = trim($data['alamat'] ?? '');
$gambar = trim($data['gambar'] ?? '');
$info = trim($data['info'] ?? '');
$daftarPoli = $data['poli'] ?? []; // contoh: ["Poli Umum", "Poli Gigi"]

if ($id <= 0 || $nama === '' || $alamat === '') {
    echo json_encode(['success' => false, 'message' => 'ID, nama, dan alamat puskesmas wajib diisi.']);
    exit;
}

if (!is_array($daftarPoli) || count($daftarPoli) === 0) {
    echo json_encode(['success' => false, 'message' => 'Minimal isi 1 poli untuk puskesmas ini.']);
    exit;
}

if ($gambar === '') {
    $gambar = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80';
}

try {
    $pdo->beginTransaction();

    // Pastikan puskesmas-nya memang ada
    $cek = $pdo->prepare('SELECT id FROM puskesmas WHERE id = ?');
    $cek->execute([$id]);
    if (!$cek->fetch()) {
        throw new Exception('Puskesmas tidak ditemukan.');
    }

    // 1. Perbarui data utama puskesmas
    $stmt = $pdo->prepare('UPDATE puskesmas SET nama = ?, alamat = ?, gambar = ?, info = ? WHERE id = ?');
    $stmt->execute([$nama, $alamat, $gambar, $info, $id]);

    // 2. Ganti seluruh daftar poli dengan yang baru. Poli TIDAK terhubung lewat
    //    foreign key ke riwayat antrean (antrean menyimpan nama poli sebagai teks),
    //    jadi mengganti daftar poli di sini aman dan tidak menghapus riwayat lama.
    $pdo->prepare('DELETE FROM poli WHERE puskesmas_id = ?')->execute([$id]);

    $stmtPoli = $pdo->prepare('INSERT INTO poli (puskesmas_id, nama_poli) VALUES (?, ?)');
    $jumlahPoli = 0;
    foreach ($daftarPoli as $namaPoli) {
        $namaPoli = trim($namaPoli);
        if ($namaPoli !== '') {
            $stmtPoli->execute([$id, $namaPoli]);
            $jumlahPoli++;
        }
    }

    if ($jumlahPoli === 0) {
        throw new Exception('Minimal isi 1 poli untuk puskesmas ini.');
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Puskesmas \"$nama\" berhasil diperbarui beserta $jumlahPoli poli."
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Gagal memperbarui: ' . $e->getMessage()]);
}
