'use strict';

const BattleSystem = {
  create(player, enemy) {
    return {
      playerHp: player.hp,
      playerMaxHp: player.maxHp,
      playerAtk: player.atk,
      playerDef: player.def,
      enemyName: enemy.name,
      enemySprite: enemy.sprite,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      enemyAtk: enemy.atk,
      enemyDef: enemy.def,
      enemyExp: enemy.exp,
      enemyGold: enemy.gold,
      log: [],
      ended: false,
      victory: false,
      fled: false,
    };
  },

  playerAttack(battle, damage) {
    if (battle.ended) return battle;
    if (damage === undefined) {
      damage = Math.max(1, Math.floor(Math.random() * 6) + 1 + battle.playerAtk - battle.enemyDef);
    }
    damage = Math.max(1, Math.floor(damage));
    battle.enemyHp = Math.max(0, battle.enemyHp - damage);
    battle.log.push(`你对 ${battle.enemyName} 造成 ${damage} 点伤害`);
    if (battle.enemyHp <= 0) {
      battle.ended = true;
      battle.victory = true;
      battle.log.push(`🎉 击败了 ${battle.enemyName}！`);
    }
    return battle;
  },

  enemyAttack(battle, damage) {
    if (battle.ended || battle.victory) return battle;
    if (damage === undefined) {
      damage = Math.max(1, Math.floor(Math.random() * 4) + 1 + battle.enemyAtk - battle.playerDef);
    }
    damage = Math.max(1, Math.floor(damage));
    battle.playerHp = Math.max(0, battle.playerHp - damage);
    battle.log.push(`${battle.enemyName} 对你造成 ${damage} 点伤害`);
    if (battle.playerHp <= 0) {
      battle.ended = true;
      battle.victory = false;
      battle.log.push('💀 你被击败了……');
    }
    return battle;
  },

  usePotion(battle, heal) {
    if (battle.ended) return battle;
    heal = heal || 25;
    battle.playerHp = Math.min(battle.playerMaxHp, battle.playerHp + heal);
    battle.log.push(`🧪 你喝下药水，回复 ${heal} 点生命`);
    return battle;
  },

  flee(battle) {
    if (battle.ended) return battle;
    battle.ended = true;
    battle.fled = true;
    battle.log.push('🏃 你成功逃跑了！');
    return battle;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BattleSystem };
}