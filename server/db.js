import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const db = new DatabaseSync(path.join(__dirname, 'farm.db'))

// 启用基本约束
db.exec('PRAGMA foreign_keys = ON;')

// 建表
db.exec(`
CREATE TABLE IF NOT EXISTS player (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  gold INTEGER NOT NULL DEFAULT 100,
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  season INTEGER NOT NULL DEFAULT 0,      -- 0春 1夏 2秋 3冬
  day INTEGER NOT NULL DEFAULT 1,
  hour INTEGER NOT NULL DEFAULT 8
);

CREATE TABLE IF NOT EXISTS plots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  crop_id INTEGER DEFAULT NULL,           -- 关联 crops.id
  stage INTEGER NOT NULL DEFAULT -1,      -- -1 空地 0播种 1..n-1生长 n成熟
  water INTEGER NOT NULL DEFAULT 100,
  fert INTEGER NOT NULL DEFAULT 100,
  light INTEGER NOT NULL DEFAULT 100,
  pest INTEGER NOT NULL DEFAULT 0,        -- 0无 越高越差
  planted_day INTEGER,
  planted_season INTEGER
);

CREATE TABLE IF NOT EXISTS crops (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  days INTEGER NOT NULL,
  season INTEGER NOT NULL,               -- 适宜季节
  price INTEGER NOT NULL,
  seedPrice INTEGER NOT NULL,
  sprite TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cat TEXT NOT NULL,                     -- seed/crop/product/material/animal/other
  qty INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  desc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS animals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  species TEXT NOT NULL,                 -- chicken/cow/sheep
  feed INTEGER NOT NULL DEFAULT 100,
  health INTEGER NOT NULL DEFAULT 100,
  ready INTEGER NOT NULL DEFAULT 0,      -- 可收集产物 0/1
  x INTEGER NOT NULL,
  y INTEGER NOT NULL
);

-- 天气事件：按季节生成并持久化；防护投入与结算进度都落库
CREATE TABLE IF NOT EXISTS weather_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season INTEGER NOT NULL,
  day INTEGER NOT NULL,                  -- 季节内第几天（事件开始日）
  abs_day INTEGER NOT NULL,              -- 绝对天数（全局递增，结算对齐用）
  type TEXT NOT NULL,                    -- sunny/rain/drought/storm/frost/heatwave/blizzard/freeze/wind
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 1,   -- 持续天数
  severity INTEGER NOT NULL DEFAULT 0,   -- 0 无害 / 1~3 灾害等级
  protect_gold INTEGER NOT NULL DEFAULT 0,  -- 已投入防护金币储备
  protect_mat INTEGER NOT NULL DEFAULT 0,   -- 已投入防护物资储备
  settled_days INTEGER NOT NULL DEFAULT 0,  -- 已结算天数（防重复扣损）
  done INTEGER NOT NULL DEFAULT 0
);

-- 天气逐日结算日志：UNIQUE(event_id, abs_day) 保证同一天只结算一次
CREATE TABLE IF NOT EXISTS weather_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  abs_day INTEGER NOT NULL,
  msg TEXT NOT NULL,
  UNIQUE(event_id, abs_day)
);
`)

// 兼容旧存档：player 增加绝对天数（天气结算对齐用）
const playerCols = db.prepare('PRAGMA table_info(player)').all().map((c) => c.name)
if (!playerCols.includes('abs_day')) {
  db.exec('ALTER TABLE player ADD COLUMN abs_day INTEGER NOT NULL DEFAULT 1')
}