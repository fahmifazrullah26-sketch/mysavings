// Modul terpusat untuk memanggil REST API backend.
// Access token disimpan di memori (variabel JS) + localStorage sebagai fallback,
// refresh token dikelola otomatis oleh browser lewat httpOnly cookie.
const API_BASE = window.MYSAVINGS_API_BASE || 'http://localhost:5000/api';

const Auth = {
  getToken() {
    return localStorage.getItem('accessToken');
  },
  setToken(token) {
    localStorage.setItem('accessToken', token);
  },
  clearToken() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },
  getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },
  requireLogin() {
    if (!this.getToken()) window.location.href = 'login.html';
  },
};

async function apiRequest(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include', // kirim cookie refreshToken
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  // Access token kedaluwarsa -> coba refresh sekali lalu ulangi request
  if (res.status === 403 || res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiRequest(path, { method, body, isForm });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
  return data;
}

async function tryRefresh() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    Auth.setToken(data.data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// Format angka ke Rupiah
function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value || 0
  );
}
