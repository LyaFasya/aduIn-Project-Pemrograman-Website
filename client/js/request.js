const token = localStorage.getItem('aduin_token');
if (!token) {
    alert("terdeteksi belum login atau register");
    window.location.href = 'login.html';  
}

async function hapusPengajuan(id) {
    const yakin = confirm("Apakah Anda yakin akan menghapus pengajuan ini?");
    
    if (yakin) {
        const token = localStorage.getItem('aduin_token');
        
        try {
            const response = await fetch(`http://localhost:3000/requests/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {              
                const cardDihapus = document.getElementById(`card-${id}`);
                if (cardDihapus) cardDihapus.remove();
                
            } else {
                const result = await response.json();
                alert(`Gagal menghapus: ${result.message}`);
            }
        } catch (error) {
            console.error("Error delete:", error);
            alert("terjadi kesalahan pada saat menghapus data");
        }
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    const container = document.getElementById('pengajuanContainer');
    const btnLogout = document.getElementById('btnLogout');
    
    const token = localStorage.getItem('aduin_token');
    if (!token) {
        alert("Anda belum login, Silahkan login terlebih dahulu");
        window.location.href = 'login.html';
        return; 
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            localStorage.removeItem('aduin_token');
            localStorage.removeItem('aduin_role');
            window.location.href = 'login.html';
        });
    }

    try {
        const response = await fetch('http://localhost:3000/requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            container.innerHTML = '';

            const dataPengajuan = result.data || result; 

            if(dataPengajuan.length === 0) {
                container.innerHTML = '<p>Belum ada data pengajuan fasilitas.</p>';
            }

            dataPengajuan.forEach(item => {
                const tanggalBagus = new Date(item.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                const cardHTML = `
                    <div style="border: 1px solid #888; border-radius: 5px" class="card" id="card-${item.id}">
                        <img src="${item.image_url || 'assets/placeholder.jpg'}" alt="Foto ${item.title}" class="card-img">
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span class="badge ${item.status}">${item.status.toUpperCase()}</span>
                                <small style="color: #888;">${tanggalBagus}</small>
                            </div>
                            
                            <h3 class="card-title">${item.title}</h3>
                            <p class="card-location">${item.location}</p>
                            <p class="card-desc" style="margin-bottom: 15px;">${item.description}</p>
                            
                            <div style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                                <button onclick="hapusPengajuan(${item.id})" class="btn-logout" style="width: 100%; padding: 8px;">Hapus</button>
                            </div>
                        </div>
                    </div>
                `;
                
                container.insertAdjacentHTML('beforeend', cardHTML);
            });
            
        } else {
            if(response.status === 401 || response.status === 403) {
                alert("Sesi Anda telah habis. Silakan login kembali.");
                localStorage.removeItem('aduin_token');
                localStorage.removeItem('aduin_role');
                window.location.href = 'login.html';
            } else {
                container.innerHTML = `<p>tidak dapat memuat data: ${result.message}</p>`;
            }
        }
    } catch (error) {
        console.error("terjadi kesalahan:", error);
        container.innerHTML = `<p>tidak dapat terhubung ke server</p>`;
    }

    const modal = document.getElementById("modalPengajuan");
    const btnBukaModal = document.getElementById("btnBuatPengajuan");
    const btnTutupModal = document.getElementById("closeModal");
    const formPengajuan = document.getElementById("formPengajuan");
    const btnSubmit = document.getElementById("btnSubmitPengajuan");

    if (btnBukaModal) {
        btnBukaModal.addEventListener("click", () => {
            modal.style.display = "flex";
        });
    }

    if (btnTutupModal) {
        btnTutupModal.addEventListener("click", () => {
            modal.style.display = "none";
            formPengajuan.reset(); 
        });
    }

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
            formPengajuan.reset();
        }
    });

    if (formPengajuan) {
        formPengajuan.addEventListener("submit", async function(e) {
            e.preventDefault(); 
            btnSubmit.textContent = "Sedang diproses";
            btnSubmit.style.backgroundColor = "#ccc";
            btnSubmit.disabled = true;

            const formData = new FormData();
            formData.append("title", document.getElementById("title").value);
            formData.append("location", document.getElementById("location").value);
            formData.append("category_id", document.getElementById("category_id").value);
            formData.append("description", document.getElementById("description").value);
            
            const imageFile = document.getElementById("image").files[0];
            if (imageFile) {
                formData.append("image_url", imageFile); 
            }

            try {
                const response = await fetch("http://localhost:3000/requests", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    modal.style.display = "none";
                    formPengajuan.reset();
                    window.location.reload(); 
                } else {
                    alert(`Gagal mengirim pengajuan: ${result.message || result.error}`);
                }
            } catch (error) {
                console.error("Error submit pengajuan:", error);
                alert("Terjadi kesalahan jaringan saat mengirim data");
            } finally {
                btnSubmit.textContent = "Kirim Pengajuan";
                btnSubmit.disabled = false;
            }
        });
    }
});