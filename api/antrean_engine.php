<?php
// ==========================================
// MESIN ANTREAN
// Satu-satunya tempat yang mengatur logika waktu & perpindahan status
// "Menunggu" -> "Sedang Dipanggil" -> "Selesai", supaya konsisten dipakai
// dari mana saja (form pendaftaran, polling countdown, dashboard admin).
// ==========================================

const DURASI_LAYANAN_DETIK = 5 * 60; // Jatah waktu 5 menit per nomor antrean, rata untuk semua poli

/**
 * Menentukan batas waktu "scope" antrean yang masih berlaku untuk puskesmas + poli
 * tertentu: sejak reset manual TERAKHIR hari ini (kalau admin pernah menekan tombol
 * reset), atau sejak jam 00:00 hari ini kalau belum pernah direset sama sekali.
 * Nomor & status dari sebelum batas ini dianggap riwayat lama dan diabaikan.
 */
function ambilBatasWaktuScope(PDO $pdo, int $puskesmasId, string $namaPoli): string
{
    $stmt = $pdo->prepare(
        'SELECT MAX(reset_at) AS waktu_reset FROM reset_antrean_log
         WHERE puskesmas_id = ? AND nama_poli = ? AND DATE(reset_at) = CURDATE()'
    );
    $stmt->execute([$puskesmasId, $namaPoli]);
    $waktuReset = $stmt->fetch(PDO::FETCH_ASSOC)['waktu_reset'];

    return $waktuReset ?: date('Y-m-d 00:00:00');
}

/**
 * INTI MESIN ANTREAN untuk satu poli.
 * - Kalau pasien "Sedang Dipanggil" sudah lewat 5 menit -> ubah jadi "Selesai".
 * - Kalau tidak ada yang "Sedang Dipanggil" tapi ada yang "Menunggu" -> panggil
 *   yang paling depan (nomor terkecil).
 * - Diulang (loop) karena bisa saja beberapa slot 5 menit terlewat sekaligus,
 *   misalnya tidak ada satupun request yang masuk selama 20 menit.
 *
 * Dipanggil di dalam transaksi (beginTransaction/commit) oleh caller, dengan
 * SELECT ... FOR UPDATE agar aman dari race condition saat banyak orang
 * mengecek status bersamaan.
 */
function prosesAntreanPoli(PDO $pdo, int $puskesmasId, string $namaPoli): void
{
    $batasScope = ambilBatasWaktuScope($pdo, $puskesmasId, $namaPoli);

    // Pengaman supaya tidak infinite loop kalau ada data yang tidak wajar
    for ($i = 0; $i < 500; $i++) {
        $stmtDipanggil = $pdo->prepare(
            "SELECT id, mulai_dipanggil_at FROM antrean
             WHERE puskesmas_id = ? AND nama_poli = ? AND status = 'dipanggil'
               AND created_at > ?
             ORDER BY nomor_antrean ASC LIMIT 1 FOR UPDATE"
        );
        $stmtDipanggil->execute([$puskesmasId, $namaPoli, $batasScope]);
        $dipanggil = $stmtDipanggil->fetch(PDO::FETCH_ASSOC);

        if ($dipanggil) {
            $selesaiPada = strtotime($dipanggil['mulai_dipanggil_at']) + DURASI_LAYANAN_DETIK;
            if (time() < $selesaiPada) {
                return; // Masih dalam jatah 5 menit, tidak ada yang perlu diubah
            }
            $pdo->prepare("UPDATE antrean SET status = 'selesai' WHERE id = ?")
                ->execute([$dipanggil['id']]);
            continue; // Cek lagi: panggil pasien menunggu berikutnya
        }

        $stmtMenunggu = $pdo->prepare(
            "SELECT id FROM antrean
             WHERE puskesmas_id = ? AND nama_poli = ? AND status = 'menunggu'
               AND created_at > ?
             ORDER BY nomor_antrean ASC LIMIT 1 FOR UPDATE"
        );
        $stmtMenunggu->execute([$puskesmasId, $namaPoli, $batasScope]);
        $menunggu = $stmtMenunggu->fetch(PDO::FETCH_ASSOC);

        if (!$menunggu) {
            return; // Tidak ada yang dipanggil maupun menunggu -> poli kosong
        }

        $pdo->prepare("UPDATE antrean SET status = 'dipanggil', mulai_dipanggil_at = NOW() WHERE id = ?")
            ->execute([$menunggu['id']]);
        return; // Satu pasien baru saja mulai dipanggil, cukup sampai di sini
    }
}

/**
 * Info status realtime satu baris antrean (dipakai untuk countdown di sisi pasien):
 * status terkini, sisa detik (sisa dilayani ATAU estimasi menunggu), dan posisi antrean.
 * WAJIB dipanggil SETELAH prosesAntreanPoli() supaya datanya sudah paling baru.
 */
function ambilInfoAntrean(PDO $pdo, int $antreanId): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM antrean WHERE id = ?');
    $stmt->execute([$antreanId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return null;
    }

    if ($row['status'] === 'selesai') {
        return [
            'status' => 'selesai',
            'sisa_detik' => 0,
            'posisi_menunggu' => 0,
            'nomor_antrean' => (int) $row['nomor_antrean'],
        ];
    }

    $puskesmasId = (int) $row['puskesmas_id'];
    $namaPoli = $row['nama_poli'];
    $batasScope = ambilBatasWaktuScope($pdo, $puskesmasId, $namaPoli);

    if ($row['status'] === 'dipanggil') {
        $selesaiPada = strtotime($row['mulai_dipanggil_at']) + DURASI_LAYANAN_DETIK;
        return [
            'status' => 'dipanggil',
            'sisa_detik' => max(0, $selesaiPada - time()),
            'posisi_menunggu' => 0,
            'nomor_antrean' => (int) $row['nomor_antrean'],
        ];
    }

    // status = 'menunggu': hitung berapa pasien menunggu di depannya,
    // ditambah sisa waktu pasien yang sedang dipanggil saat ini (kalau ada)
    $stmtDepan = $pdo->prepare(
        "SELECT COUNT(*) AS jumlah FROM antrean
         WHERE puskesmas_id = ? AND nama_poli = ? AND status = 'menunggu'
           AND created_at > ? AND nomor_antrean < ?"
    );
    $stmtDepan->execute([$puskesmasId, $namaPoli, $batasScope, $row['nomor_antrean']]);
    $jumlahDepan = (int) $stmtDepan->fetch(PDO::FETCH_ASSOC)['jumlah'];

    $stmtDipanggilSaatIni = $pdo->prepare(
        "SELECT mulai_dipanggil_at FROM antrean
         WHERE puskesmas_id = ? AND nama_poli = ? AND status = 'dipanggil' AND created_at > ?
         LIMIT 1"
    );
    $stmtDipanggilSaatIni->execute([$puskesmasId, $namaPoli, $batasScope]);
    $sedangDipanggil = $stmtDipanggilSaatIni->fetch(PDO::FETCH_ASSOC);

    $sisaDipanggilSaatIni = 0;
    if ($sedangDipanggil) {
        $selesaiPada = strtotime($sedangDipanggil['mulai_dipanggil_at']) + DURASI_LAYANAN_DETIK;
        $sisaDipanggilSaatIni = max(0, $selesaiPada - time());
    }

    return [
        'status' => 'menunggu',
        'sisa_detik' => ($jumlahDepan * DURASI_LAYANAN_DETIK) + $sisaDipanggilSaatIni,
        'posisi_menunggu' => $jumlahDepan + 1,
        'nomor_antrean' => (int) $row['nomor_antrean'],
    ];
}
