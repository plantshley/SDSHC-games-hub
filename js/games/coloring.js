// ============================================
// GAME 4: SOIL CRITTER COLORING
// Tap to flood-fill regions of line art
// ============================================

const ColoringGame = {
    container: null,
    level: 1,
    canvas: null,
    ctx: null,
    selectedColor: '#e74c3c',
    pages: [
        { name: 'Tree', file: 'tree' },
        { name: 'Bison', file: 'bison' },
        { name: 'Cow', file: 'cow' },
        { name: 'Duck', file: 'duck' },
        { name: 'Worm', file: 'worm' },
        { name: 'Caterpillar', file: 'caterpillar' }
    ],
    colors: [
        { name: 'Red', hex: '#e74c3c' },
        { name: 'Orange', hex: '#f39c12' },
        { name: 'Yellow', hex: '#f1c40f' },
        { name: 'Green', hex: '#2ecc71' },
        { name: 'Blue', hex: '#3498db' },
        { name: 'Purple', hex: '#9b59b6' },
        { name: 'Brown', hex: '#8b4513' },
        { name: 'Pink', hex: '#e91e90' },
        { name: 'White', hex: '#ffffff' },
        { name: 'Black', hex: '#2d2d2d' }
    ],

    init(container, level) {
        this.container = container;
        this.level = level;

        const page = this.pages[level - 1];
        if (!page) return;

        this.render(page);
    },

    render(page) {
        this.container.innerHTML = `
            <div class="coloring-game">
                <div class="color-palette">
                    <div style="font-family:var(--font-title); font-size:0.5rem; color:var(--color-accent); margin-bottom:8px;">
                        Colors
                    </div>
                    ${this.colors.map(c => `
                        <div class="color-swatch ${c.hex === this.selectedColor ? 'selected' : ''}"
                             style="background:${c.hex};"
                             onclick="ColoringGame.pickColor('${c.hex}', this)"
                             title="${c.name}">
                        </div>
                    `).join('')}
                    <button class="pixel-btn" style="margin-top:auto; font-size:0.5rem; padding:8px 12px;"
                            onclick="ColoringGame.clearCanvas()">
                        Clear
                    </button>
                    <button class="pixel-btn" style="font-size:0.5rem; padding:8px 12px;"
                            onclick="app.nextLevel()">
                        Next
                    </button>
                </div>
                <div class="coloring-canvas-wrap">
                    <canvas class="coloring-canvas" id="coloring-canvas"></canvas>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('coloring-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // Set canvas size
        const wrapRect = this.container.querySelector('.coloring-canvas-wrap').getBoundingClientRect();
        const size = Math.min(wrapRect.width - 40, wrapRect.height - 40, 600);
        this.canvas.width = size;
        this.canvas.height = size;

        // Draw a simple line-art placeholder
        // (Would load from assets/coloring/ if extracted from PDF)
        this.drawPlaceholderArt(page);

        // Setup touch handler
        this.canvas.addEventListener('pointerdown', (e) => this.handleTap(e));
    },

    drawPlaceholderArt(page) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Draw a simple outline based on the page theme
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#ffffff';

        const cx = w / 2;
        const cy = h / 2;

        switch (page.file) {
            case 'tree':
                // Tree trunk
                ctx.fillRect(cx - 20, cy, 40, h * 0.35);
                ctx.strokeRect(cx - 20, cy, 40, h * 0.35);
                // Canopy circles
                this.drawCircleOutline(ctx, cx, cy - 40, 60);
                this.drawCircleOutline(ctx, cx - 50, cy - 10, 45);
                this.drawCircleOutline(ctx, cx + 50, cy - 10, 45);
                this.drawCircleOutline(ctx, cx - 30, cy - 60, 40);
                this.drawCircleOutline(ctx, cx + 30, cy - 60, 40);
                // Ground
                ctx.beginPath();
                ctx.moveTo(0, cy + h * 0.35);
                ctx.lineTo(w, cy + h * 0.35);
                ctx.stroke();
                break;

            case 'bison':
                // Body
                ctx.beginPath();
                ctx.ellipse(cx, cy + 20, 100, 60, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Head
                this.drawCircleOutline(ctx, cx - 90, cy - 10, 40);
                // Legs
                ctx.strokeRect(cx - 60, cy + 70, 15, 50);
                ctx.strokeRect(cx - 20, cy + 70, 15, 50);
                ctx.strokeRect(cx + 20, cy + 70, 15, 50);
                ctx.strokeRect(cx + 55, cy + 70, 15, 50);
                // Horns
                ctx.beginPath();
                ctx.moveTo(cx - 110, cy - 40);
                ctx.quadraticCurveTo(cx - 130, cy - 70, cx - 115, cy - 55);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - 75, cy - 40);
                ctx.quadraticCurveTo(cx - 55, cy - 70, cx - 70, cy - 55);
                ctx.stroke();
                // Ground
                ctx.beginPath();
                ctx.moveTo(0, cy + 120);
                ctx.lineTo(w, cy + 120);
                ctx.stroke();
                break;

            case 'cow':
                // Body
                ctx.beginPath();
                ctx.ellipse(cx, cy + 10, 90, 55, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Head
                this.drawCircleOutline(ctx, cx + 80, cy - 20, 35);
                // Spots
                this.drawCircleOutline(ctx, cx - 20, cy, 20);
                this.drawCircleOutline(ctx, cx + 30, cy + 15, 15);
                // Legs
                ctx.strokeRect(cx - 55, cy + 55, 12, 45);
                ctx.strokeRect(cx - 20, cy + 55, 12, 45);
                ctx.strokeRect(cx + 20, cy + 55, 12, 45);
                ctx.strokeRect(cx + 50, cy + 55, 12, 45);
                // Tail
                ctx.beginPath();
                ctx.moveTo(cx - 85, cy);
                ctx.quadraticCurveTo(cx - 120, cy - 30, cx - 110, cy + 10);
                ctx.stroke();
                break;

            case 'duck':
                // Body
                ctx.beginPath();
                ctx.ellipse(cx, cy + 20, 70, 45, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Head
                this.drawCircleOutline(ctx, cx + 60, cy - 30, 28);
                // Beak
                ctx.beginPath();
                ctx.moveTo(cx + 85, cy - 30);
                ctx.lineTo(cx + 115, cy - 25);
                ctx.lineTo(cx + 85, cy - 20);
                ctx.closePath();
                ctx.stroke();
                // Wing
                ctx.beginPath();
                ctx.ellipse(cx - 10, cy + 10, 40, 25, -0.3, 0, Math.PI * 2);
                ctx.stroke();
                // Eye
                ctx.beginPath();
                ctx.arc(cx + 65, cy - 35, 4, 0, Math.PI * 2);
                ctx.fill();
                // Water
                ctx.beginPath();
                ctx.moveTo(0, cy + 65);
                ctx.bezierCurveTo(w * 0.3, cy + 55, w * 0.6, cy + 75, w, cy + 65);
                ctx.stroke();
                break;

            case 'worm':
                // Wavy worm body
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(cx - 100, cy);
                ctx.bezierCurveTo(cx - 70, cy - 40, cx - 30, cy + 40, cx, cy);
                ctx.bezierCurveTo(cx + 30, cy - 40, cx + 70, cy + 40, cx + 100, cy);
                ctx.stroke();
                // Body segments
                for (let i = -80; i <= 80; i += 20) {
                    ctx.beginPath();
                    ctx.moveTo(cx + i, cy - 15);
                    ctx.lineTo(cx + i, cy + 15);
                    ctx.stroke();
                }
                // Face
                ctx.beginPath();
                ctx.arc(cx + 105, cy - 3, 5, 0, Math.PI * 2);
                ctx.fill();
                // Smile
                ctx.beginPath();
                ctx.arc(cx + 105, cy + 3, 8, 0, Math.PI);
                ctx.stroke();
                // Underground line
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, cy + 40);
                ctx.lineTo(w, cy + 40);
                ctx.stroke();
                ctx.fillStyle = '#f5f0e0';
                ctx.fillRect(0, cy + 40, w, h - cy - 40);
                ctx.strokeRect(0, cy + 40, w, h - cy - 40);
                break;

            case 'caterpillar':
                // Body segments (circles in a row)
                const segCount = 7;
                const segRadius = 25;
                const startX = cx - (segCount * segRadius);
                for (let i = 0; i < segCount; i++) {
                    const sx = startX + i * segRadius * 2;
                    const sy = cy + Math.sin(i * 0.6) * 15;
                    this.drawCircleOutline(ctx, sx, sy, segRadius);
                }
                // Head (larger)
                const headX = startX + segCount * segRadius * 2;
                this.drawCircleOutline(ctx, headX, cy, segRadius + 8);
                // Eyes
                ctx.beginPath();
                ctx.arc(headX + 5, cy - 10, 5, 0, Math.PI * 2);
                ctx.fill();
                // Antennae
                ctx.beginPath();
                ctx.moveTo(headX - 5, cy - segRadius - 5);
                ctx.lineTo(headX - 15, cy - segRadius - 30);
                ctx.moveTo(headX + 5, cy - segRadius - 5);
                ctx.lineTo(headX + 15, cy - segRadius - 30);
                ctx.stroke();
                // Little feet
                for (let i = 0; i < segCount; i++) {
                    const sx = startX + i * segRadius * 2;
                    const sy = cy + Math.sin(i * 0.6) * 15 + segRadius;
                    ctx.strokeRect(sx - 5, sy, 4, 12);
                    ctx.strokeRect(sx + 5, sy, 4, 12);
                }
                // Leaf
                ctx.beginPath();
                ctx.ellipse(cx, cy + 80, 80, 30, 0.2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - 60, cy + 85);
                ctx.lineTo(cx + 60, cy + 75);
                ctx.stroke();
                break;
        }

        // Title
        ctx.fillStyle = '#333';
        ctx.font = '16px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(`Color the ${page.name}!`, cx, 30);
    },

    drawCircleOutline(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();
    },

    pickColor(hex, swatch) {
        this.selectedColor = hex;
        this.container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
    },

    handleTap(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) * (this.canvas.width / rect.width));
        const y = Math.round((e.clientY - rect.top) * (this.canvas.height / rect.height));

        this.floodFill(x, y, this.selectedColor);
    },

    floodFill(startX, startY, fillColorHex) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Convert hex to RGB
        const fillR = parseInt(fillColorHex.slice(1, 3), 16);
        const fillG = parseInt(fillColorHex.slice(3, 5), 16);
        const fillB = parseInt(fillColorHex.slice(5, 7), 16);

        // Get target color at start position
        const startIdx = (startY * w + startX) * 4;
        const targetR = data[startIdx];
        const targetG = data[startIdx + 1];
        const targetB = data[startIdx + 2];
        const targetA = data[startIdx + 3];

        // Don't fill if clicking on a line (black/dark) or same color
        if (targetR < 40 && targetG < 40 && targetB < 40) return;
        if (targetR === fillR && targetG === fillG && targetB === fillB) return;

        const tolerance = 30;
        const matchesTarget = (idx) => {
            return Math.abs(data[idx] - targetR) <= tolerance &&
                   Math.abs(data[idx + 1] - targetG) <= tolerance &&
                   Math.abs(data[idx + 2] - targetB) <= tolerance &&
                   Math.abs(data[idx + 3] - targetA) <= tolerance;
        };

        const stack = [[startX, startY]];
        const visited = new Set();
        const maxPixels = 200000; // Safety limit
        let pixelCount = 0;

        while (stack.length > 0 && pixelCount < maxPixels) {
            const [x, y] = stack.pop();
            if (x < 0 || x >= w || y < 0 || y >= h) continue;

            const key = y * w + x;
            if (visited.has(key)) continue;
            visited.add(key);

            const idx = key * 4;
            if (!matchesTarget(idx)) continue;

            data[idx] = fillR;
            data[idx + 1] = fillG;
            data[idx + 2] = fillB;
            data[idx + 3] = 255;
            pixelCount++;

            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    },

    clearCanvas() {
        const page = this.pages[this.level - 1];
        if (page) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawPlaceholderArt(page);
        }
    },

    cleanup() {
        this.ctx = null;
        this.canvas = null;
    }
};

app.registerGame('coloring', ColoringGame);
