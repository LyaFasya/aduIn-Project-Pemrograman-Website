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

async function hapusPelaporan(id) {
    const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Data pelaporan ini akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const card = document.getElementById(`card-rep-${id}`);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.remove(), 300);
            }
            showToast('Pelaporan berhasil dihapus', 'success');
        } else {
            const result = await response.json();
            showToast(`Gagal menghapus: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error delete:', error);
        showToast("Terjadi kesalahan pada saat menghapus data", 'error');
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    try {
        const categoryResponse = await fetch(`${BASE_URL}/categories`);
        const categoryResult = await categoryResponse.json();
        if (categoryResponse.ok && categoryResult.data) {
            const catPelaporan = document.getElementById('category_id_pelaporan');
            if (catPelaporan) {
                categoryResult.data.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    catPelaporan.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }

    const pelaporanContainer = document.getElementById('pelaporanContainer');
    try {
        const response = await fetch(`${BASE_URL}/reports`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (response.ok) {
            pelaporanContainer.innerHTML = '';
            const dataPelaporan = result.data || result;

            if (!dataPelaporan || dataPelaporan.length === 0) {
                pelaporanContainer.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <div class="empty-icon">📢</div>
                        <h3>Belum Ada Pelaporan</h3>
                        <p>Klik "Buat Laporan" untuk mengirimkan laporan kerusakanmu.</p>
                    </div>`;
            } else {
                dataPelaporan.forEach(item => {
                    const tanggal = new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    });
                    const statusLabel = item.status ? item.status.toUpperCase() : 'PENDING';
                    const imgSrc = item.image_url || 'https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image';

                    const cardHTML = `
                        <div class="card" id="card-rep-${item.id}">
                            <img src="${imgSrc}" alt="Foto ${item.title}" class="card-img" onerror="this.src='https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image'">
                            <div class="card-body">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                                    <span class="badge ${item.status || 'pending'}">${statusLabel}</span>
                                    <small style="color:var(--text-muted);font-size:0.8rem;">${tanggal}</small>
                                </div>
                                <h3 class="card-title">${item.title}</h3>
                                <p class="card-location">${item.location}</p>
                                <p class="card-desc" style="margin-bottom:14px;">${item.description}</p>
                                <div style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                                    <button onclick="lihatDetail(${item.id}, 'rep')" class="btn btn-outline" style="flex: 1;">🔍 Detail</button>
                                    <button onclick="hapusPelaporan(${item.id})" class="btn-delete" style="flex: 1;">🗑 Hapus</button>
                                </div>
                            </div>
                        </div>`;
                    pelaporanContainer.insertAdjacentHTML('beforeend', cardHTML);
                });
            }
        } else {
            pelaporanContainer.innerHTML = `<p>Tidak dapat memuat data pelaporan.</p>`;
        }
    } catch (error) {
        pelaporanContainer.innerHTML = `<p>Tidak dapat terhubung ke server</p>`;
    }

    const modalPelaporan = document.getElementById("modalPelaporan");
    const btnBuatPelaporan = document.getElementById("btnBuatPelaporan");
    const closePelaporan = document.getElementById("closeModalPelaporan");
    const formPelaporan = document.getElementById("formPelaporan");
    const btnSubmitPelaporan = document.getElementById("btnSubmitPelaporan");

    if (btnBuatPelaporan) btnBuatPelaporan.addEventListener("click", () => modalPelaporan.style.display = "flex");
    if (closePelaporan) {
        closePelaporan.addEventListener("click", () => {
            modalPelaporan.style.display = "none";
            formPelaporan.reset(); 
        });
    }

    if (formPelaporan) {
        formPelaporan.addEventListener("submit", async function(e) {
            e.preventDefault(); 
            btnSubmitPelaporan.textContent = "Sedang diproses";
            btnSubmitPelaporan.style.backgroundColor = "#ccc";
            btnSubmitPelaporan.disabled = true;

            const title = document.getElementById("title_pelaporan").value;
            const location = document.getElementById("location_pelaporan").value;
            const category_id = document.getElementById("category_id_pelaporan").value;
            const description = document.getElementById("description_pelaporan").value;
            const imageFile = document.getElementById("image_pelaporan").files[0];

            if (!title || !location || !category_id || !description || !imageFile) {
                Swal.fire('Peringatan', 'Harap isi semua field dan unggah gambar.', 'warning');
                btnSubmitPelaporan.textContent = "Kirim Laporan";
                btnSubmitPelaporan.style.backgroundColor = "";
                btnSubmitPelaporan.disabled = false;
                return;
            }

            const confirmResult = await Swal.fire({
                title: 'Kirim Laporan?',
                text: "Pastikan data yang Anda masukkan sudah benar.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Ya, Kirim!',
                cancelButtonText: 'Batal'
            });

            if (!confirmResult.isConfirmed) {
                btnSubmitPelaporan.textContent = "Kirim Laporan";
                btnSubmitPelaporan.style.backgroundColor = "";
                btnSubmitPelaporan.disabled = false;
                return;
            }

            const formData = new FormData();
            formData.append("title", title);
            formData.append("location", location);
            formData.append("category_id", category_id);
            formData.append("description", description);
            formData.append("image_url", imageFile); 

            try {
                const response = await fetch(`${BASE_URL}/reports`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    modalPelaporan.style.display = "none";
                    formPelaporan.reset();
                    showToast('Laporan berhasil dikirim', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showToast(`Gagal mengirim laporan: ${result.message || result.error}`, 'error');
                }
            } catch (error) {
                console.error("Error submit pelaporan:", error);
                showToast("Terjadi kesalahan jaringan saat mengirim data", 'error');
            } finally {
                btnSubmitPelaporan.textContent = "Kirim Laporan";
                btnSubmitPelaporan.style.backgroundColor = "";
                btnSubmitPelaporan.disabled = false;
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
        if (event.target === modalPelaporan) {
            modalPelaporan.style.display = "none";
            if(formPelaporan) formPelaporan.reset();
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
