/* ═══════════════════════════════════════════════════════════
   CRS — shared.js
   Theme toggle · Toast · Utilities used on every page
═══════════════════════════════════════════════════════════ */
'use strict';

/* ── THEME ── */
(function initTheme() {
  const html    = document.documentElement;
  const saved   = localStorage.getItem('crs-theme') || 'dark';
  html.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('crs-theme', next);
    });
  });
})();

/* ── TOAST ── */
window.showToast = function(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideToast 0.3s ease reverse both';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

/* ── FORMAT helpers ── */
window.formatDate = function(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })
    + ' ' + d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
};

window.formatStatus = function(s) {
  return { submitted:'Submitted', 'under-review':'Under Review', resolved:'Resolved', rejected:'Rejected', active:'Active', inactive:'Inactive', suspended:'Suspended' }[s] || s;
};

window.getStatusClass = function(s) {
  return { submitted:'submitted', 'under-review':'under-review', resolved:'resolved', rejected:'rejected' }[s] || 'submitted';
};

window.getTypeColor = function(type) {
  return { crime:'var(--red)', flood:'var(--accent)', fire:'var(--red)', accident:'var(--amber)', health:'var(--green)', infrastructure:'#8b5cf6', other:'var(--text-muted)' }[type] || 'var(--accent)';
};

window.getTypeIcon = function(type) {
  return { crime:'fa-user-ninja', flood:'fa-water', fire:'fa-fire', accident:'fa-car-burst', health:'fa-heart-pulse', infrastructure:'fa-wrench', other:'fa-triangle-exclamation' }[type] || 'fa-file-lines';
};

/* ── NAVBAR SCROLL (homepage) ── */
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Hamburger */
  const ham = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (ham && navLinks) {
    ham.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      ham.setAttribute('aria-expanded', open);
    });
  }
});

/* ── LOGOUT ── */
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', () => {
    if (!confirm('Are you sure you want to logout?')) return;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  });
});
