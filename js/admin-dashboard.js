/* ═══════════════════════════════════════════════════════════
   CRS — admin-dashboard.js
═══════════════════════════════════════════════════════════ */
'use strict';

let currentUser = null;
let adminMap    = null;
let adminMapLayer = null;
let charts      = {};
let serverUsers = [];

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

window.switchSection   = switchSection;
window.closeReportModal = closeReportModal;
window.generateAnalyticsReport = generateAnalyticsReport;
window.saveNotificationConfig  = saveNotificationConfig;
window.confirmSendNotification = confirmSendNotification;

document.addEventListener('DOMContentLoaded', async () => {

  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) { window.location.href = 'login.html'; return; }
  if (currentUser.role !== 'admin') { window.location.href = 'user-dashboard.html'; return; }

  document.getElementById('adminNameDisplay').textContent = currentUser.name || 'Admin';
  const av = document.getElementById('adminAvatar');
  if (av) av.textContent = (currentUser.name || 'A')[0].toUpperCase();

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('appSidebar').classList.toggle('open');
  });

  await syncReportsFromApi();
  await syncUsersFromApi();
  loadDashboardStats();
  loadRecentReports();
  initCharts();
  loadNotifTarget();
  initRealtime();
  updateAdminNotifBadge();

  setInterval(async () => {
    await syncReportsFromApi();
    await syncUsersFromApi();
    loadDashboardStats();
    loadRecentReports();
    if (document.getElementById('all-reports-section')?.classList.contains('active')) {
      renderReportsTable();
    }
    if (document.getElementById('users-section')?.classList.contains('active')) {
      loadUserManagement();
    }
    if (document.getElementById('map-view-section')?.classList.contains('active')) {
      refreshAdminMapMarkers();
    }
  }, 10000);

  document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = {
      systemName: document.getElementById('systemName').value,
      supportEmail: document.getElementById('supportEmail').value,
      reportExpiryDays: document.getElementById('reportExpiryDays').value,
      maxReportsPerUser: document.getElementById('maxReportsPerUser').value,
      allowAnonymous: document.getElementById('allowAnonymous').checked,
      requireVerification: document.getElementById('requireVerification').checked,
    };
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    document.getElementById('settingsSuccessDiv').style.display = 'flex';
    showToast('Settings saved successfully!', 'success');
    setTimeout(() => document.getElementById('settingsSuccessDiv').style.display = 'none', 3000);
  });

  document.getElementById('searchAllReports')?.addEventListener('input', renderReportsTable);
  document.getElementById('typeFilter')?.addEventListener('change', renderReportsTable);
  document.getElementById('adminStatusFilter')?.addEventListener('change', renderReportsTable);

  document.getElementById('searchUsers')?.addEventListener('input', loadUserManagement);
  document.getElementById('userTypeFilter')?.addEventListener('change', loadUserManagement);
  document.getElementById('userStatusFilter')?.addEventListener('change', loadUserManagement);

  document.getElementById('notifTarget')?.addEventListener('change', function() {
    const div = document.getElementById('specificUserDiv');
    if (div) div.style.display = this.value === 'specific' ? 'flex' : 'none';
  });
});

async function syncReportsFromApi() {
  const token = localStorage.getItem('authToken');
  if (!token) return;

  try {
    console.log('Fetching reports from API...');
    const response = await fetch(`${API_BASE}/reports?limit=500`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load reports');

    const payload = await response.json();
    const apiReports = Array.isArray(payload.data) ? payload.data : [];
    localStorage.setItem('reports', JSON.stringify(apiReports));
    console.log(`✅ Synced ${apiReports.length} reports from API`);
    return apiReports;
  } catch (error) {
    console.error('Error syncing reports:', error);
    const cached = JSON.parse(localStorage.getItem('reports') || '[]');
    if (!IS_LOCAL_DEV) {
      showToast('Could not sync reports from server', 'error');
    }
    return cached;
  }
}

async function syncUsersFromApi() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('No auth token, cannot sync users');
    return [];
  }

  try {
    console.log('Fetching users from API...');
    const response = await fetch(`${API_BASE}/users?limit=50&page=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Failed to load users');
    }

    const payload = await response.json();
    serverUsers = Array.isArray(payload.data) ? payload.data : [];
    localStorage.setItem('serverUsers', JSON.stringify(serverUsers));
    console.log(`✅ Synced ${serverUsers.length} users from API`);
    return serverUsers;
  } catch (error) {
    console.error('Error syncing users:', error);
    serverUsers = JSON.parse(localStorage.getItem('serverUsers') || '[]');
    console.log(`Using cached users: ${serverUsers.length}`);
    if (!IS_LOCAL_DEV) {
      showToast('Could not sync users from server', 'error');
    }
    return serverUsers;
  }
}

function switchSection(name) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const section = document.getElementById(`${name}-section`);
  const link    = document.querySelector(`.sidebar-link[data-section="${name}"]`);
  if (section) section.classList.add('active');
  if (link)    link.classList.add('active');

  if (name === 'all-reports')      { syncReportsFromApi().then(() => renderReportsTable()); }
  if (name === 'map-view')         { initAdminMap(); }
  if (name === 'analytics')        { initAnalyticsCharts(); }
  if (name === 'users')            { syncUsersFromApi().then(() => loadUserManagement()); }
  if (name === 'reports-per-user') { loadReportsPerUser(); }
  if (name === 'notifications-settings') { loadTemplates(); loadAdminNotifs(); }
}

function loadDashboardStats() {
  const reports = JSON.parse(localStorage.getItem('reports') || '[]');
  const users   = serverUsers.length ? serverUsers : JSON.parse(localStorage.getItem('serverUsers') || '[]');
  const activeNowCount = users.filter(isUserActiveNow).length;
  document.getElementById('totalReports').textContent    = reports.length;
  document.getElementById('pendingReports').textContent  = reports.filter(r => r.status === 'submitted').length;
  document.getElementById('resolvedReports').textContent = reports.filter(r => r.status === 'resolved').length;
  document.getElementById('totalUsersLoggedIn').textContent = activeNowCount;
}

function isUserActiveNow(user) {
  if (!user?.lastLogin) return false;
  return (Date.now() - new Date(user.lastLogin).getTime()) <= 15 * 60 * 1000;
}

function loadRecentReports() {
  const reports = JSON.parse(localStorage.getItem('reports') || '[]').slice(0, 6);
  const el = document.getElementById('adminRecentReportsList');
  if (!el) return;
  if (reports.length === 0) return;

  el.innerHTML = reports.map(r => `
    <div class="report-item-d" style="cursor:pointer" onclick="openReportModal('${r.id}')">
      <div class="ri-type-icon" style="background:${getTypeColor(r.incidentType)}20;color:${getTypeColor(r.incidentType)}">
        <i class="fas ${getTypeIcon(r.incidentType)}"></i>
      </div>
      <div class="ri-body">
        <div class="ri-title">${r.title}</div>
        <div class="ri-meta"><i class="fas fa-location-dot" style="margin-right:0.3rem"></i>${r.location} &nbsp;·&nbsp; ${formatDate(r.submittedAt)}</div>
      </div>
      <span class="ri-status ${getStatusClass(r.status)}">${formatStatus(r.status)}</span>
    </div>`).join('');
}

function renderReportsTable() {
  let reports = JSON.parse(localStorage.getItem('reports') || '[]');
  const search = (document.getElementById('searchAllReports')?.value || '').toLowerCase();
  const type   = document.getElementById('typeFilter')?.value || '';
  const status = document.getElementById('adminStatusFilter')?.value || '';

  if (search) reports = reports.filter(r => r.title.toLowerCase().includes(search) || r.location.toLowerCase().includes(search) || r.id.toLowerCase().includes(search));
  if (type)   reports = reports.filter(r => r.incidentType === type);
  if (status) reports = reports.filter(r => r.status === status);

  const tbody = document.getElementById('reportsTableBody');
  if (!tbody) return;
  if (reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No reports found.</td></tr>`;
    return;
  }
  tbody.innerHTML = reports.map(r => `
    <tr>
      <td class="id-cell">${r.id}</td>
      <td class="title-cell">${r.title}</td>
      <td><span style="color:${getTypeColor(r.incidentType)};font-size:0.78rem;font-weight:600">${r.incidentType}</span></td>
      <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.location}</td>
      <td><span class="ri-status ${getStatusClass(r.status)}">${formatStatus(r.status)}</span></td>
      <td>${formatDate(r.submittedAt)}</td>
      <td>
        <button class="tbl-btn" onclick="openReportModal('${r.id}')"><i class="fas fa-eye"></i> View</button>
        <button class="tbl-btn" onclick="openStatusModal('${r.id}')"><i class="fas fa-pen"></i> Update</button>
      </td>
    </tr>`).join('');
}

window.openReportModal = function(reportId) {
  const reports = JSON.parse(localStorage.getItem('reports') || '[]');
  const r = reports.find(x => x.id === reportId);
  if (!r) return;

  document.getElementById('reportModalBody').innerHTML = `
    <div class="modal-detail-grid">
      <div class="modal-detail-item"><label>Report ID</label><p class="id-cell">${r.id}</p></div>
      <div class="modal-detail-item"><label>Type</label><p style="color:${getTypeColor(r.incidentType)};font-weight:600">${r.incidentType}</p></div>
      <div class="modal-detail-item"><label>Status</label><p><span class="ri-status ${getStatusClass(r.status)}">${formatStatus(r.status)}</span></p></div>
      <div class="modal-detail-item"><label>Submitted</label><p>${formatDate(r.submittedAt)}</p></div>
      <div class="modal-detail-item full"><label>Location</label><p>${r.location}</p></div>
      <div class="modal-detail-item full"><label>Description</label><p style="white-space:pre-wrap;line-height:1.7">${r.description}</p></div>
      ${r.updates.length ? `
        <div class="modal-detail-item full"><label>Update History</label>
          ${r.updates.map(u => `<div style="padding:0.5rem;border-left:2px solid var(--accent);margin:0.4rem 0;font-size:0.82rem;color:var(--text-secondary)">
            <strong style="color:var(--text-primary)">${formatStatus(u.status)}</strong> — ${formatDate(u.timestamp)} by ${u.updatedBy}
            ${u.note ? `<p style="color:var(--text-muted);margin-top:0.2rem">${u.note}</p>` : ''}
          </div>`).join('')}
        </div>` : ''}
    </div>
    <div style="margin-top:1.25rem">
      <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);display:block;margin-bottom:0.4rem">Update Status</label>
      <select class="modal-status-select" id="modalStatusSelect" onchange="updateReportStatus('${r.id}', this.value)">
        ${['submitted','under-review','resolved','rejected'].map(s =>
          `<option value="${s}" ${r.status===s?'selected':''}>${formatStatus(s)}</option>`
        ).join('')}
      </select>
    </div>`;

  document.getElementById('reportModal').classList.add('active');
};

function closeReportModal() {
  document.getElementById('reportModal').classList.remove('active');
}

document.getElementById('reportModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'reportModal') closeReportModal();
});

window.updateReportStatus = function(id, newStatus) {
  const token = localStorage.getItem('authToken');
  const reports = JSON.parse(localStorage.getItem('reports') || '[]');
  const r = reports.find(x => x.id === id);
  if (!r) return;

  const applyLocalUpdate = () => {
    r.status = newStatus;
    r.updates = Array.isArray(r.updates) ? r.updates : [];
    r.updates.push({ timestamp: new Date().toISOString(), status: newStatus, updatedBy: currentUser.name });
    localStorage.setItem('reports', JSON.stringify(reports));
  };

  const afterUpdate = () => {
    // Save real notification to user's notifications list
    if (r.submittedBy) {
      const userNotifs = JSON.parse(localStorage.getItem('userNotifications') || '{}');
      if (!userNotifs[r.submittedBy]) userNotifs[r.submittedBy] = [];
      const notifType = newStatus === 'resolved' ? 'success' : newStatus === 'rejected' ? 'error' : 'warning';
      userNotifs[r.submittedBy].push({
        id: 'NOTIF-' + Date.now(),
        type: notifType,
        title: 'Report ' + formatStatus(newStatus),
        message: 'Your report "' + r.title + '" has been updated to ' + formatStatus(newStatus) + '.',
        reportId: id,
        read: false,
        sentAt: new Date().toISOString()
      });
      localStorage.setItem('userNotifications', JSON.stringify(userNotifs));
    }

    showToast('Report ' + id + ' updated to "' + formatStatus(newStatus) + '"', 'success');
    loadDashboardStats();
    loadRecentReports();
  };

  if (token) {
    fetch(`${API_BASE}/reports/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(async (response) => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || err.message || 'Failed to update report');
        }
        await syncReportsFromApi();
        const refreshed = JSON.parse(localStorage.getItem('reports') || '[]').find(x => x.id === id);
        if (refreshed) {
          r.submittedBy = refreshed.submittedBy;
          r.title = refreshed.title;
        }
        afterUpdate();
      })
      .catch((error) => {
        if (!IS_LOCAL_DEV) {
          showToast(error.message || 'Failed to update report on server.', 'error');
          return;
        }
        applyLocalUpdate();
        afterUpdate();
      });
    return;
  }

  applyLocalUpdate();
  afterUpdate();
};

window.openStatusModal = function(id) { openReportModal(id); };

function initCharts() {
  const reports = JSON.parse(localStorage.getItem('reports') || '[]');

  const typeCounts = {};
  reports.forEach(r => { typeCounts[r.incidentType] = (typeCounts[r.incidentType]||0) + 1; });
  const typeCtx = document.getElementById('reportTypesChart');
  if (typeCtx && !charts.types) {
    charts.types = new Chart(typeCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{ data: Object.values(typeCounts), backgroundColor: ['#ef4444','#3b82f6','#f59e0b','#10b981','#8b5cf6','#6366f1','#64748b'], borderWidth: 0 }]
      },
      options: { responsive:true, plugins:{ legend:{ position:'bottom', labels:{ color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() } } } }
    });
  }

  const statusCounts = {};
  reports.forEach(r => { statusCounts[r.status] = (statusCounts[r.status]||0) + 1; });
  const statusCtx = document.getElementById('reportStatusChart');
  if (statusCtx && !charts.status) {
    charts.status = new Chart(statusCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(statusCounts).map(s => formatStatus(s)),
        datasets: [{ label:'Reports', data: Object.values(statusCounts), backgroundColor: ['#3b82f6','#f59e0b','#10b981','#ef4444'], borderRadius: 6, borderWidth: 0 }]
      },
      options: { responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, grid:{ color:'rgba(255,255,255,0.05)' }, ticks:{ color:'#8892a4' } }, x:{ grid:{ display:false }, ticks:{ color:'#8892a4' } } } }
    });
  }
}

function initAnalyticsCharts() {
  const reports = JSON.parse(localStorage.getItem('reports') || '[]');
  const daily = {};
  reports.forEach(r => {
    const d = new Date(r.submittedAt).toLocaleDateString();
    daily[d] = (daily[d]||0) + 1;
  });

  const dailyCtx = document.getElementById('dailyReportsChart');
  if (dailyCtx && !charts.daily) {
    charts.daily = new Chart(dailyCtx, {
      type:'line',
      data:{ labels: Object.keys(daily), datasets:[{ label:'Reports', data: Object.values(daily), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.1)', tension:0.4, fill:true, pointRadius:4 }] },
      options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, grid:{ color:'rgba(255,255,255,0.05)' }, ticks:{ color:'#8892a4' } }, x:{ grid:{ display:false }, ticks:{ color:'#8892a4' } } } }
    });
  }
}

function initAdminMap() {
  if (adminMap) {
    setTimeout(() => adminMap.invalidateSize(), 200);
    refreshAdminMapMarkers();
    return;
  }
  const el = document.getElementById('adminMap');
  if (!el) return;

  adminMap = L.map('adminMap').setView([-1.2921, 36.8219], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'&copy; OpenStreetMap', maxZoom:19
  }).addTo(adminMap);

  adminMapLayer = L.layerGroup().addTo(adminMap);

  refreshAdminMapMarkers();
}

function refreshAdminMapMarkers() {
  if (!adminMap || !adminMapLayer) return;

  const reports = JSON.parse(localStorage.getItem('reports') || '[]');
  const colorMap = { crime:'#ef4444', flood:'#3b82f6', fire:'#f59e0b', accident:'#eab308', health:'#10b981', infrastructure:'#8b5cf6', other:'#64748b' };
  const bounds = [];

  adminMapLayer.clearLayers();

  reports.forEach(r => {
    const m = r.location && r.location.match(/Latitude:\s*([-\d.]+),\s*Longitude:\s*([-\d.]+)/);
    if (!m) return;
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    const color = colorMap[r.incidentType] || '#3b82f6';
    bounds.push([lat, lng]);
    L.circleMarker([lat, lng], {
      radius:8, fillColor:color, color:color, weight:2, opacity:1, fillOpacity:0.8
    }).addTo(adminMapLayer).bindPopup(`<strong>${r.title}</strong><br>Type: ${r.incidentType}<br>Status: ${r.status}`);
  });

  if (bounds.length > 0) {
    adminMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }
}

function loadUserManagement() {
  const usersCache = serverUsers.length ? serverUsers : JSON.parse(localStorage.getItem('serverUsers') || '[]');
  const search = (document.getElementById('searchUsers')?.value || '').toLowerCase();
  const typeF  = document.getElementById('userTypeFilter')?.value || '';
  const statF  = document.getElementById('userStatusFilter')?.value || '';
  const reports= JSON.parse(localStorage.getItem('reports') || '[]');
  const tbody  = document.getElementById('usersTableBody');
  if (!tbody) return;

  console.log('Loading user management - users count:', usersCache.length);
  let users = [...usersCache];
  if (search) users = users.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
  if (typeF)  users = users.filter(u => u.role === typeF || (typeF === 'citizen' && u.role === 'user'));
  if (statF)  users = users.filter(u => (u.status || 'active') === statF);

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted)">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const userReports = reports.filter(r => r.submittedBy === u.email).length;
    const status = u.status || 'active';
    const activeNow = isUserActiveNow(u);
    return `<tr>
      <td class="id-cell">${u.id}</td>
      <td><div class="user-name-cell"><div class="user-mini-avatar">${(u.name||'U')[0].toUpperCase()}</div>${u.name}</div></td>
      <td>${u.email}</td>
      <td>${u.role === 'admin' ? 'Admin' : 'Citizen'}</td>
      <td><span class="ri-status ${activeNow ? 'resolved' : status === 'active' ? 'resolved' : 'rejected'}">${activeNow ? 'Active Now' : formatStatus(status)}</span></td>
      <td>${userReports}</td>
      <td>${u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
      <td><button class="tbl-btn" onclick="manageUser('${u.id}')"><i class="fas fa-pen"></i> Manage</button></td>
    </tr>`;
  }).join('');
}

window.manageUser = function(userId) {
  const user = (serverUsers.length ? serverUsers : JSON.parse(localStorage.getItem('serverUsers') || '[]')).find(u => u.id === userId);
  if (!user) return;
  const newStatus = prompt(`Update status for ${user.name}\nCurrent: ${user.status || 'active'}\n\nEnter new status (active / inactive / suspended):`, user.status || 'active');
  if (!newStatus) return;
  const token = localStorage.getItem('authToken');
  if (!token) return;

  fetch(`${API_BASE}/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: newStatus.toLowerCase() })
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to update user status');
      }
      await syncUsersFromApi();
      showToast(`User ${user.name} status updated to "${newStatus.toLowerCase()}"`, 'success');
      loadUserManagement();
      loadDashboardStats();
    })
    .catch((error) => {
      showToast(error.message || 'Failed to update user status.', 'error');
    });
};

function loadReportsPerUser() {
  const reports = JSON.parse(localStorage.getItem('reports') || '[]');
  const reg     = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
  const container = document.getElementById('reportsPerUserContainer');
  if (!container) return;

  const byUser = {};
  reports.forEach(r => {
    if (!byUser[r.submittedBy]) byUser[r.submittedBy] = { submitted:0, underReview:0, resolved:0, rejected:0, total:0 };
    byUser[r.submittedBy][r.status === 'under-review' ? 'underReview' : r.status]++;
    byUser[r.submittedBy].total++;
  });

  if (Object.keys(byUser).length === 0) {
    container.innerHTML = `<div class="empty-state-d"><i class="fas fa-chart-pie"></i><p>No data yet.</p></div>`;
    return;
  }

  const rows = Object.entries(byUser).map(([email, counts]) => {
    return `<tr>
      <td>${email}</td>
      <td style="font-family:var(--fm)">${counts.total}</td>
      <td><span class="ri-status submitted">${counts.submitted}</span></td>
      <td><span class="ri-status under-review">${counts.underReview}</span></td>
      <td><span class="ri-status resolved">${counts.resolved}</span></td>
      <td><span class="ri-status rejected">${counts.rejected}</span></td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="reports-table">
      <thead><tr><th>Email</th><th>Total</th><th>Submitted</th><th>Under Review</th><th>Resolved</th><th>Rejected</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function generateAnalyticsReport() {
  const start = document.getElementById('startDate')?.value;
  const end   = document.getElementById('endDate')?.value;
  if (!start || !end) { showToast('Please select both start and end dates.', 'error'); return; }

  const reports = JSON.parse(localStorage.getItem('reports') || '[]').filter(r => {
    const d = new Date(r.submittedAt);
    return d >= new Date(start) && d <= new Date(end + 'T23:59:59');
  });

  const byType   = {};
  const byStatus = {};
  reports.forEach(r => {
    byType[r.incidentType] = (byType[r.incidentType]||0) + 1;
    byStatus[r.status]     = (byStatus[r.status]||0) + 1;
  });

  let txt = `📊 Analytics Report  (${start} → ${end})\n\nTotal Reports: ${reports.length}\n\nBy Type:\n`;
  Object.entries(byType).forEach(([k,v]) => txt += `  • ${k}: ${v}\n`);
  txt += `\nBy Status:\n`;
  Object.entries(byStatus).forEach(([k,v]) => txt += `  • ${formatStatus(k)}: ${v}\n`);

  alert(txt);
  showToast('Report generated!', 'success');
}

function loadTemplates() {
  const tpls = [
    { name:'New Report Alert',    type:'email', subject:'New Community Report Submitted', message:'A new {type} report "{reportTitle}" has been submitted at {location}. Please review.' },
    { name:'Status Update',       type:'email', subject:'Your Report Status Changed',     message:'Your report "{reportTitle}" status was updated to: {newStatus}.' },
    { name:'Urgent Alert',        type:'sms',   subject:'Urgent Community Alert',          message:'ALERT: {reportTitle} at {location}. Report ID: {reportId}.' },
    { name:'Report Resolved',     type:'push',  subject:'Report Resolved',                 message:'Your report {reportId} has been resolved. Thank you!' },
  ];

  const el = document.getElementById('templatesList');
  if (!el) return;
  el.innerHTML = tpls.map(t => `
    <div class="template-card">
      <div class="template-header">
        <h3>${t.name}</h3>
        <span class="template-type-badge ${t.type}">${t.type.toUpperCase()}</span>
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.35rem"><strong>Subject:</strong> ${t.subject}</p>
      <div class="template-message">${t.message}</div>
    </div>`).join('');
}

function loadNotifTarget() {
  const reg = serverUsers.length ? serverUsers : JSON.parse(localStorage.getItem('serverUsers') || '[]');
  const sel = document.getElementById('specificUser');
  if (!sel) return;
  sel.innerHTML = reg.map(u => `<option value="${u.email}">${u.name} (${u.email})</option>`).join('') || '<option value="">No users yet</option>';
}

function saveNotificationConfig() {
  const config = {
    smsAlerts:   document.getElementById('smsAlerts')?.checked,
    emailAlerts: document.getElementById('emailAlerts')?.checked,
    pushAlerts:  document.getElementById('pushAlerts')?.checked,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem('notificationConfig', JSON.stringify(config));
  showToast('Notification configuration saved!', 'success');
}

function confirmSendNotification() {
  const type    = document.getElementById('notifType')?.value;
  const title   = document.getElementById('notifTitle')?.value?.trim();
  const message = document.getElementById('notifMessage')?.value?.trim();
  const target  = document.getElementById('notifTarget')?.value;
  const specific = document.getElementById('specificUser')?.value;

  if (!type || !title || !message) { showToast('Please fill in all fields.', 'error'); return; }

  const reg   = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
  const notifs = JSON.parse(localStorage.getItem('userNotifications') || '{}');
  const notif = { id:'NOTIF-'+Date.now(), type:'info', title, message, sentAt: new Date().toISOString(), read: false };

  const recipients = target === 'all' ? Object.values(reg).map(u => u.email) : [specific];
  recipients.forEach(email => {
    if (!notifs[email]) notifs[email] = [];
    notifs[email].push({ ...notif });
  });
  localStorage.setItem('userNotifications', JSON.stringify(notifs));

  showToast(`Notification sent to ${recipients.length} recipient(s)!`, 'success');
  document.getElementById('notifTitle').value   = '';
  document.getElementById('notifMessage').value = '';
}

/* ── Real-time notifications ── */
function initRealtime() {
  // PRIMARY: storage event fires in this tab whenever ANOTHER tab changes localStorage
  window.addEventListener('storage', function(e) {

    // User submitted a new report → 'reports' key changed
    if (e.key === 'reports') {
      var newList = JSON.parse(e.newValue || '[]');
      var oldList = JSON.parse(e.oldValue || '[]');
      var oldIds = {};
      oldList.forEach(function(r) { oldIds[r.id] = true; });
      var added = newList.filter(function(r) { return !oldIds[r.id]; });

      added.forEach(function(r) {
        showToast('New ' + r.incidentType + ' report: "' + r.title + '"', 'info', 6000);
        var adminNotifs = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        var alreadySaved = adminNotifs.some(function(n) { return n.reportId === r.id; });
        if (!alreadySaved) {
          adminNotifs.unshift({
            id: 'AN-' + Date.now(),
            type: 'info',
            title: 'New Report: ' + r.title,
            message: (r.anonymous ? 'Anonymous' : (r.submittedBy || 'Unknown')) + ' submitted a ' + r.incidentType + ' report at ' + r.location + '.',
            reportId: r.id,
            read: false,
            sentAt: new Date().toISOString()
          });
          localStorage.setItem('adminNotifications', JSON.stringify(adminNotifs));
        }
      });

      if (added.length > 0) updateAdminNotifBadge();
      loadDashboardStats();
      loadRecentReports();
      if (document.getElementById('all-reports-section') &&
          document.getElementById('all-reports-section').classList.contains('active')) {
        renderReportsTable();
      }
      // Refresh notif list only if section is open
      if (document.getElementById('notifications-settings-section') &&
          document.getElementById('notifications-settings-section').classList.contains('active')) {
        loadAdminNotifs();
      }
    }

    // New user registered → 'serverUsers' key changed
    if (e.key === 'serverUsers') {
      var newUsers = JSON.parse(e.newValue || '[]');
      var oldUsers = JSON.parse(e.oldValue || '[]');
      var oldIds = {};
      oldUsers.forEach(function(u) { oldIds[u.id] = true; });
      var addedUsers = newUsers.filter(function(u) { return !oldIds[u.id]; });

      addedUsers.forEach(function(u) {
        showToast('New user registered: ' + u.name, 'success', 6000);
        var adminNotifs = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        var alreadySaved = adminNotifs.some(function(n) { return n.userId === u.id; });
        if (!alreadySaved) {
          adminNotifs.unshift({
            id: 'AN-' + Date.now(),
            type: 'success',
            title: 'New User: ' + u.name,
            message: 'New user ' + u.name + ' (' + u.email + ') registered as ' + (u.role === 'admin' ? 'Admin' : 'Citizen') + '.',
            userId: u.id,
            read: false,
            sentAt: new Date().toISOString()
          });
          localStorage.setItem('adminNotifications', JSON.stringify(adminNotifs));
        }
      });

      if (addedUsers.length > 0) {
        updateAdminNotifBadge();
        loadDashboardStats();
      }
      // Refresh user management table if it's open
      if (document.getElementById('users-section') &&
          document.getElementById('users-section').classList.contains('active')) {
        loadUserManagement();
      }
    }
  });

  // FALLBACK POLLING: refresh badge every 5 seconds
  setInterval(function() {
    updateAdminNotifBadge();
  }, 4000);
}

function updateAdminNotifBadge() {
  const notifs = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
  const unread = notifs.filter(function(n) { return !n.read; }).length;
  const badge = document.getElementById('adminNotifBadge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
}

function loadAdminNotifs() {
  const el = document.getElementById('adminNotifList');
  if (!el) return;
  const notifs = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
  if (notifs.length === 0) {
    el.innerHTML = '<div class="empty-state-d" style="padding:1rem"><i class="fas fa-inbox"></i><p>No new notifications yet.</p></div>';
    return;
  }
  const iconMap = { info: 'fa-circle-info', success: 'fa-circle-check', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark' };
  el.innerHTML = notifs.map(function(n) {
    return '<div class="notif-item ' + (n.read ? '' : 'unread') + '">'
      + '<div class="notif-icon ' + (n.type || 'info') + '"><i class="fas ' + (iconMap[n.type] || 'fa-circle-info') + '"></i></div>'
      + '<div class="notif-body">'
      + '<div class="notif-title">' + n.title + '</div>'
      + '<div class="notif-message">' + n.message + '</div>'
      + '<div class="notif-time">' + formatDate(n.sentAt) + '</div>'
      + '</div>'
      + (n.read ? '' : '<div class="unread-dot"></div>')
      + '</div>';
  }).join('');
  // Only mark as read if the notifications section is currently visible
  var section = document.getElementById('notifications-settings-section');
  if (section && section.classList.contains('active')) {
    notifs.forEach(function(n) { n.read = true; });
    localStorage.setItem('adminNotifications', JSON.stringify(notifs));
    updateAdminNotifBadge();
  }
}

window.clearAdminNotifs = function() {
  localStorage.removeItem('adminNotifications');
  loadAdminNotifs();
  updateAdminNotifBadge();
};
