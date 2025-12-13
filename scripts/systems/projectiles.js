// Systems: Projectiles + shooting + reload
// Encapsulates bullet updates and weapon ammo handling. Browser-safe.

window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function () {
  var ctx = null;

  function resolveWeaponInfo(equipped, weaponDefs) {
    // Supporta sia legacy che nuovo sistema
    var weapon = null;
    if (equipped && equipped.rightHand) {
      weapon = equipped.rightHand;
    } else if (equipped && equipped['right-hand']) {
      weapon = equipped['right-hand'];
    }
    
    if (!weapon) return null;
    var def = weaponDefs[weapon.id];
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

    // Supporta sia state.inventory.equipped che state.equippedItems
    var equipped = ctx.state.equippedItems || (ctx.state.inventory ? ctx.state.inventory.equipped : null);
    if (!equipped) {
      console.log("❌ Nessuna arma equipaggiata");
      return;
    }
    
    var weaponInfo = resolveWeaponInfo(equipped, ctx.weaponDefs);
    if (!weaponInfo || weaponInfo.type !== "weapon") {
      console.log("❌ Oggetto equipaggiato non è un'arma");
      return;
    }

    // Check munizioni nel caricatore
    var ws = ctx.state.player ? ctx.state.player.weaponState : null;
    if (ws && ws.currentMag !== undefined) {
      if (ws.isReloading) {
        console.log("⏳ Ricarica in corso...");
        return;
      }
      
      if (ws.currentMag <= 0) {
        console.log("🔫 Click! Caricatore vuoto - Premi R per ricaricare");
        if (window.RSG && window.RSG.ui && window.RSG.ui.notifications) {
          window.RSG.ui.notifications.showEmptyMag();
        }
        // TODO: Play empty click sound
        return;
      }
      
      // Decrementa munizioni nel caricatore
      ws.currentMag--;
    } else {
      // Fallback legacy: controlla ammo del'arma
      if (weaponInfo.ammo <= 0) {
        console.warn("Nessun proiettile disponibile!");
        return;
      }
      weaponInfo.ammo -= 1;
    }
    
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

    // Ottieni weapon da entrambi i sistemi
    var weapon = equipped['right-hand'] || equipped.rightHand;
    
    ctx.bullets.push({
      mesh: bulletMesh,
      direction: direction.clone(),
      remainingDistance: ctx.constants.BULLET_MAX_DISTANCE,
      stopped: false,
      damage: weaponInfo.damage || 10,  // Danno dall'arma
      weaponId: weapon ? weapon.id : 'unknown',
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
            if (animal.model === root) {
              animal.health = (animal.health || 50) - (bullet.damage || 10);
              console.log("🎯 Animale colpito! Danno:", bullet.damage, "Health rimanente:", animal.health);
              if (animal.health <= 0) {
                animal.alive = false;
                animal.speed = 0;
                animal.verticalSpeed = 0;
              }
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

  function reloadWeapon() {
    if (!ctx || !ctx.state || !ctx.state.player) return;
    
    var ws = ctx.state.player.weaponState;
    if (!ws) return;
    
    // Controlla se già in ricarica
    if (ws.isReloading) {
      console.log("⏳ Ricarica già in corso...");
      return;
    }
    
    // Controlla se il caricatore è già pieno
    if (ws.currentMag >= ws.maxMag) {
      console.log("ℹ️ Caricatore già pieno");
      return;
    }
    
    // Controlla se ci sono munizioni di riserva
    var ammoAvailable = ctx.state.player.ammo[ws.ammoType] || 0;
    if (ammoAvailable <= 0) {
      console.log("❌ Nessuna munizione di riserva disponibile!");
      if (window.RSG && window.RSG.ui && window.RSG.ui.notifications) {
        window.RSG.ui.notifications.showNoAmmo();
      }
      return;
    }
    
    console.log("🔄 Ricarica in corso...");
    ws.isReloading = true;
    ws.reloadStartTime = performance.now();
    
    // Ricarica dopo 2 secondi
    setTimeout(function() {
      if (!ctx || !ctx.state || !ctx.state.player) return;
      
      var needed = ws.maxMag - ws.currentMag;
      var toReload = Math.min(needed, ctx.state.player.ammo[ws.ammoType]);
      
      ws.currentMag += toReload;
      ctx.state.player.ammo[ws.ammoType] -= toReload;
      ws.isReloading = false;
      
      console.log("✅ Ricaricato! " + ws.currentMag + "/" + ws.maxMag);
      console.log("📦 Riserva: " + ctx.state.player.ammo[ws.ammoType] + " colpi");
      
      // Mostra notifica ricarica completata
      if (window.RSG && window.RSG.ui && window.RSG.ui.notifications) {
        window.RSG.ui.notifications.showReload();
      }
    }, 2000); // 2 secondi
  }

  window.RSG.systems.projectiles = {
    init: init,
    update: update,
    shoot: shoot,
    beginReload: beginReload,
    reloadWeapon: reloadWeapon,
  };
})();
