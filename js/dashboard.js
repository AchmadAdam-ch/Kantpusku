// ==========================================
// 1. PROTEKSI SESI & LOGOUT (via PHP session, bukan sessionStorage)
// ==========================================
async function cekSesiLogin() {
    try {
        const response = await fetch('api/check_session.php');
        const hasil = await response.json();

        if (!hasil.loggedIn) {
            alert('Akses ditolak! Anda harus login terlebih dahulu.');
            window.location.href = 'index.html';
            return;
        }

        // Tampilkan nama user di Navbar
        document.getElementById('welcomeUser').textContent = `Halo, ${hasil.username}!`;
    } catch (error) {
        alert('Gagal terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah berjalan.');
        console.error(error);
    }
}
cekSesiLogin();

// Logika untuk tombol Logout
document.getElementById('btnLogout').addEventListener('click', async function() {
    try {
        const response = await fetch('api/logout.php');
        const hasil = await response.json();

        alert(hasil.message);
        window.location.href = 'index.html';
    } catch (error) {
        alert('Gagal terhubung ke server.');
        console.error(error);
    }
});

// ==========================================
// 2. AMBIL DATA PUSKESMAS & POLI DARI DATABASE (via PHP + MySQL)
// ==========================================
async function muatDataPuskesmas() {
    const puskesmasContainer = document.getElementById('puskesmasContainer');

    try {
        const response = await fetch('api/get_puskesmas.php');
        const hasil = await response.json();

        if (!hasil.success) {
            puskesmasContainer.innerHTML = '<p class="text-danger">Gagal memuat data puskesmas.</p>';
            return;
        }

        // Melakukan looping (perulangan) pada data dari database
        hasil.data.forEach((puskesmas) => {
            const poliList = puskesmas.poli.join(', ');

            const cardHTML = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 shadow-sm border-0">
                        <img src="${puskesmas.gambar}" class="card-img-top" alt="${puskesmas.nama}" style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title fw-bold text-primary">${puskesmas.nama}</h5>
                            <p class="card-text text-muted small mb-2">${puskesmas.alamat}</p>
                            <p class="card-text mb-4"><strong>Layanan Poli:</strong><br>${poliList}</p>

                            <a href="antrean.html?id=${puskesmas.id}" class="btn btn-success mt-auto w-100">Ambil Antrean</a>
                        </div>
                    </div>
                </div>
            `;

            puskesmasContainer.innerHTML += cardHTML;
        });
    } catch (error) {
        puskesmasContainer.innerHTML = '<p class="text-danger">Gagal terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah berjalan.</p>';
        console.error(error);
    }
}
muatDataPuskesmas();
