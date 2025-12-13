console.log('📦 game.js caricato!');

// Variabili globali
var scene, camera, renderer;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = true;
var velocity = { x: 0, y: 0, z: 0 };
var isGameRunning = false;
var mouseSensitivity = 1.0;
var models = [];
var lastTime;
var movingAnimals = [];
var characters = [];
var interactables = [];
var collisionObjects = [];
var bullets = [];
var staticTargets = [];
var hasGun = false;
var heldWeapon = null;
var isUsingPC = false;
var isInDialogue = false;
var robotData = null;
// Inventario
var inventory = []; // { id, name, type, modelRef }
var MAX_INVENTORY = 10;
var equipped = {
    head: null,
    chest: null,
    leftHand: null,
    rightHand: null
};
var isInventoryOpen = false;

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
window.startGame = function() {
    if (isGameRunning) {
        console.log('⚠️ Gioco già in esecuzione');
        return;
    }
    
    console.log('🎮 ========== AVVIO GIOCO ==========');
    isGameRunning = true;
    canJump = true;
    lastTime = performance.now();
    
    initThreeJS();
    createEnvironment();
    loadModels();
    animate();
    
    console.log('✅ ========== GIOCO AVVIATO ==========');
};

// Funzione globale per fermare il gioco fhntdnrthn
window.stopGame = function() {
    isGameRunning = false;
    document.exitPointerLock();
    
    if (renderer) {
        renderer.dispose();
        var gameCanvas = document.getElementById('game-canvas');
        while (gameCanvas.firstChild) {
            gameCanvas.removeChild(gameCanvas.firstChild);
        }
    }
};

function initThreeJS() {
    console.log('🚀 Inizializzazione Three.js...');
    
    if (typeof THREE === 'undefined') {
        console.error('❌ THREE.js non trovato!');
        alert('Errore: Three.js non caricato.');
        return false;
    }
    
    console.log('✅ THREE.js versione:', THREE.REVISION);
    
    // Scena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 50, 300);
    
    // Camera prima persona
    var container = document.getElementById('game-canvas');
    var width = container.clientWidth || window.innerWidth;
    var height = container.clientHeight || window.innerHeight;
    
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, PLAYER_HEIGHT, 10);
    camera.rotation.order = 'YXZ';
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
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
    
    // Controlli
    setupControls();
    
    window.addEventListener('resize', onWindowResize);
    
    console.log('✅ Three.js inizializzato');
    return true;
}

function createEnvironment() {
    console.log('🌍 Creazione ambiente 3D...');
    
    // Pavimento esterno (giardino / cortile)
    var floorGeometry = new THREE.PlaneGeometry(200, 200);
    var floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4c8c4a,
        roughness: 0.8
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
        color: 0x8B7355,
        roughness: 0.7
    });
    var houseFloor = new THREE.Mesh(houseFloorGeometry, houseFloorMaterial);
    houseFloor.rotation.x = -Math.PI / 2;
    houseFloor.position.set(0, 0.02, 0);
    houseFloor.receiveShadow = true;
    scene.add(houseFloor);
    
    // Pareti perimetrali per creare un grande edificio che contiene la casa
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0xE8D4B8 });
    
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
    var houseWallMaterial = new THREE.MeshStandardMaterial({ color: 0xD9C1A5 });

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
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0xC2A383, roughness: 0.6 });

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
        [ 1.35, 0.5, -0.6],
        [-1.35, 0.5,  0.6],
        [ 1.35, 0.5,  0.6]
    ];
    legOffsets.forEach(function(offset) {
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
    
    console.log('✅ Ambiente creato');
}

function loadModels() {
    console.log('📦 Caricamento modelli 3D...');
    console.log('THREE.GLTFLoader disponibile:', typeof THREE.GLTFLoader);
    
    // Lista modelli organizzati per casa + giardino
    var furniture = [
        // --- INTERNI: zona soggiorno ---
        { file: 'old_sofa_free.glb', pos: [0, 0, 8], rot: Math.PI, scale: 1.5, category: 'furniture', area: 'indoor' },
        { file: 'old_sofa_free.glb', pos: [-5, 0, 6], rot: Math.PI * 0.9, scale: 1.3, category: 'furniture', area: 'indoor' },
        { file: 'old_sofa_free.glb', pos: [5, 0, 6], rot: Math.PI * 1.1, scale: 1.3, category: 'furniture', area: 'indoor' },
        { file: 'vintage_tv_free.glb', pos: [0, 1, 0], rot: Math.PI, scale: 0.8, category: 'furniture', area: 'indoor' },
        { file: 'chocolate_beech_bookshelf_free.glb', pos: [-8, 0, -4], rot: Math.PI / 2, scale: 1.0, category: 'decor', area: 'indoor' },
        { file: 'dusty_old_bookshelf_free.glb', pos: [8, 0, -4], rot: -Math.PI / 2, scale: 1.0, category: 'decor', area: 'indoor' },
        { file: 'cowboy_hat_free.glb', pos: [-8, 1.6, -3.5], rot: 0, scale: 0.6, category: 'decor', area: 'indoor' },
        { file: 'blue_eyeball_free.glb', pos: [8, 1.4, -3.5], rot: 0, scale: 0.5, category: 'decor', area: 'indoor' },

        // --- INTERNI: zona studio / lavoro ---
        { file: 'laptop_free.glb', pos: [10, 1.06, -5], rot: 0, scale: 0.25, category: 'usable', area: 'indoor', id: 'pc_laptop' },
        { file: 'beretta_92fs_-_game_ready_-_free.glb', pos: [11, 1.08, -4.5], rot: Math.PI / 2, scale: 0.15, category: 'usable', area: 'indoor', id: 'pistol_beretta' },
        { file: 'pistol_43_tactical__free_lowpoly.glb', pos: [9, 1.08, -4.5], rot: Math.PI / 2, scale: 0.15, category: 'usable', area: 'indoor', id: 'pistol_43' },
        { file: 'paladin_longsword_free_download.glb', pos: [-12, 1.2, 4], rot: 0, scale: 0.8, category: 'usable', area: 'indoor' },
        { file: 'tools_pack._free.glb', pos: [-10, 0, 6], rot: 0, scale: 0.9, category: 'usable', area: 'indoor' },

        // --- INTERNI: personaggi ---
        { file: 'r.e.p.o_realistic_character_free_download.glb', pos: [-3, 0, 2], rot: Math.PI / 6, scale: 1.0, category: 'robot', area: 'indoor', id: 'robot_helper' },
        { file: 'realistic_male_character.glb', pos: [3, 0, 2], rot: -Math.PI / 6, scale: 1.0, category: 'character', area: 'indoor' },

        // --- ESTERNI: panchina e rocce nel giardino ---
        { file: 'bench_model_free.glb', pos: [-10, 0, 35], rot: Math.PI / 2, scale: 1.0, category: 'furniture', area: 'garden' },
        { file: 'free_pack_-_rocks_stylized.glb', pos: [-5, 0, 50], rot: 0, scale: 1.0, category: 'decor', area: 'garden' },
        { file: 'free_pack_-_rocks_stylized.glb', pos: [12, 0, 60], rot: 0.3, scale: 1.0, category: 'decor', area: 'garden' },

        // --- ESTERNI: erba ripetuta per il giardino ---
        { file: 'grass_free_download.glb', pos: [0, 0, 45], rot: 0, scale: 1.5, category: 'repeated', area: 'garden' },
        { file: 'grass_free_download.glb', pos: [-8, 0, 55], rot: 0.2, scale: 1.5, category: 'repeated', area: 'garden' },
        { file: 'grass_free_download.glb', pos: [8, 0, 55], rot: -0.2, scale: 1.5, category: 'repeated', area: 'garden' },
        { file: 'grass_free_download.glb', pos: [0, 0, 65], rot: 0.1, scale: 1.5, category: 'repeated', area: 'garden' },
        { file: 'grass_free_download.glb', pos: [-15, 0, 45], rot: -0.1, scale: 1.5, category: 'repeated', area: 'garden' },
        { file: 'grass_free_download.glb', pos: [15, 0, 45], rot: 0.15, scale: 1.5, category: 'repeated', area: 'garden' },
        { file: 'grass_free_download.glb', pos: [-15, 0, 60], rot: 0.05, scale: 1.5, category: 'repeated', area: 'garden' },
        { file: 'grass_free_download.glb', pos: [15, 0, 60], rot: -0.05, scale: 1.5, category: 'repeated', area: 'garden' },
        { file: 'grass_free_download.glb', pos: [-5, 0, 70], rot: 0.12, scale: 1.5, category: 'repeated', area: 'garden' },
        { file: 'grass_free_download.glb', pos: [5, 0, 70], rot: -0.12, scale: 1.5, category: 'repeated', area: 'garden' },

        // --- ESTERNI: strutture e strada ---
        { file: 'warehouse_fbx_model_free.glb', pos: [60, 0, 60], rot: Math.PI / 4, scale: 0.5, category: 'structure', area: 'garden' },
        { file: 'interior_free.glb', pos: [-60, 0, -40], rot: 0, scale: 0.5, category: 'structure', area: 'outdoor' },
        { file: 'road_free.glb', pos: [0, 0, -70], rot: 0, scale: 0.7, category: 'structure', area: 'outdoor' },
        { file: 'free_barricade.glb', pos: [0, 0, 80], rot: 0, scale: 1.0, category: 'structure', area: 'garden' },

        // --- ANIMALI nel giardino (si muovono sull'erba) ---
        { file: 'deer_demo_free_download.glb', pos: [0, 0, 55], rot: 0, scale: 1.5, category: 'animal', area: 'garden', radius: 10, speed: 0.5 }
    ];
    
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.error('❌ GLTFLoader NON disponibile!');
        console.log('THREE:', typeof THREE);
        console.log('Oggetti THREE disponibili:', Object.keys(THREE).filter(k => k.includes('Loader')));
        return;
    }
    
    console.log('✅ GLTFLoader disponibile, inizio caricamento...');
    
    var loader = new THREE.GLTFLoader();
    var loadedCount = 0;
    
    furniture.forEach(function(item) {
        console.log('🔄 Tentativo caricamento:', item.file);
        loader.load(
            'models/' + item.file,
            function(gltf) {
                var model = gltf.scene;
                model.position.set(item.pos[0], item.pos[1], item.pos[2]);
                model.rotation.y = item.rot;

                var baseScale = (typeof item.scale === 'number') ? item.scale : 1;
                var finalScale = baseScale * MODEL_GLOBAL_SCALE;
                model.scale.set(finalScale, finalScale, finalScale);

                // Salva metadati per categorie (animale, personaggio, ecc.)
                model.userData = model.userData || {};
                model.userData.category = item.category || null;
                model.userData.id = item.id || null;
                
                model.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                scene.add(model);
                models.push(model);

                // Calcola un raggio di collisione approssimativo (in pianta)
                var bbox = new THREE.Box3().setFromObject(model);
                var size = new THREE.Vector3();
                bbox.getSize(size);
                var radiusXZ = Math.max(size.x, size.z) / 2;
                collisionObjects.push({
                    model: model,
                    radius: radiusXZ + 0.3
                });
                loadedCount++;
                
                console.log('✅ Caricato:', item.file, '(' + loadedCount + '/' + furniture.length + ')');

                // Registra oggetti interattivi (PC, pistole, robottino)
                if (item.id) {
                    var interactable = {
                        id: item.id,
                        type: item.category,
                        model: model
                    };
                    interactables.push(interactable);

                    if (item.category === 'robot') {
                        robotData = {
                            model: model,
                            speed: 2.0,
                            followPlayer: false,
                            wanderAngle: 0
                        };
                    }
                }

                // Se è un animale, preparalo per il movimento nel giardino
                if (item.category === 'animal') {
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
                        hasLanded: false
                    });
                }

                // Se è un personaggio, aggiungilo alla lista dei bersagli colpibili
                if (item.category === 'character') {
                    characters.push({ model: model });
                }
            },
            undefined,
            function(error) {
                console.warn('⚠️ Errore caricamento', item.file);
            }
        );
    });
}

function setupControls() {
    document.addEventListener('keydown', function(event) {
        switch (event.code) {
            case 'KeyW':
                moveForward = true;
                break;
            case 'KeyS':
                moveBackward = true;
                break;
            case 'KeyA':
                moveLeft = true;
                break;
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (canJump) {
                    velocity.y = JUMP_VELOCITY;
                    canJump = false;
                }
                event.preventDefault();
                break;
            case 'KeyQ':
                if (hasGun && !isUsingPC && !isInDialogue) {
                    shoot();
                }
                break;
            case 'KeyE':
                handleInteract();
                break;
            case 'Tab':
                event.preventDefault();
                toggleInventory();
                break;
            case 'Escape':
                if (isUsingPC) {
                    closePC();
                } else if (isInDialogue) {
                    closeDialogue();
                }
                break;
        }
    });
    
    document.addEventListener('keyup', function(event) {
        switch (event.code) {
            case 'KeyW':
                moveForward = false;
                break;
            case 'KeyS':
                moveBackward = false;
                break;
            case 'KeyA':
                moveLeft = false;
                break;
            case 'KeyD':
                moveRight = false;
                break;
        }
    });
    
    document.addEventListener('mousemove', function(event) {
        if (document.pointerLockElement && !isUsingPC && !isInDialogue) {
            var movementX = event.movementX || 0;
            var movementY = event.movementY || 0;
            
            camera.rotation.y -= movementX * LOOK_SPEED * mouseSensitivity;
            camera.rotation.x -= movementY * LOOK_SPEED * mouseSensitivity;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
    });
    
    var canvas = document.querySelector('#game-canvas');
    if (canvas) {
        canvas.addEventListener('click', function() {
            this.requestPointerLock();
        });
    }

    // Click sinistro per sparare quando si ha la pistola in mano
    // (rimosso: ora si spara con Q)
}

function updateMovement(delta) {
    if (isUsingPC || isInDialogue) {
        return;
    }
    velocity.y -= GRAVITY * delta;

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

    collisionObjects.forEach(function(obj) {
        if (!obj.model || typeof obj.radius !== 'number') return;

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

    bullets.forEach(function(bullet, index) {
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

            if (cat === 'animal') {
                // Cerca l'animale corrispondente e uccidilo
                movingAnimals.forEach(function(animal) {
                    if (animal.model === root && animal.alive) {
                        console.log('🎯 Colpito un animale!');
                        animal.alive = false;
                        animal.speed = 0;
                        animal.verticalSpeed = 0;
                    }
                });
            } else if (cat === 'character') {
                // Cerca il personaggio e rimuovilo
                for (var i = 0; i < characters.length; i++) {
                    if (characters[i].model === root) {
                        console.log('💥 Colpito un personaggio!');
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
    if (!movingAnimals.length) return;

    movingAnimals.forEach(function(animal) {
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

    updateMovement(delta);
    updateAnimals(delta);
    updateRobot(delta);
    updateInteractPrompt();
    updateShootPrompt();
    updateBullets(delta);

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function updateInteractPrompt() {
    var prompt = document.getElementById('interact-prompt');
    if (!prompt) return;

    if (isUsingPC || isInDialogue) {
        prompt.style.display = 'none';
        return;
    }

    var target = getNearestInteractable();
    if (!target) {
        prompt.style.display = 'none';
        return;
    }

    var text = 'E - Interagisci';
    if (target.id === 'pc_laptop') {
        text = 'E - Usa PC';
    } else if (target.id === 'pistol_beretta' || target.id === 'pistol_43') {
        text = 'E - Raccogli pistola';
    } else if (target.type === 'robot') {
        text = 'E - Parla con il robottino';
    }

    prompt.textContent = text;
    prompt.style.display = 'block';
}

function updateShootPrompt() {
    var prompt = document.getElementById('shoot-prompt');
    if (!prompt) return;

    if (hasGun && !isUsingPC && !isInDialogue && document.pointerLockElement) {
        prompt.style.display = 'block';
    } else {
        prompt.style.display = 'none';
    }
}

function getNearestInteractable() {
    if (!interactables.length || !camera) return null;
    var nearest = null;
    var minDist = INTERACT_DISTANCE;
    var camPos = camera.position;

    interactables.forEach(function(obj) {
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
    if (isUsingPC || isInDialogue) return;
    var target = getNearestInteractable();
    if (!target) return;

    if (target.id === 'pc_laptop') {
        usePC();
    } else if (target.id === 'pistol_beretta' || target.id === 'pistol_43') {
        pickupGun(target);
    } else if (target.type === 'robot') {
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
    var itemId = target.id || 'pistol';
    var itemName = (itemId === 'pistol_beretta') ? 'Pistola Beretta' : (itemId === 'pistol_43' ? 'Pistola 43 Tactical' : 'Pistola');
    if (inventory.length < MAX_INVENTORY) {
        inventory.push({ id: itemId, name: itemName, type: 'weapon', modelRef: target.model });
        updateInventoryUI();
    } else {
        // Se pieno, scarta a terra (non ri-aggiungiamo alla scena per semplicità)
        console.warn('Inventario pieno: impossibile aggiungere pistola.');
    }

    // Rimuovi dalle interazioni
    interactables = interactables.filter(function(obj) {
        return obj.id !== 'pistol_beretta' && obj.id !== 'pistol_43';
    });
}

function shoot() {
    // Effetto semplice di sparo: log + piccolo flash di luce
    console.log('🔫 SPARO!');

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
        stopped: false
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
    var overlay = document.getElementById('inventory-overlay');
    if (!overlay) return;
    isInventoryOpen = !isInventoryOpen;
    overlay.style.display = isInventoryOpen ? 'flex' : 'none';
    if (isInventoryOpen && document.pointerLockElement) {
        document.exitPointerLock();
    }
}

function updateInventoryUI() {
    var grid = document.getElementById('inventory-items');
    if (!grid) return;
    grid.innerHTML = '';
    // Mostra fino a MAX_INVENTORY celle
    for (var i = 0; i < MAX_INVENTORY; i++) {
        var cell = document.createElement('div');
        cell.className = 'item-cell';
        if (inventory[i]) {
            cell.textContent = inventory[i].name;
            (function(item){
                cell.onclick = function(){
                    // Equipaggia in mano destra per semplicità (se arma)
                    if (item.type === 'weapon') {
                        equipRightHand(item);
                    }
                };
            })(inventory[i]);
        } else {
            cell.textContent = '-';
        }
        grid.appendChild(cell);
    }

    // Aggiorna slot equip
    var sh = document.getElementById('slot-head-item');
    var sc = document.getElementById('slot-chest-item');
    var sl = document.getElementById('slot-left-hand-item');
    var sr = document.getElementById('slot-right-hand-item');
    if (sh) sh.textContent = equipped.head ? equipped.head.name : '-';
    if (sc) sc.textContent = equipped.chest ? equipped.chest.name : '-';
    if (sl) sl.textContent = equipped.leftHand ? equipped.leftHand.name : '-';
    if (sr) sr.textContent = equipped.rightHand ? equipped.rightHand.name : '-';
}

function equipRightHand(item) {
    // Rimuovi item dall'inventario
    var idx = inventory.findIndex(function(x){ return x === item; });
    if (idx >= 0) {
        inventory.splice(idx, 1);
    }

    // Se c'è già qualcosa in mano destra, rimetti nell'inventario
    if (equipped.rightHand) {
        inventory.push(equipped.rightHand);
        // Rimuovi il modello attuale dalla camera
        if (equipped.rightHand.modelRef && equipped.rightHand.modelRef.parent === camera) {
            camera.remove(equipped.rightHand.modelRef);
        }
    }

    equipped.rightHand = item;
    updateInventoryUI();

    // Se arma 3D, agganciala alla camera per vederla nella visuale
    var model = item.modelRef;
    if (model) {
        camera.add(model);
        // Posizione tipica arma in prima persona
        model.position.set(0.6, -0.4, -0.9);
        // Orienta la canna in avanti rispetto alla direzione dello sguardo
        model.rotation.set(0, -Math.PI / 2, 0);
        hasGun = true;
        heldWeapon = model;
    }
}

// Semplice gestione salute
var playerHealth = 100;
function setPlayerHealth(value){
    playerHealth = Math.max(0, Math.min(100, value));
    var fill = document.getElementById('health-fill');
    if (fill) {
        fill.style.width = playerHealth + '%';
        // Colore graduale
        if (playerHealth < 35) {
            fill.style.background = 'linear-gradient(90deg, #ff5b5b, #d63b3b)';
        } else if (playerHealth < 70) {
            fill.style.background = 'linear-gradient(90deg, #f3c24b, #e0a83a)';
        } else {
            fill.style.background = 'linear-gradient(90deg, #3bd16f, #1ea757)';
        }
    }
}

// Inizializza UI inventario e salute all'avvio del gioco
window.addEventListener('load', function(){
    setPlayerHealth(100);
    updateInventoryUI();
});

function usePC() {
    var pcScreen = document.getElementById('pc-screen');
    if (!pcScreen || isUsingPC) return;

    isUsingPC = true;
    pcScreen.style.display = 'flex';

    // Mostra sezione di default
    setActivePCSection('news');

    // Attiva cambio sezione tramite i pulsanti
    var navButtons = document.querySelectorAll('.pc-nav-btn');
    navButtons.forEach(function(btn) {
        btn.onclick = function() {
            var section = btn.getAttribute('data-section');
            setActivePCSection(section);
        };
    });

    var closeBtn = document.getElementById('pc-close-btn');
    if (closeBtn) {
        closeBtn.onclick = function() {
            closePC();
        };
    }

    // Esci dal puntatore bloccato per usare il mouse normalmente
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

function closePC() {
    var pcScreen = document.getElementById('pc-screen');
    if (!pcScreen) return;
    pcScreen.style.display = 'none';
    isUsingPC = false;
}

function setActivePCSection(sectionId) {
    var sections = document.querySelectorAll('.pc-section');
    sections.forEach(function(sec) {
        sec.style.display = (sec.dataset.section === sectionId) ? 'block' : 'none';
    });
}

function startDialogue() {
    var dlg = document.getElementById('dialogue-ui');
    if (!dlg || isInDialogue) return;

    isInDialogue = true;
    dlg.style.display = 'flex';

    // Primo testo
    var textEl = document.getElementById('dialogue-text');
    if (textEl) {
        textEl.textContent = 'Ciao, sono il robottino guida. Vuoi che ti accompagni nella casa o preferisci esplorare da solo?';
    }

    var btn1 = document.getElementById('dialogue-option-1');
    var btn2 = document.getElementById('dialogue-option-2');

    if (btn1) {
        btn1.textContent = 'Accompagnami e raccontami la storia.';
        btn1.onclick = function() {
            if (textEl) {
                textEl.textContent = 'Perfetto! Ti seguirò e ti racconterò tutto man mano che esploriamo.';
            }
            if (robotData) {
                robotData.followPlayer = true;
            }
        };
    }

    if (btn2) {
        btn2.textContent = 'Preferisco esplorare da solo.';
        btn2.onclick = function() {
            if (textEl) {
                textEl.textContent = 'Va bene! Io rimarrò in giro per casa, chiamami quando vuoi.';
            }
            if (robotData) {
                robotData.followPlayer = false;
            }
        };
    }
}

function closeDialogue() {
    var dlg = document.getElementById('dialogue-ui');
    if (!dlg) return;
    dlg.style.display = 'none';
    isInDialogue = false;
}

function onWindowResize() {
    var container = document.getElementById('game-canvas');
    var width = container.clientWidth || window.innerWidth;
    var height = container.clientHeight || window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.updateMouseSensitivity = function(value) {
    mouseSensitivity = value;
};

console.log('✅ game.js completamente caricato e pronto!');
