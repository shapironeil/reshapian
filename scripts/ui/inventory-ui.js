/**
 * InventoryUI.js - Advanced Equipment & Inventory Management System
 * Handles UI rendering, item selection, drag-and-drop, and stat display
 */

console.log("📦 inventory-ui.js caricato!");

class InventoryUI {
  constructor(gameState, equipmentManager) {
    this.gameState = gameState;
    this.equipmentManager = equipmentManager;
    this.selectedItemId = null;
    this.draggedElement = null;
    this.draggedFrom = null; // 'grid' | 'head' | 'torso' | 'left-hand' | 'right-hand' | 'back' | 'legs' | 'feet'
    
    this.initDOM();
    this.attachEvents();
  }

  initDOM() {
    // Cache DOM elements
    this.panel = document.getElementById('inventory-panel');
    this.itemGrid = document.getElementById('item-grid');
    this.statsPanel = document.getElementById('stats-panel');
    this.loadBtn = document.getElementById('equip-load-btn');
    this.closeBtn = document.getElementById('inventory-close-btn');
    
    console.log("🔍 InventoryUI initDOM:");
    console.log("  - panel:", this.panel ? "✅ trovato" : "❌ NON trovato");
    console.log("  - itemGrid:", this.itemGrid ? "✅" : "❌");
    console.log("  - statsPanel:", this.statsPanel ? "✅" : "❌");
    console.log("  - loadBtn:", this.loadBtn ? "✅" : "❌");
    console.log("  - closeBtn:", this.closeBtn ? "✅" : "❌");
    
    if (!this.panel) {
      console.warn('❌ Inventory panel not found in DOM');
      return;
    }
  }

  attachEvents() {
    if (!this.panel) return;

    // Open/close
    this.closeBtn?.addEventListener('click', () => this.hide());

    // Item grid events (delegated)
    this.itemGrid?.addEventListener('click', (e) => this.onItemClick(e));
    this.itemGrid?.addEventListener('dblclick', (e) => this.onItemDoubleClick(e));
    this.itemGrid?.addEventListener('dragstart', (e) => this.onGridDragStart(e));
    this.itemGrid?.addEventListener('dragend', (e) => this.onGridDragEnd(e));

    // Load button
    this.loadBtn?.addEventListener('click', () => this.equipSelected());

    // Body slots
    this.attachSlotEvents();
  }

  attachSlotEvents() {
    const slots = this.panel?.querySelectorAll('.equip-slot');
    if (!slots) return;

    slots.forEach((slot) => {
      slot.addEventListener('dragover', (e) => this.onSlotDragOver(e));
      slot.addEventListener('drop', (e) => this.onSlotDrop(e, slot));
      slot.addEventListener('dragstart', (e) => this.onSlotDragStart(e));
      slot.addEventListener('dragleave', (e) => this.onSlotDragLeave(e));
    });
  }

  show() {
    if (this.panel) {
      console.log("📖 InventoryUI.show() - aggiungendo classe 'visible'");
      this.panel.classList.add('visible');
      console.log("  - classList dopo add:", Array.from(this.panel.classList));
      console.log("  - display computed:", window.getComputedStyle(this.panel).display);
      this.refresh();
    } else {
      console.warn("❌ InventoryUI.show() - panel non trovato!");
    }
  }

  hide() {
    if (this.panel) {
      console.log("📖 InventoryUI.hide() - rimuovendo classe 'visible'");
      this.panel.classList.remove('visible');
      this.selectedItemId = null;
      this.clearStats();
    } else {
      console.warn("❌ InventoryUI.hide() - panel non trovato!");
    }
  }

  toggle() {
    if (this.panel?.classList.contains('visible')) {
      this.hide();
    } else {
      this.show();
    }
  }

  refresh() {
    this.renderItemGrid();
    this.renderEquippedSlots();
  }

  renderItemGrid() {
    if (!this.itemGrid) return;

    this.itemGrid.innerHTML = '';
    const inventory = this.gameState.playerInventory || [];

    inventory.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'inventory-item';
      div.dataset.itemId = item.id;
      if (item.id === this.selectedItemId) {
        div.classList.add('selected');
      }

      const thumbnail = this.getItemThumbnail(item);
      div.innerHTML = `
        <img class="item-preview" src="${thumbnail}" alt="${item.name}" onerror="this.src='assets/thumbnails/missing-item.svg'">
        <span class="item-name">${item.name}</span>
      `;

      div.draggable = true;
      this.itemGrid.appendChild(div);
    });
  }

  renderEquippedSlots() {
    const equipped = this.gameState.equippedItems || {};
    const slots = this.panel?.querySelectorAll('.equip-slot');
    if (!slots) return;

    slots.forEach((slot) => {
      const slotType = slot.dataset.slot;
      const item = equipped[slotType];

      if (item) {
        slot.classList.add('occupied');
        slot.dataset.equippedItemId = item.id;
        const thumbnail = this.getItemThumbnail(item);
        slot.innerHTML = `<img class="slot-item-img" src="${thumbnail}" alt="${item.name}" onerror="this.src='assets/thumbnails/missing-item.svg'">`;
      } else {
        slot.classList.remove('occupied');
        slot.dataset.equippedItemId = '';
        slot.innerHTML = '';
      }
    });
  }

  onItemClick(e) {
    const item = e.target.closest('.inventory-item');
    if (!item) return;

    const itemId = item.dataset.itemId;
    this.selectedItemId = itemId;

    // Highlight selected
    this.itemGrid?.querySelectorAll('.inventory-item').forEach((el) => {
      el.classList.toggle('selected', el.dataset.itemId === itemId);
    });

    // Show stats
    this.showStats(itemId);

    // Enable load button
    if (this.loadBtn) {
      this.loadBtn.disabled = false;
    }
  }

  onItemDoubleClick(e) {
    const item = e.target.closest('.inventory-item');
    if (!item) return;

    const itemId = item.dataset.itemId;
    this.selectedItemId = itemId;
    this.equipSelected();
  }

  onGridDragStart(e) {
    const item = e.target.closest('.inventory-item');
    if (!item) return;

    this.draggedElement = item;
    this.draggedFrom = 'grid';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/itemId', item.dataset.itemId);
    
    // Visual feedback
    item.style.opacity = '0.5';
  }

  onGridDragEnd(e) {
    if (this.draggedElement) {
      this.draggedElement.style.opacity = '1';
    }
    this.draggedElement = null;
    this.draggedFrom = null;
  }

  onSlotDragStart(e) {
    const slot = e.target.closest('.equip-slot');
    if (!slot || !slot.dataset.equippedItemId) {
      e.preventDefault();
      return;
    }

    this.draggedElement = slot;
    this.draggedFrom = slot.dataset.slot;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/itemId', slot.dataset.equippedItemId);
    e.dataTransfer.setData('text/fromSlot', slot.dataset.slot);
    
    slot.style.opacity = '0.5';
  }

  onSlotDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.target.closest('.equip-slot')?.classList.add('drag-over');
  }

  onSlotDragLeave(e) {
    e.target.closest('.equip-slot')?.classList.remove('drag-over');
  }

  onSlotDrop(e, slot) {
    e.preventDefault();
    e.target.closest('.equip-slot')?.classList.remove('drag-over');

    const itemId = e.dataTransfer.getData('text/itemId');
    const fromSlot = e.dataTransfer.getData('text/fromSlot');
    const targetSlot = slot.dataset.slot;

    if (this.draggedFrom === 'grid' || fromSlot === '') {
      // Equip from grid to slot
      this.equipItemToSlot(itemId, targetSlot);
    } else if (fromSlot) {
      // Move between slots
      this.moveEquippedItem(fromSlot, targetSlot);
    }

    this.refresh();
  }

  showStats(itemId) {
    if (!this.statsPanel) return;

    const item = this.gameState.playerInventory?.find((i) => i.id === itemId);
    if (!item) {
      this.clearStats();
      return;
    }

    const html = `
      <div class="stat-row">
        <span class="stat-label">Name:</span>
        <span class="stat-value">${item.name || '—'}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Type:</span>
        <span class="stat-value">${item.type || '—'}</span>
      </div>
      ${item.damage ? `
      <div class="stat-row">
        <span class="stat-label">Damage:</span>
        <span class="stat-value">${item.damage}</span>
      </div>
      ` : ''}
      ${item.weight ? `
      <div class="stat-row">
        <span class="stat-label">Weight:</span>
        <span class="stat-value">${item.weight}kg</span>
      </div>
      ` : ''}
      ${item.rarity ? `
      <div class="stat-row">
        <span class="stat-label">Rarity:</span>
        <span class="stat-value">${item.rarity}</span>
      </div>
      ` : ''}
      ${item.description ? `
      <div class="stat-row stat-description">
        <span class="stat-label">Description:</span>
        <span class="stat-value">${item.description}</span>
      </div>
      ` : ''}
    `;

    this.statsPanel.innerHTML = html;
  }

  clearStats() {
    if (this.statsPanel) {
      this.statsPanel.innerHTML = '<div class="stat-empty">Select an item</div>';
    }
    if (this.loadBtn) {
      this.loadBtn.disabled = true;
    }
  }

  equipSelected() {
    if (!this.selectedItemId) return;

    const item = this.gameState.playerInventory?.find((i) => i.id === this.selectedItemId);
    if (!item) return;

    const slot = this.getSlotForItemType(item.type);
    this.equipItemToSlot(this.selectedItemId, slot);
    this.refresh();
  }

  equipItemToSlot(itemId, slotType) {
    const item = this.gameState.playerInventory?.find((i) => i.id === itemId);
    if (!item) return;

    // Se c'è già qualcosa equipaggiato in questo slot, spostalo nell'inventario
    const equipped = this.gameState.equippedItems || {};
    if (equipped[slotType]) {
      console.log("🔄 Slot occupato, rimozione item precedente");
      this.unequipFromSlot(slotType);
    }

    // Controlla se l'item è già equipaggiato in un altro slot
    for (const [existingSlot, equippedItem] of Object.entries(equipped)) {
      if (equippedItem && equippedItem.id === itemId) {
        console.log("⚠️ Item già equipaggiato in", existingSlot, "- rimozione");
        this.unequipFromSlot(existingSlot);
        break;
      }
    }

    // Update game state
    if (!this.gameState.equippedItems) {
      this.gameState.equippedItems = {};
    }
    this.gameState.equippedItems[slotType] = item;

    // Update 3D rendering
    if (this.equipmentManager) {
      this.equipmentManager.equipItem(item, slotType);
    }
    
    // Aggiorna anche legacy state per compatibilità
    if (this.gameState.inventory && this.gameState.inventory.equipped) {
      this.gameState.inventory.equipped[slotType] = item;
    }
    
    // Se è un'arma in mano destra, aggiorna weaponState
    if (slotType === 'right-hand' && item.type === 'weapon' && this.gameState.player) {
      const ws = this.gameState.player.weaponState;
      if (ws) {
        ws.currentWeapon = item.id;
        
        // Determina tipo munizioni e capacità caricatore
        if (item.id === 'pistol_beretta') {
          ws.ammoType = '9mm';
          ws.maxMag = 15;
          ws.currentMag = Math.min(ws.currentMag, ws.maxMag);
        } else if (item.id === 'pistol_43') {
          ws.ammoType = '45acp';
          ws.maxMag = 8;
          ws.currentMag = Math.min(ws.currentMag, ws.maxMag);
        }
        
        console.log("🔫 Arma equipaggiata:", item.id, "Munizioni:", ws.ammoType, ws.currentMag + "/" + ws.maxMag);
        
        // Mostra notifica equipaggiamento
        if (window.RSG && window.RSG.ui && window.RSG.ui.notifications) {
          window.RSG.ui.notifications.showWeaponEquipped(item.name);
        }
      }
      
      // Flag legacy
      this.gameState.player.hasGun = true;
      this.gameState.player.heldWeapon = item.id;
    }
    
    console.log("✅ Equipaggiato", item.name, "in", slotType);
  }

  unequipFromSlot(slotType) {
    const equipped = this.gameState.equippedItems || {};
    const item = equipped[slotType];
    if (!item) return;

    // Rimuovi dallo stato
    delete equipped[slotType];
    
    // Rimuovi dal rendering 3D
    if (this.equipmentManager) {
      this.equipmentManager.unequipItem(slotType);
    }
    
    // Aggiorna legacy state
    if (this.gameState.inventory && this.gameState.inventory.equipped) {
      delete this.gameState.inventory.equipped[slotType];
    }
    
    console.log("❌ Rimosso", item.name, "da", slotType);
  }

  moveEquippedItem(fromSlot, toSlot) {
    const equipped = this.gameState.equippedItems || {};
    const item = equipped[fromSlot];
    if (!item) return;

    delete equipped[fromSlot];
    equipped[toSlot] = item;

    if (this.equipmentManager) {
      this.equipmentManager.unequipItem(fromSlot);
      this.equipmentManager.equipItem(item, toSlot);
    }
  }

  getSlotForItemType(type) {
    // Map item types to default slots
    const typeSlotMap = {
      'pistol': 'right-hand',
      'sword': 'right-hand',
      'rifle': 'back',
      'shotgun': 'back',
      'bow': 'back',
      'shield': 'left-hand',
      'helmet': 'head',
      'armor': 'torso',
      'boots': 'feet',
      'pants': 'legs',
    };
    return typeSlotMap[type] || 'right-hand';
  }

  getItemThumbnail(item) {
    // Try icon first (from ItemRegistry), then thumbnail, then generate default
    if (item.icon) return item.icon;
    if (item.thumbnail) return item.thumbnail;
    return `assets/thumbnails/${item.id}.svg`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InventoryUI;
}
