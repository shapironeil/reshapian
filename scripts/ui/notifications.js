// UI: Notification Toast System
// Browser-safe notification system for pickups, achievements, etc.

window.RSG = window.RSG || {};
window.RSG.ui = window.RSG.ui || {};

(function () {
  var activeNotifications = [];
  var container = null;

  function init() {
    // Crea container per notifiche se non esiste
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
  }

  function show(message, options) {
    init();
    
    options = options || {};
    var type = options.type || 'info'; // info, success, warning, error
    var duration = options.duration || 3000;
    var icon = options.icon || getDefaultIcon(type);

    // Crea elemento notifica
    var notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    
    notification.innerHTML = `
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${message}</span>
    `;

    // Aggiungi al container
    container.appendChild(notification);
    activeNotifications.push(notification);

    // Animazione di entrata
    setTimeout(function() {
      notification.classList.add('notification-show');
    }, 10);

    // Rimozione automatica dopo durata
    setTimeout(function() {
      hideNotification(notification);
    }, duration);
  }

  function hideNotification(notification) {
    if (!notification) return;

    notification.classList.remove('notification-show');
    notification.classList.add('notification-hide');

    setTimeout(function() {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
      var idx = activeNotifications.indexOf(notification);
      if (idx > -1) {
        activeNotifications.splice(idx, 1);
      }
    }, 300);
  }

  function getDefaultIcon(type) {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'pickup': return '📦';
      case 'weapon': return '🔫';
      case 'info':
      default: return 'ℹ️';
    }
  }

  // Funzioni helper per tipi comuni
  function showPickup(itemName, quantity) {
    var msg = quantity && quantity > 1 
      ? 'Raccolto: ' + itemName + ' x' + quantity
      : 'Raccolto: ' + itemName;
    show(msg, { type: 'pickup', duration: 2000 });
  }

  function showWeaponEquipped(weaponName) {
    show('Equipaggiato: ' + weaponName, { type: 'weapon', duration: 2000 });
  }

  function showAmmoPickup(ammoType, quantity) {
    show('+ ' + quantity + ' munizioni ' + ammoType, { type: 'success', duration: 2000 });
  }

  function showReload() {
    show('Ricarica completata', { type: 'success', duration: 1500 });
  }

  function showEmptyMag() {
    show('Caricatore vuoto! Premi R', { type: 'warning', duration: 2000 });
  }

  function showNoAmmo() {
    show('Nessuna munizione disponibile!', { type: 'error', duration: 2000 });
  }

  window.RSG.ui.notifications = {
    show: show,
    showPickup: showPickup,
    showWeaponEquipped: showWeaponEquipped,
    showAmmoPickup: showAmmoPickup,
    showReload: showReload,
    showEmptyMag: showEmptyMag,
    showNoAmmo: showNoAmmo,
  };
})();
