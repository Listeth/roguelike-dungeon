'use strict';

let game = null;
let battle = null;
let battleEnemy = null;
let toastTimer = null;

function createNewGame(seed) {
  seed = seed || (Date.now() >>> 0);
  const dungeonLevel = 1;
  const dungeon = DungeonGenerator.generate(seed, CONSTANTS.COLS, CONSTANTS.ROWS, dungeonLevel);
  const player = JSON.parse(JSON.stringify(CONSTANTS.DEFAULT_PLAYER));
  player.x = dungeon.playerStart.x;
  player.y = dungeon.playerStart.y;
  return {
    seed,
    dungeonLevel,
    dungeon,
    player,
    turn: 0,
    gameOver: false,
    lastMessage: ''
  };
}

function movePlayer(dx, dy) {
  if (!game || game.gameOver || battle) return;
  const nx = game.player.x + dx;
  const ny = game.player.y + dy;
  if (!isFloor(game.dungeon, nx, ny)) return;
  const enemy = findEnemy(game.dungeon, nx, ny);
  game.player.x = nx;
  game.player.y = ny;
  game.turn++;
  if (enemy) {
    startBattle(enemy);
  } else if (nx === game.dungeon.stairs.x && ny === game.dungeon.stairs.y) {
    descend();
  }
  updateHUD();
  draw();
}

function startBattle(enemy) {
  battleEnemy = enemy;
  battle = BattleSystem.create(game.player, enemy);
  showBattleModal();
  updateBattleUI();
}

function doBattleAction(action) {
  if (!battle || battle.ended) return;
  if (action === 'potion') {
    if (game.player.potions <= 0) {
      battle.log.push('❌ 没有药水了！');
      updateBattleUI();
      return;
    }
    game.player.potions--;
    BattleSystem.usePotion(battle, 25);
    if (!battle.ended) {
      BattleSystem.enemyAttack(battle);
    }
  } else if (action === 'attack') {
    const dmg = Math.max(1, Math.floor(Math.random() * 6) + 1 + game.player.atk - battle.enemyDef);
    BattleSystem.playerAttack(battle, dmg);
    if (!battle.ended) {
      BattleSystem.enemyAttack(battle);
    }
  } else if (action === 'flee') {
    BattleSystem.flee(battle);
  }
  updateBattleUI();
  if (battle.ended) {
    endBattle();
  }
}

function endBattle() {
  if (battle.victory) {
    game.player.exp += battle.enemyExp;
    game.player.gold += battle.enemyGold;
    const idx = game.dungeon.enemies.indexOf(battleEnemy);
    if (idx >= 0) game.dungeon.enemies.splice(idx, 1);
    checkLevelUp();
    showToast(`🎉 击败 ${battle.enemyName}！经验 +${battle.enemyExp}，金币 +${battle.enemyGold}`);
  } else if (battle.fled) {
    showToast('🏃 你逃跑了');
  } else {
    game.gameOver = true;
    showGameOverModal();
    showToast('💀 你被击败了');
  }
  battle = null;
  battleEnemy = null;
  hideBattleModal();
  updateHUD();
  draw();
  saveGame();
}

function checkLevelUp() {
  let leveled = false;
  while (game.player.exp >= game.player.expToNext) {
    game.player.exp -= game.player.expToNext;
    game.player.level++;
    game.player.expToNext = Math.floor(game.player.expToNext * 1.5);
    game.player.maxHp += 10;
    game.player.hp = Math.min(game.player.hp + 10, game.player.maxHp);
    game.player.atk += 1;
    game.player.def += 1;
    leveled = true;
    showToast(`🎉 升级！达到 Lv.${game.player.level}`);
  }
  return leveled;
}

function descend() {
  game.dungeonLevel++;
  game.seed = Utils.hashSeed(game.seed);
  game.dungeon = DungeonGenerator.generate(game.seed, CONSTANTS.COLS, CONSTANTS.ROWS, game.dungeonLevel);
  game.player.x = game.dungeon.playerStart.x;
  game.player.y = game.dungeon.playerStart.y;
  showToast(`⬇️ 到达第 ${game.dungeonLevel} 层`);
  saveGame();
  updateHUD();
  draw();
}

function revive() {
  if (!game) return;
  game.player.hp = Math.floor(game.player.maxHp * 0.5);
  game.player.x = game.dungeon.playerStart.x;
  game.player.y = game.dungeon.playerStart.y;
  game.gameOver = false;
  hideGameOverModal();
  showToast('💪 你复活了！');
  updateHUD();
  draw();
  saveGame();
}

function newGame() {
  const seed = Date.now() >>> 0;
  game = createNewGame(seed);
  battle = null;
  battleEnemy = null;
  hideBattleModal();
  hideGameOverModal();
  showToast('🆕 新的冒险开始！');
  updateHUD();
  draw();
  saveGame();
}

function saveGame() {
  if (!game) return;
  SaveSystem.save(game);
}

function loadGame() {
  const state = SaveSystem.load();
  if (!state) {
    showToast('❌ 没有存档或存档损坏');
    return;
  }
  game = state;
  battle = null;
  battleEnemy = null;
  hideBattleModal();
  hideGameOverModal();
  updateHUD();
  draw();
  showToast('📂 读取存档成功');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    game, battle, battleEnemy, toastTimer,
    createNewGame, movePlayer, startBattle, doBattleAction,
    endBattle, checkLevelUp, descend, revive, newGame, saveGame, loadGame
  };
}