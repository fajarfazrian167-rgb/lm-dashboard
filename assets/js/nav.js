// ================================================
// SHARED NAVIGATION v5 — User Menu + Theme + Refresh
// ================================================

function buildNav(activePage) {
    const pages = [
    { id:'index',       label:'Summary',     href:'index.html',       icon:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
    { id:'store',       label:'Store',       href:'store.html',       icon:'<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>' },
    { id:'md-tl',       label:'MD & TL',     href:'md-tl.html',       icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { id:'consumption', label:'Consumption', href:'consumption.html', icon:'<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>' },
    { id:'trend',       label:'Trend',       href:'trend.html',       icon:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' },
    { id:'analytics',   label:'Customer Analytics', href:'customer-analytics.html', icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="21" x2="23" y2="14"/><line x1="20" y1="17" x2="26" y2="17"/>' },
  ];

  const menuItems = pages.map(p => `
    <li>
      <a href="${p.href}" class="${activePage===p.id?'active':''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${p.icon}</svg>
        ${p.label}
      </a>
    </li>`).join('');

  const manageDisplay = CURRENT_USER && CAN_MANAGE.includes(CURRENT_USER.role) ? '' : 'display:none';
  const ini = CURRENT_USER ? CURRENT_USER.nama.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase() : '??';
  const roleLabel = {admin:'Admin',pm:'Project Manager',ac:'Area Coordinator',tl:'Team Leader',client:'Client'};

  document.getElementById('topnav').innerHTML = `
    <a href="index.html" class="nav-logo">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Le_Minerale_logo.svg/320px-Le_Minerale_logo.svg.png"
           alt="LM" style="height:34px"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="nav-logo-fallback" style="display:none">
        <div class="nav-logo-mark">LM</div>
        <div><div class="nav-logo-text">Le Minerale</div><div class="nav-logo-sub">COSMO RESIDENSIAL</div></div>
      </div>
    </a>

    <button class="nav-hamburger" onclick="toggleMobileNav()" aria-label="Menu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>

    <ul class="nav-menu" id="navMenu">${menuItems}
      <li id="navManage" style="${manageDisplay}">
        <a href="admin-users.html" class="${activePage==='admin-users'?'active':''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Kelola User
        </a>
      </li>
    </ul>

    <div class="nav-right">
      <!-- Sync status -->
      <div class="sync-badge">
        <span class="sync-dot loading" id="syncDot"></span>
        <span id="syncText">Memuat...</span>
      </div>

      <!-- Refresh button -->
      <button class="nav-icon-btn" onclick="manualRefresh()" title="Refresh Data" id="refreshBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>

      <!-- Theme switcher -->
      <button class="nav-icon-btn" onclick="toggleThemeMenu()" title="Ganti Tema" id="themeBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      </button>
      <div class="theme-menu" id="themeMenu">
        <div class="theme-title">Pilih Tema</div>
        <div class="theme-opts">
          <button onclick="setTheme('light')" class="theme-opt" data-theme="light">
            <span class="theme-swatch" style="background:linear-gradient(135deg,#F0F7FF,#fff)"></span>Light
          </button>
          <button onclick="setTheme('dark')" class="theme-opt" data-theme="dark">
            <span class="theme-swatch" style="background:linear-gradient(135deg,#1A2D4A,#0D1B2A)"></span>Dark
          </button>
          <button onclick="setTheme('blue')" class="theme-opt" data-theme="blue">
            <span class="theme-swatch" style="background:linear-gradient(135deg,#00AEEF,#003F8A)"></span>Ocean
          </button>
          <button onclick="setTheme('green')" class="theme-opt" data-theme="green">
            <span class="theme-swatch" style="background:linear-gradient(135deg,#E8F5E9,#fff)"></span>Fresh
          </button>
        </div>
      </div>

      <!-- Export -->
      <button class="btn-export" onclick="exportCSV(getRows(),'LM_Export.csv')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export
      </button>

      <!-- User menu -->
      <div class="user-menu-wrap" id="userMenuWrap">
        <div class="user-pill" onclick="toggleUserMenu()" id="userPillBtn">
          <div class="user-ava">${ini}</div>
          <div>
            <div class="user-name">${CURRENT_USER?CURRENT_USER.nama.split(' ')[0]:'User'}</div>
            <div class="user-role">${roleLabel[CURRENT_USER?.role]||''}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:#8AADC4;margin-left:4px"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dd-header">
            <div class="user-dd-ava">${ini}</div>
            <div>
              <div style="font-weight:700;font-size:13px;color:#0D2137">${CURRENT_USER?.nama||''}</div>
              <div style="font-size:11px;color:#8AADC4">${CURRENT_USER?.username||''}</div>
            </div>
          </div>
          <div class="user-dd-divider"></div>
          ${CAN_MANAGE.includes(CURRENT_USER?.role) ? '<a href="admin-users.html" class="user-dd-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>Kelola User</a>' : ''}
          <div class="user-dd-divider"></div>
          <button onclick="doLogout()" class="user-dd-item logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  `;

  // Close menus on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#userMenuWrap')) closeUserMenu();
    if (!e.target.closest('#themeBtn') && !e.target.closest('#themeMenu')) closeThemeMenu();
  });

  // Apply saved theme
  applyTheme(localStorage.getItem('lm_theme')||'light');
}

function toggleMobileNav() { document.getElementById('navMenu').classList.toggle('open'); }

function toggleUserMenu() { document.getElementById('userDropdown').classList.toggle('show'); }
function closeUserMenu()  { const el=document.getElementById('userDropdown'); if(el) el.classList.remove('show'); }

function toggleThemeMenu() { document.getElementById('themeMenu').classList.toggle('show'); }
function closeThemeMenu()  { const el=document.getElementById('themeMenu'); if(el) el.classList.remove('show'); }

function manualRefresh() {
  var btn = document.getElementById('refreshBtn');
  if (btn) { btn.disabled = true; btn.style.animation = 'spin 0.6s linear infinite'; }
  var p = (typeof forceRefresh === 'function') ? forceRefresh() : loadAllData();
  var done = function() {
    if (btn) { btn.disabled = false; btn.style.animation = ''; }
  };
  if (p && p.finally) p.finally(done); else setTimeout(done, 3000);
}
  loadAllData().finally ? loadAllData().finally(()=>{ if(btn){btn.style.animation='';btn.disabled=false;} }) : loadAllData();
  setTimeout(()=>{ if(btn){btn.style.animation='';btn.disabled=false;} }, 3000);
}

// ===== THEME ENGINE =====
function setTheme(name) {
  localStorage.setItem('lm_theme', name);
  applyTheme(name);
  closeThemeMenu();
  // Mark active
  document.querySelectorAll('.theme-opt').forEach(b => {
    b.classList.toggle('active', b.dataset.theme===name);
  });
}

function applyTheme(name) {
  const root = document.documentElement;
  const themes = {
    light: {
      '--bg':'#F0F7FF','--white':'#FFFFFF','--border':'#DCE8F5',
      '--text-primary':'#0D2137','--text-secondary':'#4A6580','--text-muted':'#8AADC4',
      '--lm-blue':'#00AEEF','--lm-blue-dark':'#0086C3','--lm-blue-light':'#E0F5FD','--lm-blue-pale':'#F0F9FF',
      '--sidebar-bg':'#0A1628','--card-shadow':'0 2px 12px rgba(0,174,239,0.08)',
    },
    dark: {
      '--bg':'#0D1B2A','--white':'#162436','--border':'#1E3248',
      '--text-primary':'#E8F4FF','--text-secondary':'#8AADC4','--text-muted':'#4A6580',
      '--lm-blue':'#00AEEF','--lm-blue-dark':'#33C4F5','--lm-blue-light':'#0D2D42','--lm-blue-pale':'#0A1F30',
      '--sidebar-bg':'#070F18','--card-shadow':'0 2px 12px rgba(0,0,0,0.3)',
    },
    blue: {
      '--bg':'#EBF7FD','--white':'#FFFFFF','--border':'#BAE3F5',
      '--text-primary':'#003F8A','--text-secondary':'#0066CC','--text-muted':'#4A9CC5',
      '--lm-blue':'#00AEEF','--lm-blue-dark':'#003F8A','--lm-blue-light':'#CCF0FF','--lm-blue-pale':'#E5F6FD',
      '--sidebar-bg':'#003F8A','--card-shadow':'0 2px 12px rgba(0,174,239,0.15)',
    },
    green: {
      '--bg':'#F0F9F0','--white':'#FFFFFF','--border':'#C8E6C9',
      '--text-primary':'#1B3A20','--text-secondary':'#2E7D32','--text-muted':'#66BB6A',
      '--lm-blue':'#2E7D32','--lm-blue-dark':'#1B5E20','--lm-blue-light':'#E8F5E9','--lm-blue-pale':'#F1F8F1',
      '--sidebar-bg':'#1B3A20','--card-shadow':'0 2px 12px rgba(46,125,50,0.08)',
    },
  };
  const t = themes[name]||themes.light;
  Object.entries(t).forEach(([k,v]) => root.style.setProperty(k,v));

  // Mark active button
  setTimeout(() => {
    document.querySelectorAll('.theme-opt').forEach(b => {
      b.classList.toggle('active', b.dataset.theme===name);
    });
  }, 100);
}
