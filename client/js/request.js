const BASE_URL = 'http://localhost:3000';
const token = localStorage.getItem('aduin_token');

if (!token) {
    alert("Terdeteksi belum login atau register");
    window.location.href = 'login.html';  
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

async function hapusPengajuan(id) {
    if (!confirm("Apakah Anda yakin? Data pengajuan ini akan dihapus permanen!")) return;
    
    try {
        const response = await fetch(`${BASE_URL}/requests/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {              
            const cardDihapus = document.getElementById(`card-req-${id}`);
            if (cardDihapus) {
                cardDihapus.style.transition = 'opacity 0.3s, transform 0.3s';
                cardDihapus.style.opacity = '0';
                cardDihapus.style.transform = 'scale(0.95)';
                setTimeout(() => cardDihapus.remove(), 300);
            }
            showToast('Pengajuan berhasil dihapus', 'success');
        } else {
            const result = await response.json();
            showToast(`Gagal menghapus: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error("Error delete:", error);
        showToast("Terjadi kesalahan pada saat menghapus data", 'error');
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    try {
        const categoryResponse = await fetch(`${BASE_URL}/categories`);
        const categoryResult = await categoryResponse.json();
        if (categoryResponse.ok && categoryResult.data) {
            const catPengajuan = document.getElementById('category_id_pengajuan');
            if (catPengajuan) {
                categoryResult.data.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    catPengajuan.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }

    const pengajuanContainer = document.getElementById('pengajuanContainer');
    try {
        const response = await fetch(`${BASE_URL}/requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (response.ok) {
            pengajuanContainer.innerHTML = '';
            const dataPengajuan = result.data || result; 

            if(dataPengajuan.length === 0) {
                pengajuanContainer.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <div class="empty-icon">📝</div>
                        <h3>Belum Ada Pengajuan</h3>
                        <p>Klik "Buat Pengajuan" untuk mengirimkan pengajuan fasilitasmu.</p>
                    </div>`;
            } else {
                dataPengajuan.forEach(item => {
                    const tanggal = new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    });
                    const imgSrc = item.image_url || 'https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image';

                    const cardHTML = `
                        <div class="card" id="card-req-${item.id}">
                            <img src="${imgSrc}" alt="Foto ${item.title}" class="card-img" onerror="this.src='https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image'">
                            <div class="card-body">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <span class="badge ${item.status || 'pending'}">${(item.status || 'pending').toUpperCase()}</span>
                                    <small style="color: #888;">${tanggal}</small>
                                </div>
                                <h3 class="card-title">${item.title}</h3>
                                <p class="card-location">${item.location}</p>
                                <p class="card-desc" style="margin-bottom: 15px;">${item.description}</p>
                                <div style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                                    <button onclick="lihatDetail(${item.id}, 'req')" class="btn btn-outline" style="flex: 1;">🔍 Detail</button>
                                    <button onclick="hapusPengajuan(${item.id})" class="btn-delete" style="flex: 1;">🗑 Hapus</button>
                                </div>
                            </div>
                        </div>`;
                    pengajuanContainer.insertAdjacentHTML('beforeend', cardHTML);
                });
            }
        } else {
            pengajuanContainer.innerHTML = `<p>Tidak dapat memuat data pengajuan.</p>`;
        }
    } catch (error) {
        pengajuanContainer.innerHTML = `<p>Tidak dapat terhubung ke server</p>`;
    }

    const modalPengajuan = document.getElementById("modalPengajuan");
    const btnBuatPengajuan = document.getElementById("btnBuatPengajuan");
    const closePengajuan = document.getElementById("closeModalPengajuan");
    const formPengajuan = document.getElementById("formPengajuan");
    const btnSubmitPengajuan = document.getElementById("btnSubmitPengajuan");

    if (btnBuatPengajuan) btnBuatPengajuan.addEventListener("click", () => modalPengajuan.style.display = "flex");
    if (closePengajuan) {
        closePengajuan.addEventListener("click", () => {
            modalPengajuan.style.display = "none";
            formPengajuan.reset(); 
        });
    }

    if (formPengajuan) {
        formPengajuan.addEventListener("submit", async function(e) {
            e.preventDefault(); 
            btnSubmitPengajuan.textContent = "Sedang diproses";
            btnSubmitPengajuan.style.backgroundColor = "#ccc";
            btnSubmitPengajuan.disabled = true;

            const title = document.getElementById("title_pengajuan").value;
            const location = document.getElementById("location_pengajuan").value;
            const category_id = document.getElementById("category_id_pengajuan").value;
            const description = document.getElementById("description_pengajuan").value;
            const imageFile = document.getElementById("image_pengajuan").files[0];

            if (!title || !location || !category_id || !description || !imageFile) {
                alert('Harap isi semua field dan unggah gambar.');
                btnSubmitPengajuan.textContent = "Kirim Pengajuan";
                btnSubmitPengajuan.style.backgroundColor = "";
                btnSubmitPengajuan.disabled = false;
                return;
            }

            if (!confirm("Pastikan data yang Anda masukkan sudah benar. Kirim pengajuan?")) {
                btnSubmitPengajuan.textContent = "Kirim Pengajuan";
                btnSubmitPengajuan.style.backgroundColor = "";
                btnSubmitPengajuan.disabled = false;
                return;
            }

            const formData = new FormData();
            formData.append("title", title);
            formData.append("location", location);
            formData.append("category_id", category_id);
            formData.append("description", description);
            formData.append("image_url", imageFile);

            try {
                const response = await fetch(`${BASE_URL}/requests`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    modalPengajuan.style.display = "none";
                    formPengajuan.reset();
                    showToast('Pengajuan berhasil dikirim', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showToast(`Gagal mengirim pengajuan: ${result.message || result.error}`, 'error');
                }
            } catch (error) {
                console.error("Error submit pengajuan:", error);
                showToast("Terjadi kesalahan jaringan saat mengirim data", 'error');
            } finally {
                btnSubmitPengajuan.textContent = "Kirim Pengajuan";
                btnSubmitPengajuan.style.backgroundColor = "";
                btnSubmitPengajuan.disabled = false;
            }
        });
    }

    const modalDetail = document.getElementById("modalDetail");
    const closeModalDetail = document.getElementById("closeModalDetail");
    if (closeModalDetail) {
        closeModalDetail.addEventListener("click", () => {
            modalDetail.style.display = "none";
        });
    }

    window.addEventListener("click", (event) => {
        if (event.target === modalPengajuan) {
            modalPengajuan.style.display = "none";
            if(formPengajuan) formPengajuan.reset();
        }
        if (event.target === modalDetail) {
            modalDetail.style.display = "none";
        }
    });

});

window.lihatDetail = async function(id, type) {
    const modal = document.getElementById('modalDetail');
    const endpoint = type === 'req' ? 'requests' : 'reports';
    
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (response.ok) {
            const data = result.data;
            document.getElementById('detailImage').src = data.image_url || 'https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image';
            document.getElementById('detailTitle').textContent = data.title;
            document.getElementById('detailDate').textContent = new Date(data.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            document.getElementById('detailLocation').textContent = data.location;
            document.getElementById('detailCategory').textContent = data.Category?.name || data.category?.name || data.category_id || 'N/A';
            document.getElementById('detailDescription').textContent = data.description;
            
            const historyContainer = document.getElementById('detailHistoryContainer');
            historyContainer.innerHTML = '';
            
            if (data.FormsHistories && data.FormsHistories.length > 0) {
                const histories = data.FormsHistories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                histories.forEach(hist => {
                    const histDate = new Date(hist.createdAt).toLocaleString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
                    });
                    const html = `
                        <div class="history-item">
                            <div class="history-status badge ${hist.status}">${hist.status.toUpperCase()}</div>
                            <div class="history-date">${histDate}</div>
                            <div class="history-note">${hist.note || '<i>Tidak ada catatan admin</i>'}</div>
                        </div>
                    `;
                    historyContainer.insertAdjacentHTML('beforeend', html);
                });
            } else {
                historyContainer.innerHTML = '<p class="text-muted">Belum ada riwayat pemrosesan dari admin.</p>';
            }
            
            modal.style.display = 'flex';
        } else {
            showToast('Gagal memuat detail', 'error');
        }
    } catch (error) {
        showToast('Terjadi kesalahan jaringan', 'error');
        console.error(error);
    }
};
