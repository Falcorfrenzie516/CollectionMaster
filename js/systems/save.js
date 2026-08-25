const SAVE_KEY = "collection_master_v1_1";

/**
 * Save player state to localStorage
 */
export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("Save failed:", e);
    return false;
  }
}

/**
 * Load player state from localStorage
 * Returns null if no save exists
 */
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Load failed:", e);
    return null;
  }
}

/**
 * Clear save data
 */
export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
