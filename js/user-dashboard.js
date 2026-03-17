/* ═══════════════════════════════════════════════════════════
   CRS — user-dashboard.js
═══════════════════════════════════════════════════════════ */
'use strict';

let currentUser = null;
let userReportMap = null;
let reportMarker  = null;
let galleryIndex  = 0;
let autoGallery   = null;

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

const GALLERY_IMAGES = [
  { src:'assets/images/accident.avif', title:'Road Accident' },
  { src:'assets/images/fire.jpg',      title:'Fire Outbreak' },
  { src:'assets/images/flood.jpeg',    title:'Flood / Disaster' },
  { src:'assets/images/robbery.webp',  title:'Crime / Robbery' },
  { src:'assets/images/stealing.jpg',  title:'Theft' },
];

window.switchSection = switchSection;

document.addEventListener('DOMContentLoaded', async () => {

  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) { window.location.href = 'login.html'; return; }
  if (currentUser.role === 'admin') { window.location.href = 'admin-dashboard.html'; return; }

  document.getElementById('userNameDisplay').textContent = currentUser.name || 'User';
  const av = document.getElementById('userAvatar');
  if (av) av.textContent = (currentUser.name || 'U')[0].toUpperCase();

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar       = document.getElementById('appSidebar');
  sidebarToggle && sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  await syncReportsFromApi();
  loadDashboardStats();
  loadRecentReports();
  loadGallery();
  loadNotifications();
  initRealtime();

  setInterval(async () => {
    await syncReportsFromApi();
    loadDashboardStats();
    loadRecentReports();
    if (document.getElementById('reports-section')?.classList.contains('active')) {
      renderUserReports();
    }
  }, 10000);

  const params = new URLSearchParams(window.location.search);
  if (params.get('section')) switchSection(params.get('section'));

  initNewReportForm();
  initProfileForm();

  document.getElementById('searchReports')?.addEventListener('input', renderUserReports);
  document.getElementById('statusFilter')?.addEventListener('change', renderUserReports);
});

function switchSection(name) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  const section = document.getElementById(`${name}-section`);
  const link    = document.querySelector(`.sidebar-link[data-section="${name}"]`);
  if (section) section.classList.add('active');
  if (link)    link.classList.add('active');

  if (name === 'new-report') initMap();
  if (name === 'reports')    renderUserReports();
  if (name === 'notifications') loadNotifications();
  if (name === 'profile')   fillProfile();
}

function loadDashboardStats() {
  const all      = JSON.parse(localStorage.getItem('reports') || '[]');
  const mine     = all.filter(r => r.userId === currentUser.id);
  const submitted   = mine.filter(r => r.status === 'submitted').length;
  const underReview = mine.filter(r => r.status === 'under-review').length;
  const resolved    = mine.filter(r => r.status === 'resolved').length;

  document.getElementById('submittedCount').textContent   = submitted;
  document.getElementById('underReviewCount').textContent = underReview;
  document.getElementById('resolvedCount').textContent    = resolved;

  const latest = mine.sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
  const latestEl = document.getElementById('latestUpdateTime');
  if (latestEl) latestEl.textContent = latest ? formatDate(latest.submittedAt) : 'N/A';
}

async function syncReportsFromApi() {
  const token = localStorage.getItem('authToken');
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE}/reports?limit=200`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load reports');

    const payload = await response.json();
    const apiReports = Array.isArray(payload.data) ? payload.data : [];
    localStorage.setItem('reports', JSON.stringify(apiReports));
  } catch (error) {
    if (!IS_LOCAL_DEV) {
      showToast('Could not sync reports from server. Please refresh and login again.', 'error');
    }
  }
}

function loadRecentReports() {
  const all   = JSON.parse(localStorage.getItem('reports') || '[]');
  const mine  = all.filter(r => r.userId === currentUser.id).slice(0, 5);
  const el    = document.getElementById('recentReportsList');
  if (!el) return;

  if (mine.length === 0) {
    el.innerHTML = `<div class="empty-state-d"><i class="fas fa-inbox"></i><p>No reports yet. <a href="#" onclick="switchSection('new-report')" style="color:var(--accent)">Submit your first.</a></p></div>`;
    return;
  }
  el.innerHTML = mine.map(r => reportItemHTML(r)).join('');
}

function reportItemHTML(r) {
  const color = getTypeColor(r.incidentType);
  const icon  = getTypeIcon(r.incidentType);
  return `
    <div class="report-item-d">
      <div class="ri-type-icon" style="background:${color}20;color:${color}">
        <i class="fas ${icon}"></i>
      </div>
      <div class="ri-body">
        <div class="ri-title">${r.title}</div>
        <div class="ri-meta"><i class="fas fa-location-dot" style="margin-right:0.3rem"></i>${r.location} &nbsp;·&nbsp; ${formatDate(r.submittedAt)}</div>
      </div>
      <span class="ri-status ${getStatusClass(r.status)}">${formatStatus(r.status)}</span>
    </div>`;
}

function renderUserReports() {
  const all   = JSON.parse(localStorage.getItem('reports') || '[]');
  let mine    = all.filter(r => r.userId === currentUser.id);
  const search= (document.getElementById('searchReports')?.value || '').toLowerCase();
  const status= document.getElementById('statusFilter')?.value || '';

  if (search) mine = mine.filter(r => r.title.toLowerCase().includes(search) || r.location.toLowerCase().includes(search));
  if (status) mine = mine.filter(r => r.status === status);

  const el = document.getElementById('userReportsList');
  if (!el) return;
  if (mine.length === 0) {
    el.innerHTML = `<div class="empty-state-d"><i class="fas fa-file-lines"></i><p>No reports found.</p></div>`;
    return;
  }
  el.innerHTML = mine.map(r => reportItemHTML(r)).join('');
}

function loadGallery() {
  const img     = document.getElementById('galleryImage');
  const title   = document.getElementById('imageTitle');
  const counter = document.getElementById('imageCounter');
  const thumbs  = document.querySelectorAll('.gal-thumb');
  const prev    = document.getElementById('prevBtn');
  const next    = document.getElementById('nextBtn');
  if (!img) return;

  function go(idx) {
    galleryIndex = ((idx % GALLERY_IMAGES.length) + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
    const item = GALLERY_IMAGES[galleryIndex];
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = item.src;
      if (title)   title.textContent   = item.title;
      if (counter) counter.textContent = `${galleryIndex + 1} / ${GALLERY_IMAGES.length}`;
      img.style.opacity = '1';
    }, 200);
    thumbs.forEach((t, i) => {
      t.style.borderColor = i === galleryIndex ? 'var(--accent)' : 'var(--border)';
      t.style.background  = i === galleryIndex ? 'var(--accent-soft)' : 'var(--bg-elevated)';
    });
  }

  prev && prev.addEventListener('click', () => { clearInterval(autoGallery); go(galleryIndex - 1); });
  next && next.addEventListener('click', () => { clearInterval(autoGallery); go(galleryIndex + 1); });
  thumbs.forEach((t, i) => t.addEventListener('click', () => { clearInterval(autoGallery); go(i); }));
  autoGallery = setInterval(() => go(galleryIndex + 1), 5000);
}

function loadNotifications() {
  const el = document.getElementById('notificationsList');
  if (!el) return;

  const all  = JSON.parse(localStorage.getItem('userNotifications') || '{}');
  const mine = (all[currentUser.email] || []).slice().reverse();

  const badge = document.getElementById('notifBadge');

  if (mine.length === 0) {
    el.innerHTML = '<div class="empty-state-d"><i class="fas fa-bell-slash"></i><p>No notifications yet. Updates about your reports will appear here.</p></div>';
    if (badge) badge.style.display = 'none';
    return;
  }

  const unread = mine.filter(n => !n.read).length;
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }

  const iconMap = { info:'fa-circle-info', success:'fa-circle-check', warning:'fa-triangle-exclamation', error:'fa-circle-xmark' };

  el.innerHTML = mine.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div class="notif-icon ${n.type || 'info'}"><i class="fas ${iconMap[n.type] || 'fa-circle-info'}"></i></div>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-message">${n.message}</div>
        <div class="notif-time">${formatDate(n.sentAt)}</div>
      </div>
      ${!n.read ? '<div class="unread-dot"></div>' : ''}
    </div>
  `).join('');
}

function initMap() {
  if (userReportMap) { setTimeout(() => userReportMap.invalidateSize(), 200); return; }
  const el = document.getElementById('reportMap');
  if (!el) return;

  userReportMap = L.map('reportMap').setView([-1.2921, 36.8219], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
  }).addTo(userReportMap);

  userReportMap.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (reportMarker) userReportMap.removeLayer(reportMarker);
    reportMarker = L.marker([lat, lng]).addTo(userReportMap).bindPopup('Report Location').openPopup();
    const locInput = document.getElementById('location');
    if (locInput) locInput.value = `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`;
  });
}

function initNewReportForm() {
  const form = document.getElementById('newReportForm');
  if (!form) return;

  document.getElementById('photos')?.addEventListener('change', function() {
    const preview = document.getElementById('photoPreview');
    if (!preview) return;
    preview.innerHTML = '';
    Array.from(this.files).slice(0, 5).forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.insertAdjacentHTML('beforeend', `
          <div class="photo-item">
            <img src="${ev.target.result}" alt="Photo ${i+1}"/>
            <button type="button" class="remove-btn" onclick="this.closest('.photo-item').remove()">×</button>
          </div>`);
      };
      reader.readAsDataURL(file);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertDiv = document.getElementById('reportAlertDiv');
    const alertMsg = document.getElementById('reportAlertMsg');
    const successDiv = document.getElementById('reportSuccessDiv');
    const successMsg = document.getElementById('reportSuccessMsg');

    alertDiv.classList.remove('show');
    successDiv.style.display = 'none';

    const type  = document.getElementById('incidentType').value;
    const title = document.getElementById('title').value.trim();
    const desc  = document.getElementById('description').value.trim();
    const loc   = document.getElementById('location').value.trim();

    if (!type || !title || !desc || !loc) {
      alertMsg.textContent = 'Please fill in all required fields.';
      alertDiv.classList.add('show');
      return;
    }

    const token = localStorage.getItem('authToken');
    let report = null;

    if (token) {
      try {
        const response = await fetch(`${API_BASE}/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            incidentType: type,
            title,
            description: desc,
            location: loc,
            anonymous: document.getElementById('anonymous').checked
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || err.message || 'Failed to submit report');
        }

        const payload = await response.json();
        report = payload.data;
        await syncReportsFromApi();
      } catch (error) {
        if (!IS_LOCAL_DEV) {
          alertMsg.textContent = error.message || 'Failed to submit report to server.';
          alertDiv.classList.add('show');
          return;
        }
      }
    }

    if (!report) {
      report = {
        id: 'RPT-' + Date.now(),
        userId: currentUser.id,
        submittedBy: currentUser.email,
        incidentType: type,
        title, description: desc, location: loc,
        anonymous: document.getElementById('anonymous').checked,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        updates: []
      };

      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      reports.push(report);
      localStorage.setItem('reports', JSON.stringify(reports));
    }

    successMsg.textContent = `Report submitted! ID: ${report.id}`;
    successDiv.style.display = 'flex';
    form.reset();
    document.getElementById('photoPreview').innerHTML = '';
    if (reportMarker) { userReportMap.removeLayer(reportMarker); reportMarker = null; }

    loadDashboardStats();
    loadRecentReports();

    setTimeout(() => switchSection('reports'), 2500);
  });
}

function fillProfile() {
  document.getElementById('profileName').value     = currentUser.name  || '';
  document.getElementById('profileEmail').value    = currentUser.email || '';
  document.getElementById('profilePhone').value    = currentUser.phone || '';
  document.getElementById('profileLocation').value = currentUser.location || '';
  document.getElementById('profileDisplayName').textContent  = currentUser.name  || '—';
  document.getElementById('profileDisplayEmail').textContent = currentUser.email || '—';
  const av = document.getElementById('profileAvatar');
  if (av) av.textContent = (currentUser.name || 'U')[0].toUpperCase();
}

function initProfileForm() {
  document.getElementById('profileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser.name     = document.getElementById('profileName').value.trim();
    currentUser.email    = document.getElementById('profileEmail').value.trim();
    currentUser.phone    = document.getElementById('profilePhone').value.trim();
    currentUser.location = document.getElementById('profileLocation').value.trim();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    document.getElementById('profileSuccessDiv').style.display = 'flex';
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    const av = document.getElementById('userAvatar');
    if (av) av.textContent = currentUser.name[0].toUpperCase();

    setTimeout(() => { document.getElementById('profileSuccessDiv').style.display = 'none'; }, 3000);
  });
}

/* ── Real-time notifications ── */
function initRealtime() {
  // PRIMARY: storage event fires in this tab whenever ANOTHER tab changes localStorage
  window.addEventListener('storage', function(e) {

    // Admin updated a report status → notification was saved to userNotifications
    if (e.key === 'userNotifications') {
      var all = JSON.parse(e.newValue || '{}');
      var mine = (all[currentUser.email] || []);
      var unread = mine.filter(function(n) { return !n.read; }).length;

      // Update badge immediately
      var badge = document.getElementById('notifBadge');
      if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }

      // If the notifications section is already open, refresh it
      if (document.getElementById('notifications-section') &&
          document.getElementById('notifications-section').classList.contains('active')) {
        loadNotifications();
      }

      // Show a toast for the newest unread notification
      var unreadList = mine.filter(function(n) { return !n.read; });
      if (unreadList.length > 0) {
        var newest = unreadList[unreadList.length - 1];
        var toastType = newest.type === 'success' ? 'success' : newest.type === 'error' ? 'error' : 'info';
        showToast(newest.title + ' — ' + newest.message, toastType, 7000);
      }
    }

    // Reports list changed (stats need refreshing)
    if (e.key === 'reports') {
      loadDashboardStats();
      loadRecentReports();
      if (document.getElementById('reports-section') &&
          document.getElementById('reports-section').classList.contains('active')) {
        renderUserReports();
      }
    }
  });

  // FALLBACK POLLING: refresh badge every 5 seconds (catches same-tab changes too)
  setInterval(function() {
    var all = JSON.parse(localStorage.getItem('userNotifications') || '{}');
    var mine = (all[currentUser.email] || []);
    var unread = mine.filter(function(n) { return !n.read; }).length;
    var badge = document.getElementById('notifBadge');
    if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
  }, 4000);
}
