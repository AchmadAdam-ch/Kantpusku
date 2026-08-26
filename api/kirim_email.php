<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

// ==========================================
// Library pihak ketiga: PHPMailer
// Diinstall lewat Composer, lihat README-EMAIL-WA.md untuk caranya
// ==========================================
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$data = json_decode(file_get_contents('php://input'), true);
$emailTujuan = trim($data['email'] ?? '');
$puskesmas = trim($data['puskesmas'] ?? '');
$poli = trim($data['poli'] ?? '');
$pasien = trim($data['pasien'] ?? '');
$nomor = trim($data['nomor'] ?? '');
$waktu = trim($data['waktu'] ?? '');

if ($emailTujuan === '' || !filter_var($emailTujuan, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Alamat email tidak valid.']);
    exit;
}

// ==========================================
// KONFIGURASI SMTP
// Kredensial diambil dari file .env (lihat config.php), BUKAN ditulis
// langsung di sini, supaya tidak bocor kalau kode ini di-share/di-commit.
// Isi file .env Anda (salin dari .env.example) dengan akun pengirim Anda
// (disarankan pakai App Password Gmail, bukan password akun biasa).
// ==========================================
$smtpHost = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
$smtpUser = getenv('SMTP_USER') ?: '';
$smtpPass = getenv('SMTP_PASS') ?: '';
$smtpPort = (int) (getenv('SMTP_PORT') ?: 587);

if ($smtpUser === '' || $smtpPass === '') {
    echo json_encode(['success' => false, 'message' => 'Konfigurasi SMTP belum diatur di server (.env kosong). Hubungi admin sistem.']);
    exit;
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $smtpPort;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($smtpUser, 'Kantpusku');
    $mail->addAddress($emailTujuan);

    $mail->isHTML(true);
    $mail->Subject = "Tiket Antrean Kantpusku - No. $nomor";
    $mail->Body = "
        <div style='font-family: Arial, sans-serif; max-width: 400px; margin: auto; border: 1px solid #ccc; border-radius: 8px; overflow: hidden;'>
            <div style='background: #0d6efd; color: white; padding: 12px; text-align: center; font-weight: bold;'>TIKET ANTREAN DIGITAL</div>
            <div style='padding: 20px; text-align: center;'>
                <h3 style='color: #0d6efd; margin-bottom: 4px;'>$puskesmas</h3>
                <p style='color: #666; margin-top: 0;'>$poli</p>
                <div style='background: #f5f5f5; border-radius: 6px; padding: 12px; margin: 16px 0;'>
                    <span style='color: #666; font-size: 12px;'>NOMOR URUT ANTREAN</span>
                    <h1 style='color: #198754; margin: 4px 0;'>$nomor</h1>
                </div>
                <h4 style='margin-bottom: 4px;'>$pasien</h4>
                <p style='color: #666; font-size: 13px;'>Waktu Cetak: Hari Ini, Jam $waktu WIB</p>
            </div>
            <div style='background: #f5f5f5; color: #666; font-size: 12px; padding: 10px; text-align: center;'>
                *Harap tunjukkan tiket ini kepada petugas loket.
            </div>
        </div>
    ";

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Tiket berhasil dikirim ke email!']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Gagal mengirim email: ' . $mail->ErrorInfo]);
}
