# Istruzioni Copilot per Shappa Games (Electron + Three.js)

Queste linee guida servono per rendere gli agent AI subito produttivi in questo repo.

## Panoramica & Architettura

- App **desktop Electron** che carica un **gioco 3D single‑page** in **Three.js r128**.
- Entry point principali:
  - `main.js`: processo principale Electron. Crea una finestra `BrowserWindow` (1280×720) e carica `index.html`.
  - `index.html`: pagina root con menu hub, selezione gioco, impostazioni e contenitore del gioco (`#game-canvas`).
  - `scripts/game.js`: logica 3D (scena, camera, movimento player, fisica base, caricamento modelli, interazioni, sparo, dialoghi).
  - `scripts/menu.js`: gestione menu DOM e impostazioni; collega i pulsanti a `startGame` / `stopGame` e alle funzioni di setting.
- Tutti i modelli 3D sono **locali** in `models/` e caricati via `GLTFLoader` con path tipo `models/nome-modello.glb`.
- Librerie di terze parti **vendorizzate**:
  - `assets/libs/three.min.js`
  - `assets/libs/GLTFLoader.js` (+ versione `.mjs`, da trattare come codice esterno).

## Come Avviare & Fare Debug

- Dal root del progetto:
  - `npm install` (una volta sola, se servono le dipendenze).
  - `npm start` (o `npm run dev`) esegue `electron .` e apre la finestra del gioco.
- Su Windows è disponibile `AVVIA_GIOCO.bat` come launcher rapido (fa in pratica la stessa cosa).
- In `main.js` è attivo `mainWindow.webContents.openDevTools();` per aprire automaticamente i DevTools:
  - Se lo cambi, aggiorna anche il `README.md` e lascia un modo semplice per riattivare il debug.
- Il rendering Three.js avviene dentro il `div` `#game-canvas` in `#game-container`; il resto dell’UI (menu, overlay PC, dialoghi, prompt) è HTML/CSS standard.

## Pattern & Convenzioni Principali

- **API di gioco globale** (usata dai menu):
  - `window.startGame()` e `window.stopGame()` sono definite in `scripts/game.js` e chiamate da `scripts/menu.js`.
  - Se aggiungi nuove azioni globali (es. `updateMouseSensitivity`, `togglePause`), esponile su `window` e controlla sempre con `typeof window.fn === 'function'` prima di chiamarle (stile già usato in `menu.js`).
- **Setup dell’ambiente 3D** (`scripts/game.js`):
  - `initThreeJS()` crea `scene`, `camera` in prima persona, `renderer`, luci principali e chiama `setupControls()`.
  - `createEnvironment()` imposta:
    - pavimento grande (circa 200×200) con griglia di riferimento,
    - muri perimetrali del “capannone”,
    - area casa centrale con pavimento in legno, muri più bassi, tavolo ecc.
  - Mantieni lo stile esistente: variabili globali con `var` in alto, funzioni dichiarate nello stesso file, niente bundler/ESM.
- **Caricamento modelli & asset**:
  - `loadModels()` è il punto unico dove vengono registrati i modelli da `models/` (posizioni, rotazioni, scale, categorie).
  - Ogni entry tipica ha: `file`, `pos: [x,y,z]`, `rot`, `scale` e opzionalmente `category`, `area`, `id`.
  - Gli oggetti interattivi usano un `id` dedicato (es. `pc_laptop`, `pistol_beretta`) che viene poi gestito nella logica di interazione.
  - Se aggiungi/modifichi il set “ufficiale” di modelli, aggiorna anche `models/DOWNLOAD_MODELS.md` (lista, requisiti tecnici, checklist).
- **Sistema di interazione & prompt**:
  - Gli oggetti interattivi sono tracciati in `interactables` (in `game.js`); la distanza di interazione usa la costante `INTERACT_DISTANCE`.
  - Il gioco mostra:
    - mirino `#crosshair` al centro,
    - `#interact-prompt` (“E - Interagisci”) quando sei vicino a un oggetto usabile,
    - `#shoot-prompt` (“Q - Spara”) quando hai un’arma.
  - Gli overlay PC (`#pc-screen`) e dialogo (`#dialogue-ui`) vengono aperti/chiusi da `game.js` tramite `document.getElementById(...).style.display = ...`.
- **Sparo & animali/bersagli**:
  - Proiettili, bersagli statici e animali in movimento sono gestiti con gli array globali `bullets`, `staticTargets`, `movingAnimals`.
  - Le principali costanti di fisica/armi sono definite in alto in `game.js`:
    - `GRAVITY`, `MOVE_SPEED`, `BULLET_SPEED`, `BULLET_MAX_DISTANCE`, ecc.
  - Quando estendi il sistema di combattimento, **riusa queste costanti** e gli array esistenti invece di crearne di nuovi in giro.

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
  - Definisce il look “dark fantasy” dell’hub (`#hub-menu` con immagine `assets/images/reshapiam.png`) e lo stile dei pulsanti (`.menu-btn`, `.back-btn`, `.game-item-btn`).
  - Per nuovi elementi UI, **riusa classi esistenti** quando possibile (es. `.menu-btn`, `.pc-*`, `.dialogue-*`, `.interact-prompt`) per coerenza visiva.
  - Z‑index importante:
    - canvas di gioco sotto,
    - mirino e prompt sopra il canvas,
    - overlay PC e dialogo sopra tutto (vedi `.pc-screen`, `.dialogue-ui`).

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
  - Aggiungi la definizione in `loadModels()` con un `id` univoco e `category: "usable"` (o simile).
  - Gestisci il comportamento in `handleInteract()` (o funzioni collegate) usando quell’`id`.
  - Se serve, aggiungi elementi UI dedicati in `index.html` e stili in `styles/main.css`.
- **Nuove impostazioni**:
  - Aggiungi un nuovo controllo in `#settings-menu` (slider/select).
  - In `scripts/menu.js` ascolta l’`input/change` e chiama una nuova funzione globale (es. `updateGraphicsQuality`).
  - Implementa quella funzione in `scripts/game.js` seguendo il pattern di `updateMouseSensitivity`.

## Librerie di Terze Parti

- Considera `assets/libs/three.min.js` e `assets/libs/GLTFLoader*.js/.mjs` come **codice esterno**:
  - Non modificarli se non strettamente necessario.
  - Se devi farlo, mantieni le modifiche minime e commentale chiaramente con `// CUSTOM: motivo`.
