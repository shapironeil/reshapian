# Feature: Sistema di Gestione Mondi (Stile Minecraft)

**Data:** 13 dicembre 2025  
**Stato:** Pianificazione  
**Priorità:** Alta  

---

## 🎯 Obiettivo

Creare un sistema di gestione mondi ispirato a Minecraft che permetta ai giocatori di:
- Creare nuovi mondi vuoti o con template predefiniti
- Salvare/caricare mondi diversi
- Modificare liberamente qualsiasi mondo in Architect Mode
- Avere una mappa "originale" read-only come esempio/tutorial

---

## 📋 Problema Attuale

### Bug Identificati
1. **Mappa originale non modificabile**: Gli oggetti caricati da `models.js` non vengono registrati come `placedMeshes` modificabili in Architect Mode
2. **Conflitto persistence**: Il sistema salva su `architectMap` in localStorage, ma non distingue tra mondi diversi
3. **Menu iniziale statico**: "AVVIA GIOCO" carica sempre la stessa mappa, senza opzione di scelta

### Limitazioni Architetturali
- `scripts/content/models.js` contiene dati hardcoded
- Nessuna separazione tra "mappa template" e "mondo salvato"
- Un solo slot di salvataggio globale

---

## 🏗️ Architettura Proposta

### 1. Struttura Dati Mondi

```javascript
// localStorage keys:
// - worldsList: array di world metadata
// - world_<id>: serialized world data
// - currentWorldId: ultimo mondo caricato

// World Metadata
{
  id: "world_123456789",
  name: "Il Mio Mondo",
  createdAt: 1702468800000,
  lastPlayed: 1702555200000,
  template: "empty" | "default" | "survival" | "creative",
  thumbnail: "base64_image_or_url",
  playtime: 3600, // secondi
  stats: {
    objectsPlaced: 45,
    enemies: 3
  }
}

// World Data (serialized)
{
  id: "world_123456789",
  version: "1.0.0",
  objects: [
    {
      file: "old_sofa_free.glb",
      position: { x: 0, y: 0, z: 8 },
      rotation: { x: 0, y: 3.14, z: 0 },
      scale: { x: 1.5, y: 1.5, z: 1.5 },
      collidable: true,
      userData: {}
    }
    // ... altri oggetti
  ],
  playerState: {
    position: { x: 0, y: 1.7, z: 20 },
    inventory: [],
    health: 100
  },
  worldSettings: {
    timeOfDay: "noon",
    weatherEnabled: false
  }
}
```

### 2. Template Mondi

**Empty (Vuoto)**
- Solo ambiente base (pavimento, luci)
- Ideale per costruire da zero

**Default (Originale)**
- Mappa attuale da `models.js` come read-only esempio
- Non modificabile, ma clonabile

**Survival**
- Struttura base + nemici + risorse scarse
- Focus su combattimento e raccolta risorse

**Creative**
- Tutti gli oggetti sbloccati
- Nessun limite, focus su building

### 3. Nuovo Flow Menu

```
Hub Menu
├─ NUOVO MONDO
│  ├─ Scegli Nome
│  ├─ Seleziona Template (empty/default/survival/creative)
│  └─ [CREA]
├─ CARICA MONDO
│  ├─ Lista mondi salvati (card con preview)
│  │  ├─ [GIOCA]
│  │  ├─ [RINOMINA]
│  │  ├─ [DUPLICA]
│  │  └─ [ELIMINA]
│  └─ Ordina per: Data / Nome / Tempo giocato
├─ TUTORIAL (mappa originale read-only)
└─ IMPOSTAZIONI
```

---

## 🔧 Implementazione Step-by-Step

### Phase 1: Refactor Persistence Layer
**Files:** `scripts/systems/world-manager.js` (nuovo)

- [x] Creare modulo `window.RSG.systems.worldManager`
- [x] Implementare `createWorld(name, template)`
- [x] Implementare `saveWorld(worldId, data)`
- [x] Implementare `loadWorld(worldId)`
- [x] Implementare `listWorlds()`
- [x] Implementare `deleteWorld(worldId)`
- [x] Implementare `duplicateWorld(worldId, newName)`

### Phase 2: Template System
**Files:** `scripts/content/world-templates.js` (nuovo)

- [x] Definire `getTemplate(name)` che ritorna array oggetti
- [x] Template "empty": solo environment base
- [x] Template "default": importa da `models.js` attuale
- [x] Template "survival": variante con nemici
- [x] Template "creative": tutti asset sbloccati

### Phase 3: Architect Mode Integration
**Files:** `scripts/ui/architect-mode.js`

- [x] Modificare `loadMap()` per usare `worldManager.loadWorld(currentWorldId)`
- [x] Modificare `saveMap()` per usare `worldManager.saveWorld(currentWorldId, data)`
- [x] Aggiungere flag `isReadOnly` per mondi tutorial
- [x] Registrare **tutti** gli oggetti in scena come `placedMeshes` (fix bug mappa originale)

### Phase 4: UI Menu Mondi
**Files:** `index.html`, `scripts/menu.js`, `styles/main.css`

- [x] Creare `#world-selection-menu` con lista card mondi
- [x] Creare `#create-world-menu` con form nome + template picker
- [x] Aggiungere preview thumbnail (screenshot o icona template)
- [x] Stilizzare card mondi (nome, data, playtime, stats)
- [x] Implementare azioni: Gioca/Rinomina/Duplica/Elimina

### Phase 5: Game Integration
**Files:** `scripts/game.js`

- [x] Al `startGame()`, caricare mondo da `currentWorldId`
- [x] Durante gameplay, salvare periodicamente o su eventi (quit, cambio zona)
- [x] Salvare stato player (posizione, inventario, salute) insieme al mondo
- [x] All'uscita verso menu, salvare mondo corrente

### Phase 6: Polish & Features
- [x] Sistema di backup automatico (ogni N minuti)
- [x] Import/Export mondo come JSON file
- [x] Compressione dati mondi (LZString o simile)
- [x] Thumbnail automatico (canvas screenshot miniatura)
- [x] Validazione dati mondi (versioning, migration)

---

## 🎨 UI/UX Design

### World Selection Screen (esempio mockup ASCII)

```
┌─────────────────────────────────────────────────────┐
│  GESTIONE MONDI                          [X] Chiudi │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [+ NUOVO MONDO]                 [📁 IMPORTA]      │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ [THUMBNAIL]  │  │ [THUMBNAIL]  │  │[THUMB]   │ │
│  │              │  │              │  │          │ │
│  │ Il Mio Mondo │  │ Survival Run │  │Tutorial  │ │
│  │ 2h 15m       │  │ 45m          │  │READ-ONLY │ │
│  │ 12 Dic 2025  │  │ 10 Dic 2025  │  │          │ │
│  │              │  │              │  │          │ │
│  │ [GIOCA]      │  │ [GIOCA]      │  │[GIOCA]   │ │
│  │ [⚙️] [📋] [🗑️]│  │ [⚙️] [📋] [🗑️]│  │          │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                      │
│  Ordina: [📅 Data ▼] [🔤 Nome] [⏱️ Tempo]          │
└─────────────────────────────────────────────────────┘
```

### Create World Screen

```
┌─────────────────────────────────────────┐
│  CREA NUOVO MONDO             [←] Indietro│
├─────────────────────────────────────────┤
│                                          │
│  Nome Mondo:                             │
│  ┌────────────────────────────────────┐ │
│  │ Il Mio Mondo                       │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Scegli Template:                        │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │VUOTO │ │DEFAULT│ │SURVIV│ │CREATE│  │
│  │      │ │       │ │      │ │      │  │
│  │ [ ]  │ │ [✓]   │ │ [ ]  │ │ [ ]  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                          │
│  Template "Default" include:             │
│  • Casa centrale con arredi              │
│  • Robot NPC                             │
│  • Armi e strumenti                      │
│  • Ambiente esterno                      │
│                                          │
│            [CREA MONDO]                  │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing Plan

### Test Case 1: Creazione Mondo
- Creare nuovo mondo vuoto → verificare localStorage
- Creare mondo da template "default" → confrontare con `models.js`
- Creare 5 mondi diversi → verificare lista e metadata

### Test Case 2: Modifica Mondo
- Caricare mondo, entrare Architect Mode
- Piazzare oggetti, salvarli
- Uscire, ricaricare mondo → verificare oggetti persistenti

### Test Case 3: Gestione Mondi
- Rinominare mondo
- Duplicare mondo → verificare copia indipendente
- Eliminare mondo → verificare rimozione da localStorage

### Test Case 4: Mappa Originale Fix
- Caricare mappa "default"
- Entrare Architect Mode
- Selezionare divano da `models.js` → deve essere modificabile
- Modificare scala/posizione → verificare che venga salvato

### Test Case 5: Import/Export
- Esportare mondo come JSON
- Eliminare mondo
- Importare JSON → verificare ripristino completo

---

## 📦 Deliverables

### File Nuovi
- `scripts/systems/world-manager.js` - Core logic gestione mondi
- `scripts/content/world-templates.js` - Template predefiniti
- `features/feature-world-management-system.md` - Questa doc

### File Modificati
- `scripts/ui/architect-mode.js` - Integrazione worldManager
- `scripts/game.js` - Caricamento mondo in startGame
- `scripts/menu.js` - Nuovi menu gestione mondi
- `index.html` - Nuove schermate UI
- `styles/main.css` - Stili world cards e menu

---

## 🚀 Rollout Plan

### Milestone 1: Core System (3-4 giorni)
- Implementare worldManager
- Implementare template system
- Fix bug mappa originale in Architect Mode

### Milestone 2: UI Mondi (2-3 giorni)
- Creare menu selezione mondi
- Creare menu creazione mondo
- Integrare con game.js

### Milestone 3: Polish (1-2 giorni)
- Thumbnail automatici
- Import/Export
- Testing completo

### Milestone 4: Documentazione (1 giorno)
- README aggiornato
- Guide utente
- Video demo

---

## 🔄 Migration Strategy

### Backward Compatibility
1. Al primo avvio post-update, rilevare se esiste `architectMap` in localStorage
2. Se esiste, creare automaticamente mondo "Il Mio Mondo Legacy" con quei dati
3. Migrare metadata (`architectMapMeta`) nel nuovo formato
4. Pulire vecchie key dopo migrazione riuscita

### Codice Migrazione (pseudocodice)
```javascript
function migrateOldData() {
  var oldMap = localStorage.getItem("architectMap");
  if (!oldMap) return;
  
  var worldId = "world_legacy_" + Date.now();
  var newWorld = {
    id: worldId,
    name: "Il Mio Mondo Legacy",
    createdAt: Date.now(),
    lastPlayed: Date.now(),
    template: "custom",
    objects: JSON.parse(oldMap)
  };
  
  worldManager.saveWorld(worldId, newWorld);
  worldManager.setCurrentWorld(worldId);
  
  localStorage.removeItem("architectMap");
  localStorage.removeItem("architectMapMeta");
  
  console.log("✅ Migrazione completata: mondo legacy salvato come " + worldId);
}
```

---

## 💡 Future Enhancements

### Post-MVP
- **Multiplayer Worlds**: Condividi mondi via cloud/P2P
- **World Generator**: Generazione procedurale terreni
- **Modding Support**: Carica asset custom da cartella locale
- **World Themes**: Presets visivi (fantasy, sci-fi, horror)
- **Version Control**: Restore punti precedenti (undo tree)
- **Performance**: Chunk loading per mondi grandi
- **Backup Cloud**: Sync automatico su server

---

## 🐛 Known Issues & Limitations

### Limitazioni Tecniche
- **Storage Limit**: localStorage max ~5-10MB per origin
  - **Soluzione**: Implementare compressione LZString
  - **Fallback**: Warning quando si avvicina al limite
- **No Asset Streaming**: Tutti i modelli GLB devono esistere in `models/`
  - **Soluzione**: Sistema di download on-demand (future)
- **Single-Thread**: Salvataggio/caricamento blocca game loop
  - **Soluzione**: Implementare Web Workers (future)

### Edge Cases
- Cosa succede se un modello GLB viene rimosso dalla cartella `models/`?
  - **Soluzione**: Fallback a placeholder cube + log warning
- Cosa succede se due mondi hanno lo stesso nome?
  - **Soluzione**: Aggiungere suffisso numerico automatico

---

## 📖 API Reference (Preview)

### worldManager Module

```javascript
// Crea nuovo mondo
worldManager.createWorld(name, templateName) 
  // Returns: worldId

// Salva mondo corrente
worldManager.saveWorld(worldId, worldData)
  // Returns: boolean success

// Carica mondo
worldManager.loadWorld(worldId)
  // Returns: worldData object

// Lista tutti i mondi
worldManager.listWorlds()
  // Returns: array of metadata

// Elimina mondo
worldManager.deleteWorld(worldId)
  // Returns: boolean success

// Duplica mondo
worldManager.duplicateWorld(worldId, newName)
  // Returns: new worldId

// Esporta mondo come JSON
worldManager.exportWorld(worldId)
  // Returns: JSON string

// Importa mondo da JSON
worldManager.importWorld(jsonString)
  // Returns: new worldId

// Ottiene mondo corrente
worldManager.getCurrentWorld()
  // Returns: worldId

// Imposta mondo corrente
worldManager.setCurrentWorld(worldId)
  // Returns: void
```

---

## ✅ Definition of Done

La feature è considerata completa quando:

- [x] Utente può creare nuovi mondi da template
- [x] Utente può caricare/salvare mondi diversi
- [x] Tutti gli oggetti in scena sono modificabili in Architect Mode
- [x] Menu gestione mondi è funzionale e intuitivo
- [x] Migrazione automatica da vecchio sistema funziona
- [x] Test plan eseguito con successo
- [x] Documentazione aggiornata
- [x] Nessuna regressione su funzionalità esistenti

---

## 👥 Stakeholder Sign-Off

- [ ] Developer: _______________________
- [ ] Designer: _______________________  
- [ ] QA Tester: _______________________
- [ ] Product Owner: _______________________

---

**Note Finali:**  
Questa feature trasforma radicalmente l'esperienza utente, passando da un gioco con mappa fissa a un sandbox completo stile Minecraft. Richiede refactoring significativo ma mantiene backward compatibility. Priorità alta per allineamento con vision long-term del progetto.
