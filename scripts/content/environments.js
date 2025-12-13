// Content: environment registry (data + helpers)
// Browser-safe, no imports. Depends on window.RSG.content.models for model lists.

window.RSG = window.RSG || {};
window.RSG.content = window.RSG.content || {};

(function () {
  function getDefaultModels() {
    if (!window.RSG.content || !window.RSG.content.models || typeof window.RSG.content.models.getFurniture !== "function") {
      return [];
    }
    return window.RSG.content.models.getFurniture();
  }

  function getTestRangeModels() {
    return [
      { file: "free_barricade.glb", pos: [0, 0, -10], rot: 0, scale: 1.0, category: "structure", area: "range" },
      { file: "bench_model_free.glb", pos: [-6, 0, -6], rot: Math.PI / 4, scale: 1.0, category: "furniture", area: "range" },
      { file: "bench_model_free.glb", pos: [6, 0, -6], rot: -Math.PI / 4, scale: 1.0, category: "furniture", area: "range" },
      { file: "free_pack_-_rocks_stylized.glb", pos: [12, 0, 6], rot: 0.2, scale: 1.0, category: "decor", area: "range" },
      { file: "grass_free_download.glb", pos: [0, 0, 8], rot: 0, scale: 1.5, category: "repeated", area: "range" },
      { file: "grass_free_download.glb", pos: [-8, 0, 8], rot: 0.15, scale: 1.5, category: "repeated", area: "range" },
    ];
  }

  function getBunkerModels() {
    return [
      // Armi e munizioni (warehouse come rack)
      { file: "warehouse_fbx_model_free.glb", pos: [-8, 0, -8], rot: Math.PI / 2, scale: 0.3, category: "structure", area: "bunker" },
      { 
        file: "beretta_92fs_-_game_ready_-_free.glb", 
        pos: [-7.5, 1.0, -7], 
        rot: Math.PI / 2, 
        scale: 0.05, 
        category: "usable", 
        id: "bunker_pistol_1"
      },
      { 
        file: "pistol_43_tactical__free_lowpoly.glb", 
        pos: [-7.5, 1.0, -8.5], 
        rot: Math.PI / 2, 
        scale: 0.045, 
        category: "usable", 
        id: "bunker_pistol_2"
      },
      
      // Workbench e tools
      { file: "bench_model_free.glb", pos: [0, 0, -10], rot: 0, scale: 1.2, category: "furniture", area: "bunker" },
      { file: "tools_pack._free.glb", pos: [0, 0.85, -10], rot: 0, scale: 1.0, category: "usable", area: "bunker", id: "bunker_tools" },
      { file: "laptop_free.glb", pos: [2, 0.88, -10], rot: Math.PI, scale: 0.35, category: "usable", area: "bunker", id: "bunker_laptop" },
      
      // Storage e barricades
      { file: "free_barricade.glb", pos: [8, 0, -8], rot: Math.PI / 4, scale: 1.0, category: "structure", area: "bunker" },
      { file: "free_barricade.glb", pos: [-8, 0, 8], rot: -Math.PI / 4, scale: 1.0, category: "structure", area: "bunker" },
      
      // Emergency light
      { file: "blue_eyeball_free.glb", pos: [0, 2.8, 0], rot: 0, scale: 0.6, category: "decor", area: "bunker" },
      
      // Equipment crates (usando bench come placeholder)
      { file: "bench_model_free.glb", pos: [8, 0, 0], rot: Math.PI / 2, scale: 0.8, category: "furniture", area: "bunker" },
      { file: "bench_model_free.glb", pos: [8, 0, 3], rot: Math.PI / 2, scale: 0.8, category: "furniture", area: "bunker" },
    ];
  }

  function getApartmentModels() {
    return [
      // Base apartment structure
      { file: "interior_free.glb", pos: [0, 0, 0], rot: 0, scale: 0.6, category: "structure", area: "apartment" },
      
      // Living area
      { file: "old_sofa_free.glb", pos: [-3, 0, 2], rot: Math.PI / 2, scale: 1.2, category: "furniture", area: "apartment" },
      { file: "vintage_tv_free.glb", pos: [3, 1, 2], rot: -Math.PI / 2, scale: 0.8, category: "furniture", area: "apartment" },
      
      // Storage
      { file: "chocolate_beech_bookshelf_free.glb", pos: [0, 0, -5], rot: 0, scale: 1.0, category: "decor", area: "apartment" },
      
      // Work area
      { file: "bench_model_free.glb", pos: [-4, 0, -3], rot: Math.PI / 4, scale: 0.9, category: "furniture", area: "apartment" },
      { file: "laptop_free.glb", pos: [-4, 0.88, -3], rot: Math.PI / 4, scale: 0.35, category: "usable", area: "apartment", id: "apartment_laptop" },
      
      // Bed area (bench as placeholder)
      { file: "bench_model_free.glb", pos: [4, 0, -3], rot: -Math.PI / 4, scale: 1.5, category: "furniture", area: "apartment" },
      
      // Decorations
      { file: "cowboy_hat_free.glb", pos: [0, 1.6, -4.8], rot: 0, scale: 0.15, category: "usable", area: "apartment", id: "apartment_hat" },
    ];
  }

  var environments = [
    {
      id: "warehouse",
      label: "Warehouse Yard",
      description: "Default mixed indoor/outdoor yard with house walls and props.",
      spawn: { position: [0, 1.7, 10], yaw: 0 },
      lighting: {
        background: 0x87ceeb,
        fog: { color: 0x87ceeb, near: 50, far: 300 },
        ambient: { color: 0xffffff, intensity: 0.6 },
        directional: { color: 0xffffff, intensity: 0.8, position: [50, 50, 50] },
        fill: { color: 0xffffff, intensity: 0.3, position: [-50, 30, -50] },
      },
      layout: "warehouse",
      models: getDefaultModels,
    },
    {
      id: "test-range",
      label: "Test Range",
      description: "Small flat range with a few props for quick load and aiming tests.",
      spawn: { position: [0, 1.7, 6], yaw: 0 },
      lighting: {
        background: 0x556677,
        fog: { color: 0x556677, near: 30, far: 180 },
        ambient: { color: 0xe0e6ff, intensity: 0.6 },
        directional: { color: 0xffffff, intensity: 0.9, position: [30, 60, 30] },
        fill: { color: 0x88aaff, intensity: 0.25, position: [-20, 25, -10] },
      },
      layout: "range",
      models: getTestRangeModels,
    },
    {
      id: "bunker",
      label: "Underground Bunker",
      description: "Dark military bunker with weapon storage and survival equipment.",
      spawn: { position: [0, 1.7, 8], yaw: Math.PI },
      lighting: {
        background: 0x1a1a1a,  // Very dark
        fog: { color: 0x1a1a1a, near: 15, far: 60 },
        ambient: { color: 0xff6600, intensity: 0.3 },  // Orange emergency lighting
        directional: { color: 0xff8844, intensity: 0.5, position: [10, 20, 10] },
        fill: { color: 0xff4400, intensity: 0.2, position: [-10, 15, -10] },
      },
      layout: "bunker",
      models: getBunkerModels,
    },
    {
      id: "apartment",
      label: "Safe House Apartment",
      description: "Cozy urban apartment with storage and rest area.",
      spawn: { position: [0, 1.7, 6], yaw: 0 },
      lighting: {
        background: 0x8899aa,  // Grey-blue indoor
        fog: { color: 0x8899aa, near: 10, far: 50 },
        ambient: { color: 0xffffee, intensity: 0.7 },  // Warm indoor light
        directional: { color: 0xffffff, intensity: 0.6, position: [15, 25, 15] },
        fill: { color: 0xccddff, intensity: 0.4, position: [-10, 20, -10] },
      },
      layout: "apartment",
      models: getApartmentModels,
    },
  ];

  function getEnvironments() {
    return environments.slice();
  }

  function getEnvironment(id) {
    return environments.find(function (env) {
      return env.id === id;
    });
  }

  function getDefaultEnvironmentId() {
    return environments[0] ? environments[0].id : null;
  }

  window.RSG.content.environments = {
    getEnvironments: getEnvironments,
    getEnvironment: getEnvironment,
    getDefaultEnvironmentId: getDefaultEnvironmentId,
  };
})();
