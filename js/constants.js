'use strict';

const CONSTANTS = {
  COLS: 40,
  ROWS: 30,
  TILE: 24,
  VIS_RADIUS: 8,
  SAVE_KEY: 'dungeon_explorer_v1',
  SAVE_KEY_STORAGE: 'dungeon_explorer_v1',
  ENEMY_POOL: [
    { name: '史莱姆', hp: 12, atk: 2, def: 0, exp: 8, gold: 3, sprite: '🟢' },
    { name: '蝙蝠', hp: 8, atk: 3, def: 1, exp: 10, gold: 2, sprite: '🦇' },
    { name: '骷髅', hp: 18, atk: 5, def: 2, exp: 18, gold: 6, sprite: '💀' },
    { name: '哥布林', hp: 14, atk: 4, def: 1, exp: 14, gold: 5, sprite: '👺' },
    { name: '幽灵', hp: 10, atk: 6, def: 0, exp: 20, gold: 8, sprite: '👻' },
    { name: '石像鬼', hp: 25, atk: 7, def: 4, exp: 28, gold: 10, sprite: '🗿' },
  ],
  DEFAULT_PLAYER: {
    hp: 100,
    maxHp: 100,
    atk: 8,
    def: 2,
    level: 1,
    exp: 0,
    expToNext: 50,
    gold: 0,
    potions: 3,
    x: 0,
    y: 0
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
}