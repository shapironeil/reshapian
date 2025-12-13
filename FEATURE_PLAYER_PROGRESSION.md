# ⭐ FEATURE: Sistema di Progressione Dinamica del Giocatore

## Obiettivo
Creare un sistema dove **le azioni del giocatore plasmano la sua identità in-game**, generando conseguenze narrative e meccaniche.

---

## 📊 MODELLO DATI: Player Profile

```javascript
{
  // === ATTRIBUTES (Skill base) ===
  attributes: {
    strength: {
      value: 50,        // 0-100
      affects: ["melee_damage", "carry_capacity", "punch_break"],
      from_actions: ["kill_melee", "carry_heavy", "punch_wall"]
    },
    dexterity: {
      value: 50,
      affects: ["accuracy", "fire_rate", "pickpocket"],
      from_actions: ["shoot_precision", "pickpocket_success", "dodge"]
    },
    intelligence: {
      value: 50,
      affects: ["hacking", "crafting_quality", "npc_dialogue_charisma"],
      from_actions: ["hack_terminal", "craft_item", "dialog_special"]
    },
    stealth: {
      value: 50,
      affects: ["detection_range", "backstab_multiplier", "lockpick_speed"],
      from_actions: ["crouch_movement", "kill_undetected", "lockpick_success"]
    },
    charisma: {
      value: 50,
      affects: ["dialogue_options", "bribe_cost", "faction_reputation_gain"],
      from_actions: ["persuade_npc", "bribe_guard", "complete_mission"]
    },
    luck: {
      value: 50,
      affects: ["loot_rarity", "critical_hit_chance", "rare_encounter_rate"],
      from_actions: ["find_rare_item", "critical_hit", "survive_explosion"]
    }
  },

  // === REPUTATION (Faction Standing) ===
  reputation: {
    "faction_crimelords": {
      value: 0,      // -100 to +100
      level: "unknown",  // unknown → associate → soldier → lieutenant → boss
      traits: ["criminal", "wanted"],
      benefits: [
        { level: "associate", unlock: "black_market_shop" },
        { level: "soldier", unlock: "heist_missions" },
        { level: "lieutenant", unlock: "drug_empire_start" }
      ]
    },
    "faction_police": {
      value: 0,
      level: "unknown",
      traits: [],
      benefits: []
      // Mutually exclusive with crimelords
    },
    "faction_militia": {
      value: 0,
      level: "recruit",
      traits: ["paramilitary"],
      benefits: [
        { level: "sergeant", unlock: "squad_backup" },
        { level: "captain", unlock: "military_gear" }
      ]
    },
    "faction_merchants": {
      value: 0,
      level: "customer",
      traits: ["trader"],
      benefits: [
        { level: "supplier", unlock: "wholesale_prices" }
      ]
    }
  },

  // === STATUS & CONSEQUENCES ===
  status: {
    wealth: 0,                      // denaro
    bounty: 0,                      // taglia sulla testa
    wanted_level: 0,                // 0-5 stars (5 = kill on sight)
    arrest_count: 0,                // quante volte arrestato
    total_kills: 0,                 // vittime
    civilian_kills: 0,              // innocenti uccisi
    consecutive_crimes: 0,          // quanti crimini di fila
    hidden: false,                  // è ricercato?
    alive_status: "free",           // free, jailed, dead, fugitive
    last_arrest_date: null,         // quando è stato arrestato l'ultima volta
  },

  // === PLAYSTYLE TAGS (Calculated) ===
  playstyle: {
    "KINGPIN": {
      active: false,
      condition: "crimelords_rep > 80 AND wealth > 100000",
      bonus_damage: 1.1,
      npc_reactions: "fear, deference"
    },
    "COMMANDO": {
      active: false,
      condition: "kills > 500 AND stealth_kills / total_kills > 0.6",
      bonus_accuracy: 1.15,
      npc_reactions: "respect, caution"
    },
    "SMUGGLER": {
      active: false,
      condition: "successful_thefts > 50 AND merchants_rep > 60",
      unlock: "hidden_routes",
      npc_reactions: "business-like"
    },
    "GHOST": {
      active: false,
      condition: "stealth_kills > total_kills * 0.8",
      unlock: "silent_takedown_animations",
      npc_reactions: "paranoid"
    },
    "MARTYR": {
      active: false,
      condition: "civilian_kills > 100 AND wanted_level >= 4",
      penalty_dialogue: true,
      consequence: "some_factions_wont_hire"
    },
    "LIBERATOR": {
      active: false,
      condition: "police_rep > 70 AND arrested_criminals > 20",
      unlock: "police_missions",
      npc_reactions: "grateful, trusting"
    }
  },

  // === PROGRESSION HISTORY ===
  history: [
    { timestamp: 0, event: "game_start", attribute: "all", delta: 0 },
    { timestamp: 1200, event: "kill_civilian", attribute: "charisma", delta: -5 },
    { timestamp: 2400, event: "complete_heist", attribute: "dexterity", delta: +10 },
    { timestamp: 3600, event: "join_faction_crimelords", attribute: "crimelords_rep", delta: +30 }
  ]
}
```

---

## 🔄 ACTION → CONSEQUENCE LOOP

### Example: Player uccide un civile

```
ACTION: player.kill(npc)
  ↓
EVENT: "murder_civilian"
  ↓
SYSTEM UPDATES:
  1. Charisma: -5
  2. Wanted Level: +1 (ora ricercato dalla polizia)
  3. Civilian_kills: +1
  4. Bounty: +$1000
  5. ALL friendly factions: -20 reputation
  6. Police faction: MARK AS ENEMY
  ↓
NPC REACTIONS:
  - Witnesses: chiama polizia, fuggi area
  - Victim's friends: vendetta personal quest
  - Police: hot pursuit
  ↓
NARRATIVE CONSEQUENCE:
  - Radio news: "Wanted for murder of [NAME]"
  - NPC dialogue changes: "You're a killer... stay away"
  - Certain missions unavailable: "We don't work with murderers"
  ↓
PLAYSTYLE CHECK:
  - If civilian_kills > 100: "MARTYR" tag activated
  - Unlock: Dark dialogue options ("kill them all")
  - Some factions permanently close
```

---

## 💭 CONSEQUENCE TREE: Wanted Level System

```
⭐ Level 0: Unknown
  → No one cares
  → Free to roam
  → Can access all missions

⭐ Level 1: Suspicious
  → Police recognize you
  → Avoid police zones
  → Police questions you: "Got a problem with you, stay out of trouble"

⭐⭐ Level 2: Wanted
  → $500 bounty
  → Police pursue on sight
  → Option: Pay bribe ($2000) → Level 1

⭐⭐⭐ Level 3: Dangerous Criminal
  → $5000 bounty
  → Police shoot on sight
  → Bounty hunters spawning
  → Can't enter police stations
  → Option: Hide in safehouse 24h → escape

⭐⭐⭐⭐ Level 4: Most Wanted
  → $50k bounty
  → Military gets involved (if you enter their zones)
  → Betrayal: Some allies might turn on you for reward
  → Option: Flee to another city

⭐⭐⭐⭐⭐ Level 5: Kill on Sight
  → $500k bounty
  → Helicopter pursuits
  → Everyone shoots on sight
  → Arrest = GAME OVER or jailed with consequences
  → Option: Complete MAJOR heist to bribe officials
```

---

## 🎭 NPC MEMORY SYSTEM

### NPCs ricordano le tue azioni

```javascript
class NPC {
  constructor(name) {
    this.name = name;
    this.memory = [
      // { event: "player_betrayed_me", date: 1500, impact: "hostile" }
      // { event: "player_saved_my_life", date: 2000, impact: "grateful" }
    ];
  }

  updateDialogue(playerProfile) {
    // Controlla memory
    const betrayal = this.memory.find(m => m.event === "betrayed");
    const saved = this.memory.find(m => m.event === "saved");

    if (betrayal) {
      return "You... you LEFT me to die! I trusted you!"; // HOSTILE
    } else if (saved) {
      return "Thank you again, friend. Always grateful."; // FRIENDLY
    } else {
      return "Hey, what's up?"; // NEUTRAL
    }
  }

  onPlayerAction(action, impact) {
    if (action === "player_kills_my_friend") {
      this.memory.push({
        event: "friend_killed",
        date: gameTime,
        impact: "vendetta" // personal quest created
      });
      this.state = "hostile"; // attack on sight
    }
  }
}
```

---

## 🎯 ARREST & CONSEQUENCE MECHANICS

### What happens when arrested?

```
Stage 1: APPREHENDED
  → Weapons confiscated (kept in police locker)
  → Wanted level = 0 (temporarily)
  → Player in jail cell

Stage 2: INTERROGATION
  → NPC detective asks questions
  → Player choices:
    a) Confess → shorter sentence
    b) Stay silent → longer sentence
    c) Bribe detective (costs $5000+) → released
    d) Wait for ally jailbreak → free!

Stage 3: SENTENCE
  → Light crimes: 24h in-game time
  → Murder: 72h
  → Major heist: 7 days
  → Can speed-up paying ($10k+)

Stage 4: RELEASE / ESCAPE
  → Items returned
  → Wanted level resets
  → BUT reputation damage permanent
  → Enemies know you're out

Stage 5: CONSEQUENCES
  → If arrested 5+ times: "Serial offender" tag
  → If police rep > 50: Can be released early
  → If criminal rep > 50: Can bribe guards for early release
  → Crew abandons you if jailed too much ("unreliable")
```

---

## 📈 PROGRESSION MILESTONES

### Early Game (0-100k wealth)
- [ ] Learn combat basics
- [ ] Join first faction
- [ ] Get wanted level 1-2
- [ ] Experience first consequence (arrest or betrayal)

### Mid Game (100k-1M wealth)
- [ ] Choose main faction path (crime vs law)
- [ ] Unlock faction-specific missions
- [ ] Build property (farm, lab)
- [ ] Experience full wanted system

### Late Game (1M+ wealth)
- [ ] Become faction leader or rival
- [ ] Political influence (control zones)
- [ ] Betrayals and revenge cycles
- [ ] Endgame: Takeover vs arrest

---

## 🔧 IMPLEMENTATION: PlayerProgressionSystem

```javascript
class PlayerProgressionSystem {
  constructor(gameState) {
    this.state = gameState;
    this.eventLog = [];
  }

  onAction(actionType, details) {
    // actionType: "kill", "steal", "dialog", "craft", etc.
    // details: { targetId, amount, location, factionId, etc. }

    const consequence = this.resolveConsequence(actionType, details);
    this.applyConsequence(consequence);
    this.eventLog.push(consequence);

    // Check for new playstyle tags
    this.updatePlaystyleTags();

    // Notify NPCs
    this.notifyNPCs(consequence);

    // Check for game-changing events (arrest, betrayal)
    this.checkMilestones(consequence);
  }

  resolveConsequence(actionType, details) {
    // Lookup consequence table
    const table = {
      "kill_civilian": {
        wanted_level: +1,
        charisma: -5,
        bounty: +1000,
        reputation_change: { all: -20, police: -50 }
      },
      "complete_heist": {
        wealth: +50000,
        dexterity: +10,
        reputation_change: { crimelords: +30 }
      },
      // ... more
    };
    return table[actionType] || {};
  }

  applyConsequence(consequence) {
    if (consequence.wanted_level) {
      this.state.player.wanted_level += consequence.wanted_level;
      // Cap at 5
      this.state.player.wanted_level = Math.min(5, this.state.player.wanted_level);

      // Trigger police spawning if > 0
      if (this.state.player.wanted_level > 0) {
        spawnPoliceUnits(this.state.player.wanted_level);
      }
    }

    if (consequence.reputation_change) {
      Object.entries(consequence.reputation_change).forEach(([faction, delta]) => {
        this.state.reputation[faction].value += delta;
      });
    }

    // ... apply other consequences
  }

  updatePlaystyleTags() {
    const profile = this.state;

    // Check each tag
    profile.playstyle.KINGPIN.active = 
      profile.reputation.faction_crimelords.value > 80 && 
      profile.status.wealth > 100000;

    profile.playstyle.COMMANDO.active = 
      profile.status.total_kills > 500 && 
      (profile.status.total_kills - profile.status.civilian_kills) / profile.status.total_kills > 0.6;

    // ... check others
  }

  notifyNPCs(consequence) {
    // Ogni NPC riceve notifica dell'azione
    // Se ti riconoscono, aggiornano memoria
    npcManager.getAllNPCs().forEach(npc => {
      npc.onPlayerAction(consequence);
    });
  }

  checkMilestones(consequence) {
    if (this.state.player.wanted_level >= 3) {
      // Trigger police radio: "Suspect is armed and dangerous"
      gameAudio.play("police_alert");
    }

    if (this.state.status.civilian_kills > 100) {
      // Unlock MARTYR playstyle
      this.state.playstyle.MARTYR.active = true;
      showNotification("You are now a MARTYR to your cause");
    }
  }
}
```

---

## 🤔 DOMANDE PER TE

### Narrativa & Conseguenze
1. **Redemption**: Un giocatore criminale può diventare "buono"? 
   - Opzione A: Sì, perdere tutta la reputazione criminale
   - Opzione B: No, scelte permanenti
   - Opzione C: Sì, ma con costo alto (missione speciale)

2. **Permadeath**: Un giocatore può "finire male"? 
   - Opzione A: Sempre respawna
   - Opzione B: Game over dopo 5 arresti
   - Opzione C: Creative mode / hardcore mode

### Economia & Scala
3. **Wealth scaling**: Il gioco è facile quando ricco?
   - Come bilanci il fatto che $100k rende le difficoltà triviali?
   - Introduce "luxury tax" o "maintenance costs"?

4. **Fazioni**: Quante fazioni vuoi?
   - Minimo 3-5 per creare conflitto?
   - Massimo? (gestione complexity)

### Gameplay Loop
5. **Missione generazione**: 
   - Vuoi missioni hardcoded + procedurali?
   - NPC genera missione al momento ("Kill that guy for $500")?

---

## 📋 FILES DA CREARE

```
scripts/systems/
├─ progression-system.js (core)
├─ reputation-system.js (faction standing)
├─ consequence-engine.js (action → result)
├─ npc-memory.js (NPC reactions)
├─ arrest-system.js (jail mechanics)
└─ playstyle-tags.js (KINGPIN, COMMANDO, etc.)

scripts/ui/
├─ character-sheet-ui.js (view stats)
├─ reputation-ui.js (faction standings)
└─ wanted-level-hud.js (stars)

data/
├─ consequences.json (action → change table)
├─ factions.json (faction definitions)
└─ playstyle-tags.json (tag conditions)
```

---

## 🚀 NEXT: Quale parte vuoi implementare per primo?

A) **PlayerProgressionSystem core** (30 min, basic structure)
B) **ReputationSystem** (1 hour, faction mechanics)
C) **ConsequenceEngine** (1.5 hours, full action resolution)
D) **NPC Memory** (1 hour, dialogue reactions)

Quale priorità?

