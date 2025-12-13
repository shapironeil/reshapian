// Content: 3D models list (data only)
// Browser-safe, no imports.

window.RSG = window.RSG || {};
window.RSG.content = window.RSG.content || {};

(function () {
  // Furniture / props / NPCs / animals list
  function getFurniture() {
    return [
      // --- INDOOR: living area ---
      { file: "old_sofa_free.glb", pos: [0, 0, 8], rot: Math.PI, scale: 1.5, category: "furniture", area: "indoor" },
      { file: "old_sofa_free.glb", pos: [-5, 0, 6], rot: Math.PI * 0.9, scale: 1.3, category: "furniture", area: "indoor" },
      { file: "old_sofa_free.glb", pos: [5, 0, 6], rot: Math.PI * 1.1, scale: 1.3, category: "furniture", area: "indoor" },
      { file: "vintage_tv_free.glb", pos: [0, 1, 0], rot: Math.PI, scale: 0.8, category: "furniture", area: "indoor" },
      { file: "chocolate_beech_bookshelf_free.glb", pos: [-8, 0, -4], rot: Math.PI / 2, scale: 1.0, category: "decor", area: "indoor" },
      { file: "dusty_old_bookshelf_free.glb", pos: [8, 0, -4], rot: -Math.PI / 2, scale: 1.0, category: "decor", area: "indoor" },
      { file: "cowboy_hat_free.glb", pos: [-8, 1.6, -3.5], rot: 0, scale: 0.15, category: "decor", area: "indoor" },
      { file: "blue_eyeball_free.glb", pos: [8, 1.4, -3.5], rot: 0, scale: 0.5, category: "decor", area: "indoor" },

      // --- INDOOR: study / work area ---
      { file: "laptop_free.glb", pos: [10, 1.06, -5], rot: 0, scale: 0.35, category: "usable", area: "indoor", id: "pc_laptop" },
      {
        file: "beretta_92fs_-_game_ready_-_free.glb",
        pos: [11, 1.08, -4.5],
        rot: Math.PI / 2 + Math.PI,  // 180° vertical rotation
        scale: 0.05,  // MOLTO PIÙ GRANDE: ben visibile sul tavolo
        category: "usable",
        area: "indoor",
        id: "pistol_beretta",
      },
      {
        file: "pistol_43_tactical__free_lowpoly.glb",
        pos: [9, 1.08, -4.5],
        rot: Math.PI / 2,
        scale: 0.045,  // MOLTO PIÙ GRANDE: ben visibile sul tavolo
        category: "usable",
        area: "indoor",
        id: "pistol_43",
      },
      { file: "paladin_longsword_free_download.glb", pos: [-12, 1.2, 4], rot: 0, scale: 0.4, category: "usable", area: "indoor", id: "sword_longsword" },
      { file: "tools_pack._free.glb", pos: [-10, 0, 6], rot: 0, scale: 0.9, category: "usable", area: "indoor" },

      // --- INDOOR: characters ---
      {
        file: "r.e.p.o_realistic_character_free_download.glb",
        pos: [-3, 0, 2],
        rot: Math.PI / 6,
        scale: 1.0,
        category: "robot",
        area: "indoor",
        id: "robot_helper",
      },
      { file: "realistic_male_character.glb", pos: [3, 0, 2], rot: -Math.PI / 6, scale: 1.0, category: "character", area: "indoor" },

      // --- OUTDOOR: bench and rocks ---
      { file: "bench_model_free.glb", pos: [-10, 0, 35], rot: Math.PI / 2, scale: 1.0, category: "furniture", area: "garden" },
      { file: "free_pack_-_rocks_stylized.glb", pos: [-5, 0, 50], rot: 0, scale: 1.0, category: "decor", area: "garden" },
      { file: "free_pack_-_rocks_stylized.glb", pos: [12, 0, 60], rot: 0.3, scale: 1.0, category: "decor", area: "garden" },

      // --- OUTDOOR: grass repeated ---
      { file: "grass_free_download.glb", pos: [0, 0, 45], rot: 0, scale: 1.5, category: "repeated", area: "garden" },
      { file: "grass_free_download.glb", pos: [-8, 0, 55], rot: 0.2, scale: 1.5, category: "repeated", area: "garden" },
      { file: "grass_free_download.glb", pos: [8, 0, 55], rot: -0.2, scale: 1.5, category: "repeated", area: "garden" },
      { file: "grass_free_download.glb", pos: [0, 0, 65], rot: 0.1, scale: 1.5, category: "repeated", area: "garden" },
      { file: "grass_free_download.glb", pos: [-15, 0, 45], rot: -0.1, scale: 1.5, category: "repeated", area: "garden" },
      { file: "grass_free_download.glb", pos: [15, 0, 45], rot: 0.15, scale: 1.5, category: "repeated", area: "garden" },
      { file: "grass_free_download.glb", pos: [-15, 0, 60], rot: 0.05, scale: 1.5, category: "repeated", area: "garden" },
      { file: "grass_free_download.glb", pos: [15, 0, 60], rot: -0.05, scale: 1.5, category: "repeated", area: "garden" },
      { file: "grass_free_download.glb", pos: [-5, 0, 70], rot: 0.12, scale: 1.5, category: "repeated", area: "garden" },
      { file: "grass_free_download.glb", pos: [5, 0, 70], rot: -0.12, scale: 1.5, category: "repeated", area: "garden" },

      // --- OUTDOOR: structures and road ---
      { file: "warehouse_fbx_model_free.glb", pos: [60, 0, 60], rot: Math.PI / 4, scale: 0.5, category: "structure", area: "garden" },
      { file: "interior_free.glb", pos: [-60, 0, -40], rot: 0, scale: 0.5, category: "structure", area: "outdoor" },
      { file: "road_free.glb", pos: [0, 0, -70], rot: 0, scale: 0.7, category: "structure", area: "outdoor" },
      { file: "free_barricade.glb", pos: [0, 0, 80], rot: 0, scale: 1.0, category: "structure", area: "garden" },

      // --- OUTDOOR: animals ---
      { file: "deer_demo_free_download.glb", pos: [0, 0, 55], rot: 0, scale: 1.5, category: "animal", area: "garden", radius: 10, speed: 0.5 },
    ];
  }

  window.RSG.content.models = {
    getFurniture: getFurniture,
  };
})();
