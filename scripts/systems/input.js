// Systems: Input (keyboard + mouse look + pointer lock)
// Goal: attach listeners once per run, and dispose cleanly on stop.

window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function () {
  var isInitialized = false;
  var listeners = [];

  function addListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    listeners.push({ target: target, type: type, handler: handler, options: options });
  }

  function removeAllListeners() {
    for (var i = 0; i < listeners.length; i++) {
      var l = listeners[i];
      try {
        l.target.removeEventListener(l.type, l.handler, l.options);
      } catch (e) {
        // ignore
      }
    }
    listeners = [];
  }

  // init({ state, getCamera, constants, actions })
  // - state: RSG state tree
  // - getCamera(): returns current camera
  // - constants: { LOOK_SPEED }
  // - actions: { shoot, interact, toggleInventory, reload, closePC, closeDialogue }
  function init(opts) {
    if (isInitialized) return;
    if (!opts || !opts.state || typeof opts.getCamera !== "function") return;

    var state = opts.state;
    var constants = opts.constants || {};
    var LOOK_SPEED = constants.LOOK_SPEED || 0.002;
    var actions = opts.actions || {};

    function isGameplayMode() {
      if (!state) return true;
      if (state.mode && state.mode !== "gameplay") return false;
      if (state.ui && (state.ui.isUsingPC || state.ui.isInDialogue || state.ui.isInventoryOpen)) return false;
      return true;
    }

    function onKeyDown(event) {
      switch (event.code) {
        case "KeyW":
          if (isGameplayMode()) state.input.moveForward = true;
          break;
        case "KeyS":
          if (isGameplayMode()) state.input.moveBackward = true;
          break;
        case "KeyA":
          if (isGameplayMode()) state.input.moveLeft = true;
          break;
        case "KeyD":
          if (isGameplayMode()) state.input.moveRight = true;
          break;
        case "Space":
          if (isGameplayMode() && state.player.canJump) {
            state.player.velocity.y = opts.constants.JUMP_VELOCITY;
            state.player.canJump = false;
          }
          event.preventDefault();
          break;
        case "KeyQ":
          if (state.player.hasGun && isGameplayMode() && typeof actions.shoot === "function") {
            actions.shoot();
          }
          break;
        case "KeyE":
          if (isGameplayMode() && typeof actions.interact === "function") {
            actions.interact();
          }
          break;
        case "Tab":
          event.preventDefault();
          if (typeof actions.toggleInventory === "function") {
            actions.toggleInventory();
          }
          break;
        case "KeyR":
          if (isGameplayMode() && typeof actions.reload === "function") {
            actions.reload();
          }
          break;
        case "Escape":
          if (state.ui && state.ui.isUsingPC && typeof actions.closePC === "function") {
            actions.closePC();
          } else if (state.ui && state.ui.isInDialogue && typeof actions.closeDialogue === "function") {
            actions.closeDialogue();
          }
          break;
      }
    }

    function onKeyUp(event) {
      // Only reset movement keys if in gameplay mode to avoid stuck keys
      if (!isGameplayMode()) {
        // Still reset movement to prevent stuck keys after leaving PC mode
        if (event.code === "KeyW" || event.code === "KeyS" || event.code === "KeyA" || event.code === "KeyD") {
          switch (event.code) {
            case "KeyW":
              state.input.moveForward = false;
              break;
            case "KeyS":
              state.input.moveBackward = false;
              break;
            case "KeyA":
              state.input.moveLeft = false;
              break;
            case "KeyD":
              state.input.moveRight = false;
              break;
          }
        }
      } else {
        switch (event.code) {
          case "KeyW":
            state.input.moveForward = false;
            break;
          case "KeyS":
            state.input.moveBackward = false;
            break;
          case "KeyA":
            state.input.moveLeft = false;
            break;
          case "KeyD":
            state.input.moveRight = false;
            break;
        }
      }
    }

    function onMouseMove(event) {
      if (!document.pointerLockElement) return;
      if (!isGameplayMode()) return;

      var camera = opts.getCamera();
      if (!camera) return;

      var movementX = event.movementX || 0;
      var movementY = event.movementY || 0;

      var sens = state.settings && typeof state.settings.mouseSensitivity === "number" ? state.settings.mouseSensitivity : 1.0;

      camera.rotation.y -= movementX * LOOK_SPEED * sens;
      camera.rotation.x -= movementY * LOOK_SPEED * sens;
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }

    function onCanvasClick() {
      if (this && this.requestPointerLock) {
        this.requestPointerLock();
      }
    }

    addListener(document, "keydown", onKeyDown);
    addListener(document, "keyup", onKeyUp);
    addListener(document, "mousemove", onMouseMove);

    var canvasContainer = document.querySelector("#game-canvas");
    if (canvasContainer) {
      addListener(canvasContainer, "click", onCanvasClick);
    }

    isInitialized = true;
  }

  function dispose() {
    removeAllListeners();
    isInitialized = false;
  }

  window.RSG.systems.input = {
    init: init,
    dispose: dispose,
  };
})();
