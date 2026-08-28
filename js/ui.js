'use strict';

function updateHUD() {
  if (!game) return;
  const p = game.player;
  floorLabel.textContent = `第${game.dungeonLevel}层`;
  levelLabel.textContent = `Lv.${p.level}`;
  goldLabel.textContent = `💰 ${p.gold}`;
  potionsLabel.textContent = `🧪 ${p.potions}`;
  atkLabel.textContent = `⚔️ ${p.atk}`;
  defLabel.textContent = `🛡️ ${p.def}`;

  const hpPercent = (p.hp / p.maxHp) * 100;
  hpBar.style.width = hpPercent + '%';
  hpText.textContent = `${p.hp}/${p.maxHp}`;

  const expPercent = (p.exp / p.expToNext) * 100;
  expBar.style.width = expPercent + '%';
  expText.textContent = `${p.exp}/${p.expToNext}`;

  goldStat.textContent = p.gold;
  potionStat.textContent = p.potions;
  atkStat.textContent = p.atk;
  defStat.textContent = p.def;
}

function updateBattleUI() {
  if (!battle) return;
  battleEnemyInfo.innerHTML = `<strong>${battle.enemySprite} ${battle.enemyName}</strong> HP: ${battle.enemyHp}/${battle.enemyMaxHp}`;
  battlePlayerInfo.innerHTML = `<strong>🧙 你</strong> HP: ${battle.playerHp}/${battle.playerMaxHp}`;
  battleLog.innerHTML = battle.log.map(msg => `<div>${msg}</div>`).join('');
  battleLog.scrollTop = battleLog.scrollHeight;
}

function showBattleModal() {
  battleModal.classList.remove('hidden');
}

function hideBattleModal() {
  battleModal.classList.add('hidden');
}

function showGameOverModal() {
  gameoverModal.classList.remove('hidden');
}

function hideGameOverModal() {
  gameoverModal.classList.add('hidden');
}

function showToast(msg) {
  messageToast.textContent = msg;
  messageToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    messageToast.classList.remove('show');
  }, 2500);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateHUD, updateBattleUI, showBattleModal, hideBattleModal, showGameOverModal, hideGameOverModal, showToast };
}