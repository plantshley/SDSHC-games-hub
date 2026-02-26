// ============================================
// GAME 7: ODD ONE OUT (Classification)
// Tap the item that doesn't belong
// ============================================

const OddOneOutGame = {
    container: null,
    level: 1,
    roundIndex: 0,
    correctCount: 0,
    answered: false,

    init(container, level) {
        this.container = container;
        this.level = level;
        this.roundIndex = 0;
        this.correctCount = 0;
        this.loadRound();
    },

    loadRound() {
        const levelData = ODD_ONE_OUT_LEVELS[this.level];
        if (!levelData) return;

        const round = levelData.rounds[this.roundIndex];
        if (!round) {
            // All rounds complete for this level
            app.updateScore(this.correctCount * 20);
            app.nextLevel();
            return;
        }

        this.answered = false;

        // Shuffle items
        const shuffled = [...round.items].sort(() => Math.random() - 0.5);

        this.container.innerHTML = `
            <div class="odd-one-out-game">
                <div class="odd-prompt">Tap the one that doesn't belong!</div>
                <div style="font-family:var(--font-title); font-size:0.6rem; color:var(--color-accent); opacity:0.8;">
                    ${levelData.title}
                </div>
                <div class="odd-items">
                    ${shuffled.map(item => `
                        <button class="odd-item" onclick="OddOneOutGame.selectItem(this, '${item.replace(/'/g, "\\'")}')">
                            ${item}
                        </button>
                    `).join('')}
                </div>
                <div class="odd-round-counter">
                    Round ${this.roundIndex + 1} of ${levelData.rounds.length}
                </div>
            </div>
        `;
    },

    selectItem(btn, item) {
        if (this.answered) return;
        this.answered = true;

        const levelData = ODD_ONE_OUT_LEVELS[this.level];
        const round = levelData.rounds[this.roundIndex];
        const isCorrect = item === round.answer;

        if (isCorrect) {
            btn.classList.add('correct');
            this.correctCount++;
            app.showFeedback(true);
        } else {
            btn.classList.add('wrong');
            app.showFeedback(false);

            // Highlight the correct answer
            this.container.querySelectorAll('.odd-item').forEach(el => {
                if (el.textContent.trim() === round.answer) {
                    el.classList.add('correct');
                }
            });
        }

        // Show explanation
        const explanationEl = document.createElement('div');
        explanationEl.style.cssText = `
            font-family: var(--font-body);
            font-size: 0.9rem;
            color: var(--color-accent);
            text-align: center;
            margin-top: 16px;
            padding: 12px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            animation: fadeIn 0.3s ease;
        `;
        explanationEl.textContent = round.explanation;
        this.container.querySelector('.odd-one-out-game').appendChild(explanationEl);

        // Next round after delay
        setTimeout(() => {
            this.roundIndex++;
            this.loadRound();
        }, 2000);
    },

    cleanup() {}
};

app.registerGame('odd-one-out', OddOneOutGame);
