// Systems: World Manager (Minecraft-style world management)
// Handles: create/save/load/delete/duplicate worlds with localStorage persistence

window.RSG = window.RSG || {};
window.RSG.systems = window.RSG.systems || {};

(function () {
  var STORAGE_PREFIX = "rsg_world_";
  var WORLDS_LIST_KEY = "rsg_worlds_list";
  var CURRENT_WORLD_KEY = "rsg_current_world";
  var VERSION = "1.0.0";

  /**
   * Get list of all saved worlds metadata
   * @returns {Array} Array of world metadata objects
   */
  function listWorlds() {
    try {
      var raw = localStorage.getItem(WORLDS_LIST_KEY);
      if (!raw) return [];
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.warn("⚠️ WorldManager: Error loading worlds list", e);
      return [];
    }
  }

  /**
   * Create new world with given name and template
   * @param {string} name - World name
   * @param {string} templateName - Template to use (empty/default/survival/creative)
   * @returns {string|null} worldId of created world or null on error
   */
  function createWorld(name, configOrTemplateName) {
    if (!name || typeof name !== "string") {
      console.warn("⚠️ WorldManager: Invalid world name");
      return null;
    }

    var worldId = "world_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    var timestamp = Date.now();

    // Support both old (string) and new (object) API
    var config = {};
    if (typeof configOrTemplateName === "string") {
      config.template = configOrTemplateName;
    } else if (typeof configOrTemplateName === "object") {
      config = configOrTemplateName;
    }

    var templateName = config.template || "empty";
    var mapSize = config.mapSize || 200;
    var timeMode = config.timeMode || "always-day";
    var terrainType = config.terrainType || "grass";

    // Get template data
    var template = getTemplate(templateName);
    if (!template) {
      console.warn("⚠️ WorldManager: Invalid template", templateName);
      return null;
    }

    // Override template defaults with user config
    if (template.mapSize) mapSize = config.mapSize || template.mapSize;
    if (template.timeMode) timeMode = config.timeMode || template.timeMode;
    if (template.terrainType) terrainType = config.terrainType || template.terrainType;

    // Create world metadata
    var metadata = {
      id: worldId,
      name: name,
      createdAt: timestamp,
      lastPlayed: timestamp,
      template: templateName,
      playtime: 0,
      stats: {
        objectsPlaced: template.objects ? template.objects.length : 0,
        enemies: 0
      },
      mapSize: mapSize,
      timeMode: timeMode,
      terrainType: terrainType
    };

    // Create world data
    var worldData = {
      id: worldId,
      version: VERSION,
      objects: template.objects || [],
      playerState: {
        position: template.spawn || { x: 0, y: 1.7, z: 20 },
        inventory: [],
        health: 100
      },
      worldSettings: {
        mapSize: mapSize,
        timeMode: timeMode,
        terrainType: terrainType,
        weatherEnabled: false,
        lighting: template.lighting || { ambient: 0.5, directional: 0.8 }
      }
    };

    // Save world
    try {
      localStorage.setItem(STORAGE_PREFIX + worldId, JSON.stringify(worldData));
      
      // Update worlds list
      var list = listWorlds();
      list.push(metadata);
      localStorage.setItem(WORLDS_LIST_KEY, JSON.stringify(list));

      console.log("✅ WorldManager: Created world", worldId, name);
      return worldId;
    } catch (e) {
      console.error("❌ WorldManager: Error creating world", e);
      return null;
    }
  }

  /**
   * Load world data by ID
   * @param {string} worldId - World ID to load
   * @returns {Object|null} World data or null if not found
   */
  function loadWorld(worldId) {
    if (!worldId) {
      console.warn("⚠️ WorldManager: Invalid worldId for load");
      return null;
    }

    try {
      var raw = localStorage.getItem(STORAGE_PREFIX + worldId);
      if (!raw) {
        console.warn("⚠️ WorldManager: World not found", worldId);
        return null;
      }

      var data = JSON.parse(raw);
      
      // Update last played time in metadata
      updateWorldMetadata(worldId, { lastPlayed: Date.now() });
      
      console.log("✅ WorldManager: Loaded world", worldId);
      return data;
    } catch (e) {
      console.error("❌ WorldManager: Error loading world", worldId, e);
      return null;
    }
  }

  /**
   * Save world data
   * @param {string} worldId - World ID to save
   * @param {Object} worldData - World data to save
   * @returns {boolean} Success status
   */
  function saveWorld(worldId, worldData) {
    if (!worldId || !worldData) {
      console.warn("⚠️ WorldManager: Invalid parameters for save");
      return false;
    }

    try {
      // Ensure version is set
      worldData.version = worldData.version || VERSION;
      worldData.id = worldId;

      localStorage.setItem(STORAGE_PREFIX + worldId, JSON.stringify(worldData));
      
      // Update metadata stats
      updateWorldMetadata(worldId, {
        lastPlayed: Date.now(),
        stats: {
          objectsPlaced: worldData.objects ? worldData.objects.length : 0
        }
      });

      console.log("✅ WorldManager: Saved world", worldId);
      return true;
    } catch (e) {
      console.error("❌ WorldManager: Error saving world", worldId, e);
      return false;
    }
  }

  /**
   * Delete world by ID
   * @param {string} worldId - World ID to delete
   * @returns {boolean} Success status
   */
  function deleteWorld(worldId) {
    if (!worldId) {
      console.warn("⚠️ WorldManager: Invalid worldId for delete");
      return false;
    }

    try {
      // Remove world data
      localStorage.removeItem(STORAGE_PREFIX + worldId);
      
      // Remove from worlds list
      var list = listWorlds();
      list = list.filter(function (w) { return w.id !== worldId; });
      localStorage.setItem(WORLDS_LIST_KEY, JSON.stringify(list));

      console.log("✅ WorldManager: Deleted world", worldId);
      return true;
    } catch (e) {
      console.error("❌ WorldManager: Error deleting world", worldId, e);
      return false;
    }
  }

  /**
   * Duplicate world with new name
   * @param {string} worldId - Source world ID
   * @param {string} newName - Name for duplicated world
   * @returns {string|null} New worldId or null on error
   */
  function duplicateWorld(worldId, newName) {
    if (!worldId || !newName) {
      console.warn("⚠️ WorldManager: Invalid parameters for duplicate");
      return null;
    }

    try {
      // Load source world
      var sourceData = loadWorld(worldId);
      if (!sourceData) return null;

      // Create new world ID
      var newWorldId = "world_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      var timestamp = Date.now();

      // Get source metadata
      var sourceMetadata = getWorldMetadata(worldId);
      
      // Create duplicate metadata
      var newMetadata = {
        id: newWorldId,
        name: newName,
        createdAt: timestamp,
        lastPlayed: timestamp,
        template: sourceMetadata ? sourceMetadata.template : "custom",
        playtime: 0,
        stats: sourceMetadata ? JSON.parse(JSON.stringify(sourceMetadata.stats)) : { objectsPlaced: 0, enemies: 0 }
      };

      // Duplicate world data
      var newData = JSON.parse(JSON.stringify(sourceData));
      newData.id = newWorldId;

      // Save new world
      localStorage.setItem(STORAGE_PREFIX + newWorldId, JSON.stringify(newData));
      
      // Update worlds list
      var list = listWorlds();
      list.push(newMetadata);
      localStorage.setItem(WORLDS_LIST_KEY, JSON.stringify(list));

      console.log("✅ WorldManager: Duplicated world", worldId, "→", newWorldId);
      return newWorldId;
    } catch (e) {
      console.error("❌ WorldManager: Error duplicating world", worldId, e);
      return null;
    }
  }

  /**
   * Export world as JSON string
   * @param {string} worldId - World ID to export
   * @returns {string|null} JSON string or null on error
   */
  function exportWorld(worldId) {
    if (!worldId) {
      console.warn("⚠️ WorldManager: Invalid worldId for export");
      return null;
    }

    try {
      var data = loadWorld(worldId);
      if (!data) return null;

      var metadata = getWorldMetadata(worldId);
      var exportData = {
        metadata: metadata,
        data: data,
        exportedAt: Date.now(),
        version: VERSION
      };

      return JSON.stringify(exportData, null, 2);
    } catch (e) {
      console.error("❌ WorldManager: Error exporting world", worldId, e);
      return null;
    }
  }

  /**
   * Import world from JSON string
   * @param {string} jsonString - JSON export data
   * @returns {string|null} New worldId or null on error
   */
  function importWorld(jsonString) {
    if (!jsonString) {
      console.warn("⚠️ WorldManager: Invalid JSON for import");
      return null;
    }

    try {
      var importData = JSON.parse(jsonString);
      if (!importData.data || !importData.metadata) {
        console.warn("⚠️ WorldManager: Invalid import format");
        return null;
      }

      // Create new world ID
      var newWorldId = "world_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      var timestamp = Date.now();

      // Create metadata for imported world
      var metadata = {
        id: newWorldId,
        name: importData.metadata.name + " (Importato)",
        createdAt: timestamp,
        lastPlayed: timestamp,
        template: importData.metadata.template || "custom",
        playtime: 0,
        stats: importData.metadata.stats || { objectsPlaced: 0, enemies: 0 }
      };

      // Update world data ID
      var worldData = importData.data;
      worldData.id = newWorldId;

      // Save imported world
      localStorage.setItem(STORAGE_PREFIX + newWorldId, JSON.stringify(worldData));
      
      // Update worlds list
      var list = listWorlds();
      list.push(metadata);
      localStorage.setItem(WORLDS_LIST_KEY, JSON.stringify(list));

      console.log("✅ WorldManager: Imported world", newWorldId);
      return newWorldId;
    } catch (e) {
      console.error("❌ WorldManager: Error importing world", e);
      return null;
    }
  }

  /**
   * Get current world ID
   * @returns {string|null} Current world ID or null
   */
  function getCurrentWorld() {
    try {
      return localStorage.getItem(CURRENT_WORLD_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * Set current world ID
   * @param {string} worldId - World ID to set as current
   */
  function setCurrentWorld(worldId) {
    try {
      if (worldId) {
        localStorage.setItem(CURRENT_WORLD_KEY, worldId);
      } else {
        localStorage.removeItem(CURRENT_WORLD_KEY);
      }
    } catch (e) {
      console.warn("⚠️ WorldManager: Error setting current world", e);
    }
  }

  /**
   * Get world metadata by ID
   * @param {string} worldId - World ID
   * @returns {Object|null} Metadata or null
   */
  function getWorldMetadata(worldId) {
    var list = listWorlds();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === worldId) return list[i];
    }
    return null;
  }

  /**
   * Update world metadata
   * @param {string} worldId - World ID
   * @param {Object} updates - Metadata fields to update
   * @returns {boolean} Success status
   */
  function updateWorldMetadata(worldId, updates) {
    if (!worldId || !updates) return false;

    try {
      var list = listWorlds();
      var found = false;
      
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === worldId) {
          // Merge updates
          for (var key in updates) {
            if (updates.hasOwnProperty(key)) {
              if (key === "stats" && list[i].stats) {
                // Merge stats object
                for (var statKey in updates.stats) {
                  if (updates.stats.hasOwnProperty(statKey)) {
                    list[i].stats[statKey] = updates.stats[statKey];
                  }
                }
              } else {
                list[i][key] = updates[key];
              }
            }
          }
          found = true;
          break;
        }
      }

      if (found) {
        localStorage.setItem(WORLDS_LIST_KEY, JSON.stringify(list));
        return true;
      }
      return false;
    } catch (e) {
      console.warn("⚠️ WorldManager: Error updating metadata", e);
      return false;
    }
  }

  /**
   * Rename world
   * @param {string} worldId - World ID
   * @param {string} newName - New name
   * @returns {boolean} Success status
   */
  function renameWorld(worldId, newName) {
    if (!worldId || !newName) return false;
    return updateWorldMetadata(worldId, { name: newName });
  }

  /**
   * Get template data by name
   * @param {string} templateName - Template name
   * @returns {Object|null} Template data or null
   */
  function getTemplate(templateName) {
    // Check if templates module exists
    if (window.RSG && window.RSG.content && window.RSG.content.worldTemplates) {
      var api = window.RSG.content.worldTemplates;
      if (typeof api.getTemplate === "function") {
        return api.getTemplate(templateName);
      }
    }

    // Fallback: basic empty template
    console.warn("⚠️ WorldManager: Templates module not found, using fallback");
    return {
      name: "empty",
      label: "Vuoto",
      objects: [],
      spawn: { x: 0, y: 1.7, z: 20 }
    };
  }

  /**
   * Migrate old architectMap data to new world system
   * @returns {string|null} Created world ID or null
   */
  function migrateOldData() {
    try {
      var oldMap = localStorage.getItem("architectMap");
      if (!oldMap) {
        console.log("ℹ️ WorldManager: No legacy data to migrate");
        return null;
      }

      console.log("🔄 WorldManager: Migrating legacy architectMap data...");

      var oldObjects = JSON.parse(oldMap);
      var worldId = "world_legacy_" + Date.now();
      var timestamp = Date.now();

      var metadata = {
        id: worldId,
        name: "Il Mio Mondo Legacy",
        createdAt: timestamp,
        lastPlayed: timestamp,
        template: "custom",
        playtime: 0,
        stats: {
          objectsPlaced: oldObjects.length,
          enemies: 0
        }
      };

      var worldData = {
        id: worldId,
        version: VERSION,
        objects: oldObjects,
        playerState: {
          position: { x: 0, y: 1.7, z: 20 },
          inventory: [],
          health: 100
        },
        worldSettings: {
          timeOfDay: "noon",
          weatherEnabled: false
        }
      };

      // Save migrated world
      localStorage.setItem(STORAGE_PREFIX + worldId, JSON.stringify(worldData));
      
      var list = listWorlds();
      list.push(metadata);
      localStorage.setItem(WORLDS_LIST_KEY, JSON.stringify(list));

      // Set as current world
      setCurrentWorld(worldId);

      // Clean up old data
      localStorage.removeItem("architectMap");
      localStorage.removeItem("architectMapMeta");

      console.log("✅ WorldManager: Migration complete! Created world:", worldId);
      return worldId;
    } catch (e) {
      console.error("❌ WorldManager: Migration error", e);
      return null;
    }
  }

  // Auto-migrate on module load
  setTimeout(function() {
    var currentWorld = getCurrentWorld();
    if (!currentWorld) {
      // No current world - try migration
      var migrated = migrateOldData();
      if (!migrated) {
        // No migration needed - check if we have any worlds
        var worlds = listWorlds();
        if (worlds.length === 0) {
          console.log("ℹ️ WorldManager: No worlds found, will need to create one");
        }
      }
    }
  }, 100);

  // Export API
  window.RSG.systems.worldManager = {
    createWorld: createWorld,
    loadWorld: loadWorld,
    saveWorld: saveWorld,
    deleteWorld: deleteWorld,
    duplicateWorld: duplicateWorld,
    exportWorld: exportWorld,
    importWorld: importWorld,
    listWorlds: listWorlds,
    getCurrentWorld: getCurrentWorld,
    setCurrentWorld: setCurrentWorld,
    getWorldMetadata: getWorldMetadata,
    updateWorldMetadata: updateWorldMetadata,
    renameWorld: renameWorld,
    migrateOldData: migrateOldData
  };

  // Expose global shortcuts
  window.createWorld = createWorld;
  window.loadWorld = loadWorld;
  window.saveWorld = saveWorld;
  window.listWorlds = listWorlds;
})();
