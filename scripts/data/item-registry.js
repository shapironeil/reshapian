/**
 * item-registry.js - Item Configuration & Model Registry
 * Defines all available items, their properties, and associated 3D models
 */

var ItemRegistry = {
  items: {
    'pistol_beretta': {
      id: 'pistol_beretta',
      name: 'Beretta 92FS',
      type: 'weapon',
      rarity: 'common',
      damage: 25,
      weight: 1.0,
      description: 'Semi-automatic pistol. Reliable and accurate.',
      modelFile: 'models/beretta_92fs_-_game_ready_-_free.glb',
      preferredSlots: ['right-hand', 'left-hand'],
      icon: 'assets/thumbnails/pistol_beretta.svg'
    },
    'pistol_43': {
      id: 'pistol_43',
      name: 'Tactical Pistol',
      type: 'weapon',
      rarity: 'uncommon',
      damage: 35,
      weight: 1.2,
      description: 'Powerful tactical pistol with excellent stopping power.',
      modelFile: 'models/pistol_43_tactical__free_lowpoly.glb',
      preferredSlots: ['right-hand', 'left-hand'],
      icon: 'assets/thumbnails/pistol_43.svg'
    },
    'helmet_tactical': {
      id: 'helmet_tactical',
      name: 'Cowboy Hat',
      type: 'armor',
      rarity: 'uncommon',
      defense: 15,
      weight: 1.5,
      description: 'Classic protective headgear.',
      modelFile: 'models/cowboy_hat_free.glb',
      preferredSlots: ['head'],
      icon: 'assets/thumbnails/helmet_tactical.svg'
    },
    'sword_longsword': {
      id: 'sword_longsword',
      name: 'Paladin Longsword',
      type: 'weapon',
      rarity: 'rare',
      damage: 45,
      weight: 2.5,
      description: 'A masterfully crafted longsword with excellent balance.',
      modelFile: 'models/paladin_longsword_free_download.glb',
      preferredSlots: ['right-hand', 'left-hand', 'back'],
      icon: 'assets/thumbnails/sword_longsword.svg'
    },
    'laptop': {
      id: 'laptop',
      name: 'Gaming Laptop',
      type: 'accessory',
      rarity: 'uncommon',
      weight: 2.0,
      capacity: 50,
      description: 'High-performance portable computer.',
      modelFile: 'models/laptop_free.glb',
      preferredSlots: ['back'],
      icon: 'assets/thumbnails/backpack_tactical.svg'
    },
    'barricade': {
      id: 'barricade',
      name: 'Barricade',
      type: 'defense',
      rarity: 'rare',
      defense: 20,
      weight: 5.0,
      description: 'Sturdy barricade for protection.',
      modelFile: 'models/free_barricade.glb',
      preferredSlots: ['back'],
      icon: 'assets/thumbnails/boots_combat.svg'
    },
    'grenade_frag': {
      id: 'grenade_frag',
      name: 'Fragmentation Grenade',
      type: 'consumable',
      rarity: 'uncommon',
      damage: 50,
      weight: 0.5,
      description: 'Standard fragmentation grenade.',
      modelFile: 'models/free_barricade.glb',
      preferredSlots: ['left-hand', 'right-hand'],
      icon: 'assets/thumbnails/grenade_frag.svg'
    }
  },

  /**
   * Get item data by ID
   */
  getItem: function(itemId) {
    return this.items[itemId] || null;
  },

  /**
   * Get all items
   */
  getAllItems: function() {
    return Object.values(this.items);
  },

  /**
   * Register all models with EquipmentManager
   */
  registerAllModels: function(equipmentManager) {
    const scaleOverrides = {
      // Pistols: FPS STANDARD viewmodel size (works with 2.0x slot scale)
      pistol_beretta: 0.004,  // Base scale * 2.0 slot = visible FPS-style weapon
      pistol_43: 0.0035,      // Base scale * 2.0 slot = visible FPS-style weapon
      // Hat: smaller on head, will use 1.0 default
      helmet_tactical: 0.15,  // cowboy hat base scale
      // Sword: longer, visible over shoulder
      sword_longsword: 0.4,   // 1.4m longsword, scale accordingly
      // Accessories
      laptop: 0.35,
      barricade: 1.0,
      grenade_frag: 0.003,    // small grenade
    };

    Object.entries(this.items).forEach(([id, item]) => {
      if (item.modelFile) {
        const scale = scaleOverrides[id] || 1.0;
        equipmentManager.registerModel(id, item.modelFile, scale);
        console.log(`✓ Registered model: ${id} (scale: ${scale})`);
      }
    });
  },

  /**
   * Get recommended slot for item type
   */
  getPreferredSlot: function(itemId) {
    const item = this.getItem(itemId);
    if (!item || !item.preferredSlots) return 'right-hand';
    return item.preferredSlots[0];
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.ItemRegistry = ItemRegistry;
}
