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
