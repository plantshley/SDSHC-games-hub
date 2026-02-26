// ============================================
// GAME 6: SPIN THE SOIL WHEEL (Wheel + Trivia)
// Spin a wheel, answer questions, grow a flower
// ============================================

const SpinWheelGame = {
    container: null,
    level: 1,
    canvas: null,
    ctx: null,
    rotation: 0,
    spinning: false,
    questions: [],
    currentQuestion: 0,
    waterDrops: 0,
    answered: false,
    categories: [],

    init(container, level) {
        this.container = container;
        this.level = level;
        this.waterDrops = 0;
        this.currentQuestion = 0;
        this.answered = false;
        this.spinning = false;
        this.rotation = 0;

        // Get questions for this level
        const cat = SPIN_WHEEL_CATEGORIES[level];
        if (!cat) return;

        this.questions = [...TRIVIA_QUESTIONS[cat.key]].sort(() => Math.random() - 0.5);
        this.buildCategories();
        this.render();
        this.drawWheel();
    },

    buildCategories() {
        // Build wheel segments from all available categories up to current level
        this.categories = [];
        for (let i = 1; i <= Math.min(this.level, 7); i++) {
            const cat = SPIN_WHEEL_CATEGORIES[i];
            if (cat) this.categories.push(cat);
        }
    },

    render() {
        const cat = SPIN_WHEEL_CATEGORIES[this.level];
        this.container.innerHTML = `
            <div class="wheel-game">
                <div class="wheel-container">
                    <div class="wheel-pointer"></div>
                    <canvas class="wheel-canvas" id="wheel-canvas" width="400" height="400"></canvas>
                    <div style="text-align:center; margin-top:12px; font-family:var(--font-body); font-size:0.8rem; opacity:0.7;">
                        Swipe or tap to spin!
                    </div>
                </div>
                <div class="wheel-question-panel">
                    <div style="font-family:var(--font-title); font-size:0.6rem; color:var(--color-accent);">
                        ${cat.name} - Question ${this.currentQuestion + 1}/${this.questions.length}
                    </div>
                    <div class="wheel-question-text" id="wheel-question">
                        Spin the wheel to get a question!
                    </div>
                    <div class="wheel-answers" id="wheel-answers"></div>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                        <span style="font-size:1.5rem;">💧</span>
                        <span class="water-drop-count" id="water-drops">${this.waterDrops} water drops</span>
                        <span style="margin-left:auto; font-size:1.5rem;" id="flower-display">🌱</span>
                    </div>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('wheel-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Setup spin interaction
        this.canvas.addEventListener('pointerdown', () => {
            if (!this.spinning && !this.answered) {
                this.spinWheel();
            }
        });
    },

    drawWheel() {
        const ctx = this.ctx;
        const cx = 200, cy = 200, r = 180;
        const segments = this.categories;
        const segAngle = (Math.PI * 2) / segments.length;

        ctx.clearRect(0, 0, 400, 400);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation);

        segments.forEach((seg, i) => {
            const startAngle = i * segAngle;
            const endAngle = startAngle + segAngle;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, r, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = seg.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            ctx.save();
            ctx.rotate(startAngle + segAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = '11px "JetBrains Mono"';
            ctx.fillText(seg.name, r - 15, 4);
            ctx.restore();
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#2d2d2d';
        ctx.fill();
        ctx.strokeStyle = '#f4d03f';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();

        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#f4d03f';
        ctx.lineWidth = 4;
        ctx.stroke();
    },

    spinWheel() {
        if (this.spinning) return;
        this.spinning = true;

        const spins = 3 + Math.random() * 4; // 3-7 full rotations
        const targetRotation = this.rotation + spins * Math.PI * 2;
        const duration = 3000;
        const start = performance.now();
        const startRot = this.rotation;

        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            this.rotation = startRot + (targetRotation - startRot) * ease;
            this.drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.spinning = false;
                this.showQuestion();
            }
        };
        requestAnimationFrame(animate);
    },

    showQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.completeLevel();
            return;
        }

        const q = this.questions[this.currentQuestion];
        this.answered = false;

        document.getElementById('wheel-question').textContent = q.question;

        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        document.getElementById('wheel-answers').innerHTML = shuffledOptions.map(opt => `
            <button class="wheel-answer-btn" onclick="SpinWheelGame.answer(this, '${opt.replace(/'/g, "\\'")}')">
                ${opt}
            </button>
        `).join('');
    },

    answer(btn, selected) {
        if (this.answered) return;
        this.answered = true;

        const q = this.questions[this.currentQuestion];
        const isCorrect = selected === q.answer;

        if (isCorrect) {
            btn.classList.add('correct');
            this.waterDrops++;
            app.updateScore(10);
            app.showFeedback(true);
        } else {
            btn.classList.add('wrong');
            app.showFeedback(false);
            // Highlight correct
            this.container.querySelectorAll('.wheel-answer-btn').forEach(b => {
                if (b.textContent.trim() === q.answer) b.classList.add('correct');
            });
        }

        // Update water drops display
        document.getElementById('water-drops').textContent = `${this.waterDrops} water drops`;

        // Update flower growth
        const flowerStages = ['🌱', '🌿', '🌸', '🌻', '🌺'];
        const stage = Math.min(Math.floor(this.waterDrops / 2), flowerStages.length - 1);
        document.getElementById('flower-display').textContent = flowerStages[stage];

        this.currentQuestion++;

        // Update question counter
        const cat = SPIN_WHEEL_CATEGORIES[this.level];
        const counter = this.container.querySelector('.wheel-question-panel > div:first-child');
        if (counter) {
            counter.textContent = `${cat.name} - Question ${Math.min(this.currentQuestion + 1, this.questions.length)}/${this.questions.length}`;
        }

        setTimeout(() => {
            if (this.currentQuestion >= this.questions.length) {
                this.completeLevel();
            } else {
                // Reset for next spin
                this.answered = false;
                document.getElementById('wheel-question').textContent = 'Spin the wheel for the next question!';
                document.getElementById('wheel-answers').innerHTML = '';
            }
        }, 1500);
    },

    completeLevel() {
        const total = this.questions.length;
        document.getElementById('wheel-question').textContent =
            `Level complete! ${this.waterDrops}/${total} correct!`;
        document.getElementById('wheel-answers').innerHTML = `
            <button class="pixel-btn" onclick="app.nextLevel()" style="margin-top:10px;">
                Next Level
            </button>
        `;
    },

    cleanup() {
        this.spinning = false;
    }
};

app.registerGame('spin-wheel', SpinWheelGame);
