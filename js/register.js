/* ═══════════════════════════════════════════════════════════
   CRS — register.js
═══════════════════════════════════════════════════════════ */
'use strict';

const API_BASE_R = (
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

  /* ── Role selector ── */
  let selectedRole = 'user';
  const roleCards = document.querySelectorAll('.role-card');
  const adminOnlyFields = document.querySelectorAll('.admin-only-fields');

  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedRole = card.dataset.role;
      adminOnlyFields.forEach(f => f.classList.toggle('visible', selectedRole === 'admin'));
      document.getElementById('agency').required     = selectedRole === 'admin';
      document.getElementById('jurisdiction').required = selectedRole === 'admin';
      document.getElementById('adminCode').required  = selectedRole === 'admin';
    });
  });

  /* ── Password show/hide ── */
  function pwToggle(toggleId, inputId) {
    const btn   = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.querySelector('i').className = `fas fa-eye${show ? '-slash' : ''}`;
    });
  }
  pwToggle('pwToggle', 'password');
  pwToggle('pwToggle2', 'confirmPassword');

  /* ── Password strength ── */
  const passwordInput = document.getElementById('password');
  const strengthFill  = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');

  passwordInput && passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    let score = 0;
    if (val.length >= 8)  score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const levels = [
      { pct: '20%',  bg: 'var(--red)',    label: 'Weak' },
      { pct: '40%',  bg: 'var(--red)',    label: 'Fair' },
      { pct: '65%',  bg: 'var(--amber)',  label: 'Good' },
      { pct: '100%', bg: 'var(--green)',  label: 'Strong' },
    ];
    const lv = val.length === 0 ? null : levels[score > 0 ? score - 1 : 0];
    if (strengthFill) {
      strengthFill.style.width      = lv ? lv.pct : '0%';
      strengthFill.style.background = lv ? lv.bg  : '';
    }
    if (strengthLabel) strengthLabel.textContent = lv ? lv.label : '';
  });

  /* ── Form submit ── */
  const form = document.getElementById('registerForm');
  const alertDiv = document.getElementById('registerAlert');
  const alertMsg = document.getElementById('registerAlertMsg');
  const successDiv = document.getElementById('registerSuccess');

  function showError(msg) {
    alertMsg.textContent = msg;
    alertDiv.classList.add('show');
    successDiv.style.display = 'none';
    alertDiv.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertDiv.classList.remove('show');

    const firstName  = document.getElementById('firstName').value.trim();
    const lastName   = document.getElementById('lastName').value.trim();
    const email      = document.getElementById('email').value.trim();
    const phone      = document.getElementById('phone').value.trim();
    const password   = document.getElementById('password').value;
    const confirm    = document.getElementById('confirmPassword').value;
    const terms      = document.getElementById('terms').checked;

    if (!firstName || !lastName || !email || !phone || !password || !confirm) { showError('Please fill in all required fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email address.'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { showError('Passwords do not match.'); return; }
    if (!terms) { showError('Please accept the Terms of Service to continue.'); return; }

    const data = {
      name: `${firstName} ${lastName}`, email, phone, password, role: selectedRole,
      area: document.getElementById('area').value.trim()
    };

    if (selectedRole === 'admin') {
      const agency     = document.getElementById('agency').value.trim();
      const jurisdiction = document.getElementById('jurisdiction').value.trim();
      const adminCode  = document.getElementById('adminCode').value.trim();
      if (!agency || !jurisdiction || !adminCode) { showError('Please fill in all admin fields.'); return; }
      if (adminCode !== 'ADMIN2026') { showError('Invalid admin registration code.'); return; }
      Object.assign(data, { agency, jurisdiction, adminCode });
    }

    const submitBtn = form.querySelector('.auth-submit');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account…';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE_R}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }

      saveLocally(data);
      showSuccess();

    } catch (error) {
      if (!IS_LOCAL_DEV) {
        showError(error.message || 'Registration failed. Please try again.');
        return;
      }
      saveLocally(data);
      showSuccess();
    } finally {
      submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
      submitBtn.disabled = false;
    }
  });

  function saveLocally(data) {
    const reg = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
    const id  = (data.role === 'admin' ? 'ADM' : 'USR') + Date.now();
    reg[id] = { ...data, id, status:'active', registeredAt: new Date().toISOString() };
    localStorage.setItem('registeredUsers', JSON.stringify(reg));
  }

  function showSuccess() {
    successDiv.style.display = 'flex';
    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
  }
});
