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
    const yakin = confirm("Apakah Anda yakin akan menghapus pengajuan ini?");
    if (!yakin) return;
    
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

async function hapusPelaporan(id) {
    const yakin = confirm('Apakah Anda yakin akan menghapus pelaporan ini?');
    if (!yakin) return;

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
    const heroGreeting = document.getElementById('heroGreeting');
    if (heroGreeting && token) {
        try {
            const profileRes = await fetch(`${BASE_URL}/profiles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
                const profileResult = await profileRes.json();
                if (profileResult.data && profileResult.data.name) {
                    heroGreeting.textContent = `Halo, ${profileResult.data.name}!`;
                }
            } else {
                heroGreeting.textContent = "Halo!";
            }
        } catch (e) {
            heroGreeting.textContent = "Halo!";
        }
    }

    try {
        const categoryResponse = await fetch(`${BASE_URL}/categories`);
        const categoryResult = await categoryResponse.json();
        if (categoryResponse.ok && categoryResult.data) {
            const catPengajuan = document.getElementById('category_id_pengajuan');
            const catPelaporan = document.getElementById('category_id_pelaporan');
            
            categoryResult.data.forEach(cat => {
                const option1 = document.createElement('option');
                option1.value = cat.id;
                option1.textContent = cat.name;
                if(catPengajuan) catPengajuan.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = cat.id;
                option2.textContent = cat.name;
                if(catPelaporan) catPelaporan.appendChild(option2);
            });
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }

    function renderCards(containerId, dataList, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (!dataList || dataList.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-icon">${type === 'req' ? '📝' : '📢'}</div>
                    <h3>Belum Ada Data</h3>
                    <p>Mulai berpartisipasi dengan menekan tombol di atas.</p>
                </div>`;
            return;
        }

        dataList.forEach(item => {
            const tanggal = new Date(item.updatedAt || item.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            const statusLabel = item.status ? item.status.toUpperCase() : 'PENDING';
            const imgSrc = item.image_url || 'https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image';
            
            const deleteFn = type === 'req' ? `hapusPengajuan(${item.id})` : `hapusPelaporan(${item.id})`;

            let adminNoteHtml = '';
            if (item.FormsHistories && item.FormsHistories.length > 0) {
                const latestHistory = item.FormsHistories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                if (latestHistory && latestHistory.note) {
                    adminNoteHtml = `<div style="background-color: var(--c-beige); padding: 10px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 15px; border-left: 3px solid var(--c-teal);"><strong>Admin:</strong> ${latestHistory.note}</div>`;
                }
            }

            const cardHTML = `
                <div class="card" id="card-${type}-${item.id}" style="background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden;">
                    <img src="${imgSrc}" alt="Foto ${item.title}" class="card-img" onerror="this.src='https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image'">
                    <div class="card-body">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                            <span class="badge ${item.status || 'pending'}">${statusLabel}</span>
                            <small style="color:var(--text-muted);font-size:0.8rem;">${tanggal}</small>
                        </div>
                        <h3 class="card-title" style="color: var(--c-navy);">${item.title}</h3>
                        <p class="card-location" style="color: var(--text-muted); margin-bottom: 5px;">📍 ${item.location}</p>
                        <p class="card-desc" style="margin-bottom:14px; color: var(--text-main);">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</p>
                        
                        ${adminNoteHtml}
                        
                        <div style="display: flex; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                            <button onclick="lihatDetail(${item.id}, '${type}')" class="btn btn-outline" style="flex: 1; border-color: var(--c-teal); color: var(--c-teal);">🔍 Detail</button>
                            <button onclick="${deleteFn}" class="btn-delete" style="flex: 1;">🗑 Hapus</button>
                        </div>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    let fullDataPengajuan = [];
    let isPengajuanExpanded = false;
    const pengajuanContainer = document.getElementById('pengajuanContainer');
    const viewAllPengajuanContainer = document.getElementById('viewAllPengajuanContainer');
    const btnViewAllPengajuan = document.getElementById('btnViewAllPengajuan');

    try {
        const response = await fetch(`${BASE_URL}/requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok) {
            fullDataPengajuan = result.data || result;
            if (fullDataPengajuan.length > 3) {
                renderCards('pengajuanContainer', fullDataPengajuan.slice(0, 3), 'req');
                viewAllPengajuanContainer.style.display = 'block';
            } else {
                renderCards('pengajuanContainer', fullDataPengajuan, 'req');
                viewAllPengajuanContainer.style.display = 'none';
            }
        } else {
            pengajuanContainer.innerHTML = `<p>Tidak dapat memuat data pengajuan.</p>`;
        }
    } catch (error) {
        pengajuanContainer.innerHTML = `<p>Tidak dapat terhubung ke server</p>`;
    }

    if (btnViewAllPengajuan) {
        btnViewAllPengajuan.addEventListener('click', () => {
            if (!isPengajuanExpanded) {
                renderCards('pengajuanContainer', fullDataPengajuan, 'req');
                btnViewAllPengajuan.textContent = "Tampilkan Sedikit";
                isPengajuanExpanded = true;
            } else {
                renderCards('pengajuanContainer', fullDataPengajuan.slice(0, 4), 'req');
                btnViewAllPengajuan.textContent = "Lihat Semua Pengajuan";
                isPengajuanExpanded = false;
            }
        });
    }

    let fullDataPelaporan = [];
    let isPelaporanExpanded = false;
    const pelaporanContainer = document.getElementById('pelaporanContainer');
    const viewAllPelaporanContainer = document.getElementById('viewAllPelaporanContainer');
    const btnViewAllPelaporan = document.getElementById('btnViewAllPelaporan');

    try {
        const response = await fetch(`${BASE_URL}/reports`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok) {
            fullDataPelaporan = result.data || result;
            if (fullDataPelaporan.length > 3) {
                renderCards('pelaporanContainer', fullDataPelaporan.slice(0, 3), 'rep');
                viewAllPelaporanContainer.style.display = 'block';
            } else {
                renderCards('pelaporanContainer', fullDataPelaporan, 'rep');
                viewAllPelaporanContainer.style.display = 'none';
            }
        } else {
            pelaporanContainer.innerHTML = `<p>Tidak dapat memuat data pelaporan.</p>`;
        }
    } catch (error) {
        pelaporanContainer.innerHTML = `<p>Tidak dapat terhubung ke server</p>`;
    }

    const modalDetail = document.getElementById("modalDetail");
    const closeModalDetail = document.getElementById("closeModalDetail");
    if (closeModalDetail) {
        closeModalDetail.addEventListener("click", () => {
            modalDetail.style.display = "none";
        });
    }

    window.addEventListener("click", (event) => {
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
