const BASE_URL = 'http://localhost:3000';

// Cek token dan role admin
const _tokenCheck = localStorage.getItem('aduin_token');
const _roleCheck = localStorage.getItem('aduin_role');
if (!_tokenCheck || _roleCheck !== 'admin') {
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

function setActiveSection(section) {
    const dashboardSection = document.getElementById('sectionDashboard');
    const kategoriSection = document.getElementById('sectionKategori');
    const navLinks = document.querySelectorAll('.sidebar-nav a[data-selection]');

    if (dashboardSection) dashboardSection.classList.toggle('active', section === 'dashboard');
    if (kategoriSection) kategoriSection.classList.toggle('active', section === 'kategori');

    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.selection === section);
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
                const kategori = item.Category?.name || item.category_id || 'N/A';

                const cardHTML = `
                    <div class="card" id="card-${item.id}">
                        <img src="${imgSrc}" alt="Foto ${item.title}" class="card-img" onerror="this.src='https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image'">
                        <div class="card-body">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                                ${getStatusBadge(item.status)}
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

// ============ CATEGORY FUNCTIONS ============
async function loadKategori() {
    const token = localStorage.getItem('aduin_token');
    const container = document.getElementById('containerKategori');

    if (!container) return;

    try {
        const response = await fetch(`${BASE_URL}/categories`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            const dataKategori = result.data || result;

            if (!dataKategori || dataKategori.length === 0) {
                container.innerHTML = `<p>Tidak ada kategori</p>`;
                return;
            }

            container.innerHTML = '';

            dataKategori.forEach(item => {
                container.innerHTML += `
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title">${item.name}</h3>
                        </div>
                    </div>
                `;
            });
        } else {
            container.innerHTML = `<p>Gagal memuat kategori</p>`;
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p>Tidak dapat terhubung ke server</p>`;
    }
}

async function tambahKategori(e) {
    e.preventDefault();

    const token = localStorage.getItem('aduin_token');
    const name = document.getElementById('categoryName').value;

    try {
        const response = await fetch(`${BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Kategori berhasil ditambahkan', 'success');

            document.getElementById('formKategori').reset();

            loadKategori();
        } else {
            showToast(result.message || 'Gagal tambah kategori', 'error');
        }

    } catch (error) {
        console.error(error);
        showToast('Terjadi kesalahan', 'error');
    }
}

// ============ MAIN INIT ============
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('aduin_token');
    const btnLogout = document.getElementById('btnLogout');
    const linkProfile = document.getElementById('linkProfile');
    const modalDetail = document.getElementById('modalDetail');
    const closeModalDetail = document.getElementById('closeModalDetail');

    const role = localStorage.getItem('aduin_role');
    if (!token || role !== 'admin') {
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
            localStorage.removeItem('aduin_role');
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
        if (modalDetail && e.target === modalDetail) {
            modalDetail.classList.remove('show');
        }
    });

    const sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-selection]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const selection = this.dataset.selection;
            setActiveSection(selection);
        });
    });

    // Load dashboard by default
    loadLaporan();
    loadKategori();

    const formKategori = document.getElementById('formKategori');

if (formKategori) {
    formKategori.addEventListener('submit', tambahKategori);
}
});
