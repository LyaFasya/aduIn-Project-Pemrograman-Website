const _tokenCheck = localStorage.getItem('aduin_token');
if (!_tokenCheck) {
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
    const yakin = confirm('Apakah Anda yakin akan menghapus pelaporan ini?');
    if (!yakin) return;

    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const card = document.getElementById(`card-${id}`);
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
        showToast('Terjadi kesalahan saat menghapus data', 'error');
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('pelaporanContainer');
    const btnLogout = document.getElementById('btnLogout');
    const token = localStorage.getItem('aduin_token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            localStorage.removeItem('aduin_token');
            localStorage.removeItem('aduin_role');
            window.location.href = 'login.html';
        });
    }

    try {
        const response = await fetch(`${BASE_URL}/reports`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (response.ok) {
            container.innerHTML = '';
            const dataPelaporan = result.data || result;

            if (!dataPelaporan || dataPelaporan.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📢</div>
                        <h3>Belum Ada Pelaporan</h3>
                        <p>Klik "Buat Laporan" untuk mengirimkan laporan kerusakanmu.</p>
                    </div>`;
                return;
            }

            dataPelaporan.forEach(item => {
                const tanggal = new Date(item.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                const statusLabel = item.status ? item.status.toUpperCase() : 'PENDING';
                const imgSrc = item.image_url || 'https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image';

                const cardHTML = `
                    <div class="card" id="card-${item.id}">
                        <img src="${imgSrc}" alt="Foto ${item.title}" class="card-img" onerror="this.src='https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image'">
                        <div class="card-body">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                                <span class="badge ${item.status || 'pending'}">${statusLabel}</span>
                                <small style="color:var(--text-muted);font-size:0.8rem;">${tanggal}</small>
                            </div>
                            <h3 class="card-title">${item.title}</h3>
                            <p class="card-location">${item.location}</p>
                            <p class="card-desc" style="margin-bottom:14px;">${item.description}</p>
                            <div class="card-actions">
                                <button onclick="hapusPelaporan(${item.id})" class="btn-delete">🗑 Hapus</button>
                            </div>
                        </div>
                    </div>`;

                container.insertAdjacentHTML('beforeend', cardHTML);
            });

        } else {
            if (response.status === 401 || response.status === 403) {
                showToast('Sesi habis, silakan login kembali', 'error');
                localStorage.removeItem('aduin_token');
                localStorage.removeItem('aduin_role');
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            } else {
                container.innerHTML = `<div class="empty-state"><p>Gagal memuat data: ${result.message}</p></div>`;
            }
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Tidak Dapat Terhubung</h3><p>Pastikan server sudah menyala.</p></div>`;
    }

    const modal = document.getElementById('modalPelaporan');
    const btnBukaModal = document.getElementById('btnBuatPelaporan');
    const btnTutupModal = document.getElementById('closeModal');
    const formPelaporan = document.getElementById('formPelaporan');
    const btnSubmit = document.getElementById('btnSubmitPelaporan');

    if (btnBukaModal) {
        btnBukaModal.addEventListener('click', () => { modal.style.display = 'flex'; });
    }

    const tutupModal = () => {
        modal.style.display = 'none';
        formPelaporan.reset();
    };

    if (btnTutupModal) btnTutupModal.addEventListener('click', tutupModal);
    window.addEventListener('click', (e) => { if (e.target === modal) tutupModal(); });

    if (formPelaporan) {
        formPelaporan.addEventListener('submit', async function (e) {
            e.preventDefault();

            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = 'Sedang diproses...';
            btnSubmit.disabled = true;

            const formData = new FormData();
            formData.append('title', document.getElementById('title').value);
            formData.append('location', document.getElementById('location').value);
            formData.append('category_id', document.getElementById('category_id').value);
            formData.append('description', document.getElementById('description').value);

            const imageFile = document.getElementById('image').files[0];
            if (imageFile) formData.append('image_url', imageFile);

            try {
                const response = await fetch(`${BASE_URL}/reports`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    tutupModal();
                    showToast('Laporan berhasil dikirim!', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showToast(`Gagal: ${result.message || result.error}`, 'error');
                }
            } catch (error) {
                console.error('Error submit:', error);
                showToast('Terjadi kesalahan jaringan', 'error');
            } finally {
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
            }
        });
    }
});