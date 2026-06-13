// ================================================
// AUTH MODULE
// ================================================

let CURRENT_USER = null;

function checkAuth() {
  const raw = sessionStorage.getItem('lm_session');
  if (!raw) { window.location.href = 'login.html'; return false; }
  try {
    CURRENT_USER = JSON.parse(raw);
    renderUserPill();
    return true;
  } catch(e) {
    sessionStorage.removeItem('lm_session');
    window.location.href = 'login.html';
    return false;
  }
}

const ROLE_LABEL = {
  admin:  'Admin',
  pm:     'Project Manager',
  ac:     'Area Coordinator',
  tl:     'Team Leader',
  client: 'Client',
};

function renderUserPill() {
  const el = document.getElementById('userPill');
  if (!el || !CURRENT_USER) return;
  const ini = CURRENT_USER.nama.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  el.innerHTML = `
    <div class="user-ava">${ini}</div>
    <div>
      <div class="user-name">${CURRENT_USER.nama.split(' ')[0]}</div>
      <div class="user-role">${ROLE_LABEL[CURRENT_USER.role]||CURRENT_USER.role}</div>
    </div>
    <button class="btn-logout" onclick="doLogout()" title="Logout">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    </button>`;

  // Tampilkan menu Kelola User jika admin/pm
  if (CAN_MANAGE.includes(CURRENT_USER.role)) {
    const manageNav = document.getElementById('navManage');
    if (manageNav) manageNav.style.display = '';
  }
}

function doLogout() {
  if (confirm('Yakin ingin keluar dari dashboard?')) {
    sessionStorage.removeItem('lm_session');
    window.location.href = 'login.html';
  }
}

// Filter rows berdasarkan role TL
function applyRoleFilter(rows) {
  if (!CURRENT_USER) return rows;
  // TL hanya lihat data TL mereka — tapi semua data tetap tampil sesuai diskusi
  // Semua role lihat semua data
  return rows;
}
