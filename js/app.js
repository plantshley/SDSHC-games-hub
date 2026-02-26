// ============================================
// SDSHC Games Hub - Main Application
// Router, grade select, idle timer, shared state
// ============================================

const app = {
    currentTier: null,
    currentGame: null,
    currentLevel: 1,
    score: 0,
    idleTimeout: null,
    idleWarningTimeout: null,
    idleCountdownInterval: null,
    IDLE_TIME: 120000,      // 120 seconds
    WARNING_TIME: 10000,    // 10 second warning
    gameModules: {},

    // ---- Initialization ----
    init() {
        this.setupIdleDetection();
        this.preloadAssets();
        this.showScreen('screen-home');
    },

    // ---- Screen Management ----
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active', 'fade-in');
        });
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active', 'fade-in');
        }
    },

    // ---- Grade Tier Selection ----
    selectTier(tier) {
        this.currentTier = tier;
        this.resetIdleTimer();

        const titleEl = document.getElementById('tier-title');
        titleEl.textContent = TIER_NAMES[tier] || tier;

        // Set tier color accent
        const colors = { sprouts: '#66bb6a', explorers: '#42a5f5', heroes: '#ab47bc' };
        document.documentElement.style.setProperty('--color-tier', colors[tier] || '#f4d03f');

        this.renderGameGrid(tier);
        this.showScreen('screen-select');
    },

    renderGameGrid(tier) {
        const grid = document.getElementById('game-grid');
        const games = GAME_REGISTRY[tier] || [];

        grid.innerHTML = games.map(game => `
            <div class="game-card" onclick="app.startGame('${game.id}')" data-game="${game.id}">
                <span class="game-card-icon">${game.icon}</span>
                <div class="game-card-title">${game.title}</div>
                <div class="game-card-levels">${game.levels} ${game.levels === 1 ? 'level' : 'levels'}</div>
            </div>
        `).join('');
    },

    // ---- Game Management ----
    startGame(gameId, level = 1) {
        this.currentGame = gameId;
        this.currentLevel = level;
        this.score = 0;
        this.resetIdleTimer();

        const tier = this.currentTier;
        const games = GAME_REGISTRY[tier] || [];
        const game = games.find(g => g.id === gameId);

        if (!game) return;

        document.getElementById('game-title-bar').textContent = game.title;
        this.updateLevelIndicator();
        this.updateScore(0);

        this.showScreen('screen-game');
        this.loadGame(gameId, level);
    },

    loadGame(gameId, level) {
        const container = document.getElementById('game-container');
        container.innerHTML = '';

        // Check if game module is loaded
        if (this.gameModules[gameId]) {
            this.gameModules[gameId].init(container, level, this.currentTier);
        } else {
            container.innerHTML = `
                <div class="flex-center" style="height:100%; flex-direction:column; gap:20px;">
                    <span style="font-size:4rem;">${this.getGameIcon(gameId)}</span>
                    <p style="font-family:var(--font-title); font-size:0.8rem; color:var(--color-accent); text-align:center;">
                        ${this.getGameTitle(gameId)}
                    </p>
                    <p style="font-family:var(--font-body); font-size:0.9rem; opacity:0.7; text-align:center;">
                        Coming soon!
                    </p>
                </div>
            `;
        }
    },

    getGameIcon(gameId) {
        const allGames = [...(GAME_REGISTRY.sprouts || []), ...(GAME_REGISTRY.explorers || []), ...(GAME_REGISTRY.heroes || [])];
        const game = allGames.find(g => g.id === gameId);
        return game ? game.icon : '🎮';
    },

    getGameTitle(gameId) {
        const allGames = [...(GAME_REGISTRY.sprouts || []), ...(GAME_REGISTRY.explorers || []), ...(GAME_REGISTRY.heroes || [])];
        const game = allGames.find(g => g.id === gameId);
        return game ? game.title : gameId;
    },

    getMaxLevels(gameId) {
        const games = GAME_REGISTRY[this.currentTier] || [];
        const game = games.find(g => g.id === gameId);
        return game ? game.levels : 1;
    },

    // ---- Level Progression ----
    updateLevelIndicator() {
        const maxLevels = this.getMaxLevels(this.currentGame);
        document.getElementById('level-indicator').textContent =
            maxLevels > 1 ? `Level ${this.currentLevel} / ${maxLevels}` : '';
    },

    nextLevel() {
        const maxLevels = this.getMaxLevels(this.currentGame);
        if (this.currentLevel < maxLevels) {
            this.currentLevel++;
            this.updateLevelIndicator();
            this.loadGame(this.currentGame, this.currentLevel);
        } else {
            this.showCompletion();
        }
    },

    // ---- Score ----
    updateScore(points) {
        this.score += points;
        document.getElementById('score-display').textContent = this.score;
    },

    setScore(total) {
        this.score = total;
        document.getElementById('score-display').textContent = this.score;
    },

    // ---- Completion Screen ----
    showCompletion() {
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="completion-screen">
                <img src="assets/sprites/ui_board-trophy.png" class="trophy" alt="Trophy">
                <h2>Amazing Job!</h2>
                <p>You completed all levels of ${this.getGameTitle(this.currentGame)}!</p>
                <p style="font-family:var(--font-title); font-size:1.2rem; color:var(--color-accent); margin-top:10px;">
                    Score: ${this.score}
                </p>
                <div style="display:flex; gap:16px; margin-top:20px;">
                    <button class="pixel-btn" onclick="app.startGame('${this.currentGame}')">Play Again</button>
                    <button class="pixel-btn" onclick="app.backToSelect()">More Games</button>
                </div>
            </div>
        `;
    },

    // ---- Feedback ----
    showFeedback(correct, container) {
        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay';
        const img = document.createElement('img');
        img.className = 'feedback-icon';
        img.src = correct
            ? 'assets/sprites/ui_board-check.png'
            : 'assets/sprites/ui_board-cancel.png';
        overlay.appendChild(img);
        (container || document.getElementById('game-container')).appendChild(overlay);

        setTimeout(() => overlay.remove(), 800);
    },

    // ---- Navigation ----
    goHome() {
        this.currentTier = null;
        this.currentGame = null;
        this.cleanupCurrentGame();
        this.showScreen('screen-home');
        this.resetIdleTimer();
    },

    backToSelect() {
        this.currentGame = null;
        this.cleanupCurrentGame();
        this.showScreen('screen-select');
        this.resetIdleTimer();
    },

    cleanupCurrentGame() {
        if (this.currentGame && this.gameModules[this.currentGame] && this.gameModules[this.currentGame].cleanup) {
            this.gameModules[this.currentGame].cleanup();
        }
        const container = document.getElementById('game-container');
        if (container) container.innerHTML = '';
    },

    // ---- Idle Detection ----
    setupIdleDetection() {
        const events = ['pointerdown', 'pointermove', 'pointerup', 'keydown'];
        events.forEach(evt => {
            document.addEventListener(evt, () => this.resetIdleTimer(), { passive: true });
        });
        this.resetIdleTimer();
    },

    resetIdleTimer() {
        // Hide warning if visible
        const warning = document.getElementById('idle-warning');
        if (warning) warning.classList.add('hidden');

        // Clear all timers
        clearTimeout(this.idleTimeout);
        clearTimeout(this.idleWarningTimeout);
        clearInterval(this.idleCountdownInterval);

        // Only set idle timer if not on home screen
        const homeScreen = document.getElementById('screen-home');
        if (homeScreen && homeScreen.classList.contains('active')) return;

        // Set new idle timer
        this.idleTimeout = setTimeout(() => {
            this.showIdleWarning();
        }, this.IDLE_TIME - this.WARNING_TIME);
    },

    showIdleWarning() {
        const warning = document.getElementById('idle-warning');
        if (!warning) return;

        warning.classList.remove('hidden');
        let countdown = Math.floor(this.WARNING_TIME / 1000);
        const countdownEl = document.getElementById('idle-countdown');
        if (countdownEl) countdownEl.textContent = countdown;

        this.idleCountdownInterval = setInterval(() => {
            countdown--;
            if (countdownEl) countdownEl.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(this.idleCountdownInterval);
                this.goHome();
            }
        }, 1000);
    },

    // ---- Register Game Module ----
    registerGame(id, module) {
        this.gameModules[id] = module;
    },

    // ---- Asset Preloading ----
    preloadAssets() {
        const criticalAssets = [
            'assets/sprites/Basic_Charakter_wave.png',
            'assets/sprites/speech_bubble_grey_L.png',
            'assets/sprites/Menu_board_L.png',
            'assets/sprites/ui_board-home.png',
            'assets/sprites/ui_board-star.png',
            'assets/sprites/ui_board-trophy.png',
            'assets/sprites/ui_board-check.png',
            'assets/sprites/ui_board-cancel.png',
            'assets/sprites/ui_board-question.png',
            'assets/sprites/Free_Chicken_Sprites_1.png',
            'assets/sprites/Free_Cow_Sprites_1.png'
        ];
        criticalAssets.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
};

// ---- Start the app ----
document.addEventListener('DOMContentLoaded', () => app.init());
