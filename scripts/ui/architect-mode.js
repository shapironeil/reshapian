// UI: Architect Mode (in-game scene editor)
// Provides basic toggle, asset selection, placement, and nudge controls.

window.RSG = window.RSG || {};
window.RSG.ui = window.RSG.ui || {};

(function () {
  console.log("📐 architect-mode.js caricato");
  var ctx = null;
  var isActive = false;
  var loader = null;
  var panel = null;
  var assetSelect = null;
  var statusLabel = null;
  var selectedLabel = null;
  var selectedMesh = null;
  var placedMeshes = [];
  var raycaster = null;
  var pointer = null;
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
  var browserContent = null; // container del file browser
  var isDragging = false;
  var isShiftSelecting = false;
  var dragPlane = null;
  var dragOffset = null;
  var dragStartY = 0;
  var axisDrag = null;

  var DOUBLE_CLICK_PAUSE_MS = 500;
  var lastDoubleClick = 0;

  var defaultsStore = {};
  var mapMeta = {};

  function setTypingArchitect(flag) {
    if (ctx && ctx.state && ctx.state.ui) {
      ctx.state.ui.isTypingArchitect = !!flag;
    }
    if (flag) {
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
      if (ctx && ctx.state && ctx.state.input) {
        ctx.state.input.moveForward = false;
        ctx.state.input.moveBackward = false;
        ctx.state.input.moveLeft = false;
        ctx.state.input.moveRight = false;
      }
    }
  }

  var SNAP_POS = 0.25;
  var PLACE_DISTANCE = 5;

  function markSelectableTree(root, sourceFile) {
    if (!root) return;
    var file = sourceFile || (root.userData && root.userData.sourceFile) || null;
    try {
      root.userData = root.userData || {};
      root.userData._architectRoot = true;
      root.traverse(function (obj) {
        if (!obj) return;
        obj.userData = obj.userData || {};
        obj.userData._architectSelectable = true;
        if (file && !obj.userData.sourceFile) {
          obj.userData.sourceFile = file;
        }
      });
    } catch (e) {
      // Fallback: almeno marca il root
      root.userData = root.userData || {};
      root.userData._architectRoot = true;
      root.userData._architectSelectable = true;
      if (file && !root.userData.sourceFile) root.userData.sourceFile = file;
    }
  }

  function updatePointerFromEvent(event) {
    var rect = null;
    try {
      if (ctx && ctx.renderer && ctx.renderer.domElement && typeof ctx.renderer.domElement.getBoundingClientRect === "function") {
        rect = ctx.renderer.domElement.getBoundingClientRect();
      }
    } catch (e) {
      rect = null;
    }

    var left = rect ? rect.left : 0;
    var top = rect ? rect.top : 0;
    var width = rect ? rect.width : window.innerWidth;
    var height = rect ? rect.height : window.innerHeight;

    if (!width || !height) {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    pointer.x = ((event.clientX - left) / width) * 2 - 1;
    pointer.y = -((event.clientY - top) / height) * 2 + 1;
  }

  function resolveArchitectRootFromNode(node) {
    if (!node) return null;

    // Risali fino a trovare un root marcato, oppure un nodo direttamente sotto la scena
    var cur = node;
    var lastSelectable = null;
    while (cur) {
      if (cur.userData && (cur.userData.sourceFile || cur.userData._architectSelectable)) {
        lastSelectable = cur;
      }
      if (cur.userData && cur.userData._architectRoot) {
        return cur;
      }
      if (ctx && ctx.scene && cur.parent === ctx.scene) {
        // se è child diretto della scena e ha sourceFile, trattalo come root
        if (cur.userData && (cur.userData.sourceFile || cur.userData._architectSelectable)) {
          return cur;
        }
      }
      cur = cur.parent;
    }
    return lastSelectable;
  }

  function findSelectableFromIntersection(obj) {
    var cur = obj;
    while (cur) {
      if (cur.userData && cur.userData.axis) {
        return { kind: "axis", axis: cur.userData.axis };
      }
      if (cur.userData && (cur.userData.sourceFile || cur.userData._architectSelectable)) {
        var root = resolveArchitectRootFromNode(cur);
        return { kind: "mesh", mesh: root || cur };
      }
      cur = cur.parent;
    }
    return null;
  }

  function isPickDebugEnabled() {
    try {
      return localStorage.getItem("architectDebugPick") === "1";
    } catch (e) {
      return false;
    }
  }

  function debugLogPick(intersects) {
    if (!isPickDebugEnabled()) return;
    try {
      var top = (intersects || []).slice(0, 8).map(function (hit) {
        var o = hit && hit.object;
        var name = o && (o.name || o.type) ? (o.name || o.type) : "(no-name)";
        var sf = o && o.userData && o.userData.sourceFile ? o.userData.sourceFile : null;
        var ax = o && o.userData && o.userData.axis ? o.userData.axis : null;
        var root = o ? resolveArchitectRootFromNode(o) : null;
        var rootName = root && (root.name || root.type) ? (root.name || root.type) : null;
        var rootSf = root && root.userData && root.userData.sourceFile ? root.userData.sourceFile : null;
        return {
          name: name,
          type: o ? o.type : null,
          sourceFile: sf,
          axis: ax,
          root: rootName,
          rootSourceFile: rootSf,
          dist: hit ? Math.round(hit.distance * 100) / 100 : null,
        };
      });
      console.log("[ArchitectPick] hits=", intersects ? intersects.length : 0, top);
    } catch (e) {
      // ignore
    }
  }

  function collectArchitectRoots() {
    var roots = [];
    var seen = new Set();
    if (!ctx || !ctx.scene) return roots;
    ctx.scene.traverse(function (obj) {
      if (!obj || !obj.userData) return;
      var isRoot = !!obj.userData._architectRoot;
      // compatibilità: root anche se è child diretto scena con sourceFile
      if (!isRoot && obj.parent === ctx.scene && obj.userData.sourceFile) {
        isRoot = true;
      }
      if (!isRoot) return;
      if (seen.has(obj)) return;
      seen.add(obj);
      roots.push(obj);
    });
    return roots;
  }

  function pickByBoundingBoxes(ray) {
    // Fallback robusto: usa AABB dei root dei modelli
    // Utile quando il raycast geometrico non colpisce sub-mesh (modelli piccoli, collider strani, ecc.)
    if (!ray) return null;
    var roots = collectArchitectRoots();
    if (!roots.length) return null;

    var best = null;
    var bestDist = Infinity;
    var tmpBox = new THREE.Box3();
    var hitPoint = new THREE.Vector3();

    for (var i = 0; i < roots.length; i++) {
      var root = roots[i];
      try {
        tmpBox.setFromObject(root);
        if (!tmpBox.isEmpty() && ray.intersectBox(tmpBox, hitPoint)) {
          var d = ray.origin.distanceTo(hitPoint);
          if (d < bestDist) {
            bestDist = d;
            best = root;
          }
        }
      } catch (e) {
        // ignore single object
      }
    }

    return best;
  }

  function buildRaycastTargets() {
    var list = [];
    var seen = new Set();

    placedMeshes.forEach(function (m) {
      if (m && !seen.has(m)) {
        seen.add(m);
        list.push(m);
      }
    });

    if (ctx && ctx.scene) {
      ctx.scene.traverse(function (obj) {
        if (!obj || !obj.userData || !obj.userData.sourceFile) return;
        // preferisci il root del modello (tipicamente gltf.scene) ma va bene anche il node con sourceFile
        if (!seen.has(obj)) {
          seen.add(obj);
          list.push(obj);
        }
      });
    }

    // Gizmo arrows (se presenti)
    gizmoArrows.forEach(function (a) {
      if (a && !seen.has(a)) {
        seen.add(a);
        list.push(a);
      }
    });

    return list;
  }

  function init(opts) {
    if (!opts || !opts.state || !opts.scene || !opts.camera) {
      console.warn("⚠️ architect-mode: init richiede state, scene, camera");
      return;
    }
    if (!THREE || !THREE.Raycaster || !THREE.Vector2) {
      console.error("❌ architect-mode: THREE non disponibile");
      return;
    }
    raycaster = raycaster || new THREE.Raycaster();
    pointer = pointer || new THREE.Vector2();
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
    // Container principale
    panel = document.createElement("div");
    panel.id = "architect-panel";
    panel.style.display = "none";

    // Layout con file browser a sinistra e controls a destra
    var layout = document.createElement("div");
    layout.className = "architect-layout";
    
    // Pannello sinistro: File Browser
    var leftPanel = document.createElement("div");
    leftPanel.className = "architect-left-panel";
    leftPanel.innerHTML = '<div class="architect-browser-title">OGGETTI</div>';
    browserContent = document.createElement("div");
    browserContent.className = "architect-browser-content";
    buildFileBrowser(browserContent);
    leftPanel.appendChild(browserContent);
    layout.appendChild(leftPanel);

    // Pannello destro: Controls
    var rightPanel = document.createElement("div");
    rightPanel.className = "architect-right-panel";
    
    // Asset select nascosto (usato internamente)
    assetSelect = document.createElement("select");
    assetSelect.className = "architect-select";
    assetSelect.style.display = "none";
    populateAssetList();
    assetSelect.addEventListener("change", function () {
      syncInputsToPresetForAsset(assetSelect.value);
    });
    rightPanel.appendChild(assetSelect);

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

    rightPanel.appendChild(buttons);

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
    rightPanel.appendChild(collidableRow);

    // Scale control (single slider)
    var scaleRow = document.createElement("div");
    scaleRow.className = "architect-scale-row single";
    scaleRow.style.width = "200%"; // doppia larghezza per maggior precisione
    scaleSlider = document.createElement("input");
    scaleSlider.type = "range";
    scaleSlider.min = "0.001";
    scaleSlider.max = "16";
    scaleSlider.step = "0.0001";
    scaleSlider.value = "1";
    scaleSlider.className = "architect-scale-slider";
    scaleSlider.style.width = "100%";
    scaleValueLabel = document.createElement("span");
    scaleValueLabel.className = "architect-scale-value";
    scaleValueLabel.textContent = "1.000x";
    scaleRow.appendChild(scaleSlider);
    scaleRow.appendChild(scaleValueLabel);
    rightPanel.appendChild(scaleRow);

    scaleSlider.addEventListener("input", applyScaleFromInputs);

    var scaleButtons = document.createElement("div");
    scaleButtons.className = "architect-buttons";

    [0.001, 0.01, 0.025, 0.05, 0.25, 0.5, 1.0, 2.0].forEach(function (preset) {
      var b = document.createElement("button");
      b.className = "architect-btn small";
      b.textContent = "x" + preset;
      b.onclick = function () {
        setScaleInputs(preset);
        applyScaleFromInputs();
      };
      scaleButtons.appendChild(b);
    });
    rightPanel.appendChild(scaleButtons);

    var heightButtons = document.createElement("div");
    heightButtons.className = "architect-buttons";
    var zeroHeightBtn = document.createElement("button");
    zeroHeightBtn.className = "architect-btn";
    zeroHeightBtn.textContent = "Porta altezza a 0";
    zeroHeightBtn.onclick = function () {
      if (selectedMesh) {
        selectedMesh.position.y = 0;
        setPositionInputs(selectedMesh);
        syncCollision(selectedMesh);
        updateHelpers();
      }
    };
    heightButtons.appendChild(zeroHeightBtn);
    rightPanel.appendChild(heightButtons);

    // Posizioni manuali rimosse (si usano drag/gizmo)

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
    rightPanel.appendChild(rotRow);

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
    rightPanel.appendChild(rotXRow);

    rotXSlider.addEventListener("input", applyRotationFromInputs);

    [posXInput, posYInput, posZInput, rotSlider, rotXSlider, scaleSlider].forEach(function (inp) {
      if (!inp) return;
      inp.addEventListener("focus", function () { setTypingArchitect(true); });
      inp.addEventListener("blur", function () { setTypingArchitect(false); });
    });

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

    rightPanel.appendChild(persistenceRow);

    statusLabel = document.createElement("div");
    statusLabel.className = "architect-status";
    statusLabel.textContent = "SHIFT+Click=seleziona · E=piazza · Q=elimina · Frecce=sposta";
    rightPanel.appendChild(statusLabel);

    selectedLabel = document.createElement("div");
    selectedLabel.className = "architect-status secondary";
    selectedLabel.textContent = "Nessun elemento";
    rightPanel.appendChild(selectedLabel);

    layout.appendChild(rightPanel);
    panel.appendChild(layout);

    document.body.appendChild(panel);

    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("mousedown", onMouseDown, false);
    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
    // Previene menu contestuale per permettere look con tasto destro
    document.addEventListener("contextmenu", function(e) {
      if (isActive) e.preventDefault();
    }, false);

    console.log("✅ Architect event listeners registrati", {
      keydown: !!onKeyDown,
      mousedown: !!onMouseDown,
      mousemove: !!onMouseMove,
      mouseup: !!onMouseUp
    });

    syncInputsToPresetForAsset(assetSelect.value);
  }

  function buildFileBrowser(container) {
    // Rimosso il doppio click: modalità mouse si gestisce con SHIFT
    var target = container || browserContent;
    if (!target) return;
    while (target.firstChild) target.removeChild(target.firstChild);

    var list = ctx.getAssetList() || [];
    var categories = {
      "🏗️ Edifici e Strutture": [],
      "🌳 Natura": [],
      "🛣️ Strade e Terreno": [],
      "🪑 Arredamenti": [],
      "🔫 Armi": [],
      "👕 Vestiti": [],
      "🚗 Veicoli": [],
      "💻 Elettronica": [],
      "🎭 Oggetti Scena": [],
      "📦 Altro": []
    };

    var seen = {};
    list.forEach(function (item) {
      if (!item || !item.file || seen[item.file]) return;
      seen[item.file] = true;

      var cat = item.category || "altro";
      var fileName = item.file.toLowerCase();
      
      // Usa model-names.js se disponibile per nome user-friendly
      var displayName = item.file.replace(".glb", "").replace(/_/g, " ");
      if (window.RSG && window.RSG.data && window.RSG.data.modelNames) {
        displayName = window.RSG.data.modelNames.getDisplayName(item.file);
      }

      // Edifici e Strutture (case, muri, porte, finestre, ponti)
      if (cat.match(/building|edifici|structure|house|wall|door|window|gate|fence|bridge|barn/i) ||
          fileName.match(/house|building|wall|door|window|gate|fence|bridge|barn|shed/)) {
        categories["🏗️ Edifici e Strutture"].push({ file: item.file, name: displayName });
      }
      // Natura (alberi, piante, rocce, acqua)
      else if (cat.match(/nature|natura|tree|plant|rock|stone|water|flower|bush|grass_patch/i) ||
               fileName.match(/tree|plant|rock|stone|water|flower|bush|leaf|branch/)) {
        categories["🌳 Natura"].push({ file: item.file, name: displayName });
      }
      // Strade e Terreno (strade, marciapiedi, erba, sabbia, path)
      else if (cat.match(/road|street|path|terrain|ground|grass|dirt|sand|pavement|sidewalk/i) ||
               fileName.match(/road|street|path|grass|dirt|sand|pavement|sidewalk|asphalt|concrete_slab/)) {
        categories["🛣️ Strade e Terreno"].push({ file: item.file, name: displayName });
      }
      // Arredamenti
      else if (cat.match(/furniture|arredament|sofa|table|chair|bed|cabinet|desk|shelf/i) ||
               fileName.match(/sofa|couch|table|chair|bed|cabinet|desk|shelf|drawer/)) {
        categories["🪑 Arredamenti"].push({ file: item.file, name: displayName });
      }
      // Armi
      else if (cat.match(/weapon|armi|pistol|rifle|gun|sword|knife|blade/i) ||
               fileName.match(/pistol|rifle|gun|sword|knife|blade|weapon/)) {
        categories["🔫 Armi"].push({ file: item.file, name: displayName });
      }
      // Vestiti
      else if (cat.match(/cloth|vestit|shirt|pants|jacket|dress|hat|helmet|boot/i) ||
               fileName.match(/shirt|pants|jacket|dress|hat|helmet|boot|shoe|glove/)) {
        categories["👕 Vestiti"].push({ file: item.file, name: displayName });
      }
      // Veicoli
      else if (cat.match(/vehicle|veicol|car|bike|motorcycle|truck|boat/i) ||
               fileName.match(/car|bike|motorcycle|truck|boat|vehicle/)) {
        categories["🚗 Veicoli"].push({ file: item.file, name: displayName });
      }
      // Elettronica
      else if (cat.match(/electronic|tv|computer|pc|phone|radio|monitor|screen/i) ||
               fileName.match(/tv|computer|pc|phone|radio|monitor|screen|laptop/)) {
        categories["💻 Elettronica"].push({ file: item.file, name: displayName });
      }
      // Oggetti Scena (decorazioni, props generici)
      else if (cat.match(/decoration|decor|scene|prop|object/i) ||
               fileName.match(/prop|decoration|ornament/)) {
        categories["🎭 Oggetti Scena"].push({ file: item.file, name: displayName });
      }
      // Altro (fallback)
      else {
        categories["📦 Altro"].push({ file: item.file, name: displayName });
      }
    });

    Object.keys(categories).forEach(function (catName) {
      var items = categories[catName];
      if (!items.length) return;

      var folderDiv = document.createElement("div");
      folderDiv.className = "architect-folder";

      var headerDiv = document.createElement("div");
      headerDiv.className = "architect-folder-header";
      headerDiv.textContent = catName + " (" + items.length + ")";
      headerDiv.onclick = function () {
        folderDiv.classList.toggle("collapsed");
      };

      var contentDiv = document.createElement("div");
      contentDiv.className = "architect-folder-content";

      items.forEach(function (item) {
        var itemDiv = document.createElement("div");
        itemDiv.className = "architect-file-item";
        itemDiv.textContent = "📄 " + item.name;
        itemDiv.onclick = function () {
          if (assetSelect) {
            assetSelect.value = item.file;
            syncInputsToPresetForAsset(item.file);
          }
          var selected = browserContent.querySelector(".architect-file-item.selected");
          if (selected) selected.classList.remove("selected");
          itemDiv.classList.add("selected");
        };
        contentDiv.appendChild(itemDiv);
      });

      folderDiv.appendChild(headerDiv);
      folderDiv.appendChild(contentDiv);
      target.appendChild(folderDiv);
    });
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
    if (panel) {
      panel.style.display = isActive ? "flex" : "none";
      panel.style.pointerEvents = isActive ? "auto" : "none";
    }
    console.log("🟣 Architect setActive", { active: isActive });
    if (isActive) {
      ensureMapLoaded(false);
      showShortcuts(true);
      buildFileBrowser();

      // Assicura che tutti gli oggetti già presenti con sourceFile siano selezionabili
      try {
        if (ctx && ctx.scene) {
          ctx.scene.traverse(function (obj) {
            if (!obj || !obj.userData || !obj.userData.sourceFile) return;
            // Marca come root solo il nodo più alto che ha sourceFile (tipicamente gltf.scene)
            if (obj.parent === ctx.scene) {
              markSelectableTree(obj, obj.userData.sourceFile);
            }
          });
        }
      } catch (e) {
        // ignore
      }

      // Ricostruisci lista oggetti piazzati dal contenuto scena (utile dopo reload/hotreload)
      try {
        if (ctx && ctx.scene) {
          var rebuilt = [];
          ctx.scene.traverse(function (obj) {
            if (obj && obj.userData && (obj.userData.sourceFile || obj.userData._architectSelectable)) {
              // Preferisci i root: quelli direttamente figli della scena
              if (obj.parent === ctx.scene) {
                rebuilt.push(obj);
              }
            }
          });
          if (rebuilt.length) {
            placedMeshes = rebuilt;
          }
        }
      } catch (e) {
        // ignore
      }
    } else {
      showShortcuts(false);
    }
    if (ctx && ctx.state && ctx.state.ui) {
      ctx.state.ui.isArchitectMode = isActive;
      ctx.state.mode = isActive ? "architect" : "gameplay";
    }
    if (!isActive) {
      setTypingArchitect(false);
      if (document && document.body) {
        document.body.classList.remove("architect-no-select");
      }
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
        markSelectableTree(mesh, file);
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
    if (document.activeElement && document.activeElement.tagName === "INPUT") return;
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
    console.log("[Architect] onMouseDown evento ricevuto", {
      isActive: isActive,
      target: event.target ? event.target.tagName : null,
      targetId: event.target ? event.target.id : null,
      targetClass: event.target ? event.target.className : null,
      clientX: event.clientX,
      clientY: event.clientY
    });

    if (!isActive) {
      console.log("[Architect] onMouseDown - NON attivo, ignoro");
      return;
    }
    if (!ctx || !ctx.camera || !ctx.scene) {
      console.log("[Architect] onMouseDown - ctx/camera/scene mancanti");
      return;
    }

    // Blocca solo i click SU controlli interattivi (button, input, select, ecc.), 
    // NON su DIV generici del layout che coprono il canvas.
    var targetTag = event.target ? event.target.tagName.toLowerCase() : '';
    var isInteractiveControl = ['button', 'input', 'select', 'textarea', 'a'].indexOf(targetTag) !== -1;
    if (isInteractiveControl) {
      console.log("[Architect] onMouseDown - click su controllo interattivo, ignoro");
      return;
    }

    // In Architect: selezione SOLO in mouse mode (SHIFT premuto)
    var mouseMode = !!(ctx && ctx.state && ctx.state.ui && ctx.state.ui.isMouseMode);
    console.log("[Architect] onMouseDown - isMouseMode:", mouseMode);
    
    if (!mouseMode) {
      console.log("[Architect] onMouseDown - NON in mouse mode (tieni premuto SHIFT)");
      setStatus("⚠️ Tieni premuto SHIFT per selezionare");
      return;
    }

    // Se pointer lock attivo, esci una volta sola (sincronamente)
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch (e) {}
      setStatus("Mouse sbloccato - clicca di nuovo per selezionare");
      return;
    }

    console.log("[Architect] onMouseDown - mouse mode attivo, picking...");
    tryPickAt(event.clientX, event.clientY, event.button);
  }

  function tryPickAt(clientX, clientY, button) {
    if (!isActive) return;
    if (!ctx || !ctx.camera || !ctx.scene) return;
    if (!raycaster || !pointer) return;

    console.log("[Architect] tryPickAt", { clientX: clientX, clientY: clientY, button: button });

    // Aggiorna pointer in NDC
    updatePointerFromEvent({ clientX: clientX, clientY: clientY });
    console.log("[Architect] pointer NDC:", pointer.x, pointer.y);

    // Assicura matrici aggiornate
    try {
      if (ctx.camera) ctx.camera.updateMatrixWorld(true);
      if (ctx.scene) ctx.scene.updateMatrixWorld(true);
    } catch (e) {}

    raycaster.setFromCamera(pointer, ctx.camera);

    // Raycast su tutta la scena
    var intersects = ctx.scene && ctx.scene.children ? raycaster.intersectObjects(ctx.scene.children, true) : [];
    console.log("[Architect] raycast hits:", intersects.length);

    if (intersects && intersects.length > 0) {
      // Stampa i primi 5 hit per debug
      for (var d = 0; d < Math.min(5, intersects.length); d++) {
        var h = intersects[d];
        var o = h.object;
        console.log("  Hit", d, ":", {
          name: o.name || "(no-name)",
          type: o.type,
          sourceFile: o.userData && o.userData.sourceFile,
          _architectSelectable: o.userData && o.userData._architectSelectable,
          _architectRoot: o.userData && o.userData._architectRoot,
          dist: Math.round(h.distance * 100) / 100
        });
      }

      // Cerca il primo oggetto selezionabile
      for (var i = 0; i < intersects.length; i++) {
        var hit = intersects[i];
        var obj = hit.object;

        // Controlla se è un gizmo axis
        if (obj.userData && obj.userData.axis && selectedMesh) {
          console.log("[Architect] Selezionato gizmo axis:", obj.userData.axis);
          startAxisDrag(obj.userData.axis);
          return;
        }

        // Risali la gerarchia cercando un root selezionabile
        var root = resolveArchitectRootFromNode(obj);
        if (root) {
          console.log("[Architect] Root trovato:", {
            name: root.name || "(no-name)",
            sourceFile: root.userData && root.userData.sourceFile
          });
          setSelected(root);
          if (placedMeshes.indexOf(root) === -1) {
            placedMeshes.push(root);
          }
          var fileName = root.userData && root.userData.sourceFile ? root.userData.sourceFile : "oggetto";
          setStatus("✓ Selezionato: " + fileName);
          if (button === 0) {
            startDragFromPointer();
          }
          return;
        }
      }
    }

    // Nessun oggetto selezionabile
    console.log("[Architect] Nessun oggetto selezionabile trovato");
    clearSelection();
    setStatus("✗ Nessun oggetto selezionabile (premi E per piazzare)");
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
    
    // Se esci da mouse mode (SHIFT rilasciato), interrompi drag.
    var mouseMode = !!(ctx && ctx.state && ctx.state.ui && ctx.state.ui.isMouseMode);
    if (!mouseMode) {
      if (axisDrag || isDragging) {
        onMouseUp();
      }
      isShiftSelecting = false;
      return;
    }

    if (axisDrag) {
      updatePointerFromEvent(event);
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

    updatePointerFromEvent(event);
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
    isShiftSelecting = false;
  }

  // Doppio click disabilitato: il mouse libero si gestisce tenendo premuto SHIFT

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
    // Rendi raycastabile anche sui componenti interni dell'ArrowHelper (cone/line)
    gizmoArrows.forEach(function (a) {
      if (!a || !a.userData || !a.userData.axis) return;
      if (a.cone) a.cone.userData.axis = a.userData.axis;
      if (a.line) a.line.userData.axis = a.userData.axis;
    });
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
    var objects = meshes.map(function (m) {
      return {
        file: m.userData && m.userData.sourceFile ? m.userData.sourceFile : "",
        position: { x: m.position.x, y: m.position.y, z: m.position.z },
        rotation: { x: m.rotation.x, y: m.rotation.y, z: m.rotation.z },
        scale: { x: m.scale.x, y: m.scale.y, z: m.scale.z },
        collidable: !!(m.userData && m.userData.collidable),
      };
    });
    
    // Usa worldManager se disponibile
    if (window.RSG && window.RSG.systems && window.RSG.systems.worldManager) {
      var worldManager = window.RSG.systems.worldManager;
      var currentWorldId = worldManager.getCurrentWorld();
      
      // Se non c'è un mondo attivo, creane uno di default
      if (!currentWorldId) {
        console.log("⚠️ Architect: Nessun mondo attivo, ne creo uno nuovo.");
        currentWorldId = worldManager.createWorld("Nuovo Mondo", "empty");
        if (currentWorldId) {
          worldManager.setCurrentWorld(currentWorldId);
        }
      }
      
      if (currentWorldId) {
        var worldData = worldManager.loadWorld(currentWorldId);
        if (!worldData) {
          // Fallback se load fallisce (non dovrebbe succedere se appena creato)
          worldData = { objects: [] };
        }
        worldData.objects = objects;
        if (worldManager.saveWorld(currentWorldId, worldData)) {
          setStatus("Mondo salvato (" + objects.length + " elementi)");
          console.log("✅ Architect: Mondo salvato", currentWorldId);
          return;
        }
      }
    }
    
    // Fallback vecchio sistema
    var json = JSON.stringify(objects, null, 2);
    try {
      localStorage.setItem("architectMap", json);
      localStorage.setItem("architectMapMeta", JSON.stringify(mapMeta || {}));
      setStatus("Mappa salvata (" + objects.length + " elementi)");
      console.log("⚠️ Architect: Usando vecchio sistema localStorage");
    } catch (e) {
      console.warn("Architect save error", e);
      setStatus("Errore salvataggio");
    }
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
    var arr = null;
    
    // Prova a caricare da worldManager
    if (window.RSG && window.RSG.systems && window.RSG.systems.worldManager) {
      var worldManager = window.RSG.systems.worldManager;
      var currentWorldId = worldManager.getCurrentWorld();
      
      if (currentWorldId) {
        var worldData = worldManager.loadWorld(currentWorldId);
        if (worldData && worldData.objects) {
          arr = worldData.objects;
          console.log("✅ Architect: Caricato mondo", currentWorldId, "con", arr.length, "oggetti");
        }
      }
    }
    
    // Fallback vecchio sistema
    if (!arr) {
      var json = localStorage.getItem("architectMap");
      if (!json) {
        if (!quiet) setStatus("Nessun salvataggio");
        return;
      }
      try {
        arr = JSON.parse(json);
        console.log("⚠️ Architect: Usando vecchio sistema localStorage");
      } catch (e) {
        console.warn("Architect load error", e);
        if (!quiet) setStatus("Errore caricamento");
        return;
      }
    }
    
    if (!arr || !arr.length) {
      if (!quiet) setStatus("Nessun oggetto da caricare");
      return;
    }
    
    try {
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
            markSelectableTree(mesh, entry.file);
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
    // Tab scorciatoie disattivato
    el.innerHTML = "";
    el.style.display = "none";
  }

  window.RSG.ui.architect = {
    init: init,
    setActive: setActive,
    update: update,
    clearArchitectMap: clearArchitectMap,
  };
  window.clearArchitectMap = clearArchitectMap;
})();
