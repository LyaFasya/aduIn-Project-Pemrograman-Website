document.addEventListener("DOMContentLoaded", async function() {
    const container = document.getElementById('pengajuanContainer');
    const btnLogout = document.getElementById('btnLogout');
    
    const token = localStorage.getItem('aduin_token');
    if (!token) {
        alert("Anda belum login, Silakan login terlebih dahulu");
        window.location.href = 'login.html';
        return; 
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            localStorage.removeItem('aduin_token');
            window.location.href = 'login.html';
        });
    }

    try {
        const response = await fetch('http://localhost:3000/api/requests', {
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
                return;
            }

            dataPengajuan.forEach(item => {
                const tanggalBagus = new Date(item.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                const cardHTML = `
                    <div class="card" id="card-${item.id}">
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
            
            async function hapusPengajuan(id) {
                const yakin = confirm("Apakah Anda yakin akan menghapus pengajuan ini?");
                
                if (yakin) {
                    const token = localStorage.getItem('aduin_token');
                    
                    try {
                        const response = await fetch(`http://localhost:3000/api/requests/${id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (response.ok) {
                            alert("Data pengajuan berhasil dihapus!");
                            
                            const cardDihapus = document.getElementById(`card-${id}`);
                            if (cardDihapus) cardDihapus.remove();
                            
                        } else {
                            const result = await response.json();
                            alert(`Gagal menghapus: ${result.message}`);
                        }
                    } catch (error) {
                        console.error("Error delete:", error);
                        alert("Terjadi kesalahan saat menghapus data.");
                    }
                }
            }

        } else {
            if(response.status === 401 || response.status === 403) {
                alert("Sesi Anda telah habis. Silakan login kembali.");
                localStorage.removeItem('aduin_token');
                window.location.href = 'login.html';
            } else {
                container.innerHTML = `<p>tidak dapat memuat data: ${result.message}</p>`;
            }
        }
    } catch (error) {
        console.error("terjadi kesalahan:", error);
        container.innerHTML = `<p>tidak dapat terhubung ke server</p>`;
    }
});