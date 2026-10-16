// ═══════════════════════════════════════
// UI HELPERS & NAVIGATION MODULE
// ═══════════════════════════════════════

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function navTo(id, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  if (el) el.classList.add('active');
}

function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const el = document.getElementById('greetingTxt');
  if (!el) return;
  const firstName = (customerData?.name || '').trim().split(' ')[0];
  el.textContent = firstName ? `${g}, ${firstName} garu 👋` : g + ' 👋';
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function hideErr(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function updateStatus(icon, text, sub, type, badgeCls) {
  const labelMap = {
    pending: 'Pending',
    picked: 'On the Way',
    hub: 'Reaching Hub',
    delayed: 'Delayed',
    delivered: 'Delivered!',
    nobox: 'No Box'
  };
  const spIcon = document.getElementById('spIcon');
  if (spIcon) {
    spIcon.className = 'sp-icon ' + type;
    spIcon.textContent = icon;
  }
  const spText = document.getElementById('spText');
  if (spText) spText.textContent = text;
  
  const spSub = document.getElementById('spSub');
  if (spSub) spSub.textContent = sub;

  const b = document.getElementById('spBadge');
  if (b) {
    b.className = 'sp-badge ' + badgeCls;
    b.textContent = labelMap[type] || '—';
  }
}

function renderProfile() {
  if (!customerData) return;
  const c = customerData;
  const ini = (c.name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  
  const av = document.getElementById('userAv');
  if (av) av.textContent = ini;

  const un = document.getElementById('userName');
  if (un) un.textContent = c.name || c.boxId || '—';

  const bxEl = document.getElementById('pr_boxid');
  if (bxEl) bxEl.textContent = c.boxId || '—';

  const nmEl = document.getElementById('pr_name');
  if (nmEl) nmEl.textContent = c.name || '—';

  const phEl = document.getElementById('pr_phone');
  if (phEl) phEl.textContent = c.phone || '—';

  const addrEl = document.getElementById('pr_addr');
  if (addrEl) addrEl.textContent = c.deliveryAddress || '—';

  const pickEl = document.getElementById('pr_pickup');
  if (pickEl) pickEl.textContent = c.pickupLocation || '—';

  const znEl = document.getElementById('pr_zone');
  if (znEl) znEl.textContent = c.zone || '—';
}
