// UI: Inventory overlay + item detail modal

window.RSG = window.RSG || {};
window.RSG.ui = window.RSG.ui || {};

(function () {
  function toggleOverlay(state, visible) {
    var overlay = document.getElementById("inventory-overlay");
    if (!overlay) return;
    overlay.style.display = visible ? "flex" : "none";

    if (state && state.ui) state.ui.isInventoryOpen = !!visible;
    if (state) state.mode = visible ? "inventory" : "gameplay";

    if (visible && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  function render(state, onItemClick) {
    if (!state || !state.inventory) return;

    var grid = document.getElementById("inventory-items");
    if (!grid) return;

    var MAX = state.inventory.max || 10;
    var items = state.inventory.items || [];
    grid.innerHTML = "";

    for (var i = 0; i < MAX; i++) {
      var cell = document.createElement("div");
      cell.className = "item-cell";

      if (items[i]) {
        cell.textContent = items[i].name;
        (function (item) {
          cell.onclick = function () {
            if (typeof onItemClick === "function") onItemClick(item);
          };
        })(items[i]);
      } else {
        cell.textContent = "-";
      }

      grid.appendChild(cell);
    }

    // equip slots
    var eq = state.inventory.equipped || {};
    var sh = document.getElementById("slot-head-item");
    var sc = document.getElementById("slot-chest-item");
    var sl = document.getElementById("slot-left-hand-item");
    var sr = document.getElementById("slot-right-hand-item");

    if (sh) sh.textContent = eq.head ? eq.head.name : "-";
    if (sc) sc.textContent = eq.chest ? eq.chest.name : "-";
    if (sl) sl.textContent = eq.leftHand ? eq.leftHand.name : "-";
    if (sr) sr.textContent = eq.rightHand ? eq.rightHand.name : "-";
  }

  function showItemDetail(item, weaponData, onEquip) {
    var modal = document.getElementById("item-detail-modal");
    if (!modal || !item) return;

    var nameEl = document.getElementById("item-detail-name");
    if (nameEl) nameEl.textContent = item.name;

    var statsEl = document.getElementById("item-detail-stats");
    if (statsEl) {
      var statsHtml = "";
      if (item.type === "weapon") {
        var weaponInfo = weaponData ? weaponData[item.id] : null;
        if (weaponInfo) {
          statsHtml = "<strong>Arma</strong><br>";
          statsHtml += "Tipo: " + weaponInfo.fireRate + "<br>";
          statsHtml += "Danno: " + weaponInfo.damage + "<br>";
          statsHtml += "Caricatore: " + weaponInfo.ammo + "/" + weaponInfo.ammoCapacity + "<br>";
        }
      } else if (item.type === "ammo") {
        statsHtml = "<strong>Munizioni</strong><br>";
        statsHtml += "Quantità: " + (item.amount || 1);
      }
      statsEl.innerHTML = statsHtml || "Nessun dato disponibile";
    }

    var equipBtn = document.getElementById("modal-equip-btn");
    if (equipBtn) {
      equipBtn.onclick = function () {
        if (typeof onEquip === "function") onEquip(item);
        modal.style.display = "none";
      };
    }

    var closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn) {
      closeBtn.onclick = function () {
        modal.style.display = "none";
      };
    }

    modal.style.display = "flex";
  }

  window.RSG.ui.inventory = {
    toggleOverlay: toggleOverlay,
    render: render,
    showItemDetail: showItemDetail,
  };
})();
