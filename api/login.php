<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if ($username === '' || $password === '') {
    echo json_encode(['success' => false, 'message' => 'Username dan password wajib diisi.']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, username, password, role FROM users WHERE username = ?');
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && password_verify($password, $user['password'])) {
    // Simpan status login di session PHP (menggantikan sessionStorage)
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role']; // 'user' atau 'admin', dipakai untuk membedakan akses

    echo json_encode([
        'success' => true,
        'message' => 'Login Berhasil! Selamat datang di Kantpusku.',
        'username' => $user['username'],
        'role' => $user['role']
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Username atau Password yang Anda masukkan salah!']);
}
