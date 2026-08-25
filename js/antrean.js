// ==========================================
// 1. DATA REFERENSI (Sama seperti di Dashboard)
// ==========================================
const dataPuskesmas = [
    {
        nama: "Puskesmas Melati",
        alamat: "Jl. Kesehatan No. 1, Jakarta",
        poli: ["Poli Umum", "Poli Gigi", "Poli KIA"]
    },
    {
        nama: "Puskesmas Mawar",
        alamat: "Jl. Kesembuhan No. 2, Bandung",
        poli: ["Poli Umum", "Poli Anak"]
    },
    {
        nama: "Puskesmas Anggrek",
        alamat: "Jl. Kebugaran No. 3, Surabaya",
        poli: ["Poli Umum", "Poli Gigi", "Poli Mata", "Poli Gizi"]
    }
];

// ==========================================
// 2. TANGKAP ID PUSKESMAS DARI URL PARAMETER
// ==========================================
// Mengambil text "?id=X" dari URL browser
const urlParams = new URLSearchParams(window.location.search);
const puskesmasId = urlParams.get('id');

// Proteksi jika ID tidak valid atau langsung buka antrean.html tanpa klik dari dashboard
if (puskesmasId === null || !dataPuskesmas[puskesmasId]) {
    alert("Puskesmas tidak valid! Kembali ke Dashboard.");
    window.location.href = "dashboard.html";
}

// Ambil data puskesmas terpilih berdasarkan ID-nya
const puskesmasTerpilih = dataPuskesmas[puskesmasId];

// Tampilkan nama & alamat puskesmas di form
document.getElementById('namaPuskesmasLabel').textContent = puskesmasTerpilih.nama;
document.getElementById('alamatPuskesmasLabel').textContent = puskesmasTerpilih.alamat;

// ==========================================
// 3. ISI PILIHAN POLI SECARA DINAMIS
// ==========================================
const pilihPoliSelect = document.getElementById('pilihPoli');
puskesmasTerpilih.poli.forEach(poli => {
    const opsi = document.createElement('option');
    opsi.value = poli;
    opsi.textContent = poli;
    pilihPoliSelect.appendChild(opsi);
});

// ==========================================
// 4. LOGIKA PENGAMBILAN & GENERATE NOMOR ANTREAN
// ==========================================
document.getElementById('formAntrean').addEventListener('submit', function(e) {
    e.preventDefault(); // Mencegah reload halaman saat disubmit

    const namaPasien = document.getElementById('namaPasien').value;
    const poliTerpilih = pilihPoliSelect.value;
    
    // Bikin kunci unik untuk database lokal localStorage agar nomor antrean per poli terpisah
    // Format kunci: antrean_PuskesmasMelati_PoliUmum
    const keyAntrean = `antrean_${puskesmasTerpilih.nama.replace(/\s+/g, '')}_${poliTerpilih.replace(/\s+/g, '')}`;

    // Ambil nomor urut terakhir dari localStorage, kalau belum ada kita mulai dari 0
    let nomorTerakhir = localStorage.getItem(keyAntrean);
    nomorTerakhir = nomorTerakhir ? parseInt(nomorTerakhir) : 0;

    // Tambah 1 nomor urut baru secara otomatis (Auto-increment)
    const nomorBaru = nomorTerakhir + 1;

    // Simpan kembali nomor urut yang baru ke localStorage agar tersimpan permanen
    localStorage.setItem(keyAntrean, nomorBaru);

    // ==========================================
    // 5. CETAK TIKET ANTREAN DIGITAL DI LAYAR
    document.getElementById('tiketPuskesmas').textContent = puskesmasTerpilih.nama;
    document.getElementById('tiketPoli').textContent = poliTerpilih;
    document.getElementById('tiketPasien').textContent = namaPasien;
    
    // Format nomor agar terlihat rapi (misal: 01, 02, atau 10)
    document.getElementById('tiketNomor').textContent = nomorBaru < 10 ? `0${nomorBaru}` : nomorBaru;
    
    // Tampilkan waktu cetak saat ini
    const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('tiketJam').textContent = `Waktu Cetak: Hari Ini, Jam ${waktuSekarang} WIB`;

    // Munculkan Box Tiket Digital (Menghapus class d-none dari Bootstrap)
    document.getElementById('boxTiketAntrean').classList.remove('d-none');

    // Reset isi form agar bisa dipakai daftar pasien lain jika mau
    document.getElementById('formAntrean').reset();
    
    alert(`Berhasil mendaftar! Nomor Antrean Anda adalah: ${nomorBaru}`);
});