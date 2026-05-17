document.addEventListener("DOMContentLoaded", async function() {
    const token = localStorage.getItem('aduin_token');
    
    if (!token) {
        alert("Anda belum login. Silakan login terlebih dahulu.");
        window.location.href = 'login.html';
        return;
    }

    const displayPhoto = document.getElementById('displayPhoto');
    const displayName = document.getElementById('displayName');
    const displayEmail = document.getElementById('displayEmail');
    const displayPhone = document.getElementById('displayPhone');
    const displayAddress = document.getElementById('displayAddress');

    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    const editPhone = document.getElementById('editPhone');
    const editAddress = document.getElementById('editAddress');

    async function loadProfile() {
        try {
            const response = await fetch('http://localhost:3000/profiles', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                const user = result.data;
                const profile = user.Profile || {}; 

                displayName.textContent = user.name;
                displayEmail.textContent = user.email;
                displayPhone.textContent = profile.phone || '-';
                displayAddress.textContent = profile.address || '-';
                
                if (profile.photo) {
                    displayPhoto.src = profile.photo;
                } else {
                    displayPhoto.src = `https://ui-avatars.com/api/?name=${user.name}&background=random`;
                }

                editName.value = user.name;
                editEmail.value = user.email;
                editPhone.value = profile.phone || '';
                editAddress.value = profile.address || '';
            } else {
                if(response.status === 401 || response.status === 403) {
                    localStorage.removeItem('aduin_token');
                    localStorage.removeItem('aduin_role');
                    window.location.href = 'login.html';
                } else {
                    alert('Gagal memuat profil: ' + result.message);
                }
            }
        } catch (error) {
            console.error("Error load profile:", error);
            displayName.textContent = "Server Terputus";
        }
    }
    loadProfile();

    const modal = document.getElementById("modalProfile");
    const btnEdit = document.getElementById("btnEditProfile");
    const btnClose = document.getElementById("closeProfileModal");

    if (btnEdit) btnEdit.addEventListener("click", () => modal.style.display = "flex");
    if (btnClose) btnClose.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    const formProfile = document.getElementById("formProfile");
    const btnSubmit = document.getElementById("btnSubmitProfile");

    if (formProfile) {
        formProfile.addEventListener("submit", async function(e) {
            e.preventDefault();
            btnSubmit.textContent = "Sedang menyimpan";
            btnSubmit.disabled = true;

            const formData = new FormData();
            formData.append("name", editName.value);
            formData.append("email", editEmail.value);
            
            const password = document.getElementById("editPassword").value;
            if (password) formData.append("password", password);

            if (editPhone.value) formData.append("phone", editPhone.value);
            if (editAddress.value) formData.append("address", editAddress.value);

            const photoFile = document.getElementById("editPhoto").files[0];
            if (photoFile) {
                formData.append("photo", photoFile);
            }

            try {
                const response = await fetch("http://localhost:3000/profiles", {
                    method: "PATCH",
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    modal.style.display = "none";
                    document.getElementById("editPassword").value = "";
                    loadProfile(); 
                } else {
                    alert(`Gagal menyimpan: ${result.message}`);
                }
            } catch (error) {
                console.error("Error update profile:", error);
                alert("Terjadi kesalahan jaringan.");
            } finally {
                btnSubmit.textContent = "Simpan Perubahan";
                btnSubmit.disabled = false;
            }
        });
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async function() {
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