<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'loggedIn' => true,
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'] ?? 'user'
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}
