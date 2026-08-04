// Merender sidebar + topbar yang sama di semua halaman internal,
// supaya navigasi konsisten tanpa perlu template engine.
function renderLayout(activePage) {
  Auth.requireLogin();
  const user = Auth.getUser() || {};

  const menu = [
    { key: 'dashboard', href: 'dashboard.html', icon: 'fa-chart-pie', label: 'Dashboard' },
    { key: 'income', href: 'income.html', icon: 'fa-arrow-down', label: 'Pemasukan' },
    { key: 'expense', href: 'expense.html', icon: 'fa-arrow-up', label: 'Pengeluaran' },
    { key: 'targets', href: 'targets.html', icon: 'fa-bullseye', label: 'Target Tabungan' },
    { key: 'calendar', href: 'calendar.html', icon: 'fa-calendar-days', label: 'Kalender Menabung' },
    { key: 'history', href: 'history.html', icon: 'fa-clock-rotate-left', label: 'Riwayat Transaksi' },
    { key: 'achievements', href: 'achievements.html', icon: 'fa-award', label: 'Achievement' },
    { key: 'profile', href: 'profile.html', icon: 'fa-user', label: 'Profil' },
  ];
  if (user.role === 'admin') {
    menu.push({ key: 'admin', href: 'admin.html', icon: 'fa-user-shield', label: 'Admin Panel' });
  }

  const sidebarHtml = `
    <div class="p-5 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#22C55E,#16A34A)">
        <i class="fa-solid fa-piggy-bank text-white"></i>
      </div>
      <span class="font-bold text-lg">MySavings</span>
    </div>
    <nav class="flex flex-col gap-1 px-3">
      ${menu.map(m => `<a href="${m.href}" class="sidebar-link ${m.key === activePage ? 'active' : ''}">
        <i class="fa-solid ${m.icon} w-4"></i> ${m.label}
      </a>`).join('')}
    </nav>
    <div class="px-3 mt-4">
      <button id="logoutBtn" class="sidebar-link w-full text-left text-red-500">
        <i class="fa-solid fa-right-from-bracket w-4"></i> Keluar
      </button>
    </div>
  `;

  const avatarFallback = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user.fullName || 'U');
  const avatarUrl = user.photoUrl
    ? (window.MYSAVINGS_API_BASE || '').replace('/api', '') + user.photoUrl
    : avatarFallback;

  const topbarHtml = `
    <div class="flex items-center justify-between px-6 py-4">
      <div>
        <p class="text-sm" style="color:var(--text-muted)">Halo,</p>
        <p class="font-semibold">${user.fullName || 'Pengguna'}</p>
      </div>
      <div class="flex items-center gap-3">
        <button id="darkModeToggle" class="w-10 h-10 rounded-full glass-card flex items-center justify-center">
          <i class="fa-solid fa-moon"></i>
        </button>
        <img id="topbarAvatar" src="${avatarFallback}"
          class="w-10 h-10 rounded-full object-cover border" />
      </div>
    </div>
  `;

  document.getElementById('sidebar').innerHTML = sidebarHtml;
  document.getElementById('topbar').innerHTML = topbarHtml;

  if (user.photoUrl) {
    fetch(avatarUrl, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then((res) => (res.ok ? res.blob() : Promise.reject()))
      .then((blob) => {
        document.getElementById('topbarAvatar').src = URL.createObjectURL(blob);
      })
      .catch(() => {});
  }

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    Auth.clearToken();
    window.location.href = 'login.html';
  });

  document.getElementById('darkModeToggle').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('darkMode', !isDark);
  });

  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}
