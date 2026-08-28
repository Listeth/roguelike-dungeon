/**
 * ================================================================
 *  js/init-db.js
 *  存储层初始化脚本
 * 
 *  【使用说明】
 *  在 index.html 中按以下顺序引入：
 *  <script src="js/storage.js"></script>
 *  <script src="js/init-db.js"></script>
 *  
 *  或直接在游戏启动时（如 initGame() 开始前）调用：
 *  await StorageManager.initDB();
 *
 *  【Bug 防御】
 *  * 脚本是立即执行的 IIFE，若在 DOM 加载前运行，可能无法获取
 *    到 StorageManager（因为 storage.js 尚未加载）。请务必确保
 *    storage.js 先加载。
 *  * 若初始化失败（如隐私模式），脚本会捕获错误并输出日志，
 *    游戏仍可正常运行（存储功能降级）。
 *  * 多次调用 initDB 是安全的，但会重复创建统计记录（幂等）。
 * ================================================================
 */

(async function initDatabase() {
    try {
        const result = await StorageManager.initDB();
        console.log(
            '[DB Init] 存储层就绪 | 模式: %s | 统计: %o',
            result.use,
            result.stats
        );

        // 若统计中缺少必要字段，自动补全
        const stats = result.stats;
        if (stats && stats.key === 'player1') {
            // 检查是否需要显示欢迎信息（首次使用）
            if (!stats.first_run_done) {
                console.log(
                    '[DB Init] 首次使用，已创建玩家档案 "player1"'
                );
                await StorageManager.updateStats({
                    first_run_done: true,
                    first_played_at: Date.now()
                });
            }
        }
    } catch (e) {
        console.error('[DB Init] 存储层初始化失败:', e);
        // 注意：不抛出异常，避免阻塞游戏主流程
    }
})();