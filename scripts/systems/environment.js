// Systems: environment manager (apply/teardown/switch between environments)
// Depends on window.RSG.content.environments and Three.js; browser-safe.

window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function () {
  var ctx = {
    state: null,
    getScene: null,
    getCamera: null,
    loadModels: null,
  };

  var registryApi = null;
  var trackedObjects = [];
  var pendingEnvironmentId = null;
  var globalSelectionId = null;

  function init(opts) {
    ctx.state = opts && opts.state ? opts.state : null;
    ctx.getScene = opts && opts.getScene ? opts.getScene : null;
    ctx.getCamera = opts && opts.getCamera ? opts.getCamera : null;
    ctx.loadModels = opts && opts.loadModels ? opts.loadModels : null;
    registryApi = window.RSG && window.RSG.content ? window.RSG.content.environments : null;

    if (ctx.state && ctx.state.environment) {
      ctx.state.environment.currentEnvironmentId = null;
      ctx.state.environment.selectedEnvironmentId = ctx.state.environment.selectedEnvironmentId || globalSelectionId || null;
      ctx.state.environment.isSwitching = false;
    }
  }

  function resolveRegistry() {
    if (registryApi) return registryApi;
    if (window.RSG && window.RSG.content && window.RSG.content.environments) {
      return window.RSG.content.environments;
    }
    return null;
  }

  function listEnvironments() {
    var reg = resolveRegistry();
    if (!reg || typeof reg.getEnvironments !== "function") return [];
    return reg.getEnvironments();
  }

  function getDefaultEnvironmentId() {
    var reg = resolveRegistry();
    if (!reg || typeof reg.getDefaultEnvironmentId !== "function") return null;
    return reg.getDefaultEnvironmentId();
  }

  function selectEnvironment(id) {
    if (ctx.state && ctx.state.environment) {
      ctx.state.environment.selectedEnvironmentId = id || null;
    }
    globalSelectionId = id || null;
    pendingEnvironmentId = id || null;
  }

  function getSelectedEnvironmentId() {
    if (ctx.state && ctx.state.environment && ctx.state.environment.selectedEnvironmentId) {
      return ctx.state.environment.selectedEnvironmentId;
    }
    return globalSelectionId || pendingEnvironmentId || getDefaultEnvironmentId();
  }

  function getActiveEnvironmentId() {
    if (ctx.state && ctx.state.environment) return ctx.state.environment.currentEnvironmentId || null;
    return null;
  }

  function getActiveEnvironment() {
    var id = getActiveEnvironmentId();
    if (!id || !registryApi) return null;
    return registryApi.getEnvironment(id) || null;
  }

  function applySelectedEnvironment(options) {
    var envId = (options && options.forceId) || getSelectedEnvironmentId() || getDefaultEnvironmentId();
    var scene = ctx.getScene ? ctx.getScene() : null;
    var reg = resolveRegistry();
    if (!scene || !reg) return;

    var env = reg.getEnvironment(envId);
    var fallbackUsed = false;
    if (!env) {
      env = reg.getEnvironment(getDefaultEnvironmentId());
      fallbackUsed = true;
    }
    if (!env) return;

    if (ctx.state && ctx.state.environment && ctx.state.environment.isSwitching) {
      pendingEnvironmentId = envId;
      return;
    }

    if (ctx.state && ctx.state.environment) {
      ctx.state.environment.isSwitching = true;
    }

    showFade(true);

    setTimeout(function () {
      teardownEnvironment();
      applyLighting(scene, env);
      applyLayout(scene, env);
      loadEnvironmentModels(env);
      placePlayer(env);

      if (ctx.state && ctx.state.environment) {
        ctx.state.environment.currentEnvironmentId = env.id;
        ctx.state.environment.selectedEnvironmentId = env.id;
        globalSelectionId = env.id;
        ctx.state.environment.isSwitching = false;
      }

      updateHudLabel(env);
      if (fallbackUsed) {
        showEnvironmentNotice("Environment non disponibile. Caricato default.");
      }
      showFade(false);

      if (pendingEnvironmentId && pendingEnvironmentId !== env.id) {
        var next = pendingEnvironmentId;
        pendingEnvironmentId = null;
        applySelectedEnvironment({ forceId: next });
      } else {
        pendingEnvironmentId = null;
      }
    }, 80);
  }

  function applyLighting(scene, env) {
    if (!env || !scene) return;
    if (env.lighting && env.lighting.background) {
      scene.background = new THREE.Color(env.lighting.background);
    }
    if (env.lighting && env.lighting.fog) {
      scene.fog = new THREE.Fog(env.lighting.fog.color, env.lighting.fog.near, env.lighting.fog.far);
    }
    var lights = ctx.state && ctx.state.environment ? ctx.state.environment.lights : null;
    if (lights) {
      if (lights.ambient && env.lighting && env.lighting.ambient) {
        lights.ambient.color = new THREE.Color(env.lighting.ambient.color);
        lights.ambient.intensity = env.lighting.ambient.intensity;
      }
      if (lights.directional && env.lighting && env.lighting.directional) {
        lights.directional.color = new THREE.Color(env.lighting.directional.color);
        lights.directional.intensity = env.lighting.directional.intensity;
        var p = env.lighting.directional.position || [50, 50, 50];
        lights.directional.position.set(p[0], p[1], p[2]);
      }
      if (lights.fill && env.lighting && env.lighting.fill) {
        lights.fill.color = new THREE.Color(env.lighting.fill.color);
        lights.fill.intensity = env.lighting.fill.intensity;
        var pf = env.lighting.fill.position || [-50, 30, -50];
        lights.fill.position.set(pf[0], pf[1], pf[2]);
      }
    }
  }

  function addTrackedObject(obj, opts) {
    var scene = ctx.getScene ? ctx.getScene() : null;
    if (!obj || !scene) return;
    scene.add(obj);
    trackedObjects.push({ obj: obj, staticTarget: !!(opts && opts.staticTarget) });
    if (opts && opts.staticTarget && ctx.state && ctx.state.world && ctx.state.world.staticTargets) {
      ctx.state.world.staticTargets.push(obj);
    }
  }

  function buildWarehouseLayout() {
    var floorGeometry = new THREE.PlaneGeometry(200, 200);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x4c8c4a, roughness: 0.8 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    addTrackedObject(floor, { staticTarget: true });

    var gridHelper = new THREE.GridHelper(200, 40, 0x000000, 0x444444);
    addTrackedObject(gridHelper, { staticTarget: false });

    var houseFloorGeometry = new THREE.PlaneGeometry(40, 30);
    var houseFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 });
    var houseFloor = new THREE.Mesh(houseFloorGeometry, houseFloorMaterial);
    houseFloor.rotation.x = -Math.PI / 2;
    houseFloor.position.set(0, 0.02, 0);
    houseFloor.receiveShadow = true;
    addTrackedObject(houseFloor, { staticTarget: true });

    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe8d4b8 });
    var wallGeometry = new THREE.BoxGeometry(200, 10, 2);
    var wallNorth = new THREE.Mesh(wallGeometry, wallMaterial);
    wallNorth.position.set(0, 5, -100);
    wallNorth.castShadow = true;
    wallNorth.receiveShadow = true;
    addTrackedObject(wallNorth, { staticTarget: true });

    var wallSouth = new THREE.Mesh(wallGeometry, wallMaterial);
    wallSouth.position.set(0, 5, 100);
    wallSouth.castShadow = true;
    wallSouth.receiveShadow = true;
    addTrackedObject(wallSouth, { staticTarget: true });

    var wallGeometry2 = new THREE.BoxGeometry(2, 10, 200);
    var wallWest = new THREE.Mesh(wallGeometry2, wallMaterial);
    wallWest.position.set(-100, 5, 0);
    wallWest.castShadow = true;
    wallWest.receiveShadow = true;
    addTrackedObject(wallWest, { staticTarget: true });

    var wallEast = new THREE.Mesh(wallGeometry2, wallMaterial);
    wallEast.position.set(100, 5, 0);
    wallEast.castShadow = true;
    wallEast.receiveShadow = true;
    addTrackedObject(wallEast, { staticTarget: true });

    var houseWallMaterial = new THREE.MeshStandardMaterial({ color: 0xd9c1a5 });
    var houseBackWallGeometry = new THREE.BoxGeometry(40, 3, 0.5);
    var houseBackWall = new THREE.Mesh(houseBackWallGeometry, houseWallMaterial);
    houseBackWall.position.set(0, 1.5, -15);
    houseBackWall.castShadow = true;
    houseBackWall.receiveShadow = true;
    addTrackedObject(houseBackWall, { staticTarget: true });

    var houseSideWallGeometry = new THREE.BoxGeometry(0.5, 3, 30);
    var houseLeftWall = new THREE.Mesh(houseSideWallGeometry, houseWallMaterial);
    houseLeftWall.position.set(-20, 1.5, 0);
    houseLeftWall.castShadow = true;
    houseLeftWall.receiveShadow = true;
    addTrackedObject(houseLeftWall, { staticTarget: true });

    var houseRightWall = new THREE.Mesh(houseSideWallGeometry, houseWallMaterial);
    houseRightWall.position.set(20, 1.5, 0);
    houseRightWall.castShadow = true;
    houseRightWall.receiveShadow = true;
    addTrackedObject(houseRightWall, { staticTarget: true });

    var houseFrontWallGeometry = new THREE.BoxGeometry(18, 3, 0.5);
    var houseFrontWallLeft = new THREE.Mesh(houseFrontWallGeometry, houseWallMaterial);
    houseFrontWallLeft.position.set(-11, 1.5, 15);
    houseFrontWallLeft.castShadow = true;
    houseFrontWallLeft.receiveShadow = true;
    addTrackedObject(houseFrontWallLeft, { staticTarget: true });

    var houseFrontWallRight = new THREE.Mesh(houseFrontWallGeometry, houseWallMaterial);
    houseFrontWallRight.position.set(11, 1.5, 15);
    houseFrontWallRight.castShadow = true;
    houseFrontWallRight.receiveShadow = true;
    addTrackedObject(houseFrontWallRight, { staticTarget: true });

    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0xc2a383, roughness: 0.6 });
    var tableTopGeometry = new THREE.BoxGeometry(4.5, 0.1, 2.0);
    var tableTop = new THREE.Mesh(tableTopGeometry, tableMaterial);
    tableTop.position.set(10, 1, -5);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    addTrackedObject(tableTop, { staticTarget: true });

    var legGeometry = new THREE.BoxGeometry(0.12, 1, 0.12);
    var legOffsets = [
      [-1.35, 0.5, -0.6],
      [1.35, 0.5, -0.6],
      [-1.35, 0.5, 0.6],
      [1.35, 0.5, 0.6],
    ];
    legOffsets.forEach(function (offset) {
      var leg = new THREE.Mesh(legGeometry, tableMaterial);
      leg.position.set(10 + offset[0], offset[1], -5 + offset[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      addTrackedObject(leg, { staticTarget: true });
    });
  }

  function buildRangeLayout() {
    var floorGeometry = new THREE.PlaneGeometry(120, 120);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444b55, roughness: 0.6 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    addTrackedObject(floor, { staticTarget: true });

    var gridHelper = new THREE.GridHelper(120, 24, 0x111111, 0x555555);
    addTrackedObject(gridHelper, { staticTarget: false });

    var bermGeometry = new THREE.BoxGeometry(120, 6, 4);
    var bermMaterial = new THREE.MeshStandardMaterial({ color: 0x2f3b2f, roughness: 0.9 });
    var berm = new THREE.Mesh(bermGeometry, bermMaterial);
    berm.position.set(0, 3, -40);
    berm.castShadow = true;
    berm.receiveShadow = true;
    addTrackedObject(berm, { staticTarget: true });
  }

  function applyLayout(scene, env) {
    if (!env) return;
    if (env.layout === "warehouse") {
      buildWarehouseLayout();
    } else if (env.layout === "range") {
      buildRangeLayout();
    }
  }

  function loadEnvironmentModels(env) {
    if (!ctx.loadModels) return;
    var models = typeof env.models === "function" ? env.models() : env.models || [];
    ctx.loadModels(models);
  }

  function placePlayer(env) {
    var camera = ctx.getCamera ? ctx.getCamera() : null;
    if (!camera || !env || !env.spawn) return;
    var pos = env.spawn.position || [0, 1.7, 10];
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(0, env.spawn.yaw || 0, 0);
    if (ctx.state && ctx.state.player && ctx.state.player.velocity) {
      ctx.state.player.velocity.x = 0;
      ctx.state.player.velocity.y = 0;
      ctx.state.player.velocity.z = 0;
    }
  }

  function teardownEnvironment() {
    var scene = ctx.getScene ? ctx.getScene() : null;
    if (!scene) return;

    trackedObjects.forEach(function (entry) {
      disposeObject(entry.obj, scene);
    });
    trackedObjects.length = 0;

    clearCollection(scene, ctx.state && ctx.state.world ? ctx.state.world.models : []);
    clearCollection(
      scene,
      ctx.state && ctx.state.world
        ? ctx.state.world.movingAnimals.map(function (a) {
            return a.model;
          })
        : []
    );
    clearCollection(
      scene,
      ctx.state && ctx.state.world
        ? ctx.state.world.characters.map(function (c) {
            return c.model;
          })
        : []
    );

    // Clear bullets meshes
    if (ctx.state && ctx.state.world && ctx.state.world.bullets) {
      ctx.state.world.bullets.forEach(function (b) {
        if (b.mesh && b.mesh.parent) b.mesh.parent.remove(b.mesh);
      });
    }

    // Reset world collections
    if (ctx.state && ctx.state.world) {
      ctx.state.world.models.length = 0;
      ctx.state.world.movingAnimals.length = 0;
      ctx.state.world.characters.length = 0;
      ctx.state.world.interactables.length = 0;
      ctx.state.world.collisionObjects.length = 0;
      ctx.state.world.bullets.length = 0;
      ctx.state.world.staticTargets.length = 0;
      ctx.state.world.robotData = null;
    }
  }

  function clearCollection(scene, list) {
    if (!scene || !list || !list.length) return;
    list.forEach(function (obj) {
      disposeObject(obj, scene);
    });
  }

  function disposeObject(obj, scene) {
    if (!obj) return;
    if (scene && obj.parent === scene) {
      scene.remove(obj);
    } else if (obj.parent) {
      obj.parent.remove(obj);
    }
    obj.traverse &&
      obj.traverse(function (child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(function (m) {
              if (m && m.dispose) m.dispose();
            });
          } else if (child.material.dispose) {
            child.material.dispose();
          }
        }
        if (child.texture && child.texture.dispose) child.texture.dispose();
      });
  }

  function updateHudLabel(env) {
    var el = document.getElementById("environment-label");
    if (!el) return;
    el.textContent = env && env.label ? env.label : "";
    el.style.display = env ? "block" : "none";
  }

  function showFade(visible) {
    var fade = document.getElementById("environment-fade");
    if (!fade) return;
    fade.style.display = visible ? "block" : "none";
    fade.style.opacity = visible ? "1" : "0";
    fade.style.pointerEvents = visible ? "all" : "none";
  }

  function showEnvironmentNotice(message) {
    if (!message) return;
    var el = document.getElementById("environment-notice");
    if (!el) {
      el = document.createElement("div");
      el.id = "environment-notice";
      el.style.position = "fixed";
      el.style.top = "16px";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.background = "rgba(0,0,0,0.8)";
      el.style.color = "#fff";
      el.style.padding = "10px 14px";
      el.style.border = "1px solid rgba(255,255,255,0.25)";
      el.style.borderRadius = "8px";
      el.style.fontSize = "0.95rem";
      el.style.zIndex = "1800";
      el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";
      el.style.opacity = "0";
      el.style.transition = "opacity 0.2s ease";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.opacity = "1";
    setTimeout(function () {
      el.style.opacity = "0";
    }, 1800);
  }

  window.RSG.systems.environment = {
    init: init,
    listEnvironments: listEnvironments,
    getDefaultEnvironmentId: getDefaultEnvironmentId,
    selectEnvironment: selectEnvironment,
    applySelectedEnvironment: applySelectedEnvironment,
    getActiveEnvironment: getActiveEnvironment,
    getActiveEnvironmentId: getActiveEnvironmentId,
    teardownCurrent: teardownEnvironment,
  };
})();
