window.RDL = window.RDL || {};

RDL.data = {
  itemTemplates: {
    health_potion: {
      id: 'health_potion',
      name: '治疗药水',
      type: 'consumable',
      value: 15,
      effect: { restore: 15 }
    },
    gold_pouch: {
      id: 'gold_pouch',
      name: '金币袋',
      type: 'consumable',
      value: 10,
      effect: { gold: 10 }
    },
    iron_sword: {
      id: 'iron_sword',
      name: '铁剑',
      type: 'weapon',
      slot: 'weapon',
      rarity: 'common',
      stats: { attack: 3 },
      value: 30
    },
    steel_sword: {
      id: 'steel_sword',
      name: '钢剑',
      type: 'weapon',
      slot: 'weapon',
      rarity: 'rare',
      stats: { attack: 6 },
      value: 50
    },
    leather_armor: {
      id: 'leather_armor',
      name: '皮甲',
      type: 'armor',
      slot: 'armor',
      rarity: 'common',
      stats: { defense: 1 },
      value: 25
    },
    plate_armor: {
      id: 'plate_armor',
      name: '铁板甲',
      type: 'armor',
      slot: 'armor',
      rarity: 'rare',
      stats: { defense: 3 },
      value: 60
    },
    bronze_ring: {
      id: 'bronze_ring',
      name: '青铜戒指',
      type: 'trinket',
      slot: 'trinket',
      rarity: 'rare',
      stats: { speed: 1 },
      value: 40
    }
  },

  enemyTemplates: {
    skeleton: {
      id: 'skeleton',
      name: '骷髅兵',
      hp: 10,
      attack: 3,
      defense: 0,
      speed: 8,
      ai: 'melee',
      xp: 8,
      color: '#c0c0c0'
    },
    slime: {
      id: 'slime',
      name: '史莱姆',
      hp: 8,
      attack: 2,
      defense: 1,
      speed: 5,
      ai: 'melee',
      xp: 5,
      color: '#98c379'
    },
    bat: {
      id: 'bat',
      name: '蝙蝠',
      hp: 5,
      attack: 2,
      defense: 0,
      speed: 12,
      ai: 'melee',
      xp: 4,
      color: '#abb2bf'
    },
    goblin: {
      id: 'goblin',
      name: '哥布林',
      hp: 12,
      attack: 4,
      defense: 1,
      speed: 9,
      ai: 'melee',
      xp: 12,
      color: '#d19a66'
    },
    boss_lich: {
      id: 'boss_lich',
      name: '巫妖王',
      hp: 50,
      attack: 8,
      defense: 3,
      speed: 6,
      ai: 'boss',
      xp: 100,
      color: '#be5046'
    }
  },

  relicTemplates: {
    brass_talisman: {
      id: 'brass_talisman',
      name: '黄铜护符',
      desc: '受伤后获得2点护盾',
      rarity: 'rare'
    },
    lucky_coin: {
      id: 'lucky_coin',
      name: '幸运硬币',
      desc: '金币获取 +50%',
      rarity: 'rare'
    },
    thorn_shield: {
      id: 'thorn_shield',
      name: '荆棘盾',
      desc: '反弹2点伤害',
      rarity: 'rare'
    }
  },

  floorScaling: {
    1: { enemies: ['skeleton', 'slime'], count: 5, items: ['health_potion', 'iron_sword', 'leather_armor'] },
    2: { enemies: ['skeleton', 'slime', 'bat'], count: 7, items: ['health_potion', 'iron_sword', 'leather_armor', 'gold_pouch'] },
    3: { enemies: ['skeleton', 'bat', 'goblin'], count: 8, items: ['health_potion', 'steel_sword', 'leather_armor', 'gold_pouch'] },
    4: { enemies: ['bat', 'goblin', 'skeleton'], count: 9, items: ['health_potion', 'steel_sword', 'plate_armor', 'gold_pouch'] },
    5: { enemies: ['boss_lich'], count: 1, items: ['health_potion', 'plate_armor', 'bronze_ring'] }
  }
};