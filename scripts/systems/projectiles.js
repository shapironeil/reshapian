// Systems: Projectiles + shooting + reload
// Encapsulates bullet updates and weapon ammo handling. Browser-safe.

window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function () {
  var ctx = null;

  function resolveWeaponInfo(equipped, weaponDefs) {
    if (!equipped || !equipped.rightHand) return null;
    var def = weaponDefs[equipped.rightHand.id];
    return def || null;
  }

  function ensureAmmoType(weaponInfo) {
    if (!weaponInfo) return null;
    return weaponInfo.ammoType || weaponInfo.ammotype || null;
  }

  function init(opts) {
    ctx = opts || {};
    if (!ctx.state) {
      console.warn("⚠️ projectiles: missing state in init");
    }
    ctx.bullets = (ctx.state && ctx.state.world && ctx.state.world.bullets) || [];
    ctx.weaponDefs = (window.RSG && window.RSG.gameplay && window.RSG.gameplay.weapons && window.RSG.gameplay.weapons.getWeaponDefs()) || {};
  }

  function shoot() {
    if (!ctx || !ctx.state) return;
    if (!ctx.getCamera || !ctx.getScene) return;
    var camera = ctx.getCamera();
    var scene = ctx.getScene();
    if (!camera || !scene) return;

    var equipped = ctx.state.inventory ? ctx.state.inventory.equipped : null;
    var weaponInfo = resolveWeaponInfo(equipped, ctx.weaponDefs);
    if (!weaponInfo || weaponInfo.type !== "weapon") return;

    if (weaponInfo.ammo <= 0) {
      console.warn("Nessun proiettile disponibile!");
      return;
    }

    weaponInfo.ammo -= 1;
    if (typeof ctx.updateInventoryUI === "function") ctx.updateInventoryUI();

    var flash = new THREE.PointLight(0xffaa00, 2, 5);
    camera.add(flash);
    flash.position.set(0.2, -0.1, -0.5);

    var origin = new THREE.Vector3().copy(camera.position);
    var direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion).normalize();

    var bulletGeom = new THREE.SphereGeometry(0.08, 8, 8);
    var bulletMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var bulletMesh = new THREE.Mesh(bulletGeom, bulletMat);

    var startPos = origin.clone().addScaledVector(direction, 0.8);
    bulletMesh.position.copy(startPos);
    scene.add(bulletMesh);

    ctx.bullets.push({
      mesh: bulletMesh,
      direction: direction.clone(),
      remainingDistance: ctx.constants.BULLET_MAX_DISTANCE,
      stopped: false,
    });
  }

  function update(delta) {
    if (!ctx || !ctx.state || !ctx.bullets || !ctx.bullets.length) return;
    var scene = ctx.getScene ? ctx.getScene() : null;
    if (!scene) return;

    var toRemove = [];
    var models = ctx.getModels ? ctx.getModels() : [];
    var staticTargets = ctx.getStaticTargets ? ctx.getStaticTargets() : [];
    var movingAnimals = ctx.getMovingAnimals ? ctx.getMovingAnimals() : [];
    var characters = ctx.getCharacters ? ctx.getCharacters() : [];

    ctx.bullets.forEach(function (bullet, index) {
      if (bullet.stopped) return;
      var prevPos = bullet.mesh.position.clone();
      var dir = bullet.direction;
      var travel = (ctx.constants.BULLET_SPEED || 80) * delta;
      if (travel <= 0) return;

      if (bullet.remainingDistance <= 0) {
        if (bullet.mesh.parent) bullet.mesh.parent.remove(bullet.mesh);
        toRemove.push(index);
        return;
      }
      if (travel > bullet.remainingDistance) travel = bullet.remainingDistance;

      var newPos = prevPos.clone().addScaledVector(dir, travel);
      var raycaster = new THREE.Raycaster(prevPos, dir.clone(), 0, travel);

      var targets = [];
      if (models && models.length) targets = targets.concat(models);
      if (staticTargets && staticTargets.length) targets = targets.concat(staticTargets);

      var intersects = targets.length ? raycaster.intersectObjects(targets, true) : [];
      if (intersects.length > 0) {
        var hit = intersects[0];
        var hitPoint = hit.point.clone();

        var root = hit.object;
        while (root.parent && root.parent !== scene) {
          root = root.parent;
        }
        var cat = root.userData ? root.userData.category : null;

        if (cat === "animal") {
          movingAnimals.forEach(function (animal) {
            if (animal.model === root && animal.alive) {
              animal.alive = false;
              animal.speed = 0;
              animal.verticalSpeed = 0;
            }
          });
        } else if (cat === "character") {
          for (var i = 0; i < characters.length; i++) {
            if (characters[i].model === root) {
              if (root.parent) root.parent.remove(root);
              characters.splice(i, 1);
              break;
            }
          }
        } else {
          spawnHitMarker(hitPoint);
        }

        if (bullet.mesh.parent) bullet.mesh.parent.remove(bullet.mesh);
        toRemove.push(index);
        return;
      }

      bullet.mesh.position.copy(newPos);
      bullet.remainingDistance -= travel;
    });

    for (var i = toRemove.length - 1; i >= 0; i--) {
      ctx.bullets.splice(toRemove[i], 1);
    }
  }

  function spawnHitMarker(point) {
    var scene = ctx && ctx.getScene ? ctx.getScene() : null;
    if (!scene || !point) return;
    var geometry = new THREE.SphereGeometry(0.15, 10, 10);
    var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var marker = new THREE.Mesh(geometry, material);
    marker.position.copy(point);
    scene.add(marker);
  }

  function beginReload() {
    if (!ctx || !ctx.state) return;
    var equipped = ctx.state.inventory ? ctx.state.inventory.equipped : null;
    var inventory = ctx.state.inventory ? ctx.state.inventory.items : null;
    if (!equipped || !inventory) return;

    var weaponInfo = resolveWeaponInfo(equipped, ctx.weaponDefs);
    if (!weaponInfo) return;

    var ammoKey = ensureAmmoType(weaponInfo);
    if (!ammoKey) return;

    var ammoIdx = inventory.findIndex(function (x) {
      return x.type === "ammo" && x.id === ammoKey;
    });
    if (ammoIdx < 0) {
      console.warn("Nessuna munizione disponibile!");
      return;
    }

    var ammo = inventory[ammoIdx];
    if (ammo.amount <= 0) {
      console.warn("Munizione esaurita!");
      return;
    }

    if (ctx.state.combat) ctx.state.combat.isReloading = true;
    if (ctx.ui && ctx.ui.hud) {
      ctx.ui.hud.setReloadBarVisible(true);
    }

    var startTime = performance.now();
    var originalAmmo = weaponInfo.ammo;
    var reloadDuration = ctx.state.combat ? ctx.state.combat.reloadDuration : 2.5;

    function updateReload(currentTime) {
      var elapsed = (currentTime - startTime) / 1000;
      var progress = Math.min(elapsed / reloadDuration, 1);
      if (ctx.ui && ctx.ui.hud) {
        ctx.ui.hud.setReloadProgress(progress);
      }

      if (progress >= 1) {
        var ammoNeeded = weaponInfo.ammoCapacity - originalAmmo;
        if (ammo.amount >= ammoNeeded) {
          weaponInfo.ammo = weaponInfo.ammoCapacity;
          ammo.amount -= ammoNeeded;
        } else {
          weaponInfo.ammo = originalAmmo + ammo.amount;
          ammo.amount = 0;
        }

        if (ammo.amount <= 0) inventory.splice(ammoIdx, 1);

        if (ctx.state.combat) ctx.state.combat.isReloading = false;
        if (ctx.ui && ctx.ui.hud) {
          ctx.ui.hud.setReloadBarVisible(false);
          ctx.ui.hud.setReloadProgress(0);
        }
        if (typeof ctx.updateInventoryUI === "function") ctx.updateInventoryUI();
      } else {
        requestAnimationFrame(updateReload);
      }
    }

    requestAnimationFrame(updateReload);
  }

  window.RSG.systems.projectiles = {
    init: init,
    update: update,
    shoot: shoot,
    beginReload: beginReload,
  };
})();
