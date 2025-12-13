# Feature: Advanced Equipment System (3D Rendering + Inventory UI Overhaul)

Status: drafting
Owner: Marco
Created: 2025-12-13
Last Updated: 2025-12-13
Version: v1
Related Areas: scripts/ui/inventory-ui.js, scripts/gameplay/weapons.js, scripts/game.js, scripts/content/models.js, index.html, styles/main.css

## 1) Summary (what & why)

**What**: Complete overhaul of the equipment/inventory system to:
- Render equipped items visually in 3D based on slot position (right hand, left hand, back, etc.)
- Redesign inventory UI with humanoid body diagram + item previews + drag-and-drop
- Single-click item selection → right-panel stats display
- Double-click or "Load" button to equip items to body slots

**Why**: Immersive visual feedback (see weapons in your character's hands), intuitive equipment management, professional UI/UX.

**Out of scope**: Character animation/skeletal binding, AI equipment logic, network sync for multiplayer.

---

## 2) Player experience (behavior & controls)

### Entry point
- Player opens inventory via key (e.g., `I`) or menu button
- Inventory UI shows:
  - **Left panel**: Humanoid body diagram with 7 equipment slots (head, torso, left hand, right hand, back, legs, feet)
  - **Center panel**: Grid of owned items (each shows model preview thumbnail + item name)
  - **Right panel**: Stats table for selected item (damage, weight, effects, etc.)

### Controls
- **Click item in grid** → Item highlight + stats appear in right panel
- **Double-click item** OR **click "Load" button** (when item selected) → Item equips to appropriate slot on body (e.g., pistol → right hand)
- **Drag item from body slot → different body slot** → Item moves to new slot (e.g., right hand → left hand)
- **Drag item from body slot → trash** → Item unequips (returns to inventory grid)

### 3D Feedback
- Equipped items render in 3D on the player model/hands
  - **Right hand**: Pistol/sword rotates to face camera direction
  - **Left hand**: Shield or off-hand weapon
  - **Back**: Rifle/bow visible from behind player
  - Items follow player movement and look direction

### UI Feedback
- Selected item: highlighted border in grid + stats populate
- Drag preview: semi-transparent ghost of item following cursor
- Drop success: item snaps into slot on body diagram + 3D model appears
- Drop failure: item returns to original position

### Failure states
- **Item incompatible with slot**: Drag returns to origin
- **Slot occupied**: Option to swap (drag old item out first) or cancel drop
- **Inventory full**: Message if trying to add items from world

---

## 3) Acceptance criteria (definition of done)

- [ ] AC1: Inventory UI renders with humanoid body diagram (SVG or image-based) on left, item grid in center, stats panel on right
- [ ] AC2: Single-click item → right panel shows item stats (name, damage, weight, rarity, description)
- [ ] AC3: Double-click or "Load" button equips item to correct body slot (pistol → right hand, etc.)
- [ ] AC4: Equipped items render visually in 3D on player (hands, back, etc.) and rotate with player look direction
- [ ] AC5: Drag-and-drop works: item from grid → body slot, slot → slot, slot → grid (unequip)
- [ ] AC6: Drag preview shows ghost item following cursor
- [ ] AC7: All slots maintain uniform size on body diagram; humanoid figure is clear and centered
- [ ] AC8: Item previews (thumbnails) load from model files (.glb) without lag

---

## 4) UX / UI changes

### DOM Structure (additions to `index.html`)

```html
<!-- Inventory UI container (initially hidden) -->
<div id="inventory-panel" style="display: none;" class="full-screen-overlay">
  <div class="inventory-container">
    
    <!-- Left: Body Equipment Slots -->
    <div class="inventory-left">
      <h3>Equipment</h3>
      <div class="body-diagram">
        <!-- SVG or image of humanoid figure -->
        <img src="assets/images/body-diagram.svg" alt="Body" class="body-figure">
        
        <!-- Draggable equipment slot overlays -->
        <div class="equip-slot head" data-slot="head">
          <div class="slot-icon"></div>
        </div>
        <div class="equip-slot torso" data-slot="torso">
          <div class="slot-icon"></div>
        </div>
        <div class="equip-slot left-hand" data-slot="left-hand">
          <div class="slot-icon"></div>
        </div>
        <div class="equip-slot right-hand" data-slot="right-hand">
          <div class="slot-icon"></div>
        </div>
        <div class="equip-slot back" data-slot="back">
          <div class="slot-icon"></div>
        </div>
        <div class="equip-slot legs" data-slot="legs">
          <div class="slot-icon"></div>
        </div>
        <div class="equip-slot feet" data-slot="feet">
          <div class="slot-icon"></div>
        </div>
      </div>
    </div>
    
    <!-- Center: Item Grid -->
    <div class="inventory-center">
      <h3>Inventory</h3>
      <div class="item-grid" id="item-grid">
        <!-- Items render here dynamically -->
        <div class="inventory-item" data-item-id="pistol_beretta">
          <img class="item-preview" src="assets/thumbnails/pistol_beretta.jpg" alt="Beretta Pistol">
          <span class="item-name">Beretta 92FS</span>
        </div>
        <!-- ... more items ... -->
      </div>
    </div>
    
    <!-- Right: Item Stats Panel -->
    <div class="inventory-right">
      <h3>Item Stats</h3>
      <div class="stats-panel" id="stats-panel">
        <!-- Populated on item click -->
        <div class="stat-empty">Select an item</div>
      </div>
      <button id="equip-load-btn" class="load-btn" title="Equip selected item">
        <img src="assets/icons/load.svg" alt="Load">
      </button>
    </div>
    
  </div>
  
  <!-- Close button -->
  <button id="inventory-close-btn" class="close-btn">×</button>
</div>
```

### CSS (additions to `styles/main.css`)

```css
/* Inventory panel overlay */
#inventory-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: none;
  z-index: 1000;
}

#inventory-panel.visible {
  display: flex;
  justify-content: center;
  align-items: center;
}

.inventory-container {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 20px;
  width: 90%;
  max-width: 1400px;
  height: 80vh;
  background: #1a1a1a;
  border: 2px solid #444;
  padding: 20px;
  border-radius: 8px;
  color: #ccc;
}

/* Left panel: Body diagram */
.inventory-left {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.body-diagram {
  position: relative;
  width: 250px;
  height: 400px;
  margin-top: 20px;
}

.body-figure {
  width: 100%;
  height: 100%;
  opacity: 0.7;
}

.equip-slot {
  position: absolute;
  width: 80px;
  height: 80px;
  border: 2px solid #666;
  border-radius: 6px;
  background: rgba(50, 50, 50, 0.6);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.equip-slot:hover {
  border-color: #aaa;
  background: rgba(100, 100, 100, 0.8);
}

.equip-slot.occupied {
  border-color: #4a9eff;
  background: rgba(74, 158, 255, 0.2);
}

.slot-icon {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* Slot positioning on humanoid (approximate) */
.equip-slot.head {
  top: 10px;
  left: 85px;
}

.equip-slot.torso {
  top: 120px;
  left: 85px;
}

.equip-slot.left-hand {
  top: 150px;
  left: 10px;
}

.equip-slot.right-hand {
  top: 150px;
  right: 10px;
}

.equip-slot.back {
  top: 80px;
  right: 30px;
}

.equip-slot.legs {
  top: 280px;
  left: 85px;
}

.equip-slot.feet {
  bottom: 10px;
  left: 85px;
}

/* Center panel: Item grid */
.inventory-center {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

#item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 15px;
}

.inventory-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 2px solid #555;
  border-radius: 6px;
  background: #222;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.inventory-item:hover {
  border-color: #888;
  background: #2a2a2a;
}

.inventory-item.selected {
  border-color: #4a9eff;
  background: rgba(74, 158, 255, 0.15);
  box-shadow: 0 0 10px rgba(74, 158, 255, 0.4);
}

.item-preview {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  background: #111;
}

.item-name {
  font-size: 0.85em;
  text-align: center;
  color: #aaa;
}

/* Right panel: Stats */
.inventory-right {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

#stats-panel {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: rgba(40, 40, 40, 0.6);
  border: 1px solid #555;
  border-radius: 6px;
  font-size: 0.9em;
  line-height: 1.6;
}

.stat-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 10px;
  margin-bottom: 8px;
  border-bottom: 1px solid #444;
  padding-bottom: 6px;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: #88ccff;
  font-weight: bold;
}

.stat-value {
  color: #ddd;
}

.stat-empty {
  color: #777;
  text-align: center;
  margin-top: 50px;
}

.load-btn {
  padding: 12px 20px;
  background: #4a9eff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  color: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.load-btn:hover:not(:disabled) {
  background: #3a7edf;
  transform: scale(1.05);
}

.load-btn:disabled {
  background: #555;
  cursor: not-allowed;
  opacity: 0.5;
}

.load-btn img {
  width: 20px;
  height: 20px;
}

/* Drag preview */
.drag-preview {
  position: fixed;
  pointer-events: none;
  opacity: 0.7;
  z-index: 2000;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #555;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #777;
}
```

---

## 5) Technical design (how)

### Core logic: `scripts/ui/inventory-ui.js` (Enhanced)

**Main responsibilities:**
1. Render inventory panel with humanoid body diagram
2. Populate item grid from player inventory data
3. Handle item selection (click → show stats)
4. Handle double-click / Load button → equip logic
5. Handle drag-and-drop between slots and grid
6. Call `EquipmentManager` to update 3D rendering

```javascript
class InventoryUI {
  constructor(gameState, equipmentManager) {
    this.gameState = gameState;  // Access player inventory
    this.equipmentManager = equipmentManager;  // 3D rendering
    this.selectedItemId = null;
    this.draggedElement = null;
    this.draggedFrom = null;  // 'grid' | 'right-hand' | 'left-hand' etc.
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
  }

  attachEvents() {
    // Open/close
    this.closeBtn.addEventListener('click', () => this.hide());
    
    // Item grid events (delegated)
    this.itemGrid.addEventListener('click', (e) => this.onItemClick(e));
    this.itemGrid.addEventListener('dblclick', (e) => this.onItemDoubleClick(e));
    this.itemGrid.addEventListener('dragstart', (e) => this.onGridDragStart(e));
    this.itemGrid.addEventListener('dragend', (e) => this.onGridDragEnd(e));
    
    // Load button
    this.loadBtn.addEventListener('click', () => this.equipSelected());
    
    // Body slots
    this.attachSlotEvents();
  }

  attachSlotEvents() {
    const slots = this.panel.querySelectorAll('.equip-slot');
    slots.forEach(slot => {
      slot.addEventListener('dragover', (e) => this.onSlotDragOver(e));
      slot.addEventListener('drop', (e) => this.onSlotDrop(e, slot));
      slot.addEventListener('dragstart', (e) => this.onSlotDragStart(e));
    });
  }

  show() {
    this.panel.classList.add('visible');
    this.refresh();
  }

  hide() {
    this.panel.classList.remove('visible');
    this.selectedItemId = null;
    this.clearStats();
  }

  refresh() {
    this.renderItemGrid();
    this.renderEquippedSlots();
  }

  renderItemGrid() {
    this.itemGrid.innerHTML = '';
    const inventory = this.gameState.playerInventory || [];
    
    inventory.forEach(item => {
      const div = document.createElement('div');
      div.className = 'inventory-item';
      div.dataset.itemId = item.id;
      if (item.id === this.selectedItemId) {
        div.classList.add('selected');
      }
      
      div.innerHTML = `
        <img class="item-preview" src="${this.getItemThumbnail(item)}" alt="${item.name}">
        <span class="item-name">${item.name}</span>
      `;
      
      div.draggable = true;
      this.itemGrid.appendChild(div);
    });
  }

  renderEquippedSlots() {
    const equipped = this.gameState.equippedItems || {};
    const slots = this.panel.querySelectorAll('.equip-slot');
    
    slots.forEach(slot => {
      const slotType = slot.dataset.slot;
      const item = equipped[slotType];
      
      if (item) {
        slot.classList.add('occupied');
        slot.dataset.equippedItemId = item.id;
        slot.innerHTML = `<img src="${this.getItemThumbnail(item)}" alt="${item.name}">`;
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
    this.itemGrid.querySelectorAll('.inventory-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.itemId === itemId);
    });
    
    // Show stats
    this.showStats(itemId);
    
    // Enable load button
    this.loadBtn.disabled = false;
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
  }

  onGridDragEnd(e) {
    // Clean up
    if (this.draggedElement) {
      this.draggedElement.style.opacity = '1';
    }
    this.draggedElement = null;
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
  }

  onSlotDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  onSlotDrop(e, slot) {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/itemId');
    const targetSlot = slot.dataset.slot;
    
    if (this.draggedFrom === 'grid') {
      // Equip from grid to slot
      this.equipItemToSlot(itemId, targetSlot);
    } else if (this.draggedFrom === 'grid-or-slot') {
      // Move between slots
      this.moveEquippedItem(this.draggedFrom, targetSlot);
    }
    
    this.refresh();
  }

  showStats(itemId) {
    const item = this.gameState.playerInventory.find(i => i.id === itemId);
    if (!item) return;
    
    const html = `
      <div class="stat-row">
        <span class="stat-label">Name:</span>
        <span class="stat-value">${item.name}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Type:</span>
        <span class="stat-value">${item.type}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Damage:</span>
        <span class="stat-value">${item.damage || '—'}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Weight:</span>
        <span class="stat-value">${item.weight || '—'}kg</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Rarity:</span>
        <span class="stat-value">${item.rarity || 'Common'}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Description:</span>
        <span class="stat-value">${item.description || 'No description'}</span>
      </div>
    `;
    
    this.statsPanel.innerHTML = html;
  }

  clearStats() {
    this.statsPanel.innerHTML = '<div class="stat-empty">Select an item</div>';
    this.loadBtn.disabled = true;
  }

  equipSelected() {
    if (!this.selectedItemId) return;
    
    const item = this.gameState.playerInventory.find(i => i.id === this.selectedItemId);
    if (!item) return;
    
    const slot = this.getSlotForItemType(item.type);
    this.equipItemToSlot(this.selectedItemId, slot);
    this.refresh();
  }

  equipItemToSlot(itemId, slotType) {
    const item = this.gameState.playerInventory.find(i => i.id === itemId);
    if (!item) return;
    
    // Update game state
    if (!this.gameState.equippedItems) {
      this.gameState.equippedItems = {};
    }
    this.gameState.equippedItems[slotType] = item;
    
    // Update 3D rendering
    this.equipmentManager.equipItem(item, slotType);
  }

  moveEquippedItem(fromSlot, toSlot) {
    const equipped = this.gameState.equippedItems || {};
    const item = equipped[fromSlot];
    if (!item) return;
    
    delete equipped[fromSlot];
    equipped[toSlot] = item;
    
    this.equipmentManager.unequipItem(fromSlot);
    this.equipmentManager.equipItem(item, toSlot);
  }

  getSlotForItemType(type) {
    // Map item types to default slots
    const typeSlotMap = {
      'pistol': 'right-hand',
      'sword': 'right-hand',
      'shield': 'left-hand',
      'rifle': 'back',
      'helmet': 'head',
      'armor': 'torso',
      'boots': 'feet',
      'pants': 'legs'
    };
    return typeSlotMap[type] || 'right-hand';
  }

  getItemThumbnail(item) {
    // Generate thumbnail from model or use static asset
    return `assets/thumbnails/${item.id}.jpg`;
  }
}
```

### Core logic: `scripts/gameplay/equipment-manager.js` (New file)

**Responsibilities:**
- Manage 3D rendering of equipped items
- Attach models to player hands/back
- Update positions based on look direction
- Handle unequip

```javascript
class EquipmentManager {
  constructor(scene, camera, player) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.equippedMeshes = {};  // { 'right-hand': Mesh, ... }
    this.slotOffsets = {
      'right-hand': { pos: [0.3, 0, -0.2], rot: [0, 0, 0] },
      'left-hand': { pos: [-0.3, 0, -0.2], rot: [0, Math.PI, 0] },
      'back': { pos: [0, -0.1, 0.3], rot: [0, 0, 0] },
      'head': { pos: [0, 0.3, 0], rot: [0, 0, 0] },
      'torso': { pos: [0, 0, 0], rot: [0, 0, 0] },
      'legs': { pos: [0, -0.5, 0], rot: [0, 0, 0] },
      'feet': { pos: [0, -0.9, 0], rot: [0, 0, 0] }
    };
  }

  equipItem(item, slotType) {
    // Load model from models.js
    const model = this.getModelData(item.id);
    if (!model) {
      console.warn(`No model found for item ${item.id}`);
      return;
    }

    // If already equipped in slot, unequip first
    this.unequipItem(slotType);

    // Load the GLB/model
    const loader = new THREE.GLTFLoader();
    loader.load(model.file, (gltf) => {
      const mesh = gltf.scene;
      
      // Apply offset and rotation for slot
      const offset = this.slotOffsets[slotType];
      mesh.position.set(...offset.pos);
      mesh.rotation.set(...offset.rot);
      
      // Scale if needed
      mesh.scale.multiplyScalar(model.scale || 1);

      // Add to scene
      this.scene.add(mesh);
      this.equippedMeshes[slotType] = {
        mesh,
        itemId: item.id,
        slotType
      };

      // Update on animation loop (position tracking)
      this.updateEquippedItemPosition(slotType);
    });
  }

  unequipItem(slotType) {
    const equipped = this.equippedMeshes[slotType];
    if (equipped) {
      this.scene.remove(equipped.mesh);
      delete this.equippedMeshes[slotType];
    }
  }

  updateEquippedItemPosition(slotType) {
    // Called each frame to keep item position correct
    const equipped = this.equippedMeshes[slotType];
    if (!equipped) return;

    // For hands: rotate with player look direction
    if (slotType === 'right-hand' || slotType === 'left-hand') {
      // Get camera direction (where player is looking)
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);

      // Update mesh world position relative to player
      const offset = this.slotOffsets[slotType];
      equipped.mesh.position.copy(this.player.position);
      equipped.mesh.position.add(new THREE.Vector3(...offset.pos).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.atan2(direction.x, direction.z)
      ));

      // Rotate item to face direction
      equipped.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }
  }

  updateAllEquipped() {
    // Called each animation frame
    Object.keys(this.equippedMeshes).forEach(slot => {
      this.updateEquippedItemPosition(slot);
    });
  }

  getModelData(itemId) {
    // Fetch from models.js or central registry
    // Return { file: 'models/pistol.glb', scale: 1, ... }
    const models = {
      'pistol_beretta': { file: 'models/pistol_beretta.glb', scale: 1 },
      'rifle_ak47': { file: 'models/rifle_ak47.glb', scale: 1.1 },
      // ... more items
    };
    return models[itemId];
  }
}
```

### Integration into `scripts/game.js`

```javascript
// In initThreeJS():
this.equipmentManager = new EquipmentManager(scene, camera, player);

// In animation loop (after movement updates):
this.equipmentManager.updateAllEquipped();

// In setupControls() or menu:
window.openInventory = function() {
  if (inventoryUI) inventoryUI.show();
};
```

### Data structure: `gameState.equippedItems`

```javascript
gameState.equippedItems = {
  'right-hand': { id: 'pistol_beretta', name: 'Beretta 92FS', damage: 15, ... },
  'left-hand': null,
  'back': { id: 'rifle_ak47', ... },
  'head': null,
  'torso': null,
  'legs': null,
  'feet': null
};

gameState.playerInventory = [
  { id: 'pistol_beretta', name: 'Beretta 92FS', type: 'pistol', damage: 15, weight: 0.9, rarity: 'Common', description: 'Reliable sidearm', file: 'models/pistol_beretta.glb' },
  { id: 'rifle_ak47', name: 'AK-47', type: 'rifle', damage: 30, weight: 3.6, rarity: 'Uncommon', description: 'Powerful assault rifle', file: 'models/rifle_ak47.glb' },
  // ...
];
```

### Constraints

- **100% offline**: All item icons/thumbnails stored in `assets/thumbnails/`
- **Browser-safe JS**: No Node APIs, all Three.js operations
- **Performance**: Update equipped positions once per frame, not per item per frame

---

## 6) Task breakdown (implementation checklist)

- [ ] Task 1: Create `scripts/ui/inventory-ui.js` with InventoryUI class (grid, stats panel, slot visualization)
- [ ] Task 2: Create `scripts/gameplay/equipment-manager.js` with 3D rendering logic
- [ ] Task 3: Add inventory UI HTML structure to `index.html`
- [ ] Task 4: Add inventory CSS styles to `styles/main.css`
- [ ] Task 5: Create body-diagram.svg (humanoid figure with slot positions)
- [ ] Task 6: Generate item thumbnail images (80×80px for each item in `assets/thumbnails/`)
- [ ] Task 7: Add item data to `gameState.playerInventory` (or load from `scripts/content/models.js`)
- [ ] Task 8: Integrate EquipmentManager into `scripts/game.js` (init + update loop)
- [ ] Task 9: Hook up keyboard shortcut (e.g., `I` key) to open inventory
- [ ] Task 10: Implement drag-and-drop event handlers in InventoryUI (item → slot, slot ↔ slot)
- [ ] Task 11: Test: single-click → stats show, double-click → equip, Load button → equip
- [ ] Task 12: Test: drag pistol to right hand → renders in hand facing look direction
- [ ] Task 13: Test: drag from right hand → left hand → item moves visually
- [ ] Task 14: Polish: smooth animations, visual feedback, error states

---

## 7) Edge cases & risks

**Edge cases:**
- Item equipped while inventory open + manual edit to game state → refresh UI
- Drag item from grid to occupied slot → swap or override?
- Unequip all items → player has no weapons (should be allowed)
- Item incompatible with slot (e.g., rifle to left-hand) → reject or auto-choose best slot?

**Perf risks:**
- Don't recalculate equipped item positions outside animation loop
- Cache DOM references to avoid repeated querySelector
- Lazy-load model thumbnails if inventory is large

**Electron risks:**
- File paths for images/models must be relative (`assets/`, `models/`)
- No dynamic HTTP requests for item data

---

## 8) Test / verification plan

### Manual test steps

1. **Open inventory**: Press `I` key → inventory panel appears
2. **Select item**: Click on Beretta Pistol in grid → right panel shows stats (name, damage, weight, etc.)
3. **Equip via Load button**: Click Load button → item disappears from grid, appears in right-hand slot on body diagram
4. **See 3D item**: In game view (behind inventory), pistol should render in player's right hand, pointing in look direction
5. **Equip via double-click**: Double-click rifle in grid → rifle equips to back slot, appears on body diagram
6. **Drag item**: Drag pistol from right-hand slot to left-hand slot → item moves visually, 3D model moves to left side
7. **Unequip**: Drag pistol from left-hand to grid area (or trash) → item returns to inventory grid, 3D model disappears
8. **Inventory close**: Click X button → panel closes, equipped items remain in 3D view

### Expected visual results

- Inventory UI is responsive, readable, well-organized
- Item stats appear instantly when clicked
- 3D items render smoothly, follow camera look direction
- Drag previews show ghosted image following cursor
- No performance drops when opening/closing inventory

---

## 9) Open questions

- Q1: Should unequipping an item move it back to grid, or should there be a limited "drop" mechanic (item falls on ground)?
  - **A**: For now, unequip → returns to grid. Drop mechanic is v2.

- Q2: Can player equip same item to multiple slots (e.g., two pistols, one each hand)?
  - **A**: Yes, item should be cloned in inventory if needed, or duplicates allowed in equippedItems.

- Q3: Body diagram proportions — should it match the player model in-game or be a generic humanoid?
  - **A**: Generic humanoid for now; v2 can sync with actual player model.

- Q4: Should equipped items affect player stats (speed, damage) in real-time?
  - **A**: Yes, equipmentManager should emit events that update gameState.playerStats.

---

## 10) Notes / scratchpad (AI iteration log)

### Decisions made
- **UI layout**: 3-column (equipment | inventory | stats) is most intuitive for equipment games
- **Drag-and-drop**: Native HTML5 drag-and-drop instead of custom mouse tracking (simpler, standard)
- **3D rendering**: Items positioned relative to camera direction, not fixed to player mesh (allows for aiming feel)

### Tradeoffs
- **Complexity**: Drag-and-drop + 3D sync = more code, but UX is worth it
- **Performance**: Updating equipped item positions each frame is minimal cost (few items, simple math)
- **Asset creation**: Generating thumbnails for each item requires manual work; could be automated with model previews

### Follow-ups / future v2 ideas
- Character customization (visible model changes when equipping armor)
- Item rarity color coding (legendary = gold border, etc.)
- Animated item "equip" sequence (sword draw, etc.)
- Weight/encumbrance system (speed penalty if overloaded)
- Drop items on ground instead of auto-inventory
- Hotbar for quick-access items (1–9 keys)
- Item sorting/filtering (by type, rarity, weight)

---

## 11) FPS scale & placement standards (practical)
- **Pistole in mano**: model scale override ~`0.002`; slot right-hand offset `x=0.22, y=-0.08, z=-0.5`, slot scale `0.7` → arma visibile solo in basso a destra, non occlude il centro.
- **Cappello/Headgear**: model scale override ~`0.006`; slot head `x=0, y=0.32, z=0.08`, slot scale `0.35` → sopra la testa, non visibile guardando in alto.
- **Regola generale**: oggetti equip non devono entrare nel view frustum centrale; per le mani usa `z` negativo e `y` leggermente negativo, per headgear `y` alto e `z` leggermente positivo.
