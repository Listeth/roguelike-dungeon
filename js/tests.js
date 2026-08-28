'use strict';

function runTests() {
  const results = [];
  function assert(cond, msg) {
    results.push({ ok: !!cond, msg });
  }

  try {
    const d = DungeonGenerator.generate(42, CONSTANTS.COLS, CONSTANTS.ROWS, 1);
    assert(d.rooms.length >= 2, '地牢房间数 ≥ 2');
    assert(d.enemies.length > 0, '地牢敌人数量 > 0');
    const startFloor = d.tiles[d.playerStart.y * d.cols + d.playerStart.x] === 0;
    assert(startFloor, '玩家起点为地板');
    const stairsFloor = d.tiles[d.stairs.y * d.cols + d.stairs.x] === 0;
    assert(stairsFloor, '楼梯位置为地板');
    const allEnemiesOnFloor = d.enemies.every(e => d.tiles[e.y * d.cols + e.x] === 0);
    assert(allEnemiesOnFloor, '所有敌人位于地板');
    const noEnemyAtStart = !d.enemies.some(e => e.x === d.playerStart.x && e.y === d.playerStart.y);
    assert(noEnemyAtStart, '玩家起点无敌人');
    const noEnemyAtStairs = !d.enemies.some(e => e.x === d.stairs.x && e.y === d.stairs.y);
    assert(noEnemyAtStairs, '楼梯位置无敌人');

    const visited = new Array(d.cols * d.rows).fill(false);
    const queue = [{ x: d.playerStart.x, y: d.playerStart.y }];
    visited[d.playerStart.y * d.cols + d.playerStart.x] = true;
    let foundStairs = false;
    let head = 0;
    while (head < queue.length) {
      const { x, y } = queue[head++];
      if (x === d.stairs.x && y === d.stairs.y) { foundStairs = true; break; }
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < d.cols && ny >= 0 && ny < d.rows) {
          const idx = ny * d.cols + nx;
          if (!visited[idx] && d.tiles[idx] === 0) {
            visited[idx] = true;
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }
    assert(foundStairs, '玩家起点可到达楼梯');

    const d2 = DungeonGenerator.generate(999, CONSTANTS.COLS, CONSTANTS.ROWS, 1);
    const same = d.rooms.length === d2.rooms.length && d.rooms.every((r, i) => r.x === d2.rooms[i]?.x);
    assert(!same, '不同种子生成不同地牢');
  } catch (e) {
    results.push({ ok: false, msg: '地牢生成测试异常: ' + e.message });
  }

  try {
    const player = { hp: 50, maxHp: 50, atk: 10, def: 2 };
    const enemy = { hp: 30, maxHp: 30, atk: 5, def: 1, exp: 20, gold: 10, name: '测试怪', sprite: '👾' };

    let b = BattleSystem.create(player, enemy);
    assert(b.playerHp === 50, '战斗初始玩家HP正确');
    assert(b.enemyHp === 30, '战斗初始敌人HP正确');
    assert(b.ended === false, '战斗未结束');

    b = BattleSystem.playerAttack(b, 100);
    assert(b.victory === true, '玩家攻击击败敌人');
    assert(b.ended === true, '战斗结束');

    b = BattleSystem.create(player, enemy);
    b = BattleSystem.enemyAttack(b, 100);
    assert(b.playerHp <= 0, '敌人攻击击败玩家');
    assert(b.ended === true, '敌人攻击后战斗结束');

    b = BattleSystem.create(player, enemy);
    b.playerHp = 10;
    b = BattleSystem.usePotion(b, 40);
    assert(b.playerHp === 50, '药水回复不能超过上限');

    b = BattleSystem.create(player, enemy);
    b = BattleSystem.flee(b);
    assert(b.fled === true, '逃跑成功');
    assert(b.ended === true, '逃跑后战斗结束');
  } catch (e) {
    results.push({ ok: false, msg: '战斗系统测试异常: ' + e.message });
  }

  try {
    SaveSystem.clear();
    const fakeState = createNewGame(123);
    fakeState.player.hp = 77;
    const saveOk = SaveSystem.save(fakeState);
    assert(saveOk, '存档保存成功');
    const loaded = SaveSystem.load();
    assert(loaded !== null, '存档读取成功');
    assert(loaded.player.hp === 77, '读取后玩家HP正确');
    assert(loaded.player.gold === fakeState.player.gold, '读取后玩家金币正确');
    assert(loaded.dungeon.enemies.length === fakeState.dungeon.enemies.length, '读取后敌人数量一致');
    SaveSystem.clear();
    const afterClear = SaveSystem.load();
    assert(afterClear === null, '清除存档后读取返回null');
  } catch (e) {
    results.push({ ok: false, msg: '存档系统测试异常: ' + e.message });
  }

  const el = testResultsEl;
  el.classList.remove('hidden');
  const total = results.length;
  const passed = results.filter(r => r.ok).length;
  let html = `🧪 测试完成：${passed}/${total} 通过\n\n`;
  for (const r of results) {
    html += (r.ok ? '✅ ' : '❌ ') + r.msg + '\n';
  }
  el.textContent = html;
  el.className = passed === total ? 'pass' : 'fail';
  console.log('Test results:', results);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests };
}