// UI: Architect Mode (in-game scene editor)
// Provides basic toggle, asset selection, placement, and nudge controls.

window.RSG = window.RSG || {};
window.RSG.ui = window.RSG.ui || {};

(function () {
  var ctx = null;
  var isActive = false;
  var loader = null;
  var panel = null;
  var assetSelect = null;
  var statusLabel = null;
  var selectedLabel = null;
  var selectedMesh = null;
  var placedMeshes = [];
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var mapLoaded = false;

  // UI elements for transforms and persistence
  var scaleSlider = null;
  var scaleValueLabel = null;
  var collidableCheckbox = null;
  var posXInput = null, posYInput = null, posZInput = null;
  var rotSlider = null;
  var rotValueLabel = null;
  var rotXSlider = null;
  var rotXValueLabel = null;
  var saveBtn = null;
  var presetBtn = null;
  var bboxHelper = null;
  var gizmoArrows = [];
  var isDragging = false;
  var dragPlane = null;
  var dragOffset = null;
  var dragStartY = 0;
  var axisDrag = null;

  var DOUBLE_CLICK_PAUSE_MS = 500;
  var lastDoubleClick = 0;

  var defaultsStore = {};
  var mapMeta = {};

  var SNAP_POS = 0.25;
  var PLACE_DISTANCE = 5;

  function init(opts) {
    if (!opts || !opts.state || !opts.scene || !opts.camera) {
      console.warn("⚠️ architect-mode: init richiede state, scene, camera");
      return;
    }
    ctx = {
      state: opts.state,
      scene: opts.scene,
      camera: opts.camera,
      renderer: opts.renderer,
      collisionObjects: opts.collisionObjects || [],
      getAssetList: typeof opts.getAssetList === "function" ? opts.getAssetList : function () { return []; },
    };
    loader = new THREE.GLTFLoader();
    loadDefaults();
    loadMapMeta();
    buildUI();
    ensureMapLoaded(true);
    showShortcuts(false);
  }

  function buildUI() {
    panel = document.createElement("div");
    panel.id = "architect-panel";
    panel.style.display = "none";

    var title = document.createElement("div");
    title.className = "architect-title";
    title.textContent = "ARCHITECT MODE";
    panel.appendChild(title);

    assetSelect = document.createElement("select");
    assetSelect.className = "architect-select";
    populateAssetList();
    assetSelect.addEventListener("change", function () {
      syncInputsToPresetForAsset(assetSelect.value);
    });
    panel.appendChild(assetSelect);

    var buttons = document.createElement("div");
    buttons.className = "architect-buttons";

    var placeBtn = document.createElement("button");
    placeBtn.className = "architect-btn";
    placeBtn.textContent = "Place";
    placeBtn.onclick = placeSelected;
    buttons.appendChild(placeBtn);

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "architect-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = deleteSelected;
    buttons.appendChild(deleteBtn);

    panel.appendChild(buttons);

    // Collision toggle
    var collidableRow = document.createElement("label");
    collidableRow.className = "architect-collidable-row";
    collidableCheckbox = document.createElement("input");
    collidableCheckbox.type = "checkbox";
    collidableCheckbox.onchange = onCollidableToggle;
    var collidableText = document.createElement("span");
    collidableText.textContent = "Collisione";
    collidableRow.appendChild(collidableCheckbox);
    collidableRow.appendChild(collidableText);
    panel.appendChild(collidableRow);

    // Scale control (single slider)
    var scaleRow = document.createElement("div");
    scaleRow.className = "architect-scale-row single";
    scaleRow.style.width = "200%"; // doppia larghezza per maggior precisione
    scaleSlider = document.createElement("input");
    scaleSlider.type = "range";
    scaleSlider.min = "0.01";
    scaleSlider.max = "16";
    scaleSlider.step = "0.001";
    scaleSlider.value = "1";
    scaleSlider.className = "architect-scale-slider";
    scaleSlider.style.width = "100%";
    scaleValueLabel = document.createElement("span");
    scaleValueLabel.className = "architect-scale-value";
    scaleValueLabel.textContent = "1.000x";
    scaleRow.appendChild(scaleSlider);
    scaleRow.appendChild(scaleValueLabel);
    panel.appendChild(scaleRow);

    scaleSlider.addEventListener("input", applyScaleFromInputs);

    var scaleButtons = document.createElement("div");
    scaleButtons.className = "architect-buttons";

    [0.01, 0.025, 0.05, 0.25, 0.5, 1.0, 2.0].forEach(function (preset) {
      var b = document.createElement("button");
      b.className = "architect-btn small";
      b.textContent = "x" + preset;
      b.onclick = function () {
        setScaleInputs(preset);
        applyScaleFromInputs();
      };
      scaleButtons.appendChild(b);
    });
    panel.appendChild(scaleButtons);

    // Position controls
    var posRow = document.createElement("div");
    posRow.className = "architect-scale-row";
    posXInput = document.createElement("input");
    posYInput = document.createElement("input");
    posZInput = document.createElement("input");
    [posXInput, posYInput, posZInput].forEach(function (inp) {
      inp.type = "number";
      inp.step = "0.1";
      inp.className = "architect-scale-input";
      posRow.appendChild(inp);
    });
    panel.appendChild(posRow);

    [posXInput, posYInput, posZInput].forEach(function (inp) {
      inp.addEventListener("input", applyPositionFromInputs);
    });

    // Rotation control (yaw slider)
    var rotRow = document.createElement("div");
    rotRow.className = "architect-scale-row single";
    rotSlider = document.createElement("input");
    rotSlider.type = "range";
    rotSlider.min = "-180";
    rotSlider.max = "180";
    rotSlider.step = "1";
    rotSlider.value = "0";
    rotSlider.className = "architect-rot-slider";
    rotValueLabel = document.createElement("span");
    rotValueLabel.className = "architect-scale-value";
    rotValueLabel.textContent = "0°";
    rotRow.appendChild(rotSlider);
    rotRow.appendChild(rotValueLabel);
    panel.appendChild(rotRow);

    rotSlider.addEventListener("input", applyRotationFromInputs);

    // Pitch control (vertical rotation)
    var rotXRow = document.createElement("div");
    rotXRow.className = "architect-scale-row single";
    rotXSlider = document.createElement("input");
    rotXSlider.type = "range";
    rotXSlider.min = "-180";
    rotXSlider.max = "180";
    rotXSlider.step = "1";
    rotXSlider.value = "0";
    rotXSlider.className = "architect-rot-slider";
    rotXValueLabel = document.createElement("span");
    rotXValueLabel.className = "architect-scale-value";
    rotXValueLabel.textContent = "0°";
    rotXRow.appendChild(rotXSlider);
    rotXRow.appendChild(rotXValueLabel);
    panel.appendChild(rotXRow);

    rotXSlider.addEventListener("input", applyRotationFromInputs);

    // Persistence buttons
    var persistenceRow = document.createElement("div");
    persistenceRow.className = "architect-buttons";
    saveBtn = document.createElement("button");
    saveBtn.className = "architect-btn";
    saveBtn.textContent = "Save";
    saveBtn.onclick = saveMap;
    persistenceRow.appendChild(saveBtn);

    presetBtn = document.createElement("button");
    presetBtn.className = "architect-btn";
    presetBtn.textContent = "Salva preset";
    presetBtn.onclick = savePresetForSelected;
    persistenceRow.appendChild(presetBtn);

    panel.appendChild(persistenceRow);

    statusLabel = document.createElement("div");
    statusLabel.className = "architect-status";
    statusLabel.textContent = "SHIFT=mouse libero · E piazza · Q elimina · doppio SPAZIO=volo";
    panel.appendChild(statusLabel);

    selectedLabel = document.createElement("div");
    selectedLabel.className = "architect-status secondary";
    selectedLabel.textContent = "Nessun elemento";
    panel.appendChild(selectedLabel);

    document.body.appendChild(panel);

    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("mousedown", onMouseDown, false);
    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
    document.addEventListener("dblclick", onDoubleClick, false);

    syncInputsToPresetForAsset(assetSelect.value);
  }

  function populateAssetList() {
    if (!assetSelect) return;
    while (assetSelect.firstChild) assetSelect.removeChild(assetSelect.firstChild);

    var list = ctx.getAssetList() || [];
    var seen = {};
    list.forEach(function (item) {
      if (!item || !item.file) return;
      if (seen[item.file]) return;
      seen[item.file] = true;
      var opt = document.createElement("option");
      opt.value = item.file;
      opt.textContent = item.file;
      assetSelect.appendChild(opt);
    });

    // fallback manual entries
    if (!Object.keys(seen).length) {
      ["old_sofa_free.glb", "vintage_tv_free.glb", "free_barricade.glb"].forEach(function (file) {
        var opt = document.createElement("option");
        opt.value = file;
        opt.textContent = file;
        assetSelect.appendChild(opt);
      });
    }
  }

  function setActive(flag) {
    isActive = !!flag;
    if (panel) panel.style.display = isActive ? "flex" : "none";
    if (isActive) {
      ensureMapLoaded(false);
      showShortcuts(true);
    } else {
      showShortcuts(false);
    }
    if (ctx && ctx.state && ctx.state.ui) {
      ctx.state.ui.isArchitectMode = isActive;
      ctx.state.mode = isActive ? "architect" : "gameplay";
    }
    if (!isActive) {
      clearSelection();
      if (collidableCheckbox) collidableCheckbox.checked = false;
      if (ctx && ctx.state) {
        if (ctx.state.player) ctx.state.player.isFlying = false;
        if (ctx.state.input) {
          ctx.state.input.flyUp = false;
          ctx.state.input.flyDown = false;
        }
      }
    }
  }

  function update(delta) {
    if (!isActive) return;
    updateHelpers();
  }

  function placeSelected() {
    if (!ctx || !ctx.scene || !ctx.camera) return;
    var file = assetSelect && assetSelect.value ? assetSelect.value : null;
    if (!file) return;

    var targetPos = computePlacementPosition();
    var forward = new THREE.Vector3();
    ctx.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    var def = defaultsStore[file];
    var hasPreset = !!def;
    var useOffset = (def && Object.prototype.hasOwnProperty.call(def, "heightOffset")) ? def.heightOffset : (hasPreset ? 0 : undefined);
    loader.load(
      "models/" + file,
      function (gltf) {
        var mesh = gltf.scene;
        mesh.position.copy(targetPos);
        mesh.rotation.y = ctx.camera.rotation.y;
        mesh.scale.setScalar(1.0);
        mesh.userData = mesh.userData || {};
        mesh.userData.sourceFile = file;
        applyDefaultsIfAny(mesh, file);
        dropMeshToSurface(mesh, targetPos, useOffset, hasPreset);
        ctx.scene.add(mesh);
        setSelected(mesh);
        placedMeshes.push(mesh);
        syncCollision(mesh);
        setStatus("Posizionato: " + file);
      },
      undefined,
      function (err) {
        console.error("Architect load error", err);
        setStatus("Errore caricamento: " + file);
      }
    );
  }

  function computePlacementPosition() {
    var forward = new THREE.Vector3();
    ctx.camera.getWorldDirection(forward);
    forward.normalize();
    var pos = ctx.camera.position.clone().add(forward.multiplyScalar(PLACE_DISTANCE));
    pos.y = Math.max(pos.y, 0.1);
    return pos;
  }

  function dropMeshToSurface(mesh, startPos, heightOffset, hasPreset) {
    if (!mesh) return;
    var pos = startPos ? startPos.clone() : mesh.position.clone();
    var finalY;
    
    if (typeof heightOffset === "number" && hasPreset) {
      // Preset con Y assoluta: usa quella diretta
      finalY = heightOffset;
      console.log("[PLACEMENT] Usando Y assoluta da preset:", {
        file: mesh.userData.sourceFile,
        presetY: heightOffset,
        finalY: finalY
      });
    } else {
      // Nessun preset o preset senza Y: drop automatico
      var supportY = computeSupportY(mesh, pos);
      var minHalf = getHalfHeight(mesh) + 0.01;
      finalY = supportY + minHalf;
      console.log("[PLACEMENT] Drop automatico:", {
        file: mesh.userData.sourceFile,
        supportY: supportY,
        minHalf: minHalf,
        finalY: finalY
      });
    }
    
    mesh.position.set(pos.x, finalY, pos.z);
    syncCollision(mesh);
  }

  function computeSupportY(mesh, positionOverride) {
    if (!mesh || !ctx || !ctx.scene) return (positionOverride && positionOverride.y) || 0;
    var pos = positionOverride ? positionOverride.clone() : mesh.position.clone();
    var supportY = 0;

    if (ctx.collisionObjects && ctx.collisionObjects.length) {
      ctx.collisionObjects.forEach(function (obj) {
        if (!obj || !obj.model || obj.model === mesh) return;
        var obox = new THREE.Box3().setFromObject(obj.model);
        if (pos.x >= obox.min.x && pos.x <= obox.max.x && pos.z >= obox.min.z && pos.z <= obox.max.z) {
          if (obox.max.y > supportY) supportY = obox.max.y;
        }
      });
    }

    // Raycast down against scene meshes for finer placement (ignoring the mesh itself)
    var rayOrigin = pos.clone();
    rayOrigin.y = pos.y + 50;
    var down = new THREE.Vector3(0, -1, 0);
    var raycasterDown = new THREE.Raycaster(rayOrigin, down, 0, 200);
    var sceneTargets = [];
    ctx.scene.traverse(function (obj) {
      if (obj && obj.isMesh && obj !== mesh) sceneTargets.push(obj);
    });
    var hits = sceneTargets.length ? raycasterDown.intersectObjects(sceneTargets, true) : [];
    if (hits.length) {
      var firstHit = hits.find(function (h) { return !isDescendantOf(h.object, mesh); });
      if (firstHit) {
        supportY = Math.max(supportY, firstHit.point.y);
      }
    }

    return supportY;
  }

  function getHalfHeight(mesh) {
    if (!mesh) return 0;
    var box = new THREE.Box3().setFromObject(mesh);
    var size = new THREE.Vector3();
    box.getSize(size);
    return size.y / 2;
  }

  function isDescendantOf(obj, maybeParent) {
    var current = obj;
    while (current) {
      if (current === maybeParent) return true;
      current = current.parent;
    }
    return false;
  }

  function deleteSelected() {
    if (!selectedMesh) return;
    if (selectedMesh.parent) selectedMesh.parent.remove(selectedMesh);
    unregisterCollision(selectedMesh);
    placedMeshes = placedMeshes.filter(function (m) { return m !== selectedMesh; });
    selectedMesh = null;
    setStatus("Eliminato");
    setScaleInputs(1);
  }

  function nudgeSelected(dx, dy, dz) {
    if (!selectedMesh) return;
    selectedMesh.position.x += dx;
    selectedMesh.position.y += dy;
    selectedMesh.position.z += dz;
    updateHelpers();
    syncCollision(selectedMesh);
    setPositionInputs(selectedMesh);
  }

  function onCollidableToggle() {
    if (!selectedMesh) return;
    var flag = !!collidableCheckbox.checked;
    selectedMesh.userData = selectedMesh.userData || {};
    selectedMesh.userData.collidable = flag;
    syncCollision(selectedMesh);
  }

  function onKeyDown(event) {
    if (!isActive) return;
    switch (event.code) {
      case "ArrowUp":
        nudgeSelected(0, 0, -SNAP_POS);
        break;
      case "ArrowDown":
        nudgeSelected(0, 0, SNAP_POS);
        break;
      case "ArrowLeft":
        nudgeSelected(-SNAP_POS, 0, 0);
        break;
      case "ArrowRight":
        nudgeSelected(SNAP_POS, 0, 0);
        break;
      case "Delete":
        deleteSelected();
        break;
      case "KeyE":
        placeSelected();
        event.preventDefault();
        break;
      case "KeyQ":
        deleteSelected();
        event.preventDefault();
        break;
    }
  }

  function onMouseDown(event) {
    if (!isActive) return;
    if (!ctx || !ctx.camera || !ctx.scene) return;
    if (panel && event.target && panel.contains(event.target)) return;

    // normalize pointer to NDC
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, ctx.camera);
    var targets = placedMeshes.slice();
    // Include other scene meshes/groups so we can edit pre-existing objects and gizmo arrows
    ctx.scene.children.forEach(function (child) {
      if (child.isMesh || child.type === "Group" || child.type === "ArrowHelper") {
        targets.push(child);
      }
    });
    var intersects = targets.length ? raycaster.intersectObjects(targets, true) : [];
    if (intersects && intersects.length) {
      // find top-level placed mesh
      var obj = intersects[0].object;
      while (obj && placedMeshes.indexOf(obj) === -1 && targets.indexOf(obj) === -1 && obj.parent) {
        obj = obj.parent;
      }
      if (obj && obj.userData && obj.userData.axis && selectedMesh) {
        startAxisDrag(obj.userData.axis);
        return;
      }

      if (obj && (placedMeshes.indexOf(obj) !== -1 || targets.indexOf(obj) !== -1)) {
        setSelected(obj);
        if (placedMeshes.indexOf(obj) === -1) {
          placedMeshes.push(obj);
        }
        setStatus("Selezionato: " + (obj.userData && obj.userData.sourceFile ? obj.userData.sourceFile : "mesh"));
        if (event.button === 0 && !document.pointerLockElement) {
          startDragFromPointer();
        }
      }
    }
  }

  function startDragFromPointer() {
    if (!selectedMesh) return;
    dragStartY = selectedMesh.position.y;
    dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -dragStartY);
    var hitPoint = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
      dragOffset = hitPoint.clone().sub(selectedMesh.position);
      isDragging = true;
    }
  }

  function startAxisDrag(axisName) {
    if (!selectedMesh) return;
    var axis = new THREE.Vector3(axisName === "x" ? 1 : 0, axisName === "y" ? 1 : 0, axisName === "z" ? 1 : 0).normalize();
    var camDir = new THREE.Vector3();
    ctx.camera.getWorldDirection(camDir);
    var planeNormal = new THREE.Vector3().crossVectors(axis, camDir).normalize();
    if (planeNormal.lengthSq() < 0.0001) {
      // Se la camera è allineata con l'asse (es. Y), usa un vettore fallback ortogonale diverso
      var fallback = Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      planeNormal = new THREE.Vector3().crossVectors(axis, fallback).normalize();
    }
    var plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, selectedMesh.position);
    var hitPoint = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, hitPoint)) {
      axisDrag = {
        axis: axis,
        plane: plane,
        startHit: hitPoint.clone(),
        startPos: selectedMesh.position.clone(),
      };
    }
  }

  function onMouseMove(event) {
    if (!isActive || !selectedMesh) return;
    if (document.pointerLockElement) return; // need free mouse to drag

    if (axisDrag) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, ctx.camera);

      var hitPointAxis = new THREE.Vector3();
      if (axisDrag.plane && raycaster.ray.intersectPlane(axisDrag.plane, hitPointAxis)) {
        var delta = hitPointAxis.clone().sub(axisDrag.startHit);
        var proj = delta.dot(axisDrag.axis);
        var newPos = axisDrag.startPos.clone().add(axisDrag.axis.clone().multiplyScalar(proj));
        selectedMesh.position.copy(newPos);
        updateHelpers();
        syncCollision(selectedMesh);
        setPositionInputs(selectedMesh);
      }
      return;
    }

    if (!isDragging) return;

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, ctx.camera);

    var hitPoint = new THREE.Vector3();
    if (dragPlane && raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
      selectedMesh.position.x = hitPoint.x - (dragOffset ? dragOffset.x : 0);
      selectedMesh.position.z = hitPoint.z - (dragOffset ? dragOffset.z : 0);
      selectedMesh.position.y = dragStartY;
      updateHelpers();
      syncCollision(selectedMesh);
      setPositionInputs(selectedMesh);
    }
  }

  function onMouseUp() {
    isDragging = false;
    dragPlane = null;
    dragOffset = null;
    axisDrag = null;
  }

  function onDoubleClick(event) {
    if (!isActive) return;
    var now = performance.now();
    if (now - lastDoubleClick < DOUBLE_CLICK_PAUSE_MS) return;
    lastDoubleClick = now;
    // Stop movement and free mouse
    if (document.pointerLockElement) document.exitPointerLock();
    if (ctx && ctx.state && ctx.state.input) {
      ctx.state.input.moveForward = ctx.state.input.moveBackward = false;
      ctx.state.input.moveLeft = ctx.state.input.moveRight = false;
    }
    setStatus("Mouse libero (dblclick)");
  }

  function clearSelection() {
    selectedMesh = null;
    isDragging = false;
    dragPlane = null;
    dragOffset = null;
    axisDrag = null;
    if (collidableCheckbox) collidableCheckbox.checked = false;
    setScaleInputs(1);
    setSelectedLabel(null);
    clearHelpers();
  }

  function setSelected(mesh) {
    selectedMesh = mesh;
    if (selectedMesh) {
      var s = selectedMesh.scale;
      var avgScale = (s.x + s.y + s.z) / 3;
      setScaleInputs(avgScale);
      setPositionInputs(selectedMesh);
      setRotationInputsFromMesh(selectedMesh);
      if (collidableCheckbox) {
        collidableCheckbox.checked = !!(selectedMesh.userData && selectedMesh.userData.collidable);
      }
      setSelectedLabel(selectedMesh);
      updateHelpers();
    }
  }

  function setScaleInputs(v) {
    if (!scaleSlider) return;
    var val = parseFloat(v);
    if (isNaN(val) || val <= 0) val = 1;
    scaleSlider.value = val;
    if (scaleValueLabel) scaleValueLabel.textContent = formatScale(val) + "x";
  }

  function setPositionInputs(mesh) {
    if (!mesh) return;
    if (posXInput) posXInput.value = round2(mesh.position.x);
    if (posYInput) posYInput.value = round2(mesh.position.y);
    if (posZInput) posZInput.value = round2(mesh.position.z);
  }

  function setRotationInputsFromMesh(mesh) {
    if (!mesh) return;
    if (rotSlider) {
      var yaw = normalizeDeg(radToDeg(mesh.rotation.y));
      rotSlider.value = yaw;
      if (rotValueLabel) rotValueLabel.textContent = Math.round(yaw) + "°";
    }
    if (rotXSlider) {
      var pitch = normalizeDeg(radToDeg(mesh.rotation.x));
      rotXSlider.value = pitch;
      if (rotXValueLabel) rotXValueLabel.textContent = Math.round(pitch) + "°";
    }
  }

  function applyScaleFromInputs() {
    if (!selectedMesh) return;
    var s = parseFloat(scaleSlider && scaleSlider.value);
    if (isNaN(s)) s = 1;
    selectedMesh.scale.set(s, s, s);
    setScaleInputs(s);
    updateHelpers();
    syncCollision(selectedMesh);
  }

  function applyPositionFromInputs() {
    if (!selectedMesh) return;
    var px = parseFloat(posXInput && posXInput.value);
    var py = parseFloat(posYInput && posYInput.value);
    var pz = parseFloat(posZInput && posZInput.value);
    if (!isNaN(px)) selectedMesh.position.x = px;
    if (!isNaN(py)) selectedMesh.position.y = py;
    if (!isNaN(pz)) selectedMesh.position.z = pz;
    updateHelpers();
    syncCollision(selectedMesh);
  }

  function applyRotationFromInputs() {
    if (!selectedMesh) return;
    var ry = degToRad(parseFloat(rotSlider && rotSlider.value) || 0);
    var rx = degToRad(parseFloat(rotXSlider && rotXSlider.value) || 0);
    selectedMesh.rotation.y = ry;
    selectedMesh.rotation.x = rx;
    if (rotValueLabel) rotValueLabel.textContent = Math.round(radToDeg(ry)) + "°";
    if (rotXValueLabel) rotXValueLabel.textContent = Math.round(radToDeg(rx)) + "°";
    updateHelpers();
    syncCollision(selectedMesh);
  }

  function setSelectedLabel(mesh) {
    if (!selectedLabel) return;
    if (!mesh) {
      selectedLabel.textContent = "Nessun elemento";
      return;
    }
    var file = mesh.userData && mesh.userData.sourceFile ? mesh.userData.sourceFile : "mesh";
    selectedLabel.textContent = "Selezionato: " + file;
  }

  function syncCollision(mesh) {
    if (!ctx || !ctx.collisionObjects) return;
    if (!mesh || !mesh.userData) return;

    if (!mesh.userData.collidable) {
      unregisterCollision(mesh);
      return;
    }

    var box = computeCollisionBox(mesh);
    mesh.userData.collisionBox = box;

    var existing = ctx.collisionObjects.find(function (c) { return c && c.model === mesh; });
    if (existing) {
      existing.box = box;
    } else {
      ctx.collisionObjects.push({ model: mesh, box: box });
    }
  }

  function updateHelpers() {
    if (!selectedMesh || !ctx || !ctx.scene) return;

    // Bounding box highlight
    if (!bboxHelper) {
      bboxHelper = new THREE.BoxHelper(selectedMesh, 0xffff00);
      ctx.scene.add(bboxHelper);
    }
    bboxHelper.setFromObject(selectedMesh);

    // Gizmo arrows
    if (!gizmoArrows.length) {
      createGizmoArrows();
    }
    var len = Math.max(0.5, computeGizmoLength(selectedMesh));
    updateArrow(gizmoArrows[0], new THREE.Vector3(1, 0, 0), len);
    updateArrow(gizmoArrows[1], new THREE.Vector3(0, 1, 0), len);
    updateArrow(gizmoArrows[2], new THREE.Vector3(0, 0, 1), len);
  }

  function clearHelpers() {
    if (bboxHelper && ctx && ctx.scene) {
      ctx.scene.remove(bboxHelper);
    }
    bboxHelper = null;
    gizmoArrows.forEach(function (a) {
      if (a && ctx && ctx.scene) ctx.scene.remove(a);
    });
    gizmoArrows = [];
  }

  function createGizmoArrows() {
    clearHelpers();
    if (!selectedMesh || !ctx || !ctx.scene) return;
    var origin = selectedMesh.position;
    gizmoArrows = [
      new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 1, 0xff0000),
      new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 1, 0x00ff00),
      new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 1, 0x0000ff)
    ];
    gizmoArrows[0].userData.axis = "x";
    gizmoArrows[1].userData.axis = "y";
    gizmoArrows[2].userData.axis = "z";
    gizmoArrows.forEach(function (a) { ctx.scene.add(a); });
  }

  function updateArrow(arrow, dir, len, offset) {
    if (!arrow || !selectedMesh) return;
    arrow.position.copy(selectedMesh.position);
    if (offset) arrow.position.add(offset);
    arrow.setDirection(dir.normalize());
    arrow.setLength(len);
  }

  function computeGizmoLength(mesh) {
    var box = new THREE.Box3().setFromObject(mesh);
    var size = new THREE.Vector3();
    box.getSize(size);
    return Math.max(size.x, size.y, size.z) * 0.75 + 0.2;
  }

  function unregisterCollision(mesh) {
    if (!ctx || !ctx.collisionObjects) return;
    var list = ctx.collisionObjects;
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i] && list[i].model === mesh) {
        list.splice(i, 1);
      }
    }
  }

  function computeCollisionBox(mesh) {
    var box = new THREE.Box3().setFromObject(mesh);
    return box;
  }

  function round2(v) {
    return Math.round(v * 100) / 100;
  }

  function formatScale(v) {
    var abs = Math.abs(v);
    return abs < 1 ? v.toFixed(3) : v.toFixed(2);
  }

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  function radToDeg(r) {
    return (r * 180) / Math.PI;
  }

  function normalizeDeg(d) {
    var r = d % 360;
    if (r < -180) r += 360;
    if (r > 180) r -= 360;
    return r;
  }

  function applyDefaultsIfAny(mesh, file) {
    if (!mesh || !file) return;
    var def = defaultsStore[file];
    if (!def) return;
    if (def.scale) {
      mesh.scale.set(def.scale.x, def.scale.y, def.scale.z);
      setScaleInputs((def.scale.x + def.scale.y + def.scale.z) / 3);
    }
    mesh.userData = mesh.userData || {};
    if (typeof def.collidable === "boolean") {
      mesh.userData.collidable = def.collidable;
    }
    if (typeof def.rotationY === "number") {
      mesh.rotation.y = def.rotationY;
    }
    if (typeof def.rotationX === "number") {
      mesh.rotation.x = def.rotationX;
    }
  }

  function loadDefaults() {
    try {
      var raw = localStorage.getItem("architectDefaults");
      if (raw) {
        defaultsStore = JSON.parse(raw) || {};
      }
    } catch (e) {
      defaultsStore = {};
    }
  }

  function computeHeightOffsetForMesh(mesh) {
    if (!mesh) return 0;
    var absY = mesh.position.y;
    console.log("[PRESET] Salvataggio Y assoluta:", {
      file: mesh.userData.sourceFile,
      posY: absY
    });
    return isNaN(absY) ? 0 : absY;
  }

  function savePresetForSelected() {
    if (!selectedMesh || !selectedMesh.userData || !selectedMesh.userData.sourceFile) return;
    var file = selectedMesh.userData.sourceFile;
    defaultsStore[file] = {
      scale: { x: selectedMesh.scale.x, y: selectedMesh.scale.y, z: selectedMesh.scale.z },
      rotationY: selectedMesh.rotation.y,
      rotationX: selectedMesh.rotation.x,
      collidable: !!(selectedMesh.userData && selectedMesh.userData.collidable),
      heightOffset: computeHeightOffsetForMesh(selectedMesh)
    };
    persistDefaults();
    setStatus("Preset salvato per " + file);
    syncInputsToPresetForAsset(file);
  }

  function syncInputsToPresetForAsset(file) {
    if (!file || selectedMesh) return;
    var def = defaultsStore[file];
    if (def && def.scale) {
      var avg = (def.scale.x + def.scale.y + def.scale.z) / 3;
      setScaleInputs(avg);
    } else {
      setScaleInputs(1);
    }
    if (collidableCheckbox && def && typeof def.collidable === "boolean") {
      collidableCheckbox.checked = def.collidable;
    } else if (collidableCheckbox) {
      collidableCheckbox.checked = false;
    }
    if (rotSlider && typeof def !== "undefined" && def && typeof def.rotationY === "number") {
      rotSlider.value = normalizeDeg(radToDeg(def.rotationY));
      if (rotValueLabel) rotValueLabel.textContent = Math.round(normalizeDeg(radToDeg(def.rotationY))) + "°";
    } else if (rotSlider) {
      rotSlider.value = 0;
      if (rotValueLabel) rotValueLabel.textContent = "0°";
    }
    if (rotXSlider && def && typeof def.rotationX === "number") {
      rotXSlider.value = normalizeDeg(radToDeg(def.rotationX));
      if (rotXValueLabel) rotXValueLabel.textContent = Math.round(normalizeDeg(radToDeg(def.rotationX))) + "°";
    } else if (rotXSlider) {
      rotXSlider.value = 0;
      if (rotXValueLabel) rotXValueLabel.textContent = "0°";
    }
  }

  function persistDefaults() {
    try {
      localStorage.setItem("architectDefaults", JSON.stringify(defaultsStore));
    } catch (e) {
      console.warn("Architect defaults save error", e);
    }
  }

  function ensureMapLoaded(quiet) {
    if (mapLoaded) return;
    loadMap(quiet === true);
  }

  function saveMap() {
    var meshes = collectPlaceableMeshes();
    var data = meshes.map(function (m) {
      return {
        file: m.userData && m.userData.sourceFile ? m.userData.sourceFile : "",
        position: { x: m.position.x, y: m.position.y, z: m.position.z },
        rotation: { x: m.rotation.x, y: m.rotation.y, z: m.rotation.z },
        scale: { x: m.scale.x, y: m.scale.y, z: m.scale.z },
        collidable: !!(m.userData && m.userData.collidable),
      };
    });
    var json = JSON.stringify(data, null, 2);
    try {
      localStorage.setItem("architectMap", json);
      localStorage.setItem("architectMapMeta", JSON.stringify(mapMeta || {}));
      setStatus("Mappa salvata (" + data.length + " elementi)");
    } catch (e) {
      console.warn("Architect save error", e);
      setStatus("Errore salvataggio");
    }
    console.log("Architect map JSON:\n", json);
  }

  function collectPlaceableMeshes() {
    var set = new Set();
    var list = [];
    placedMeshes.forEach(function (m) {
      if (m && m.userData && m.userData.sourceFile && !set.has(m)) {
        set.add(m);
        list.push(m);
      }
    });
    if (ctx && ctx.scene) {
      ctx.scene.traverse(function (obj) {
        // Salva anche i root Group caricati (non solo mesh) purché abbiano sourceFile
        if (obj && obj.userData && obj.userData.sourceFile && !set.has(obj)) {
          set.add(obj);
          list.push(obj);
        }
      });
    }
    return list;
  }

  function loadMap(quiet) {
    var json = localStorage.getItem("architectMap");
    if (!json) {
      if (!quiet) setStatus("Nessun salvataggio");
      return;
    }
    try {
      var arr = JSON.parse(json);
      resetMap();
      arr.forEach(function (entry) {
        if (!entry || !entry.file) return;
        loader.load(
          "models/" + entry.file,
          function (gltf) {
            var mesh = gltf.scene;
            mesh.position.set(entry.position.x, entry.position.y, entry.position.z);
            mesh.rotation.set(entry.rotation.x, entry.rotation.y, entry.rotation.z);
            mesh.scale.set(entry.scale.x, entry.scale.y, entry.scale.z);
            mesh.userData = mesh.userData || {};
            mesh.userData.sourceFile = entry.file;
            mesh.userData.collidable = !!entry.collidable;
            ctx.scene.add(mesh);
            placedMeshes.push(mesh);
            syncCollision(mesh);
          }
        );
      });
      mapLoaded = true;
      if (!quiet) setStatus("Mappa caricata");
    } catch (e) {
      console.warn("Architect load error", e);
      setStatus("Errore caricamento");
    }
  }

  function loadMapMeta() {
    try {
      var raw = localStorage.getItem("architectMapMeta");
      mapMeta = raw ? JSON.parse(raw) : {};
    } catch (e) {
      mapMeta = {};
    }
  }

  function clearArchitectMap() {
    try {
      localStorage.removeItem("architectMap");
      mapMeta = {};
      mapLoaded = false;
      resetMap();
      setStatus("Mappa azzerata");
    } catch (e) {
      console.warn("Architect clear error", e);
    }
  }

  function resetMap() {
    placedMeshes.forEach(function (m) {
      if (m.parent) m.parent.remove(m);
      unregisterCollision(m);
    });
    placedMeshes = [];
    selectedMesh = null;
    setScaleInputs(1);
    setStatus("Reset eseguito");
  }

  function setStatus(msg) {
    if (statusLabel) statusLabel.textContent = msg;
  }

  function showShortcuts(flag) {
    var el = document.getElementById("shortcut-hud");
    if (!el) return;
    if (flag) {
      el.innerHTML = '<div class="shortcut-title">SCORCIATOIE</div><ul>' +
        '<li>F2: entra/uscita Architect Mode</li>' +
        '<li>E: piazza</li>' +
        '<li>Q: elimina</li>' +
        '<li>SHIFT: libera mouse</li>' +
        '<li>Frecce: muovi in griglia</li>' +
        '<li>Slider: scala / rotazione</li>' +
        '<li>Salva: persiste la mappa</li>' +
      '</ul>';
    } else {
      el.innerHTML = '<div class="shortcut-title">SCORCIATOIE</div><ul>' +
        '<li>WASD: muovi</li>' +
        '<li>SPAZIO: salta</li>' +
        '<li>Mouse1/Q: spara</li>' +
        '<li>E: interagisci / raccogli</li>' +
        '<li>R: ricarica</li>' +
        '<li>TAB: inventario</li>' +
        '<li>F2: entra in Architect Mode</li>' +
      '</ul>';
    }
    el.style.display = "block";
  }

  window.RSG.ui.architect = {
    init: init,
    setActive: setActive,
    update: update,
    clearArchitectMap: clearArchitectMap,
  };
  window.clearArchitectMap = clearArchitectMap;
})();
