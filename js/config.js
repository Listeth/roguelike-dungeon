// ============================================================
// 配置文件：游戏数据、数值设定、静态表
// ============================================================

const GAME_DATA = {
  // 版本号
  version: '1.0.0',

  // 职业配置
  classes: {
    warrior: { 
      name: '战士', hp: 120, atk: 12, def: 6, spd: 6, crit: 0.08, 
      desc: '高血量高防御，近战铁壁', icon: '⚔️' 
    },
    ranger: { 
      name: '游侠', hp: 80, atk: 14, def: 4, spd: 10, crit: 0.15, 
      desc: '高速高暴击，灵活致命', icon: '🏹' 
    },
    mage: { 
      name: '法师', hp: 70, atk: 18, def: 3, spd: 7, crit: 0.05, 
      desc: '高攻击低防御，炮台式输出', icon: '🔮' 
    },
    paladin: { 
      name: '圣骑', hp: 100, atk: 10, def: 8, spd: 5, crit: 0.06, 
      desc: '均衡型，能打能抗', icon: '🛡️' 
    }
  },

  // 敌人名称池
  enemyNames: [
    '哥布林', '骷髅兵', '蝙蝠', '毒蛇',
    '石像鬼', '暗影', '食尸鬼', '地狱犬',
    '泥沼怪', '腐尸', '暗精灵', '白骨法师'
  ],

  // Boss 名称池
  bossNames: [
    '深渊领主', '死灵法师', '龙裔', '混沌之心',
    '湮灭使者', '永夜之影'
  ],

  // 武器名称池
  weaponNames: [
    '短剑', '长剑', '战斧', '匕首',
    '法杖', '弓箭', '钉锤', '弯刀',
    '长矛', '拳套'
  ],

  // 护甲名称池
  armorNames: [
    '皮甲', '锁甲', '板甲', '布甲',
    '鳞甲', '链甲', '魔纹袍', '骨甲'
  ],

  // 饰品名称池
  accessoryNames: [
    '戒指', '项链', '护符', '手镯',
    '徽章', '耳环', '坠饰', '符文石'
  ],

  // 遗物名称池（预留）
  relicNames: [
    '血石', '龙鳞', '暗影水晶', '生命之泉',
    '幸运硬币', '诅咒之眼', '勇者之心', '时光沙漏'
  ],

  // 随机事件库
  eventTexts: [
    {
      text: '你发现地上有一个古老的符文，散发着微弱的光芒。',
      choices: ['触摸它 🖐️', '绕过去 🚶'],
      outcomes: ['hp+15', 'nothing']
    },
    {
      text: '一阵阴风吹过，你听到黑暗中传来低语声。',
      choices: ['仔细聆听 🧠', '快速离开 🏃'],
      outcomes: ['atk+1', 'nothing']
    },
    {
      text: '一个受伤的商人倒在路边，请求你帮助他。',
      choices: ['帮助他 💊', '无视他 🚶'],
      outcomes: ['gold+50', 'nothing']
    },
    {
      text: '你踩到了古老的陷阱！情急之下你做出反应。',
      choices: ['翻滚躲避 🤸', '硬抗 🛡️'],
      outcomes: ['hp-10', 'hp-20']
    },
    {
      text: '一面神秘的墙壁上刻满了古代铭文。',
      choices: ['破解铭文 📜', '忽略它 🚶'],
      outcomes: ['exp+20', 'nothing']
    },
    {
      text: '一只受伤的小动物躺在角落，瑟瑟发抖。',
      choices: ['给它食物 🍞', '离开 🚶'],
      outcomes: ['hp+10', 'nothing']
    }
  ],

  // 掉落率配置
  lootChance: {
    normal: 0.2,
    elite: 0.5,
    boss: 0.9
  },

  // 稀有度权重
  rarityWeights: {
    common: 50,
    uncommon: 30,
    rare: 14,
    epic: 5,
    legendary: 1
  },

  // 稀有度颜色
  rarityColors: {
    common: '#9a9a9a',
    uncommon: '#4ad1d4',
    rare: '#4a76d4',
    epic: '#a04ad4',
    legendary: '#d4a643'
  }
};