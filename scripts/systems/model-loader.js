// Systems: model loader for GLTF assets
// Depends on THREE.GLTFLoader already loaded.

window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function () {
  function loadAll(opts) {
    if (!opts || !opts.scene || !opts.modelList) {
      console.warn("⚠️ model-loader: missing scene or modelList");
      return;
    }
    if (typeof THREE === "undefined" || typeof THREE.GLTFLoader === "undefined") {
      console.error("❌ GLTFLoader not available");
      return;
    }

    var scene = opts.scene;
    var state = opts.state || {};
    var modelList = opts.modelList || [];
    var MODEL_GLOBAL_SCALE = opts.constants && opts.constants.MODEL_GLOBAL_SCALE ? opts.constants.MODEL_GLOBAL_SCALE : 0.01;

    var models = (state.world && state.world.models) || [];
    var collisionObjects = (state.world && state.world.collisionObjects) || [];
    var interactables = (state.world && state.world.interactables) || [];
    var movingAnimals = (state.world && state.world.movingAnimals) || [];
    var characters = (state.world && state.world.characters) || [];

    var loader = new THREE.GLTFLoader();
    var loadedCount = 0;

    function resolvePosition(item) {
      if (item && Array.isArray(item.pos)) {
        return { x: item.pos[0] || 0, y: item.pos[1] || 0, z: item.pos[2] || 0 };
      }
      if (item && item.position) {
        return {
          x: item.position.x || 0,
          y: item.position.y || 0,
          z: item.position.z || 0,
        };
      }
      return { x: 0, y: 0, z: 0 };
    }

    function resolveRotationY(item) {
      if (item && typeof item.rot === "number") return item.rot;
      if (item && item.rotation && typeof item.rotation.y === "number") return item.rotation.y;
      return 0;
    }

    function resolveScale(item) {
      if (item && typeof item.scale === "number") return item.scale;
      if (item && item.scale && typeof item.scale.x === "number") {
        // Media semplice per ridurre le differenze tra assi
        return (item.scale.x + (item.scale.y || item.scale.x) + (item.scale.z || item.scale.x)) / 3;
      }
      return 1;
    }

    modelList.forEach(function (item) {
      if (!item || !item.file) {
        console.warn("⚠️ model-loader: voce modello mancante o senza file", item);
        return;
      }

      var pos = resolvePosition(item);
      var yaw = resolveRotationY(item);
      var baseScale = resolveScale(item);
      var finalScale = baseScale * MODEL_GLOBAL_SCALE;

      loader.load(
        "models/" + item.file,
        function (gltf) {
          var model = gltf.scene;
          model.position.set(pos.x, pos.y, pos.z);
          model.rotation.y = yaw;
          model.scale.set(finalScale, finalScale, finalScale);

          model.userData = model.userData || {};
          model.userData.category = item.category || null;
          model.userData.id = item.id || null;

          model.traverse(function (child) {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          scene.add(model);
          models.push(model);

          var bbox = new THREE.Box3().setFromObject(model);
          collisionObjects.push({
            model: model,
            box: bbox,
          });

          loadedCount++;
          if (typeof opts.onProgress === "function") {
            opts.onProgress(loadedCount, modelList.length, item.file);
          }

          // Interactables
          if (item.id) {
            interactables.push({ id: item.id, type: item.category, model: model });
            if (item.category === "robot") {
              state.world.robotData = {
                model: model,
                speed: 2.0,
                followPlayer: false,
                wanderAngle: 0,
              };
            }
          }

          // Animals
          if (item.category === "animal") {
            var center = new THREE.Vector3(item.pos[0], item.pos[1], item.pos[2]);
            movingAnimals.push({
              model: model,
              center: center,
              radius: item.radius || 10,
              speed: item.speed || 0.5,
              angle: 0,
              alive: true,
              fallProgress: 0,
              verticalSpeed: 0,
              hasLanded: false,
            });
          }

          // Characters
          if (item.category === "character") {
            characters.push({ model: model });
          }
        },
        undefined,
        function (error) {
          if (typeof opts.onError === "function") opts.onError(error, item.file);
          else console.warn("⚠️ Errore caricamento", item.file);
        }
      );
    });
  }

  window.RSG.systems.modelLoader = {
    loadAll: loadAll,
  };
})();
