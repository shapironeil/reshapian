# 📦 ELEMENT CATALOG: Asset Organization System

**Data**: 13 Dicembre 2025  
**Totale Assets**: 21 file GLB + 1 `.glb`

---

## 🎯 SISTEMA DI CATEGORIZZAZIONE

Ogni elemento è categorizzato per **tipo di ambiente** e **funzione in-game**:

```
GARDEN      → Natural elements, outdoor props
HOUSE       → Furniture, indoor comfort, decoration
OFFICE      → Work equipment, desks, professional
WAREHOUSE   → Industrial, storage, fortifications
CHARACTER   → NPCs, player models
WEAPON      → Combat items, equippable
DECOR       → Aesthetic items, world-building
STRUCTURE   → Large buildings, terrain features
```

---

## 📋 COMPLETE ASSET INVENTORY

### 🌳 GARDEN ENVIRONMENT
Elementi per creare giardini, parchi, aree esterne

```javascript
{
  name: "Grass Low-Poly Set",
  file: "grass_free_download.glb",
  size: "0.79 MB",
  type: "decor",
  environment: "GARDEN",
  description: "Repeatable grass patches, clumps, vegetation",
  use_case: "Outdoor ground cover, garden areas, parks",
  scale_suggestion: 1.0-2.0,
  reusable: true,
  count: "5-10 repeats recommended"
}

{
  name: "Stylized Rocks Pack",
  file: "free_pack_-_rocks_stylized.glb",
  size: "1.02 MB",
  type: "decor",
  environment: "GARDEN",
  description: "Multiple rock formations, boulders, stones",
  use_case: "Rocky areas, landscaping, outdoor scatter",
  scale_suggestion: 0.8-1.5,
  reusable: true,
  count: "3-8 variants"
}

{
  name: "Bench Model",
  file: "bench_model_free.glb",
  size: "4.88 MB",
  type: "furniture",
  environment: "GARDEN | PARK",
  description: "Wooden park bench with realistic detail",
  use_case: "Public parks, gardens, rest areas",
  scale_suggestion: 1.0,
  interactable: "Can sit on it (future)",
  detail_level: "High"
}
```

---

### 🏠 HOUSE ENVIRONMENT
Elementi per case residenziali, appartamenti, interni domestici

```javascript
{
  name: "Old Sofa",
  file: "old_sofa_free.glb",
  size: "4.44 MB",
  type: "furniture",
  environment: "HOUSE",
  description: "Classic vintage sofa with realistic wear",
  use_case: "Living rooms, bedrooms, waiting areas",
  scale_suggestion: 1.0-1.5,
  reusable: true,
  count: "3+ recommended for variety",
  detail_level: "High"
}

{
  name: "Vintage TV",
  file: "vintage_tv_free.glb",
  size: "2.87 MB",
  type: "furniture",
  environment: "HOUSE",
  description: "Old CRT television",
  use_case: "Living rooms, entertainment areas",
  scale_suggestion: 0.8-1.0,
  interactable: "Can watch (future)",
  detail_level: "Medium-High"
}

{
  name: "Chocolate Beech Bookshelf",
  file: "chocolate_beech_bookshelf_free.glb",
  size: "2.3 MB",
  type: "furniture",
  environment: "HOUSE | OFFICE",
  description: "Elegant wooden bookshelf with books",
  use_case: "Libraries, studies, bedrooms, offices",
  scale_suggestion: 1.0,
  detail_level: "High"
}

{
  name: "Dusty Old Bookshelf",
  file: "dusty_old_bookshelf_free.glb",
  size: "2.68 MB",
  type: "furniture | decor",
  environment: "HOUSE | WAREHOUSE",
  description: "Worn, dusty bookshelf - aged appearance",
  use_case: "Abandoned areas, old buildings, libraries",
  scale_suggestion: 1.0,
  detail_level: "Medium"
}

{
  name: "Cowboy Hat",
  file: "cowboy_hat_free.glb",
  size: "2.37 MB",
  type: "decor | wearable",
  environment: "HOUSE",
  description: "Classic western cowboy hat",
  use_case: "Decoration, costume piece",
  scale_suggestion: 0.15 (on display), 0.04 (on player)
  equippable: true,
  detail_level: "Medium"
}

{
  name: "Blue Eyeball",
  file: "blue_eyeball_free.glb",
  size: "2.14 MB",
  type: "decor",
  environment: "HOUSE",
  description: "Surreal blue eyeball sculpture/decor",
  use_case: "Bizarre decoration, art installation",
  scale_suggestion: 0.4-0.6,
  detail_level: "Low-Medium"
}

{
  name: "Laptop",
  file: "laptop_free.glb",
  size: "1.58 MB",
  type: "furniture | interactive",
  environment: "HOUSE | OFFICE | WAREHOUSE",
  description: "Modern gaming/work laptop",
  use_case: "Desks, work stations, dark web access",
  scale_suggestion: 0.3-0.4,
  interactable: true,
  interaction: "Access to dark web marketplace, emails, missions",
  detail_level: "Medium-High"
}

{
  name: "Tools Pack",
  file: "tools_pack._free.glb",
  size: "1.7 MB",
  type: "equipment",
  environment: "HOUSE | WAREHOUSE",
  description: "Various hand tools (hammer, wrench, etc.)",
  use_case: "Tool storage, crafting materials, repair",
  scale_suggestion: 0.8-1.0,
  craftable: true,
  detail_level: "Medium"
}

{
  name: "Interior Room (SPECIAL)",
  file: "interior_free.glb",
  size: "1.41 MB",
  type: "structure",
  environment: "HOUSE | OFFICE | APARTMENT",
  description: "Pre-built apartment interior room (walls, floor, furniture)",
  use_case: "WAITING ROOM, base interior, ready-made spaces",
  scale_suggestion: 1.0,
  detail_level: "High - Complete",
  special_note: "⭐ Ottimo per stanza di attesa e test interni"
}
```

---

### 🏢 OFFICE ENVIRONMENT
Elementi per uffici, spazi di lavoro, strutture professionali

```javascript
{
  name: "Bench/Table",
  file: "bench_model_free.glb",  // Reusable
  environment: "OFFICE | HOUSE",
  description: "Works as desk/table in office context",
  use_case: "Office desk, work station",
  scale_suggestion: 1.0,
  detail_level: "High"
}

{
  name: "Laptop",
  file: "laptop_free.glb",  // Reusable
  environment: "OFFICE",
  description: "Office workstation computer",
  use_case: "Desk work, dark web access",
  scale_suggestion: 0.35,
  interactable: true,
  detail_level: "Medium-High"
}

{
  name: "Bookshelves (Both)",
  file: "chocolate_beech_bookshelf_free.glb" | "dusty_old_bookshelf_free.glb",  // Reusable
  environment: "OFFICE",
  description: "Professional library/reference shelves",
  use_case: "Office library, law firm, research center",
  scale_suggestion: 1.0
}
```

---

### 🏭 WAREHOUSE ENVIRONMENT
Elementi per magazzini, strutture industriali, fortini, armerie

```javascript
{
  name: "Warehouse Building (SPECIAL)",
  file: "warehouse_fbx_model_free.glb",
  size: "3.96 MB",
  type: "structure",
  environment: "WAREHOUSE",
  description: "Large industrial warehouse building",
  use_case: "Storage facility, hideout, crime den, test arena",
  scale_suggestion: 0.5,
  detail_level: "High - Complete Structure",
  special_note: "⭐ Ottimo per fortino/hangar e testing"
}

{
  name: "Free Barricade",
  file: "free_barricade.glb",
  size: "15.93 MB",
  type: "structure | defense",
  environment: "WAREHOUSE | COMBAT",
  description: "Large fortification barricade structure",
  use_case: "Military base, fortified position, base defense",
  scale_suggestion: 1.0,
  functional: "Combat cover, base entrance",
  detail_level: "Very High"
}

{
  name: "Tools Pack",
  file: "tools_pack._free.glb",  // Reusable
  environment: "WAREHOUSE",
  description: "Workshop tools",
  use_case: "Crafting area, repair shop"
}

{
  name: "Road/Ground",
  file: "road_free.glb",
  size: "13.87 MB",
  type: "structure",
  environment: "WAREHOUSE | OUTDOOR",
  description: "Paved road with realistic texture",
  use_case: "Road surfaces, warehouse parking, outdoor areas",
  scale_suggestion: 0.7,
  reusable: true,
  detail_level: "High"
}
```

---

### 👥 CHARACTER ENVIRONMENT
Elementi per NPCs, personaggi, player models

```javascript
{
  name: "R.E.P.O. Character",
  file: "r.e.p.o_realistic_character_free_download.glb",
  size: "5.7 MB",
  type: "character",
  environment: "ALL",
  description: "Realistic humanoid character model (robot/cyborg style)",
  use_case: "NPCs, guards, characters, assistants",
  scale_suggestion: 1.0,
  rigged: false,  // Static pose for now
  detail_level: "Very High"
}

{
  name: "Realistic Male Character",
  file: "realistic_male_character.glb",
  size: "19.94 MB",
  type: "character",
  environment: "ALL",
  description: "Photorealistic male character model",
  use_case: "NPCs, companions, enemies, player reference",
  scale_suggestion: 1.0,
  rigged: false,  // Static for now
  detail_level: "Extreme - Photorealistic",
  note: "Large file, use sparingly"
}

{
  name: "Deer",
  file: "deer_demo_free_download.glb",
  size: "5.44 MB",
  type: "character | animal",
  environment: "GARDEN | OUTDOOR",
  description: "Realistic animated deer",
  use_case: "Wildlife, environmental creatures, hunting",
  scale_suggestion: 1.5,
  animated: true,
  detail_level: "High"
}
```

---

### ⚔️ WEAPON ENVIRONMENT
Elementi per armi, equipaggiamento da combattimento

```javascript
{
  name: "Beretta 92FS Pistol",
  file: "beretta_92fs_-_game_ready_-_free.glb",
  size: "3.43 MB",
  type: "weapon",
  environment: "COMBAT",
  description: "Semi-automatic pistol",
  use_case: "Starting weapon, common sidearm",
  scale_suggestion: {
    "on_table": 0.015,
    "in_hand": 0.003,
    "display": 0.01
  },
  equippable: true,
  damage: 25,
  detail_level: "Very High"
}

{
  name: "Pistol 43 Tactical",
  file: "pistol_43_tactical__free_lowpoly.glb",
  size: "2.56 MB",
  type: "weapon",
  environment: "COMBAT",
  description: "Tactical pistol with enhanced stopping power",
  use_case: "Upgraded sidearm, special ops weapon",
  scale_suggestion: {
    "on_table": 0.012,
    "in_hand": 0.0025,
    "display": 0.008
  },
  equippable: true,
  damage: 35,
  detail_level: "High"
}

{
  name: "Paladin Longsword",
  file: "paladin_longsword_free_download.glb",
  size: "8.83 MB",
  type: "weapon",
  environment: "COMBAT",
  description: "Large fantasy/medieval longsword",
  use_case: "Heavy melee weapon, rare drop",
  scale_suggestion: 0.4,
  equippable: true,
  damage: 45,
  detail_level: "Very High"
}
```

---

## 🏗️ ENVIRONMENT DEFINITIONS

Cosa **rende** un ambiente particolare:

### 🌳 GARDEN
**Definisce**:
- Grass patches (grass_free_download.glb)
- Rocks/stones (free_pack_-_rocks_stylized.glb)
- Benches for sitting (bench_model_free.glb)
- Natural lighting (daylight)
- Open sky
- Wildlife optional (deer_demo_free_download.glb)

**Atmosfera**: Open, peaceful, outdoor exploration
**Colore predominante**: Green, brown, sky blue

---

### 🏠 HOUSE
**Definisce**:
- Sofas/seating (old_sofa_free.glb x3)
- TV for entertainment (vintage_tv_free.glb)
- Bookshelves (bookshelf x2)
- Laptops for work (laptop_free.glb)
- Decorations (cowboy_hat, blue_eyeball)
- Tools/equipment (tools_pack._free.glb)
- Cozy lighting (warm, indoor)

**Atmosfera**: Comfortable, personal, private
**Colore predominante**: Warm browns, creams, earth tones

---

### 🏢 OFFICE
**Definisce**:
- Desks/tables (bench_model_free.glb as desk)
- Work laptops (laptop_free.glb)
- Filing shelves (bookshelves as file storage)
- Professional lighting (bright, fluorescent)
- Minimal decoration
- Focus on productivity

**Atmosfera**: Professional, clinical, work-focused
**Colore predominante**: Grays, blacks, minimal colors

---

### 🏭 WAREHOUSE
**Definisce**:
- Large industrial buildings (warehouse_fbx_model_free.glb)
- Fortifications/barriers (free_barricade.glb)
- Roads/paving (road_free.glb)
- Tools scattered (tools_pack._free.glb)
- Harsh industrial lighting
- Spacious interior

**Atmosfera**: Industrial, dangerous, secretive
**Colore predominante**: Steel grays, concrete, dark shadows

---

### 🎭 CRIME DEN / HIDEOUT (HYBRID)
**Definisce**:
- Warehouse base + house comfort
- Barricades at entrance (barricade)
- Hidden interior with sofas (old_sofa)
- Dark web laptop setup
- Weapons on display
- Maps, plans, illegal equipment

**Atmosfera**: Dangerous, organized, covert
**Colore predominante**: Dark blacks, reds, neons

---

## 📊 ASSET USAGE MATRIX

```
                Garden  House  Office  Warehouse  Combat
────────────────────────────────────────────────────────
Grass           ✓✓✓     ✗      ✗       ✓          ✗
Rocks           ✓✓✓     ✗      ✗       ✓          ✗
Bench           ✓✓      ✓      ✓✓      ✓          ✗
Sofa            ✗       ✓✓✓    ✗       ✓          ✗
TV              ✗       ✓✓     ✗       ✓          ✗
Bookshelf       ✗       ✓✓     ✓✓      ✓          ✗
Laptop          ✗       ✓✓     ✓✓✓     ✓          ✗
Cowboy Hat      ✗       ✓      ✗       ✗          ✗
Eyeball         ✗       ✓      ✗       ✗          ✗
Tools           ✗       ✓      ✓       ✓✓✓        ✗
Interior        ✗       ✓✓✓    ✓       ✓          ✗
Warehouse       ✗       ✗      ✗       ✓✓✓        ✗
Barricade       ✗       ✗      ✗       ✓✓✓        ✓✓✓
Road            ✓       ✗      ✗       ✓✓         ✗
Deer            ✓✓✓     ✓      ✗       ✗          ✗
Characters      ✓✓      ✓✓✓    ✓✓      ✓✓         ✓✓✓
Pistols         ✗       ✓✓     ✓       ✓✓         ✓✓✓
Longsword       ✗       ✓      ✗       ✓          ✓✓✓
```

**Legenda**: ✓✓✓ = Essential | ✓✓ = Important | ✓ = Can use

---

## 🔄 REUSABLE ASSETS (Smart Placement)

Questi asset appaiono multipli volte in ambienti diversi:

```javascript
{
  name: "Grass",
  file: "grass_free_download.glb",
  instances: 10,  // Repeat 10 times at different positions
  environments: ["GARDEN", "PARK", "WAREHOUSE_exterior"]
}

{
  name: "Old Sofa",
  file: "old_sofa_free.glb",
  instances: 3-5,  // Multiple sofas in different rooms
  environments: ["HOUSE", "WAREHOUSE_hideout", "OFFICE_waiting"]
}

{
  name: "Bench",
  file: "bench_model_free.glb",
  instances: 2-3,  // As park bench, as desk, as table
  environments: ["GARDEN", "HOUSE", "OFFICE"]
}

{
  name: "Bookshelf",
  file: "chocolate_beech_bookshelf_free.glb" | "dusty_old_bookshelf_free.glb",
  instances: 2+,  // Multiple shelves
  environments: ["HOUSE", "OFFICE", "WAREHOUSE"]
}
```

---

## 📝 NEXT: TUA AGGIUNTA DI ELEMENTI

Quando troverai / scaricherai nuovi modelli GLB:

1. **Nome file**: `descriptive_name_free.glb`
2. **Categoria**: Quale tipo? (furniture, decor, structure, weapon, character)
3. **Ambiente**: Dove lo usare? (GARDEN, HOUSE, OFFICE, WAREHOUSE, COMBAT)
4. **Descrizione**: Cosa è?
5. **Scale**: Suggerito
6. **Reusable**: Può ripetersi multipli volte?

**Manda lista e aggiorno il catalogo!**

---

## 🎯 PROSSIMI PASSI

1. ✅ Categorizzazione complete (OGGI)
2. ⏳ Creare LocationRules per ogni ambiente
3. ⏳ Placement automatico basato su categoria
4. ⏳ Dark web marketplace UI (mostra disponibili items)
5. ⏳ NPC scheduling (noci vivono dove?)

