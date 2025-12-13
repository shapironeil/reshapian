# 📋 PIANO D'AZIONE: Inventario Funzionale + Espansione Ambiente

**Data**: 13 Dicembre 2025 (Aggiornato dopo pull)  
**Status**: Revisione Post-Implementation  
**Priorità**: Sistema raccolta → Munizioni → Nuovi ambienti

---

## 🔥 PROSSIMI PASSAGGI IMMEDIATI

### 1. ✅ COMPLETATO - Fix Visuale Equipment
- **Pistole FPS**: Posizionate più avanti (Z: -0.35), scale aumentato (2.2x)
- **Left-hand**: Canna ora punta correttamente in avanti (rotation Y corretta)
- **Cappello**: Ridimensionato (scale 0.7x) e alzato (Y: 0.25)
- **File modificato**: `scripts/gameplay/equipment-manager.js`

### 2. ✅ COMPLETATO - Pistole sul Tavolo più Grandi
- **Beretta**: scale 0.025 → 0.03 (ben visibile)
- **Pistol 43**: scale 0.02 → 0.025 (ben visibile)
- **File modificato**: `scripts/content/models.js`

### 3. ✅ COMPLETATO - Sprint 1: Sistema Raccolta Generalizzato
**Implementato**:
- ✅ `pickupGun()` → `pickupItem()` in `scripts/systems/interactions.js`
- ✅ Sincronizzazione con `state.playerInventory` per InventoryUI
- ✅ Sincronizzazione con `inventory.items` (legacy compatibility)
- ✅ Rimozione da `state.world.interactables`
- ✅ Integrazione ItemRegistry per metadata
- ✅ Fallback per oggetti senza registry
- ✅ Prompt dinamici per tipo oggetto
- ✅ Versione legacy in `scripts/game.js` aggiornata
- ✅ Supporto quantity per items stackable

**File modificati**:
- `scripts/systems/interactions.js` (pickupItem + handleInteract + updateInteractPrompt)
- `scripts/game.js` (pickupItem legacy + handleInteract)

**Test da fare**: 
- [ ] Raccogli pistola → appare in inventory grid
- [ ] Raccogli laptop → appare in inventory
- [ ] Raccogli spada → appare in inventory
- [ ] Equip da grid → funziona
- [ ] Oggetti raccolti spariscono dal mondo 3D

### 4. ✅ COMPLETATO - Sprint 2: Sistema Munizioni
**Implementato**:
- ✅ `state.player.ammo` e `weaponState` aggiunto in `createInitialState()`
- ✅ `shoot()` modificato per controllare `currentMag` e bloccare se vuoto
- ✅ `reloadWeapon()` implementato in `projectiles.js` con 2s delay
- ✅ Tasto R collegato per ricarica (già presente in input.js)
- ✅ HUD munizioni in `index.html` (ammo-counter + reload-indicator)
- ✅ Stili CSS aggiunti con colori dinamici (rosso se ≤3, arancione se ≤7)
- ✅ `updateAmmoDisplay()` in animation loop

**Struttura dati**:
```javascript
player.ammo: { '9mm': 45, '45acp': 24, '556': 90, 'shotgun': 12, 'grenade': 2 }
player.weaponState: {
  currentWeapon: null,
  currentMag: 15,
  maxMag: 15,
  ammoType: '9mm',
  isReloading: false
}
```

**File modificati**:
- `scripts/game.js` (createInitialState + updateAmmoDisplay + reload action)
- `scripts/systems/projectiles.js` (shoot con check munizioni + reloadWeapon)
- `index.html` (HUD ammo-counter + reload-indicator)
- `styles/main.css` (stili ammo counter con animazione pulse)

**Test da fare**: 
- [ ] HUD munizioni visibile quando equipaggi arma
- [ ] Sparo decrementa currentMag
- [ ] A 0 munizioni → click vuoto (console log)
- [ ] R → ricarica dopo 2s
- [ ] Riserva munizioni decrementata
- [ ] Colori cambiano (rosso ≤3, arancione ≤7)

### 5. ✅ COMPLETATO - Sprint 3: Nuovi Ambienti

#### Sprint 3A - Bunker Environment ✅
**Implementato**:
- ✅ Entry "bunker" in `scripts/content/environments.js`
- ✅ `getBunkerModels()` - 12 modelli (armi, tools, crates, emergency light)
- ✅ `buildBunkerLayout()` in `environment.js` - 25x25 concrete room con muri e soffitto
- ✅ Lighting dark: background 0x1a1a1a, orange emergency lights
- ✅ Spawn [0, 1.7, 8] guardando verso sud
- ✅ Collectibles: 2 pistole sul rack, tools, laptop

#### Sprint 3B - Apartment Environment ✅
**Implementato**:
- ✅ Entry "apartment" in `scripts/content/environments.js`
- ✅ `getApartmentModels()` - 8 modelli (sofa, TV, bookshelf, laptop, bed, hat)
- ✅ `buildApartmentLayout()` in `environment.js` - 15x12 parquet room con finestra
- ✅ Lighting warm: background 0x8899aa, cozy indoor lighting
- ✅ Spawn [0, 1.7, 6]
- ✅ Collectibles: laptop, cowboy hat

**Totale ambienti disponibili**: 4
1. Warehouse Yard (default)
2. Test Range
3. Underground Bunker (NUOVO)
4. Safe House Apartment (NUOVO)

**File modificati**:
- `scripts/content/environments.js` (+150 righe)
- `scripts/systems/environment.js` (+120 righe layout functions)

**Test da fare**:
- [ ] Settings → Environment → "Underground Bunker" → Start
- [ ] Spawn in bunker scuro con luci arancioni
- [ ] Raccogli pistole dal rack
- [ ] Settings → "Safe House Apartment" → ambiente cozy
- [ ] Finestra con luce azzurra visibile

### 6. 📦 OPZIONALE - Sprint 4-5: Polish & Collectibles
- Spawn ammo boxes con pickupData
- Sistema notifiche pickup
- Suoni (pickup, reload, empty click)
- Minimap (opzionale)

---

## ✅ COMPLETATO (Pull da GitHub)

### Sistema Environment Switching
- ✅ **Environment Registry** (`scripts/content/environments.js`)
  - 2 ambienti disponibili: "Warehouse Yard" (default), "Test Range"
  - Schema completo: spawn, lighting, fog, models
- ✅ **Environment Manager** (`scripts/systems/environment.js`)
  - Teardown completo con dispose di geometrie/materiali
  - Fade overlay durante switch
  - Tracking oggetti per cleanup
- ✅ **Menu Integration** (`scripts/menu.js`)
  - Dropdown ambiente in Settings
  - Auto-load al start
  - Sincronizzazione selection
- ✅ **Game Integration** (`scripts/game.js`)
  - `state.environment` con currentId, selectedId, isSwitching
  - Luci gestite dal sistema environment
  - Layout dinamico basato su ambiente

**Impatto sul piano originale**: L'infrastruttura per espandere la mappa è già pronta! Invece di modificare hardcoded `createEnvironment()`, ora possiamo creare nuovi ambienti come entries nel registry.

---

## 🎯 OBIETTIVI PRINCIPALI (AGGIORNATI)

### 1. Sistema di Raccolta Funzionale
- ✅ Pistole visibili in equipaggiamento
- ✅ Visuale pistole migliorata (più avanti, canna corretta)
- ✅ Cappello dimensionato correttamente (scale 0.7x, pos Y 0.25)
- 🔥 **NEXT**: Raccolta oggetti → inventario (priorità ALTA)
- 🔥 **NEXT**: Sistema munizioni + ricarica (priorità ALTA)
- 🔄 Feedback UI per raccolta

### 2. Analisi Modelli 3D (33 modelli) ✅ COMPLETATA
- ✅ Classificazione completa in 7 categorie
- ✅ Dimensioni reali e scale documentate
- ✅ Definizione utilizzo per gameplay

### 3. Espansione Ambiente (METODO CAMBIATO)
- ✅ Infrastruttura environment switching pronta
- 🔄 Creare ambiente "Bunker" nel registry
- 🔄 Creare ambiente "Apartment" nel registry  
- 🔄 Opzionale: creare ambiente "Urban Street" (hub centrale)

---

## 📦 INVENTARIO COMPLETO MODELLI 3D

### CATEGORIA A: ARMI (Equipaggiabili + Munizioni)

#### 1. **Beretta 92FS** ✅ ESISTENTE
- **File**: `beretta_92fs_-_game_ready_-_free.glb`
- **Posizione attuale**: Tavolo indoor (11, 1.08, -4.5)
- **Scale**: 0.025 (tavolo), 0.004 (equipaggiato con 2.0x slot)
- **Dimensioni reali**: ~20cm lunghezza
- **Uso**: Arma sidearm, damage 25
- **Munizioni**: 9mm Parabellum (15 colpi per caricatore)
- **Action**: Raccolta → inventario → equip in mano destra/sinistra
- **Status**: ✅ Equipaggiabile, ❌ Non raccoglibile da terra

#### 2. **Pistol 43 Tactical** ✅ ESISTENTE
- **File**: `pistol_43_tactical__free_lowpoly.glb`
- **Posizione attuale**: Tavolo indoor (9, 1.08, -4.5)
- **Scale**: 0.02 (tavolo), 0.0035 (equipaggiato con 2.0x slot)
- **Dimensioni reali**: ~18cm lunghezza
- **Uso**: Arma compatta, damage 35
- **Munizioni**: .45 ACP (8 colpi per caricatore)
- **Action**: Raccolta → inventario → equip in mano
- **Status**: ✅ Equipaggiabile, ❌ Non raccoglibile da terra

#### 3. **Paladin Longsword** ✅ ESISTENTE
- **File**: `paladin_longsword_free_download.glb`
- **Posizione attuale**: Indoor (-12, 1.2, 4)
- **Scale**: 0.4
- **Dimensioni reali**: ~140cm lunghezza
- **Uso**: Arma melee, damage 45
- **Action**: Raccolta → inventario → equip in mano o schiena
- **Status**: ✅ Equipaggiabile, ❌ Non raccoglibile

---

### CATEGORIA B: EQUIPAGGIAMENTO (Vestibile/Trasportabile)

#### 4. **Cowboy Hat** ✅ PARZIALE
- **File**: `cowboy_hat_free.glb`
- **Posizione attuale**: Scaffale (-8, 1.6, -3.5)
- **Scale**: 0.15 (ambiente), 0.15 (head slot)
- **Dimensioni reali**: ~35cm diametro
- **Uso**: Armor headgear, defense +15
- **Action**: Raccolta → equip su testa
- **Status**: ✅ Definito in ItemRegistry, ❌ Non interattivo

#### 5. **Laptop** ✅ INTERATTIVO
- **File**: `laptop_free.glb`
- **Posizione attuale**: Tavolo (10, 1.06, -5)
- **Scale**: 0.35
- **Dimensioni reali**: ~38cm larghezza
- **Uso**: PC interattivo (apre interfaccia)
- **Action**: E per usare (attualmente funzionante)
- **Status**: ✅ Completamente funzionale

#### 6. **Tools Pack** 🆕 NON CATALOGATO
- **File**: `tools_pack._free.glb`
- **Posizione attuale**: Indoor (-10, 0, 6)
- **Scale**: 0.9
- **Dimensioni reali**: Kit attrezzi ~50cm
- **Uso proposto**: Crafting/riparazione, trasportabile in inventario
- **Action**: Raccolta → inventario → uso per crafting
- **Status**: ❌ Non definito in ItemRegistry

---

### CATEGORIA C: MOBILI (Decorativi - Ambiente)

#### 7-9. **Old Sofa** (x3 copie)
- **File**: `old_sofa_free.glb`
- **Posizioni**: (0,0,8), (-5,0,6), (5,0,6)
- **Scale**: 1.5, 1.3, 1.3
- **Dimensioni reali**: ~200cm lunghezza
- **Uso**: Arredamento living area
- **Action**: Nessuna (statico)

#### 10. **Vintage TV**
- **File**: `vintage_tv_free.glb`
- **Posizione**: (0, 1, 0)
- **Scale**: 0.8
- **Dimensioni reali**: ~60cm larghezza
- **Uso**: Decorativo, potenziale interattivo futuro
- **Action futuro**: Potrebbe mostrare info/video

#### 11-12. **Bookshelves** (x2)
- **Files**: `chocolate_beech_bookshelf_free.glb`, `dusty_old_bookshelf_free.glb`
- **Posizioni**: (-8,0,-4), (8,0,-4)
- **Scale**: 1.0
- **Dimensioni reali**: ~180cm altezza
- **Uso**: Arredamento + potenziale storage

#### 13. **Blue Eyeball** 👁️
- **File**: `blue_eyeball_free.glb`
- **Posizione**: (8, 1.4, -3.5)
- **Scale**: 0.5
- **Dimensioni reali**: ~20cm diametro
- **Uso**: Decorativo inquietante
- **Potenziale**: Easter egg interattivo

---

### CATEGORIA D: ESTERNI (Garden/Outdoor)

#### 14. **Bench Model**
- **File**: `bench_model_free.glb`
- **Posizione**: (-10, 0, 35)
- **Scale**: 1.0
- **Dimensioni reali**: ~150cm lunghezza
- **Uso**: Seduta decorativa

#### 15-16. **Rocks Stylized** (x2)
- **File**: `free_pack_-_rocks_stylized.glb`
- **Posizioni**: (-5,0,50), (12,0,60)
- **Scale**: 1.0
- **Uso**: Decorazione naturale

#### 17-26. **Grass** (x10 copie) 🌿
- **File**: `grass_free_download.glb`
- **Posizioni**: varie da (0,0,45) a (±15,0,70)
- **Scale**: 1.5 tutte
- **Uso**: Ground cover ripetuto

---

### CATEGORIA E: STRUTTURE (Buildings)

#### 27. **Warehouse**
- **File**: `warehouse_fbx_model_free.glb`
- **Posizione**: (60, 0, 60)
- **Scale**: 0.5
- **Dimensioni reali**: ~15m x 20m
- **Uso**: Possibile BUNKER o deposito
- **Potenziale**: Area esplorable indoor

#### 28. **Interior** (Appartamento!)
- **File**: `interior_free.glb`
- **Posizione**: (-60, 0, -40)
- **Scale**: 0.5
- **Dimensioni**: Stanza singola ~8m x 6m
- **Uso**: APPARTAMENTO senza porte/finestre
- **Potenziale**: Safe house o spawn alternativo
- **Problema**: Nessun accesso visibile

#### 29. **Road**
- **File**: `road_free.glb`
- **Posizione**: (0, 0, -70)
- **Scale**: 0.7
- **Uso**: Strada/percorso

#### 30. **Barricade**
- **File**: `free_barricade.glb`
- **Posizione**: (0, 0, 80)
- **Scale**: 1.0
- **Uso**: Ostacolo difensivo
- **Potenziale**: Equipaggiabile per costruzione base

---

### CATEGORIA F: PERSONAGGI (NPCs)

#### 31. **Robot R.E.P.O** 🤖
- **File**: `r.e.p.o_realistic_character_free_download.glb`
- **Posizione**: (-3, 0, 2)
- **Scale**: 1.0
- **Dimensioni**: ~180cm altezza
- **Uso**: NPC con dialogo
- **Action**: E per parlare (funzionale)
- **Status**: ✅ Interattivo

#### 32. **Realistic Male Character**
- **File**: `realistic_male_character.glb`
- **Posizione**: (3, 0, 2)
- **Scale**: 1.0
- **Dimensioni**: ~175cm altezza
- **Uso**: NPC statico, potenziale merchant
- **Status**: ❌ Non interattivo

---

### CATEGORIA G: ANIMALI (Mobili)

#### 33. **Deer** 🦌
- **File**: `deer_demo_free_download.glb`
- **Posizione**: (0, 0, 55) + movimento circolare
- **Scale**: 1.5
- **Dimensioni**: ~130cm altezza spalla
- **Uso**: Bersaglio mobile per caccia
- **Movement**: Raggio 10, velocità 0.5
- **Status**: ✅ Animato

---

## 🔧 FASE 1: SISTEMA DI RACCOLTA OGGETTI

### Obiettivo
Quando il player preme **E** su un oggetto `usable`, deve essere aggiunto all'inventario e rimosso dalla scena.

### Modifiche Necessarie

#### 1.1 Aggiornare `interactions.js` - `pickupGun()`
**File**: `scripts/systems/interactions.js`

**Problema attuale**:
```javascript
function pickupGun(target) {
  // Rimuove dalla scena ✅
  // Aggiunge a inventory.items ✅
  // Ma NON aggiunge a playerInventory (usato da InventoryUI) ❌
}
```

**Soluzione**:
```javascript
function pickupWeapon(target) {
  if (!ctx || !ctx.state || !target) return;
  
  // 1. Ottieni metadata da ItemRegistry
  var itemData = window.ItemRegistry.getItem(target.id);
  if (!itemData) {
    console.warn("Item non trovato in registry:", target.id);
    return;
  }
  
  // 2. Aggiungi a playerInventory (per UI moderna)
  var playerInv = ctx.state.playerInventory || [];
  var existingItem = playerInv.find(item => item.id === target.id);
  
  if (existingItem) {
    // Se esiste, incrementa quantità
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    // Altrimenti crea nuovo item
    playerInv.push({
      id: itemData.id,
      name: itemData.name,
      type: itemData.type,
      damage: itemData.damage || 0,
      defense: itemData.defense || 0,
      weight: itemData.weight,
      rarity: itemData.rarity,
      description: itemData.description,
      modelFile: itemData.modelFile,
      icon: itemData.icon,
      quantity: 1
    });
  }
  
  ctx.state.playerInventory = playerInv;
  
  // 3. Rimuovi dalla scena
  if (target.model && target.model.parent) {
    target.model.parent.remove(target.model);
  }
  
  // 4. Rimuovi da interactables
  var idx = ctx.state.world.interactables.indexOf(target);
  if (idx !== -1) {
    ctx.state.world.interactables.splice(idx, 1);
  }
  
  // 5. Aggiorna UI inventario
  if (ctx.updateInventoryUI) {
    ctx.updateInventoryUI();
  }
  
  // 6. Feedback visivo/audio
  console.log("✅ Raccolto:", itemData.name);
  // TODO: showPickupNotification(itemData.name, itemData.icon);
}
```

#### 1.2 Generalizzare raccolta per tutti gli `usable`
**File**: `scripts/systems/interactions.js` - `handleInteract()`

```javascript
function handleInteract() {
  if (!ctx || !ctx.state) return;
  if (!ctx.isGameplayMode()) return;
  var target = getNearestInteractable();
  if (!target) return;

  // PC ha logica dedicata
  if (target.id === "pc_laptop") {
    usePC();
    return;
  }
  
  // Robot ha dialogo
  if (target.type === "robot") {
    startDialogue();
    return;
  }
  
  // Tutti gli altri usable → pickup
  if (target.category === "usable") {
    pickupItem(target);
    return;
  }
}
```

#### 1.3 Aggiungere oggetti mancanti a ItemRegistry
**File**: `scripts/data/item-registry.js`

Aggiungere:
- `tools_pack`: type='tool', uso per crafting
- `cowboy_hat`: già definito ma rendere interattivo
- `sword_longsword`: già definito

---

## 🔫 FASE 2: SISTEMA MUNIZIONI

### Obiettivo
Ogni arma da fuoco ha munizioni limitate. Il player deve trovare/comprare caricatori.

### Struttura Dati

#### 2.1 Stato Munizioni
**File**: `scripts/game.js` - `createInitialState()`

```javascript
state.player.ammo = {
  '9mm': 45,        // Beretta (15 x 3 caricatori iniziali)
  '45acp': 24,      // Pistol 43 (8 x 3 caricatori)
  '556': 90,        // Futuro: rifle
  'shotgun_shell': 0,
  'grenade': 2
};

state.player.weaponState = {
  currentWeapon: null,        // 'pistol_beretta', 'pistol_43', etc
  currentMag: 15,             // Colpi nel caricatore attuale
  isReloading: false,
  reloadProgress: 0
};
```

#### 2.2 Definizione Armi
**File**: `scripts/gameplay/weapons.js` (nuovo o esistente)

```javascript
window.RSG.gameplay.weapons = {
  weaponDefs: {
    pistol_beretta: {
      ammoType: '9mm',
      magSize: 15,
      damage: 25,
      fireRate: 0.3,      // secondi tra colpi
      reloadTime: 2.0,
      range: 50
    },
    pistol_43: {
      ammoType: '45acp',
      magSize: 8,
      damage: 35,
      fireRate: 0.4,
      reloadTime: 1.8,
      range: 40
    },
    sword_longsword: {
      ammoType: null,     // Melee non usa munizioni
      damage: 45,
      range: 2.5
    }
  }
};
```

#### 2.3 Logica Sparo con Munizioni
**File**: `scripts/systems/projectiles.js` - `fireBullet()`

```javascript
function fireBullet() {
  var weapon = ctx.state.player.heldWeapon;
  if (!weapon) return;
  
  var weaponData = getWeaponData(weapon);
  if (!weaponData) return;
  
  // Check munizioni nel caricatore
  if (ctx.state.player.weaponState.currentMag <= 0) {
    console.log("⚠️ Caricatore vuoto! Premi R per ricaricare");
    // TODO: play empty click sound
    return;
  }
  
  // Crea proiettile
  createBullet();
  
  // Decrementa colpi nel caricatore
  ctx.state.player.weaponState.currentMag--;
  
  // Aggiorna HUD
  updateAmmoDisplay();
}
```

#### 2.4 Ricarica Arma
**File**: `scripts/systems/input.js` - aggiungere key `R`

```javascript
case 'KeyR':
  if (ctx.state.player.heldWeapon) {
    reloadWeapon();
  }
  break;

function reloadWeapon() {
  var weapon = ctx.state.player.heldWeapon;
  var weaponData = getWeaponData(weapon);
  if (!weaponData) return;
  
  var ammoType = weaponData.ammoType;
  var availableAmmo = ctx.state.player.ammo[ammoType] || 0;
  
  if (availableAmmo <= 0) {
    console.log("❌ Nessuna munizione di tipo", ammoType);
    return;
  }
  
  // Start reload animation
  ctx.state.player.weaponState.isReloading = true;
  
  setTimeout(function() {
    var needed = weaponData.magSize - ctx.state.player.weaponState.currentMag;
    var toLoad = Math.min(needed, availableAmmo);
    
    ctx.state.player.weaponState.currentMag += toLoad;
    ctx.state.player.ammo[ammoType] -= toLoad;
    ctx.state.player.weaponState.isReloading = false;
    
    console.log("✅ Ricaricato:", toLoad, "colpi");
  }, weaponData.reloadTime * 1000);
}
```

#### 2.5 HUD Munizioni
**File**: `scripts/ui/hud.js` - aggiungere elemento

```html
<!-- In index.html -->
<div id="ammo-counter" class="ammo-display">
  <span class="mag-ammo">15</span> / <span class="reserve-ammo">45</span>
</div>
```

```javascript
function updateAmmoDisplay() {
  var weaponState = state.player.weaponState;
  var weapon = state.player.heldWeapon;
  
  if (!weapon) {
    document.getElementById('ammo-counter').style.display = 'none';
    return;
  }
  
  var weaponData = getWeaponData(weapon);
  var ammoType = weaponData.ammoType;
  
  document.querySelector('.mag-ammo').textContent = weaponState.currentMag;
  document.querySelector('.reserve-ammo').textContent = state.player.ammo[ammoType];
  document.getElementById('ammo-counter').style.display = 'block';
}
```

#### 2.6 Drop Munizioni nel Mondo
Creare oggetti `ammo_9mm`, `ammo_45acp` raccoglibili:

**File**: `scripts/content/models.js` - aggiungere

```javascript
// Caricatori sparsi nel mondo
{ 
  file: "ammo_box_9mm.glb",  // TODO: trovare modello
  pos: [12, 1.05, -6], 
  rot: 0, 
  scale: 0.5, 
  category: "usable", 
  area: "indoor", 
  id: "ammo_9mm_mag",
  ammoType: "9mm",
  quantity: 15
},
```

---

## 🗺️ FASE 3: ESPANSIONE AMBIENTE

### Obiettivo
Creare due nuove aree esplorabili collegate all'ambiente principale.

## 🗺️ NUOVO APPROCCIO: ENVIRONMENT-BASED EXPANSION

**Cambiamento architetturale**: Invece di modificare `createEnvironment()` hardcoded, ora usiamo il **Environment Registry System** (`scripts/content/environments.js`).

### Vantaggi dell'approccio registry:
1. ✅ Switch istantaneo tra ambienti via menu
2. ✅ Teardown automatico (no memory leak)
3. ✅ Fade transitions built-in
4. ✅ Spawn points dedicati per ambiente
5. ✅ Lighting presets per atmosfera

### 3.1 BUNKER come Nuovo Environment

**Implementazione**: Aggiungere entry in `scripts/content/environments.js`

```javascript
{
  id: "bunker",
  label: "Underground Bunker",
  description: "Secure military bunker with weapon storage and crafting",
  spawn: { position: [0, 1.7, 8], yaw: Math.PI },  // Spawn guardando verso centro
  lighting: {
    background: 0x1a1a1a,  // Quasi nero
    fog: { color: 0x0f0f0f, near: 8, far: 35 },  // Fog denso
    ambient: { color: 0xff6633, intensity: 0.25 },  // Luce emergenza arancione
    directional: { color: 0xff8844, intensity: 0.4, position: [0, 15, 0] },  // Dall'alto
    fill: { color: 0x442200, intensity: 0.15, position: [5, 3, 5] }  // Riempimento scuro
  },
  layout: "bunker",  // Triggera buildBunkerLayout() in environment.js
  models: getBunkerModels
}
```

**Layout bunker** (da implementare in `environment.js`):
```javascript
function buildBunkerLayout() {
  // Floor 25x25 concrete
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(25, 25),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  addTrackedObject(floor);

  // 4 muri chiusi (claustrofobico)
  var wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
  
  // North wall
  var wallN = new THREE.Mesh(new THREE.BoxGeometry(25, 4, 0.5), wallMat);
  wallN.position.set(0, 2, -12.5);
  addTrackedObject(wallN);
  
  // South, East, West walls...
  // (simile ma posizioni diverse)

  // Porta "uscita" decorativa (non funzionale, si switcha via menu)
  var doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2, 3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  );
  doorFrame.position.set(0, 1.5, 12.5);
  addTrackedObject(doorFrame);
}
```

**Models bunker**:
```javascript
function getBunkerModels() {
  return [
    // Weapon racks (usa barricade come placeholder)
    { file: "free_barricade.glb", pos: [-8, 0, -8], rot: 0, scale: 0.8, category: "structure" },
    { file: "free_barricade.glb", pos: [8, 0, -8], rot: 0, scale: 0.8, category: "structure" },
    
    // Ammo crates (usa bench come placeholder)
    { 
      file: "bench_model_free.glb", 
      pos: [-5, 0, 5], 
      scale: 0.6, 
      category: "usable", 
      id: "ammo_crate_1",
      pickupData: { ammoType: "9mm", quantity: 30 }
    },
    { 
      file: "bench_model_free.glb", 
      pos: [5, 0, 5], 
      scale: 0.6, 
      category: "usable", 
      id: "ammo_crate_2",
      pickupData: { ammoType: "45acp", quantity: 24 }
    },
    
    // Crafting table (usa laptop come placeholder)
    { file: "laptop_free.glb", pos: [0, 0.8, -5], scale: 0.5, category: "furniture" },
    
    // Tool pack raccoglibile
    { 
      file: "tools_pack._free.glb", 
      pos: [0, 0.8, -4], 
      scale: 0.4, 
      category: "usable", 
      id: "tools_bunker"
    },
    
    // Luce emergenza (usa eyeball come placeholder visivo)
    { file: "blue_eyeball_free.glb", pos: [0, 3.5, 0], scale: 0.3, category: "decor" }
  ];
}
```

**Come switchare al bunker**:
1. Menu → Settings → Environment → "Underground Bunker"
2. Start Game → Fade out → Carica bunker → Fade in
3. Player spawna a [0, 1.7, 8] guardando verso centro
4. Può raccogliere munizioni/tools
5. Per uscire: Settings → "Warehouse Yard" (o altro)

---

### 3.2 APPARTAMENTO come Nuovo Environment

```javascript
{
  id: "apartment",
  label: "Safe House Apartment",
  description: "Abandoned apartment for storage, rest, and hiding",
  spawn: { position: [0, 1.7, 6], yaw: Math.PI },
  lighting: {
    background: 0x4a5568,  // Grigio blu
    fog: { color: 0x3a4558, near: 12, far: 50 },
    ambient: { color: 0xe0e6ff, intensity: 0.35 },  // Luce diurna morbida
    directional: { color: 0xffffee, intensity: 0.55, position: [15, 25, 10] },  // Dalla finestra
    fill: { color: 0x6688aa, intensity: 0.2, position: [-8, 10, -5] }
  },
  layout: "apartment",
  models: getApartmentModels
}
```

**Layout apartment**:
```javascript
function buildApartmentLayout() {
  // Floor 15x12 (appartamento singolo)
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 12),
    new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 })  // Parquet
  );
  floor.rotation.x = -Math.PI / 2;
  addTrackedObject(floor);

  // Muri esterni
  var wallMat = new THREE.MeshStandardMaterial({ color: 0xd4c4aa });
  
  // 4 muri con apertura "finestra" su un lato
  // (simile a warehouse ma più piccolo e con texture diversa)
  
  // Finestra fake (plane con texture cielo)
  var windowMat = new THREE.MeshBasicMaterial({ 
    color: 0x87ceeb, 
    transparent: true, 
    opacity: 0.6 
  });
  var window = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), windowMat);
  window.position.set(7.5, 2, 0);
  window.rotation.y = -Math.PI / 2;
  addTrackedObject(window);
}
```

**Models apartment**:
```javascript
function getApartmentModels() {
  return [
    // Usa interior_free.glb come base (ha già mobili interni)
    { file: "interior_free.glb", pos: [0, 0, -2], rot: 0, scale: 0.4, category: "structure" },
    
    // Divano per riposo
    { file: "old_sofa_free.glb", pos: [-4, 0, 3], rot: Math.PI / 2, scale: 1.2, category: "furniture" },
    
    // Storage box (usa bookshelf come placeholder)
    { file: "dusty_old_bookshelf_free.glb", pos: [5, 0, -4], rot: -Math.PI / 2, scale: 0.8, category: "furniture" },
    
    // Laptop per save point futuro
    { file: "laptop_free.glb", pos: [-3, 0.8, -3], scale: 0.35, category: "usable", id: "laptop_apartment" },
    
    // Letto (usa bench come placeholder)
    { file: "bench_model_free.glb", pos: [4, 0, 4], rot: 0, scale: 1.5, category: "furniture" },
    
    // Decorazioni
    { file: "vintage_tv_free.glb", pos: [-5, 0.6, -3], rot: Math.PI / 2, scale: 0.6, category: "decor" }
  ];
}
```

---

### 3.3 Collegamenti Logici (Narrativa, non fisici)

**Approccio attuale**: Gli ambienti sono **separati logicamente**, non collegati fisicamente. Il player switcha via menu (Settings → Environment).

**Vantaggi**:
- ✅ Semplice da implementare
- ✅ Nessun problema di porte/tunnel
- ✅ Ogni ambiente è autoconsistente
- ✅ Performance: solo 1 ambiente caricato alla volta

**Svantaggi**:
- ❌ Meno immersivo (no esplorazione continua)
- ❌ Richiede menu per switchare

**Approccio futuro** (v2 - opzionale):
Creare ambiente "Urban Hub" che contiene:
- Strada centrale con `road_free.glb`
- 3 edifici: warehouse, bunker entrance, apartment building
- Porte interattive che chiamano `window.setEnvironment(id)` e applicano fade

**Per ora**: Teniamo switch via menu (è già funzionante). Possiamo espandere in v2.

---

### 3.4 Environment "Urban Hub" (Futuro - Opzionale)

Se vuoi un ambiente "hub" che collega tutto:

```javascript
{
  id: "urban-hub",
  label: "Urban Center",
  description: "City center with access to warehouse, bunker, and apartments",
  spawn: { position: [0, 1.7, 0], yaw: 0 },
  lighting: {
    background: 0x87ceeb,
    fog: { color: 0x87ceeb, near: 60, far: 250 },
    ambient: { color: 0xffffff, intensity: 0.5 },
    directional: { color: 0xffffff, intensity: 0.7, position: [80, 80, 80] }
  },
  layout: "urban",
  models: getUrbanHubModels
}

function getUrbanHubModels() {
  return [
    // Strada principale
    { file: "road_free.glb", pos: [0, 0, -20], rot: 0, scale: 1.2, category: "structure" },
    
    // Warehouse a sinistra
    { file: "warehouse_fbx_model_free.glb", pos: [-40, 0, 0], rot: Math.PI / 2, scale: 0.5, category: "structure" },
    { 
      file: "laptop_free.glb",  // Placeholder "door"
      pos: [-30, 0.5, 0], 
      scale: 0.2, 
      category: "usable", 
      id: "door_warehouse",
      switchTo: "warehouse"  // Custom property
    },
    
    // Bunker entrance al centro
    { file: "free_barricade.glb", pos: [0, 0, -40], rot: 0, scale: 1.5, category: "structure" },
    { 
      file: "laptop_free.glb",
      pos: [0, 0.5, -35], 
      scale: 0.2, 
      category: "usable", 
      id: "door_bunker",
      switchTo: "bunker"
    },
    
    // Apartment a destra
    { file: "interior_free.glb", pos: [40, 0, 0], rot: -Math.PI / 2, scale: 0.5, category: "structure" },
    { 
      file: "laptop_free.glb",
      pos: [32, 0.5, 0], 
      scale: 0.2, 
      category: "usable", 
      id: "door_apartment",
      switchTo: "apartment"
    }
  ];
}
```

**Interazione porte**:
```javascript
// In interactions.js
function handleInteract() {
  // ...
  if (target.switchTo) {
    if (confirm("Entrare in " + target.switchTo + "?")) {
      window.setEnvironment(target.switchTo);
      if (window.applySelectedEnvironment) {
        window.applySelectedEnvironment();
      }
    }
    return;
  }
  // ...
}
```

---

## 📅 ROADMAP IMPLEMENTAZIONE (RIVISTA)

### ✅ SPRINT 0: Infrastruttura Environment (COMPLETATO)
- ✅ Environment registry system
- ✅ Environment manager con teardown/apply
- ✅ Menu integration e selector
- ✅ Fade transitions
- ✅ Multi-environment support

### SPRINT 1: Sistema Raccolta (2-3 ore) 🔥 PRIORITÀ ALTA
**Obiettivo**: Premendo E su arma/item usable, va nell'inventario e si può equipaggiare

**Task**:
1. Modificare `interactions.js`:
   - Generalizzare `pickupGun()` → `pickupItem(target)`
   - Sync con `state.playerInventory` (usato da InventoryUI)
   - Rimuovere oggetto da `state.world.interactables`
   - Chiamare `inventoryUI.refresh()` se disponibile
2. Testare raccolta con pistole, spada, cappello esistenti
3. Aggiungere feedback visivo temporaneo (console.log per ora)
4. Verificare che equip da inventario funzioni dopo raccolta

**File da modificare**:
- `scripts/systems/interactions.js` (~50 linee)
- Test manuale: pickup → inventory → equip

**Output**: Pistole raccolte appaiono in inventory grid e si possono equipaggiare

---

### SPRINT 2: Sistema Munizioni (3-4 ore) 🔥 PRIORITÀ ALTA
**Obiettivo**: Armi hanno munizioni limitate, ricarica con R, HUD mostra colpi

**Task**:
1. Aggiungere a `createInitialState()`:
   ```javascript
   player: {
     // ...esistenti
     ammo: { '9mm': 45, '45acp': 24 },
     weaponState: { 
       currentWeapon: null, 
       currentMag: 15, 
       isReloading: false 
     }
   }
   ```
2. Modificare `projectiles.js` - `fireBullet()`:
   - Check `weaponState.currentMag > 0`
   - Decrementa colpi
   - Se 0: play sound "empty click"
3. Aggiungere in `input.js`:
   - Key `R` → `reloadWeapon()`
   - Logica: prendi da `ammo[type]`, riempi `currentMag`
4. Creare HUD munizioni:
   - `<div id="ammo-counter">15 / 45</div>` in `index.html`
   - Update in `update()` loop
5. Opzionale: spawn 2-3 ammo box nel warehouse environment

**File da modificare**:
- `scripts/game.js` (state init)
- `scripts/systems/projectiles.js` (fire logic)
- `scripts/systems/input.js` (reload key)
- `index.html` + `styles/main.css` (HUD)

**Output**: Armi si scaricano, R ricarica, HUD mostra munizioni

---

### SPRINT 3: Nuovi Ambienti (2-3 ore per ambiente)
**Obiettivo**: Creare bunker e appartamento come ambienti switchabili

#### 3A: Ambiente "Bunker" (2-3 ore)
Creare nuovo entry in `scripts/content/environments.js`:

```javascript
{
  id: "bunker",
  label: "Underground Bunker",
  description: "Secure military bunker with weapon storage",
  spawn: { position: [0, 1.7, 8], yaw: Math.PI },
  lighting: {
    background: 0x2a2a2a,  // Dark
    fog: { color: 0x1a1a1a, near: 10, far: 50 },
    ambient: { color: 0xffaa66, intensity: 0.3 },  // Warm emergency lights
    directional: { color: 0xff8844, intensity: 0.5, position: [0, 10, 0] }
  },
  layout: "bunker",
  models: getBunkerModels  // Nuova funzione
}
```

**Layout bunker**:
- Stanza 20x20 chiusa
- 3x weapon rack (spawn punti per armi)
- 4x ammo crate (munizioni)
- 1x crafting table
- Porta "exit" che switcha a warehouse

**Models**: riusa barricade, crates, tools esistenti

#### 3B: Ambiente "Apartment" (2-3 ore)
```javascript
{
  id: "apartment",
  label: "Safe House Apartment",
  description: "Abandoned apartment for storage and rest",
  spawn: { position: [0, 1.7, 5], yaw: 0 },
  lighting: {
    background: 0x4a5568,
    fog: { color: 0x3a4558, near: 15, far: 60 },
    ambient: { color: 0xe0e6ff, intensity: 0.4 },
    directional: { color: 0xffffff, intensity: 0.6, position: [10, 20, 10] }
  },
  layout: "apartment",
  models: getApartmentModels
}
```

**Layout apartment**:
- Usa modello `interior_free.glb` come base
- Aggiungi storage box (salva inventario permanente - futuro)
- Finestra con vista esterna (fake backdrop)
- Letto (sleep = save point - futuro)

**File da creare/modificare**:
- `scripts/content/environments.js` (2 nuove entry)
- Test: switch via menu Settings → Environment dropdown

**Output**: 4 ambienti totali (warehouse, test-range, bunker, apartment)

---

### SPRINT 4: Oggetti Raccoglibili nel Mondo (1-2 ore)
**Obiettivo**: Spawn munizioni e items nei vari ambienti

**Task**:
1. Aggiungere a `getBunkerModels()`:
   ```javascript
   { 
     file: "tools_pack._free.glb",
     pos: [-5, 0.5, -5],
     scale: 0.5,
     category: "usable",
     id: "tools_bunker",
     pickupData: { type: "tool", quantity: 1 }
   }
   ```
2. Creare placeholder per ammo (può essere qualunque modello piccolo):
   ```javascript
   {
     file: "free_barricade.glb",  // Placeholder
     pos: [3, 0.8, -2],
     scale: 0.1,
     category: "usable",
     id: "ammo_9mm_01",
     pickupData: { ammoType: "9mm", quantity: 15 }
   }
   ```
3. Modificare `pickupItem()` per gestire `ammoType`:
   ```javascript
   if (target.pickupData && target.pickupData.ammoType) {
     var type = target.pickupData.ammoType;
     var qty = target.pickupData.quantity || 15;
     state.player.ammo[type] += qty;
     console.log("✅ Munizioni raccolte:", qty, type);
   }
   ```

**File da modificare**:
- `scripts/content/environments.js` (aggiungere spawn)
- `scripts/systems/interactions.js` (gestione ammo pickup)

**Output**: Nel bunker si trovano munizioni, nel warehouse items vari

---

### SPRINT 5: Polish & UX (2-3 ore) - OPZIONALE
1. **Pickup notification** (15 min):
   - Toast temporaneo "✅ Raccolto: Beretta 92FS"
   - Fade out dopo 2 secondi
2. **Sound effects** (30 min):
   - gun_pickup.wav
   - reload.wav
   - empty_click.wav
   - Integra con Web Audio API
3. **HUD migliorato** (30 min):
   - Icona arma attiva
   - Barra salute visuale
   - Indicatore reload (progress bar)
4. **Minimap** (1 ora - OPZIONALE):
   - Canvas 200x200 in alto a destra
   - Dot per player position
   - Ambiente outline
5. **Tutorial prompts** (30 min):
   - First pickup → "Premi TAB per aprire inventario"
   - First empty mag → "Premi R per ricaricare"

**File da creare/modificare**:
- `scripts/ui/notifications.js` (nuovo)
- `scripts/ui/hud.js` (estendere)
- `styles/main.css` (stili notifiche)
- `assets/sounds/*` (download freesound.org)

---

## ⏱️ TEMPO STIMATO TOTALE (Rivisto)

- ✅ Sprint 0: ~6-8 ore (COMPLETATO da pull)
- 🔥 Sprint 1: 2-3 ore (Sistema raccolta)
- 🔥 Sprint 2: 3-4 ore (Munizioni)
- Sprint 3A: 2-3 ore (Bunker)
- Sprint 3B: 2-3 ore (Apartment)
- Sprint 4: 1-2 ore (Spawn items)
- Sprint 5: 2-3 ore (Polish opzionale)

**TOTALE RIMANENTE**: ~12-18 ore (vs 12-17 ore originale)  
**PRIORITÀ IMMEDIATA**: Sprint 1 + 2 (5-7 ore) per gameplay core funzionale

---

## 🎨 ASSET AGGIUNTIVI NECESSARI

### Modelli 3D da cercare (Sketchfab/Poly Pizza):
1. **Ammo box 9mm** - scatola munizioni piccola
2. **Ammo box .45** - scatola munizioni media
3. **Door simple** - porta con frame
4. **Stairs metal** - scala esterna
5. **Trapdoor** - botola pavimento
6. **Weapon rack** - supporto armi a muro
7. **Crate military** - cassa militare
8. **Crafting table** - tavolo da lavoro

### Audio (freesound.org):
1. `gun_pickup.wav` - suono raccolta arma
2. `reload_pistol.wav` - suono ricarica
3. `empty_click.wav` - caricatore vuoto
4. `door_open.wav` - porta che si apre
5. `item_pickup.wav` - raccolta generica

### Icone UI (da creare o trovare):
1. Ammo icons (9mm, .45)
2. Weapon icons (già esistono SVG)
3. Minimap markers

---

## 🐛 PROBLEMI CONOSCIUTI DA RISOLVERE

### 1. Inventory Sync
**Problema**: `state.inventory.items` ≠ `state.playerInventory`  
**Fix**: Unificare in `state.playerInventory` e deprecare `inventory.items`

### 2. Equipment Scale Confusion
**Problema**: Scale mondo ≠ scale equipaggiato (0.025 vs 0.004)  
**Fix**: Documentare chiaro in ItemRegistry con commenti

### 3. Collisioni Mancanti
**Problema**: Si attraversano muri appartamento/bunker  
**Fix**: Aggiungere `collisionObjects` per tutte le strutture

### 4. Camera Frustum
**Problema**: Con mappa 300x300, far culling peggiore  
**Fix**: Aumentare `camera.far = 500` (attualmente 100)

---

## 🎯 DECISIONI CHIAVE & PROSSIMI PASSI

### Decisioni Prese
1. ✅ **Espansione mappa**: Usiamo environment registry (non hardcoded expansion)
2. ✅ **Ambienti separati**: Switch via menu, non porte fisiche (per ora)
3. ✅ **Console debug**: Disabilitata in produzione (vedere `main.js`)
4. 🔄 **Priorità immediata**: Sistema raccolta + munizioni (Sprint 1+2)

### Modifiche dal Piano Originale
- ❌ ~~Espansione pavimento 200→300~~ → Non necessaria con environment switching
- ❌ ~~Sistema porte/tunnel~~ → Sostituito da environment switching
- ✅ **Nuovo**: Infrastruttura environment già completa (Sprint 0)
- ✅ **Nuovo**: 2 ambienti test già disponibili (warehouse, test-range)

### Prossimi Step Immediati (CONSIGLIATI)
1. **Sprint 1**: Sistema raccolta (2-3h)
   - Modificare `interactions.js` per pickup generalizzato
   - Testare con armi/items esistenti
2. **Sprint 2**: Sistema munizioni (3-4h)
   - Aggiungere `state.player.ammo` e `weaponState`
   - Implementare ricarica + HUD
3. **Test completo**: Warehouse con raccolta + munizioni funzionanti
4. **Sprint 3A/3B**: Nuovi ambienti bunker e apartment (opzionale)

### Domande Aperte
- ❓ Vuoi mantenere environment switching via menu o preferisci porte interattive in-game?
- ❓ Priorità su polish (sound, notifiche) o su nuovi ambienti?
- ❓ Serve minimap o è troppo early?

---

## ✅ CHECKLIST FINALE

### Prima di iniziare implementazione:
- [x] Pull da GitHub completato
- [x] Console debug disabilitata
- [x] Piano d'azione rivisto e aggiornato
- [ ] Backup del progetto corrente
- [ ] Creare branch `feature/inventory-munitions`
- [ ] Scaricare asset aggiuntivi se necessari (ammo box models)
- [ ] Testare environment switching esistente (warehouse ↔ test-range)

### Durante sviluppo:
- [ ] Commit frequenti per ogni Sprint
- [ ] Testare dopo ogni modifica (no batch testing)
- [ ] Aggiornare README.md con:
  - Tasto R per ricarica
  - TAB per inventario (già esistente)
  - Environment switching in Settings
- [ ] Documentare nuovi sistemi in MANIFEST.md
- [ ] Aggiornare `.github/copilot-instructions.md` se aggiungi nuovi pattern

### Test finale pre-release:
- [ ] Raccolta armi da terra → inventario → equip
- [ ] Munizioni visibili in HUD
- [ ] Ricarica funzionante (R key)
- [ ] Switch environment senza memory leak
- [ ] No console errors
- [ ] Performance stabile (60 FPS su hardware medio)

---

## 📊 RIEPILOGO TECNICO MODIFICHE RECENTI

### Fix Equipment Visuals (13 Dicembre 2025)
**File**: `scripts/gameplay/equipment-manager.js`

**Modifiche slotConfigs**:
```javascript
'right-hand': {
  position: [0.4, -0.5, -0.35],  // Era: Z -0.5, ora -0.35 (più vicino/visibile)
  rotation: [-0.1, -0.15, 0.05], // Era: X -0.05, Y -0.1
  scale: 2.2                     // Era: 2.0
}

'left-hand': {
  position: [-0.4, -0.5, -0.35],
  rotation: [-0.1, Math.PI + 0.15, -0.05],  // FIX: canna ora punta avanti
  scale: 2.2
}

'head': {
  position: [0, 0.25, 0],        // Era: Y 0.1, ora 0.25 (più alto)
  scale: 0.7,                    // Era: 1.0 (ridotto 30%)
  followCamera: true
}
```

**Risultato**:
- ✅ Pistole più visibili in FPS view
- ✅ Canna mano sinistra orientata correttamente
- ✅ Cappello dimensionato realisticamente e ben posizionato

**Prossimo step**: Testare in-game e aggiustare se necessario basandosi su feedback visivo.

---

## 🎯 ROADMAP VISUALE

```
┌─────────────────────────────────────────────────────────────────┐
│ FASE ATTUALE: Fix Visuale Equipment ✅                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │ Sprint 1 🔥  │ ───> │ Sprint 2 🔥  │ ───> │ Sprint 3-5   │ │
│  │ Pickup Items │      │ Munizioni +  │      │ Nuovi        │ │
│  │ (2-3 ore)    │      │ Ricarica     │      │ Ambienti     │ │
│  │              │      │ (3-4 ore)    │      │ (opzionale)  │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│                                                                 │
│  Deliverable: Inventario funzionante con munizioni finite      │
│  ETA: 5-7 ore totali                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 NOTE DESIGN

### Bilanciamento Munizioni
- **Iniziale**: 45 colpi 9mm, 24 colpi .45
- **Spawn mondo**: 3-4 box per tipo (15 colpi each)
- **Massimo trasportabile**: 150 per tipo
- **Ricarica automatica**: NO (player deve premere R)

### Progressione Spaziale
1. **Indoor (spawn)**: Tutorial, primi oggetti
2. **Garden**: Esplorazione, cervo, risorse
3. **Bunker**: Late-game, armi avanzate
4. **Appartamento**: Safe house, storage permanente

### Economia (futuro)
- Munizioni si possono comprare (futuro: NPC vendor)
- Armi rare si trovano solo nel bunker
- Tools servono per crafting (futuro sistema)
