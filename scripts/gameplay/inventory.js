// Gameplay: inventory runtime (state-backed, UI delegated)
// Browser-safe, no imports.

window.RSG = window.RSG || {};
window.RSG.gameplay = window.RSG.gameplay || {};

(function () {
  var ctx = null;

  // init({ state, ui, getCamera, onEquipWeapon })
  function init(opts) {
    if (!opts || !opts.state) {
      console.warn("⚠️ inventory: init requires state");
      return;
    }
    ctx = {
      state: opts.state,
      ui: opts.ui || {},
      getCamera: opts.getCamera,
      onEquipWeapon: typeof opts.onEquipWeapon === "function" ? opts.onEquipWeapon : null,
    };
  }

  function toggleInventory() {
    if (!ctx || !ctx.state) return false;
    var visible = !(ctx.state.ui && ctx.state.ui.isInventoryOpen);
    return toggleOverlay(visible);
  }

  function toggleOverlay(visible) {
    if (!ctx || !ctx.state) return false;
    if (ctx.state.ui) {
      ctx.state.ui.isInventoryOpen = !!visible;
      ctx.state.mode = visible ? "inventory" : "gameplay";
    }
    if (ctx.ui && ctx.ui.inventory && typeof ctx.ui.inventory.toggleOverlay === "function") {
      ctx.ui.inventory.toggleOverlay(ctx.state, !!visible);
    }
    return !!visible;
  }

  function render(onItemClick) {
    if (!ctx || !ctx.state) return;
    if (ctx.ui && ctx.ui.inventory && typeof ctx.ui.inventory.render === "function") {
      ctx.ui.inventory.render(ctx.state, function (item) {
        if (typeof onItemClick === "function") onItemClick(item);
      });
    }
  }

  function showItemDetail(item, weaponDefs, onEquip) {
    if (!ctx || !ctx.state || !item) return;
    if (ctx.state.ui) ctx.state.ui.currentDetailItem = item;
    if (ctx.ui && ctx.ui.inventory && typeof ctx.ui.inventory.showItemDetail === "function") {
      ctx.ui.inventory.showItemDetail(item, weaponDefs, function (it) {
        equipRightHand(it);
        if (typeof onEquip === "function") onEquip(it);
      });
    }
  }

  function equipRightHand(item) {
    if (!ctx || !ctx.state || !ctx.state.inventory) return;
    var inventory = ctx.state.inventory.items || [];
    var equipped = ctx.state.inventory.equipped || {};

    var idx = inventory.indexOf(item);
    if (idx >= 0) inventory.splice(idx, 1);

    if (equipped.rightHand) {
      inventory.push(equipped.rightHand);
      // detach old model
      var cam = ctx.getCamera ? ctx.getCamera() : null;
      if (cam && equipped.rightHand.modelRef && equipped.rightHand.modelRef.parent === cam) {
        cam.remove(equipped.rightHand.modelRef);
      }
    }

    equipped.rightHand = item;
    render();

    var cam2 = ctx.getCamera ? ctx.getCamera() : null;
    var model = item && item.modelRef;
    if (cam2 && model) {
      cam2.add(model);
      // FPS STANDARD positioning: bottom-right with barrel forward (matches equipment-manager)
      model.position.set(0.4, -0.45, -0.65);
      model.rotation.set(-0.05, -0.1, 0.05);  // Natural tilt like CS:GO/CoD
      model.scale.set(2.0, 2.0, 2.0);  // Match 2.0x scale from slotConfigs
    }

    if (ctx.onEquipWeapon) ctx.onEquipWeapon(item, model);
  }

  window.RSG.gameplay.inventory = {
    init: init,
    toggleInventory: toggleInventory,
    toggleOverlay: toggleOverlay,
    render: render,
    showItemDetail: showItemDetail,
    equipRightHand: equipRightHand,
  };
})();
