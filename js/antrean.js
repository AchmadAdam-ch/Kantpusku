// ==========================================
// 1. TANGKAP ID PUSKESMAS DARI URL PARAMETER
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const puskesmasId = parseInt(urlParams.get('id'));

let puskesmasTerpilih = null;

// Menyimpan data tiket terakhir yang berhasil dibuat, dipakai untuk PDF/Email/WhatsApp
let tiketTerakhir = null;

// ==========================================
// TUJUAN TETAP UNTUK KIRIM EMAIL & WHATSAPP
// (sesuai ketetapan project, tidak perlu diisi manual oleh pengguna)
// ==========================================
const EMAIL_TUJUAN_TETAP = 'ohd8094@gmail.com';
const WA_TUJUAN_TETAP = '08980500898';

// ==========================================
// 2. AMBIL DATA PUSKESMAS DARI DATABASE (via PHP + MySQL)
// ==========================================
async function muatDataPuskesmas() {
    if (!puskesmasId) {
        alert("Puskesmas tidak valid! Kembali ke Dashboard.");
        window.location.href = "dashboard.html";
        return;
    }

    try {
        const response = await fetch('api/get_puskesmas.php');
        const hasil = await response.json();

        if (!hasil.success) {
            alert("Gagal memuat data puskesmas.");
            window.location.href = "dashboard.html";
            return;
        }

        puskesmasTerpilih = hasil.data.find(p => parseInt(p.id) === puskesmasId);

        if (!puskesmasTerpilih) {
            alert("Puskesmas tidak valid! Kembali ke Dashboard.");
            window.location.href = "dashboard.html";
            return;
        }

        // Tampilkan nama & alamat puskesmas di form
        document.getElementById('namaPuskesmasLabel').textContent = puskesmasTerpilih.nama;
        document.getElementById('alamatPuskesmasLabel').textContent = puskesmasTerpilih.alamat;

        // Isi pilihan poli secara dinamis
        const pilihPoliSelect = document.getElementById('pilihPoli');
        puskesmasTerpilih.poli.forEach(poli => {
            const opsi = document.createElement('option');
            opsi.value = poli;
            opsi.textContent = poli;
            pilihPoliSelect.appendChild(opsi);
        });
    } catch (error) {
        alert("Gagal terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah berjalan.");
        console.error(error);
    }
}
muatDataPuskesmas();

// ==========================================
// 3. SUBMIT FORM ANTREAN KE DATABASE (via PHP + MySQL)
// ==========================================
document.getElementById('formAntrean').addEventListener('submit', async function(e) {
    e.preventDefault(); // Mencegah reload halaman saat disubmit

    const namaPasien = document.getElementById('namaPasien').value;
    const poliTerpilih = document.getElementById('pilihPoli').value;
    const keluhan = document.getElementById('keluhanPasien').value;

    try {
        const response = await fetch('api/ambil_antrean.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                puskesmas_id: puskesmasId,
                nama_poli: poliTerpilih,
                nama_pasien: namaPasien,
                keluhan: keluhan
            })
        });
        const hasil = await response.json();

        if (!hasil.success) {
            alert(hasil.message);
            return;
        }

        const tiket = hasil.tiket;
        tiketTerakhir = tiket; // simpan untuk dipakai fitur Email & WhatsApp

        // Cetak tiket antrean digital di layar
        document.getElementById('tiketPuskesmas').textContent = tiket.puskesmas;
        document.getElementById('tiketPoli').textContent = tiket.poli;
        document.getElementById('tiketPasien').textContent = tiket.pasien;
        document.getElementById('tiketNomor').textContent = tiket.nomor < 10 ? `0${tiket.nomor}` : tiket.nomor;
        document.getElementById('tiketJam').textContent = `Waktu Cetak: Hari Ini, Jam ${tiket.waktu} WIB`;

        // Munculkan Box Tiket Digital
        document.getElementById('boxTiketAntrean').classList.remove('d-none');

        // Mulai countdown real-time berdasarkan status awal dari server
        mulaiCountdown(tiket.id, tiket.status, tiket.sisa_detik, tiket.posisi_menunggu);

        // Reset isi form
        document.getElementById('formAntrean').reset();

        alert(hasil.message);
    } catch (error) {
        alert("Gagal terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah berjalan.");
        console.error(error);
    }
});

// ==========================================
// 4. FITUR PIHAK KETIGA: CETAK TIKET KE PDF (html2pdf.js)
// ==========================================
document.getElementById('btnCetakPdf').addEventListener('click', function() {
    const elemenTiket = document.getElementById('areaCetakTiket');
    const namaFile = `Tiket-Antrean-${document.getElementById('tiketNomor').textContent}.pdf`;

    const opsiPdf = {
        margin: 0.3,
        filename: namaFile,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a5', orientation: 'portrait' }
    };

    html2pdf().set(opsiPdf).from(elemenTiket).save();
});

// ==========================================
// 5. FITUR PIHAK KETIGA: KIRIM TIKET VIA EMAIL (PHPMailer di backend)
// ==========================================
document.getElementById('btnKirimEmail').addEventListener('click', async function() {
    const email = EMAIL_TUJUAN_TETAP;

    if (!tiketTerakhir) {
        alert('Belum ada tiket yang bisa dikirim.');
        return;
    }

    const tombol = this;
    tombol.disabled = true;
    tombol.textContent = 'Mengirim...';

    try {
        const response = await fetch('api/kirim_email.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, ...tiketTerakhir })
        });
        const hasil = await response.json();
        alert(hasil.message);
    } catch (error) {
        alert('Gagal terhubung ke server saat mengirim email.');
        console.error(error);
    } finally {
        tombol.disabled = false;
        tombol.textContent = '📧 Kirim Tiket ke Email';
    }
});

// ==========================================
// 6. FITUR PIHAK KETIGA: KIRIM TIKET VIA WHATSAPP (WhatsApp Click-to-Chat)
// ==========================================
document.getElementById('btnKirimWa').addEventListener('click', function() {
    if (!tiketTerakhir) {
        alert('Belum ada tiket yang bisa dikirim.');
        return;
    }

    // Ubah format nomor: 08xxx -> 628xxx (format internasional yang dibutuhkan WhatsApp)
    let nomorFormatted = WA_TUJUAN_TETAP.replace(/\D/g, ''); // buang karakter selain angka
    if (nomorFormatted.startsWith('0')) {
        nomorFormatted = '62' + nomorFormatted.slice(1);
    }

    const pesan =
        `*TIKET ANTREAN DIGITAL - KANTPUSKU*\n\n` +
        `Puskesmas: ${tiketTerakhir.puskesmas}\n` +
        `Poli: ${tiketTerakhir.poli}\n` +
        `Nomor Antrean: ${tiketTerakhir.nomor}\n` +
        `Nama Pasien: ${tiketTerakhir.pasien}\n` +
        `Waktu Cetak: Hari Ini, Jam ${tiketTerakhir.waktu} WIB\n\n` +
        `Harap tunjukkan tiket ini kepada petugas loket.`;

    const urlWa = `https://wa.me/${nomorFormatted}?text=${encodeURIComponent(pesan)}`;
    window.open(urlWa, '_blank');
});

// ==========================================
// 7. COUNTDOWN REAL-TIME (MENIT & DETIK) UNTUK STATUS ANTREAN
// - Tiap 1 detik: hitung mundur tampilan secara lokal (biar terasa halus).
// - Tiap 5 detik: sinkronisasi ulang ke server (biar akurat walau ada pasien
//   lain yang statusnya berubah, atau kalau layar sempat idle lama).
// ==========================================
let timerLokal = null;
let timerSinkron = null;
let sisaDetikSaatIni = 0;
let statusSaatIni = null;

function formatMenitDetik(totalDetik) {
    const menit = Math.floor(totalDetik / 60);
    const detik = totalDetik % 60;
    return `${String(menit).padStart(2, '0')}:${String(detik).padStart(2, '0')}`;
}

function renderStatusAntrean(status, sisaDetik, posisiMenunggu) {
    const badge = document.getElementById('tiketStatusBadge');
    const box = document.getElementById('tiketCountdownBox');
    const label = document.getElementById('tiketCountdownLabel');
    const angka = document.getElementById('tiketCountdown');

    if (status === 'dipanggil') {
        badge.textContent = '🟢 Sedang Dipanggil - Silakan Masuk';
        badge.className = 'badge fs-6 mb-3 bg-success';
        box.classList.remove('d-none');
        label.textContent = 'Sisa waktu pelayanan Anda:';
        angka.textContent = formatMenitDetik(sisaDetik);
    } else if (status === 'menunggu') {
        badge.textContent = `🟡 Menunggu (Posisi ke-${posisiMenunggu})`;
        badge.className = 'badge fs-6 mb-3 bg-warning text-dark';
        box.classList.remove('d-none');
        label.textContent = 'Estimasi waktu tunggu Anda:';
        angka.textContent = formatMenitDetik(sisaDetik);
    } else {
        badge.textContent = '⚪ Selesai Dilayani';
        badge.className = 'badge fs-6 mb-3 bg-secondary';
        box.classList.add('d-none');
    }
}

function mulaiCountdown(antreanId, statusAwal, sisaDetikAwal, posisiMenungguAwal) {
    // Hentikan timer lama kalau sebelumnya sudah pernah mendaftar di sesi ini
    if (timerLokal) clearInterval(timerLokal);
    if (timerSinkron) clearInterval(timerSinkron);

    statusSaatIni = statusAwal;
    sisaDetikSaatIni = sisaDetikAwal;
    renderStatusAntrean(statusSaatIni, sisaDetikSaatIni, posisiMenungguAwal);

    // Detak lokal tiap detik: sekadar menghitung mundur angka di layar
    timerLokal = setInterval(function () {
        if (statusSaatIni === 'selesai') return;
        sisaDetikSaatIni = Math.max(0, sisaDetikSaatIni - 1);
        renderStatusAntrean(statusSaatIni, sisaDetikSaatIni, posisiMenungguAwal);
    }, 1000);

    // Sinkronisasi ke server tiap 5 detik: sumber kebenaran yang sesungguhnya
    async function sinkronKeServer() {
        try {
            const response = await fetch(`api/status_antrean.php?id=${antreanId}`);
            const hasil = await response.json();
            if (!hasil.success) return;

            const statusBerubahJadiDipanggil = statusSaatIni === 'menunggu' && hasil.status === 'dipanggil';

            statusSaatIni = hasil.status;
            sisaDetikSaatIni = hasil.sisa_detik;
            posisiMenungguAwal = hasil.posisi_menunggu;
            renderStatusAntrean(statusSaatIni, sisaDetikSaatIni, posisiMenungguAwal);

            if (statusBerubahJadiDipanggil) {
                alert('Giliran Anda sudah dipanggil! Silakan segera masuk ke poli.');
            }

            if (statusSaatIni === 'selesai') {
                clearInterval(timerLokal);
                clearInterval(timerSinkron);
            }
        } catch (error) {
            console.error('Gagal sinkronisasi status antrean:', error);
        }
    }
    timerSinkron = setInterval(sinkronKeServer, 5000);
}
