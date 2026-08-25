// ==========================================
// 1. PROTEKSI SESI & LOGOUT
// ==========================================
// Cek apakah user sudah login dengan membaca sessionStorage
const isLoggedIn = sessionStorage.getItem('isLoggedIn');

if (!isLoggedIn || isLoggedIn !== 'true') {
    alert('Akses ditolak! Anda harus login terlebih dahulu.');
    window.location.href = 'index.html'; // Lempar kembali ke halaman login
}

// Tampilkan nama user di Navbar
const sessionUser = sessionStorage.getItem('sessionUser');
document.getElementById('welcomeUser').textContent = `Halo, ${sessionUser}!`;

// Logika untuk tombol Logout
document.getElementById('btnLogout').addEventListener('click', function() {
    // Hapus data sesi login
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('sessionUser');
    
    alert('Anda telah berhasil logout.');
    window.location.href = 'index.html'; // Kembali ke halaman login
});

// ==========================================
// 2. DATA LOKAL: DAFTAR PUSKESMAS & POLI
// ==========================================
// Struktur Data: Array of Objects
const dataPuskesmas = [
    {
        nama: "Puskesmas Melati",
        alamat: "Jl. Kesehatan No. 1, Jakarta",
        poli: ["Poli Umum", "Poli Gigi", "Poli KIA"],
        gambar: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?auto=format&fit=crop&w=400&q=80"
    },
    {
        nama: "Puskesmas Mawar",
        alamat: "Jl. Kesembuhan No. 2, Bandung",
        poli: ["Poli Umum", "Poli Anak"],
        gambar: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80"
    },
    {
        nama: "Puskesmas Anggrek",
        alamat: "Jl. Kebugaran No. 3, Surabaya",
        poli: ["Poli Umum", "Poli Gigi", "Poli Mata", "Poli Gizi"],
        gambar: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=400&q=80"
    }
];

// ==========================================
// 3. RENDER DATA KE DALAM CARD BOOTSTRAP
// ==========================================
const puskesmasContainer = document.getElementById('puskesmasContainer');

// Melakukan looping (perulangan) pada dataPuskesmas
dataPuskesmas.forEach((puskesmas, index) => {
    // Gabungkan array poli menjadi satu kalimat dengan pemisah koma
    const poliList = puskesmas.poli.join(', ');

    // Cetak struktur HTML untuk masing-masing Card
    const cardHTML = `
        <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm border-0">
                <img src="${puskesmas.gambar}" class="card-img-top" alt="${puskesmas.nama}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title fw-bold text-primary">${puskesmas.nama}</h5>
                    <p class="card-text text-muted small mb-2">${puskesmas.alamat}</p>
                    <p class="card-text mb-4"><strong>Layanan Poli:</strong><br>${poliList}</p>
                    
                    <a href="antrean.html?id=${index}" class="btn btn-success mt-auto w-100">Ambil Antrean</a>
                </div>
            </div>
        </div>
    `;
    
    // Suntikkan Card HTML yang sudah dibuat ke dalam Container
    puskesmasContainer.innerHTML += cardHTML;
});