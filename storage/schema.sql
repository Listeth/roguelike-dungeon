-- =========================================================
-- 游戏存档逻辑表结构（概念模型）
-- 说明：
--   - 本游戏为纯前端单页应用，无后端服务器
--   - 实际持久化使用浏览器 localStorage（JSON 序列化）
--   - 此 SQL 用于直观展示数据模型、字段类型与约束
-- =========================================================

CREATE TABLE IF NOT EXISTS game_saves (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,   -- 存档ID
  version       INTEGER NOT NULL DEFAULT 1,          -- 结构版本号
  floor         INTEGER NOT NULL DEFAULT 1,          -- 当前层数
  coins         INTEGER NOT NULL DEFAULT 0,          -- 金币
  score         INTEGER NOT NULL DEFAULT 0,          -- 总分
  hp            INTEGER NOT NULL DEFAULT 100,        -- 当前生命
  baseHp        INTEGER NOT NULL DEFAULT 100,        -- 基础生命上限
  baseAttack    INTEGER NOT NULL DEFAULT 10,         -- 基础攻击
  baseDefense   INTEGER NOT NULL DEFAULT 2,          -- 基础防御
  baseSpeed     INTEGER NOT NULL DEFAULT 170,        -- 基础速度
  inventory     TEXT    NOT NULL,                    -- 背包（JSON数组）
  equipment     TEXT    NOT NULL,                    -- 装备（JSON对象）
  boss_active   INTEGER NOT NULL DEFAULT 0,          -- 当前层是否有Boss
  created_at    INTEGER NOT NULL,                    -- 创建时间戳
  updated_at    INTEGER NOT NULL                     -- 最后更新时间戳
);