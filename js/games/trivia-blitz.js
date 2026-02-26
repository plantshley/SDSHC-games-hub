// ============================================
// GAME 9: SOIL HEALTH TRIVIA BLITZ
// 60-second timed trivia rounds
// ============================================

const TriviaBlitzGame = {
    container: null,
    level: 1,
    questions: [],
    currentQuestion: 0,
    correctCount: 0,
    timeLeft: 60,
    timerInterval: null,
    answered: false,
    gameOver: false,

    init(container, level) {
        this.container = container;
        this.level = level;
        this.currentQuestion = 0;
        this.correctCount = 0;
        this.timeLeft = 60;
        this.answered = false;
        this.gameOver = false;

        if (this.timerInterval) clearInterval(this.timerInterval);

        // Get questions for this level
        const cat = TRIVIA_BLITZ_CATEGORIES[level];
        if (!cat) return;

        if (cat.key === 'bonus') {
            // Bonus round: mix all categories
            this.questions = [];
            Object.values(TRIVIA_QUESTIONS).forEach(qs => {
                this.questions.push(...qs);
            });
            this.questions = this.questions.sort(() => Math.random() - 0.5).slice(0, 15);
        } else {
            this.questions = [...(TRIVIA_QUESTIONS[cat.key] || [])].sort(() => Math.random() - 0.5);
        }

        this.render();
        this.startTimer();
        this.showQuestion();
    },

    render() {
        const cat = TRIVIA_BLITZ_CATEGORIES[this.level];
        this.container.innerHTML = `
            <div class="trivia-game">
                <div style="display:flex; align-items:center; gap:16px;">
                    <div class="trivia-timer-bar" style="flex:1;">
                        <div class="trivia-timer-fill" id="timer-fill" style="width:100%"></div>
                    </div>
                    <div class="trivia-timer-text" id="timer-text">60</div>
                </div>
                <div style="font-family:var(--font-title); font-size:0.6rem; color:var(--color-accent); text-align:center;">
                    ${cat.name}
                </div>
                <div class="trivia-question" id="trivia-question"></div>
                <div class="trivia-answers" id="trivia-answers"></div>
                <div style="text-align:center; font-family:var(--font-body); font-size:0.85rem; opacity:0.7;">
                    <span id="trivia-correct">${this.correctCount}</span> correct
                    &nbsp;|&nbsp;
                    Question <span id="trivia-q-num">1</span>/${this.questions.length}
                </div>
            </div>
        `;
    },

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            const timerText = document.getElementById('timer-text');
            const timerFill = document.getElementById('timer-fill');

            if (timerText) timerText.textContent = this.timeLeft;
            if (timerFill) timerFill.style.width = (this.timeLeft / 60 * 100) + '%';

            // Warning state under 15 seconds
            if (this.timeLeft <= 15) {
                if (timerText) timerText.classList.add('warning');
                if (timerFill) timerFill.classList.add('warning');
            }

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    },

    showQuestion() {
        if (this.gameOver) return;
        if (this.currentQuestion >= this.questions.length) {
            this.endGame();
            return;
        }

        this.answered = false;
        const q = this.questions[this.currentQuestion];
        const shuffled = [...q.options].sort(() => Math.random() - 0.5);

        document.getElementById('trivia-question').textContent = q.question;
        document.getElementById('trivia-q-num').textContent = this.currentQuestion + 1;

        document.getElementById('trivia-answers').innerHTML = shuffled.map(opt => `
            <button class="trivia-answer-btn" onclick="TriviaBlitzGame.answer(this, '${opt.replace(/'/g, "\\'")}')">
                ${opt}
            </button>
        `).join('');
    },

    answer(btn, selected) {
        if (this.answered || this.gameOver) return;
        this.answered = true;

        const q = this.questions[this.currentQuestion];
        const isCorrect = selected === q.answer;

        if (isCorrect) {
            btn.classList.add('correct');
            this.correctCount++;
            app.updateScore(10);
            document.getElementById('trivia-correct').textContent = this.correctCount;
        } else {
            btn.classList.add('wrong');
            // Highlight correct
            this.container.querySelectorAll('.trivia-answer-btn').forEach(b => {
                if (b.textContent.trim() === q.answer) b.classList.add('correct');
            });
        }

        this.currentQuestion++;

        setTimeout(() => {
            this.showQuestion();
        }, 800);
    },

    endGame() {
        this.gameOver = true;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const total = Math.min(this.currentQuestion, this.questions.length);
        const pct = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;

        this.container.innerHTML = `
            <div class="trivia-game" style="justify-content:center; align-items:center;">
                <div class="trivia-score-summary">
                    <div style="font-size:3rem; margin-bottom:16px;">
                        ${pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '🌱'}
                    </div>
                    <div class="trivia-score-big">${this.correctCount}/${total}</div>
                    <p style="font-family:var(--font-body); font-size:1rem; margin-top:8px; opacity:0.8;">
                        ${pct >= 80 ? 'Amazing! You\'re a soil health expert!' :
                          pct >= 50 ? 'Great job! Keep learning!' :
                          'Good try! Practice makes perfect!'}
                    </p>
                    <p style="font-family:var(--font-body); font-size:0.85rem; margin-top:4px; opacity:0.6;">
                        ${pct}% correct
                    </p>
                    <div style="display:flex; gap:16px; margin-top:24px; justify-content:center;">
                        <button class="pixel-btn" onclick="TriviaBlitzGame.init(TriviaBlitzGame.container, TriviaBlitzGame.level)">
                            Try Again
                        </button>
                        <button class="pixel-btn" onclick="app.nextLevel()">
                            ${this.level < Object.keys(TRIVIA_BLITZ_CATEGORIES).length ? 'Next Level' : 'Finish'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    cleanup() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.gameOver = true;
    }
};

app.registerGame('trivia-blitz', TriviaBlitzGame);
