// ==========================================
// LOGIKA UNTUK HALAMAN REGISTER (via PHP + MySQL)
// ==========================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Mencegah reload halaman saat submit

        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value.trim();

        try {
            const response = await fetch('api/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const hasil = await response.json();

            alert(hasil.message);

            if (hasil.success) {
                window.location.href = 'index.html'; // Pindah ke halaman login
            }
        } catch (error) {
            alert('Gagal terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah berjalan.');
            console.error(error);
        }
    });
}

// ==========================================
// LOGIKA UNTUK HALAMAN LOGIN (via PHP + MySQL)
// ==========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        try {
            const response = await fetch('api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const hasil = await response.json();

            alert(hasil.message);

            if (hasil.success) {
                // Status login sekarang disimpan di session PHP (server), bukan sessionStorage
                // Admin diarahkan ke panel admin, user biasa ke dashboard biasa
                if (hasil.role === 'admin') {
                    window.location.href = 'admin_dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }
        } catch (error) {
            alert('Gagal terhubung ke server. Pastikan Apache & MySQL di XAMPP sudah berjalan.');
            console.error(error);
        }
    });
}
