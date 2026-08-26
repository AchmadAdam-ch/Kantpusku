<?php
// ==========================================
// MUAT KREDENSIAL SENSITIF DARI FILE .env
// Password SMTP dan kredensial sensitif lain TIDAK BOLEH ditulis langsung
// di kode / ikut ter-commit ke Git. Salin ".env.example" menjadi ".env" lalu
// isi sesuai kredensial Anda sendiri (file ".env" sudah masuk .gitignore).
// ==========================================
function muatEnv(string $path): void
{
    if (!file_exists($path)) {
        return;
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $baris) {
        $baris = trim($baris);
        if ($baris === '' || str_starts_with($baris, '#')) {
            continue;
        }
        [$key, $value] = array_pad(explode('=', $baris, 2), 2, '');
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        if ($key !== '' && getenv($key) === false) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}
muatEnv(__DIR__ . '/.env');

// ==========================================
// SET TIMEZONE KE WIB (Asia/Jakarta)
// Tanpa ini, fungsi date()/time() PHP memakai timezone default server (biasanya UTC)
// sehingga jam yang tercetak di tiket antrean tidak sesuai waktu Indonesia
// ==========================================
date_default_timezone_set('Asia/Jakarta');

// ==========================================
// KONEKSI DATABASE (PDO MySQL)
// ==========================================
// Default XAMPP: host=localhost, user=root, password kosong
// Sesuaikan jika konfigurasi XAMPP/LAMPP Anda berbeda

$host = 'localhost';
$dbname = 'kantpusku_db';
$dbuser = 'root';
$dbpass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $dbuser, $dbpass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal: ' . $e->getMessage()]);
    exit;
}

// Mulai session PHP (dipakai untuk menyimpan status login, menggantikan sessionStorage)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}