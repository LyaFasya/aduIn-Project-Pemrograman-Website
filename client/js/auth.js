const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', 
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('aduin_token', result.accessToken);
                
                // Fetch user profile to check role
                const profileRes = await fetch('http://localhost:3000/profiles', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${result.accessToken}` }
                });
                const profileData = await profileRes.json();
                
                if (profileData.data && profileData.data.User) {
                    const userRole = profileData.data.User.role;
                    // Redirect berdasarkan role
                    if (userRole === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                alert('Gagal login: ' + result.message);
            }
        } catch (error) {
            console.error('Error saat login:', error);
            alert('Gagal terhubung ke server. Pastikan server Node.js menyala.');
        }
    });
}

const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault(); 

        const btnSubmit = document.querySelector('#registerForm button[type="submit"]');
        const originalText = btnSubmit.textContent;
        
        btnSubmit.textContent = 'Sedang mendaftar';
        btnSubmit.disabled = true;

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                
                body: JSON.stringify({ name, email, password })
            });

            const result = await response.json();

            if (response.ok) {
                
                alert('Registrasi berhasil! Silakan login dengan akun baru Anda.');
                window.location.href = 'login.html'; 
            } else {
                alert('Gagal mendaftar: ' + result.message);
            }
        } catch (error) {
            console.error('Error saat mendaftar:', error);
            alert('Gagal terhubung ke server. Pastikan server Node.js menyala.');
        } finally {
            
            btnSubmit.textContent = originalText;
            btnSubmit.disabled = false;
        }
    });
}