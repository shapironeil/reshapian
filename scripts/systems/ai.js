// Systems: simple AI updates (animals + robot follow)

window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function () {
  var ctx = null;

  function init(opts) {
    if (!opts || !opts.state) {
      console.warn("⚠️ ai: init richiede state");
      return;
    }
    ctx = {
      state: opts.state,
      getCamera:
        typeof opts.getCamera === "function"
          ? opts.getCamera
          : function () {
              return null;
            },
      constants: opts.constants || {},
    };
  }

  function updateAnimals(delta) {
    if (!ctx || !ctx.state || !ctx.state.world) return;
    var animals = ctx.state.world.movingAnimals || [];
    if (!animals.length) return;

    var GRAVITY = ctx.constants.GRAVITY || 20;

    animals.forEach(function (animal) {
      if (animal.alive) {
        animal.angle += animal.speed * delta;
        animal.model.position.x = animal.center.x + Math.cos(animal.angle) * animal.radius;
        animal.model.position.z = animal.center.z + Math.sin(animal.angle) * animal.radius;
        if (animal.model.position.y < 0) animal.model.position.y = 0;
      } else {
        if (!animal.hasLanded) {
          animal.verticalSpeed -= GRAVITY * delta;
          animal.model.position.y += animal.verticalSpeed * delta;
          animal.model.rotation.z = Math.min(Math.PI / 2, animal.model.rotation.z + 1.5 * delta);
          if (animal.model.position.y <= 0) {
            animal.model.position.y = 0;
            animal.verticalSpeed = 0;
            animal.hasLanded = true;
          }
        }
      }
    });
  }

  function updateRobot(delta) {
    if (!ctx || !ctx.state || !ctx.state.world) return;
    var robotData = ctx.state.world.robotData;
    if (!robotData || !robotData.model || !robotData.followPlayer) return;

    var camera = ctx.getCamera();
    if (!camera) return;

    var target = new THREE.Vector3(camera.position.x, robotData.model.position.y, camera.position.z);
    var direction = target.clone().sub(robotData.model.position);
    var distance = direction.length();
    if (distance > 1.2) {
      direction.normalize();
      robotData.model.position.addScaledVector(direction, robotData.speed * delta);
      robotData.model.lookAt(target);
    }
  }

  function update(delta) {
    if (!ctx) return;
    updateAnimals(delta);
    updateRobot(delta);
  }

  window.RSG.systems.ai = {
    init: init,
    update: update,
  };
})();
