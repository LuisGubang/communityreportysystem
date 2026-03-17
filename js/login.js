/* ═══════════════════════════════════════════════════════════
   CRS — login.js
═══════════════════════════════════════════════════════════ */
'use strict';

const API_BASE = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
)
  ? 'http://localhost:5000/api'
  : `${window.location.origin}/api`;

const IS_LOCAL_DEV = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

document.addEventListener('DOMContentLoaded', () => {

  /* ── Handle logout param ── */
  if (new URLSearchParams(window.location.search).get('logout') === '1') {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    history.replaceState(null, '', 'login.html');
  }

  /* ── Redirect if already logged in (only if token exists) ── */
  const stored = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const token  = localStorage.getItem('authToken');
  if (stored && token) {
    window.location.href = stored.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
    return;
  }

  /* ── Role selector ── */
  let selectedRole = 'user';
  const roleCards = document.querySelectorAll('.role-card');
  const adminCodeField = document.getElementById('adminCodeField');

  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedRole = card.dataset.role;

      if (adminCodeField) {
        adminCodeField.classList.toggle('visible', selectedRole === 'admin');
        document.getElementById('adminCode').required = selectedRole === 'admin';
      }
    });
  });

  /* ── Password toggle ── */
  const pwToggle = document.getElementById('pwToggle');
  const pwInput  = document.getElementById('password');
  if (pwToggle && pwInput) {
    pwToggle.addEventListener('click', () => {
      const show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      pwToggle.querySelector('i').className = `fas fa-eye${show ? '-slash' : ''}`;
    });
  }

  /* ── Form submit ── */
  const form      = document.getElementById('loginForm');
  const alertDiv  = document.getElementById('loginAlert');
  const alertMsg  = document.getElementById('loginAlertMsg');
  const submitBtn = document.getElementById('loginSubmit');

  function showError(msg) {
    alertMsg.textContent = msg;
    alertDiv.classList.add('show');
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function hideError() { alertDiv.classList.remove('show'); }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const adminCode = document.getElementById('adminCode')?.value || '';

    if (!email || !password) { showError('Please fill in all required fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email address.'); return; }
    if (selectedRole === 'admin' && !adminCode) { showError('Admin access code is required.'); return; }

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in…';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        redirect(data.user.role);
        return;
      }

      const err = await response.json();
      throw new Error(err.message || 'Invalid credentials');

    } catch (apiErr) {
      if (!IS_LOCAL_DEV) {
        showError(apiErr.message || 'Login failed. Please try again in a moment.');
        return;
      }

      const user = localAuth(email, password, selectedRole, adminCode);
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        redirect(user.role);
        return;
      }
      showError(apiErr.message || 'Invalid email or password. Please try again.');
    } finally {
      submitBtn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> Sign In';
      submitBtn.disabled = false;
    }
  });

  function redirect(role) {
    window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
  }

  function localAuth(email, password, role, adminCode) {
    const DEMO = {
      'user@test.com':  { id:'USR001', name:'John Doe',      email:'user@test.com',  role:'user',  password:'password123' },
      'admin@test.com': { id:'ADM001', name:'Admin Officer',  email:'admin@test.com', role:'admin', password:'admin123',   adminCode:'ADMIN2026' },
    };
    const demo = DEMO[email.toLowerCase()];
    if (demo && demo.password === password && demo.role === role) {
      if (role === 'admin' && adminCode !== demo.adminCode && adminCode !== 'DEMO-2026') return null;
      const { password: _, adminCode: __, ...safe } = demo;
      return safe;
    }
    const reg = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
    for (const u of Object.values(reg)) {
      if (u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role) {
        const { password: _, ...safe } = u;
        return safe;
      }
    }
    return null;
  }
});
