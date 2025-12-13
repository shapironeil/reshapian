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

    if (target.id === "pc_laptop") {
      usePC();
    } else if (target.id === "pistol_beretta" || target.id === "pistol_43") {
      pickupGun(target);
    } else if (target.type === "robot") {
      startDialogue();
    }
  }

  function pickupGun(target) {
    if (!ctx || !ctx.state || !target || !target.model) return;

    if (target.model.parent) {
      target.model.parent.remove(target.model);
    }

    var inventoryState = getInventory();
    var inventory = inventoryState.items || [];
    var max = inventoryState.max || 10;

    var itemId = target.id || "pistol";
    var itemName = itemId === "pistol_beretta" ? "Pistola Beretta" : itemId === "pistol_43" ? "Pistola 43 Tactical" : "Pistola";

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
    } else if (target.id === "pistol_beretta" || target.id === "pistol_43") {
      text = "E - Raccogli pistola";
    } else if (target.type === "robot") {
      text = "E - Parla con il robottino";
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
