# Advanced Equipment System - Implementation Guide

**Status**: ✅ Fully Implemented  
**Last Updated**: 2025  
**Version**: v1.0

## What Was Implemented

The Advanced Equipment System is a complete overhaul of the existing TAB-key inventory system with:

### 1. **3D Equipment Rendering**
- Items render in real-time in the Three.js scene when equipped
- Proper positioning for each of 7 body slots
- Real-time updates following player camera direction (hands) and position (body items)

### 2. **Advanced Inventory UI**
- 3-column layout: Body Diagram | Item Grid | Stats Panel
- Humanoid figure with equipment slot overlays
- Item grid with thumbnails and names
- Stats panel showing selected item properties
- "Load" button to equip selected item
- Close button and TAB key toggle

### 3. **Drag & Drop System**
- Drag items from inventory grid to equipment slots
- Move items between equipment slots
- Drag items back to inventory to unequip
- Visual feedback with hover states

### 4. **Item Registry System**
- Centralized item database with properties
- Automatic model registration with EquipmentManager
- Icon/thumbnail mapping for UI
- Preferred slot suggestions by item type

## File Structure

### New Files Created:

```
scripts/
├── data/
│   └── item-registry.js               (NEW - Item definitions & registry)
├── gameplay/
│   └── equipment-manager.js           (NEW - 3D rendering manager)
└── ui/
    └── inventory-ui.js                (UPDATED - Modern ES6 class)

assets/
├── images/
│   └── body-diagram.svg               (NEW - Humanoid figure)
└── thumbnails/                        (NEW - Directory)
    ├── pistol_beretta.svg
    ├── pistol_43.svg
    ├── helmet_tactical.svg
    ├── vest_kevlar.svg
    ├── backpack_tactical.svg
    ├── boots_combat.svg
    ├── grenade_frag.svg
    └── missing-item.svg

features/
└── feature-advanced-equipment-system.md  (Specification document)
```

### Modified Files:

- `index.html` - Updated inventory panel structure, added script includes
- `styles/main.css` - Added 350+ lines of styling for inventory UI
- `scripts/game.js` - Equipment system initialization, animate() integration, toggleInventory() enhancement

## Quick Start

### 1. Opening Inventory
```javascript
// Press TAB in-game (already mapped in input.js)
// Or manually call:
inventoryUI.toggle();
```

### 2. Adding New Items
Edit `scripts/data/item-registry.js`:
```javascript
'sword_longsword': {
  id: 'sword_longsword',
  name: 'Longsword',
  type: 'melee_weapon',
  rarity: 'uncommon',
  damage: 40,
  weight: 2.5,
  description: 'A well-balanced melee weapon',
  modelFile: 'models/sword-longsword.glb',
  preferredSlots: ['right-hand', 'left-hand'],
  icon: 'assets/thumbnails/sword_longsword.svg'
}
```

Then create:
1. Model file: `models/sword-longsword.glb` (max 5MB, ~50k triangles)
2. Icon: `assets/thumbnails/sword_longsword.svg` (80×80px SVG)

That's it! The system automatically handles everything.

### 3. Customizing Slot Positions
Edit `slotConfigs` in `scripts/gameplay/equipment-manager.js` (lines ~20-50):
```javascript
'right-hand': {
  position: [0.25, 0.1, -0.3],  // x, y, z offset from player
  rotation: [0, 0, 0],          // pitch, yaw, roll in radians
  scale: 1.0                    // size multiplier
}
```

## System Architecture

### Component Interaction Diagram:

```
┌─────────────────────────────────────────────────────────────┐
│                     game.js (main loop)                     │
│                                                             │
│  setupInventorySystem()                                     │
│  ├─→ ItemRegistry.registerAllModels(equipmentManager)      │
│  ├─→ new EquipmentManager(scene, camera, player)           │
│  └─→ new InventoryUI(state, equipmentManager)              │
│                                                             │
│  animate()                                                   │
│  └─→ equipmentManager.updateAllEquipped()                  │
│                                                             │
│  toggleInventory()                                          │
│  └─→ inventoryUI.toggle()                                  │
└─────────────────────────────────────────────────────────────┘
       ↓              ↓              ↓
    ┌──────────────────────────────────────────┐
    │      ItemRegistry (Centralized DB)       │
    │  items: { id → item data with icon/    │
    │          model paths }                   │
    └──────────────────────────────────────────┘
       ↓              ↓              ↓
    ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐
    │EquipmentMgr  │  │ InventoryUI    │  │  Game State      │
    ├──────────────┤  ├────────────────┤  ├──────────────────┤
    │- Loads GLBs  │  │- Renders UI    │  │- playerInventory │
    │- Positions   │  │- Handles input │  │- equippedItems   │
    │  items on    │  │- Drag & drop   │  │- ui.isInventory  │
    │  slots       │  │- Stats display │  │  Open             │
    │- Updates per │  │- Sync to state │  │                  │
    │  frame       │  │                │  │                  │
    └──────────────┘  └────────────────┘  └──────────────────┘
```

### State Flow:

1. **User clicks item** → InventoryUI.onItemClick()
   - Sets `selectedItemId` in UI state
   - Calls `renderStatsPanel(item)` to display properties

2. **User double-clicks or presses Load** → InventoryUI.equipSelected()
   - Gets preferred slot from ItemRegistry
   - Updates `state.equippedItems[slot]`
   - Calls `equipmentManager.equipItem(item, slot)`

3. **EquipmentManager.equipItem()** → Loads GLB model
   - Uses GLTFLoader to load model from path
   - Positions mesh using `slotConfigs[slot]`
   - Adds mesh to Three.js scene
   - Stores reference in `equippedMeshes[slot]`

4. **Every frame** → equipmentManager.updateAllEquipped()
   - Iterates all equipped slots
   - For hand items: rotates to face camera direction
   - For body items: follows player position
   - Updates Three.js matrices

5. **User drags item to slot** → InventoryUI.onSlotDrop()
   - Validates drop target
   - Updates `state.equippedItems[targetSlot]`
   - Unequips previous item from that slot (if any)
   - Calls equipmentManager to update 3D rendering

## 7 Equipment Slots

| Slot | Position | Typical Items | Special Behavior |
|------|----------|---------------|------------------|
| **head** | Top of body | Helmets, hats | Fixed to head height |
| **torso** | Center of body | Armor vests, robes | Fixed to body position |
| **left-hand** | Left side | Shields, off-hand weapons | Follows camera direction |
| **right-hand** | Right side | Weapons, tools | Rotates with camera look |
| **back** | Behind player | Rifles, bows, backpacks | Visible from behind |
| **legs** | Lower body | Leg armor, pants | Fixed to leg position |
| **feet** | Bottom | Boots, shoes | Fixed to foot position |

## Core Classes

### ItemRegistry (scripts/data/item-registry.js)

```javascript
ItemRegistry.getItem(itemId)              // Get item by ID
ItemRegistry.getAllItems()                // Get all items
ItemRegistry.getPreferredSlot(itemId)     // Suggest slot type
ItemRegistry.registerAllModels(mgr)       // Auto-register GLB paths
```

### EquipmentManager (scripts/gameplay/equipment-manager.js)

```javascript
new EquipmentManager(scene, camera, player)
equipmentManager.equipItem(item, slotType)
equipmentManager.unequipItem(slotType)
equipmentManager.updateAllEquipped()      // Call every frame
```

### InventoryUI (scripts/ui/inventory-ui.js)

```javascript
new InventoryUI(gameState, equipmentManager)
inventoryUI.show()
inventoryUI.hide()
inventoryUI.toggle()
inventoryUI.renderItemGrid()
inventoryUI.renderEquippedSlots()
```

## Performance Notes

- **Model Loading**: Async via GLTFLoader, doesn't block UI
- **Memory**: Max 7 models in scene (one per slot)
- **Frame Updates**: `updateAllEquipped()` is O(7) = minimal overhead
- **Three.js Cache**: Models are cached after first load

## Debugging

### Console Commands:

```javascript
// See all available items
window.ItemRegistry.getAllItems()

// Check if item is registered
window.ItemRegistry.getItem('pistol_beretta')

// See currently equipped items
state.equippedItems

// Manually equip item for testing
equipmentManager.equipItem(state.playerInventory[0], 'right-hand')

// Force UI refresh
inventoryUI.show()
inventoryUI.renderItemGrid()

// Check if UI elements are cached
inventoryUI.panel.id                      // Should be 'inventory-panel'
inventoryUI.itemGrid.id                   // Should be 'item-grid'
```

### Common Issues:

| Issue | Cause | Solution |
|-------|-------|----------|
| Items not appearing in grid | ItemRegistry items not in playerInventory | Check `createInitialState()` playerInventory initialization |
| 3D models not rendering | GLB file not found or wrong path | Verify `models/` directory and paths in ItemRegistry |
| UI not responding to clicks | Event listeners not attached | Check `attachEvents()` in InventoryUI constructor |
| Slots not accepting drops | Wrong data-slot attribute | Verify HTML slot divs match slotConfigs keys |
| Icons not showing | Missing SVG files or wrong paths | Create thumbnails in `assets/thumbnails/` |
| Inventory won't close | toggleInventory() not called | Check TAB key binding in `scripts/systems/input.js` |

## Future Enhancements

1. **Animations**
   - Add equip/unequip animations (3-5 frames)
   - Hand animations when drawing/holstering weapons
   - Slot highlight effects

2. **Quantity System**
   - Item stacking (consumables)
   - Item count badges on grid items
   - Weight calculation affecting movement speed

3. **Crafting**
   - Combine items to create new equipment
   - Disassemble items for components
   - Upgrade system

4. **Advanced Stats**
   - Armor penetration, fire rate, critical chance
   - Set bonuses (equip multiple items for bonus)
   - Enchantments/modifiers

5. **Visual Polish**
   - Equip animation transition
   - Particle effects on slot drops
   - Custom sound effects
   - Glow/highlight on rarity level

6. **Performance**
   - LOD (Level of Detail) for complex models
   - Model pooling for reused items
   - Texture atlasing for thumbnails

## Testing Checklist

- [ ] TAB key opens/closes inventory panel
- [ ] Click item highlights it and shows stats
- [ ] Double-click equips item to body
- [ ] Load button equips selected item
- [ ] Drag item to slot equips it
- [ ] Drag item from slot back to grid unequips it
- [ ] Move item between slots works
- [ ] 3D models render on correct body slots
- [ ] Hand weapons rotate with camera
- [ ] Close button hides panel
- [ ] ESC key doesn't interfere
- [ ] New items from ItemRegistry appear automatically
- [ ] Missing thumbnails show fallback icon
- [ ] Mobile/responsive layout works (if applicable)

---

**Implementation Complete** ✅  
Ready for testing and content creation!