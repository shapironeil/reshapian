// UI: Dialogue overlay

window.RSG = window.RSG || {};
window.RSG.ui = window.RSG.ui || {};

(function () {
  function open(state, robotDataRef) {
    var dlg = document.getElementById("dialogue-ui");
    if (!dlg) return;
    if (state && state.ui && state.ui.isInDialogue) return;

    if (state && state.ui) state.ui.isInDialogue = true;
    if (state) state.mode = "dialogue";

    dlg.style.display = "flex";

    var textEl = document.getElementById("dialogue-text");
    if (textEl) {
      textEl.textContent = "Ciao, sono il robottino guida. Vuoi che ti accompagni nella casa o preferisci esplorare da solo?";
    }

    var btn1 = document.getElementById("dialogue-option-1");
    var btn2 = document.getElementById("dialogue-option-2");

    if (btn1) {
      btn1.textContent = "Accompagnami e raccontami la storia.";
      btn1.onclick = function () {
        if (textEl) {
          textEl.textContent = "Perfetto! Ti seguirò e ti racconterò tutto man mano che esploriamo.";
        }
        if (robotDataRef) {
          robotDataRef.followPlayer = true;
        }
      };
    }

    if (btn2) {
      btn2.textContent = "Preferisco esplorare da solo.";
      btn2.onclick = function () {
        if (textEl) {
          textEl.textContent = "Va bene! Io rimarrò in giro per casa, chiamami quando vuoi.";
        }
        if (robotDataRef) {
          robotDataRef.followPlayer = false;
        }
      };
    }
  }

  function close(state) {
    var dlg = document.getElementById("dialogue-ui");
    if (!dlg) return;
    dlg.style.display = "none";
    if (state && state.ui) state.ui.isInDialogue = false;
    if (state) state.mode = "gameplay";
  }

  window.RSG.ui.dialogue = {
    open: open,
    close: close,
  };
})();
