// ==========================================
// LOGIKA UNTUK HALAMAN REGISTER
// ==========================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Mencegah reload halaman saat submit
        
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value.trim();

        // 1. Ambil data user lama dari localStorage, jika belum ada buat array kosong []
        // (Penerapan Struktur Data berbentuk Array & Object)
        let dataUsers = JSON.parse(localStorage.getItem('users')) || [];

        // 2. Cek apakah username sudah pernah digunakan
        const userDitemukan = dataUsers.some(user => user.username === username);

        if (userDitemukan) {
            alert('Username sudah terdaftar! Gunakan nama lain.');
        } else {
            // 3. Tambahkan objek user baru ke dalam array
            dataUsers.push({ username: username, password: password });
            
            // 4. Simpan kembali array yang diperbarui ke localStorage
            localStorage.setItem('users', JSON.stringify(dataUsers));
            
            alert('Registrasi akun Kantpusku berhasil!');
            window.location.href = 'index.html'; // Pindah ke halaman login
        }
    });
}

// ==========================================
// LOGIKA UNTUK HALAMAN LOGIN
// ==========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        // 1. Ambil data semua akun dari localStorage
        let dataUsers = JSON.parse(localStorage.getItem('users')) || [];

        // 2. Validasi apakah username dan password cocok dengan data di storage
        const userValid = dataUsers.find(user => user.username === username && user.password === password);

        if (userValid) {
            alert('Login Berhasil! Selamat datang di Kantpusku.');
            
            // Simpan data login sementara di sessionStorage agar sistem tahu siapa yang login
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('sessionUser', username);
            
            window.location.href = 'dashboard.html'; // Pindah ke Dashboard Utama
        } else {
            alert('Username atau Password yang Anda masukkan salah!');
        }
    });
}