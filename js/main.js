/**
 * main.js
 * 游戏入口：初始化画布、处理键盘输入、管理游戏状态与主循环。
 */
window.RDL = window.RDL || {};

(function() {
  const canvas = document.getElementById('gameCanvas');
  let game = null;
  let menuActive = true;

  RDL.ui.init(canvas);
  renderMenu();

  document.addEventListener('keydown', function(e) {
    const key = e.key;

    if (menuActive) {
      if (key === 'Enter') {
        startNewGame();
      }
      return;
    }

    if (!game || (game.state !== 'playing')) {
      if (key === 'r' || key === 'R') {
        startNewGame();
      }
      return;
    }

    const dir = RDL.config.KEYS[key];
    if (dir) {
      const deltas = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const [dx, dy] = deltas[dir];
      RDL.systems.movePlayer(game, dx, dy);
      if (game.state === 'playing') {
        RDL.systems.endPlayerTurn(game);
      }
      renderGame();
      return;
    }

    if (key === ' ' || key === 'Space') {
      const p = game.player;
      const onStair = p.x === game.stairPos.x && p.y === game.stairPos.y;
      if (onStair) {
        RDL.systems.nextFloor(game);
      } else {
        const idx = p.inventory.findIndex(item => item.template.type === 'consumable');
        if (idx !== -1) {
          RDL.systems.useItem(game, idx);
          RDL.systems.endPlayerTurn(game);
        }
      }
      renderGame();
    }
  });

  canvas.addEventListener('click', function() {
    if (menuActive || !game || game.state !== 'playing') {
      startNewGame();
    }
  });

  function startNewGame() {
    game = {
      floor: 0,
      map: null,
      width: 0,
      height: 0,
      spawn: null,
      stairPos: null,
      player: null,
      enemies: [],
      items: [],
      messages: [],
      state: 'playing'
    };
    menuActive = false;
    loadFloor(1);
    renderGame();
  }

  function loadFloor(floor) {
    const generated = RDL.dungeon.generateFloor(floor);
    game.floor = generated.floor;
    game.map = generated.map;
    game.width = generated.width;
    game.height = generated.height;
    game.spawn = generated.spawn;
    game.stairPos = generated.stairPos;
    game.enemies = generated.enemies;
    game.items = generated.items;

    if (floor === 1) {
      game.player = RDL.entities.createPlayer(game.spawn.x, game.spawn.y);
    } else {
      game.player.x = game.spawn.x;
      game.player.y = game.spawn.y;
    }

    let msg = '';
    if (floor === 1) {
      msg = '欢迎来到遗落地牢！使用方向键移动，空格使用物品/下楼。';
    } else {
      msg = `你来到了地下 ${floor} 层。`;
    }
    game.messages.push(msg);
  }

  function renderMenu() {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('遗落地牢：枯骨回响', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '14px monospace';
    ctx.fillText('按 Enter 开始游戏', canvas.width / 2, canvas.height / 2 + 20);
  }

  function renderGame() {
    if (!game) return;
    RDL.ui.render(game);

    if (game.state === 'dead') {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff5555';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('你 死 了', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText('按 R 重新开始', canvas.width / 2, canvas.height / 2 + 25);
    } else if (game.state === 'victory') {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffcc44';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('胜 利 ！', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText('按 R 再来一局', canvas.width / 2, canvas.height / 2 + 25);
    }
  }
})();