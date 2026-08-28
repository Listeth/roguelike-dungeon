// =========================================================
// StorageManager.js
// localStorage 读写封装，模拟数据库单表操作
// =========================================================
class StorageManager {
  static get STORAGE_KEY() {
    return 'procedural_dungeon_save';
  }

  static get VERSION_KEY() {
    return 'procedural_dungeon_save_version';
  }

  /**
   * 读取当前存档结构版本号
   * @returns {number|null}
   */
  static getSchemaVersion() {
    const v = localStorage.getItem(this.VERSION_KEY);
    return v === null ? null : Number(v);
  }

  /**
   * 设置存档结构版本号
   * @param {number} version
   */
  static setSchemaVersion(version) {
    localStorage.setItem(this.VERSION_KEY, String(version));
  }

  /**
   * 读取完整存档（若不存在或损坏返回 null）
   * @returns {Object|null}
   */
  static load() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (data.version !== 1) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * 写入存档
   * @param {Object} data
   */
  static save(data) {
    if (!data || typeof data !== 'object') return;
    const payload = {
      ...data,
      updated_at: Date.now()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
  }

  /**
   * 清除存档与版本号
   */
  static clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.VERSION_KEY);
  }
}