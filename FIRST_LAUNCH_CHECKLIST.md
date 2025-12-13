# First Launch Checklist - Advanced Equipment System

**Objective**: Verify that the Advanced Equipment System is properly installed and working.

**Estimated Time**: 5-10 minutes

---

## Pre-Launch Verification

### 1. File Structure Verification

Check that all new files exist:

- [ ] `scripts/data/item-registry.js` - 99 lines
- [ ] `scripts/gameplay/equipment-manager.js` - 229 lines
- [ ] `scripts/ui/inventory-ui.js` - 360 lines
- [ ] `assets/images/body-diagram.svg` - SVG file
- [ ] `assets/thumbnails/` - Directory created
- [ ] `assets/thumbnails/pistol_beretta.svg` - Icon file
- [ ] `assets/thumbnails/pistol_43.svg` - Icon file
- [ ] `assets/thumbnails/helmet_tactical.svg` - Icon file
- [ ] `assets/thumbnails/vest_kevlar.svg` - Icon file
- [ ] `assets/thumbnails/backpack_tactical.svg` - Icon file
- [ ] `assets/thumbnails/boots_combat.svg` - Icon file
- [ ] `assets/thumbnails/grenade_frag.svg` - Icon file
- [ ] `assets/thumbnails/missing-item.svg` - Fallback icon

### 2. Code Integration Verification

Check that files have been properly modified:

**index.html:**
- [ ] `<script src="scripts/data/item-registry.js"></script>` added
- [ ] `<script src="scripts/gameplay/equipment-manager.js"></script>` added
- [ ] `<script src="scripts/ui/inventory-ui.js"></script>` added
- [ ] Inventory panel HTML updated (3-column structure)
- [ ] Equipment slots have `data-slot` attributes
- [ ] Body diagram references `assets/images/body-diagram.svg`

**styles/main.css:**
- [ ] `#inventory-panel` styling present (350+ lines added)
- [ ] `.inventory-container` grid layout defined
- [ ] `.equip-slot` positioning rules present
- [ ] Drag & drop hover states defined

**scripts/game.js:**
- [ ] `var equipmentManager = null;` declared at top
- [ ] `var inventoryUI = null;` declared at top
- [ ] `playerInventory` added to state
- [ ] `equippedItems` added to state (7 slots)
- [ ] `setupInventorySystem()` initializes both managers
- [ ] `animate()` includes `equipmentManager.updateAllEquipped()` call
- [ ] `toggleInventory()` calls `inventoryUI.toggle()`

### 3. Script Load Order Verification

In `index.html`, verify scripts load in this order:

1. ✅ `three.min.js` (Three.js)
2. ✅ `GLTFLoader.js` (Model loader)
3. ✅ `item-registry.js` **(NEW - BEFORE equipment-manager)**
4. ✅ `weapons.js` (Legacy)
5. ✅ `inventory.js` (Legacy)
6. ✅ `equipment-manager.js` (NEW - AFTER item-registry)
7. ✅ ... other scripts ...
8. ✅ `inventory-ui.js` (NEW)
9. ✅ `game.js` (Must be last before menu)
10. ✅ `menu.js` (Last)

⚠️ **Critical**: item-registry.js MUST load before equipment-manager.js!

---

## Launch & Initial Testing

### Step 1: Start the Game

```bash
cd "Shappa Games"
npm start
```

**Expected**: Game window opens without errors.

**Check**: Browser console (F12) should show:
```
✅ EquipmentManager inizializzato con modelli registrati
✅ InventoryUI inizializzato
```

**If errors**: Check console for exact error message and refer to Troubleshooting section.

### Step 2: Verify Initialization

In browser console (F12), run:

```javascript
// Should all return true/object
typeof EquipmentManager === 'function'        // true
typeof InventoryUI === 'function'             // true
typeof window.ItemRegistry === 'object'       // true
equipmentManager !== null                      // true
inventoryUI !== null                           // true
state.playerInventory.length > 0              // true (should be > 0)
state.equippedItems !== null                  // true
```

**Expected**: All return `true` or show objects.

**If failed**: Check that setupInventorySystem() is called from startGame().

### Step 3: Test Inventory UI

**Action**: Press **TAB**

**Expected Results**:
- [ ] Inventory panel appears (dark overlay with 3 columns)
- [ ] Left column shows humanoid body figure
- [ ] 7 equipment slots visible on body (head, torso, hands, back, legs, feet)
- [ ] Center column shows item grid with items
- [ ] Each item shows thumbnail and name
- [ ] Right column shows "Stats" header
- [ ] Close button (×) visible in top-right
- [ ] "Load" button visible at bottom-right

**Visual Checklist**:
- [ ] Body diagram SVG renders (humanoid shape visible)
- [ ] Equipment slots are positioned correctly on body
- [ ] Item grid has scrollbar (if many items)
- [ ] Thumbnails display (or show missing-item fallback)
- [ ] Text is readable
- [ ] Layout doesn't overlap

### Step 4: Test Item Selection

**Action**: Click on first item (Beretta 92FS)

**Expected Results**:
- [ ] Item highlights blue
- [ ] Stats panel on right updates with:
  - [ ] Item name: "Beretta 92FS"
  - [ ] Type: "weapon"
  - [ ] Rarity: "common"
  - [ ] Damage: "25"
  - [ ] Weight: "1.0"
  - [ ] Description: visible and readable

**If stats don't show**: Check ItemRegistry data structure and console for errors.

### Step 5: Test Equipping (Method 1: Double-Click)

**Action**: Double-click on Beretta item in grid

**Expected Results**:
- [ ] Item disappears from inventory grid
- [ ] Item appears on body diagram (right-hand slot)
- [ ] Thumbnail visible in slot
- [ ] Grid updates immediately
- [ ] No console errors

### Step 6: Test Unequipping (Drag & Drop)

**Action**: Drag Beretta from body slot back to inventory grid area

**Expected Results**:
- [ ] Item drag is responsive (cursor changes)
- [ ] Item returns to grid when dropped
- [ ] Body slot becomes empty
- [ ] No console errors
- [ ] UI updates smoothly

### Step 7: Test Equipping (Method 2: Load Button)

**Action**: 
1. Click Pistol item in grid
2. Click "Load" button

**Expected Results**:
- [ ] Item selected (highlighted)
- [ ] Load button click is responsive
- [ ] Item equips to appropriate slot (right-hand)
- [ ] UI updates immediately
- [ ] No lag

### Step 8: Test Multiple Slots

**Action**: 
1. Equip helmet to head slot
2. Equip vest to torso slot
3. Equip boots to feet slot

**Expected Results**:
- [ ] All items equip to correct slots
- [ ] Body diagram shows all 3 items
- [ ] Grid no longer shows equipped items
- [ ] Slots show thumbnails
- [ ] No console errors

### Step 9: Test Moving Between Slots

**Action**: Drag helmet from head slot to different location (attempt to drag to torso slot)

**Expected Results**:
- [ ] Drag is responsive
- [ ] Item moves to new slot if slot is empty
- [ ] Or returns to original position if slot is occupied
- [ ] UI updates smoothly

### Step 10: Close Inventory

**Action**: Press **TAB** again

**Expected Results**:
- [ ] Inventory panel closes
- [ ] Game is playable again
- [ ] Equipped items remain equipped
- [ ] Can press TAB again to reopen and verify items are still there

---

## Console Diagnostic Check

In browser console (F12), run these commands:

```javascript
// Check ItemRegistry
console.log('Items:', window.ItemRegistry.getAllItems().length)  // Should be 7
console.log('Beretta:', window.ItemRegistry.getItem('pistol_beretta'))  // Should return object

// Check state
console.log('Inventory:', state.playerInventory.length)  // Should be > 0
console.log('Equipped:', state.equippedItems)  // Should show all 7 slots

// Check managers
console.log('EquipmentManager:', equipmentManager)  // Should be object, not null
console.log('InventoryUI:', inventoryUI)  // Should be object, not null

// Check scene
console.log('Scene objects:', scene.children.length)  // Should be > 0 (models + environment)
```

**Expected Output**: All show objects/numbers, not "null" or "undefined".

---

## Performance Check

In browser DevTools (F12), go to **Performance** tab:

1. Open DevTools
2. Click "Performance" tab
3. Click red record button
4. Press TAB to open inventory
5. Click items, drag items (5-10 seconds of actions)
6. Press TAB to close
7. Stop recording

**Expected Results**:
- [ ] FPS stays above 30 (shown in red bar)
- [ ] No long purple/orange blocks (janky frames)
- [ ] CPU usage is reasonable
- [ ] Memory doesn't spike

**If performance is poor**:
- Check console for repeated errors
- Check if 3D models are very large
- Check for memory leaks in DevTools Memory tab

---

## Common Issues & Quick Fixes

### Issue: "Uncaught ReferenceError: ItemRegistry is not defined"
**Cause**: `item-registry.js` loaded after equipment-manager.js  
**Fix**: Move `item-registry.js` script to load BEFORE `equipment-manager.js` in index.html

### Issue: "Cannot read properties of null (reading 'panel')"
**Cause**: InventoryUI can't find DOM elements  
**Fix**: Check HTML has correct IDs:
- `<div id="inventory-panel">`
- `<div id="item-grid">`
- `<div id="stats-panel">`

### Issue: TAB key doesn't open inventory
**Cause**: toggleInventory() not called  
**Fix**: Check `scripts/systems/input.js` line ~82 for TAB key handler

### Issue: Items show as blank squares (no thumbnails)
**Cause**: SVG files missing or wrong path  
**Fix**: Check `assets/thumbnails/` directory exists and has all .svg files

### Issue: Severe FPS drop when inventory opens
**Cause**: Large item grid or CSS issues  
**Fix**: Check console for errors, verify CSS is loaded correctly

---

## Success Criteria

System is working correctly when:

✅ TAB opens inventory panel  
✅ All 7 items visible in grid  
✅ Click shows stats in right panel  
✅ Double-click or Load equips items  
✅ Items appear on body diagram  
✅ Drag & drop is responsive  
✅ No red errors in console  
✅ No performance issues  
✅ TAB closes inventory  
✅ Can reopen and items still equipped

---

## Next Steps

### If All Tests Pass:
1. ✅ System is working!
2. Move to `DEPLOYMENT_CHECKLIST.md`
3. Prepare for wider testing
4. Create content (3D models)

### If Tests Fail:
1. Check the specific error in console
2. Find error message in "Common Issues" section above
3. Apply fix
4. Run test again
5. Contact development team if unresolved

---

## Support

**Quick Troubleshooting Guide**: `DEPLOYMENT_CHECKLIST.md`  
**Technical Details**: `IMPLEMENTATION_NOTES.md`  
**User Guide**: `EQUIPMENT_GUIDE.md`  
**Developer Guide**: `ADD_NEW_ITEMS.md`  

---

**Date Completed**: _____________  
**Tested By**: _____________  
**Status**: ✅ PASS / ❌ FAIL / ⚠️ ISSUES

**Notes**:
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Equipment System v1.0 - First Launch Verification Complete**