/**
 * ================================================================
 *  js/storage.js
 *  游戏数据持久化层（IndexedDB 实现，含完整增删改查与导出导入）
 *  
 *  提供四类数据持久化：
 *  1. 游戏存档（saves）—— 完整游戏状态快照
 *  2. 玩家统计（stats）—— 累计成就数据
 *  3. 历史记录（history）—— 每局结算记录
 *  4. 导入/导出（备份与迁移）
 *  
 *  所有方法均返回 Promise，支持 async/await 调用。
 *  若浏览器不支持 IndexedDB，自动降级为 localStorage。
 *
 *  【使用说明】
 *    - 在 index.html 中通过 <script src="js/storage.js"></script> 引入。
 *    - 在游戏初始化时调用 `await StorageManager.initDB()`。
 *    - 保存游戏：`await StorageManager.saveGame(StorageManager.snapshot(game))`
 *    - 读取存档：`const save = await StorageManager.loadGame(id)`
 *    - 记录战绩：`await StorageManager.addHistory({seed, result, turns_played, player_level, kills})`
 *
 *  【Bug 防御指南】
 *    * IndexedDB 可能因隐私模式、存储满、权限拒绝等原因失败，自动降级为 localStorage。
 *    * localStorage 容量约 5MB，地图数据过大时写入可能失败。建议定期清理旧存档。
 *    * 并发写入（如快速连续保存）可能导致事务冲突，建议使用队列或节流。
 *    * importAllData 会清空现有数据，导入前请二次确认。
 *    * 所有 ID 为自增字段，导入时需删除 id，否则会覆盖原记录。
 *    * snapshot() 不会深拷贝对象，若游戏状态被修改，存档数据也会受影响。建议传入深拷贝副本。
 * ================================================================
 */

const StorageManager = (() => {
    'use strict';

    // ---- 常量 ----
    const DB_NAME = 'dungeon_game_db';
    const DB_VERSION = 2; // 升级版本以兼容新仓库
    const STORE_SAVES = 'saves';
    const STORE_STATS = 'stats';
    const STORE_HISTORY = 'history';

    // ---- 内部状态 ----
    let _db = null;                  // 数据库连接
    let _useLocalStorage = false;    // 是否降级到 localStorage

    // ================================================================
    //  底层数据库操作（IndexedDB / localStorage 统一封装）
    // ================================================================

    /**
     * 打开 IndexedDB 数据库并创建对象仓库
     * @returns {Promise<IDBDatabase>}
     */
    function _openDB() {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                _useLocalStorage = true;
                reject(new Error('当前环境不支持 IndexedDB，已降级为 localStorage'));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建存档仓库（主键 id 自增）
                if (!db.objectStoreNames.contains(STORE_SAVES)) {
                    const saveStore = db.createObjectStore(STORE_SAVES, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    saveStore.createIndex('timestamp', 'timestamp', { unique: false });
                    saveStore.createIndex('seed', 'seed', { unique: false });
                }

                // 创建统计仓库（主键 key）
                if (!db.objectStoreNames.contains(STORE_STATS)) {
                    db.createObjectStore(STORE_STATS, { keyPath: 'key' });
                }

                // 创建历史记录仓库（主键 id 自增）
                if (!db.objectStoreNames.contains(STORE_HISTORY)) {
                    const historyStore = db.createObjectStore(STORE_HISTORY, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                    historyStore.createIndex('result', 'result', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                _db = event.target.result;
                resolve(_db);
            };

            request.onerror = (event) => {
                _useLocalStorage = true;
                reject(new Error('IndexedDB 打开失败: ' + (event.target.error && event.target.error.message)));
            };
        });
    }

    // ---- localStorage 降级辅助 ----

    function _lsGet(key) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : null;
        } catch (e) {
            console.error('[Storage] localStorage 读取失败', e);
            return null;
        }
    }

    function _lsSet(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
            return true;
        } catch (e) {
            console.error('[Storage] localStorage 写入失败', e);
            return false;
        }
    }

    function _lsDelete(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) { /* ignore */ }
    }

    function _lsGetAll(prefix) {
        const result = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    const val = JSON.parse(localStorage.getItem(key));
                    if (val) result.push(val);
                }
            }
        } catch (e) { /* ignore */ }
        return result.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    // ---- IndexedDB 通用 CRUD ----

    function _dbGetAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!_db) return reject(new Error('数据库未初始化'));
            const tx = _db.transaction(storeName, 'readonly');
            const request = tx.objectStore(storeName).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    function _dbGet(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!_db) return reject(new Error('数据库未初始化'));
            const tx = _db.transaction(storeName, 'readonly');
            const request = tx.objectStore(storeName).get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    function _dbPut(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!_db) return reject(new Error('数据库未初始化'));
            const tx = _db.transaction(storeName, 'readwrite');
            const request = tx.objectStore(storeName).put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function _dbDelete(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!_db) return reject(new Error('数据库未初始化'));
            const tx = _db.transaction(storeName, 'readwrite');
            const request = tx.objectStore(storeName).delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ================================================================
    //  初始化
    // ================================================================

    /**
     * 初始化存储层
     * - 打开 IndexedDB，创建对象仓库
     * - 失败时降级为 localStorage
     * - 确保统计数据存在
     * @returns {Promise<{use: string, stats: Object}>}
     */
    async function initDB() {
        try {
            await _openDB();
            console.log('[Storage] IndexedDB 初始化成功');
        } catch (e) {
            console.warn('[Storage] 降级为 localStorage: ' + e.message);
            _useLocalStorage = true;
        }

        // 确保统计数据存在
        const stats = await getStats();
        if (!Object.keys(stats).length) {
            const defaultStats = {
                key: 'player1',
                wins: 0,
                deaths: 0,
                total_turns: 0,
                total_kills: 0,
                highest_level: 1,
                max_hp: 100,
                max_atk: 10,
                max_def: 2,
                first_run_done: false,
                first_played_at: null,
                timestamp: Date.now()
            };
            await _putStats(defaultStats);
        }

        return {
            use: _useLocalStorage ? 'localStorage' : 'indexedDB',
            stats: await getStats()
        };
    }

    function _getStatsKey() {
        return 'dungeon_stats_player1';
    }

    // ================================================================
    //  存档操作
    // ================================================================

    /**
     * 保存游戏状态
     * @param {Object} state - 游戏状态对象
     * @param {Object} [options] - 附加选项（name）
     * @returns {Promise<number>} 存档 ID
     */
    async function saveGame(state, options = {}) {
        const timestamp = Date.now();
        const record = {
            ...state,
            timestamp,
            name: options.name || `存档 ${new Date(timestamp).toLocaleTimeString()}`
        };

        if (_useLocalStorage) {
            const id = (_lsGet('dungeon_next_id') || 1);
            record.id = id;
            _lsSet('dungeon_next_id', id + 1);
            _lsSet(`dungeon_save_${id}`, record);
            return id;
        }
        return await _dbPut(STORE_SAVES, record);
    }

    /**
     * 加载指定 ID 的存档
     * @param {number} id 存档 ID
     * @returns {Promise<Object|null>}
     */
    async function loadGame(id) {
        if (_useLocalStorage) return _lsGet(`dungeon_save_${id}`);
        return await _dbGet(STORE_SAVES, id);
    }

    /**
     * 获取所有存档（按时间倒序）
     * @returns {Promise<Array>}
     */
    async function getAllSaves() {
        if (_useLocalStorage) return _lsGetAll('dungeon_save_');
        const all = await _dbGetAll(STORE_SAVES);
        return all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    /**
     * 删除指定存档
     * @param {number} id
     * @returns {Promise<void>}
     */
    async function deleteSave(id) {
        if (_useLocalStorage) {
            _lsDelete(`dungeon_save_${id}`);
            return;
        }
        return await _dbDelete(STORE_SAVES, id);
    }

    /**
     * 获取存档数量
     * @returns {Promise<number>}
     */
    async function getSaveCount() {
        const saves = await getAllSaves();
        return saves.length;
    }

    /**
     * 获取最新存档
     * @returns {Promise<Object|null>}
     */
    async function getLatestSave() {
        const saves = await getAllSaves();
        return saves.length > 0 ? saves[0] : null;
    }

    /**
     * 清空所有存档
     * @returns {Promise<number>} 删除数量
     */
    async function clearAllSaves() {
        const saves = await getAllSaves();
        for (const save of saves) {
            if (save.id !== undefined) {
                await deleteSave(save.id);
            }
        }
        return saves.length;
    }

    // ================================================================
    //  统计操作
    // ================================================================

    async function _putStats(stats) {
        if (_useLocalStorage) {
            _lsSet(_getStatsKey(), stats);
            return stats;
        }
        return await _dbPut(STORE_STATS, stats);
    }

    /**
     * 获取玩家统计
     * @returns {Promise<Object>}
     */
    async function getStats() {
        if (_useLocalStorage) return _lsGet(_getStatsKey()) || {};
        return await _dbGet(STORE_STATS, 'player1') || {};
    }

    /**
     * 部分更新统计（自动合并）
     * @param {Object} patch
     * @returns {Promise<Object>}
     */
    async function updateStats(patch) {
        const current = await getStats();
        const merged = {
            key: 'player1',
            wins: 0,
            deaths: 0,
            total_turns: 0,
            total_kills: 0,
            highest_level: 1,
            max_hp: 100,
            max_atk: 10,
            max_def: 2,
            first_run_done: false,
            first_played_at: null,
            timestamp: Date.now(),
            ...current,
            ...patch,
            timestamp: Date.now()
        };
        await _putStats(merged);
        return merged;
    }

    /**
     * 增加一场胜利
     */
    async function addWin() {
        const s = await getStats();
        return await updateStats({ wins: (s.wins || 0) + 1 });
    }

    /**
     * 增加一场死亡
     */
    async function addDeath() {
        const s = await getStats();
        return await updateStats({ deaths: (s.deaths || 0) + 1 });
    }

    // ================================================================
    //  历史记录
    // ================================================================

    /**
     * 添加一条历史记录
     * @param {Object} entry
     * @returns {Promise<number>}
     */
    async function addHistory(entry) {
        const record = { ...entry, timestamp: Date.now() };
        if (_useLocalStorage) {
            const all = _lsGet('dungeon_history_all') || [];
            const id = (_lsGet('dungeon_history_next') || 1);
            record.id = id;
            _lsSet('dungeon_history_next', id + 1);
            all.push(record);
            _lsSet('dungeon_history_all', all);
            return id;
        }
        return await _dbPut(STORE_HISTORY, record);
    }

    /**
     * 获取历史记录（按时间倒序）
     * @param {number} [limit=20] 条数限制
     * @returns {Promise<Array>}
     */
    async function getHistory(limit = 20) {
        if (_useLocalStorage) {
            const all = _lsGet('dungeon_history_all') || [];
            return all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, limit);
        }
        const all = await _dbGetAll(STORE_HISTORY);
        return all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, limit);
    }

    /**
     * 删除单条历史记录
     * @param {number} id
     * @returns {Promise<void>}
     */
    async function deleteHistory(id) {
        if (_useLocalStorage) {
            const all = _lsGet('dungeon_history_all') || [];
            const filtered = all.filter(h => h.id !== id);
            _lsSet('dungeon_history_all', filtered);
            return;
        }
        return await _dbDelete(STORE_HISTORY, id);
    }

    /**
     * 清空历史记录
     * @returns {Promise<number>} 删除数量
     */
    async function clearAllHistory() {
        if (_useLocalStorage) {
            const all = _lsGet('dungeon_history_all') || [];
            _lsSet('dungeon_history_all', []);
            return all.length;
        }
        const all = await _dbGetAll(STORE_HISTORY);
        for (const entry of all) {
            await _dbDelete(STORE_HISTORY, entry.id);
        }
        return all.length;
    }

    // ================================================================
    //  导入 / 导出 / 重置
    // ================================================================

    /**
     * 导出所有数据为 JSON 字符串
     * @returns {Promise<string>}
     */
    async function exportAllData() {
        const [saves, stats, history] = await Promise.all([
            getAllSaves(),
            getStats(),
            getHistory(9999)
        ]);
        return JSON.stringify({
            version: 1,
            exportedAt: Date.now(),
            saves,
            stats,
            history
        }, null, 2);
    }

    /**
     * 从 JSON 字符串导入数据（覆盖现有数据）
     * @param {string} json - 导出时生成的 JSON
     * @returns {Promise<{saves: number, history: number, stats: boolean}>}
     */
    async function importAllData(json) {
        let data;
        try {
            data = JSON.parse(json);
        } catch (e) {
            throw new Error('无效的 JSON 数据: ' + e.message);
        }

        if (data.version !== 1) {
            throw new Error('不支持的导出版本: ' + data.version);
        }

        // 清空现有数据
        await clearAllSaves();
        await clearAllHistory();

        // 导入存档
        let savesImported = 0;
        if (Array.isArray(data.saves)) {
            for (const save of data.saves) {
                delete save.id; // 防止覆盖原记录
                await saveGame(save, { name: save.name });
                savesImported++;
            }
        }

        // 导入统计
        let statsImported = false;
        if (data.stats && typeof data.stats === 'object') {
            await updateStats(data.stats);
            statsImported = true;
        }

        // 导入历史
        let historyImported = 0;
        if (Array.isArray(data.history)) {
            for (const entry of data.history) {
                delete entry.id; // 防止覆盖原记录
                await addHistory(entry);
                historyImported++;
            }
        }

        return {
            saves: savesImported,
            history: historyImported,
            stats: statsImported
        };
    }

    /**
     * 重置所有数据（清空存档、历史、统计）
     * @returns {Promise<void>}
     */
    async function resetAllData() {
        await clearAllSaves();
        await clearAllHistory();
        await updateStats({
            wins: 0,
            deaths: 0,
            total_turns: 0,
            total_kills: 0,
            highest_level: 1,
            max_hp: 100,
            max_atk: 10,
            max_def: 2,
            first_run_done: false,
            first_played_at: null
        });
    }

    // ================================================================
    //  游戏状态序列化辅助
    // ================================================================

    /**
     * 从当前游戏对象创建可存储快照
     * @param {Object} game - 游戏全局对象
     * @returns {Object} 可存储的存档数据
     * 
     * 【Bug 防御】
     *   此方法仅做浅拷贝，若 game.player / monsters / items 等
     *   在后续被修改，存档中的引用也会变化。建议调用时传入
     *   深拷贝副本，例如：
     *   JSON.parse(JSON.stringify(StorageManager.snapshot(game)))
     */
    function snapshot(game) {
        return {
            seed: game.seed,
            player: game.player,
            monsters: game.monsters,
            items: game.items,
            map: game.map,
            rooms: game.rooms,
            turnCount: game.turnCount,
            gameOver: game.gameOver,
            gameWon: game.gameWon,
            version: 1
        };
    }

    /**
     * 校验存档数据完整性
     * @param {Object} data
     * @returns {boolean}
     */
    function validate(data) {
        return !!(
            data &&
            typeof data.seed !== 'undefined' &&
            data.player &&
            Array.isArray(data.monsters) &&
            Array.isArray(data.items) &&
            Array.isArray(data.map)
        );
    }

    // ================================================================
    //  对外接口
    // ================================================================

    return {
        // 初始化
        initDB,
        // 存档
        saveGame,
        loadGame,
        getAllSaves,
        deleteSave,
        getSaveCount,
        getLatestSave,
        clearAllSaves,
        // 统计
        getStats,
        updateStats,
        addWin,
        addDeath,
        // 历史
        addHistory,
        getHistory,
        deleteHistory,
        clearAllHistory,
        // 导入导出
        exportAllData,
        importAllData,
        resetAllData,
        // 辅助
        snapshot,
        validate,
        // 属性
        get use() { return _useLocalStorage ? 'localStorage' : 'indexedDB'; }
    };
})();