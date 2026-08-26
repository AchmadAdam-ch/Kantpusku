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

// Cek apakah username sudah dipakai
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);

if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Username sudah terdaftar! Gunakan nama lain.']);
    exit;
}

// Simpan password dalam bentuk hash, bukan plain text
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
$stmt->execute([$username, $hashedPassword]);

echo json_encode(['success' => true, 'message' => 'Registrasi akun Kantpusku berhasil!']);
