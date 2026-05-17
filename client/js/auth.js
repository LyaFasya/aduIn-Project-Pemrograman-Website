const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('aduin_token', result.token);
                window.location.href = 'index.html'; 
            } else {
                alert('Gagal login: ' + result.message);
            }
        } catch (error) {
            console.error('Error saat login:', error);
            alert('Gagal terhubung ke server. Pastikan server Node.js menyala.');
        }
    });
}