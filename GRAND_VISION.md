# 🎮 GRAND VISION: Reshapiam Open-World RPG

## 📊 Risultato Finale (Reverse Planning)

Un **open-world dinamico e immersivo** dove il giocatore:
- Vive una **storia emergente** basata su scelte morali e di gameplay
- Costruisce **una proprietà personale** (casa/base con farm, lab, magazzino)
- Guadagna ricchezza attraverso **crimine, lavoro, commercio, estrazione**
- Ha una **reputazione dinamica** che influenza come NPC lo trattano
- Affronta **conseguenze reali** (arresti, fatwa, tradimenti)
- Accumula **potere politico** nel mondo

### Core Loop
1. **Explore** → Scopri locazioni, NPC, opportunità
2. **Choose** → Crimine vs Legalità? Furto vs Lavoro?
3. **Act** → Completa azione (manche, infiltrazione, negoziazione)
4. **Earn** → Denaro, EXP, Reputazione, Items
5. **Consequence** → La reputazione cambia → Nuove opportunità/pericoli
6. **Expand** → Costruisci proprietà, assumi alleati, crea fazione

---

## 🎯 STEP-BY-STEP ROADMAP

### **FASE 1: Fondamenti (Settimane 1-3)**
*Stabilizziamo il motore e la meccanica base*

#### 1.1 Fix Immediate (Oggi/Domani)
- ✅ Fixare bug pistole invisibili
- ✅ Correggere scale di TUTTI i modelli con misure realistiche
- ✅ Implementare registrazione automatica modelli
- **Deliverable**: Pistole visibili e ben dimensionate in prima persona

#### 1.2 Sistema di Input Robusto
- [ ] Keybindings personalizzabili
- [ ] Controller support (Xbox/PS)
- [ ] Gestire conflitti input (es. non sparare mentre negozio)
- **Deliverable**: Tutti i controlli remappabili da UI

#### 1.3 Movement & Combat Solid
- [ ] First-person movement fluid (strafe, sprint, jump, crouch)
- [ ] Sistema di mira (mirino dinamico, FOV, bullet drop)
- [ ] Meccanica di ricarica realistico
- [ ] Animazioni armi (shoot, reload, equip)
- **Deliverable**: Combattimento "snappy" e soddisfacente

---

### **FASE 2: Mondo & Progressione (Settimane 4-6)**
*Creiamo il mondo e il sistema di identità del giocatore*

#### 2.1 Generatore di Spazi 3D Dinamici
- [ ] Sistema di "blocchi costruibili" (room, floor, wall)
- [ ] Libreria di prop (furniture, decorations)
- [ ] Generatore procedurale di case/edifici
- [ ] Editor di locazioni (drag-drop in game)
- **Deliverable**: Creare 5+ edifici unici con UI intuitiva

#### 2.2 Sistema di Statistiche & Reputazione
```
Player Profile:
├─ Attributes (0-100)
│  ├─ Strength (dmg, carry capacity)
│  ├─ Intelligence (hacking, crafting)
│  ├─ Charisma (negotiation, bribery)
│  ├─ Stealth (detection, pickpocket)
│  └─ Luck (critical chance, loot)
├─ Reputation (per faction)
│  ├─ Crimelords: +100 (criminal)
│  ├─ Police: -50 (wanted)
│  ├─ Citizens: +10 (neutral)
│  └─ Rival Gang: -75 (enemy)
├─ Status
│  ├─ Wealth: $1,500
│  ├─ Bounty: $500
│  ├─ Wanted Level: 2 stars
│  └─ Hidden?: No (visible to NPCs)
└─ Playstyle Tags (calcolo automatico)
   ├─ "KINGPIN": >80 crimelord rep + $100k+
   ├─ "COMMANDO": kills >500 + stealth kills
   ├─ "SMUGGLER": successful thefts
   └─ "MILITIA": wanted level >3 stars consistently
```

#### 2.3 Sistema di Conseguenze Dinamiche
- [ ] Polizia patruglia basato su wanted level
- [ ] NPC ricorda le azioni passate (hai tradito? Mi ucciderai?)
- [ ] Fazioni sviluppano ostilità/alleanza nel tempo
- [ ] Arresti → Cella → Possibilità fuga/pagare corruzione
- **Deliverable**: Player choices hanno peso narrativo reale

---

### **FASE 3: Economia & Costruzione (Settimane 7-9)**
*Sistema di denaro, mercato, proprietà*

#### 3.1 Proprietà Personale
- [ ] Casa di partenza (small apartment)
- [ ] Sistema upgrade (expand rooms, add farm, lab, garage)
- [ ] Magazzino per stoccaggio items
- [ ] Visualizzazione real-time (vedi quello che hai costruito)
- **Deliverable**: Player sente proprietà come "home"

#### 3.2 Economia & Marketplace
- [ ] NPC Merchants (compra/vendi items)
- [ ] Marketplace online (giocatori scambiano items)
- [ ] Crafting system (fab, ammo, medicine)
- [ ] Farming system (coltiva crop → vendi)
- **Deliverable**: Multiple income streams

#### 3.3 Missions & Contracts
- [ ] Side missions dagli NPC
- [ ] Dynamic bounties (uccidi/cattura bersaglio)
- [ ] Faction quests (progredire nella gerarchia)
- [ ] Failed contracts → Reputazione -30
- **Deliverable**: 20+ missioni unique

---

### **FASE 4: Avanzate (Settimane 10+)**
*Finitura, polishing, replicabilità*

#### 4.1 NPC AI & Dialogue
- [ ] Dialogue system con choices
- [ ] NPC schedulato (work → home → bar)
- [ ] Memoria emotiva (tu uccidi il suo amico → vendetta)
- [ ] Faction politics (alleati diventano nemici)

#### 4.2 Sistemi Avanzati
- [ ] Hacking (accedi terminal, disarma allarmi)
- [ ] Stealth mechanics (line of sight, alertness)
- [ ] Vehicle system (auto, moto, elicottero)
- [ ] Wanted system (evasione, negoziazione, corruzione)

#### 4.3 Moltiplicatore di Contenuto
- [ ] Procedural generation di edifici
- [ ] Infinite NPC generation
- [ ] Dynamic mission generation
- [ ] World events casuali

---

## 🛠️ DOMANDE CRITICHE PER TE

### Gameplay Vision
1. **Tono narrativo**: Vuoi umorismo dark (GTA), o seriamente grittante (RDR2)? O ibrido?
2. **Difficoltà**: PvP permesso? Friendly fire? Mode creativa vs hardcore?
3. **Permadeath**: Se muori, perdi progresso? O rispawni?

### Economia & Progressione
4. **Grindability**: Quanto lungo deve essere il "early game" (raggiungere $10k)?
5. **Pay-to-win**: Vuoi monetizzazione? (cosmetics only, o gameplay advantages?)
6. **Scaling**: A $1M, il gioco è diverso? (Nomi Blade vs Pauper?)

### Ambiente & Estetica
7. **Ambientazione**: Città moderna? Fantasy? Sci-fi? Cyber-punk?
8. **Dimensioni**: Gigantesco (GTA V = 127 km²) o più raccolta (Skyrim)?
9. **Customizzazione**: Character model, casa, vestiario?

### Multiplayer (Futuro?)
10. **Vision finale**: Solo, co-op locale, o MMO?

---

## 📦 ARCHITETTURA TECNICA

```
game.js (core loop)
├─ world/
│  ├─ world-generator.js (procedural spaces)
│  ├─ location-registry.js (building/interior data)
│  └─ environment-system.js (dynamic lighting, weather)
├─ systems/
│  ├─ progression-system.js (stats, reputation)
│  ├─ economy-system.js (money, items, crafting)
│  ├─ quest-system.js (missions, rewards)
│  └─ consequence-system.js (reactions, enforcement)
├─ npcs/
│  ├─ npc-manager.js
│  ├─ npc-ai.js (decision making)
│  ├─ dialogue-engine.js
│  └─ faction-system.js
├─ gameplay/
│  ├─ property-manager.js (casa, farm, upgrade)
│  ├─ marketplace.js
│  └─ mission-generator.js
└─ ui/
   ├─ character-sheet.js (stats view)
   ├─ property-ui.js (construction)
   └─ reputation-ui.js (faction standings)
```

---

## 🎓 RICERCA NECESSARIA

### Game Design References
- **GTA V**: Dynamic world, star system, mission variety
- **RDR2**: Roleplay depth, consequence, emergent storytelling
- **Skyrim**: Faction politics, player agency, sandbox freedom
- **The Sims/Stardew**: Property management, time loops
- **Black Ops**: Mission variety, difficulty scaling

### Technical Research
- Procedural building generation (Houdini, Substance)
- NPC scheduling algorithms
- Reputation/relationship systems (graph-based)
- Dynamic spawn/despawn for performance

---

## 🚀 IMMEDIATE NEXT STEPS (Prossime 2 ore)
1. ✅ **Fix pistole** + misure realistiche
2. 🔄 **Creare modello dati** per reputazione e statistiche
3. 📐 **Piano tool** per generatore spazi 3D
4. 📋 **Template di una locazione** (casa base) procedurale

---

*Questo documento è il nord della bussola. Ogni feature deve servirla.*
