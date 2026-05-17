const BASE_URL = 'http://localhost:3000';

// Cek token
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

function getStatusBadge(status) {
    const statusMap = {
        'pending': 'status-pending',
        'process': 'status-pending',
        'done': 'status-approved',
        'rejected': 'status-rejected'
    };
    const labelMap = {
        'pending': 'Pending',
        'process': 'Proses',
        'done': 'Selesai',
        'rejected': 'Ditolak'
    };
    const className = statusMap[status] || 'status-pending';
    const label = labelMap[status] || 'Pending';
    return `<span class="status-badge ${className}">${label}</span>`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// ============ REPORT FUNCTIONS - CARD BASED ============
async function loadLaporan() {
    const token = localStorage.getItem('aduin_token');
    const container = document.getElementById('containerLaporan');

    try {
        const response = await fetch(`${BASE_URL}/reports`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (response.ok) {
            const dataLaporan = result.data || result;

            if (!dataLaporan || dataLaporan.length === 0) {
                container.innerHTML = `<div class="no-data" style="grid-column: 1/-1;"><p>Tidak ada laporan</p></div>`;
                return;
            }

            container.innerHTML = '';
            dataLaporan.forEach(item => {
                const imgSrc = item.image_url || 'https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image';
                const tanggal = formatDate(item.createdAt);
                const kategori = item.category?.name || item.category_id || 'N/A';

                const cardHTML = `
                    <div class="card" id="card-${item.id}">
                        <img src="${imgSrc}" alt="Foto ${item.title}" class="card-img" onerror="this.src='https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image'">
                        <div class="card-body">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                                <span class="badge ${item.status}">${getStatusBadge(item.status)}</span>
                                <small style="color:var(--text-muted);font-size:0.8rem;">${tanggal}</small>
                            </div>
                            <h3 class="card-title">${item.title}</h3>
                            <p class="card-location">${item.location}</p>
                            <p class="card-desc">${item.description}</p>
                            <div class="card-actions">
                                <button class="btn btn-blue" onclick="lihatDetailLaporan(${item.id})">Detail</button>
                                ${item.status === 'pending' || item.status === 'process' ? `
                                    <button class="btn btn-approve" onclick="updateStatusLaporan(${item.id}, 'done')">Selesai</button>
                                ` : ''}
                                <button class="btn btn-delete" onclick="deleteLaporan(${item.id})">Hapus</button>
                            </div>
                        </div>
                    </div>`;

                container.insertAdjacentHTML('beforeend', cardHTML);
            });
        } else {
            if (response.status === 401 || response.status === 403) {
                showToast('Sesi habis, silakan login kembali', 'error');
                localStorage.removeItem('aduin_token');
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            } else {
                container.innerHTML = `<div class="no-data" style="grid-column: 1/-1;"><p>Gagal memuat data: ${result.message}</p></div>`;
            }
        }
    } catch (error) {
        console.error('Error loading laporan:', error);
        container.innerHTML = `<div class="no-data" style="grid-column: 1/-1;"><p>Tidak dapat terhubung ke server</p></div>`;
    }
}

async function lihatDetailLaporan(id) {
    const token = localStorage.getItem('aduin_token');
    const modal = document.getElementById('modalDetail');
    const detailContent = document.getElementById('detailContent');

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (response.ok) {
            const laporan = result.data || result;
            const imgSrc = laporan.image_url || 'https://placehold.co/600x400/1a1d2e/6C63FF?text=No+Image';
            const tanggal = formatDate(laporan.createdAt);
            const kategori = laporan.category?.name || laporan.category_id || 'N/A';

            detailContent.innerHTML = `
                <img src="${imgSrc}" alt="${laporan.title}" class="detail-image" onerror="this.src='https://placehold.co/600x400/1a1d2e/6C63FF?text=No+Image'">

                <div class="detail-info">
                    <strong>Judul:</strong>
                    <p>${laporan.title}</p>
                </div>

                <div class="detail-info">
                    <strong>Lokasi:</strong>
                    <p>${laporan.location}</p>
                </div>

                <div class="detail-info">
                    <strong>Kategori:</strong>
                    <p>${kategori}</p>
                </div>

                <div class="detail-info">
                    <strong>Status:</strong>
                    <p>${getStatusBadge(laporan.status)}</p>
                </div>

                <div class="detail-info">
                    <strong>Deskripsi:</strong>
                    <p>${laporan.description}</p>
                </div>

                <div class="detail-info">
                    <strong>Tanggal Laporan:</strong>
                    <p>${tanggal}</p>
                </div>

                ${laporan.status === 'pending' || laporan.status === 'process' ? `
                    <div class="detail-actions">
                        <button class="btn btn-approve" onclick="approveLaporanAndClose(${laporan.id})">Selesaikan</button>
                        <button class="btn btn-reject" onclick="rejectLaporanAndClose(${laporan.id})">Tolak</button>
                        <button class="btn btn-delete" onclick="deleteLaporanAndClose(${laporan.id})">Hapus</button>
                    </div>
                ` : `
                    <div class="detail-actions">
                        <button class="btn btn-delete" onclick="deleteLaporanAndClose(${laporan.id})">Hapus</button>
                    </div>
                `}
            `;

            modal.classList.add('show');
        } else {
            showToast('Gagal memuat detail laporan', 'error');
        }
    } catch (error) {
        console.error('Error loading detail:', error);
        showToast('Terjadi kesalahan saat memuat detail', 'error');
    }
}

async function approveLaporan(id) {
    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'done', note: 'Disetujui oleh admin' })
        });

        if (response.ok) {
            showToast('Laporan berhasil disetujui', 'success');
            loadLaporan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message || 'Tidak dapat menyetujui laporan'}`, 'error');
        }
    } catch (error) {
        console.error('Error approve:', error);
        showToast('Terjadi kesalahan saat menyetujui laporan', 'error');
    }
}

async function updateStatusLaporan(id, status) {
    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status, note: 'Status diubah oleh admin' })
        });

        if (response.ok) {
            showToast('Status laporan berhasil diubah', 'success');
            loadLaporan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error update status:', error);
        showToast('Terjadi kesalahan saat mengubah status', 'error');
    }
}

async function approveLaporanAndClose(id) {
    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'done', note: 'Disetujui oleh admin' })
        });

        if (response.ok) {
            showToast('Laporan berhasil disetujui', 'success');
            document.getElementById('modalDetail').classList.remove('show');
            loadLaporan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message || 'Tidak dapat menyetujui laporan'}`, 'error');
        }
    } catch (error) {
        console.error('Error approve:', error);
        showToast('Terjadi kesalahan saat menyetujui laporan', 'error');
    }
}

async function rejectLaporan(id) {
    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'rejected', note: 'Ditolak oleh admin' })
        });

        if (response.ok) {
            showToast('Laporan berhasil ditolak', 'success');
            loadLaporan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message || 'Tidak dapat menolak laporan'}`, 'error');
        }
    } catch (error) {
        console.error('Error reject:', error);
        showToast('Terjadi kesalahan saat menolak laporan', 'error');
    }
}

async function rejectLaporanAndClose(id) {
    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'rejected', note: 'Ditolak oleh admin' })
        });

        if (response.ok) {
            showToast('Laporan berhasil ditolak', 'success');
            document.getElementById('modalDetail').classList.remove('show');
            loadLaporan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message || 'Tidak dapat menolak laporan'}`, 'error');
        }
    } catch (error) {
        console.error('Error reject:', error);
        showToast('Terjadi kesalahan saat menolak laporan', 'error');
    }
}

async function deleteLaporan(id) {
    const yakin = confirm('Apakah Anda yakin akan menghapus laporan ini?');
    if (!yakin) return;

    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Laporan berhasil dihapus', 'success');
            loadLaporan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error delete:', error);
        showToast('Terjadi kesalahan saat menghapus laporan', 'error');
    }
}

async function deleteLaporanAndClose(id) {
    const yakin = confirm('Apakah Anda yakin akan menghapus laporan ini?');
    if (!yakin) return;

    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/reports/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Laporan berhasil dihapus', 'success');
            document.getElementById('modalDetail').classList.remove('show');
            loadLaporan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error delete:', error);
        showToast('Terjadi kesalahan saat menghapus laporan', 'error');
    }
}

// ============ MAIN INIT ============
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('aduin_token');
    const btnLogout = document.getElementById('btnLogout');
    const linkProfile = document.getElementById('linkProfile');
    const modalDetail = document.getElementById('modalDetail');
    const closeModalDetail = document.getElementById('closeModalDetail');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Get admin profile
    fetch(`${BASE_URL}/profiles`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(result => {
            if (result.data) {
                const profile = result.data;
                document.getElementById('adminName').textContent = profile.User?.name || 'Admin';
            }
        })
        .catch(err => console.error('Error loading profile:', err));

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('aduin_token');
            window.location.href = 'login.html';
        });
    }

    // Profile link
    if (linkProfile) {
        linkProfile.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }

    // Close modal
    if (closeModalDetail) {
        closeModalDetail.addEventListener('click', function () {
            modalDetail.classList.remove('show');
        });
    }

    window.addEventListener('click', function (e) {
        if (e.target === modalDetail) {
            modalDetail.classList.remove('show');
        }
    });

    // Load dashboard by default
    loadLaporan();
});
