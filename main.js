// 2048 Canvas Game
// 获取 canvas 元素和上下文
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
// 棋盘大小和格子参数
const size = 4;
const tileSize = 100;
const gap = 10;
canvas.width = size * tileSize + (size + 1) * gap;
canvas.height = size * tileSize + (size + 1) * gap;

let board = [];
let score = 0;
let mergedTiles = [];
let animating = false;
let moveAnimations = [];

// 初始化棋盘，添加两个随机数字
function initBoard() {
  board = Array.from({ length: size }, () => Array(size).fill(0));
  addRandomTile();
  addRandomTile();
}

// 在空白处添加一个 2 或 4
function addRandomTile() {
  const empty = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

// 绘制整个棋盘
function drawBoard(animationProgress = 1) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "32px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isMerged = mergedTiles.some(([mr, mc]) => mr === r && mc === c);
      drawTile(r, c, board[r][c], isMerged ? animationProgress : 1);
    }
  }
  // 优化分数显示样式
  const scoreDiv = document.getElementById("score");
  scoreDiv.textContent = "Score: " + score;
  scoreDiv.style.background = "#bbada0";
  scoreDiv.style.color = "#fff";
  scoreDiv.style.fontSize = "28px";
  scoreDiv.style.padding = "10px 30px";
  scoreDiv.style.borderRadius = "10px";
  scoreDiv.style.display = "inline-block";
  scoreDiv.style.margin = "20px auto";
  scoreDiv.style.fontWeight = "bold";
}

// 绘制单个格子
function drawTile(r, c, value, scale = 1, mergeAnim = false) {
  const x = gap + c * (tileSize + gap);
  const y = gap + r * (tileSize + gap);
  // 根据分数设置不同颜色
  const tileColors = {
    0: { bg: "#cdc1b4", color: "#776e65" },
    2: { bg: "#eee4da", color: "#776e65" },
    4: { bg: "#ede0c8", color: "#776e65" },
    8: { bg: "#f2b179", color: "#f9f6f2" },
    16: { bg: "#f59563", color: "#f9f6f2" },
    32: { bg: "#f67c5f", color: "#f9f6f2" },
    64: { bg: "#f65e3b", color: "#f9f6f2" },
    128: { bg: "#edcf72", color: "#f9f6f2" },
    256: { bg: "#edcc61", color: "#f9f6f2" },
    512: { bg: "#edc850", color: "#f9f6f2" },
    1024: { bg: "#edc53f", color: "#f9f6f2" },
    2048: { bg: "#edc22e", color: "#f9f6f2" },
  };
  const color = tileColors[value] || { bg: "#3c3a32", color: "#f9f6f2" };
  // 绘制带圆角的矩形
  const radius = 16;
  ctx.save();
  ctx.translate(x + tileSize / 2, y + tileSize / 2);
  if (mergeAnim) {
    ctx.scale(scale, scale);
  }
  ctx.beginPath();
  ctx.moveTo(-tileSize / 2 + radius, -tileSize / 2);
  ctx.lineTo(tileSize / 2 - radius, -tileSize / 2);
  ctx.quadraticCurveTo(
    tileSize / 2,
    -tileSize / 2,
    tileSize / 2,
    -tileSize / 2 + radius
  );
  ctx.lineTo(tileSize / 2, tileSize / 2 - radius);
  ctx.quadraticCurveTo(
    tileSize / 2,
    tileSize / 2,
    tileSize / 2 - radius,
    tileSize / 2
  );
  ctx.lineTo(-tileSize / 2 + radius, tileSize / 2);
  ctx.quadraticCurveTo(
    -tileSize / 2,
    tileSize / 2,
    -tileSize / 2,
    tileSize / 2 - radius
  );
  ctx.lineTo(-tileSize / 2, -tileSize / 2 + radius);
  ctx.quadraticCurveTo(
    -tileSize / 2,
    -tileSize / 2,
    -tileSize / 2 + radius,
    -tileSize / 2
  );
  ctx.closePath();
  ctx.fillStyle = color.bg;
  ctx.fill();
  if (value) {
    // 根据数字长度动态调整字体大小
    let fontSize = 32;
    if (value >= 1024) fontSize = 22;
    else if (value >= 128) fontSize = 26;
    else if (value >= 16) fontSize = 28;
    ctx.fillStyle = color.color;
    ctx.font = fontSize + "px Arial";
    ctx.fillText(value, 0, 0);
  }
  ctx.restore();
}

// 处理移动和合并逻辑
function move(dir) {
  let moved = false;
  let merged = Array.from({ length: size }, () => Array(size).fill(false));
  mergedTiles = [];
  let oldBoard = board.map((row) => row.slice());
  // 遍历顺序根据方向调整
  function traverse(callback) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        let r = i,
          c = j;
        if (dir === "right") c = size - 1 - j;
        if (dir === "down") r = size - 1 - i;
        callback(r, c);
      }
    }
  }
  traverse((r, c) => {
    if (board[r][c] === 0) return;
    let nr = r,
      nc = c;
    while (true) {
      let tr = nr,
        tc = nc;
      if (dir === "left") tc--;
      if (dir === "right") tc++;
      if (dir === "up") tr--;
      if (dir === "down") tr++;
      if (tr < 0 || tr >= size || tc < 0 || tc >= size) break;
      if (board[tr][tc] === 0) {
        board[tr][tc] = board[nr][nc];
        board[nr][nc] = 0;
        nr = tr;
        nc = tc;
        moved = true;
      } else if (board[tr][tc] === board[nr][nc] && !merged[tr][tc]) {
        board[tr][tc] *= 2;
        score += board[tr][tc];
        board[nr][nc] = 0;
        merged[tr][tc] = true;
        mergedTiles.push([tr, tc]);
        moved = true;
        break;
      } else {
        break;
      }
    }
  });
  if (moved) {
    addRandomTile();
    animateMerge();
  } else {
    drawBoard();
  }
  if (isGameOver()) {
    setTimeout(() => alert("Game Over!"), 100);
  }
}

function animateMerge() {
  animating = true;
  let start = null;
  function animate(ts) {
    if (!start) start = ts;
    let progress = Math.min((ts - start) / 120, 1); // 120ms 动画
    let scale = 1 + 0.15 * Math.sin(Math.PI * progress); // 微小弹跳
    drawBoard(scale);
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      animating = false;
      mergedTiles = [];
      drawBoard();
    }
  }
  requestAnimationFrame(animate);
}

// 判断游戏是否结束
function isGameOver() {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) return false;
      for (let [dr, dc] of [
        [0, 1],
        [1, 0],
      ]) {
        let nr = r + dr,
          nc = c;
        if (nr < size && nc < size && board[r][c] === board[nr][nc])
          return false;
      }
    }
  }
  return true;
}

// 监听键盘事件，控制方向
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") move("left");
  if (e.key === "ArrowRight") move("right");
  if (e.key === "ArrowUp") move("up");
  if (e.key === "ArrowDown") move("down");
});

initBoard();
drawBoard();
