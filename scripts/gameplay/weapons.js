// Gameplay: weapon and ammo definitions (static data)
// Browser-safe, no imports.

window.RSG = window.RSG || {};
window.RSG.gameplay = window.RSG.gameplay || {};

(function () {
  // Static weapon definitions; mutable fields (ammo) will be stored in-state.
  var weaponDefs = {
    pistol_beretta: {
      id: "pistol_beretta",
      name: "Pistola Beretta 92FS",
      type: "weapon",
      category: "pistola",
      damage: 12,
      fireRate: "Semiautomatica",
      ammoCapacity: 12,
      ammo: 12,
      ammoType: "pistol_ammo", // alias for consistency
      ammotype: "pistol_ammo", // legacy field kept for backward compatibility
    },
    pistol_43: {
      id: "pistol_43",
      name: "Pistola 43 Tactical",
      type: "weapon",
      category: "pistola",
      damage: 14,
      fireRate: "Semiautomatica",
      ammoCapacity: 15,
      ammo: 15,
      ammoType: "pistol_ammo",
      ammotype: "pistol_ammo", // keep legacy alias
    },
  };

  var ammoDefs = {
    pistol_ammo: {
      id: "pistol_ammo",
      name: "Munizioni 9mm",
      type: "ammo",
      amount: 0,
    },
  };

  function getWeaponDefs() {
    return weaponDefs;
  }

  function getAmmoDefs() {
    return ammoDefs;
  }

  window.RSG.gameplay.weapons = {
    getWeaponDefs: getWeaponDefs,
    getAmmoDefs: getAmmoDefs,
  };
})();
