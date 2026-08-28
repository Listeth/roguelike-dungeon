// ============================================================
// 实体类：玩家、敌人、装备、掉落物
// ============================================================

// ---------- 玩家实体 ----------
class Player {
  constructor(classId) {
    const cls = GAME_DATA.classes[classId] || GAME_DATA.classes.warrior;
    this.classId = classId;
    this.name = cls.name;
    this.icon = cls.icon || '⚔️';
    this.level = 1;
    this.exp = 0;
    this.maxHp = cls.hp;
    this.hp = cls.hp;
    this.baseAtk = cls.atk;
    this.baseDef = cls.def;
    this.baseSpd = cls.spd;
    this.baseCrit = cls.crit;
    this.gold = 0;
    this.floor = 1;
    this.equipment = { weapon: null, armor: null, accessory: null };
    this.inventory = [];
    this.relics = [];
    this.buffs = [];
    this.tempAtk = 0;
    this.tempDef = 0;
  }

  // 属性计算（含装备加成）
  get atk() { return this.baseAtk + (this.equipment.weapon?.stats?.atk || 0) + this.tempAtk; }
  get def() { return this.baseDef + (this.equipment.armor?.stats?.def || 0) + this.tempDef; }
  get spd() { return this.baseSpd; }
  get crit() { return this.baseCrit + (this.equipment.accessory?.stats?.crit || 0) + (this.equipment.weapon?.stats?.crit || 0); }
  get maxHpTotal() { return this.maxHp + (this.equipment.armor?.stats?.hp || 0) + (this.equipment.accessory?.stats?.hp || 0); }

  takeDamage(dmg) {
    const actual = Math.max(1, dmg - this.def);
    this.hp -= actual;
    return actual;
  }
  heal(amount) { this.hp = Math.min(this.maxHpTotal, this.hp + amount); }
  isAlive() { return this.hp > 0; }

  addExp(amount) {
    this.exp += amount;
    if (this.exp >= this.level * 10) {
      this.exp -= this.level * 10;
      this.level++;
      this.maxHp += 5;
      this.hp = Math.min(this.hp + 10, this.maxHpTotal);
      this.baseAtk += 1;
      this.baseDef += 1;
      return true; // 升级成功
    }
    return false;
  }

  addGold(amount) {
    this.gold += amount;
  }

  equip(item) {
    if (!item) return;
    const slot = item.type;
    if (this.equipment[slot]) {
      this.inventory.push(this.equipment[slot]);
    }
    this.equipment[slot] = item;
    this.inventory = this.inventory.filter(i => i !== item);
  }

  unequip(slot) {
    if (this.equipment[slot]) {
      this.inventory.push(this.equipment[slot]);
      this.equipment[slot] = null;
    }
  }
}

// ---------- 敌人实体 ----------
class Enemy {
  constructor(tier, floor) {
    this.tier = tier; // normal / elite / boss
    this.floor = floor;
    const base = tier === 'boss' ? 1.8 : tier === 'elite' ? 1.4 : 1.0;
    const scale = 1 + floor * 0.12;

    this.name = tier === 'boss'
      ? Utils.choice(GAME_DATA.bossNames)
      : Utils.choice(GAME_DATA.enemyNames) + (tier === 'elite' ? '★' : '');

    this.maxHp = Math.floor((30 + floor * 8) * base);
    this.hp = this.maxHp;
    this.atk = Math.floor((6 + floor * 1.5) * base);
    this.def = Math.floor((3 + floor * 0.8) * base);
    this.spd = Math.floor((4 + floor * 0.5) * base);
    this.crit = 0.05 + floor * 0.005;

    this.goldReward = Math.floor((10 + floor * 5) * base);
    this.expReward = Math.floor((5 + floor * 3) * base);
    this.dropRate = tier === 'boss' ? 0.9 : tier === 'elite' ? 0.5 : 0.25;
    this.isBoss = tier === 'boss';

    // 技能系统
    this.abilities = [
      { name: '普通攻击', power: 1.0, cooldown: 0 },
      { name: '重击', power: 1.5, cooldown: 3 }
    ];
    if (tier === 'elite' || tier === 'boss') {
      this.abilities.push({ name: '横扫', power: 1.3, cooldown: 4 });
    }
    if (tier === 'boss') {
      this.abilities.push({ name: '毁灭打击', power: 2.0, cooldown: 6 });
    }
    this.currentCDs = Array(this.abilities.length).fill(0);
  }

  takeDamage(dmg) {
    const actual = Math.max(1, dmg - this.def);
    this.hp -= actual;
    return actual;
  }
  isAlive() { return this.hp > 0; }

  // AI 决策
  decideAction() {
    const available = [];
    this.abilities.forEach((a, i) => {
      if (this.currentCDs[i] <= 0) available.push({ ability: a, index: i });
    });
    if (available.length === 0) return { ability: this.abilities[0], index: 0 };
    // 低血量时更倾向使用高伤害技能
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio < 0.3 && available.length > 1) {
      return available[available.length - 1];
    }
    return Utils.choice(available);
  }

  reduceCooldowns() {
    this.currentCDs = this.currentCDs.map(c => Math.max(0, c - 1));
  }
  resetCooldowns() {
    this.currentCDs = Array(this.abilities.length).fill(0);
  }
}

// ---------- 装备实体 ----------
class Equipment {
  constructor(type, rarity, floor) {
    this.type = type; // weapon / armor / accessory
    this.rarity = rarity; // common / uncommon / rare / epic / legendary
    this.floor = floor;
    this.stats = {};
    this.name = this.generateName();
    this.generateStats();
  }

  generateName() {
    const prefix = {
      common: '',
      uncommon: '精良',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    }[this.rarity] || '';

    const pool = this.type === 'weapon'
      ? GAME_DATA.weaponNames
      : this.type === 'armor'
        ? GAME_DATA.armorNames
        : GAME_DATA.accessoryNames;

    const base = Utils.choice(pool);
    return prefix ? `${prefix}${base}` : base;
  }

  generateStats() {
    const rarityMult = {
      common: 1,
      uncommon: 1.3,
      rare: 1.7,
      epic: 2.2,
      legendary: 3.0
    }[this.rarity] || 1;

    const floorMult = 1 + this.floor * 0.1;
    const base = Math.floor((5 + Math.random() * 5) * rarityMult * floorMult);

    if (this.type === 'weapon') {
      this.stats.atk = base;
      this.stats.crit = Math.random() * 0.05 * rarityMult;
    } else if (this.type === 'armor') {
      this.stats.def = Math.floor(base * 0.8);
      this.stats.hp = Math.floor(base * 1.5);
    } else {
      this.stats.crit = Math.random() * 0.08 * rarityMult;
      this.stats.hp = Math.floor(base * 0.5);
      this.stats.atk = Math.floor(base * 0.3);
    }
  }

  getIcon() {
    return { weapon: '⚔️', armor: '🛡️', accessory: '💍' }[this.type] || '📦';
  }

  getDescription() {
    const parts = [];
    if (this.stats.atk) parts.push(`攻击+${this.stats.atk}`);
    if (this.stats.def) parts.push(`防御+${this.stats.def}`);
    if (this.stats.hp) parts.push(`生命+${this.stats.hp}`);
    if (this.stats.crit) parts.push(`暴击+${(this.stats.crit * 100).toFixed(0)}%`);
    return `${this.name} (${parts.join(', ')})`;
  }
}

// ---------- 随机装备生成器 ----------
function generateRandomEquipment(floor) {
  // 按稀有度权重随机
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const weights = [50, 30, 14, 5, 1];
  const rarity = Utils.weightedChoice(rarities, weights);
  const type = Utils.choice(['weapon', 'armor', 'accessory']);
  return new Equipment(type, rarity, floor);
}