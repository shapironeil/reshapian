console.log("📦 game.js caricato!");

// Namespace unico per evitare globals casuali
window.RSG = window.RSG || {};
window.RSG.state = window.RSG.state || {};

// ==================== ADVANCED EQUIPMENT SYSTEM GLOBALS ====================
var inventoryUI = null; // Istanza di InventoryUI
var equipmentManager = null; // Istanza di EquipmentManager

function createInitialState() {
  return {
    // Modalità UI principale: riduce if-soup (per ora manteniamo anche i flag legacy)
    mode: "gameplay",
    engine: {
      scene: null,
      camera: null,
      renderer: null,
      lastTime: 0,
      isGameRunning: false,
    },
    input: {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
    },
    player: {
      canJump: true,
      velocity: { x: 0, y: 0, z: 0 },
      hasGun: false,
      heldWeapon: null,
      health: 100,
    },
    ui: {
      isUsingPC: false,
      isInDialogue: false,
      isInventoryOpen: false,
      currentDetailItem: null,
    },
    settings: {
      mouseSensitivity: 1.0,
    },
    world: {
      models: [],
      movingAnimals: [],
      characters: [],
      interactables: [],
      collisionObjects: [],
      bullets: [],
      staticTargets: [],
      robotData: null,
    },
    inventory: {
      items: [], // { id, name, type, modelRef, amount? }
      max: 10,
      equipped: {
        head: null,
        chest: null,
        leftHand: null,
        rightHand: null,
      },
    },
    // New advanced equipment system
    playerInventory: (function() {
      // Initialize from ItemRegistry if available
      if (typeof window.ItemRegistry !== 'undefined' && window.ItemRegistry.getAllItems) {
        // For demo: add first few items
        var items = window.ItemRegistry.getAllItems().slice(0, 4);
        return items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          damage: item.damage || 0,
          defense: item.defense || 0,
          weight: item.weight,
          rarity: item.rarity,
          description: item.description,
          modelFile: item.modelFile,
          icon: item.icon
        }));
      }
      // Fallback hardcoded items
      return [
        { id: 'pistol_beretta', name: 'Beretta 92FS', type: 'weapon', damage: 15, weight: 0.9, rarity: 'Common', description: 'Reliable sidearm', modelFile: 'models/pistol_beretta.glb' },
        { id: 'rifle_ak47', name: 'AK-47', type: 'weapon', damage: 30, weight: 3.6, rarity: 'Uncommon', description: 'Powerful assault rifle', modelFile: 'models/rifle_ak47.glb' },
      ];
    })(),
    equippedItems: {
      'head': null,
      'torso': null,
      'left-hand': null,
      'right-hand': null,
      'back': null,
      'legs': null,
      'feet': null,
    },
    combat: {
      isReloading: false,
      reloadDuration: 2.5,
    },
    environment: {
      currentEnvironmentId: null,
      selectedEnvironmentId: null,
      isSwitching: false,
      lights: null,
    },
  };
}

function isGameplayMode() {
  // In futuro useremo solo state.mode; per ora supportiamo i flag legacy.
  if (!state) return true;
  if (state.mode && state.mode !== "gameplay") return false;
  if (state.ui && (state.ui.isUsingPC || state.ui.isInDialogue || state.ui.isInventoryOpen)) return false;
  return true;
}

// Stato runtime: ricreato a ogni startGame
var state = (window.RSG.state.current = window.RSG.state.current || createInitialState());

// --- Back-compat: manteniamo i nomi esistenti, ma la proprietà “vera” vive in state.* ---
// Engine
var scene = state.engine.scene;
var camera = state.engine.camera;
var renderer = state.engine.renderer;
var lastTime = state.engine.lastTime;
var isGameRunning = state.engine.isGameRunning;

// Input
var moveForward = state.input.moveForward;
var moveBackward = state.input.moveBackward;
var moveLeft = state.input.moveLeft;
var moveRight = state.input.moveRight;

// Player
var canJump = state.player.canJump;
var velocity = state.player.velocity;
var hasGun = state.player.hasGun;
var heldWeapon = state.player.heldWeapon;

// UI
var isUsingPC = state.ui.isUsingPC;
var isInDialogue = state.ui.isInDialogue;
var isInventoryOpen = state.ui.isInventoryOpen;
var currentDetailItem = state.ui.currentDetailItem;

// Settings
var mouseSensitivity = state.settings.mouseSensitivity;

// World collections
var models = state.world.models;
var movingAnimals = state.world.movingAnimals;
var characters = state.world.characters;
var interactables = state.world.interactables;
var collisionObjects = state.world.collisionObjects;
var bullets = state.world.bullets;
var staticTargets = state.world.staticTargets;
var robotData = state.world.robotData;

// Inventory
var inventory = state.inventory.items;
var MAX_INVENTORY = state.inventory.max;
var equipped = state.inventory.equipped;

// Armi e munizioni (static defs vengono dal modulo gameplay/weapons)
var weaponData = (window.RSG && window.RSG.gameplay && window.RSG.gameplay.weapons && window.RSG.gameplay.weapons.getWeaponDefs()) || {};
var ammotypes = (window.RSG && window.RSG.gameplay && window.RSG.gameplay.weapons && window.RSG.gameplay.weapons.getAmmoDefs()) || {};

var isReloading = state.combat.isReloading;
var reloadDuration = state.combat.reloadDuration; // secondi
// currentDetailItem vive in state.ui (vedi bind sopra)

// Costanti
var PLAYER_HEIGHT = 1.7;
var MOVE_SPEED = 10.0;
var LOOK_SPEED = 0.002;
var JUMP_VELOCITY = 8.0;
var GRAVITY = 20.0;
var MODEL_GLOBAL_SCALE = 0.01; // riduce le dimensioni di tutti i modelli (~1/100)
var INTERACT_DISTANCE = 2.0;
var PLAYER_RADIUS = 0.5;
var BULLET_SPEED = 80.0;
var BULLET_MAX_DISTANCE = 200.0;

// Funzione globale per avviare il gioco
window.startGame = function () {
  if (isGameRunning) {
    console.log("⚠️ Gioco già in esecuzione");
    return;
  }

  console.log("🎮 ========== AVVIO GIOCO ==========");
  // Ricrea lo stato a ogni nuova partita (evita accumuli tra start/stop)
  state = window.RSG.state.current = createInitialState();

  // Re-bind variabili legacy alla nuova istanza di stato
  scene = state.engine.scene;
  camera = state.engine.camera;
  renderer = state.engine.renderer;
  lastTime = state.engine.lastTime;
  isGameRunning = state.engine.isGameRunning;

  moveForward = state.input.moveForward;
  moveBackward = state.input.moveBackward;
  moveLeft = state.input.moveLeft;
  moveRight = state.input.moveRight;

  canJump = state.player.canJump;
  velocity = state.player.velocity;
  hasGun = state.player.hasGun;
  heldWeapon = state.player.heldWeapon;

  isUsingPC = state.ui.isUsingPC;
  isInDialogue = state.ui.isInDialogue;
  isInventoryOpen = state.ui.isInventoryOpen;
  currentDetailItem = state.ui.currentDetailItem;

  mouseSensitivity = state.settings.mouseSensitivity;

  models = state.world.models;
  lastTime = state.engine.lastTime;
  movingAnimals = state.world.movingAnimals;
  characters = state.world.characters;
  interactables = state.world.interactables;
  collisionObjects = state.world.collisionObjects;
  bullets = state.world.bullets;
  staticTargets = state.world.staticTargets;
  robotData = state.world.robotData;

  inventory = state.inventory.items;
  MAX_INVENTORY = state.inventory.max;
  equipped = state.inventory.equipped;

  isReloading = state.combat.isReloading;
  reloadDuration = state.combat.reloadDuration;
  playerHealth = state.player.health;

  // Avvio effettivo
  state.mode = "gameplay";
  state.engine.isGameRunning = true;
  isGameRunning = true;
  state.player.canJump = true;
  canJump = true;
  state.engine.lastTime = performance.now();
  lastTime = state.engine.lastTime;

  initThreeJS();
  initEnvironmentSystem();
  applyEnvironmentSelection();
  animate();

  console.log("✅ ========== GIOCO AVVIATO ==========");
};

// Funzione globale per fermare il gioco fhntdnrthn
window.stopGame = function () {
  isGameRunning = false;
  document.exitPointerLock();

  if (window.RSG && window.RSG.systems && window.RSG.systems.environment && typeof window.RSG.systems.environment.teardownCurrent === "function") {
    window.RSG.systems.environment.teardownCurrent();
  }

  // Evita accumulo di listener tra run
  window.removeEventListener("resize", onWindowResize);

  // Pulisci listener input (evita duplicazioni tra start/stop)
  if (window.RSG && window.RSG.systems && window.RSG.systems.input) {
    window.RSG.systems.input.dispose();
  }

  if (renderer) {
    renderer.dispose();
    var gameCanvas = document.getElementById("game-canvas");
    while (gameCanvas.firstChild) {
      gameCanvas.removeChild(gameCanvas.firstChild);
    }
  }
};

function initThreeJS() {
  console.log("🚀 Inizializzazione Three.js...");

  if (typeof THREE === "undefined") {
    console.error("❌ THREE.js non trovato!");
    alert("Errore: Three.js non caricato.");
    return false;
  }

  console.log("✅ THREE.js versione:", THREE.REVISION);

  // Scena
  state.engine.scene = new THREE.Scene();
  scene = state.engine.scene;
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 50, 300);

  // Camera prima persona
  var container = document.getElementById("game-canvas");
  var width = container.clientWidth || window.innerWidth;
  var height = container.clientHeight || window.innerHeight;

  state.engine.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera = state.engine.camera;
  camera.position.set(0, PLAYER_HEIGHT, 10);
  camera.rotation.order = "YXZ";

  // Renderer
  state.engine.renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer = state.engine.renderer;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Illuminazione
  var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // Luce riempimento
  var fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-50, 30, -50);
  scene.add(fillLight);

  // Conserva riferimenti per tuning per-ambiente
  if (state && state.environment) {
    state.environment.lights = {
      ambient: ambientLight,
      directional: directionalLight,
      fill: fillLight,
    };
  }

  // Controlli
  setupControls();

  // Sistema movimento/collisioni
  setupMovementSystem();

  // Sistema proiettili/armi
  setupProjectilesSystem();

  // Sistema inventario (runtime logic)
  setupInventorySystem();

  // Sistema interazioni (prompt + routing PC/dialogo/pickup)
  setupInteractionsSystem();

  // Sistema AI (animali + robot follow)
  setupAISystem();

  window.addEventListener("resize", onWindowResize);

  console.log("✅ Three.js inizializzato");
  return true;
}

function setupMovementSystem() {
  if (!window.RSG || !window.RSG.systems || !window.RSG.systems.movement) {
    console.warn("⚠️ Movement system non disponibile (scripts/systems/movement.js non caricato?)");
    return;
  }

  window.RSG.systems.movement.init({
    state: state,
    getCamera: function () {
      return camera;
    },
    resolveCollisions: resolveCollisions,
    isGameplayMode: isGameplayMode,
    constants: {
      MOVE_SPEED: MOVE_SPEED,
      GRAVITY: GRAVITY,
      PLAYER_HEIGHT: PLAYER_HEIGHT,
    },
  });
}

function setupInventorySystem() {
  console.log("🔧 setupInventorySystem() chiamato");
  console.log("📋 EquipmentManager disponibile?", typeof EquipmentManager !== 'undefined');
  console.log("📋 InventoryUI disponibile?", typeof InventoryUI !== 'undefined');
  console.log("📋 ItemRegistry disponibile?", typeof window.ItemRegistry !== 'undefined');

  if (!window.RSG || !window.RSG.gameplay || !window.RSG.gameplay.inventory) {
    console.warn("⚠️ Inventory system legacy non disponibile (scripts/gameplay/inventory.js non caricato?)");
    return;
  }

  window.RSG.gameplay.inventory.init({
    state: state,
    ui: window.RSG && window.RSG.ui ? window.RSG.ui : null,
    getCamera: function () {
      return camera;
    },
    onEquipWeapon: function (item, model) {
      hasGun = !!item;
      if (state && state.player) state.player.hasGun = !!item;
      heldWeapon = model || null;
      if (state && state.player) state.player.heldWeapon = heldWeapon;
    },
  });

  // ==================== ADVANCED EQUIPMENT SYSTEM ====================
  // Initialize EquipmentManager (3D rendering)
  if (typeof EquipmentManager !== 'undefined') {
    // Usa la camera come riferimento di posizione per gli oggetti equipaggiati (prima persona)
    equipmentManager = new EquipmentManager(scene, camera, camera || camera.parent || {
      position: new THREE.Vector3()
    });
    
    // Register all models from ItemRegistry
    if (typeof window.ItemRegistry !== 'undefined') {
      window.ItemRegistry.registerAllModels(equipmentManager);
      console.log("✅ EquipmentManager inizializzato con modelli registrati");
    } else {
      console.warn("⚠️ ItemRegistry non disponibile (scripts/data/item-registry.js non caricato?)");
    }
    // Make available globally for debugging
    window.debugEquipmentManager = equipmentManager;
  } else {
    console.warn("⚠️ EquipmentManager class non disponibile");
  }

  // Initialize InventoryUI (UI interactions)
  if (typeof InventoryUI !== 'undefined') {
    inventoryUI = new InventoryUI(state, equipmentManager);
    console.log("✅ InventoryUI inizializzato");
    // Make available globally for debugging
    window.debugInventoryUI = inventoryUI;
  } else {
    console.warn("⚠️ InventoryUI class non disponibile");
  }
}

function setupProjectilesSystem() {
  if (!window.RSG || !window.RSG.systems || !window.RSG.systems.projectiles) {
    console.warn("⚠️ Projectiles system non disponibile (scripts/systems/projectiles.js non caricato?)");
    return;
  }

  window.RSG.systems.projectiles.init({
    state: state,
    getCamera: function () {
      return camera;
    },
    getScene: function () {
      return scene;
    },
    getModels: function () {
      return models;
    },
    getStaticTargets: function () {
      return staticTargets;
    },
    getCharacters: function () {
      return characters;
    },
    getMovingAnimals: function () {
      return movingAnimals;
    },
    constants: {
      BULLET_SPEED: BULLET_SPEED,
      BULLET_MAX_DISTANCE: BULLET_MAX_DISTANCE,
      GRAVITY: GRAVITY,
      PLAYER_RADIUS: PLAYER_RADIUS,
    },
    ui: window.RSG && window.RSG.ui ? window.RSG.ui : null,
    updateInventoryUI: function () {
      updateInventoryUI();
    },
  });
}

function setupInteractionsSystem() {
  if (!window.RSG || !window.RSG.systems || !window.RSG.systems.interactions) {
    console.warn("⚠️ Interactions system non disponibile (scripts/systems/interactions.js non caricato?)");
    return;
  }

  window.RSG.systems.interactions.init({
    state: state,
    getCamera: function () {
      return camera;
    },
    ui: window.RSG && window.RSG.ui ? window.RSG.ui : {},
    updateInventoryUI: function () {
      updateInventoryUI();
    },
    isGameplayMode: isGameplayMode,
    constants: {
      INTERACT_DISTANCE: INTERACT_DISTANCE,
    },
  });
}

function setupAISystem() {
  if (!window.RSG || !window.RSG.systems || !window.RSG.systems.ai) {
    console.warn("⚠️ AI system non disponibile (scripts/systems/ai.js non caricato?)");
    return;
  }

  window.RSG.systems.ai.init({
    state: state,
    getCamera: function () {
      return camera;
    },
    constants: {
      GRAVITY: GRAVITY,
    },
  });
}

function createEnvironment() {
  console.log("🌍 Creazione ambiente 3D...");

  // Pavimento esterno (giardino / cortile)
  var floorGeometry = new THREE.PlaneGeometry(200, 200);
  var floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x4c8c4a,
    roughness: 0.8,
  });
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Griglia
  var gridHelper = new THREE.GridHelper(200, 40, 0x000000, 0x444444);
  scene.add(gridHelper);

  // Pavimento interno della casa (legno) nella zona centrale
  var houseFloorGeometry = new THREE.PlaneGeometry(40, 30);
  var houseFloorMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    roughness: 0.7,
  });
  var houseFloor = new THREE.Mesh(houseFloorGeometry, houseFloorMaterial);
  houseFloor.rotation.x = -Math.PI / 2;
  houseFloor.position.set(0, 0.02, 0);
  houseFloor.receiveShadow = true;
  scene.add(houseFloor);

  // Pareti perimetrali per creare un grande edificio che contiene la casa
  var wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe8d4b8 });

  // Parete nord
  var wallGeometry = new THREE.BoxGeometry(200, 10, 2);
  var wallNorth = new THREE.Mesh(wallGeometry, wallMaterial);
  wallNorth.position.set(0, 5, -100);
  wallNorth.castShadow = true;
  wallNorth.receiveShadow = true;
  scene.add(wallNorth);

  // Parete sud
  var wallSouth = new THREE.Mesh(wallGeometry, wallMaterial);
  wallSouth.position.set(0, 5, 100);
  wallSouth.castShadow = true;
  wallSouth.receiveShadow = true;
  scene.add(wallSouth);

  // Parete ovest
  var wallGeometry2 = new THREE.BoxGeometry(2, 10, 200);
  var wallWest = new THREE.Mesh(wallGeometry2, wallMaterial);
  wallWest.position.set(-100, 5, 0);
  wallWest.castShadow = true;
  wallWest.receiveShadow = true;
  scene.add(wallWest);

  // Parete est
  var wallEast = new THREE.Mesh(wallGeometry2, wallMaterial);
  wallEast.position.set(100, 5, 0);
  wallEast.castShadow = true;
  wallEast.receiveShadow = true;
  scene.add(wallEast);
  // Rimuovere la parete interna per un soggiorno aperto

  // Muri perimetrali della casa (più bassi, attorno al pavimento interno)
  var houseWallMaterial = new THREE.MeshStandardMaterial({ color: 0xd9c1a5 });

  // Parete posteriore della casa
  var houseBackWallGeometry = new THREE.BoxGeometry(40, 3, 0.5);
  var houseBackWall = new THREE.Mesh(houseBackWallGeometry, houseWallMaterial);
  houseBackWall.position.set(0, 1.5, -15);
  houseBackWall.castShadow = true;
  houseBackWall.receiveShadow = true;
  scene.add(houseBackWall);

  // Pareti laterali della casa
  var houseSideWallGeometry = new THREE.BoxGeometry(0.5, 3, 30);

  var houseLeftWall = new THREE.Mesh(houseSideWallGeometry, houseWallMaterial);
  houseLeftWall.position.set(-20, 1.5, 0);
  houseLeftWall.castShadow = true;
  houseLeftWall.receiveShadow = true;
  scene.add(houseLeftWall);

  var houseRightWall = new THREE.Mesh(houseSideWallGeometry, houseWallMaterial);
  houseRightWall.position.set(20, 1.5, 0);
  houseRightWall.castShadow = true;
  houseRightWall.receiveShadow = true;
  scene.add(houseRightWall);

  // Parete frontale divisa in due segmenti per lasciare un'apertura (porta)
  var houseFrontWallGeometry = new THREE.BoxGeometry(18, 3, 0.5);

  var houseFrontWallLeft = new THREE.Mesh(houseFrontWallGeometry, houseWallMaterial);
  houseFrontWallLeft.position.set(-11, 1.5, 15);
  houseFrontWallLeft.castShadow = true;
  houseFrontWallLeft.receiveShadow = true;
  scene.add(houseFrontWallLeft);

  var houseFrontWallRight = new THREE.Mesh(houseFrontWallGeometry, houseWallMaterial);
  houseFrontWallRight.position.set(11, 1.5, 15);
  houseFrontWallRight.castShadow = true;
  houseFrontWallRight.receiveShadow = true;
  scene.add(houseFrontWallRight);

  // Tavolo semplice nel "studio" con il PC sopra
  var tableMaterial = new THREE.MeshStandardMaterial({ color: 0xc2a383, roughness: 0.6 });

  // Piano del tavolo
  var tableTopGeometry = new THREE.BoxGeometry(4.5, 0.1, 2.0);
  var tableTop = new THREE.Mesh(tableTopGeometry, tableMaterial);
  tableTop.position.set(10, 1, -5);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  scene.add(tableTop);

  // Gambe del tavolo
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
    scene.add(leg);
  });

  // Registra superfici statiche come bersagli per i proiettili
  staticTargets.push(
    floor,
    houseFloor,
    wallNorth,
    wallSouth,
    wallWest,
    wallEast,
    houseBackWall,
    houseLeftWall,
    houseRightWall,
    houseFrontWallLeft,
    houseFrontWallRight,
    tableTop
  );

  console.log("✅ Ambiente creato");
}

function loadModels(modelListOverride) {
  console.log("📦 Caricamento modelli 3D...");
  if (!window.RSG || !window.RSG.content || !window.RSG.content.models) {
    console.error("❌ content/models non disponibile");
    return;
  }
  if (!window.RSG.systems || !window.RSG.systems.modelLoader) {
    console.error("❌ systems/model-loader non disponibile");
    return;
  }

  var furniture = modelListOverride || window.RSG.content.models.getFurniture();
  window.RSG.systems.modelLoader.loadAll({
    scene: scene,
    state: state,
    modelList: furniture,
    constants: { MODEL_GLOBAL_SCALE: MODEL_GLOBAL_SCALE },
    onProgress: function (count, total, file) {
      console.log("✅ Caricato:", file, "(" + count + "/" + total + ")");
    },
    onError: function (err, file) {
      console.warn("⚠️ Errore caricamento", file);
    },
  });
}

// Ambiente: wiring con registry/switch
function initEnvironmentSystem() {
  if (!window.RSG || !window.RSG.systems || !window.RSG.systems.environment) {
    console.warn("⚠️ Environment system non disponibile (scripts/systems/environment.js non caricato?)");
    return;
  }

  window.RSG.systems.environment.init({
    state: state,
    getScene: function () {
      return scene;
    },
    getCamera: function () {
      return camera;
    },
    loadModels: loadModels,
  });

  // Selezione predefinita: usa ultimo valore memorizzato o default da registry
  var envSystem = window.RSG.systems.environment;
  if (envSystem && typeof envSystem.getDefaultEnvironmentId === "function") {
    if (!state.environment.selectedEnvironmentId) {
      state.environment.selectedEnvironmentId = envSystem.getDefaultEnvironmentId();
    }
  }
}

function applyEnvironmentSelection() {
  var envSystem = window.RSG && window.RSG.systems ? window.RSG.systems.environment : null;
  if (!envSystem || typeof envSystem.applySelectedEnvironment !== "function") {
    // Fallback legacy: crea ambiente statico
    createEnvironment();
    loadModels();
    return;
  }
  envSystem.applySelectedEnvironment();
}

window.listEnvironments = function () {
  var envSystem = window.RSG && window.RSG.systems ? window.RSG.systems.environment : null;
  if (!envSystem || typeof envSystem.listEnvironments !== "function") return [];
  return envSystem.listEnvironments();
};

window.setEnvironment = function (id) {
  var envSystem = window.RSG && window.RSG.systems ? window.RSG.systems.environment : null;
  if (!envSystem || typeof envSystem.selectEnvironment !== "function") return;
  envSystem.selectEnvironment(id);
};

window.getActiveEnvironment = function () {
  var envSystem = window.RSG && window.RSG.systems ? window.RSG.systems.environment : null;
  if (!envSystem || typeof envSystem.getActiveEnvironment !== "function") return null;
  return envSystem.getActiveEnvironment();
};

function setupControls() {
  if (!window.RSG || !window.RSG.systems || !window.RSG.systems.input) {
    console.warn("⚠️ Input system non disponibile (scripts/systems/input.js non caricato?)");
    return;
  }

  // Allinea state con le variabili legacy prima di inizializzare
  if (state && state.input) {
    state.input.moveForward = !!moveForward;
    state.input.moveBackward = !!moveBackward;
    state.input.moveLeft = !!moveLeft;
    state.input.moveRight = !!moveRight;
  }
  if (state && state.player) {
    state.player.canJump = !!canJump;
    state.player.velocity = velocity;
    state.player.hasGun = !!hasGun;
    state.player.heldWeapon = heldWeapon;
  }
  if (state && state.settings) {
    state.settings.mouseSensitivity = mouseSensitivity;
  }
  if (state && state.ui) {
    state.ui.isUsingPC = !!isUsingPC;
    state.ui.isInDialogue = !!isInDialogue;
    state.ui.isInventoryOpen = !!isInventoryOpen;
  }

  window.RSG.systems.input.init({
    state: state,
    getCamera: function () {
      return camera;
    },
    constants: {
      LOOK_SPEED: LOOK_SPEED,
      JUMP_VELOCITY: JUMP_VELOCITY,
    },
    actions: {
      shoot: function () {
        // Gate reload/weapon equip here to preserve existing behavior
        if (equipped.rightHand && equipped.rightHand.type === "weapon" && !isReloading) {
          shoot();
        }
      },
      interact: function () {
        if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
          window.RSG.systems.interactions.handleInteract();
        } else {
          handleInteract();
        }
      },
      toggleInventory: function () {
        toggleInventory();
      },
      reload: function () {
        if (equipped.rightHand && equipped.rightHand.type === "weapon" && !isReloading) {
          beginReload();
        }
      },
      closePC: function () {
        if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
          window.RSG.systems.interactions.closePC();
        } else {
          closePC();
        }
      },
      closeDialogue: function () {
        if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
          window.RSG.systems.interactions.closeDialogue();
        } else {
          closeDialogue();
        }
      },
    },
  });
}

function updateMovement(delta) {
  if (!isGameplayMode()) return;
  velocity.y -= GRAVITY * delta;

  // Input: da questo punto in poi lo stato è la sorgente di verità (input system aggiorna state.input)
  // Manteniamo anche i flag legacy sincronizzati durante la transizione.
  if (state && state.input) {
    moveForward = !!state.input.moveForward;
    moveBackward = !!state.input.moveBackward;
    moveLeft = !!state.input.moveLeft;
    moveRight = !!state.input.moveRight;
  }

  var forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);
  forward.y = 0;
  forward.normalize();

  var right = new THREE.Vector3(1, 0, 0);
  right.applyQuaternion(camera.quaternion);
  right.y = 0;
  right.normalize();

  // Calcola nuova posizione proposta
  var newPosition = camera.position.clone();
  if (moveForward) newPosition.addScaledVector(forward, MOVE_SPEED * delta);
  if (moveBackward) newPosition.addScaledVector(forward, -MOVE_SPEED * delta);
  if (moveLeft) newPosition.addScaledVector(right, -MOVE_SPEED * delta);
  if (moveRight) newPosition.addScaledVector(right, MOVE_SPEED * delta);

  // Risolvi le collisioni orizzontali con gli oggetti 3D
  newPosition = resolveCollisions(newPosition);

  camera.position.x = newPosition.x;
  camera.position.z = newPosition.z;

  // Gestione asse verticale (salto / gravità)
  camera.position.y += velocity.y * delta;

  if (camera.position.y <= PLAYER_HEIGHT) {
    camera.position.y = PLAYER_HEIGHT;
    velocity.y = 0;
    canJump = true;
  }

  camera.position.x = Math.max(-95, Math.min(95, camera.position.x));
  camera.position.z = Math.max(-95, Math.min(95, camera.position.z));
}

function resolveCollisions(newPosition) {
  if (!collisionObjects.length) return newPosition;

  var corrected = newPosition.clone();

  collisionObjects.forEach(function (obj) {
    if (!obj.model || typeof obj.radius !== "number") return;

    var objPos = obj.model.position;
    var dx = corrected.x - objPos.x;
    var dz = corrected.z - objPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var minDist = (obj.radius || 0) + PLAYER_RADIUS;

    if (dist > 0 && dist < minDist) {
      var overlap = minDist - dist;
      var nx = dx / dist;
      var nz = dz / dist;
      corrected.x += nx * overlap;
      corrected.z += nz * overlap;
    }
  });

  return corrected;
}

function updateBullets(delta) {
  if (!bullets.length || !scene) return;

  var toRemove = [];

  bullets.forEach(function (bullet, index) {
    if (bullet.stopped) return; // già fermo: buco nella superficie

    var prevPos = bullet.mesh.position.clone();
    var dir = bullet.direction;
    var travel = BULLET_SPEED * delta;
    if (travel <= 0) return;

    if (bullet.remainingDistance <= 0) {
      // è andato troppo lontano, rimuovilo
      if (bullet.mesh.parent) {
        bullet.mesh.parent.remove(bullet.mesh);
      }
      toRemove.push(index);
      return;
    }

    if (travel > bullet.remainingDistance) {
      travel = bullet.remainingDistance;
    }

    var newPos = prevPos.clone().addScaledVector(dir, travel);

    // Raycast tra la posizione precedente e quella nuova
    var raycaster = new THREE.Raycaster(prevPos, dir.clone(), 0, travel);

    var targets = [];
    if (models.length) targets = targets.concat(models);
    if (staticTargets.length) targets = targets.concat(staticTargets);

    var intersects = targets.length ? raycaster.intersectObjects(targets, true) : [];

    if (intersects.length > 0) {
      var hit = intersects[0];
      var hitPoint = hit.point.clone();

      // Trova il modello "root" colpito
      var root = hit.object;
      while (root.parent && root.parent !== scene) {
        root = root.parent;
      }

      var cat = root.userData ? root.userData.category : null;

      if (cat === "animal") {
        // Cerca l'animale corrispondente e uccidilo
        movingAnimals.forEach(function (animal) {
          if (animal.model === root && animal.alive) {
            console.log("🎯 Colpito un animale!");
            animal.alive = false;
            animal.speed = 0;
            animal.verticalSpeed = 0;
          }
        });
      } else if (cat === "character") {
        // Cerca il personaggio e rimuovilo
        for (var i = 0; i < characters.length; i++) {
          if (characters[i].model === root) {
            console.log("💥 Colpito un personaggio!");
            if (root.parent) {
              root.parent.remove(root);
            }
            characters.splice(i, 1);
            break;
          }
        }
      }

      // Ferma il proiettile nel punto di impatto (diventa un buco permanente)
      bullet.mesh.position.copy(hitPoint);
      bullet.stopped = true;
    } else {
      // Nessun impatto: continua a volare
      bullet.mesh.position.copy(newPos);
      bullet.remainingDistance -= travel;

      if (bullet.remainingDistance <= 0) {
        if (bullet.mesh.parent) {
          bullet.mesh.parent.remove(bullet.mesh);
        }
        toRemove.push(index);
      }
    }
  });

  // Rimuovi i proiettili andati troppo lontano
  if (toRemove.length) {
    for (var i = toRemove.length - 1; i >= 0; i--) {
      bullets.splice(toRemove[i], 1);
    }
  }
}

function updateAnimals(delta) {
  if (window.RSG && window.RSG.systems && window.RSG.systems.ai) {
    // delegato al sistema AI
    return;
  }
  if (!movingAnimals.length) return;

  movingAnimals.forEach(function (animal) {
    if (animal.alive) {
      // Movimento circolare finché è vivo
      animal.angle += animal.speed * delta;
      animal.model.position.x = animal.center.x + Math.cos(animal.angle) * animal.radius;
      animal.model.position.z = animal.center.z + Math.sin(animal.angle) * animal.radius;
      if (animal.model.position.y < 0) animal.model.position.y = 0;
    } else {
      // Animale colpito: cade a terra e rimane lì
      if (!animal.hasLanded) {
        animal.verticalSpeed -= GRAVITY * delta;
        animal.model.position.y += animal.verticalSpeed * delta;

        // Ruota lentamente su un fianco mentre cade
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
  if (window.RSG && window.RSG.systems && window.RSG.systems.ai) {
    // delegato al sistema AI
    return;
  }
  if (!robotData || !robotData.model) return;

  // Se il robottino deve seguire il giocatore
  if (robotData.followPlayer && camera) {
    var target = new THREE.Vector3(camera.position.x, robotData.model.position.y, camera.position.z);
    var direction = target.clone().sub(robotData.model.position);
    var distance = direction.length();
    if (distance > 1.2) {
      direction.normalize();
      robotData.model.position.addScaledVector(direction, robotData.speed * delta);
      robotData.model.lookAt(target);
    }
  }
}

function animate() {
  if (!isGameRunning) return;

  requestAnimationFrame(animate);

  var currentTime = performance.now();
  var delta = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  if (state && state.combat) {
    isReloading = !!state.combat.isReloading;
  }
  if (window.RSG && window.RSG.systems && window.RSG.systems.movement) {
    window.RSG.systems.movement.update(delta);
  } else {
    updateMovement(delta);
  }
  if (window.RSG && window.RSG.systems && window.RSG.systems.ai) {
    window.RSG.systems.ai.update(delta);
  } else {
    updateAnimals(delta);
    updateRobot(delta);
  }

  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    window.RSG.systems.interactions.updatePrompts();
  } else {
    updateInteractPrompt();
    updateShootPrompt();
  }
  updateBullets(delta);

  // Update equipped items (3D rendering)
  if (equipmentManager) {
    equipmentManager.updateAllEquipped();
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function updateInteractPrompt() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    // delegato al sistema interazioni
    return;
  }
  if (!window.RSG || !window.RSG.ui || !window.RSG.ui.hud) return;

  if (!isGameplayMode()) {
    window.RSG.ui.hud.setInteractPromptVisible(false);
    return;
  }

  var target = getNearestInteractable();
  if (!target) {
    window.RSG.ui.hud.setInteractPromptVisible(false);
    return;
  }

  var text = "E - Interagisci";
  if (target.id === "pc_laptop") {
    text = "E - Usa PC";
  } else if (target.id === "pistol_beretta" || target.id === "pistol_43") {
    text = "E - Raccogli pistola";
  } else if (target.type === "robot") {
    text = "E - Parla con il robottino";
  }

  window.RSG.ui.hud.setInteractPromptVisible(true, text);
}

function updateShootPrompt() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    // delegato al sistema interazioni
    return;
  }
  if (!window.RSG || !window.RSG.ui || !window.RSG.ui.hud) return;
  var visible = hasGun && isGameplayMode() && document.pointerLockElement;
  window.RSG.ui.hud.setShootPromptVisible(!!visible);
}

function getNearestInteractable() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    // delegato al sistema interazioni
    return null;
  }
  if (!interactables.length || !camera) return null;
  var nearest = null;
  var minDist = INTERACT_DISTANCE;
  var camPos = camera.position;

  interactables.forEach(function (obj) {
    if (!obj.model) return;
    var dist = camPos.distanceTo(obj.model.position);
    if (dist < minDist) {
      minDist = dist;
      nearest = obj;
    }
  });
  return nearest;
}

function handleInteract() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    window.RSG.systems.interactions.handleInteract();
    return;
  }
  if (!isGameplayMode()) return;
  var target = getNearestInteractable();
  if (!target) return;

  if (target.id === "pc_laptop") {
    usePC();
  } else if (target.id === "pistol_beretta" || target.id === "pistol_43") {
    pickupGun(target);
  } else if (target.type === "robot") {
    startDialogue();
  }
}

function pickupGun(target) {
  if (!camera) return;
  if (!target || !target.model) return;

  // Rimuovi la pistola dal mondo
  if (target.model.parent) {
    target.model.parent.remove(target.model);
  }

  // Aggiungi all'inventario (se spazio)
  var itemId = target.id || "pistol";
  var itemName = itemId === "pistol_beretta" ? "Pistola Beretta" : itemId === "pistol_43" ? "Pistola 43 Tactical" : "Pistola";
  if (inventory.length < MAX_INVENTORY) {
    var weaponItem = {
      id: itemId,
      name: itemName,
      type: "weapon",
      modelRef: target.model,
    };
    inventory.push(weaponItem);
    updateInventoryUI();
  } else {
    // Se pieno, scarta a terra (non ri-aggiungiamo alla scena per semplicità)
    console.warn("Inventario pieno: impossibile aggiungere pistola.");
  }

  // Aggiungi anche munizioni
  var ammoId = itemId === "pistol_beretta" || itemId === "pistol_43" ? "pistol_ammo" : "pistol_ammo";
  var existingAmmo = inventory.find(function (x) {
    return x.id === ammoId;
  });
  if (existingAmmo) {
    existingAmmo.amount = (existingAmmo.amount || 0) + 30; // +30 munizioni
  } else {
    if (inventory.length < MAX_INVENTORY) {
      inventory.push({
        id: ammoId,
        name: "Munizioni 9mm",
        type: "ammo",
        amount: 30,
      });
    }
  }

  // Rimuovi dalle interazioni
  interactables = interactables.filter(function (obj) {
    return obj.id !== "pistol_beretta" && obj.id !== "pistol_43";
  });
}

function shoot() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.projectiles) {
    window.RSG.systems.projectiles.shoot();
    return;
  }
  // Effetto semplice di sparo: log + piccolo flash di luce
  if (!equipped.rightHand || equipped.rightHand.type !== "weapon") return;

  var weaponInfo = weaponData[equipped.rightHand.id];
  if (!weaponInfo || weaponInfo.ammo <= 0) {
    console.warn("Nessun proiettile disponibile!");
    return;
  }

  console.log("🔫 SPARO! Colpi rimasti: " + (weaponInfo.ammo - 1) + "/" + weaponInfo.ammoCapacity);
  weaponInfo.ammo -= 1;
  updateInventoryUI();

  if (!camera || !scene) return;

  var flash = new THREE.PointLight(0xffaa00, 2, 5);
  camera.add(flash);
  flash.position.set(0.2, -0.1, -0.5);

  // Crea un proiettile che viaggia in avanti
  var origin = new THREE.Vector3().copy(camera.position);
  var direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion).normalize();

  var bulletGeom = new THREE.SphereGeometry(0.08, 8, 8);
  var bulletMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  var bulletMesh = new THREE.Mesh(bulletGeom, bulletMat);

  // Posiziona il proiettile leggermente davanti alla camera
  var startPos = origin.clone().addScaledVector(direction, 0.8);
  bulletMesh.position.copy(startPos);
  scene.add(bulletMesh);

  bullets.push({
    mesh: bulletMesh,
    direction: direction.clone(),
    remainingDistance: BULLET_MAX_DISTANCE,
    stopped: false,
  });
}

function spawnHitMarker(point) {
  if (!scene || !point) return;

  var geometry = new THREE.SphereGeometry(0.15, 10, 10);
  var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  var marker = new THREE.Mesh(geometry, material);
  marker.position.copy(point);
  scene.add(marker);
}

function toggleInventory() {
  // Usa il nuovo sistema di inventario avanzato
  if (inventoryUI && typeof inventoryUI.toggle === 'function') {
    console.log("🎯 Toggling InventoryUI...");
    inventoryUI.toggle();

    // Aggiorna stato UI e modalità
    isInventoryOpen = !isInventoryOpen;
    if (state && state.ui) {
      state.ui.isInventoryOpen = isInventoryOpen;
      state.mode = isInventoryOpen ? "inventory" : "gameplay";
    }

    // Esci dal pointer lock per mostrare il cursore quando l'inventario è aperto
    if (isInventoryOpen && document.pointerLockElement) {
      document.exitPointerLock();
    }
    return;
  }
  
  // Fallback: sistemi legacy
  if (window.RSG && window.RSG.gameplay && window.RSG.gameplay.inventory) {
    console.log("🎯 Toggling legacy inventory...");
    window.RSG.gameplay.inventory.toggleInventory();
    isInventoryOpen = state.ui ? !!state.ui.isInventoryOpen : isInventoryOpen;
    return;
  }
  // fallback legacy
  console.warn("⚠️ No inventory system available!");
  isInventoryOpen = !isInventoryOpen;
  if (window.RSG && window.RSG.ui && window.RSG.ui.inventory) {
    window.RSG.ui.inventory.toggleOverlay(state, isInventoryOpen);
  }
}

function updateInventoryUI() {
  if (window.RSG && window.RSG.gameplay && window.RSG.gameplay.inventory) {
    window.RSG.gameplay.inventory.render(function (item) {
      showItemDetail(item);
    });
    return;
  }
  if (window.RSG && window.RSG.ui && window.RSG.ui.inventory) {
    window.RSG.ui.inventory.render(state, function (item) {
      showItemDetail(item);
    });
  }
}

function showItemDetail(item) {
  currentDetailItem = item;
  if (state && state.ui) state.ui.currentDetailItem = item;

  if (window.RSG && window.RSG.gameplay && window.RSG.gameplay.inventory) {
    window.RSG.gameplay.inventory.showItemDetail(item, weaponData, function (it) {
      equipRightHand(it);
    });
    return;
  }

  if (window.RSG && window.RSG.ui && window.RSG.ui.inventory) {
    window.RSG.ui.inventory.showItemDetail(item, weaponData, function (it) {
      equipRightHand(it);
    });
  }
}

function equipRightHand(item) {
  if (window.RSG && window.RSG.gameplay && window.RSG.gameplay.inventory) {
    window.RSG.gameplay.inventory.equipRightHand(item);
    hasGun = state.player ? !!state.player.hasGun : hasGun;
    heldWeapon = state.player && state.player.heldWeapon ? state.player.heldWeapon : heldWeapon;
    return;
  }

  // fallback legacy
  var idx = inventory.findIndex(function (x) {
    return x === item;
  });
  if (idx >= 0) inventory.splice(idx, 1);
  if (equipped.rightHand) {
    inventory.push(equipped.rightHand);
    if (equipped.rightHand.modelRef && equipped.rightHand.modelRef.parent === camera) {
      camera.remove(equipped.rightHand.modelRef);
    }
  }
  equipped.rightHand = item;
  updateInventoryUI();
  var model = item.modelRef;
  if (model) {
    camera.add(model);
    model.position.set(0.6, -0.4, -0.9);
    model.rotation.set(0, -Math.PI / 2, 0);
    hasGun = true;
    heldWeapon = model;
    if (state && state.player) state.player.heldWeapon = heldWeapon;
  }
}

// Semplice gestione salute
var playerHealth = state.player.health;
function setPlayerHealth(value) {
  var v = value;
  if (window.RSG && window.RSG.ui && window.RSG.ui.hud) {
    v = window.RSG.ui.hud.setHealth(value);
  } else {
    v = Math.max(0, Math.min(100, value));
  }

  playerHealth = v;
  if (state && state.player) state.player.health = v;
}

function beginReload() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.projectiles) {
    window.RSG.systems.projectiles.beginReload();
    return;
  }
  if (!equipped.rightHand || equipped.rightHand.type !== "weapon") return;
  var weaponInfo = weaponData[equipped.rightHand.id];
  if (!weaponInfo) return;

  // Cerco munizioni nel inventario
  var ammoIdx = inventory.findIndex(function (x) {
    return x.type === "ammo" && x.id === weaponInfo.ammoType;
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

  isReloading = true;
  if (state && state.combat) state.combat.isReloading = true;
  if (window.RSG && window.RSG.ui && window.RSG.ui.hud) {
    window.RSG.ui.hud.setReloadBarVisible(true);
  }

  var startTime = performance.now();
  var originalAmmo = weaponInfo.ammo;

  function updateReload(currentTime) {
    var elapsed = (currentTime - startTime) / 1000;
    var progress = Math.min(elapsed / reloadDuration, 1);
    if (window.RSG && window.RSG.ui && window.RSG.ui.hud) {
      window.RSG.ui.hud.setReloadProgress(progress);
    }

    if (progress >= 1) {
      // Reload completo
      var ammoNeeded = weaponInfo.ammoCapacity - originalAmmo;
      if (ammo.amount >= ammoNeeded) {
        weaponInfo.ammo = weaponInfo.ammoCapacity;
        ammo.amount -= ammoNeeded;
      } else {
        weaponInfo.ammo = originalAmmo + ammo.amount;
        ammo.amount = 0;
      }

      if (ammo.amount <= 0) {
        inventory.splice(ammoIdx, 1);
      }

      isReloading = false;
      if (state && state.combat) state.combat.isReloading = false;
      if (window.RSG && window.RSG.ui && window.RSG.ui.hud) {
        window.RSG.ui.hud.setReloadBarVisible(false);
        window.RSG.ui.hud.setReloadProgress(0);
      }
      updateInventoryUI();
      console.log("✅ Arma ricaricata! Colpi: " + weaponInfo.ammo + "/" + weaponInfo.ammoCapacity);
    } else {
      requestAnimationFrame(updateReload);
    }
  }

  requestAnimationFrame(updateReload);
}

// Inizializza UI inventario e salute all'avvio del gioco
window.addEventListener("load", function () {
  setPlayerHealth(100);
  updateInventoryUI();
});

function usePC() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    window.RSG.systems.interactions.usePC();
    return;
  }
  if (window.RSG && window.RSG.ui && window.RSG.ui.pc) {
    isUsingPC = true;
    if (state && state.ui) state.ui.isUsingPC = true;
    window.RSG.ui.pc.open(state);
  }
}

function closePC() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    window.RSG.systems.interactions.closePC();
    return;
  }
  if (window.RSG && window.RSG.ui && window.RSG.ui.pc) {
    window.RSG.ui.pc.close(state);
  }
  isUsingPC = false;
  if (state && state.ui) state.ui.isUsingPC = false;
}

function setActivePCSection(sectionId) {
  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    window.RSG.systems.interactions.setActivePCSection(sectionId);
    return;
  }
  if (window.RSG && window.RSG.ui && window.RSG.ui.pc) {
    window.RSG.ui.pc.setActiveSection(sectionId);
  }
}

function startDialogue() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    window.RSG.systems.interactions.startDialogue();
    return;
  }
  if (window.RSG && window.RSG.ui && window.RSG.ui.dialogue) {
    isInDialogue = true;
    if (state && state.ui) state.ui.isInDialogue = true;
    window.RSG.ui.dialogue.open(state, robotData);
  }
}

function closeDialogue() {
  if (window.RSG && window.RSG.systems && window.RSG.systems.interactions) {
    window.RSG.systems.interactions.closeDialogue();
    return;
  }
  if (window.RSG && window.RSG.ui && window.RSG.ui.dialogue) {
    window.RSG.ui.dialogue.close(state);
  }
  isInDialogue = false;
  if (state && state.ui) state.ui.isInDialogue = false;
}

function onWindowResize() {
  var container = document.getElementById("game-canvas");
  var width = container.clientWidth || window.innerWidth;
  var height = container.clientHeight || window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.updateMouseSensitivity = function (value) {
  mouseSensitivity = value;
};

console.log("✅ game.js completamente caricato e pronto!");
