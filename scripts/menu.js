// Gestione dei menu
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Menu caricato");
  console.log("THREE disponibile:", typeof THREE !== "undefined");
  console.log("startGame disponibile:", typeof startGame !== "undefined");

  const hubMenu = document.getElementById("hub-menu");
  const gameContainer = document.getElementById("game-container");
  const selectGameMenu = document.getElementById("select-game-menu");
  const settingsMenu = document.getElementById("settings-menu");
  const environmentSelect = document.getElementById("environment-select");

  const startGameBtn = document.getElementById("start-game-btn");
  const selectGameBtn = document.getElementById("select-game-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const backBtns = document.querySelectorAll(".back-btn");

  // Pulsanti impostazioni fffff
  const mouseSensitivity = document.getElementById("mouse-sensitivity");
  const sensitivityValue = document.getElementById("sensitivity-value");
  const volume = document.getElementById("volume");
  const volumeValue = document.getElementById("volume-value");

  // Popola selettore ambiente
  if (environmentSelect && typeof window.listEnvironments === "function") {
    const envs = window.listEnvironments();
    environmentSelect.innerHTML = "";
    envs.forEach((env) => {
      const opt = document.createElement("option");
      opt.value = env.id;
      opt.textContent = env.label || env.id;
      environmentSelect.appendChild(opt);
    });

    if (envs.length && typeof window.setEnvironment === "function") {
      let initialId = envs[0].id;
      if (
        window.RSG &&
        window.RSG.systems &&
        window.RSG.systems.environment &&
        typeof window.RSG.systems.environment.getDefaultEnvironmentId === "function"
      ) {
        initialId = window.RSG.systems.environment.getDefaultEnvironmentId() || initialId;
      }
      window.setEnvironment(initialId);
      environmentSelect.value = initialId;
    }

    environmentSelect.addEventListener("change", function () {
      if (typeof window.setEnvironment === "function") {
        window.setEnvironment(this.value);
      }
    });
  }

  // Avvia gioco
  startGameBtn.addEventListener("click", function () {
    console.log("🔵 Bottone AVVIA GIOCO premuto");

    // Assicurati che ci sia un mondo corrente selezionato
    if (window.RSG && window.RSG.systems && window.RSG.systems.worldManager) {
      var currentWorld = window.RSG.systems.worldManager.getCurrentWorld();
      
      if (!currentWorld) {
        console.log("⚠️ Nessun mondo corrente, cerco mondi disponibili...");
        var worlds = window.RSG.systems.worldManager.listWorlds();
        
        if (worlds && worlds.length > 0) {
          // Seleziona il mondo più recente
          worlds.sort(function(a, b) { return b.lastPlayed - a.lastPlayed; });
          currentWorld = worlds[0].id;
          window.RSG.systems.worldManager.setCurrentWorld(currentWorld);
          console.log("✅ Mondo selezionato automaticamente:", currentWorld);
        } else {
          // Crea un mondo di default
          console.log("📦 Nessun mondo trovato, creo mondo di default...");
          var newWorldId = window.RSG.systems.worldManager.createWorld("Il Mio Mondo", {
            template: "default",
            mapSize: 200,
            timeMode: "always-day",
            terrainType: "grass"
          });
          if (newWorldId) {
            window.RSG.systems.worldManager.setCurrentWorld(newWorldId);
            console.log("✅ Mondo di default creato:", newWorldId);
          }
        }
      }
    }

    hubMenu.style.display = "none";
    gameContainer.style.display = "block";

    console.log("Game container ora visibile:", window.getComputedStyle(gameContainer).display);

    // NON chiamare setEnvironment quando c'è un mondo - il mondo ha le sue impostazioni!
    // L'environment system viene usato solo per mondi legacy senza worldSettings

    // Verifica multipla per startGame
    if (typeof window.startGame === "function") {
      console.log("✅ window.startGame trovata, avvio...");
      window.startGame();
    } else if (typeof startGame === "function") {
      console.log("✅ startGame trovata (globale), avvio...");
      startGame();
    } else {
      console.error("❌ Funzione startGame NON trovata!");
      console.log("window.startGame:", typeof window.startGame);
      console.log("startGame:", typeof startGame);
      console.log(
        "Tutte le funzioni window:",
        Object.keys(window).filter((k) => k.includes("start"))
      );
    }
  });

  // Seleziona gioco
  selectGameBtn.addEventListener("click", function () {
    hubMenu.style.display = "none";
    selectGameMenu.style.display = "flex";
    // renderMapList(); // Legacy - non più necessario con worldManager
  });

  // Impostazioni (pulsante opzionale)
  if (settingsBtn) {
    settingsBtn.addEventListener("click", function () {
      console.log("⚙️ Apri impostazioni");
      hubMenu.style.display = "none";
      settingsMenu.style.display = "flex";
    });
  } else {
    console.warn("settings-btn non trovato: il pulsante Impostazioni è opzionale.");
  }

  // Torna indietro dagli altri menu
  backBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      console.log("⬅️ Indietro dai sottomenu");
      selectGameMenu.style.display = "none";
      settingsMenu.style.display = "none";
      hubMenu.style.display = "flex";
    });
  });

  // Aggiorna valori impostazioni
  mouseSensitivity.addEventListener("input", function () {
    sensitivityValue.textContent = this.value;
    if (typeof updateMouseSensitivity === "function") {
      updateMouseSensitivity(parseFloat(this.value));
    }
  });

  volume.addEventListener("input", function () {
    volumeValue.textContent = this.value + "%";
  });

  // ESC apre il menu principale se il gioco è attivo e non ci sono overlay
  document.addEventListener("keydown", function (event) {
    if (event.code !== "Escape") return;

    var state = window.RSG && window.RSG.state && window.RSG.state.current;
    var hasOverlay = !!(state && state.ui && (state.ui.isUsingPC || state.ui.isInDialogue || state.ui.isInventoryOpen));
    if (hasOverlay) return;

    var isGameVisible = gameContainer && window.getComputedStyle(gameContainer).display !== "none";
    if (!isGameVisible) return;

    try {
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    } catch (e) {
      /* ignore */
    }

    if (typeof stopGame === "function") {
      stopGame();
    }
    gameContainer.style.display = "none";
    hubMenu.style.display = "flex";
  });

  // Click su gioco specifico
  const gameItemBtns = document.querySelectorAll(".game-item-btn");
  gameItemBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      selectGameMenu.style.display = "none";
      gameContainer.style.display = "block";
      if (environmentSelect && typeof window.setEnvironment === "function") {
        window.setEnvironment(environmentSelect.value);
      }
      if (typeof startGame === "function") {
        startGame();
      }
    });
  });

  // Legacy function - non più utilizzata con worldManager
  /*
  function renderMapList() {
    if (!mapList) return;
    mapList.innerHTML = "";
    const mapData = loadMapMeta();
    const hasSaved = !!localStorage.getItem("architectMap");
    const items = [];
    if (hasSaved) {
      items.push({ id: "local", label: mapData.name || "Mappa locale", meta: mapData });
    }
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "map-item disabled";
      empty.textContent = "Nessuna mappa salvata";
      mapList.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "map-item";
      const title = document.createElement("div");
      title.className = "map-title";
      title.textContent = item.label;
      const meta = document.createElement("div");
      meta.className = "map-meta";
      meta.textContent = `Dim: ${item.meta.size || "?"} · Orario: ${item.meta.time || "n/d"}`;
      const loadBtn = document.createElement("button");
      loadBtn.className = "menu-btn small";
      loadBtn.textContent = "CARICA";
      loadBtn.onclick = function () {
        selectGameMenu.style.display = "none";
        gameContainer.style.display = "block";
        if (typeof window.clearArchitectMap === "function") {
          // no op when loading existing map; we rely on startGame/loadMap
        }
        if (typeof startGame === "function") {
          startGame();
        }
      };
      div.appendChild(title);
      div.appendChild(meta);
      div.appendChild(loadBtn);
      mapList.appendChild(div);
    });
  }
  */

  function createNewMap(meta) {
    try {
      localStorage.removeItem("architectMap");
      localStorage.setItem("architectMapMeta", JSON.stringify(meta));
      if (typeof window.clearArchitectMap === "function") {
        window.clearArchitectMap();
      }
    } catch (e) {
      console.warn("Errore creazione mappa", e);
    }
  }

  function loadMapMeta() {
    try {
      const raw = localStorage.getItem("architectMapMeta");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function setStatusMessage(msg) {
    try {
      const el = document.querySelector(".architect-status");
      if (el) el.textContent = msg;
    } catch (e) {
      // ignore
    }
  }

  // ========================================
  // WORLD MANAGEMENT UI
  // ========================================
  const worldsBtn = document.getElementById("worlds-btn");
  const worldsMenu = document.getElementById("worlds-menu");
  const worldsBackBtn = document.getElementById("worlds-back-btn");
  const worldsList = document.getElementById("worlds-list");
  const createWorldBtn = document.getElementById("create-world-btn");
  const importWorldBtn = document.getElementById("import-world-btn");
  
  const createWorldMenu = document.getElementById("create-world-menu");
  const worldNameInput = document.getElementById("world-name-input");
  const confirmCreateWorldBtn = document.getElementById("confirm-create-world-btn");
  const createWorldBackBtn = document.getElementById("create-world-back-btn");

  let selectedWorldId = null;

  // Open worlds menu
  if (worldsBtn) {
    worldsBtn.addEventListener("click", function() {
      hubMenu.style.display = "none";
      worldsMenu.style.display = "flex";
      loadWorldsList();
    });
  }

  // Back from worlds menu
  if (worldsBackBtn) {
    worldsBackBtn.addEventListener("click", function() {
      worldsMenu.style.display = "none";
      hubMenu.style.display = "flex";
    });
  }

  // Open create world menu
  if (createWorldBtn) {
    createWorldBtn.addEventListener("click", function() {
      worldsMenu.style.display = "none";
      createWorldMenu.style.display = "flex";
    });
  }

  // Back from create world menu
  if (createWorldBackBtn) {
    createWorldBackBtn.addEventListener("click", function() {
      createWorldMenu.style.display = "none";
      worldsMenu.style.display = "flex";
    });
  }

  // Aggiorna valore slider dimensione mappa
  const worldMapSizeInput = document.getElementById("world-map-size");
  const worldMapSizeValue = document.getElementById("map-size-value");
  if (worldMapSizeInput && worldMapSizeValue) {
    worldMapSizeInput.addEventListener("input", function() {
      worldMapSizeValue.textContent = this.value + "m";
    });
  }

  // Confirm create world
  if (confirmCreateWorldBtn) {
    confirmCreateWorldBtn.addEventListener("click", function() {
      const worldName = worldNameInput.value.trim() || "Il Mio Mondo";
      const mapSize = parseInt(document.getElementById("world-map-size").value, 10) || 200;
      const timeMode = document.getElementById("world-time-mode").value || "always-day";
      const terrainType = document.getElementById("world-terrain").value || "grass";
      
      const worldConfig = {
        template: "default",
        mapSize: mapSize,
        timeMode: timeMode,
        terrainType: terrainType
      };
      
      console.log("🌍 Creazione mondo con config:", worldConfig);
      
      if (typeof window.createWorld === "function") {
        const worldId = window.createWorld(worldName, worldConfig);
        if (worldId) {
          console.log("✅ Mondo creato:", worldId);
          console.log("📋 Config salvata:", worldConfig);
          
          if (window.RSG && window.RSG.systems && window.RSG.systems.worldManager) {
            window.RSG.systems.worldManager.setCurrentWorld(worldId);
            console.log("✅ Mondo impostato come corrente");
            
            // Verifica che sia stato salvato correttamente
            const loadedWorld = window.RSG.systems.worldManager.loadWorld(worldId);
            console.log("🔍 Verifica mondo caricato:", loadedWorld ? "OK" : "FAIL");
            if (loadedWorld && loadedWorld.worldSettings) {
              console.log("⚙️ WorldSettings salvate:", loadedWorld.worldSettings);
            }
          }
          
          createWorldMenu.style.display = "none";
          worldsMenu.style.display = "flex";
          loadWorldsList();
          worldNameInput.value = "";
        } else {
          console.error("❌ Errore: createWorld ha ritornato null");
        }
      } else {
        console.error("❌ window.createWorld non è una funzione!");
      }
    });
  }

  // Import world
  if (importWorldBtn) {
    importWorldBtn.addEventListener("click", function() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(evt) {
            const jsonString = evt.target.result;
            if (typeof window.importWorld === "function") {
              const worldId = window.importWorld(jsonString);
              if (worldId) {
                console.log("✅ Mondo importato:", worldId);
                loadWorldsList();
              }
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    });
  }

  // Template selector rimosso - ora usiamo sempre template "default"

  function loadWorldsList() {
    if (!worldsList) return;
    worldsList.innerHTML = "";
    
    const worlds = typeof window.listWorlds === "function" ? window.listWorlds() : [];
    
    if (worlds.length === 0) {
      worldsList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">Nessun mondo creato. Crea il tuo primo mondo!</div>';
      return;
    }

    worlds.forEach(function(world) {
      const card = document.createElement("div");
      card.className = "world-card";
      
      const date = new Date(world.lastPlayed);
      const dateStr = date.toLocaleDateString("it-IT");
      const playtimeMin = Math.floor(world.playtime / 60);
      
      const templateIcons = {
        empty: "🌑",
        default: "🏠",
        survival: "⚔️",
        creative: "🎨",
        custom: "⚙️"
      };
      
      card.innerHTML = `
        <div class="world-thumbnail">${templateIcons[world.template] || "🌍"}</div>
        <div class="world-name">${world.name}</div>
        <div class="world-meta">
          <div>📅 ${dateStr}</div>
          <div>⏱️ ${playtimeMin}m giocati</div>
          <div>📦 ${world.stats.objectsPlaced || 0} oggetti</div>
        </div>
        <div class="world-actions">
          <button class="world-action-btn play" data-action="play" data-id="${world.id}">▶️ GIOCA</button>
          <button class="world-action-btn" data-action="rename" data-id="${world.id}">✏️</button>
          <button class="world-action-btn" data-action="duplicate" data-id="${world.id}">📋</button>
          <button class="world-action-btn" data-action="export" data-id="${world.id}">💾</button>
          <button class="world-action-btn delete" data-action="delete" data-id="${world.id}">🗑️</button>
        </div>
      `;
      
      // Event listeners for actions
      card.querySelectorAll(".world-action-btn").forEach(btn => {
        btn.addEventListener("click", function(e) {
          e.stopPropagation();
          const action = this.dataset.action;
          const worldId = this.dataset.id;
          handleWorldAction(action, worldId, world);
        });
      });
      
      worldsList.appendChild(card);
    });
  }

  function handleWorldAction(action, worldId, worldData) {
    const worldManager = window.RSG && window.RSG.systems ? window.RSG.systems.worldManager : null;
    if (!worldManager) {
      console.warn("⚠️ WorldManager non disponibile");
      return;
    }

    switch(action) {
      case "play":
        worldManager.setCurrentWorld(worldId);
        worldsMenu.style.display = "none";
        gameContainer.style.display = "block";
        if (typeof window.startGame === "function") {
          window.startGame();
        }
        break;
        
      case "rename":
        const newName = prompt("Nuovo nome:", worldData.name);
        if (newName && newName.trim()) {
          worldManager.renameWorld(worldId, newName.trim());
          loadWorldsList();
        }
        break;
        
      case "duplicate":
        const dupName = prompt("Nome copia:", worldData.name + " (Copia)");
        if (dupName && dupName.trim()) {
          const newId = worldManager.duplicateWorld(worldId, dupName.trim());
          if (newId) {
            console.log("✅ Mondo duplicato:", newId);
            loadWorldsList();
          }
        }
        break;
        
      case "export":
        const jsonData = worldManager.exportWorld(worldId);
        if (jsonData) {
          const blob = new Blob([jsonData], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = worldData.name + ".json";
          a.click();
          URL.revokeObjectURL(url);
        }
        break;
        
      case "delete":
        if (confirm("Eliminare il mondo '" + worldData.name + "'? Questa azione è irreversibile.")) {
          worldManager.deleteWorld(worldId);
          loadWorldsList();
        }
        break;
    }
  }
});
