/**
 * EquipmentManager.js - 3D Equipment Rendering System
 * Manages rendering of equipped items on the player, positioning them correctly
 * based on slot type and updating their position each frame
 */

console.log("📦 equipment-manager.js caricato!");

class EquipmentManager {
  constructor(scene, camera, player) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.equippedMeshes = {}; // { 'right-hand': { mesh, item }, ... }
    this.loader = new THREE.GLTFLoader();

    // Define offset positions and rotations for each slot
    // These are relative to player position (first-person view)
    // FPS STANDARDS: Optimized for visibility and realism
    this.slotConfigs = {
      'right-hand': {
        position: [0.4, -0.55, -0.2],  // MOLTO PIÙ AVANTI: Z -0.2 (vicino alla camera)
        rotation: [-0.1, -0.15, 0.05],  // Canna in avanti, leggera inclinazione naturale
        scale: 1.5,  // RIDOTTO: era troppo grande (2.2 → 1.5)
      },
      'left-hand': {
        position: [-0.4, -0.55, -0.2],  // MOLTO PIÙ AVANTI: Stesso Z della destra
        rotation: [-0.1, Math.PI + 0.15, -0.05],  // CANNA AVANTI: rotazione Y corretta per far puntare avanti
        scale: 1.5,  // RIDOTTO: stesso size della destra
      },
      'back': {
        position: [0, 0.15, 0.5],  // over shoulder, further back
        rotation: [0, 0, 0],
        scale: 1.0,
      },
      'head': {
        position: [0, 0.25, 0],  // ALZATO: Y da 0.1 a 0.25 (più in alto sulla testa)
        rotation: [0, 0, 0],
        scale: 0.7,  // RIDOTTO: da 1.0 a 0.7 (30% più piccolo)
        followCamera: true  // FLAG: This slot rotates WITH camera pitch/yaw
      },
      'torso': {
        position: [0, 0.08, -0.15],  // chest area
        rotation: [0, 0, 0],
        scale: 1.0,
      },
      'legs': {
        position: [0, -0.35, 0],
        rotation: [0, 0, 0],
        scale: 1.0,
      },
      'feet': {
        position: [0, -0.7, 0],
        rotation: [0, 0, 0],
        scale: 1.0,
      },
    };

    // Map item types to their model files
    this.modelRegistry = {};
  }

  /**
   * Register a model file path for an item ID
   */
  registerModel(itemId, filePath, scale = 1) {
    this.modelRegistry[itemId] = { file: filePath, scale };
  }

  /**
   * Equip an item to a specific body slot
   */
  equipItem(item, slotType) {
    if (!this.slotConfigs[slotType]) {
      console.warn(`Invalid slot type: ${slotType}`);
      return;
    }

    // Unequip if something is already there
    this.unequipItem(slotType);

    // Find model file
    const modelData = this.modelRegistry[item.id] || this.getDefaultModelPath(item);
    if (!modelData) {
      console.warn(`No model found for item: ${item.id}`);
      return;
    }

    // Load the model
    this.loader.load(
      modelData.file,
      (gltf) => {
        const mesh = gltf.scene;

        // Apply slot configuration
        const config = this.slotConfigs[slotType];
        mesh.position.set(...config.position);
        mesh.rotation.set(...config.rotation);
        // Use the scale from modelRegistry (already calibrated for realistic sizing)
        const scale = modelData.scale || config.scale;
        
        // MIRROR FIX: Left-hand deve essere specchiato (scala X negativa)
        if (slotType === 'left-hand') {
          mesh.scale.set(-scale, scale, scale);  // Specchia sull'asse X
        } else {
          mesh.scale.set(scale, scale, scale);
        }

        // Store reference
        this.equippedMeshes[slotType] = {
          mesh,
          item,
          slotType,
          config,
        };

        // Add to scene
        this.scene.add(mesh);

        console.log(`✓ Equipped ${item.name} to ${slotType}`);
      },
      undefined,
      (error) => {
        console.error(`Failed to load model for ${item.id}:`, error);
      }
    );
  }

  /**
   * Unequip an item from a slot
   */
  unequipItem(slotType) {
    const equipped = this.equippedMeshes[slotType];
    if (equipped) {
      this.scene.remove(equipped.mesh);
      delete this.equippedMeshes[slotType];
      console.log(`✓ Unequipped from ${slotType}`);
    }
  }

  /**
   * Update positions of all equipped items (call once per frame)
   * This ensures items follow the player and rotate with the camera
   */
  updateAllEquipped() {
    try {
      Object.values(this.equippedMeshes).forEach((equipped) => {
        this.updateEquippedPosition(equipped);
      });
    } catch (error) {
      console.error("❌ Errore in updateAllEquipped:", error);
    }
  }

  /**
   * Update single item position and rotation
   */
  updateEquippedPosition(equipped) {
    try {
      if (!equipped || !equipped.mesh) return;

      // Usa player se disponibile, altrimenti la camera come riferimento posizione
      const playerPos = (this.player && this.player.position) ? this.player.position : this.camera.position;
      if (!playerPos) return;

      const { mesh, slotType, config } = equipped;

      // Get camera direction (where player is looking)
      const cameraDir = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDir);

      // Get player yaw (rotation around Y axis)
      const playerYaw = Math.atan2(cameraDir.x, cameraDir.z);

      // Update position based on slot
      if (slotType === 'right-hand' || slotType === 'left-hand') {
        // Hand items: position relative to player and rotate with camera
        const offset = new THREE.Vector3(...config.position);

        // Rotate offset based on player looking direction
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);

        // Set world position
        mesh.position.copy(playerPos).add(offset);

        // Rotate item to face camera direction
        mesh.rotation.y = playerYaw + config.rotation[1];
        mesh.rotation.x = config.rotation[0];
        mesh.rotation.z = config.rotation[2];
      } else {
        // Body items (torso, head, legs, back, etc.): fixed to body
        const offset = new THREE.Vector3(...config.position);
        mesh.position.copy(playerPos).add(offset);

        mesh.rotation.x = config.rotation[0];
        mesh.rotation.y = config.rotation[1] + playerYaw;
        mesh.rotation.z = config.rotation[2];

        // HEAD ITEMS: Also apply camera PITCH rotation (look up/down)
        // This makes hat rotate backward when looking up
        if (slotType === 'head' && config.followCamera) {
          const cameraPitch = this.camera.rotation.x;  // Pitch is X rotation
          mesh.rotation.x = cameraPitch + config.rotation[0];  // Hat follows look up/down
        }
      }
    } catch (error) {
      console.error("❌ Errore in updateEquippedPosition:", error);
    }
  }

  /**
   * Get default model path based on item type
   * Falls back if item ID not registered
   */
  getDefaultModelPath(item) {
    const typeToModelMap = {
      'pistol': 'models/pistol_beretta.glb',
      'rifle': 'models/rifle_ak47.glb',
      'shotgun': 'models/shotgun.glb',
      'sword': 'models/sword.glb',
      'shield': 'models/shield.glb',
      'helmet': 'models/helmet.glb',
      'armor': 'models/armor.glb',
    };

    const modelFile = typeToModelMap[item.type];
    if (modelFile) {
      return { file: modelFile, scale: 1 };
    }

    // Try direct item ID mapping
    if (item.modelFile) {
      return { file: item.modelFile, scale: item.modelScale || 1 };
    }

    return null;
  }

  /**
   * Get all currently equipped items
   */
  getEquipped() {
    return this.equippedMeshes;
  }

  /**
   * Clear all equipped items
   */
  clearAll() {
    Object.keys(this.equippedMeshes).forEach((slot) => {
      this.unequipItem(slot);
    });
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EquipmentManager;
}
