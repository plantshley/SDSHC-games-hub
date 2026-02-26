// ============================================
// GAME 5: THREE SISTERS GARDEN (Planting Sim)
// Interactive planting with clues and matching
// ============================================

const ThreeSistersGame = {
    container: null,
    level: 1,
    clueIndex: 0,
    plantedItems: [],
    answered: false,

    init(container, level) {
        this.container = container;
        this.level = level;
        this.clueIndex = 0;
        this.plantedItems = [];
        this.answered = false;

        const levelData = THREE_SISTERS_LEVELS[level];
        if (!levelData) return;

        if (level <= 2) {
            this.renderClueLevel(levelData);
        } else if (level === 3) {
            this.renderBloomLevel(levelData);
        } else if (level === 4) {
            this.renderMatchLevel(levelData);
        } else if (level === 5) {
            this.renderIndigenousLevel(levelData);
        }
    },

    // Level 1 & 2: Clue-based planting
    renderClueLevel(levelData) {
        const clue = levelData.clues[this.clueIndex];
        if (!clue) {
            // Check for bonus round
            if (levelData.bonusRound && this.clueIndex === levelData.clues.length) {
                this.renderBonusRound(levelData.bonusRound);
                return;
            }
            app.nextLevel();
            return;
        }

        this.answered = false;
        const shuffled = [...clue.options].sort(() => Math.random() - 0.5);

        this.container.innerHTML = `
            <div class="garden-game">
                <div class="garden-sidebar">
                    <div class="garden-clue">${clue.text}</div>
                    ${shuffled.map(opt => `
                        <button class="plant-option" onclick="ThreeSistersGame.selectPlant(this, '${opt}')">
                            ${opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                    `).join('')}
                    <div style="font-family:var(--font-body); font-size:0.75rem; opacity:0.6; margin-top:auto;">
                        ${this.clueIndex + 1} of ${levelData.clues.length}
                    </div>
                </div>
                <div class="garden-bed">
                    <div class="garden-plot" id="garden-plot">
                        ${this.plantedItems.map(item => `
                            <div class="plant-slot filled">
                                <div style="text-align:center;">
                                    <div style="font-size:2rem;">${this.getPlantEmoji(item)}</div>
                                    <div style="font-size:0.7rem; font-family:var(--font-body);">${item}</div>
                                </div>
                            </div>
                        `).join('')}
                        <div class="plant-slot" id="current-slot">
                            <span style="font-size:2rem; opacity:0.3;">?</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    selectPlant(btn, plant) {
        if (this.answered) return;
        this.answered = true;

        const levelData = THREE_SISTERS_LEVELS[this.level];
        const clue = levelData.clues[this.clueIndex];
        const isCorrect = plant === clue.answer;

        if (isCorrect) {
            btn.classList.add('correct');
            this.plantedItems.push(plant);
            app.updateScore(20);
            app.showFeedback(true);

            // Show the plant in the slot
            const slot = document.getElementById('current-slot');
            if (slot) {
                slot.classList.add('filled');
                slot.innerHTML = `
                    <div style="text-align:center; animation:fadeIn 0.5s ease;">
                        <div style="font-size:2rem;">${this.getPlantEmoji(plant)}</div>
                        <div style="font-size:0.7rem; font-family:var(--font-body);">${plant}</div>
                    </div>
                `;
            }

            // Show fact if available
            if (clue.fact) {
                const factEl = document.createElement('div');
                factEl.style.cssText = 'padding:12px; background:rgba(76,175,80,0.2); border-radius:8px; font-family:var(--font-body); font-size:0.85rem; margin-top:8px; animation:fadeIn 0.5s ease;';
                factEl.textContent = clue.fact;
                this.container.querySelector('.garden-sidebar').appendChild(factEl);
            }
        } else {
            btn.classList.add('wrong');
            app.showFeedback(false);
            // Show correct
            this.container.querySelectorAll('.plant-option').forEach(b => {
                if (b.textContent.trim().toLowerCase() === clue.answer) b.classList.add('correct');
            });
        }

        setTimeout(() => {
            this.clueIndex++;
            this.renderClueLevel(levelData);
        }, 2000);
    },

    // Level 1 bonus: Match Cherokee names
    renderBonusRound(bonusData) {
        this.answered = false;
        let pairsLeft = [...bonusData.pairs];
        let currentPair = 0;

        const renderPair = () => {
            if (currentPair >= bonusData.pairs.length) {
                setTimeout(() => app.nextLevel(), 1000);
                return;
            }

            const pair = bonusData.pairs[currentPair];
            const options = bonusData.pairs.map(p => p.english).sort(() => Math.random() - 0.5);

            this.container.innerHTML = `
                <div class="garden-game" style="align-items:center; justify-content:center;">
                    <div style="text-align:center;">
                        <div style="font-family:var(--font-title); font-size:0.7rem; color:var(--color-accent); margin-bottom:16px;">
                            ${bonusData.instruction}
                        </div>
                        <div style="font-family:var(--font-title); font-size:1.5rem; color:#fff; margin-bottom:24px;">
                            "${pair.cherokee}"
                        </div>
                        <div style="display:flex; gap:16px; justify-content:center;">
                            ${options.map(opt => `
                                <button class="plant-option" style="min-width:120px;"
                                    onclick="ThreeSistersGame.answerBonus(this, '${opt}', '${pair.english}', ${currentPair})">
                                    ${opt}
                                </button>
                            `).join('')}
                        </div>
                        <div style="font-size:0.8rem; opacity:0.6; margin-top:16px;">
                            ${currentPair + 1} of ${bonusData.pairs.length}
                        </div>
                    </div>
                </div>
            `;
        };

        this.answerBonus = (btn, selected, correct, idx) => {
            if (this.answered) return;
            this.answered = true;

            if (selected === correct) {
                btn.classList.add('correct');
                app.updateScore(10);
            } else {
                btn.classList.add('wrong');
                this.container.querySelectorAll('.plant-option').forEach(b => {
                    if (b.textContent.trim() === correct) b.classList.add('correct');
                });
            }

            setTimeout(() => {
                currentPair++;
                this.answered = false;
                renderPair();
            }, 1200);
        };

        renderPair();
    },

    // Level 3: Year in Bloom - plant flowers in month order
    renderBloomLevel(levelData) {
        const shuffled = [...levelData.flowers].sort(() => Math.random() - 0.5);
        let placed = [];

        this.container.innerHTML = `
            <div class="garden-game">
                <div class="garden-sidebar">
                    <div class="garden-clue">${levelData.instruction}</div>
                    <div id="bloom-options">
                        ${shuffled.map(f => `
                            <button class="plant-option" data-name="${f.name}"
                                style="border-left:4px solid ${f.color};"
                                onclick="ThreeSistersGame.placeFlower(this, '${f.name}')">
                                ${f.name}<br><span style="font-size:0.7rem; opacity:0.7;">${f.month}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="garden-bed" style="background:linear-gradient(to bottom, #87ceeb 0%, #87ceeb 60%, #5a8a3c 60%);">
                    <div id="bloom-timeline" style="display:flex; gap:8px; align-items:flex-end; margin-bottom:40px; min-height:200px;">
                    </div>
                    <div style="display:flex; gap:8px; font-family:var(--font-body); font-size:0.65rem; opacity:0.6;">
                        <span>Apr</span><span>May</span><span>Jun</span><span>Jul-Aug</span><span>Sep</span><span>Oct</span>
                    </div>
                </div>
            </div>
        `;

        this.placeFlower = (btn, name) => {
            placed.push(name);
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';

            const flower = levelData.flowers.find(f => f.name === name);
            const timeline = document.getElementById('bloom-timeline');
            const flowerEl = document.createElement('div');
            flowerEl.style.cssText = `
                width:60px; text-align:center; animation:fadeIn 0.5s ease;
            `;
            flowerEl.innerHTML = `
                <div style="width:40px; height:40px; border-radius:50%; background:${flower.color}; margin:0 auto 4px;"></div>
                <div style="font-size:0.55rem; font-family:var(--font-body);">${flower.name.split(' ')[0]}</div>
            `;
            timeline.appendChild(flowerEl);

            if (placed.length === levelData.flowers.length) {
                // Check order
                const correctOrder = levelData.flowers.map(f => f.name);
                const isCorrect = JSON.stringify(placed) === JSON.stringify(correctOrder);

                if (isCorrect) {
                    app.updateScore(60);
                    app.showFeedback(true);
                } else {
                    app.showFeedback(false);
                }
                setTimeout(() => app.nextLevel(), 2000);
            }
        };
    },

    // Level 4: Match cover crops to benefits
    renderMatchLevel(levelData) {
        const shuffledCrops = [...levelData.crops].sort(() => Math.random() - 0.5);
        const shuffledBenefits = [...levelData.crops].sort(() => Math.random() - 0.5);
        let selectedCrop = null;
        let matchedCount = 0;

        this.container.innerHTML = `
            <div style="display:flex; height:100%; padding:20px; gap:20px;">
                <div style="flex:1; display:flex; flex-direction:column; gap:10px;">
                    <div style="font-family:var(--font-title); font-size:0.6rem; color:var(--color-accent); text-align:center;">Crops</div>
                    ${shuffledCrops.map(c => `
                        <button class="plant-option crop-match" data-crop="${c.name}" onclick="ThreeSistersGame.selectCrop(this, '${c.name}')">
                            ${c.icon} ${c.name}
                        </button>
                    `).join('')}
                </div>
                <div style="flex:1; display:flex; flex-direction:column; gap:10px;">
                    <div style="font-family:var(--font-title); font-size:0.6rem; color:var(--color-accent); text-align:center;">Benefits</div>
                    ${shuffledBenefits.map(c => `
                        <button class="plant-option benefit-match" data-benefit="${c.name}" onclick="ThreeSistersGame.selectBenefit(this, '${c.name}')">
                            ${c.benefit}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        this._selectedCrop = null;
        this._matchedCount = 0;
        this._totalCrops = levelData.crops.length;
    },

    selectCrop(btn, name) {
        // Deselect previous
        this.container.querySelectorAll('.crop-match').forEach(b => b.style.borderColor = 'rgba(255,255,255,0.2)');
        btn.style.borderColor = 'var(--color-accent)';
        this._selectedCrop = name;
    },

    selectBenefit(btn, benefitCropName) {
        if (!this._selectedCrop) return;

        if (this._selectedCrop === benefitCropName) {
            // Correct match
            btn.classList.add('correct');
            const cropBtn = this.container.querySelector(`[data-crop="${this._selectedCrop}"]`);
            if (cropBtn) {
                cropBtn.classList.add('correct');
                cropBtn.style.pointerEvents = 'none';
            }
            btn.style.pointerEvents = 'none';
            this._matchedCount++;
            app.updateScore(10);

            if (this._matchedCount >= this._totalCrops) {
                app.showFeedback(true);
                setTimeout(() => app.nextLevel(), 1500);
            }
        } else {
            btn.classList.add('wrong');
            setTimeout(() => btn.classList.remove('wrong'), 500);
        }
        this._selectedCrop = null;
        this.container.querySelectorAll('.crop-match').forEach(b => b.style.borderColor = 'rgba(255,255,255,0.2)');
    },

    // Level 5: Indigenous farming - match practice to region
    renderIndigenousLevel(levelData) {
        const shuffledPractices = [...levelData.practices].sort(() => Math.random() - 0.5);
        const shuffledRegions = [...levelData.practices].sort(() => Math.random() - 0.5);

        this.container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; padding:20px; gap:16px;">
                <div style="font-family:var(--font-title); font-size:0.7rem; color:var(--color-accent); text-align:center;">
                    ${levelData.instruction}
                </div>
                <div style="display:flex; flex:1; gap:20px;">
                    <div style="flex:1; display:flex; flex-direction:column; gap:8px; overflow-y:auto;">
                        <div style="font-family:var(--font-title); font-size:0.55rem; color:var(--color-accent); text-align:center;">Practices</div>
                        ${shuffledPractices.map(p => `
                            <button class="plant-option practice-pick" data-practice="${p.name}"
                                onclick="ThreeSistersGame.pickPractice(this, '${p.name}')">
                                ${p.icon} ${p.name}<br>
                                <span style="font-size:0.7rem; opacity:0.7;">${p.desc}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:8px; overflow-y:auto;">
                        <div style="font-family:var(--font-title); font-size:0.55rem; color:var(--color-accent); text-align:center;">Regions</div>
                        ${shuffledRegions.map(p => `
                            <button class="plant-option region-pick" data-region="${p.name}"
                                onclick="ThreeSistersGame.pickRegion(this, '${p.name}')">
                                ${p.region}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this._selectedPractice = null;
        this._indigenousMatched = 0;
        this._indigenousTotal = levelData.practices.length;
    },

    pickPractice(btn, name) {
        this.container.querySelectorAll('.practice-pick').forEach(b => b.style.borderColor = 'rgba(255,255,255,0.2)');
        btn.style.borderColor = 'var(--color-accent)';
        this._selectedPractice = name;
    },

    pickRegion(btn, regionPracticeName) {
        if (!this._selectedPractice) return;

        if (this._selectedPractice === regionPracticeName) {
            btn.classList.add('correct');
            const practiceBtn = this.container.querySelector(`[data-practice="${this._selectedPractice}"]`);
            if (practiceBtn) {
                practiceBtn.classList.add('correct');
                practiceBtn.style.pointerEvents = 'none';
            }
            btn.style.pointerEvents = 'none';
            this._indigenousMatched++;
            app.updateScore(15);

            if (this._indigenousMatched >= this._indigenousTotal) {
                app.showFeedback(true);
                setTimeout(() => app.nextLevel(), 1500);
            }
        } else {
            btn.classList.add('wrong');
            setTimeout(() => btn.classList.remove('wrong'), 500);
        }
        this._selectedPractice = null;
        this.container.querySelectorAll('.practice-pick').forEach(b => b.style.borderColor = 'rgba(255,255,255,0.2)');
    },

    getPlantEmoji(plant) {
        const emojis = {
            corn: '🌽', beans: '🫘', squash: '🎃',
            'short-flowers': '🌸', 'medium-flowers': '🌼', 'tall-flowers': '🌻',
            'tall-grass': '🌾', 'puddling-area': '💧', 'flat-stones': '🪨'
        };
        return emojis[plant] || '🌱';
    },

    cleanup() {}
};

app.registerGame('three-sisters', ThreeSistersGame);
