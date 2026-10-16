// ═══════════════════════════════════════
// NO BOX MODULE — Skip Tomorrow's Delivery Request
// ═══════════════════════════════════════

async function loadNoBoxStatus() {
  if (!customerData?.id) return;
  try {
    const snap = await db.collection('nobox_requests')
      .where('customerId', '==', customerData.id)
      .where('date', '==', tomorrow)
      .limit(1).get();

    if (snap && !snap.empty) {
      const actionEl = document.getElementById('noboxAction');
      if (actionEl) {
        actionEl.innerHTML = '<div class="nobox-done">✅ No box for tomorrow — confirmed</div>';
      }
    }
  } catch (e) {
    console.error('Error checking No Box status:', e);
  }
}

async function confirmNoBox() {
  closeModal('noboxModal');
  if (!customerData?.id) { alert('Account not found'); return; }

  try {
    await db.collection('nobox_requests').add({
      customerId:    customerData.id,
      customerName:  customerData.name  || '',
      customerPhone: customerData.phone || '',
      date:          tomorrow,
      requestedAt:   Date.now(),
      status:        'pending',
    });
    
    await db.collection('admin_notifications').add({
      type:         'nobox',
      customerName: customerData.name  || '',
      message:      `📦 No Box: ${customerData.name || customerData.boxId} skipping delivery on ${tomorrow}`,
      timestamp:    Date.now(),
      read:         false,
    });

    const actionEl = document.getElementById('noboxAction');
    if (actionEl) {
      actionEl.innerHTML = '<div class="nobox-done">✅ No box for tomorrow — confirmed</div>';
    }

    const msgEl = document.getElementById('successMsg');
    if (msgEl) {
      msgEl.textContent = `No box request sent for ${tomorrow}. No delivery charge for that day!`;
    }

    openModal('successModal');
  } catch(e) {
    alert('Error: ' + e.message);
  }
}
