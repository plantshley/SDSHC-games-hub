// ============================================
// GAME 8: FARM MANAGER SIMULATOR
// Select correct conservation practice for each scenario
// ============================================

const FarmManagerGame = {
    container: null,
    level: 1,
    answered: false,

    init(container, level) {
        this.container = container;
        this.level = level;
        this.answered = false;
        this.render();
    },

    render() {
        const levelData = FARM_MANAGER_LEVELS[this.level];
        if (!levelData) return;

        // Shuffle practices
        const shuffled = [...levelData.practices].sort(() => Math.random() - 0.5);

        this.container.innerHTML = `
            <div class="farm-manager-game">
                <div style="font-family:var(--font-title); font-size:0.6rem; color:var(--color-accent); opacity:0.8;">
                    Scenario ${this.level} of ${Object.keys(FARM_MANAGER_LEVELS).length}
                </div>
                <div class="scenario-panel">
                    <div class="scenario-text">${levelData.scenario}</div>
                </div>
                <div style="font-family:var(--font-body); font-size:0.9rem; margin-top:8px; opacity:0.8;">
                    Which conservation practice solves this problem?
                </div>
                <div class="practice-options">
                    ${shuffled.map(p => `
                        <div class="practice-card" onclick="FarmManagerGame.selectPractice(this, '${p.id}')" data-id="${p.id}">
                            <div class="practice-card-title">${p.name}</div>
                            <div class="practice-card-desc">${p.desc}</div>
                        </div>
                    `).join('')}
                </div>
                <div id="farm-result" style="min-height:80px; display:flex; align-items:center; justify-content:center;"></div>
            </div>
        `;
    },

    selectPractice(card, practiceId) {
        if (this.answered) return;
        this.answered = true;

        const levelData = FARM_MANAGER_LEVELS[this.level];
        const isCorrect = practiceId === levelData.correctPractice;

        if (isCorrect) {
            card.classList.add('correct');
            app.updateScore(50);
            app.showFeedback(true);

            // Show success text with before/after
            document.getElementById('farm-result').innerHTML = `
                <div style="text-align:center; animation:fadeIn 0.5s ease;">
                    <div style="font-size:2rem; margin-bottom:8px;">
                        🏜️ → 🌿
                    </div>
                    <div style="font-family:var(--font-body); font-size:0.9rem; color:var(--color-success); line-height:1.5;">
                        ${levelData.successText}
                    </div>
                </div>
            `;
        } else {
            card.classList.add('wrong');
            app.showFeedback(false);

            // Highlight correct answer
            this.container.querySelectorAll('.practice-card').forEach(c => {
                if (c.dataset.id === levelData.correctPractice) {
                    c.classList.add('correct');
                }
            });

            document.getElementById('farm-result').innerHTML = `
                <div style="text-align:center; animation:fadeIn 0.5s ease;">
                    <div style="font-family:var(--font-body); font-size:0.9rem; color:var(--color-accent); line-height:1.5;">
                        The correct answer was: <strong>${levelData.practices.find(p => p.id === levelData.correctPractice).name}</strong>
                    </div>
                </div>
            `;
        }

        // Next level button
        setTimeout(() => {
            const resultEl = document.getElementById('farm-result');
            if (resultEl) {
                const btn = document.createElement('button');
                btn.className = 'pixel-btn';
                btn.style.marginTop = '12px';
                btn.textContent = this.level < Object.keys(FARM_MANAGER_LEVELS).length ? 'Next Scenario' : 'Finish';
                btn.onclick = () => app.nextLevel();
                resultEl.appendChild(btn);
            }
        }, 1000);
    },

    cleanup() {}
};

app.registerGame('farm-manager', FarmManagerGame);
