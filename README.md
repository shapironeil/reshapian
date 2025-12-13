# Shappa Games - Gioco 3D

## 🎮 APPLICAZIONE DESKTOP CON ELECTRON
✅ App desktop nativa con Electron
✅ Tutte le risorse sono in locale - nessuna connessione internet richiesta!
✅ Ambiente virtuale ENORME 500x500 unità pronto per i tuoi oggetti 3D
✅ Finestra 1280x720 come un vero gioco

## Come Avviare il Gioco
### Metodo 1: Launcher Automatico (CONSIGLIATO)
- **Doppio click su `AVVIA_GIOCO.bat`** - Apre l'app desktop Electron

### Metodo 2: Da terminale
```bash
npm start
```
2. Dal menu principale puoi:
   - **AVVIA GIOCO** - Inizia l'esplorazione 3D
   - **SELEZIONA GIOCO** - Scegli tra i giochi disponibili
   - **IMPOSTAZIONI** - Modifica sensibilità mouse, volume e qualità grafica

## Controlli di Gioco
- **W/↑** - Muovi avanti
- **S/↓** - Muovi indietro
- **A/←** - Muovi a sinistra
- **D/→** - Muovi a destra
- **Mouse** - Guarda intorno (clicca sul canvas per bloccare il cursore)
- **Pulsante MENU** - Torna al menu principale

## Struttura del Progetto
```
Shappa Games/
├── AVVIA_GIOCO.bat           # Launcher principale (Electron)
├── main.js                   # File principale Electron
├── package.json              # Configurazione Node.js/Electron
├── index.html                # File principale del gioco
├── node_modules/             # Dipendenze (generato automaticamente)
├── models/                   # I tuoi 21 modelli 3D (.glb/.gltf)
├── scripts/
│   ├── game.js               # Logica del gioco 3D
│   └── menu.js               # Gestione menu
├── styles/
│   └── main.css              # Stili grafici
└── assets/
    └── libs/                 # Librerie JavaScript
        ├── three.min.js      # ✅ OFFLINE
        └── GLTFLoader.js     # ✅ OFFLINE
```

## 🌍 Ambiente Virtuale
- **Dimensioni**: 500x500 unità (ENORME!)
- **Griglia visibile** per orientamento
- **21 modelli 3D** caricati automaticamente:
  - 2 personaggi realistici
  - 1 cervo
  - 2 pistole e 1 spada
  - Mobili vari (panche, divani, librerie, TV, laptop)
  - Elementi ambiente (warehouse, barricata, strada, erba, rocce)
  - Accessori (cappello cowboy, occhio blu, attrezzi)
- **Pronto per aggiungere altri modelli 3D**

## Come Aggiungere Modelli 3D
1. Copia i file `.glb` o `.gltf` nella cartella `models/`
2. Modifica la funzione `loadModels()` in `scripts/game.js`
3. Esempio:
```javascript
loader.load(
    'models/tuo-modello.glb',
    function (gltf) {
        const model = gltf.scene;
        model.position.set(0, 0, -10);
        scene.add(model);
    }
);
```

## Tecnologie Utilizzate
- **Electron** - Framework per app desktop (✅ LOCALE)
- **Three.js r128** - Rendering 3D (✅ LOCALE in assets/libs/)
- **GLTFLoader** - Caricamento modelli 3D (✅ LOCALE in assets/libs/)
- **HTML5/CSS3** - Interfaccia e menu
- **JavaScript** - Logica di gioco
- **Node.js** - Runtime per Electron

## Note
- ✅ **100% OFFLINE** - funziona senza internet!
- ✅ **App Desktop Nativa** con Electron
- Finestra dedicata 1280x720 pixel
- Per modelli 3D complessi, assicurati che siano ottimizzati
- L'ambiente è enorme (500x500) per ospitare molti oggetti!
- Tutti i 21 modelli 3D vengono caricati automaticamente all'avvio
