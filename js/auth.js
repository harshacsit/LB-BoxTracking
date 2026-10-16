// ═══════════════════════════════════════
// AUTHENTICATION MODULE — Login & Session
// ═══════════════════════════════════════

async function doLogin() {
  const boxId = document.getElementById('boxIdInp').value.trim().toUpperCase();
  const pin   = document.getElementById('pinInp').value.trim();

  if (!boxId) { showErr('loginErr', 'Enter your Box ID'); return; }
  if (pin.length !== 4) { showErr('loginErr', 'Enter your 4-digit PIN'); return; }
  hideErr('loginErr');

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>Checking...</span>';

  try {
    // Look up customer by boxId
    const snap = await db.collection('customers')
      .where('boxId', '==', boxId)
      .limit(1).get();

    if (snap.empty) {
      showErr('loginErr', 'Box ID not found. Check with your admin.');
      btn.disabled = false;
      btn.innerHTML = '<span>Sign In</span><span style="font-size:16px">→</span>';
      return;
    }

    const doc  = snap.docs[0];
    const data = doc.data();

    // PIN check — compare against global pin stored in config doc OR per-customer pin
    const configSnap = await db.collection('config').doc('app').get();
    const globalPin  = configSnap.exists ? (configSnap.data().customerPin || '') : '';
    const perPin     = data.pin || '';

    const validPin = perPin ? perPin === pin : globalPin === pin;

    if (!validPin) {
      showErr('loginErr', 'Incorrect PIN. Try again.');
      document.getElementById('pinInp').value = '';
      btn.disabled = false;
      btn.innerHTML = '<span>Sign In</span><span style="font-size:16px">→</span>';
      return;
    }

    customerData = { id: doc.id, ...data };
    localStorage.setItem('lb_customer', JSON.stringify(customerData));

    setGreeting();
    renderProfile();
    loadDelivery();
    listenMessages();
    loadNoBoxStatus();
    showScreen('app');

  } catch(err) {
    showErr('loginErr', 'Error: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In</span><span style="font-size:16px">→</span>';
  }
}

function doLogout() {
  if (msgListener) { msgListener(); msgListener = null; }
  if (deliveryListenerUnsub) { deliveryListenerUnsub(); deliveryListenerUnsub = null; }
  if (hubTimer) { clearTimeout(hubTimer); hubTimer = null; }
  if (deliveryTimer) { clearTimeout(deliveryTimer); deliveryTimer = null; }
  
  localStorage.removeItem('lb_customer');
  customerData = null;
  
  const bInp = document.getElementById('boxIdInp');
  if (bInp) bInp.value = '';
  const pInp = document.getElementById('pinInp');
  if (pInp) pInp.value = '';
  
  showScreen('login');
}
