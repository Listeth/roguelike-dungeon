'use strict';

function draw() {
  if (!game) return;
  const d = game.dungeon;
  const p = game.player;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < d.rows; y++) {
    for (let x = 0; x < d.cols; x++) {
      const idx = y * d.cols + x;
      const px = x * CONSTANTS.TILE;
      const py = y * CONSTANTS.TILE;
      const isFloor = d.tiles[idx] === 0;
      ctx.fillStyle = isFloor ? '#2a1f1a' : '#0f0b12';
      ctx.fillRect(px, py, CONSTANTS.TILE, CONSTANTS.TILE);
      if (isFloor) {
        ctx.strokeStyle = '#3a2a22';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, CONSTANTS.TILE, CONSTANTS.TILE);
      }
    }
  }

  const sx = d.stairs.x * CONSTANTS.TILE;
  const sy = d.stairs.y * CONSTANTS.TILE;
  ctx.fillStyle = '#4a8a3a';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⬇️', sx + CONSTANTS.TILE / 2, sy + CONSTANTS.TILE / 2);

  ctx.font = '18px sans-serif';
  for (const enemy of d.enemies) {
    const ex = enemy.x * CONSTANTS.TILE + CONSTANTS.TILE / 2;
    const ey = enemy.y * CONSTANTS.TILE + CONSTANTS.TILE / 2;
    ctx.fillText(enemy.sprite, ex, ey);
    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = '#400';
    ctx.fillRect(enemy.x * CONSTANTS.TILE, enemy.y * CONSTANTS.TILE - 4, CONSTANTS.TILE, 3);
    ctx.fillStyle = '#e55';
    ctx.fillRect(enemy.x * CONSTANTS.TILE, enemy.y * CONSTANTS.TILE - 4, CONSTANTS.TILE * hpRatio, 3);
  }

  const px = p.x * CONSTANTS.TILE + CONSTANTS.TILE / 2;
  const py = p.y * CONSTANTS.TILE + CONSTANTS.TILE / 2;
  ctx.font = '24px sans-serif';
  ctx.fillText('🧙', px, py);

  const visR2 = CONSTANTS.VIS_RADIUS * CONSTANTS.VIS_RADIUS;
  for (let y = 0; y < d.rows; y++) {
    for (let x = 0; x < d.cols; x++) {
      const dx = x - p.x;
      const dy = y - p.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > visR2) {
        ctx.fillStyle = 'rgba(0,0,0,0.82)';
        ctx.fillRect(x * CONSTANTS.TILE, y * CONSTANTS.TILE, CONSTANTS.TILE, CONSTANTS.TILE);
      }
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { draw };
}