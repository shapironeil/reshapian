# How to Add New Items - Quick Guide

This guide shows you how to add new equipment items to Shappa Games.

## 5-Minute Quick Start

### Step 1: Add Item Data (1 min)

Edit `scripts/data/item-registry.js`:

```javascript
'sword_katana': {
  id: 'sword_katana',
  name: 'Katana',
  type: 'melee_weapon',
  rarity: 'rare',
  damage: 45,
  weight: 2.2,
  description: 'A masterfully crafted Japanese sword.',
  modelFile: 'models/sword-katana.glb',
  preferredSlots: ['right-hand', 'left-hand'],
  icon: 'assets/thumbnails/sword_katana.svg'
}
```

### Step 2: Create Thumbnail (2 min)

Create `assets/thumbnails/sword_katana.svg`:

```svg
<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect width="80" height="80" fill="#222" stroke="rgba(200, 150, 100, 0.8)" stroke-width="2"/>
  <!-- Your SVG drawing here -->
</svg>
```

### Step 3: Prepare 3D Model (varies)

Create or import `models/sword-katana.glb`:
- Max 5MB file size
- Max ~50k triangles
- Embedded textures (no external files)
- Proper scale for player hand

### Step 4: Test

1. Start the game: `npm start`
2. Press TAB to open inventory
3. Your new item should appear in the grid!

Done! ✅

---

## Detailed Instructions

### 1. Item Data Structure

Each item in ItemRegistry needs these properties:

**Required:**
- `id` - Unique identifier (use snake_case)
- `name` - Display name
- `type` - 'weapon', 'armor', 'accessory', 'consumable'
- `rarity` - 'common', 'uncommon', 'rare', 'epic', 'legendary'
- `weight` - Number (affects encumbrance)
- `description` - String (shown in stats panel)
- `modelFile` - Path to GLB file in models/ directory
- `preferredSlots` - Array of slot names (used to suggest where to equip)
- `icon` - Path to thumbnail SVG

**Optional (type-specific):**
- `damage` - For weapons (number)
- `defense` - For armor (number)
- `capacity` - For containers like backpacks (number)
- `armor_penetration` - For weapons (0-1 float)
- `fire_rate` - For guns (shots per second)
- `effects` - For special items (array of strings)

**Example Weapon:**
```javascript
'rifle_sniper': {
  id: 'rifle_sniper',
  name: 'Precision Rifle',
  type: 'weapon',
  rarity: 'rare',
  damage: 65,
  weight: 3.8,
  armor_penetration: 0.8,
  fire_rate: 0.5,
  description: 'Long-range precision rifle with excellent accuracy.',
  modelFile: 'models/rifle-sniper.glb',
  preferredSlots: ['right-hand', 'back'],
  icon: 'assets/thumbnails/rifle_sniper.svg'
}
```

**Example Armor:**
```javascript
'gloves_tactical': {
  id: 'gloves_tactical',
  name: 'Tactical Gloves',
  type: 'armor',
  rarity: 'uncommon',
  defense: 3,
  weight: 0.2,
  description: 'Protective gloves with reinforced knuckles.',
  modelFile: 'models/gloves-tactical.glb',
  preferredSlots: ['left-hand', 'right-hand'],  // Can equip to both hands
  icon: 'assets/thumbnails/gloves_tactical.svg'
}
```

### 2. Creating Thumbnails

Thumbnails are 80×80px SVG files. They appear in the inventory grid.

**Option A: Draw from scratch**

Use a tool like Inkscape or even browser DevTools to create an SVG:

```svg
<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="80" height="80" fill="#1a1a1a" stroke="#666" stroke-width="2"/>
  
  <!-- Your item drawing -->
  <circle cx="40" cy="40" r="20" fill="#e74c3c"/>
  <text x="40" y="45" text-anchor="middle" fill="#fff">SG</text>
</svg>
```

**Option B: AI-generated or commissioned**

- Use ChatGPT to generate SVG code for item icons
- Hire an artist on Fiverr/Upwork
- Use an icon library (remember licensing!)

**Thumbnail Design Tips:**
- Use a dark background (fits the UI theme)
- Add a colored border (helps distinguish items)
- Keep it simple and recognizable
- Make important details clear at 80×80px
- Use rarity colors: 
  - Common: Gray/Blue
  - Uncommon: Green
  - Rare: Purple
  - Epic: Orange
  - Legendary: Gold

**Existing Examples:**
See `assets/thumbnails/` for reference designs.

### 3. Creating 3D Models

The 3D model is what players see in-game when the item is equipped.

#### Option A: Blender (Free)

1. Create or import your item model in Blender
2. Scale it appropriately (relative to human hand/body)
3. Ensure proper origin point (where it attaches to body)
4. Export as `.glb` format:
   - File > Export > glTF 2.0 (.glb/.gltf)
   - Check "Pack all data" (embeds textures)
   - Check "Exclude animations" (if not needed)

#### Option B: Asset Store

- Buy pre-made models from Sketchfab, TurboSquid, etc.
- Ensure license allows use in your project
- Export/convert to `.glb` format

#### Option C: AI Generation

- Use Nomad Sculpt (mobile 3D sculpting)
- Use free AI tools (Meshy.ai, CSM, etc.)
- Generate and refine before export

#### Model Specifications

- **File Format**: `.glb` (binary glTF - includes textures)
- **File Size**: Max 5MB per file
- **Geometry**: Max ~50k triangles
- **Textures**: Embedded (not external files)
- **Materials**: Standard PBR (metallic, roughness, etc.)
- **Scale**: 
  - Hand weapons: ~0.3-0.5 units long
  - Armor: ~0.5-1.5 units
  - Backpacks: ~1.0-1.5 units
- **Origin**: Center of where item attaches to slot
- **No Armature/Bones**: Items are static (no skeletal animation)

#### Testing Your Model

```javascript
// In browser console while in game:
let testItem = window.ItemRegistry.getItem('your_new_item_id');
equipmentManager.equipItem(testItem, 'right-hand');
```

If the model appears tiny, huge, or rotated wrong:
- Go back to Blender
- Scale it: Object > Scale > [adjust]
- Rotate it: Object > Rotate > [adjust]
- Re-export

### 4. Slot Positioning (Advanced)

If your item looks wrong when equipped, customize its position in `scripts/gameplay/equipment-manager.js`:

```javascript
this.slotConfigs = {
  'right-hand': {
    position: [0.25, 0.1, -0.3],  // x, y, z offset from player
    rotation: [0, 0, 0],          // pitch, yaw, roll (radians)
    scale: 1.0                    // size multiplier
  },
  // ... adjust for your item
};
```

**Position explanation:**
- `x`: Left (-) / Right (+)
- `y`: Down (-) / Up (+)
- `z`: Back (-) / Forward (+)

**Rotation explanation:**
- All in radians (0-2π)
- Pitch: Up/down tilt
- Yaw: Left/right rotation
- Roll: Barrel roll

**Example: Large Rifle**

If a rifle is too small, increase scale:
```javascript
'back': {
  position: [0, 0.2, 0.4],
  rotation: [0, 0, 0],
  scale: 1.5  // 50% larger
}
```

### 5. Adding to Starting Inventory

Edit `scripts/game.js` in `createInitialState()`:

```javascript
playerInventory: (function() {
  if (typeof window.ItemRegistry !== 'undefined') {
    let items = window.ItemRegistry.getAllItems().slice(0, 5);
    return items.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      // ... etc
    }));
  }
  return [];
})()
```

Or manually add to initial inventory:
```javascript
playerInventory: [
  window.ItemRegistry.getItem('pistol_beretta'),
  window.ItemRegistry.getItem('sword_katana'),  // Your new item!
  // ... others
]
```

### 6. Testing Your Item

1. **Start game**: `npm start`
2. **Open inventory**: Press TAB
3. **Check if item appears**:
   - Should be in inventory grid
   - Thumbnail should load
   - Stats should be accurate
4. **Equip item**:
   - Double-click to equip to preferred slot
   - 3D model should appear on character
   - Should rotate/move with camera/player
5. **Check console**: No errors?

**Debugging:**

```javascript
// Check if item is registered
window.ItemRegistry.getItem('sword_katana')

// Check if model path is correct
// Should return object like: { file: 'models/sword-katana.glb', scale: 1 }

// Manually equip for testing
equipmentManager.equipItem(
  window.ItemRegistry.getItem('sword_katana'),
  'right-hand'
)

// Check if equipped
state.equippedItems['right-hand']
```

---

## Common Issues

| Problem | Solution |
|---------|----------|
| Item not in inventory grid | Check it's in `playerInventory` in createInitialState() |
| Thumbnail not showing | Verify icon path is correct, file exists, is valid SVG |
| 3D model not rendering | Check modelFile path, file exists in `models/`, console for loader errors |
| Model too small/big | Adjust `scale` in slotConfigs or re-export model with better scale |
| Model rotated wrong | Adjust `rotation` in slotConfigs (in radians) |
| Stats not showing | Check all required properties are in ItemRegistry |
| Can't equip to slot | Check `preferredSlots` array includes that slot name |

---

## Item Type Guidelines

### Weapons
- Should deal damage
- Should have weight
- Fits in: right-hand, left-hand, back (mostly)
- Examples: pistol, rifle, sword, grenade

### Armor
- Should provide defense
- Should have weight
- Fits in: head, torso, legs, feet
- Examples: helmet, vest, boots

### Accessories
- Special effects or bonuses
- Can fit in any slot
- Examples: gloves, goggles, backpack

### Consumables
- One-time use items
- Should indicate effect
- Typically don't render 3D
- Examples: potion, grenade, medkit

---

## Quick Reference: Available Rarity Levels

```
'common'      - Gray (most frequent)
'uncommon'    - Green
'rare'        - Blue/Purple
'epic'        - Orange/Gold
'legendary'   - Bright Gold (very rare)
```

---

## Next Steps

1. ✅ Add your item to ItemRegistry
2. ✅ Create a thumbnail SVG
3. ✅ Create a 3D model (GLB file)
4. ✅ Test in-game
5. ✅ Adjust positioning if needed
6. ✅ Add to starting inventory (optional)
7. ✅ Document item lore (optional)

**Total time**: 30-60 min per item (faster with experience!)

---

**Happy creating! 🎮**