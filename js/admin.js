// ==========================================
// 1. PROTEKSI SESI: HALAMAN INI KHUSUS ADMIN
// ==========================================
async function cekSesiAdmin() {
    try {
        const response = await fetch('api/check_session.php');
        const hasil = await response.json();

        if (!hasil.loggedIn) {
            alert('Akses ditolak! Anda harus login terlebih dahulu.');
            window.location.href = 'index.html';
            return;
        }

        if (hasil.role !== 'admin') {
            alert('Akses ditolak! Halaman ini khusus Admin.');
            window.location.href = 'dashboard.html';
            return;
        }

        document.getElementById('welcomeAdmin').textContent = `Halo, ${hasil.username}!`;
    } catch (error) {
        alert('Gagal terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah berjalan.');
        console.error(error);
    }
}
cekSesiAdmin();

// Logout (endpoint sama dengan user biasa)
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
// 2. TAMBAH PUSKESMAS BARU
// ==========================================
document.getElementById('formTambahPuskesmas').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nama = document.getElementById('inputNama').value.trim();
    const alamat = document.getElementById('inputAlamat').value.trim();
    const gambar = document.getElementById('inputGambar').value.trim();
    const info = document.getElementById('inputInfo').value.trim();

    // Ubah "Poli Umum, Poli Gigi" jadi array ["Poli Umum", "Poli Gigi"]
    const poli = document.getElementById('inputPoli').value
        .split(',')
        .map(p => p.trim())
        .filter(p => p !== '');

    try {
        const response = await fetch('api/admin/tambah_puskesmas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama, alamat, gambar, info, poli })
        });
        const hasil = await response.json();
        alert(hasil.message);

        if (hasil.success) {
            document.getElementById('formTambahPuskesmas').reset();
            muatDaftarPuskesmas(); // refresh daftar di bawah
        }
    } catch (error) {
        alert('Gagal terhubung ke server saat menambah puskesmas.');
        console.error(error);
    }
});

// ==========================================
// 3. TAMPILKAN DAFTAR PUSKESMAS + TOMBOL RESET ANTREAN PER POLI
// ==========================================
async function muatDaftarPuskesmas() {
    const container = document.getElementById('puskesmasContainer');
    container.innerHTML = '<p class="text-muted">Memuat data...</p>';

    try {
        const response = await fetch('api/get_puskesmas.php');
        const hasil = await response.json();

        if (!hasil.success) {
            container.innerHTML = '<p class="text-danger">Gagal memuat data puskesmas.</p>';
            return;
        }

        container.innerHTML = '';

        hasil.data.forEach((puskesmas) => {
            // Bikin satu baris tombol reset untuk tiap poli di puskesmas ini
            const tombolPoli = puskesmas.poli.map(namaPoli => `
                <button
                    class="btn btn-outline-warning btn-sm me-1 mb-1 btn-reset-antrean"
                    data-puskesmas-id="${puskesmas.id}"
                    data-nama-poli="${namaPoli}"
                    data-nama-puskesmas="${puskesmas.nama}"
                >
                    🔄 Reset "${namaPoli}"
                </button>
            `).join('');

            const cardHTML = `
                <div class="col-md-6 mb-4">
                    <div class="card h-100 shadow-sm border-0">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <h5 class="card-title fw-bold text-primary">${puskesmas.nama}</h5>
                                <div class="flex-shrink-0">
                                    <button
                                        class="btn btn-outline-secondary btn-sm btn-edit-puskesmas"
                                        data-id="${puskesmas.id}"
                                        data-nama="${puskesmas.nama}"
                                        data-alamat="${puskesmas.alamat}"
                                        data-gambar="${puskesmas.gambar ?? ''}"
                                        data-info="${puskesmas.info ?? ''}"
                                        data-poli="${puskesmas.poli.join(', ')}"
                                        title="Edit"
                                    >✏️</button>
                                    <button
                                        class="btn btn-outline-danger btn-sm btn-hapus-puskesmas"
                                        data-id="${puskesmas.id}"
                                        data-nama="${puskesmas.nama}"
                                        title="Hapus"
                                    >🗑️</button>
                                </div>
                            </div>
                            <p class="card-text text-muted small mb-1">${puskesmas.alamat}</p>
                            ${puskesmas.info ? `<p class="card-text small mb-2"><em>${puskesmas.info}</em></p>` : ''}
                            <p class="card-text mb-2"><strong>Poli:</strong> ${puskesmas.poli.join(', ')}</p>
                            <hr>
                            <p class="small text-muted mb-1">Reset nomor antrean (mulai lagi dari 1):</p>
                            <div>${tombolPoli}</div>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML += cardHTML;
        });

        // Pasang event listener ke semua tombol reset, edit, & hapus yang baru dibuat
        document.querySelectorAll('.btn-reset-antrean').forEach(btn => {
            btn.addEventListener('click', handleResetAntrean);
        });
        document.querySelectorAll('.btn-edit-puskesmas').forEach(btn => {
            btn.addEventListener('click', bukaModalEdit);
        });
        document.querySelectorAll('.btn-hapus-puskesmas').forEach(btn => {
            btn.addEventListener('click', handleHapusPuskesmas);
        });

    } catch (error) {
        container.innerHTML = '<p class="text-danger">Gagal terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah berjalan.</p>';
        console.error(error);
    }
}
muatDaftarPuskesmas();

// ==========================================
// 4. HANDLER TOMBOL RESET ANTREAN
// ==========================================
async function handleResetAntrean(e) {
    const btn = e.currentTarget;
    const puskesmasId = btn.dataset.puskesmasId;
    const namaPoli = btn.dataset.namaPoli;
    const namaPuskesmas = btn.dataset.namaPuskesmas;

    const yakin = confirm(`Reset nomor antrean "${namaPoli}" di ${namaPuskesmas}?\nPendaftar berikutnya akan mulai lagi dari nomor 1.`);
    if (!yakin) return;

    btn.disabled = true;

    try {
        const response = await fetch('api/admin/reset_antrean.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ puskesmas_id: puskesmasId, nama_poli: namaPoli })
        });
        const hasil = await response.json();
        alert(hasil.message);
    } catch (error) {
        alert('Gagal terhubung ke server saat mereset antrean.');
        console.error(error);
    } finally {
        btn.disabled = false;
    }
}

// ==========================================
// 5. EDIT PUSKESMAS (Update)
// ==========================================
const modalEditEl = document.getElementById('modalEditPuskesmas');
const modalEdit = modalEditEl ? new bootstrap.Modal(modalEditEl) : null;

function bukaModalEdit(e) {
    const btn = e.currentTarget;
    document.getElementById('editId').value = btn.dataset.id;
    document.getElementById('editNama').value = btn.dataset.nama;
    document.getElementById('editAlamat').value = btn.dataset.alamat;
    document.getElementById('editGambar').value = btn.dataset.gambar;
    document.getElementById('editInfo').value = btn.dataset.info;
    document.getElementById('editPoli').value = btn.dataset.poli;
    modalEdit.show();
}

document.getElementById('formEditPuskesmas').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const nama = document.getElementById('editNama').value.trim();
    const alamat = document.getElementById('editAlamat').value.trim();
    const gambar = document.getElementById('editGambar').value.trim();
    const info = document.getElementById('editInfo').value.trim();
    const poli = document.getElementById('editPoli').value
        .split(',')
        .map(p => p.trim())
        .filter(p => p !== '');

    try {
        const response = await fetch('api/admin/edit_puskesmas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, nama, alamat, gambar, info, poli })
        });
        const hasil = await response.json();
        alert(hasil.message);

        if (hasil.success) {
            modalEdit.hide();
            muatDaftarPuskesmas();
        }
    } catch (error) {
        alert('Gagal terhubung ke server saat memperbarui puskesmas.');
        console.error(error);
    }
});

// ==========================================
// 6. HAPUS PUSKESMAS (Delete)
// ==========================================
async function handleHapusPuskesmas(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const nama = btn.dataset.nama;

    const yakin = confirm(`Hapus puskesmas "${nama}"?\nSeluruh data poli dan riwayat antreannya akan ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.`);
    if (!yakin) return;

    btn.disabled = true;

    try {
        const response = await fetch('api/admin/hapus_puskesmas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const hasil = await response.json();
        alert(hasil.message);

        if (hasil.success) {
            muatDaftarPuskesmas();
        }
    } catch (error) {
        alert('Gagal terhubung ke server saat menghapus puskesmas.');
        console.error(error);
    } finally {
        btn.disabled = false;
    }
}

// ==========================================
// 7. MONITORING ANTREAN REAL-TIME (per poli: siapa dipanggil vs menunggu)
// ==========================================
function formatMenitDetikAdmin(totalDetik) {
    const menit = Math.floor(totalDetik / 60);
    const detik = totalDetik % 60;
    return `${String(menit).padStart(2, '0')}:${String(detik).padStart(2, '0')}`;
}

async function muatMonitoringAntrean() {
    const container = document.getElementById('monitorContainer');
    if (!container) return;

    try {
        const response = await fetch('api/admin/monitor_antrean.php');
        const hasil = await response.json();

        if (!hasil.success) {
            container.innerHTML = '<p class="text-danger">Gagal memuat data monitoring.</p>';
            return;
        }

        if (hasil.data.length === 0) {
            container.innerHTML = '<p class="text-muted">Belum ada poli yang terdaftar.</p>';
            return;
        }

        container.innerHTML = hasil.data.map(poli => {
            const dipanggilHTML = poli.dipanggil
                ? `<div class="alert alert-success py-2 px-3 mb-2">
                       🟢 <strong>No. ${poli.dipanggil.nomor}</strong> - ${poli.dipanggil.pasien}
                       <span class="float-end">${formatMenitDetikAdmin(poli.dipanggil.sisa_detik)}</span>
                   </div>`
                : `<p class="text-muted small mb-2">Tidak ada pasien yang sedang dipanggil.</p>`;

            const menungguHTML = poli.menunggu.length > 0
                ? `<ul class="list-group list-group-flush">
                       ${poli.menunggu.map(p => `<li class="list-group-item px-0 py-1 small">🟡 No. ${p.nomor} - ${p.pasien}</li>`).join('')}
                   </ul>`
                : `<p class="text-muted small mb-0">Tidak ada yang menunggu.</p>`;

            return `
                <div class="col-md-4 mb-3">
                    <div class="card h-100 shadow-sm border-0">
                        <div class="card-body">
                            <h6 class="fw-bold mb-0">${poli.nama_poli}</h6>
                            <p class="text-muted small mb-2">${poli.nama_puskesmas}</p>
                            ${dipanggilHTML}
                            ${menungguHTML}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = '<p class="text-danger">Gagal terhubung ke server monitoring.</p>';
        console.error(error);
    }
}
muatMonitoringAntrean();
setInterval(muatMonitoringAntrean, 5000); // refresh otomatis tiap 5 detik
