window.RDL = window.RDL || {};

RDL.systems = (function() {
  function addMsg(game, text) {
    game.messages.push(text);
    if (game.messages.length > 50) {
      game.messages.shift();
    }
  }

  function canEnter(game, x, y) {
    if (x < 0 || y < 0 || x >= game.width || y >= game.height) {
      return false;
    }
    return game.map[y][x] !== 0;
  }

  function findEnemyAt(game, x, y) {
    return game.enemies.find(e => e.alive && e.x === x && e.y === y);
  }

  function findEntityAt(game, x, y) {
    const enemy = findEnemyAt(game, x, y);
    if (enemy) return enemy;
    return game.items.find(item => item.x === x && item.y === y);
  }

  function movePlayer(game, dx, dy) {
    const p = game.player;
    const nx = p.x + dx;
    const ny = p.y + dy;

    if (!canEnter(game, nx, ny)) {
      addMsg(game, '墙壁挡住了你。');
      return;
    }

    const enemy = findEnemyAt(game, nx, ny);
    if (enemy) {
      attackEnemy(game, enemy);
    } else {
      p.x = nx;
      p.y = ny;
    }

    const itemIndex = game.items.findIndex(item => item.x === p.x && item.y === p.y);
    if (itemIndex !== -1) {
      pickupItem(game, game.items[itemIndex]);
      game.items.splice(itemIndex, 1);
    }
  }

  function attackEnemy(game, enemy) {
    const p = game.player;
    const dmg = Math.max(1, p.attack - enemy.defense + RDL.utils.randInt(-1, 1));
    enemy.hp -= dmg;
    addMsg(game, `你攻击 ${enemy.name}，造成 ${dmg} 点伤害。`);

    if (enemy.hp <= 0) {
      enemy.alive = false;
      addMsg(game, `${enemy.name} 被消灭了！获得 ${enemy.xp} 经验。`);
      p.exp += enemy.xp;
      gainLevelIfNeeded(game);
    }
  }

  function gainLevelIfNeeded(game) {
    const p = game.player;
    while (p.exp >= p.expToNext) {
      p.exp -= p.expToNext;
      p.level++;
      p.expToNext = Math.floor(p.expToNext * 1.4);
      p.maxHp += 5;
      p.hp = p.maxHp;
      p.attack += 2;
      p.defense += 1;
      addMsg(game, `等级提升！你现在是 ${p.level} 级。`);
    }
  }

  function enemyAct(game, enemy) {
    const p = game.player;
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;

    if (Math.abs(dx) + Math.abs(dy) === 1) {
      const dmg = Math.max(1, enemy.attack - p.defense + RDL.utils.randInt(-1, 1));
      p.hp -= dmg;
      addMsg(game, `${enemy.name} 攻击你，造成 ${dmg} 点伤害。`);
      if (p.hp <= 0) {
        game.state = 'dead';
        addMsg(game, '你被击败了...');
      }
      return;
    }

    let moved = false;
    if (Math.abs(dx) > Math.abs(dy)) {
      const step = dx > 0 ? 1 : -1;
      if (canEnter(game, enemy.x + step, enemy.y) &&
          !findEntityAt(game, enemy.x + step, enemy.y)) {
        enemy.x += step;
        moved = true;
      }
    } else if (Math.abs(dy) > 0) {
      const step = dy > 0 ? 1 : -1;
      if (canEnter(game, enemy.x, enemy.y + step) &&
          !findEntityAt(game, enemy.x, enemy.y + step)) {
        enemy.y += step;
        moved = true;
      }
    }

    if (!moved && dx !== 0) {
      const step = dx > 0 ? 1 : -1;
      if (canEnter(game, enemy.x + step, enemy.y) &&
          !findEntityAt(game, enemy.x + step, enemy.y)) {
        enemy.x += step;
      }
    } else if (!moved && dy !== 0) {
      const step = dy > 0 ? 1 : -1;
      if (canEnter(game, enemy.x, enemy.y + step) &&
          !findEntityAt(game, enemy.x, enemy.y + step)) {
        enemy.y += step;
      }
    }
  }

  function endPlayerTurn(game) {
    if (game.state === 'dead') return;
    for (const enemy of game.enemies) {
      if (enemy.alive) {
        enemyAct(game, enemy);
        if (game.state === 'dead') break;
      }
    }
  }

  function pickupItem(game, item) {
    const p = game.player;
    if (item.template.type === 'consumable') {
      p.inventory.push(item);
      addMsg(game, `拾取了 ${item.name}。`);
    } else {
      const slot = item.template.slot;
      if (p.equipment[slot]) {
        p.inventory.push(p.equipment[slot]);
      }
      p.equipment[slot] = item;
      recalcStats(game);
      addMsg(game, `装备了 ${item.name}。`);
    }
  }

  function useItem(game, index) {
    const p = game.player;
    if (index < 0 || index >= p.inventory.length) return;
    const item = p.inventory[index];
    if (item.template.type !== 'consumable') return;

    const effect = item.template.effect;
    if (effect.restore) {
      p.hp = Math.min(p.maxHp, p.hp + effect.restore);
      addMsg(game, `使用 ${item.name}，回复 ${effect.restore} 点生命值。`);
    } else if (effect.gold) {
      p.gold += effect.gold;
      addMsg(game, `使用 ${item.name}，获得 ${effect.gold} 金币。`);
    }
    p.inventory.splice(index, 1);
  }

  function recalcStats(game) {
    const p = game.player;
    p.attack = 6;
    p.defense = 2;
    p.speed = 10;
    for (const slot of ['weapon', 'armor', 'trinket']) {
      const item = p.equipment[slot];
      if (item && item.template.stats) {
        if (item.template.stats.attack) p.attack += item.template.stats.attack;
        if (item.template.stats.defense) p.defense += item.template.stats.defense;
        if (item.template.stats.speed) p.speed += item.template.stats.speed;
      }
    }
  }

  function nextFloor(game) {
    const newFloor = game.floor + 1;
    if (newFloor > RDL.config.FLOOR_COUNT) {
      game.state = 'victory';
      addMsg(game, '你征服了地牢！胜利！');
      return;
    }
    const generated = RDL.dungeon.generateFloor(newFloor);
    RDL.utils.setSeed(Date.now() & 0xffffffff);
    game.floor = newFloor;
    game.map = generated.map;
    game.width = generated.width;
    game.height = generated.height;
    game.spawn = generated.spawn;
    game.stairPos = generated.stairPos;
    game.enemies = generated.enemies;
    game.items = generated.items;
    game.player.x = game.spawn.x;
    game.player.y = game.spawn.y;
    addMsg(game, `你来到了地下 ${newFloor} 层。`);
  }

  return {
    addMsg,
    movePlayer,
    endPlayerTurn,
    useItem,
    nextFloor,
    recalcStats
  };
})();