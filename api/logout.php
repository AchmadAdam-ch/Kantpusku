<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

session_unset();
session_destroy();

echo json_encode(['success' => true, 'message' => 'Anda telah berhasil logout.']);
