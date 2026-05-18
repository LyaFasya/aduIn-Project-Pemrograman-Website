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
        'process': 'status-proses',
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
    const sections = ['sectionDashboard', 'sectionKategori', 'sectionPelaporan', 'sectionPengajuan', 'sectionProfil'];
    sections.forEach(sec => {
        const el = document.getElementById(sec);
        if (el) el.classList.toggle('active', sec === 'section' + section.charAt(0).toUpperCase() + section.slice(1));
    });

    const navLinks = document.querySelectorAll('.sidebar-nav a[data-selection], .logout-section a[data-selection]');
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.selection === section);
    });

    if (section === 'pelaporan') loadLaporan('containerPelaporanFull');
    if (section === 'pengajuan') loadPengajuan('containerPengajuanFull');
    if (section === 'profil') loadAdminProfile();
}

// ============ REPORT FUNCTIONS - CARD BASED ============
async function loadLaporan(containerId = 'containerLaporanDashboard', limit = null) {
    const token = localStorage.getItem('aduin_token');
    const container = document.getElementById(containerId);

    try {
        const response = await fetch(`${BASE_URL}/reports`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (response.ok) {
            const dataLaporan = result.data || result;

            if (!dataLaporan || dataLaporan.length === 0) {
                container.innerHTML = `<div class="no-data"><p>Tidak ada laporan</p></div>`;
                const btnLihatSemua = document.getElementById('btnLaporanLihatSemua');
                if (btnLihatSemua) btnLihatSemua.style.display = 'none';
                return;
            }

            container.innerHTML = '';
            let itemsToRender = dataLaporan;
            
            const btnLihatSemua = document.getElementById('btnLaporanLihatSemua');
            if (limit && containerId === 'containerLaporanDashboard') {
                if (dataLaporan.length > limit) {
                    if (btnLihatSemua) btnLihatSemua.style.display = 'block';
                } else {
                    if (btnLihatSemua) btnLihatSemua.style.display = 'none';
                }
                itemsToRender = itemsToRender.slice(0, limit);
            } else if (containerId === 'containerPelaporanFull') {
                if (btnLihatSemua) btnLihatSemua.style.display = 'none';
            }

            itemsToRender.forEach(item => {
                const imgSrc = item.image_url || 'https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image';
                const tanggalUpdated = formatDate(item.updatedAt || item.createdAt);

                const cardHTML = `
                    <div class="card" id="card-${item.id}">
                        <img src="${imgSrc}" alt="Foto ${item.title}" class="card-img" onerror="this.src='https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image'">
                        <div class="card-body">
                            <div class="card-meta">
                                ${getStatusBadge(item.status)}
                                <small>${tanggalUpdated}</small>
                            </div>
                            
                            <h3 class="card-title">${item.title}</h3>
                            <p class="card-location">${item.location}</p>
                            <p class="card-desc">${item.description}</p>
                            
                            <div class="card-actions">
                                <button class="btn btn-outline" onclick="lihatDetailLaporan(${item.id})">Detail</button>
                                <button class="btn btn-blue" onclick="openModalUpdateStatus(${item.id}, 'laporan', '${item.status}')">Update Status</button>
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
                container.innerHTML = `<div class="no-data"><p>Gagal memuat data: ${result.message}</p></div>`;
            }
        }
    } catch (error) {
        console.error('Error loading laporan:', error);
        container.innerHTML = `<div class="no-data"><p>Tidak dapat terhubung ke server</p></div>`;
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
            const kategori = laporan.Category?.name || laporan.category?.name || laporan.category_id || 'N/A';

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

function openModalUpdateStatus(id, type, currentStatus) {
    document.getElementById('updateStatusId').value = id;
    document.getElementById('updateStatusType').value = type;
    document.getElementById('updateStatusSelect').value = currentStatus;
    document.getElementById('updateStatusNote').value = ''; // Reset notes
    document.getElementById('modalUpdateStatus').style.display = 'flex';
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

async function loadPengajuan(containerId = 'containerPengajuanDashboard', limit = null) {
    const token = localStorage.getItem('aduin_token');
    const container = document.getElementById(containerId);

    try {
        const response = await fetch(`${BASE_URL}/requests`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (response.ok) {
            const dataPengajuan = result.data || result;

            if (!dataPengajuan || dataPengajuan.length === 0) {
                container.innerHTML = `<div class="no-data"><p>Tidak ada pengajuan</p></div>`;
                const btnLihatSemua = document.getElementById('btnPengajuanLihatSemua');
                if (btnLihatSemua) btnLihatSemua.style.display = 'none';
                return;
            }

            container.innerHTML = '';
            let itemsToRender = dataPengajuan;
            
            const btnLihatSemua = document.getElementById('btnPengajuanLihatSemua');
            if (limit && containerId === 'containerPengajuanDashboard') {
                if (dataPengajuan.length > limit) {
                    if (btnLihatSemua) btnLihatSemua.style.display = 'block';
                } else {
                    if (btnLihatSemua) btnLihatSemua.style.display = 'none';
                }
                itemsToRender = itemsToRender.slice(0, limit);
            } else if (containerId === 'containerPengajuanFull') {
                if (btnLihatSemua) btnLihatSemua.style.display = 'none';
            }

            itemsToRender.forEach(item => {
                const imgSrc = item.image_url || 'https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image';
                const tanggalUpdated = formatDate(item.updatedAt || item.createdAt);

                const cardHTML = `
                    <div class="card" id="card-${item.id}">
                        <img src="${imgSrc}" alt="Foto ${item.title}" class="card-img" onerror="this.src='https://placehold.co/400x200/1a1d2e/6C63FF?text=No+Image'">
                        <div class="card-body">
                            <div class="card-meta">
                                ${getStatusBadge(item.status)}
                                <small>${tanggalUpdated}</small>
                            </div>
                            
                            <h3 class="card-title">${item.title}</h3>
                            <p class="card-location">${item.location}</p>
                            <p class="card-desc">${item.description}</p>
                            
                            <div class="card-actions">
                                <button class="btn btn-outline" onclick="lihatDetailPengajuan(${item.id})">Detail</button>
                                <button class="btn btn-blue" onclick="openModalUpdateStatus(${item.id}, 'pengajuan', '${item.status}')">Update Status</button>
                                <button class="btn btn-delete" onclick="deletePengajuan(${item.id})">Hapus</button>
                            </div>
                        </div>
                    </div>`;

                container.insertAdjacentHTML('beforeend', cardHTML);
            });
        } else {
            if (response.status === 401 || response.status === 403) {
            } else {
                container.innerHTML = `<div class="no-data"><p>Gagal memuat data: ${result.message}</p></div>`;
            }
        }
    } catch (error) {
        console.error('Error loading pengajuan:', error);
        container.innerHTML = `<div class="no-data"><p>Tidak dapat terhubung ke server</p></div>`;
    }
}

async function lihatDetailPengajuan(id) {
    const token = localStorage.getItem('aduin_token');
    const modal = document.getElementById('modalDetail');
    const detailContent = document.getElementById('detailContent');

    try {
        const response = await fetch(`${BASE_URL}/requests/${id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (response.ok) {
            const pengajuan = result.data || result;
            const imgSrc = pengajuan.image_url || 'https://placehold.co/600x400/1a1d2e/6C63FF?text=No+Image';
            const tanggal = formatDate(pengajuan.createdAt);
            const kategori = pengajuan.Category?.name || pengajuan.category_id || 'N/A';

            detailContent.innerHTML = `
                <img src="${imgSrc}" alt="${pengajuan.title}" class="detail-image" onerror="this.src='https://placehold.co/600x400/1a1d2e/6C63FF?text=No+Image'">

                <div class="detail-info">
                    <strong>Judul:</strong>
                    <p>${pengajuan.title}</p>
                </div>

                <div class="detail-info">
                    <strong>Lokasi:</strong>
                    <p>${pengajuan.location}</p>
                </div>

                <div class="detail-info">
                    <strong>Kategori:</strong>
                    <p>${kategori}</p>
                </div>

                <div class="detail-info">
                    <strong>Status:</strong>
                    <p>${getStatusBadge(pengajuan.status)}</p>
                </div>

                <div class="detail-info">
                    <strong>Deskripsi:</strong>
                    <p>${pengajuan.description}</p>
                </div>

                <div class="detail-info">
                    <strong>Tanggal Pengajuan:</strong>
                    <p>${tanggal}</p>
                </div>


            `;

            modal.classList.add('show');
        } else {
            showToast('Gagal memuat detail pengajuan', 'error');
        }
    } catch (error) {
        console.error('Error loading detail:', error);
        showToast('Terjadi kesalahan saat memuat detail', 'error');
    }
}

// Legacy direct update functions removed as they are replaced by modal


async function approvePengajuanAndClose(id) {
    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/requests/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'done', note: 'Disetujui oleh admin' })
        });

        if (response.ok) {
            showToast('Pengajuan berhasil disetujui', 'success');
            document.getElementById('modalDetail').classList.remove('show');
            loadPengajuan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message || 'Tidak dapat menyetujui pengajuan'}`, 'error');
        }
    } catch (error) {
        console.error('Error approve:', error);
        showToast('Terjadi kesalahan saat menyetujui pengajuan', 'error');
    }
}

async function rejectPengajuanAndClose(id) {
    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/requests/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'rejected', note: 'Ditolak oleh admin' })
        });

        if (response.ok) {
            showToast('Pengajuan berhasil ditolak', 'success');
            document.getElementById('modalDetail').classList.remove('show');
            loadPengajuan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message || 'Tidak dapat menolak pengajuan'}`, 'error');
        }
    } catch (error) {
        console.error('Error reject:', error);
        showToast('Terjadi kesalahan saat menolak pengajuan', 'error');
    }
}

async function deletePengajuan(id) {
    const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Data pengajuan ini akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/requests/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Pengajuan berhasil dihapus', 'success');
            loadPengajuan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error delete:', error);
        showToast('Terjadi kesalahan saat menghapus pengajuan', 'error');
    }
}

async function deletePengajuanAndClose(id) {
    const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Data pengajuan ini akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('aduin_token');

    try {
        const response = await fetch(`${BASE_URL}/requests/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Pengajuan berhasil dihapus', 'success');
            document.getElementById('modalDetail').classList.remove('show');
            loadPengajuan();
        } else {
            const result = await response.json();
            showToast(`Gagal: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error delete:', error);
        showToast('Terjadi kesalahan saat menghapus pengajuan', 'error');
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

    // Get admin profile using dedicated function handled below

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
            setActiveSection('profil');
        });
    }

    // Close modal
    if (closeModalDetail) {
        closeModalDetail.addEventListener('click', function () {
            modalDetail.classList.remove('show');
        });
    }

    // Modal Update Status Events
    const modalUpdateStatus = document.getElementById('modalUpdateStatus');
    const closeUpdateStatusBtn = document.getElementById('closeModalUpdateStatus');
    const btnCancelUpdateStatus = document.getElementById('btnCancelUpdateStatus');
    const formUpdateStatus = document.getElementById('formUpdateStatus');

    if (closeUpdateStatusBtn) {
        closeUpdateStatusBtn.addEventListener('click', () => {
            modalUpdateStatus.style.display = 'none';
        });
    }

    if (btnCancelUpdateStatus) {
        btnCancelUpdateStatus.addEventListener('click', () => {
            modalUpdateStatus.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalDetail) {
            modalDetail.style.display = 'none';
        }
        if (e.target === modalUpdateStatus) {
            modalUpdateStatus.style.display = 'none';
        }
    });

    if (formUpdateStatus) {
        formUpdateStatus.addEventListener('submit', async function(e) {
            e.preventDefault();
            const id = document.getElementById('updateStatusId').value;
            const type = document.getElementById('updateStatusType').value;
            const status = document.getElementById('updateStatusSelect').value;
            const note = document.getElementById('updateStatusNote').value;

            const token = localStorage.getItem('aduin_token');
            const endpoint = type === 'laporan' ? `/reports/${id}/status` : `/requests/${id}/status`;

            try {
                const response = await fetch(`${BASE_URL}${endpoint}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status, note })
                });

                if (response.ok) {
                    showToast('Status berhasil diubah', 'success');
                    modalUpdateStatus.style.display = 'none';
                    if (type === 'laporan') loadLaporan();
                    else loadPengajuan();
                } else {
                    const result = await response.json();
                    showToast(`Gagal: ${result.message}`, 'error');
                }
            } catch (error) {
                console.error('Error update status:', error);
                showToast('Terjadi kesalahan saat mengubah status', 'error');
            }
        });
    }

    const sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-selection]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const selection = this.dataset.selection;
            setActiveSection(selection);
        });
    });

    // Load dashboard by default
    loadPengajuan('containerPengajuanDashboard', 4);
    loadLaporan('containerLaporanDashboard', 4);
    loadKategori();
    loadAdminProfile();

    const formKategori = document.getElementById('formKategori');

if (formKategori) {
    formKategori.addEventListener('submit', tambahKategori);
}

const formProfilAdmin = document.getElementById('formProfilAdmin');
if (formProfilAdmin) {
    formProfilAdmin.addEventListener('submit', updateAdminProfile);
}
});

async function loadAdminProfile() {
    const token = localStorage.getItem('aduin_token');
    try {
        const response = await fetch(`${BASE_URL}/profiles`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok && result.data) {
            const user = result.data;
            const profile = user.Profile || {};

            document.getElementById('adminProfileName').value = user.name || '';
            document.getElementById('adminProfileEmail').value = user.email || '';
            document.getElementById('adminProfilePhone').value = profile.phone || '';
            document.getElementById('adminProfileAddress').value = profile.address || '';
            
            const photoSrc = profile.photo || `https://ui-avatars.com/api/?name=${user.name}&background=random`;
            document.getElementById('adminProfilePreview').src = photoSrc;
            
            const sidebarImg = document.getElementById('sidebarProfileImg');
            if (sidebarImg) sidebarImg.src = photoSrc;
            
            document.getElementById('adminName').textContent = `Halo, Admin ${user.name || ''}`;
        }
    } catch (error) {
        console.error('Error loading admin profile:', error);
    }
}

async function updateAdminProfile(e) {
    e.preventDefault();
    const token = localStorage.getItem('aduin_token');
    const name = document.getElementById('adminProfileName').value;
    const email = document.getElementById('adminProfileEmail').value;
    const phone = document.getElementById('adminProfilePhone').value;
    const address = document.getElementById('adminProfileAddress').value;
    const password = document.getElementById('adminProfilePassword').value;
    const photoFile = document.getElementById('adminProfilePhoto').files[0];
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    if (phone) formData.append("phone", phone);
    if (address) formData.append("address", address);
    if (password) formData.append("password", password);
    if (photoFile) formData.append("photo", photoFile);
    
    try {
        const response = await fetch(`${BASE_URL}/profiles`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const result = await response.json();
        if (response.ok) {
            showToast('Profil berhasil diperbarui', 'success');
            document.getElementById('adminProfilePassword').value = '';
            document.getElementById('adminProfilePhoto').value = '';
            document.getElementById('adminName').textContent = `Halo, Admin ${name}`;
            loadAdminProfile(); // Refresh the photo
        } else {
            showToast(result.message || 'Gagal memperbarui profil', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Terjadi kesalahan saat mengunggah', 'error');
    }
}
