// ============================================
// GAME 2: WHAT DOES SOIL MAKE? (Glowing Dot-to-Dot)
// Tap glowing star-dots in order to reveal objects
// ============================================

const DotToDotGame = {
    container: null,
    level: 1,
    canvas: null,
    ctx: null,
    dots: [],
    currentDot: 0,
    puzzleIndex: 0,
    particles: [],
    animFrame: null,

    init(container, level) {
        this.container = container;
        this.level = level;
        this.puzzleIndex = 0;
        this.loadPuzzle();
    },

    loadPuzzle() {
        const levelData = DOT_TO_DOT_LEVELS[this.level];
        if (!levelData) return;

        const puzzle = levelData.puzzles[this.puzzleIndex];
        if (!puzzle) {
            // All puzzles in level complete
            app.nextLevel();
            return;
        }

        this.currentDot = 0;
        this.particles = [];
        this.generateDots(puzzle);
        this.render(levelData, puzzle);
        this.startAnimation();
    },

    generateDots(puzzle) {
        this.dots = [];
        const padding = 80;
        const w = window.innerWidth;
        const h = window.innerHeight - 120; // account for header

        // Generate dot positions in a rough shape
        // Use a simple approach: spread dots in a pattern
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.3;

        for (let i = 0; i < puzzle.dotCount; i++) {
            const angle = (i / puzzle.dotCount) * Math.PI * 2 - Math.PI / 2;
            // Add some organic randomness
            const r = radius + (Math.random() - 0.5) * radius * 0.4;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            this.dots.push({
                x: Math.max(padding, Math.min(w - padding, x)),
                y: Math.max(padding, Math.min(h - padding, y)),
                connected: false,
                number: i + 1
            });
        }
    },

    render(levelData, puzzle) {
        this.container.innerHTML = `
            <div class="dot-to-dot-game">
                <canvas class="dot-to-dot-canvas" id="dot-canvas"></canvas>
                <div class="dot-category-label">${levelData.title}</div>
                ${this.dots.map((dot, i) => `
                    <div class="dot-star ${i === 0 ? 'active' : ''}"
                         data-index="${i}"
                         style="left:${dot.x - 22}px; top:${dot.y - 22}px;"
                         onclick="DotToDotGame.tapDot(${i})">
                        <span class="dot-number">${dot.number}</span>
                    </div>
                `).join('')}
                <div style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%);
                            font-family:var(--font-title); font-size:0.7rem; color:rgba(255,255,200,0.6);">
                    ${puzzle.name} (${this.puzzleIndex + 1}/${levelData.puzzles.length})
                </div>
            </div>
        `;

        // Setup canvas
        this.canvas = document.getElementById('dot-canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 60;
        this.ctx = this.canvas.getContext('2d');
    },

    tapDot(index) {
        if (index !== this.currentDot) {
            // Wrong dot - flash it red briefly
            const dotEl = this.container.querySelector(`[data-index="${index}"]`);
            if (dotEl) {
                dotEl.style.filter = 'hue-rotate(0deg) brightness(1.5)';
                setTimeout(() => dotEl.style.filter = '', 300);
            }
            return;
        }

        const dot = this.dots[index];
        dot.connected = true;

        // Create particle burst
        this.createParticles(dot.x, dot.y);

        // Update dot visuals
        const dotEl = this.container.querySelector(`[data-index="${index}"]`);
        if (dotEl) {
            dotEl.classList.remove('active');
            dotEl.classList.add('connected');
        }

        // Draw line from previous dot
        if (index > 0) {
            this.drawGlowLine(this.dots[index - 1], dot);
        }

        this.currentDot++;

        // Highlight next dot
        if (this.currentDot < this.dots.length) {
            const nextEl = this.container.querySelector(`[data-index="${this.currentDot}"]`);
            if (nextEl) nextEl.classList.add('active');
        } else {
            // Puzzle complete!
            this.completePuzzle();
        }
    },

    drawGlowLine(from, to) {
        if (!this.ctx) return;

        // Outer glow
        this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();

        // Inner bright line
        this.ctx.strokeStyle = 'rgba(200, 230, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();

        // Core white line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
    },

    createParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: 2 + Math.random() * 3,
                color: `hsl(${50 + Math.random() * 30}, 100%, ${70 + Math.random() * 30}%)`
            });
        }
    },

    startAnimation() {
        const animate = () => {
            if (!this.ctx) return;

            // Only draw particles (lines are persistent)
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                p.vx *= 0.98;
                p.vy *= 0.98;

                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }

            // Draw background stars
            if (Math.random() < 0.1) {
                const sx = Math.random() * this.canvas.width;
                const sy = Math.random() * this.canvas.height;
                this.ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
                this.ctx.beginPath();
                this.ctx.arc(sx, sy, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.animFrame = requestAnimationFrame(animate);
        };
        this.animFrame = requestAnimationFrame(animate);
    },

    completePuzzle() {
        app.updateScore(50);
        app.showFeedback(true);

        // Hide all dots
        this.container.querySelectorAll('.dot-star').forEach(d => {
            d.style.transition = 'opacity 0.5s ease';
            d.style.opacity = '0';
        });

        // Show revealed name with shimmer
        const levelData = DOT_TO_DOT_LEVELS[this.level];
        const puzzle = levelData.puzzles[this.puzzleIndex];

        const nameEl = document.createElement('div');
        nameEl.style.cssText = `
            position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
            font-family:var(--font-title); font-size:2rem; color:#ffd700;
            text-shadow: 0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4);
            animation: shimmer 2s ease-in-out;
            z-index: 20;
        `;
        nameEl.textContent = puzzle.name;
        this.container.querySelector('.dot-to-dot-game').appendChild(nameEl);

        // Move to next puzzle after delay
        setTimeout(() => {
            this.puzzleIndex++;
            this.loadPuzzle();
        }, 2500);
    },

    cleanup() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.particles = [];
        this.ctx = null;
        this.canvas = null;
    }
};

app.registerGame('dot-to-dot', DotToDotGame);
