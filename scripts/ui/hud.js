// UI: HUD (prompt interazione/sparo, salute, barra ricarica)
// Nota: nessun uso di API Node, compatibile browser.

window.RSG = window.RSG || {};
window.RSG.ui = window.RSG.ui || {};

(function () {
  function setInteractPromptVisible(visible, text) {
    var prompt = document.getElementById("interact-prompt");
    if (!prompt) return;
    if (!visible) {
      prompt.style.display = "none";
      return;
    }
    if (typeof text === "string") prompt.textContent = text;
    prompt.style.display = "block";
  }

  function setShootPromptVisible(visible) {
    var prompt = document.getElementById("shoot-prompt");
    if (!prompt) return;
    prompt.style.display = visible ? "block" : "none";
  }

  function setHealth(value) {
    var v = Math.max(0, Math.min(100, value));
    var fill = document.getElementById("health-fill");
    if (!fill) return v;

    fill.style.width = v + "%";

    if (v < 35) {
      fill.style.background = "linear-gradient(90deg, #ff5b5b, #d63b3b)";
    } else if (v < 70) {
      fill.style.background = "linear-gradient(90deg, #f3c24b, #e0a83a)";
    } else {
      fill.style.background = "linear-gradient(90deg, #3bd16f, #1ea757)";
    }

    return v;
  }

  function setReloadBarVisible(visible) {
    var reloadBar = document.getElementById("reload-bar");
    if (!reloadBar) return;
    reloadBar.style.display = visible ? "block" : "none";
  }

  function setReloadProgress(progress01) {
    var progressEl = document.getElementById("reload-progress");
    if (!progressEl) return;
    var p = Math.max(0, Math.min(1, progress01));
    progressEl.style.width = p * 100 + "%";
  }

  window.RSG.ui.hud = {
    setInteractPromptVisible: setInteractPromptVisible,
    setShootPromptVisible: setShootPromptVisible,
    setHealth: setHealth,
    setReloadBarVisible: setReloadBarVisible,
    setReloadProgress: setReloadProgress,
  };
})();
