# Istruzioni Copilot per Shappa Games (Electron + Three.js)

Queste linee guida servono per rendere gli agent AI subito produttivi in questo repo.

## Panoramica & Architettura

- App **desktop Electron** che carica un **gioco 3D single‑page** in **Three.js r128**.
- **Vision a lungo termine**: open-world RPG dinamico con progressione del player, reputazione, economia e generazione procedurale di spazi (vedi [GRAND_VISION.md](GRAND_VISION.md)).
- Entry point principali:
  - [main.js](main.js): processo principale Electron. Crea una finestra `BrowserWindow` (1280×720) e carica `index.html`.
  - [index.html](index.html): pagina root con menu hub, selezione gioco, impostazioni e contenitore del gioco (`#game-canvas`).
  - [scripts/game.js](scripts/game.js): orchestrator centrale. Crea stato di gioco (`window.RSG.state.current`), inizializza sistemi modulari, gestisce animation loop.
  - [scripts/menu.js](scripts/menu.js): gestione menu DOM e impostazioni; collega i pulsanti a `startGame` / `stopGame` e alle funzioni di setting.
- Tutti i modelli 3D sono **locali** in `models/` e caricati via `GLTFLoader` con path tipo `models/nome-modello.glb`.
- Librerie di terze parti **vendorizzate**:
  - `assets/libs/three.min.js`
  - `assets/libs/GLTFLoader.js` (+ versione `.mjs`, da trattare come codice esterno).

### Architettura Modulare (NUOVO)

Il codice è stato ristrutturato in moduli ES5 (compatibili browser) organizzati per responsabilità:

- **`window.RSG` namespace globale**:
  - `window.RSG.state.current`: stato centralizzato del gioco (engine, input, player, ui, inventory, world, combat)
  - `window.RSG.systems.*`: sistemi di gameplay (`input`, `movement`, `interactions`, `projectiles`, `model-loader`, `ai`)
  - `window.RSG.content.*`: dati di contenuto (`models` - definizioni modelli 3D)
  - `window.RSG.gameplay.*`: meccaniche di gioco (`weapons`, `equipment-manager`, `inventory`)
  - `window.RSG.ui.*`: moduli UI (`hud`, `pc`, `dialogue`)

**Pattern di modulo tipico** (IIFE con namespacing):
```javascript
window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function() {
  var ctx = null;
  
  function init(opts) {
    ctx = { state: opts.state, getCamera: opts.getCamera, /* ... */ };
  }
  
  function update(delta) { /* logica frame */ }
  
  window.RSG.systems.moduleName = { init, update };
})();
```

**Quando estendi il codebase**:
- Usa il namespace `window.RSG.*` appropriato
- I moduli sono stateless: ricevono dipendenze in `init()` e non usano variabili globali dirette
- [scripts/game.js](scripts/game.js) orchestra tutto: chiama `init()` sui moduli all'avvio e `update()` nell'animation loop

## Come Avviare & Fare Debug

- Dal root del progetto:
  - `npm install` (una volta sola, se servono le dipendenze).
  - `npm start` (o `npm run dev`) esegue `electron .` e apre la finestra del gioco.
- Su Windows è disponibile `AVVIA_GIOCO.bat` come launcher rapido (fa in pratica la stessa cosa).
- In `main.js` è attivo `mainWindow.webContents.openDevTools();` per aprire automaticamente i DevTools:
  - Se lo cambi, aggiorna anche il `README.md` e lascia un modo semplice per riattivare il debug.
- Il rendering Three.js avviene dentro il `div` `#game-canvas` in `#game-container`; il resto dell’UI (menu, overlay PC, dialoghi, prompt) è HTML/CSS standard.

## Pattern & Convenzioni Principali

### API di Gioco Globale
- `window.startGame()` e `window.stopGame()` sono definite in [scripts/game.js](scripts/game.js) e chiamate da [scripts/menu.js](scripts/menu.js).
- Se aggiungi nuove azioni globali (es. `updateMouseSensitivity`, `togglePause`), esponile su `window` e controlla sempre con `typeof window.fn === 'function'` prima di chiamarle.

### Stato di Gioco Centralizzato
- `window.RSG.state.current` è la singola source of truth:
  - `state.engine`: scene, camera, renderer, isGameRunning
  - `state.input`: moveForward, moveBackward, moveLeft, moveRight
  - `state.player`: velocity, hasGun, heldWeapon, health
  - `state.ui`: isUsingPC, isInDialogue, isInventoryOpen
  - `state.world`: models, interactables, collisionObjects, bullets
  - `state.inventory` + `state.playerInventory`: oggetti e equipment
- Ricreato a ogni `startGame()` con `createInitialState()`.

### Caricamento Modelli 3D
- **Dati**: [scripts/content/models.js](scripts/content/models.js) definisce lista con `{ file, pos, rot, scale, category, area, id }`
- **Loader**: [scripts/systems/model-loader.js](scripts/systems/model-loader.js) carica i `.glb` e popola `state.world.*`
- **ItemRegistry**: [scripts/data/item-registry.js](scripts/data/item-registry.js) contiene metadata per equipment (stats, rarità)
- Quando aggiungi modelli: entry in [models.js](scripts/content/models.js), usa `category: "usable"` per interattivi, aggiorna [DOWNLOAD_MODELS.md](models/DOWNLOAD_MODELS.md)

### Sistema di Equipment 3D (NUOVO)
- **EquipmentManager** ([scripts/gameplay/equipment-manager.js](scripts/gameplay/equipment-manager.js)): renderizza oggetti in prima persona con `slotConfigs` per posizionamento FPS (armi scale 2.0x viewmodel, tavola 0.008-0.025)
- **InventoryUI** ([scripts/ui/inventory-ui.js](scripts/ui/inventory-ui.js)): layout 3 colonne (body + grid + stats), drag & drop, toggle con TAB
- **Bug risolto**: scale pistole (0.0007 → 0.008), offset mani corretti

### Sistemi di Gameplay
- **Movement** ([scripts/systems/movement.js](scripts/systems/movement.js)): cinematica WASD + gravità
- **Interactions** ([scripts/systems/interactions.js](scripts/systems/interactions.js)): raycast oggetti, routing PC/dialogo
- **Projectiles** ([scripts/systems/projectiles.js](scripts/systems/projectiles.js)): proiettili, hit detection
- **Input** ([scripts/systems/input.js](scripts/systems/input.js)): keyboard/mouse, pointer lock
- Pattern: `init(opts)` + `update(delta)` + `dispose()`

### Setup Ambiente 3D
- `initThreeJS()` in [game.js](scripts/game.js): crea scene, camera, renderer, luci
- `createEnvironment()`: pavimento 200×200, muri capannone, area casa centrale
- Stile: `var` globals, no bundler/ESM

### Interazioni & Prompt
- Oggetti interattivi: `state.world.interactables`, distanza `INTERACT_DISTANCE`
- Prompt: mirino `#crosshair`, `#interact-prompt` ("E"), `#shoot-prompt` ("Q")
- Overlay: `#pc-screen`, `#dialogue-ui`, `#inventory-panel` gestiti da [scripts/ui/](scripts/ui/)

### Combattimento
- Proiettili: `state.world.bullets`, bersagli: `staticTargets`, `movingAnimals`
- Costanti: `GRAVITY`, `MOVE_SPEED`, `BULLET_SPEED`, `BULLET_MAX_DISTANCE` in [game.js](scripts/game.js)
- **Riusa costanti esistenti** invece di crearne nuove

## DOM, Menu & Stili

- Struttura HTML principale (`index.html`):
  - `#hub-menu`: menu principale con pulsanti `#start-game-btn`, `#select-game-btn`.
  - `#game-container`: contiene `#game-canvas`, pulsante `#back-menu-btn` (“MENU”), overlay PC (`#pc-screen`), UI dialogo (`#dialogue-ui`), mirino e prompt.
  - `#select-game-menu`: lista giochi (per ora un solo gioco 3D).
  - `#settings-menu`: impostazioni (sensibilità mouse, volume, qualità grafica).
- `scripts/menu.js`:
  - Ascolta i click sui pulsanti menu e mostra/nasconde i container (`hubMenu`, `gameContainer`, `selectGameMenu`, `settingsMenu`).
  - Quando entra nel gioco chiama `startGame`, quando esce chiama `stopGame` (se disponibili).
  - Per le impostazioni, aggiorna il valore in UI e chiama, se esiste, la funzione globale corrispondente (es. `updateMouseSensitivity`).
- `styles/main.css`:
  - Look "dark fantasy" dell'hub (`#hub-menu` con immagine `assets/images/reshapiam.png`)
  - **Riusa classi esistenti** quando possibile (`.menu-btn`, `.pc-*`, `.dialogue-*`, `.interact-prompt`, `.inventory-*`) per coerenza
  - Z‑index: canvas sotto → mirino/prompt → overlay PC/dialogo/inventory sopra tutto

## Vincoli Specifici del Progetto

- **100% OFFLINE**:
  - Non usare CDN, chiamate HTTP o asset remoti: tutto deve vivere in `assets/`, `models/` o file locali.
  - Usa sempre `assets/libs/three.min.js` e `assets/libs/GLTFLoader.js`; evita `import` ESM o pacchetti npm extra di Three/loader.
- **Sicurezza Electron**:
  - In `main.js` i `webPreferences` hanno `nodeIntegration: false` e `contextIsolation: true`.
  - Nel renderer (`index.html` + `scripts/`) **non** usare `require()` o API Node; scrivi solo JS compatibile browser.
  - Nuove feature lato renderer vanno aggiunte come `<script src="...">` in `index.html`.
- **Performance**:
  - L’ambiente è grande e contiene molti modelli; per nuovi `.glb` segui i requisiti di `models/DOWNLOAD_MODELS.md`:
    - max ~5MB per file, max ~50k triangoli, texture embeddate.
  - Evita logica pesante dentro i cicli dell’animazione Three.js se non strettamente necessario.

## Punti di Estensione Consigliati

- **Nuovi oggetti interattivi**:
  - Aggiungi entry in [scripts/content/models.js](scripts/content/models.js) con `id` univoco e `category: "usable"`
  - Gestisci comportamento in [scripts/systems/interactions.js](scripts/systems/interactions.js) usando l'`id`
  - Per oggetti equipaggiabili, aggiungi metadata in [item-registry.js](scripts/data/item-registry.js)
- **Nuove impostazioni**:
  - Aggiungi controllo in `#settings-menu` (slider/select) in [index.html](index.html)
  - In [scripts/menu.js](scripts/menu.js) ascolta l'`input/change` e chiama funzione globale
  - Implementa funzione in [scripts/game.js](scripts/game.js) seguendo pattern `updateMouseSensitivity`
- **Nuovi sistemi di gameplay**:
  - Crea modulo in `scripts/systems/` o `scripts/gameplay/` con pattern IIFE + namespace `window.RSG.*`
  - Esporta `init(opts)` e `update(delta)`, chiama da [scripts/game.js](scripts/game.js) orchestrator
  - Accedi a `state` passato in `init()`, non usare globals diretti

## Librerie di Terze Parti

- Considera `assets/libs/three.min.js` e `assets/libs/GLTFLoader*.js/.mjs` come **codice esterno**:
  - Non modificarli se non strettamente necessario.
  - Se devi farlo, mantieni le modifiche minime e commentale chiaramente con `// CUSTOM: motivo`.
