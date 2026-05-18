document.addEventListener('DOMContentLoaded', async function() {
    const navProfileImg = document.getElementById('navProfileImg');
    const btnLogout = document.getElementById('btnLogout');
    
    const NAVBAR_BASE_URL = 'http://localhost:3000';
    const token = localStorage.getItem('aduin_token');

    if (navProfileImg && token) {
        try {
            const response = await fetch(`${NAVBAR_BASE_URL}/profiles`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const profile = result.data;
                
                if (profile && profile.Profile && profile.Profile.photo) {
                    navProfileImg.src = profile.Profile.photo;
                } else if (profile && profile.name) {
                    const initial = profile.name.charAt(0).toUpperCase();
                    navProfileImg.src = `https://placehold.co/40x40/1a1d2e/6C63FF?text=${initial}`;
                }
            }
        } catch (error) {
            console.error('Failed to load profile for navbar:', error);
        }
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                await fetch('http://localhost:3000/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.error("Logout API error:", error);
            } finally {
                localStorage.removeItem('aduin_token');
                localStorage.removeItem('aduin_role');
                window.location.href = 'login.html';
            }
        });
    }
});
