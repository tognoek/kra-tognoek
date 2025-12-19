const API_BASE = 'http://localhost:5000/api';

// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    const userMenu = document.getElementById('userMenu');
    const guestMenu = document.getElementById('guestMenu');
    const adminLink = document.getElementById('adminLink');
    const userName = document.getElementById('userName');

    if (token) {
        // Fetch user info
        fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(user => {
            if (user.IdTaiKhoan) {
                userMenu.style.display = 'inline-flex';
                userMenu.style.gap = '1rem';
                userMenu.style.alignItems = 'center';
                guestMenu.style.display = 'none';
                userName.textContent = user.HoTen || user.TenDangNhap;
                
                // Show admin link if admin
                if (user.VaiTro === 'Admin' && adminLink) {
                    adminLink.style.display = 'inline-block';
                }
            } else {
                localStorage.removeItem('token');
                userMenu.style.display = 'none';
                guestMenu.style.display = 'inline-flex';
                guestMenu.style.gap = '1rem';
            }
        })
        .catch(() => {
            localStorage.removeItem('token');
            userMenu.style.display = 'none';
            guestMenu.style.display = 'inline-flex';
            guestMenu.style.gap = '1rem';
        });
    } else {
        userMenu.style.display = 'none';
        guestMenu.style.display = 'inline-flex';
        guestMenu.style.gap = '1rem';
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

