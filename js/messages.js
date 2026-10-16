// ═══════════════════════════════════════
// MESSAGING MODULE — Support Chat with Admin
// ═══════════════════════════════════════

let msgListener = null;

function listenMessages() {
  if (!customerData?.id) return;
  if (msgListener) msgListener();

  msgListener = db.collection('messages')
    .where('customerId', '==', customerData.id)
    .orderBy('timestamp', 'asc')
    .onSnapshot(snap => {
      const list = document.getElementById('msgList');
      const recent = document.getElementById('recentMsg');

      if (snap.empty) {
        if (list) list.innerHTML = '<div class="empty"><div class="empty-icon">💬</div><div class="empty-txt">Send a message to admin</div></div>';
        if (recent) recent.innerHTML = '<div class="empty"><div class="empty-icon">💬</div><div class="empty-txt">No messages yet</div></div>';
        return;
      }

      if (list) {
        list.innerHTML = [...snap.docs].map(doc => {
          const m = doc.data();
          const t = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
          return `<div><div class="bubble ${m.from === 'customer' ? 'mine' : 'theirs'}">${m.text || ''}<span class="btime">${t}</span></div></div>`;
        }).join('');
        list.scrollTop = list.scrollHeight;
      }

      if (recent) {
        const last = snap.docs[snap.docs.length - 1].data();
        recent.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:22px">💬</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text)">${(last.text || '').substring(0, 60)}${last.text?.length > 60 ? '...' : ''}</div>
              <div style="font-size:11px;color:var(--muted);font-weight:500;margin-top:2px">Tap Messages tab to view full chat</div>
            </div>
          </div>`;
      }
    }, err => {
      console.error('Messages listener error:', err);
    });
}

async function sendMsg() {
  const inp = document.getElementById('msgInp');
  const txt = (inp?.value || '').trim();
  if (!txt || !customerData?.id) return;
  inp.value = '';

  try {
    await db.collection('messages').add({
      customerId:    customerData.id,
      customerName:  customerData.name  || '',
      customerPhone: customerData.phone || '',
      text:          txt,
      from:          'customer',
      timestamp:     Date.now(),
      read:          false,
    });
    await db.collection('admin_notifications').add({
      type:         'message',
      customerName: customerData.name || '',
      message:      `💬 ${customerData.name || customerData.boxId}: ${txt.substring(0, 80)}`,
      timestamp:    Date.now(),
      read:         false,
    });
  } catch(e) {
    alert('Could not send message: ' + e.message);
  }
}
