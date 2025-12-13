// Systems: interactions (prompts + interaction handling + PC/dialogue routing)
// Browser-safe, depends on UI modules under window.RSG.ui

window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function () {
  var ctx = null;

  function init(opts) {
    if (!opts || !opts.state || typeof opts.getCamera !== "function") {
      console.warn("⚠️ interactions: init richiede state e getCamera");
      return;
    }

    ctx = {
      state: opts.state,
      getCamera: opts.getCamera,
      ui: opts.ui || {},
      updateInventoryUI: typeof opts.updateInventoryUI === "function" ? opts.updateInventoryUI : function () {},
      isGameplayMode:
        typeof opts.isGameplayMode === "function"
          ? opts.isGameplayMode
          : function () {
              if (!opts.state) return true;
              if (opts.state.mode && opts.state.mode !== "gameplay") return false;
              if (opts.state.ui && (opts.state.ui.isUsingPC || opts.state.ui.isInDialogue || opts.state.ui.isInventoryOpen)) return false;
              return true;
            },
      constants: opts.constants || {},
    };
  }

  function getInteractables() {
    if (!ctx || !ctx.state || !ctx.state.world) return [];
    return ctx.state.world.interactables || [];
  }

  function getInventory() {
    if (!ctx || !ctx.state || !ctx.state.inventory) return { items: [], max: 10, equipped: {} };
    return ctx.state.inventory;
  }

  function getNearestInteractable() {
    if (!ctx || !ctx.getCamera) return null;
    var interactables = getInteractables();
    if (!interactables.length) return null;

    var camera = ctx.getCamera();
    if (!camera) return null;

    var nearest = null;
    var minDist = ctx.constants.INTERACT_DISTANCE || 2.0;
    var camPos = camera.position;

    interactables.forEach(function (obj) {
      if (!obj.model) return;
      var dist = camPos.distanceTo(obj.model.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = obj;
      }
    });

    return nearest;
  }

  function handleInteract() {
    if (!ctx || !ctx.state) return;
    if (!ctx.isGameplayMode()) return;
    var target = getNearestInteractable();
    if (!target) return;

    // PC ha logica dedicata
    if (target.id === "pc_laptop") {
      usePC();
      return;
    }
    
    // Robot ha dialogo
    if (target.type === "robot") {
      startDialogue();
      return;
    }
    
    // Tutti gli oggetti usable → pickup generalizzato
    if (target.category === "usable") {
      pickupItem(target);
      return;
    }
  }

  function pickupItem(target) {
    if (!ctx || !ctx.state || !target || !target.model) return;

    // 1. Ottieni metadata da ItemRegistry
    var itemData = null;
    if (window.RSG && window.RSG.data && window.RSG.data.itemRegistry) {
      itemData = window.RSG.data.itemRegistry.getItem(target.id);
    }
    
    if (!itemData) {
      console.warn("⚠️ Item non trovato in registry:", target.id);
      // Fallback per retrocompatibilità
      itemData = {
        id: target.id || "unknown",
        name: target.id === "pistol_beretta" ? "Pistola Beretta" : target.id === "pistol_43" ? "Pistola 43 Tactical" : "Item",
        type: "item"
      };
    }

    // 2. Rimuovi dal mondo 3D
    if (target.model.parent) {
      target.model.parent.remove(target.model);
    }

    // 3. Aggiungi a state.playerInventory (per InventoryUI moderna)
    if (ctx.state.playerInventory) {
      var existingItem = ctx.state.playerInventory.find(function(item) { return item.id === itemData.id; });
      
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        ctx.state.playerInventory.push({
          id: itemData.id,
          name: itemData.name,
          type: itemData.type || "item",
          damage: itemData.damage || 0,
          defense: itemData.defense || 0,
          weight: itemData.weight || 1,
          rarity: itemData.rarity || "common",
          description: itemData.description || "",
          modelFile: itemData.modelFile || target.file,
          icon: itemData.icon || "",
          quantity: 1
        });
      }

      // Mostra notifica pickup
      if (window.RSG && window.RSG.ui && window.RSG.ui.notifications) {
        var quantity = existingItem ? existingItem.quantity : 1;
        window.RSG.ui.notifications.showPickup(itemData.name, quantity);
      }
    }

    // 4. Aggiungi anche a inventory legacy (per compatibilità)
    var inventoryState = getInventory();
    var inventory = inventoryState.items || [];
    var max = inventoryState.max || 10;

    var itemId = target.id || "item";
    var itemName = itemData.name;

    if (inventory.length < max) {
      var weaponItem = {
        id: itemId,
        name: itemName,
        type: "weapon",
        modelRef: target.model,
      };
      inventory.push(weaponItem);
      ctx.updateInventoryUI();
    } else {
      console.warn("Inventario pieno: impossibile aggiungere pistola.");
    }

    var ammoId = "pistol_ammo";
    var existingAmmo = inventory.find(function (x) {
      return x.id === ammoId;
    });
    if (existingAmmo) {
      existingAmmo.amount = (existingAmmo.amount || 0) + 30;
    } else if (inventory.length < max) {
      inventory.push({
        id: ammoId,
        name: "Munizioni 9mm",
        type: "ammo",
        amount: 30,
      });
    }

    var interactables = getInteractables();
    for (var i = interactables.length - 1; i >= 0; i--) {
      if (interactables[i].id === "pistol_beretta" || interactables[i].id === "pistol_43") {
        interactables.splice(i, 1);
      }
    }
  }

  function usePC() {
    if (!ctx || !ctx.ui || !ctx.ui.pc || typeof ctx.ui.pc.open !== "function") return;
    if (ctx.state && ctx.state.ui) {
      ctx.state.ui.isUsingPC = true;
      ctx.state.mode = "pc";
    }
    ctx.ui.pc.open(ctx.state);
  }

  function closePC() {
    if (!ctx || !ctx.ui || !ctx.ui.pc || typeof ctx.ui.pc.close !== "function") return;
    ctx.ui.pc.close(ctx.state);
    if (ctx.state && ctx.state.ui) {
      ctx.state.ui.isUsingPC = false;
      ctx.state.mode = "gameplay";
    }
  }

  function setActivePCSection(sectionId) {
    if (!ctx || !ctx.ui || !ctx.ui.pc || typeof ctx.ui.pc.setActiveSection !== "function") return;
    ctx.ui.pc.setActiveSection(sectionId);
  }

  function startDialogue() {
    if (!ctx || !ctx.ui || !ctx.ui.dialogue || typeof ctx.ui.dialogue.open !== "function") return;
    if (ctx.state && ctx.state.ui) {
      ctx.state.ui.isInDialogue = true;
      ctx.state.mode = "dialogue";
    }
    ctx.ui.dialogue.open(ctx.state, ctx.state && ctx.state.world ? ctx.state.world.robotData : null);
  }

  function closeDialogue() {
    if (!ctx || !ctx.ui || !ctx.ui.dialogue || typeof ctx.ui.dialogue.close !== "function") return;
    ctx.ui.dialogue.close(ctx.state);
    if (ctx.state && ctx.state.ui) {
      ctx.state.ui.isInDialogue = false;
      ctx.state.mode = "gameplay";
    }
  }

  function updateInteractPrompt() {
    if (!ctx || !ctx.ui || !ctx.ui.hud || typeof ctx.ui.hud.setInteractPromptVisible !== "function") return;
    if (!ctx.isGameplayMode()) {
      ctx.ui.hud.setInteractPromptVisible(false);
      return;
    }

    var target = getNearestInteractable();
    if (!target) {
      ctx.ui.hud.setInteractPromptVisible(false);
      return;
    }

    var text = "E - Interagisci";
    if (target.id === "pc_laptop") {
      text = "E - Usa PC";
    } else if (target.type === "robot") {
      text = "E - Parla con il robottino";
    } else if (target.category === "usable") {
      // Determina il tipo di oggetto per prompt specifico
      var itemName = "oggetto";
      if (target.id && target.id.includes("pistol")) {
        itemName = "pistola";
      } else if (target.id === "sword_longsword") {
        itemName = "spada";
      } else if (target.id === "cowboy_hat") {
        itemName = "cappello";
      }
      text = "E - Raccogli " + itemName;
    }

    ctx.ui.hud.setInteractPromptVisible(true, text);
  }

  function updateShootPrompt() {
    if (!ctx || !ctx.ui || !ctx.ui.hud || typeof ctx.ui.hud.setShootPromptVisible !== "function") return;
    var hasGun = false;
    if (ctx.state && ctx.state.player) {
      hasGun = !!ctx.state.player.hasGun;
    }
    if (!hasGun && ctx.state && ctx.state.inventory && ctx.state.inventory.equipped) {
      var rightHand = ctx.state.inventory.equipped.rightHand;
      hasGun = rightHand && rightHand.type === "weapon";
    }
    var visible = hasGun && ctx.isGameplayMode() && !!document.pointerLockElement;
    ctx.ui.hud.setShootPromptVisible(!!visible);
  }

  function updatePrompts() {
    updateInteractPrompt();
    updateShootPrompt();
  }

  window.RSG.systems.interactions = {
    init: init,
    updatePrompts: updatePrompts,
    handleInteract: handleInteract,
    closePC: closePC,
    closeDialogue: closeDialogue,
    usePC: usePC,
    startDialogue: startDialogue,
    setActivePCSection: setActivePCSection,
  };
})();
