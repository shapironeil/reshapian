// Systems: Movement + collision resolution
// Goal: centralize player kinematics using state.input and camera; stateless aside from state mutations.

window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function () {
  var ctx = null;

  function init(opts) {
    if (!opts || !opts.state || typeof opts.getCamera !== "function") {
      console.warn("⚠️ movement system: init richiede state e getCamera");
      return;
    }
    ctx = {
      state: opts.state,
      getCamera: opts.getCamera,
      resolveCollisions: opts.resolveCollisions,
      isGameplayMode:
        typeof opts.isGameplayMode === "function"
          ? opts.isGameplayMode
          : function () {
              return true;
            },
      constants: opts.constants || {},
    };
  }

  function update(delta) {
    if (!ctx || !ctx.state) return;
    var state = ctx.state;
    if (!ctx.isGameplayMode()) return;

    var camera = ctx.getCamera ? ctx.getCamera() : null;
    if (!camera) return;

    var MOVE_SPEED = ctx.constants.MOVE_SPEED || 10.0;
    var GRAVITY = ctx.constants.GRAVITY || 20.0;
    var PLAYER_HEIGHT = ctx.constants.PLAYER_HEIGHT || 1.7;
    var FLY_SPEED = ctx.constants.FLY_SPEED || MOVE_SPEED;

    var input = state.input || {};
    var velocity = state.player && state.player.velocity ? state.player.velocity : { x: 0, y: 0, z: 0 };
    var isFlying = state.player && state.player.isFlying;

    // Gravity only when not flying
    if (!isFlying) {
      velocity.y -= GRAVITY * delta;
    } else {
      velocity.y = 0;
    }

    // Direction vectors (camera basis, flattened on Y)
    var forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();

    var right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    // Proposed position
    var newPosition = camera.position.clone();
    if (input.moveForward) newPosition.addScaledVector(forward, MOVE_SPEED * delta);
    if (input.moveBackward) newPosition.addScaledVector(forward, -MOVE_SPEED * delta);
    if (input.moveLeft) newPosition.addScaledVector(right, -MOVE_SPEED * delta);
    if (input.moveRight) newPosition.addScaledVector(right, MOVE_SPEED * delta);

    if (isFlying) {
      if (input.flyUp) newPosition.y += FLY_SPEED * delta;
      if (input.flyDown) newPosition.y -= FLY_SPEED * delta;
    }

    // Collisions (if provided)
    if (typeof ctx.resolveCollisions === "function") {
      newPosition = ctx.resolveCollisions(newPosition) || newPosition;
    }

    // Apply horizontal movement
    camera.position.x = newPosition.x;
    camera.position.z = newPosition.z;

    // Vertical
    if (isFlying) {
      camera.position.y = Math.max(PLAYER_HEIGHT * 0.3, newPosition.y);
      velocity.y = 0;
      if (state.player) state.player.canJump = true;
    } else {
      camera.position.y += velocity.y * delta;
      if (camera.position.y <= PLAYER_HEIGHT) {
        camera.position.y = PLAYER_HEIGHT;
        velocity.y = 0;
        if (state.player) state.player.canJump = true;
      } else if (state.player) {
        state.player.canJump = false;
      }
    }

    // Persist velocity back into state (legacy refs already point to it)
    if (state.player) state.player.velocity = velocity;
  }

  window.RSG.systems.movement = {
    init: init,
    update: update,
  };
})();
