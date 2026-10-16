// ═══════════════════════════════════════
// DELIVERY & TIMELINE MODULE
// ═══════════════════════════════════════

let deliveryListenerUnsub = null;
let hubTimer = null;
let deliveryTimer = null;
const HUB_DELAY_MS = 10 * 60 * 1000; // 10 minutes timer after pickup

function pickedAtKey(deliveryId) {
  return 'lb_pickedAt_' + deliveryId;
}

function markPickedAt(deliveryId) {
  const key = pickedAtKey(deliveryId);
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, Date.now().toString());
  }
  return parseInt(localStorage.getItem(key), 10);
}

/**
 * Checks if current local time is at or past 12:30 PM today.
 */
function isPast1230() {
  const now = new Date();
  const target = new Date();
  target.setHours(12, 30, 0, 0); // 12:30:00.000 PM
  return now.getTime() >= target.getTime();
}

/**
 * Calculates milliseconds remaining until 12:30 PM today.
 */
function msUntil1230() {
  const now = new Date();
  const target = new Date();
  target.setHours(12, 30, 0, 0);
  return target.getTime() - now.getTime();
}

async function checkNoBoxForToday() {
  if (!customerData?.id) return false;
  try {
    const snap = await db.collection('nobox_requests')
      .where('customerId', '==', customerData.id)
      .where('date', '==', today)
      .limit(1).get();
    return !snap.empty;
  } catch (e) {
    console.error('No Box check failed:', e);
    return false;
  }
}

function renderNoBoxToday() {
  updateStatus('📭', 'No Box Received Today', 'You opted out of today\'s delivery', 'nobox', 'spb-nobox');
  const card = document.getElementById('deliveryCard');
  if (card) {
    card.innerHTML = `
      <div style="text-align:center;padding:24px 12px">
        <div style="font-size:44px;margin-bottom:10px">📭</div>
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">We Haven't Received Your Box Today</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.7">
          You opted out of today's delivery, so there's nothing to track right now.<br>
          Please inform us a day before for your convenience.
        </div>
      </div>`;
  }
}

async function loadDelivery() {
  if (!customerData?.id) return;

  const card = document.getElementById('deliveryCard');
  if (card) {
    card.innerHTML = '<div class="spin-wrap"><div class="spinner"></div><div class="spin-txt">Loading...</div></div>';
  }

  // Stop previous snapshot listener
  if (deliveryListenerUnsub) {
    deliveryListenerUnsub();
    deliveryListenerUnsub = null;
  }

  // Check if customer requested No Box for today
  const optedOutToday = await checkNoBoxForToday();
  if (optedOutToday) {
    renderNoBoxToday();
    return;
  }

  deliveryListenerUnsub = db.collection('deliveries')
    .where('customerId', '==', customerData.id)
    .where('deliveryDate', '==', today)
    .limit(1)
    .onSnapshot(snap => {
      if (snap.empty) {
        if (card) {
          card.innerHTML = '<div class="empty"><div class="empty-icon">📅</div><div class="empty-txt">No delivery assigned today yet.</div></div>';
        }
        updateStatus('📅', 'Not Assigned Yet', 'Routes assigned each morning', 'pending', 'spb-pending');
        return;
      }
      renderDeliveryCard(snap.docs[0].data(), snap.docs[0].id);
    }, err => {
      console.error('Delivery listener error:', err);
    });
}

/**
 * Renders the 4-step delivery card.
 * 
 * AUTOMATIC TIMELINE STEP UPDATES:
 * - "Reaching Hub" (Step 3): Turns green after 10 mins from pickup OR when status is ReachedHub / Delivered.
 * - "Delivered" (Step 4): AUTOMATICALLY turns green at exactly 12:30 PM without pressing any button, 
 *   or when status is explicitly marked Delivered in Firestore.
 */
function renderDeliveryCard(d, deliveryId) {
  const rawStatus = d.status || 'Pending';
  
  // Clear any previously scheduled timers
  if (hubTimer) { clearTimeout(hubTimer); hubTimer = null; }
  if (deliveryTimer) { clearTimeout(deliveryTimer); deliveryTimer = null; }

  // 12:30 PM Time Check
  const past1230 = isPast1230();
  
  // If time >= 12:30 PM OR status is 'Delivered', effective status is 'Delivered'
  const effectiveStatus = (rawStatus === 'Delivered' || past1230) ? 'Delivered' : rawStatus;

  // If currently before 12:30 PM, set a precise timer to auto-deliver at 12:30 PM
  if (!past1230 && rawStatus !== 'Delivered') {
    const remainingMs = msUntil1230();
    if (remainingMs > 0) {
      deliveryTimer = setTimeout(() => {
        renderDeliveryCard(d, deliveryId);
      }, remainingMs + 300);
    }
  }

  const icons = {
    Pending: '⏳',
    Picked: '🚀',
    ReachedHub: '🏢',
    Hub: '🏢',
    Delayed: '⚡',
    Delivered: '🏠'
  };

  const texts = {
    Pending:    ['Awaiting Pickup', 'Agent will collect your box soon'],
    Picked:     ['On the Way! 🚀', 'Agent has picked up your box'],
    ReachedHub: ['Reaching Hub 🏢', 'Box arrived at transit hub'],
    Hub:        ['Reaching Hub 🏢', 'Box arrived at transit hub'],
    Delayed:    ['Running Late', 'Your agent is slightly delayed'],
    Delivered:  ['Delivered! 🎉', 'Enjoy your meal']
  };

  const [stText, stSub] = texts[effectiveStatus] || texts.Pending;

  const badgeMap = {
    Pending: 'spb-pending',
    Picked: 'spb-picked',
    ReachedHub: 'spb-picked',
    Hub: 'spb-picked',
    Delayed: 'spb-delayed',
    Delivered: 'spb-delivered'
  };

  const iconMap = {
    Pending: 'pending',
    Picked: 'picked',
    ReachedHub: 'picked',
    Hub: 'picked',
    Delayed: 'delayed',
    Delivered: 'delivered'
  };

  updateStatus(icons[effectiveStatus] || '⏳', stText, stSub, iconMap[effectiveStatus] || 'pending', badgeMap[effectiveStatus] || 'spb-pending');

  // 4-Step Timeline Definition
  const steps = [
    { label: 'Order Confirmed', sub: 'Your box is prepared' },
    { label: 'Picked Up',       sub: 'Box collected by agent' },
    { label: 'Reaching Hub',    sub: 'On the way to you' },
    { label: 'Delivered',       sub: 'Enjoy your meal!' }
  ];

  const deliveredDone = (effectiveStatus === 'Delivered');
  const confirmedDone = true;
  const pickedDone    = deliveredDone || (rawStatus === 'Picked' || rawStatus === 'ReachedHub' || rawStatus === 'Hub');

  // ── "REACHING HUB" EVALUATION LOGIC ──
  let hubDone;
  if (deliveredDone) {
    hubDone = true;
  } else if (rawStatus === 'ReachedHub' || rawStatus === 'Hub') {
    hubDone = true;
  } else if (rawStatus === 'Picked' && deliveryId) {
    const pickedAt = markPickedAt(deliveryId);
    const elapsed  = Date.now() - pickedAt;
    hubDone = elapsed >= HUB_DELAY_MS;
    
    // If 10 minutes haven't passed yet, schedule auto re-render when hub timer expires
    if (!hubDone) {
      const remainingHubMs = HUB_DELAY_MS - elapsed + 500;
      hubTimer = setTimeout(() => {
        renderDeliveryCard(d, deliveryId);
      }, remainingHubMs);
    }
  } else {
    hubDone = false;
  }

  const doneFlags   = [confirmedDone, pickedDone, hubDone, deliveredDone];
  const activeIndex = doneFlags.findIndex(f => !f); // First step not yet done (-1 if all done)

  const card = document.getElementById('deliveryCard');
  if (card) {
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;color:var(--text)">📅 ${today}</div>
        ${rawStatus === 'Delayed' && !deliveredDone ? '<span style="background:var(--red-l);color:var(--red);padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800">⚡ Delayed</span>' : ''}
      </div>
      <div class="tl">
        ${steps.map((s, i) => {
          const cls = doneFlags[i] ? 'done' : (i === activeIndex ? 'active' : '');
          const num = (!doneFlags[i] && i !== activeIndex) ? `<span class="tl-num">${i + 1}</span>` : '';
          return `
          <div class="tl-item">
            <div class="tl-dot ${cls}">${num}</div>
            <div class="tl-label">${s.label}</div>
            <div class="tl-sub">${s.sub}</div>
          </div>`;
        }).join('')}
      </div>
      ${d.notes ? `<div style="background:var(--amber-l);border-radius:8px;padding:8px 12px;margin-top:12px;font-size:12px;font-weight:600;color:#5F4200">📝 ${d.notes}</div>` : ''}
      ${d.itemCount > 1 ? `<div style="margin-top:10px;font-size:12px;color:var(--muted);font-weight:600">📦 ${d.itemCount} items in your box</div>` : ''}
    `;
  }

  // Agent details card
  const agentWrap = document.getElementById('agentWrap');
  if (agentWrap) {
    if (d.assignedName) {
      const ini = d.assignedName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const callBtn = d.agentPhone ? `<a href="tel:${d.agentPhone}" class="call-btn">📞 Call</a>` : '';
      const phoneDisplay = d.agentPhone ? `<div style="font-size:11px;color:var(--green);font-weight:600;margin-top:2px">${d.agentPhone}</div>` : '';

      agentWrap.innerHTML = `
        <div class="agent-row">
          <div class="ag-av">${ini}</div>
          <div>
            <div class="ag-name">${d.assignedName}</div>
            <div class="ag-label">Delivery Agent</div>
            ${phoneDisplay}
          </div>
          ${callBtn}
        </div>`;
    } else {
      agentWrap.innerHTML = `
        <div class="card empty">
          <div class="empty-icon">👤</div>
          <div class="empty-txt">Agent not assigned yet</div>
        </div>`;
    }
  }
}
