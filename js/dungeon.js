'use strict';

function isFloor(dungeon, x, y) {
  return x >= 0 && x < dungeon.cols && y >= 0 && y < dungeon.rows && dungeon.tiles[y * dungeon.cols + x] === 0;
}

function findEnemy(dungeon, x, y) {
  return dungeon.enemies.find(e => e.x === x && e.y === y) || null;
}

const DungeonGenerator = {
  generate(seed, cols, rows, level) {
    level = level || 1;
    const rng = Utils.makeRng(seed);
    const tiles = new Array(cols * rows).fill(1);
    const rooms = [];
    const enemies = [];

    const carveRoom = (room) => {
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
          tiles[y * cols + x] = 0;
        }
      }
    };

    const carveH = (x1, x2, y) => {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      for (let x = minX; x <= maxX; x++) {
        if (y >= 0 && y < rows && x >= 0 && x < cols) tiles[y * cols + x] = 0;
      }
    };

    const carveV = (y1, y2, x) => {
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      for (let y = minY; y <= maxY; y++) {
        if (y >= 0 && y < rows && x >= 0 && x < cols) tiles[y * cols + x] = 0;
      }
    };

    // 生成房间
    for (let i = 0; i < 15; i++) {
      const w = Utils.randInt(rng, 4, 8);
      const h = Utils.randInt(rng, 4, 7);
      const x = Utils.randInt(rng, 1, cols - w - 2);
      const y = Utils.randInt(rng, 1, rows - h - 2);
      const room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };
      let overlap = false;
      for (const r of rooms) {
        if (x < r.x + r.w && r.x < x + w && y < r.y + r.h && r.y < y + h) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        rooms.push(room);
        carveRoom(room);
        if (rooms.length >= 8 + Math.floor(level / 2)) break;
      }
    }

    if (rooms.length < 2) {
      rooms.push({ x: 1, y: 1, w: 5, h: 5, cx: 3, cy: 3 });
      rooms.push({ x: cols - 7, y: rows - 7, w: 5, h: 5, cx: cols - 4, cy: rows - 4 });
      carveRoom(rooms[0]);
      carveRoom(rooms[1]);
    }

    rooms.sort((a, b) => a.cx - b.cx);

    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1];
      const b = rooms[i];
      let cx = a.cx, cy = a.cy;
      if (rng() < 0.5) {
        carveH(cx, b.cx, cy);
        cx = b.cx;
        carveV(cy, b.cy, cx);
      } else {
        carveV(cy, b.cy, cx);
        cy = b.cy;
        carveH(cx, b.cx, cy);
      }
    }

    const playerStart = { x: rooms[0].cx, y: rooms[0].cy };
    const stairs = { x: rooms[rooms.length - 1].cx, y: rooms[rooms.length - 1].cy };

    const enemyCount = Math.min(12, 3 + level * 2);
    let placed = 0;
    let attempts = 0;
    while (placed < enemyCount && attempts < 1000) {
      attempts++;
      const x = Utils.randInt(rng, 0, cols - 1);
      const y = Utils.randInt(rng, 0, rows - 1);
      const idx = y * cols + x;
      if (tiles[idx] !== 0) continue;
      if (x === playerStart.x && y === playerStart.y) continue;
      if (x === stairs.x && y === stairs.y) continue;
      if (enemies.some(e => e.x === x && e.y === y)) continue;
      const base = Utils.randChoice(rng, CONSTANTS.ENEMY_POOL);
      const scale = 1 + (level - 1) * 0.25;
      const enemy = {
        id: placed,
        x, y,
        name: base.name,
        sprite: base.sprite,
        hp: Math.floor(base.hp * scale),
        maxHp: Math.floor(base.hp * scale),
        atk: Math.floor(base.atk * scale),
        def: Math.floor(base.def * scale),
        exp: Math.floor(base.exp * scale),
        gold: Math.floor(base.gold * scale),
      };
      enemies.push(enemy);
      placed++;
    }

    return {
      cols, rows,
      tiles,
      rooms,
      playerStart,
      stairs,
      enemies,
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DungeonGenerator, isFloor, findEnemy };
}