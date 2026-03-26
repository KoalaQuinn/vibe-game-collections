/**
 * 🎮 2048 - Phaser 版
 * Version: 1.0.0
 * Updated: 2026-03-27 00:15 (GMT+8)
 *
 * 规则：
 * - 上下左右滑动，相同数字合并相加
 * - 目标拼出 2048
 * - 没有空间游戏结束
 */

class PhaserGame {
    constructor() {
        // 游戏配置
        this.gridSize = 4; // 4x4 经典大小
        this.tileSize = 80;
        this.tileSpacing = 10;
        this.startX = 20;
        this.startY = 20;
        this.width = this.startX * 2 + this.gridSize * (this.tileSize + this.tileSpacing);
        this.height = this.startY * 2 + this.gridSize * (this.tileSize + this.tileSpacing);

        // 游戏状态
        this.score = 0;
        this.grid = [];
        this.gameOver = false;
        this.canMove = true;

        // 数字颜色映射
        this.colors = {
            2: '#eee4da',
            4: '#ede0c8',
            8: '#f2b179',
            16: '#f59563',
            32: '#f67c5f',
            64: '#f65e3b',
            128: '#edcf72',
            256: '#edcc61',
            512: '#edc850',
            1024: '#edc53f',
            2048: '#edc22e',
            4096: '#3da35d',
            8192: '#3da35d'
        };

        this.textColors = {
            2: '#776e65',
            4: '#776e65',
            8: '#f9f6f2',
            16: '#f9f6f2',
            32: '#f9f6f2',
            64: '#f9f6f2',
            128: '#f9f6f2',
            256: '#f9f6f2',
            512: '#f9f6f2',
            1024: '#f9f6f2',
            2048: '#f9f6f2',
            4096: '#f9f6f2',
            8192: '#f9f6f2'
        };

        // 创建 Phaser 游戏
        this.config = {
            type: Phaser.AUTO,
            width: this.width,
            height: this.height,
            parent: 'game-canvas',
            scene: {
                create: this.create.bind(this),
                update: this.update.bind(this)
            },
            input: {
                touch: true,
                mouse: true
            }
        };

        this.game = new Phaser.Game(this.config);
    }

    create() {
        const scene = this.game.scene.scenes[0];
        this.scene = scene;

        // 绘制背景网格
        this.drawBackground();

        // 初始化空网格
        this.initGrid();

        // 随机生成两个初始方块
        this.addRandomTile();
        this.addRandomTile();

        // 渲染所有方块
        this.renderTiles();

        // 输入处理
        this.setupInput();

        // 更新UI
        this.updateScore();
    }

    drawBackground() {
        const bg = this.scene.add.graphics();
        bg.fillStyle(0xbbada0, 1);
        bg.fillRoundedRect(0, 0, this.width, this.height, 8);
        bg.fill();

        // 画格子背景
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const px = this.startX + x * (this.tileSize + this.tileSpacing);
                const py = this.startY + y * (this.tileSize + this.tileSpacing);
                bg.fillStyle(0xcdc1b4, 1);
                bg.fillRoundedRect(px, py, this.tileSize, this.tileSize, 6);
            }
        }
    }

    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = null;
            }
        }
    }

    // 添加随机方块
    addRandomTile() {
        const empty = [];
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (!this.grid[y][x]) {
                    empty.push({x, y});
                }
            }
        }

        if (empty.length === 0) return false;

        const {x, y} = empty[Math.floor(Math.random() * empty.length)];
        // 90% 概率出 2，10% 出 4
        this.grid[y][x] = Math.random() < 0.9 ? 2 : 4;
        return true;
    }

    // 获取像素坐标
    getTilePos(gridX, gridY) {
        const x = this.startX + gridX * (this.tileSize + this.tileSpacing) + this.tileSize / 2;
        const y = this.startY + gridY * (this.tileSize + this.tileSpacing) + this.tileSize / 2;
        return {x, y};
    }

    // 渲染所有方块
    renderTiles() {
        // 清除旧方块
        if (this.tiles) {
            this.tiles.forEach(row => {
                row.forEach(tile => {
                    if (tile) {
                        tile.bg.destroy();
                        tile.text.destroy();
                    }
                });
            });
        }

        this.tiles = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.tiles[y][x] = null;
                if (this.grid[y][x]) {
                    const value = this.grid[y][x];
                    const {x: px, y: py} = this.getTilePos(x, y);
                    this.drawTile(px, py, value, x, y);
                }
            }
        }
    }

    drawTile(x, y, value, gridX, gridY) {
        const colorHex = this.colors[value] || '#3da35d';
        const textColorHex = this.textColors[value] || '#ffffff';

        // 转换 hex 到 Phaser 数字
        const bgColor = parseInt(colorHex.replace('#', ''), 16);
        const txtColor = parseInt(textColorHex.replace('#', ''), 16);

        const bg = this.scene.add.graphics();
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(x - this.tileSize/2, y - this.tileSize/2, this.tileSize, this.tileSize, 6);
        bg.fill();

        // 计算字体大小
        let fontSize = value >= 1000 ? 20 : value >= 100 ? 24 : 28;
        const text = this.scene.add.text(x, y, value.toString(), {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#' + txtColor.toString(16)
        });
        text.setOrigin(0.5);

        this.tiles[gridY][gridX] = {bg, text};
    }

    setupInput() {
        // 键盘输入
        const scene = this.scene;
        scene.input.keyboard.on('keydown', (e) => {
            if (!this.canMove || this.gameOver) return;

            switch(e.code) {
                case 'ArrowUp':
                    this.moveUp();
                    break;
                case 'ArrowDown':
                    this.moveDown();
                    break;
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                default:
                    return;
            }

            e.preventDefault();
        });

        // 触摸滑动
        let startX = 0;
        let startY = 0;

        scene.input.on('pointerdown', (pointer) => {
            startX = pointer.x;
            startY = pointer.y;
        });

        scene.input.on('pointerup', (pointer) => {
            if (!this.canMove || this.gameOver) return;

            const endX = pointer.x;
            const endY = pointer.y;
            const dx = endX - startX;
            const dy = endY - startY;

            // 判断滑动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平滑动
                if (dx > 20) {
                    this.moveRight();
                } else if (dx < -20) {
                    this.moveLeft();
                }
            } else {
                // 垂直滑动
                if (dy > 20) {
                    this.moveDown();
                } else if (dy < -20) {
                    this.moveUp();
                }
            }
        });
    }

    // 向左移动
    moveLeft() {
        let moved = false;
        const merged = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 1; x < this.gridSize; x++) {
                if (!this.grid[y][x]) continue;

                let targetX = x;
                while (targetX > 0 && !this.grid[y][targetX - 1]) {
                    targetX--;
                }

                if (targetX === 0 || (this.grid[y][targetX - 1] !== this.grid[y][x] || merged[y][targetX - 1])) {
                    // 只是移动，不合并
                    if (targetX !== x) {
                        this.grid[y][targetX] = this.grid[y][x];
                        this.grid[y][x] = null;
                        moved = true;
                    }
                } else {
                    // 合并
                    this.grid[y][targetX - 1] *= 2;
                    this.score += this.grid[y][targetX - 1];
                    this.grid[y][x] = null;
                    merged[y][targetX - 1] = true;
                    moved = true;

                    // 检查是否达到2048
                    if (this.grid[y][targetX - 1] === 2048) {
                        this.winGame();
                    }
                }
            }
        }

        this.afterMove(moved);
    }

    // 向右移动
    moveRight() {
        let moved = false;
        const merged = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = this.gridSize - 2; x >= 0; x--) {
                if (!this.grid[y][x]) continue;

                let targetX = x;
                while (targetX < this.gridSize - 1 && !this.grid[y][targetX + 1]) {
                    targetX++;
                }

                if (targetX === this.gridSize - 1 || (this.grid[y][targetX + 1] !== this.grid[y][x] || merged[y][targetX + 1])) {
                    if (targetX !== x) {
                        this.grid[y][targetX] = this.grid[y][x];
                        this.grid[y][x] = null;
                        moved = true;
                    }
                } else {
                    this.grid[y][targetX + 1] *= 2;
                    this.score += this.grid[y][targetX + 1];
                    this.grid[y][x] = null;
                    merged[y][targetX + 1] = true;
                    moved = true;

                    if (this.grid[y][targetX + 1] === 2048) {
                        this.winGame();
                    }
                }
            }
        }

        this.afterMove(moved);
    }

    // 向上移动
    moveUp() {
        let moved = false;
        const merged = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));

        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 1; y < this.gridSize; y++) {
                if (!this.grid[y][x]) continue;

                let targetY = y;
                while (targetY > 0 && !this.grid[targetY - 1][x]) {
                    targetY--;
                }

                if (targetY === 0 || (this.grid[targetY - 1][x] !== this.grid[y][x] || merged[targetY - 1][x])) {
                    if (targetY !== y) {
                        this.grid[targetY][x] = this.grid[y][x];
                        this.grid[y][x] = null;
                        moved = true;
                    }
                } else {
                    this.grid[targetY - 1][x] *= 2;
                    this.score += this.grid[targetY - 1][x];
                    this.grid[y][x] = null;
                    merged[targetY - 1][x] = true;
                    moved = true;

                    if (this.grid[targetY - 1][x] === 2048) {
                        this.winGame();
                    }
                }
            }
        }

        this.afterMove(moved);
    }

    // 向下移动
    moveDown() {
        let moved = false;
        const merged = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));

        for (let x = 0; x < this.gridSize; x++) {
            for (let y = this.gridSize - 2; y >= 0; y--) {
                if (!this.grid[y][x]) continue;

                let targetY = y;
                while (targetY < this.gridSize - 1 && !this.grid[targetY + 1][x]) {
                    targetY++;
                }

                if (targetY === this.gridSize - 1 || (this.grid[targetY + 1][x] !== this.grid[y][x] || merged[targetY + 1][x])) {
                    if (targetY !== y) {
                        this.grid[targetY][x] = this.grid[y][x];
                        this.grid[y][x] = null;
                        moved = true;
                    }
                } else {
                    this.grid[targetY + 1][x] *= 2;
                    this.score += this.grid[targetY + 1][x];
                    this.grid[y][x] = null;
                    merged[targetY + 1][x] = true;
                    moved = true;

                    if (this.grid[targetY + 1][x] === 2048) {
                        this.winGame();
                    }
                }
            }
        }

        this.afterMove(moved);
    }

    afterMove(moved) {
        if (!moved) {
            // 检查游戏是否结束
            this.checkGameOver();
            return;
        }

        this.canMove = false;

        // 更新渲染
        this.renderTiles();
        this.updateScore();

        // 添加新方块
        setTimeout(() => {
            this.addRandomTile();
            this.renderTiles();
            this.canMove = true;
            this.checkGameOver();
        }, 150);
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        // 更新最高分
        const best = parseInt(localStorage.getItem('2048-best') || '0');
        if (this.score > best) {
            localStorage.setItem('2048-best', this.score.toString());
            document.getElementById('best-score').textContent = this.score;
        }
    }

    checkGameOver() {
        // 还有空格，继续
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (!this.grid[y][x]) return false;
            }
        }

        // 检查还有没有可合并的相邻方块
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const val = this.grid[y][x];
                // 右边
                if (x < this.gridSize - 1 && this.grid[y][x + 1] === val) return false;
                // 下边
                if (y < this.gridSize - 1 && this.grid[y + 1][x] === val) return false;
            }
        }

        // 没有空格也没有可合并，游戏结束
        this.gameOver = true;
        setTimeout(() => {
            alert(`游戏结束！得分：${this.score}\n点击确定重新开始`);
            restartGame();
        }, 300);

        return true;
    }

    winGame() {
        setTimeout(() => {
            alert(`恭喜你！成功拼出 2048！🎉\n当前得分：${this.score}\n继续游戏挑战更高分吧！`);
        }, 300);
    }

    update() {
        // Phaser 帧更新，这里暂时不需要做什么
    }
}
