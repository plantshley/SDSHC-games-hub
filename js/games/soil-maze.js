// ============================================
// GAME 3: SOIL LIFE MAZE (Touch Maze)
// Trace a path through procedural mazes
// ============================================

const SoilMazeGame = {
    container: null,
    level: 1,
    canvas: null,
    ctx: null,
    maze: null,
    cellSize: 40,
    playerPos: null,
    goalPos: null,
    checkpoints: [],
    visitedCheckpoints: [],
    isDrawing: false,
    path: [],

    init(container, level) {
        this.container = container;
        this.level = level;
        this.visitedCheckpoints = [];
        this.path = [];
        this.isDrawing = false;

        const levelData = MAZE_LEVELS[level];
        if (!levelData) return;

        this.generateMaze(levelData);
        this.render(levelData);
        this.setupTouchHandlers();
    },

    generateMaze(levelData) {
        const w = levelData.width;
        const h = levelData.height;

        // Initialize grid: 0 = wall, 1 = path
        this.maze = Array.from({ length: h }, () => Array(w).fill(0));

        // Recursive backtracker maze generation
        const stack = [];
        const startX = 1;
        const startY = 1;
        this.maze[startY][startX] = 1;
        stack.push([startX, startY]);

        while (stack.length > 0) {
            const [cx, cy] = stack[stack.length - 1];
            const neighbors = [];

            // Check 4 directions (step by 2 to leave walls between paths)
            const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
            for (const [dx, dy] of dirs) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && this.maze[ny][nx] === 0) {
                    neighbors.push([nx, ny, cx + dx / 2, cy + dy / 2]);
                }
            }

            if (neighbors.length > 0) {
                const [nx, ny, wx, wy] = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.maze[ny][nx] = 1;
                this.maze[wy][wx] = 1;
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        }

        // Set start and goal
        this.playerPos = { x: 1, y: 1 };
        this.goalPos = { x: w - 2, y: h - 2 };
        this.maze[this.goalPos.y][this.goalPos.x] = 1;

        // Place checkpoints for level 3
        if (levelData.checkpoints) {
            this.checkpoints = [];
            const pathCells = [];
            for (let y = 1; y < h - 1; y++) {
                for (let x = 1; x < w - 1; x++) {
                    if (this.maze[y][x] === 1 && !(x === 1 && y === 1) && !(x === w - 2 && y === h - 2)) {
                        pathCells.push({ x, y });
                    }
                }
            }
            // Spread checkpoints evenly
            const step = Math.floor(pathCells.length / (levelData.checkpoints.length + 1));
            for (let i = 0; i < levelData.checkpoints.length; i++) {
                const cell = pathCells[step * (i + 1)];
                if (cell) {
                    this.checkpoints.push({
                        x: cell.x,
                        y: cell.y,
                        name: levelData.checkpoints[i],
                        visited: false
                    });
                }
            }
        } else {
            this.checkpoints = [];
        }
    },

    render(levelData) {
        const w = levelData.width;
        const h = levelData.height;
        const canvasW = w * this.cellSize;
        const canvasH = h * this.cellSize;

        this.container.innerHTML = `
            <div class="maze-game">
                <canvas class="maze-canvas" id="maze-canvas" width="${canvasW}" height="${canvasH}"></canvas>
                <div class="maze-instructions">
                    ${levelData.instruction}
                </div>
                ${this.checkpoints.length > 0 ? `
                    <div style="position:absolute; top:20px; right:20px; font-family:var(--font-body); font-size:0.75rem;">
                        <div style="color:var(--color-accent); font-family:var(--font-title); font-size:0.55rem; margin-bottom:8px;">Checkpoints:</div>
                        ${this.checkpoints.map((cp, i) => `
                            <div id="checkpoint-${i}" style="opacity:0.5; margin-bottom:4px;">
                                ○ ${cp.name}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        this.canvas = document.getElementById('maze-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.drawMaze();
    },

    drawMaze() {
        const ctx = this.ctx;
        const cs = this.cellSize;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw cells
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[0].length; x++) {
                if (this.maze[y][x] === 0) {
                    // Wall
                    ctx.fillStyle = '#5a3a1a';
                    ctx.fillRect(x * cs, y * cs, cs, cs);
                    // Wall texture
                    ctx.fillStyle = '#4a2a10';
                    ctx.fillRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4);
                } else {
                    // Path
                    ctx.fillStyle = '#c4a870';
                    ctx.fillRect(x * cs, y * cs, cs, cs);
                    // Subtle grid
                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                    ctx.strokeRect(x * cs, y * cs, cs, cs);
                }
            }
        }

        // Draw checkpoints
        this.checkpoints.forEach((cp, i) => {
            ctx.fillStyle = cp.visited ? 'rgba(76,175,80,0.5)' : 'rgba(255,215,0,0.6)';
            ctx.beginPath();
            ctx.arc(cp.x * cs + cs / 2, cp.y * cs + cs / 2, cs / 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = '10px "JetBrains Mono"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const shortName = cp.name.substring(0, 3);
            ctx.fillText(shortName, cp.x * cs + cs / 2, cp.y * cs + cs / 2);
        });

        // Draw goal
        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(this.goalPos.x * cs + cs / 2, this.goalPos.y * cs + cs / 2, cs / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌻', this.goalPos.x * cs + cs / 2, this.goalPos.y * cs + cs / 2);

        // Draw player path
        if (this.path.length > 1) {
            ctx.strokeStyle = 'rgba(100, 200, 100, 0.6)';
            ctx.lineWidth = cs * 0.4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.path[0].x * cs + cs / 2, this.path[0].y * cs + cs / 2);
            for (let i = 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x * cs + cs / 2, this.path[i].y * cs + cs / 2);
            }
            ctx.stroke();
        }

        // Draw player
        const px = this.playerPos.x * cs + cs / 2;
        const py = this.playerPos.y * cs + cs / 2;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(px, py, cs / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px serif';
        ctx.fillText('🐛', px, py);
    },

    setupTouchHandlers() {
        this.canvas.addEventListener('pointerdown', (e) => {
            this.isDrawing = true;
            this.handleTouch(e);
        });
        this.canvas.addEventListener('pointermove', (e) => {
            if (this.isDrawing) this.handleTouch(e);
        });
        this.canvas.addEventListener('pointerup', () => {
            this.isDrawing = false;
        });
        this.canvas.addEventListener('pointerleave', () => {
            this.isDrawing = false;
        });
    },

    handleTouch(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);

        if (x < 0 || x >= this.maze[0].length || y < 0 || y >= this.maze.length) return;
        if (this.maze[y][x] === 0) return; // Wall

        // Must be adjacent to current position
        const dx = Math.abs(x - this.playerPos.x);
        const dy = Math.abs(y - this.playerPos.y);
        if (dx + dy > 1) return; // Not adjacent
        if (x === this.playerPos.x && y === this.playerPos.y) return; // Same cell

        // Move player
        this.playerPos = { x, y };
        this.path.push({ x, y });

        // Check checkpoints
        this.checkpoints.forEach((cp, i) => {
            if (cp.x === x && cp.y === y && !cp.visited) {
                cp.visited = true;
                this.visitedCheckpoints.push(cp.name);
                const el = document.getElementById(`checkpoint-${i}`);
                if (el) {
                    el.style.opacity = '1';
                    el.innerHTML = `● ${cp.name}`;
                    el.style.color = 'var(--color-success)';
                }
            }
        });

        // Check goal
        if (x === this.goalPos.x && y === this.goalPos.y) {
            // For checkpoint levels, all must be visited
            if (this.checkpoints.length > 0 && this.visitedCheckpoints.length < this.checkpoints.length) {
                // Not all checkpoints visited
                const missing = this.checkpoints.filter(cp => !cp.visited).map(cp => cp.name);
                // Flash a message
                const inst = this.container.querySelector('.maze-instructions');
                if (inst) inst.textContent = `Visit all checkpoints! Missing: ${missing.join(', ')}`;
            } else {
                this.completeMaze();
            }
        }

        this.drawMaze();
    },

    completeMaze() {
        app.updateScore(100);
        app.showFeedback(true);
        this.isDrawing = false;

        setTimeout(() => app.nextLevel(), 1500);
    },

    cleanup() {
        this.isDrawing = false;
        this.ctx = null;
        this.canvas = null;
    }
};

app.registerGame('soil-maze', SoilMazeGame);
