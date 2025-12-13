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
  });

  // Impostazioni
  settingsBtn.addEventListener("click", function () {
    hubMenu.style.display = "none";
    settingsMenu.style.display = "flex";
  });

  // Torna al menu principale dal gioco
  backMenuBtn.addEventListener("click", function () {
    gameContainer.style.display = "none";
    hubMenu.style.display = "flex";
    if (typeof stopGame === "function") {
      stopGame();
    }
  });

  // Torna indietro dagli altri menu
  backBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
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
});
