// UI: PC overlay

window.RSG = window.RSG || {};
window.RSG.ui = window.RSG.ui || {};

(function () {
  function open(state) {
    var pcScreen = document.getElementById("pc-screen");
    if (!pcScreen) return;
    if (state && state.ui && state.ui.isUsingPC) return;

    if (state && state.ui) state.ui.isUsingPC = true;
    if (state) state.mode = "pc";

    pcScreen.style.display = "flex";

    // Exit pointer lock safely
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (e) {
      console.warn("⚠️ Could not exit pointer lock:", e);
    }

    // Defer nav button setup to avoid blocking
    setTimeout(function() {
      setActiveSection("news");

      var navButtons = document.querySelectorAll(".pc-nav-btn");
      navButtons.forEach(function (btn) {
        btn.onclick = function () {
          var section = btn.getAttribute("data-section");
          setActiveSection(section);
        };
      });

      var closeBtn = document.getElementById("pc-close-btn");
      if (closeBtn) {
        closeBtn.onclick = function () {
          close(state);
        };
      }
    }, 50);
  }

  function close(state) {
    var pcScreen = document.getElementById("pc-screen");
    if (!pcScreen) return;

    pcScreen.style.display = "none";
    if (state && state.ui) state.ui.isUsingPC = false;
    if (state) state.mode = "gameplay";
  }

  function setActiveSection(sectionId) {
    var sections = document.querySelectorAll(".pc-section");
    sections.forEach(function (sec) {
      sec.style.display = sec.dataset.section === sectionId ? "block" : "none";
    });
  }

  window.RSG.ui.pc = {
    open: open,
    close: close,
    setActiveSection: setActiveSection,
  };
})();
