// Model Names Mapping - Traduzione file 3D in nomi user-friendly
// Questo file mappa i nomi tecnici dei file .glb in nomi leggibili in italiano

window.RSG = window.RSG || {};
window.RSG.data = window.RSG.data || {};

(function() {
  /**
   * Mappa dei nomi file -> nome visualizzato
   */
  var modelNames = {
    // ARREDAMENTO
    "old_sofa_free.glb": "Divano Vecchio",
    "vintage_tv_free.glb": "TV Vintage",
    "chocolate_beech_bookshelf_free.glb": "Libreria Cioccolato",
    "dusty_old_bookshelf_free.glb": "Libreria Polverosa",
    "bench_model_free.glb": "Panchina",
    "laptop_free.glb": "Laptop",
    
    // ARMI
    "beretta_92fs_-_game_ready_-_free.glb": "Pistola Beretta 92FS",
    "pistol_43_tactical__free_lowpoly.glb": "Pistola Tattica 43",
    "paladin_longsword_free_download.glb": "Spada Lunga Paladino",
    
    // VESTITI & ACCESSORI
    "cowboy_hat_free.glb": "Cappello Cowboy",
    
    // DECORAZIONI
    "blue_eyeball_free.glb": "Occhio Blu Decorativo",
    "free_pack_-_rocks_stylized.glb": "Rocce Stilizzate",
    "grass_free_download.glb": "Erba",
    
    // STRUTTURE
    "free_barricade.glb": "Barricata",
    "warehouse_fbx_model_free.glb": "Magazzino",
    "interior_free.glb": "Interno Casa",
    "road_free.glb": "Strada",
    
    // PERSONAGGI & ANIMALI
    "r.e.p.o_realistic_character_free_download.glb": "Robot Assistente R.E.P.O.",
    "realistic_male_character.glb": "Personaggio Maschile",
    "deer_demo_free_download.glb": "Cervo",
    
    // STRUMENTI
    "tools_pack._free.glb": "Set Attrezzi"
  };

  /**
   * Ottiene il nome user-friendly di un modello
   * @param {string} fileName - Nome del file .glb
   * @returns {string} Nome user-friendly o il fileName ripulito se non trovato
   */
  function getDisplayName(fileName) {
    if (!fileName) return "Oggetto Sconosciuto";
    
    // Se esiste nel mapping, usa quello
    if (modelNames[fileName]) {
      return modelNames[fileName];
    }
    
    // Altrimenti pulisci il nome del file
    return fileName
      .replace(".glb", "")
      .replace(/_/g, " ")
      .split(" ")
      .map(function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }

  /**
   * Ottiene la categoria user-friendly di un modello
   * @param {string} category - Categoria tecnica
   * @returns {string} Categoria tradotta
   */
  function getCategoryName(category) {
    var categories = {
      "furniture": "Arredamento",
      "weapon": "Armi",
      "cloth": "Vestiti",
      "decoration": "Decorazioni",
      "decor": "Decorazioni",
      "structure": "Strutture",
      "character": "Personaggi",
      "animal": "Animali",
      "robot": "Robot",
      "usable": "Oggetti Interattivi",
      "repeated": "Natura",
      "garden": "Giardino",
      "indoor": "Interno",
      "outdoor": "Esterno"
    };
    
    return categories[category] || "Altro";
  }

  /**
   * Ottiene tutte le informazioni di un modello
   * @param {string} fileName - Nome del file
   * @param {string} category - Categoria del modello
   * @returns {Object} Oggetto con displayName, category, icon
   */
  function getModelInfo(fileName, category) {
    return {
      fileName: fileName,
      displayName: getDisplayName(fileName),
      category: getCategoryName(category),
      icon: getIconForCategory(category)
    };
  }

  /**
   * Ottiene l'icona emoji per una categoria
   * @param {string} category - Categoria
   * @returns {string} Emoji
   */
  function getIconForCategory(category) {
    var icons = {
      "furniture": "🛋️",
      "weapon": "🔫",
      "cloth": "👕",
      "decoration": "🎨",
      "decor": "🎨",
      "structure": "🏢",
      "character": "🧍",
      "animal": "🦌",
      "robot": "🤖",
      "usable": "💡",
      "repeated": "🌿",
      "garden": "🌳",
      "indoor": "🏠",
      "outdoor": "🌄"
    };
    
    return icons[category] || "📦";
  }

  // Esporta le funzioni
  window.RSG.data.modelNames = {
    getDisplayName: getDisplayName,
    getCategoryName: getCategoryName,
    getModelInfo: getModelInfo,
    getIconForCategory: getIconForCategory,
    mapping: modelNames
  };
})();
