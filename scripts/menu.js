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
  const mapList = document.getElementById("map-list");
  const createMapBtn = document.getElementById("create-map-btn");
  const mapSettingsPanel = document.getElementById("map-settings");
  const mapNameInput = document.getElementById("map-name");
  const mapSizeInput = document.getElementById("map-size");
  const mapTimeSelect = document.getElementById("map-time");
  const saveMapBtn = document.getElementById("save-map-btn");
  const cancelMapBtn = document.getElementById("cancel-map-btn");

  const startGameBtn = document.getElementById("start-game-btn");
  const selectGameBtn = document.getElementById("select-game-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const backMenuBtn = document.getElementById("back-menu-btn");
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

    hubMenu.style.display = "none";
    gameContainer.style.display = "block";

    console.log("Game container ora visibile:", window.getComputedStyle(gameContainer).display);

    // Persisti selezione ambiente prima dell'avvio
    if (environmentSelect && typeof window.setEnvironment === "function") {
      window.setEnvironment(environmentSelect.value);
    }

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
    renderMapList();
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

  // Torna al menu principale dal gioco
  backMenuBtn.addEventListener("click", function () {
    console.log("⬅️ Torna al menu dal gioco");
    gameContainer.style.display = "none";
    hubMenu.style.display = "flex";
    if (typeof stopGame === "function") {
      stopGame();
    }
  });

  // Torna indietro dagli altri menu
  backBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      console.log("⬅️ Indietro dai sottomenu");
      selectGameMenu.style.display = "none";
      settingsMenu.style.display = "none";
      mapSettingsPanel.style.display = "none";
      hubMenu.style.display = "flex";
    });
  });

  if (createMapBtn) {
    createMapBtn.addEventListener("click", function () {
      mapSettingsPanel.style.display = "block";
      mapNameInput.value = "";
      mapSizeInput.value = 500;
      mapTimeSelect.value = "mattina";
    });
  }

  if (cancelMapBtn) {
    cancelMapBtn.addEventListener("click", function () {
      mapSettingsPanel.style.display = "none";
    });
  }

  if (saveMapBtn) {
    saveMapBtn.addEventListener("click", function () {
      const name = mapNameInput.value && mapNameInput.value.trim() ? mapNameInput.value.trim() : "Nuova Mappa";
      const size = parseInt(mapSizeInput.value, 10) || 500;
      const time = mapTimeSelect.value || "mattina";
      createNewMap({ name, size, time });
      mapSettingsPanel.style.display = "none";
      renderMapList();
      setStatusMessage("Mappa creata: " + name);
    });
  }

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
});
