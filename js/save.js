'use strict';

const SaveSystem = {
  save(state) {
    try {
      const data = JSON.stringify({ version: 1, savedAt: Date.now(), state });
      localStorage.setItem(CONSTANTS.SAVE_KEY, data);
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  },
  load() {
    try {
      const raw = localStorage.getItem(CONSTANTS.SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== 1) return null;
      if (!data.state || !data.state.player || !data.state.dungeon) return null;
      return data.state;
    } catch (e) {
      console.error('Load failed:', e);
      localStorage.removeItem(CONSTANTS.SAVE_KEY);
      return null;
    }
  },
  clear() {
    localStorage.removeItem(CONSTANTS.SAVE_KEY);
  },
  exists() {
    return localStorage.getItem(CONSTANTS.SAVE_KEY) !== null;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SaveSystem };
}