// Content: World Templates (predefined world configurations)
// Provides template data for world creation

window.RSG = window.RSG || {};
window.RSG.content = window.RSG.content || {};

(function () {
  var templates = {};

  /**
   * Empty template - Minimal environment for building from scratch
   */
  templates.empty = {
    name: "empty",
    label: "Vuoto",
    description: "Mondo vuoto con solo ambiente base. Perfetto per costruire da zero.",
    spawn: { x: 0, y: 1.7, z: 20 },
    objects: [],
    lighting: {
      ambient: 0.4,
      directional: 0.8
    },
    mapSize: 200,
    timeMode: "always-day",
    terrainType: "grass"
  };

  /**
   * Default template - Mondo base con impostazioni standard
   */
  templates.default = {
    name: "default",
    label: "Mondo Base",
    description: "Mondo standard con impostazioni base. Perfetto per iniziare.",
    spawn: { x: 0, y: 1.7, z: 20 },
    objects: [],
    lighting: {
      ambient: 0.6,
      directional: 0.8
    },
    mapSize: 200,
    timeMode: "always-day",
    terrainType: "grass"
  };

  /**
   * Get template by name
   * @param {string} name - Template name
   * @returns {Object|null} Template data or null
   */
  function getTemplate(name) {
    if (!name || !templates[name]) {
      console.warn("⚠️ WorldTemplates: Template not found:", name);
      return templates.default; // Fallback to default
    }

    var template = JSON.parse(JSON.stringify(templates[name])); // Deep clone
    return template;
  }

  /**
   * Get list of all available templates
   * @returns {Array} Array of template metadata
   */
  function listTemplates() {
    var list = [];
    for (var key in templates) {
      if (templates.hasOwnProperty(key)) {
        list.push({
          name: templates[key].name,
          label: templates[key].label,
          description: templates[key].description,
          readOnly: templates[key].readOnly || false
        });
      }
    }
    return list;
  }

  /**
   * Convert models.js format to world objects format
   * @param {Array} modelsList - List from models.js
   * @returns {Array} World objects array
   */
  function convertModelsListToObjects(modelsList) {
    if (!Array.isArray(modelsList)) return [];

    var objects = [];
    modelsList.forEach(function (item) {
      if (!item || !item.file) return;

      var obj = {
        file: item.file,
        position: {
          x: item.pos && item.pos[0] !== undefined ? item.pos[0] : 0,
          y: item.pos && item.pos[1] !== undefined ? item.pos[1] : 0,
          z: item.pos && item.pos[2] !== undefined ? item.pos[2] : 0
        },
        rotation: {
          x: 0,
          y: item.rot !== undefined ? item.rot : 0,
          z: 0
        },
        scale: {
          x: item.scale !== undefined ? item.scale : 1,
          y: item.scale !== undefined ? item.scale : 1,
          z: item.scale !== undefined ? item.scale : 1
        },
        collidable: item.category !== "decor" && item.category !== "usable" // Furniture is collidable
      };

      // Preserve original metadata
      if (item.category) obj.category = item.category;
      if (item.area) obj.area = item.area;
      if (item.id) obj.id = item.id;

      objects.push(obj);
    });

    return objects;
  }

  // Export API
  window.RSG.content.worldTemplates = {
    getTemplate: getTemplate,
    listTemplates: listTemplates
  };

  // Expose global shortcuts
  window.getWorldTemplate = getTemplate;
  window.listWorldTemplates = listTemplates;
})();
