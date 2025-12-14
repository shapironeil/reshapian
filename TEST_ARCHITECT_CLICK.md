# Test Architect Mode Click

## Log attesi quando premi F2 e poi SHIFT+Click su oggetto:

```
✅ Architect event listeners registrati {keydown: true, mousedown: true, ...}
🟣 Architect setActive {active: true}
[Architect] onMouseDown evento ricevuto {isActive: true, target: "CANVAS", ...}
[Architect] onMouseDown - isMouseMode: true
[Architect] onMouseDown - mouse mode attivo, picking...
[Architect] tryPickAt {clientX: ..., clientY: ...}
[Architect] pointer NDC: 0.xx 0.yy
[Architect] raycast hits: X
  Hit 0 : {name: ..., sourceFile: "cowboy_hat_free.glb", ...}
[Architect] Root trovato: {name: ..., sourceFile: "cowboy_hat_free.glb"}
```

## Se NON appare `[Architect] onMouseDown evento ricevuto`:
- I click NON arrivano alla funzione
- Possibile causa: altro listener sta catturando l'evento prima
- Soluzione: verifica altri mousedown listeners nel codice

## Se appare ma `isMouseMode: false`:
- SHIFT non setta lo stato correttamente
- Verifica `state.ui.isMouseMode` in input.js

## Se appare ma `raycast hits: 0`:
- Il raycast non colpisce nulla
- Verifica coordinate NDC e posizione camera/oggetti
