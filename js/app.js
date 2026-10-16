// ═══════════════════════════════════════
// MAIN APPLICATION INITIALIZATION & STATE
// ═══════════════════════════════════════

// Global state variables
const today    = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

let customerData = null;

// Application Entry Point
window.addEventListener('DOMContentLoaded', () => {
  // Modal backdrop click handler
  document.querySelectorAll('.modal-ov').forEach(m =>
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.remove('open');
    })
  );

  // Pull-to-refresh handler
  let ptrY = 0;
  const body = document.querySelector('.app-body');
  if (body) {
    body.addEventListener('touchstart', e => {
      ptrY = e.touches[0].clientY;
    }, { passive: true });

    body.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientY - ptrY;
      if (diff > 65 && body.scrollTop === 0) {
        const ind = document.getElementById('ptrInd');
        if (ind) ind.style.display = 'block';
        loadDelivery();
        loadNoBoxStatus();
        setTimeout(() => {
          if (ind) ind.style.display = 'none';
        }, 1800);
      }
    }, { passive: true });
  }

  // Restore saved session if present
  const saved = localStorage.getItem('lb_customer');
  if (saved) {
    try {
      customerData = JSON.parse(saved);
      setGreeting();
      renderProfile();
      loadDelivery();
      listenMessages();
      loadNoBoxStatus();
      showScreen('app');
      return;
    } catch(e) {
      localStorage.removeItem('lb_customer');
    }
  }

  showScreen('login');
});
