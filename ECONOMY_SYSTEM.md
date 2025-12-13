# 💰 ECONOMY SYSTEM: Dark Web & Real Money Mechanics

**Vision**: Economia realistica con spese ricorrenti, mercato nero, e conseguenze finanziarie

---

## 📊 PLAYER FINANCIAL STATE

```javascript
player.wallet = {
  cash: 500,           // Denaro liquido (subito disponibile)
  bank: 5000,          // Denaro in conto (sicuro ma richiede accesso)
  netWorth: 5500,      // Total assets value
  
  // Tracking
  totalEarned: 12000,  // Lifetime earnings
  totalSpent: 6500,    // Lifetime spending
  
  // Debt/Liabilities
  debt: 0,             // Must owe to crimelords
  bounty: 0,           // Taglia sulla testa
  
  // Properties
  properties: [
    { id: "house_001", value: 15000, monthly_cost: 50 }
  ]
}
```

---

## 💸 SPESE RICORRENTI (Recurring Costs)

Le spese che devi pagare regolarmente o perdi beni:

### Daily/Weekly Costs

```javascript
{
  "rent": {
    base_cost: 50,           // per day
    trigger: "daily_5am",
    consequence: "evicted if cannot pay",
    can_skip: false          // Obbligatorio
  },
  "food": {
    base_cost: 20,           // per day
    trigger: "every_12h",
    consequence: "health decreases",
    can_skip: true           // Puoi saltare ma sofri
  },
  "phone_bill": {
    base_cost: 10,           // per week
    trigger: "every_monday",
    consequence: "lose contact with NPCs if unpaid",
    can_skip: true           // Non essenziale
  },
  "weapon_maintenance": {
    base_cost: 15,           // per weapon per week
    trigger: "every_3_days",
    consequence: "weapon jams, damage penalty",
    can_skip: true
  },
  "electricity": {
    base_cost: 30,           // per week
    trigger: "every_friday",
    consequence: "house goes dark, suspicious activity logged",
    can_skip: false          // Critical for safety
  }
}
```

### Monthly Costs

```javascript
{
  "property_tax": {
    base_cost: 200,          // per property
    trigger: "1st of month",
    consequence: "property seized if unpaid x2 months",
    can_skip: false
  },
  "insurance": {
    base_cost: 50,           // optional protection
    trigger: "1st of month",
    consequence: "health recovery slower, theft risk higher",
    can_skip: true
  }
}
```

---

## 💵 INCOME SOURCES

Come guadagni denaro:

### Legal Jobs
```javascript
{
  "warehouse_worker": {
    payment: 100,            // per job (2h)
    frequency: "can do 2x per day",
    skill_required: "strength > 40",
    danger: "low",
    bust_probability: "0%"
  },
  "taxi_driver": {
    payment: 80,             // per ride
    frequency: "on-demand",
    skill_required: "driving",
    danger: "low",
    bust_probability: "0%"
  },
  "bounty_hunter": {
    payment: 500,            // per target
    frequency: "3x per week max",
    skill_required: "combat > 50",
    danger: "high",
    bust_probability: "10%",
    requirement: "police_faction reputation > 40"
  }
}
```

### Criminal Activities
```javascript
{
  "robbery": {
    payment: 200,            // per successful theft
    frequency: "1x per day max",
    skill_required: "stealth > 60",
    danger: "extreme",
    bust_probability: "40%",
    consequence: "wanted level +2",
    can_fence: "items at 50% value"
  },
  "drug_dealing": {
    payment: 150,            // per transaction
    frequency: "unlimited",
    skill_required: "charisma > 50",
    danger: "high",
    bust_probability: "15%",
    consequence: "drug_rep increases",
    requirement: "crimelord_faction > 30"
  },
  "hacking": {
    payment: 300,            // per successful hack
    frequency: "2x per week",
    skill_required: "intelligence > 70",
    danger: "medium",
    bust_probability: "5%",
    consequence: "system might trace you",
    requirement: "laptop + internet access"
  },
  "protection_racket": {
    payment: 100,            // per business per week
    frequency: "repeatable",
    skill_required: "strength + charisma > 80",
    danger: "high",
    bust_probability: "20%",
    consequence: "business owner becomes enemy or ally"
  },
  "assassination": {
    payment: 500,            // per target
    frequency: "1x per week max",
    skill_required: "combat > 80 OR stealth > 70",
    danger: "extreme",
    bust_probability: "30%",
    consequence: "wanted level +3, victim's family seeks revenge",
    requirement: "assassin_guild_faction > 50"
  }
}
```

---

## 🌐 DARK WEB MARKETPLACE

Accessed via **Laptop** (laptop_free.glb)

### How It Works

```
1. Open Laptop
2. Press "Open Dark Web"
3. Anonymous marketplace appears
4. Browse listings (bought/sold by NPCs)
5. Make offer (can negotiate price)
6. Transaction happens
7. Items appear in inventory or property
```

### Marketplace Categories

#### A) Weapons & Ammunition
```javascript
{
  "9mm_ammunition": {
    description: "99 rounds of 9mm",
    base_price: 50,
    seller_reputation: "anonymous",
    availability: "always",
    negotiable: true,
    negotiation_range: [40, 70]
  },
  "assault_rifle_ak47": {
    description: "Military-grade assault rifle",
    base_price: 1500,
    seller: "Anonymous Dealer",
    availability: "limited (1 per week)",
    negotiable: true,
    negotiation_range: [1200, 2000]
  },
  "sniper_rifle": {
    description: "Long-range precision rifle",
    base_price: 3000,
    seller: "The Phantom",
    availability: "rare (1 per month)",
    negotiable: true,
    negotiation_range: [2500, 4000]
  },
  "suppressor": {
    description: "Sound suppressor for pistol",
    base_price: 200,
    seller: "TechGuns",
    availability: "always",
    negotiable: false
  },
  "body_armor": {
    description: "Kevlar protection vest",
    base_price: 800,
    seller: "IronSkins",
    availability: "always",
    negotiable: true,
    negotiation_range: [600, 1000]
  },
  "grenades": {
    description: "Pack of 5 explosive grenades",
    base_price: 400,
    seller: "ExplosivesRUs",
    availability: "limited (2 per week)",
    negotiable: true,
    negotiation_range: [350, 500]
  }
}
```

#### B) Drugs & Contraband
```javascript
{
  "cocaine": {
    description: "High-purity white powder",
    base_price: 100,  // per unit
    sellable_for: 150,  // street value
    seller: "Colombiana",
    availability: "always",
    negotiable: true,
    negotiation_range: [80, 150],
    risk: "high - wanted if caught with 10+",
    addiction: "can damage health if stored long"
  },
  "heroin": {
    description: "Opiate powder",
    base_price: 200,  // per unit
    sellable_for: 350,
    seller: "The Supplier",
    availability: "always",
    negotiable: true,
    negotiation_range: [150, 300],
    risk: "extreme - wanted +2 per unit",
    addiction: "highly dangerous"
  },
  "stolen_jewelry": {
    description: "Valuable jewels (hot)",
    base_price: 2000,  // already stolen
    sellable_for: 3000,  // fence value
    seller: "Black Market Fence",
    availability: "always",
    negotiable: true,
    negotiation_range: [1500, 3500],
    risk: "medium - fenced goods tracked"
  }
}
```

#### C) Hacking & Tools
```javascript
{
  "malware_banking": {
    description: "Virus for bank account compromise",
    base_price: 500,
    seller: "CyberCriminal88",
    availability: "limited (1 per week)",
    requirement: "intelligence > 60",
    effect: "Can steal from target's bank account"
  },
  "ddos_botnet": {
    description: "Access to DDoS bot network",
    base_price: 1000,  // rental
    seller: "NetChaos",
    availability: "subscription",
    requirement: "intelligence > 70",
    effect: "Take down websites, create chaos"
  },
  "fake_passport": {
    description: "Forged travel documents",
    base_price: 800,
    seller: "Forgery Inc",
    availability: "limited (3 per month)",
    effect: "Can travel undetected, bypass checkpoints"
  },
  "hacking_software": {
    description: "Professional hacking toolkit",
    base_price: 2000,
    seller: "EliteHackers",
    availability: "always",
    requirement: "intelligence > 80",
    effect: "Unlock computer terminals, safes, doors"
  }
}
```

#### D) Property & Business
```javascript
{
  "safe_house": {
    description: "Hidden apartment in safe location",
    base_price: 10000,
    seller: "RealEstate.onion",
    availability: "2-3 available",
    monthly_cost: 500,
    effect: "Police less likely to find you, hidden from authorities"
  },
  "grow_operation": {
    description: "Pre-built marijuana farm (mobile)",
    base_price: 5000,
    seller: "GreenThumb",
    availability: "1 at a time",
    monthly_income: 500,
    monthly_cost: 100,
    risk: "DEA raids if found"
  },
  "coke_lab": {
    description: "Equipment for drug manufacturing",
    base_price: 8000,
    seller: "ChemLab.dark",
    availability: "rare",
    monthly_income: 2000,
    monthly_cost: 500,
    risk: "extreme - explosion danger"
  }
}
```

#### E) Services & Information
```javascript
{
  "hitman_contract": {
    description: "Contract to kill specific target",
    base_price: 2000,  // varies by target
    seller: "AssassinGuild",
    availability: "custom orders",
    timeframe: "1-7 days",
    completion: "target dies mysteriously",
    consequence: "victim's family seeks revenge"
  },
  "fake_identity": {
    description: "Complete new identity (documents, accounts)",
    base_price: 5000,
    seller: "NewYou.onion",
    availability: "1 per player per game",
    effect: "Start fresh with new reputation, lose old identity",
    consequence: "old enemies don't recognize you (for a time)"
  },
  "blackmail_info": {
    description: "Compromising info on NPC (for leverage)",
    base_price: 1000,
    seller: "Informant",
    availability: "varies",
    effect: "Can blackmail target, force them to do quests"
  },
  "police_corruption": {
    description: "Bribe to clear wanted level once",
    base_price: 2000,  // per wanted star
    seller: "CopBribe.onion",
    availability: "always",
    effect: "Instantly reduce wanted level by 1",
    consequence: "cop becomes corrupted (potential ally)"
  }
}
```

---

## 🎯 MARKETPLACE MECHANICS

### Negotiation System

```javascript
// Player proposes price
player.offerPrice = 300;
npc.askingPrice = 500;
player.charisma = 65;  // 0-100

// Calculate negotiation success
acceptance_chance = (player.charisma / 100) * (player.offerPrice / npc.askingPrice);

if (Math.random() < acceptance_chance) {
  // Deal successful
  transaction(player.offerPrice);
  npc.disposition += 5;  // Better relationship
} else {
  // Deal rejected
  npc.disposition -= 10;  // Angry
  npc.response = "Nice try, but I need better than that.";
}
```

### Seller Reputation

```javascript
{
  reputation: "Reliable",
  success_rate: 95,    // Deals actually happen
  scam_rate: 5         // Rarely scams
}

{
  reputation: "Sketchy",
  success_rate: 70,    // Might not deliver
  scam_rate: 30        // Often scams
}

{
  reputation: "Legendary",
  success_rate: 100,
  scam_rate: 0,
  price_multiplier: 1.5  // More expensive but guaranteed
}
```

---

## 🎪 MERCENARY & JOB BOARD

Accessed via **Dark Web** or **Physical Locations**

### Job Types

```javascript
{
  "elimination": {
    description: "Kill target NPC",
    reward: 500,
    difficulty: "hard",
    time_limit: "7 days",
    consequence: "victim's family will seek revenge"
  },
  "heist": {
    description: "Steal specific item from location",
    reward: 2000,
    difficulty: "very_hard",
    time_limit: "3 days",
    requirement: "stealth > 70",
    consequence: "location owner becomes enemy"
  },
  "extraction": {
    description: "Rescue NPC from danger",
    reward: 1000,
    difficulty: "hard",
    time_limit: "immediate",
    consequence: "rescued NPC becomes ally"
  },
  "courier": {
    description: "Deliver package unseen",
    reward: 300,
    difficulty: "medium",
    time_limit: "1 day",
    consequence: "if caught, wanted +1"
  },
  "investigation": {
    description: "Gather intel on target",
    reward: 500,
    difficulty: "medium",
    time_limit: "3 days",
    consequence: "target might suspect you"
  }
}
```

### Accepting Jobs

```
1. Browse job board (dark web or physical location)
2. Read description, reward, requirements, time limit
3. Accept or decline
4. If accept: Timer starts, must complete in time
5. Complete objective
6. Return for reward OR fail and lose reputation
```

---

## 🏦 BANK & MONEY MANAGEMENT

### Features
```javascript
{
  deposit: {
    purpose: "Store cash safely",
    security: "99%",  // Very safe
    cost: "0%"
  },
  withdraw: {
    purpose: "Get cash from account",
    limit: "no limit",
    time: "instant"
  },
  transfer: {
    purpose: "Send to another player (future multiplayer)",
    fee: "2%",
    time: "1 game day",
    anonymous: false
  },
  loan: {
    purpose: "Borrow money quickly",
    interest: "20% per game week",
    max_amount: "net_worth * 2",
    consequence: "defaulting = crimelords hunt you",
    requirement: "must pay back within 4 weeks"
  }
}
```

---

## 📈 WEALTH PROGRESSION EXAMPLE

### First Hour
```
Start: $500
Work warehouse job (2h): +$100 → $600
Buy food: -$20 → $580
Rent due: -$50 → $530
End: $530 (barely surviving)
```

### First Day
```
Start: $530
Complete 2 jobs: +$200 → $730
Steal item: +$150 → $880
Sell stolen goods: +$200 (50% of value) → $1080
Daily expenses: -$100 → $980
End: $980
```

### First Week
```
Start: $980
Complete heist: +$500 → $1480
Drug deal x3: +$450 → $1930
Get caught (+wanted): -$100 bail → $1830
Weekly expenses: -$400 → $1430
End: $1430
```

### First Month
```
Start: $1430
Establish crime operation: +$1000 → $2430
Buy safe house: -$10000... NEED LOAN
Get loan: +$15000 → $5430
Crime income: +$2000 → $7430
Loan repayment: -$3000 → $4430
Monthly expenses: -$1000 → $3430
End: $3430 (in debt but growing business)
```

---

## ⚠️ FINANCIAL CONSEQUENCES

### Debt
```javascript
{
  borrower: "crimelord",
  amount: 15000,
  interest: "20% per week",
  deadline: "30 days",
  consequence_unpaid: [
    "Kidnapped family member?",
    "Business ransacked",
    "Assassination attempts",
    "Weapons confiscated",
    "Property seized"
  ]
}
```

### Bankruptcy
```javascript
{
  condition: "debt > net_worth + cash",
  consequence: [
    "Lose all property",
    "Bank account frozen",
    "Crimelords hunt you",
    "Starting fresh from $0"
  ]
}
```

### Wanted for Money Laundering
```javascript
{
  trigger: "deposit > $10k in 1 day",
  consequence: [
    "Government investigation",
    "Wanted level +1",
    "Bank account monitored",
    "Suspicious withdrawal blocks"
  ]
}
```

---

## 🎯 NEXT: IMPLEMENTATION CHECKLIST

- [ ] Create `economy-system.js` (core logic)
- [ ] Create `marketplace.js` (dark web interface)
- [ ] Create `job-board.js` (mission system)
- [ ] Create `bank-system.js` (account management)
- [ ] Create `expense-tracker.js` (daily costs)
- [ ] Dark web UI (list items, negotiate, buy)
- [ ] Job board UI (accept missions)
- [ ] Wallet display HUD
- [ ] Bankruptcy system

