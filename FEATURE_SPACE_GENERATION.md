# 🏗️ FEATURE: Sistema di Generazione Spazi 3D

## Obiettivo
Permettere la **generazione dinamica di edifici, case e locazioni** usando un sistema modulare di blocchi, prop e regole composizionali.

---

## 📐 ARCHITETTURA

### Tier 1: Building Blocks (Componenti Atomici)
Elementi base riusabili:

```javascript
{
  // Floor/Wall segments
  "floor_square_5x5": { 
    model: "blocks/floor_square_5x5.glb",
    size: [5, 0.2, 5],
    type: "floor",
    walkable: true
  },
  "wall_segment_5m": {
    model: "blocks/wall_5m.glb",
    size: [5, 3, 0.3],
    type: "wall",
    collidable: true,
    canHaveWindows: true
  },
  "wall_corner": {
    model: "blocks/wall_corner.glb",
    size: [5, 3, 5],
    type: "wall",
    collidable: true
  },
  "ceiling_flat": {
    model: "blocks/ceiling_flat.glb",
    size: [5, 0.2, 5],
    type: "ceiling"
  }
}
```

**Vantaggi:**
- ✅ Riuso massimo
- ✅ Performance (cache meshes)
- ✅ Easy to place procedurally

**Da Creare:**
- [ ] Blocchi di pavimento (legno, cemento, tile, prato)
- [ ] Blocchi di muro (mattone, intonaco, legno)
- [ ] Colonne, archi, porte/finestre
- [ ] Gradini, rampe

---

### Tier 2: Placement Rules (Regole di Posizionamento)
Logica di composizione:

```javascript
{
  "house_small_rule": {
    // Dimensioni scena
    size: { width: 10, depth: 12, height: 3 },
    
    // Blueprint:  Quale blocco va dove
    blueprint: [
      { block: "floor_square_5x5", pos: [0, 0, 0] },
      { block: "floor_square_5x5", pos: [5, 0, 0] },
      { block: "wall_segment_5m", pos: [0, 0, 0] },
      { block: "wall_segment_5m", pos: [0, 0, 5] },
      // ... perimetro completo
      { block: "ceiling_flat", pos: [0, 2.8, 0] },
      { block: "ceiling_flat", pos: [5, 2.8, 0] }
    ],
    
    // Zone designate per prop placement
    zones: [
      { name: "living_area", bounds: [[0, 0], [5, 5]], furniture: ["sofa", "table"] },
      { name: "kitchen", bounds: [[5, 0], [10, 5]], furniture: ["stove", "fridge", "counter"] },
      { name: "bedroom", bounds: [[0, 5], [10, 12]], furniture: ["bed", "nightstand"] }
    ]
  }
}
```

---

### Tier 3: Prop Registry (Arredamento & Decorazione)
Oggetti da mettere dentro:

```javascript
{
  "sofa": { 
    model: "props/old_sofa_free.glb", 
    size: [2.5, 1, 1],
    placement: "floor",
    rotation: "any"
  },
  "table_dining": {
    model: "props/table.glb",
    size: [1.5, 0.7, 1.5],
    placement: "floor",
    rotation: "axis_y" // can rotate around Y
  },
  "painting_large": {
    model: "props/painting.glb",
    size: [1.2, 1.2, 0.1],
    placement: "wall",
    rotation: "none"
  },
  "rug_carpet": {
    model: "props/rug.glb",
    size: [3, 0.02, 2],
    placement: "floor",
    rotation: "any"
  }
}
```

**Utilizziamo i modelli esistenti in `assets/`:**
```
✅ old_sofa_free.glb
✅ vintage_tv_free.glb
✅ laptop_free.glb
✅ bench_model_free.glb
✅ interior_free.glb (può essere scomposto?)
🔲 [Create] table_dining.glb
🔲 [Create] shelves.glb
🔲 [Create] bed.glb
```

---

### Tier 4: Location Generator
Funzione principale che orchestra tutto:

```javascript
class LocationGenerator {
  constructor() {
    this.rules = {};        // buildingRules
    this.props = {};        // propRegistry
    this.cache = {};        // cached models
  }

  generateLocation(ruleId, position = [0, 0, 0], options = {}) {
    // 1. Get rule
    const rule = this.rules[ruleId];
    if (!rule) throw new Error(`Rule not found: ${ruleId}`);

    // 2. Create scene container
    const location = new THREE.Group();
    location.position.set(...position);
    
    // 3. Place building blocks (struttura)
    this._placeBlocks(location, rule.blueprint);

    // 4. Place props (arredamento) with randomization
    this._placeProps(location, rule.zones, options);

    // 5. Apply post-processing (lights, decals)
    this._applyLighting(location, rule);

    return location;
  }

  _placeBlocks(container, blueprint) {
    blueprint.forEach(item => {
      const { block, pos, rot = [0, 0, 0] } = item;
      const blockDef = this.blocks[block];
      
      const mesh = this.cache[block] || this._loadBlock(block);
      const clone = mesh.clone();
      
      clone.position.set(...pos);
      clone.rotation.set(...rot);
      
      container.add(clone);
    });
  }

  _placeProps(container, zones, options) {
    zones.forEach(zone => {
      zone.furniture.forEach(propId => {
        // Random pos within zone bounds
        const x = Math.random() * (zone.bounds[1][0] - zone.bounds[0][0]) + zone.bounds[0][0];
        const z = Math.random() * (zone.bounds[1][1] - zone.bounds[0][1]) + zone.bounds[0][1];

        const propDef = this.props[propId];
        const mesh = this.cache[propId] || this._loadProp(propId);
        const clone = mesh.clone();

        clone.position.set(x, 0.2, z);
        if (propDef.rotation === "any") {
          clone.rotation.y = Math.random() * Math.PI * 2;
        }

        container.add(clone);
      });
    });
  }

  _applyLighting(container, rule) {
    const light = new THREE.PointLight(0xffffff, 0.8);
    light.position.set(rule.size.width / 2, rule.size.height, rule.size.depth / 2);
    container.add(light);
  }
}
```

---

## 🎯 WORKFLOW DI UTILIZZO

### Step 1: Definire una locazione (con editor visuale)

```javascript
// Nel game, durante il caricamento:
const locationGen = new LocationGenerator();

// Registra règle e prop
locationGen.registerRule("house_small", HOUSE_SMALL_RULE);
locationGen.registerProps(PROP_REGISTRY);

// Genera la casa base del giocatore
const playerHome = locationGen.generateLocation(
  "house_small",
  [0, 0, 0],
  { 
    randomizeFurniture: true,
    luxuryLevel: 0.3  // 0 = basic, 1 = deluxe
  }
);

scene.add(playerHome);
```

### Step 2: Editor di locazioni in-game (UI)

```html
<!-- Aggiungere alla index.html -->
<div id="location-editor-panel" style="display:none">
  <h3>Location Editor</h3>
  
  <div id="block-palette">
    <button data-block="floor_square_5x5">Floor</button>
    <button data-block="wall_segment_5m">Wall</button>
    <button data-block="wall_corner">Corner</button>
    <button data-block="door_frame">Door</button>
  </div>

  <div id="prop-palette">
    <button data-prop="sofa">Sofa</button>
    <button data-prop="table_dining">Table</button>
    <button data-prop="bed">Bed</button>
  </div>

  <div id="canvas-grid">
    <!-- Grid overlay per drag-drop -->
  </div>
</div>
```

### Step 3: Salvataggio / Caricamento locazioni

```javascript
// Serializzazione
function serializeLocation(locationGroup) {
  return {
    rule: "house_small",
    blocks: /* array delle posizioni blocchi */,
    props: /* array delle posizioni prop */
  };
}

// Persistenza
localStorage.setItem("player_home_layout", JSON.stringify(serialized));

// Reload
const saved = JSON.parse(localStorage.getItem("player_home_layout"));
const home = locationGen.generateFromSerialized(saved);
```

---

## 🔧 IMPLEMENTATION ROADMAP

### Phase A: Foundation (2 hours)
1. [ ] Creare 5-10 blocchi di base (floor, wall, ceiling)
2. [ ] Implementare `LocationGenerator` core
3. [ ] Testare con una casa semplice 10x10

**Test Output:** Una casa renderizzata correttamente 

### Phase B: Content (4 hours)
4. [ ] Aggiungere 10+ prop dai modelli existenti
5. [ ] Creare 3 location rules (small_house, apartment, warehouse)
6. [ ] Sistema randomizzazione furniture

**Test Output:** 3 locazioni diverse, generate in <500ms

### Phase C: Editor (3 hours)
7. [ ] UI drag-drop per placement blocchi
8. [ ] Real-time preview
9. [ ] Save/load locazioni

**Test Output:** Player può editare la sua casa e salvare

---

## 🤔 DOMANDE PER TE

1. **Creazione blocchi**: Che tool usi? (Blender, Sketchup, Houdini?) Mi serve sapere per creare i GLB corretti
2. **Complessità**: Le case devono essere:
   - Semplici (5-10 stanze)?
   - Complesse (20+ stanze, multi-floor)?
   - Modulari (aggiungi room-by-room)?
3. **Randomizzazione**: Vuoi:
   - Sempre uguale (stessa house layout)?
   - Semi-random (same structure, different furniture)?
   - Fully procedural?
4. **Multiplayer**: Gli altri giocatori vedono la tua casa? O è privata?

---

## 📝 File da Creare

```
scripts/systems/
├─ location-generator.js (core logic)
├─ building-blocks.js (block registry)
├─ prop-registry.js (furniture db)
└─ location-rules.js (blueprints)

models/blocks/
├─ floor_square_5x5.glb
├─ wall_segment_5m.glb
├─ wall_corner.glb
├─ ceiling_flat.glb
├─ door_frame.glb
└─ ... (altri)

scripts/ui/
├─ location-editor-ui.js (drag-drop interface)
└─ property-customization.js (personal home)
```

---

## 🎬 NEXT: Crea il file `location-generator.js` base?

Oppure prima cerchiamo i modelli 3D adatti e creiamo i blocchi?

