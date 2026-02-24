/**
 * SDSHC Games Hub - Core State Machine
 * Handles screens, scaling, and inactivity timeouts for touch kiosk.
 */

// Application Constants
const INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 seconds

// Application State
let currentState = 0; // 0: Idle, 1: Grade, 2: Game, 3: Play, 4: Reward
let inactivityTimer = null;

// DOM Elements
const screens = document.querySelectorAll('.screen');
const appContainer = document.getElementById('app-container');
const btnBacks = document.querySelectorAll('.btn-back');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Show initial state
    switchState(0);

    // Bind global touch/click events to reset the inactivity timer
    document.body.addEventListener('touchstart', resetInactivityTimer, { passive: true });
    document.body.addEventListener('click', resetInactivityTimer, { passive: true });

    // Start the timer
    resetInactivityTimer();

    // Bind Idle screen "tap anywhere" to start
    document.getElementById('state-0').addEventListener('click', () => {
        if (currentState === 0) {
            switchState(1);
        }
    });

    // Bind Grade Selection buttons
    const gradeButtons = document.querySelectorAll('#state-1 .pixel-btn');
    gradeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.currentTarget.getAttribute('data-level');
            selectGradeLevel(level);
        });
    });

    // Bind Back/Exit buttons
    btnBacks.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // From Grade Select (State 1) go to Idle (State 0)
            if (currentState === 1) {
                switchState(0);
            }
            // From Game Select (State 2) go to Grade Select (State 1)
            else if (currentState === 2) {
                switchState(1);
            }
            // From Game (State 3) go to Game Select (State 2) or Grade Select (State 1)
            else if (currentState === 3) {
                switchState(1);
            }
        });
    });
}

function switchState(newState) {
    if (newState < 0 || newState > 4) return;

    currentState = newState;
    console.log(`Transitioning to State: ${currentState}`);

    // Hide all
    screens.forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });

    // Show target
    const targetScreen = document.getElementById(`state-${newState}`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('active');
    }

    // Special handlers based on target state
    if (newState === 4) {
        // Auto-return from Reward Screen to Grade Selection after 4 seconds
        setTimeout(() => {
            if (currentState === 4) switchState(1);
        }, 4000);
    }
}

function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }

    inactivityTimer = setTimeout(() => {
        console.log("Inactivity timeout reached. Resetting to Idle state.");
        // If not already in idle state, reset it
        if (currentState !== 0) {
            switchState(0);
        }
    }, INACTIVITY_TIMEOUT_MS);
}

// Data Definition for Grades & Games
const GAME_DEFINITIONS = {
    '1': {
        title: "Little Sprouts",
        games: [
            { id: "1a", name: "Soil Cake Builder", type: "Drag & Drop" },
            { id: "1b", name: "Star Helpers", type: "Tracing" }
        ]
    },
    '2': {
        title: "Earth Explorers",
        games: [
            { id: "2a", name: "Three Sisters", type: "Planting Sequence" },
            { id: "2b", name: "Spin the Wheel!", type: "Trivia & Match" }
        ]
    },
    '3': {
        title: "Agro-Heroes",
        games: [
            { id: "3a", name: "Farm Manager", type: "Strategy Scenario" },
            { id: "3b", name: "Trivia Challenge", type: "Fast-Paced Quiz" }
        ]
    }
};

function selectGradeLevel(level) {
    const data = GAME_DEFINITIONS[level];
    if (!data) return;

    // Update State 2 Title
    document.getElementById('grade-title').textContent = `${data.title} Games`;

    // Populate Game Option Buttons
    const optionsContainer = document.getElementById('game-options');
    optionsContainer.innerHTML = ''; // Clear previous

    data.games.forEach(game => {
        const btn = document.createElement('button');
        btn.className = 'pixel-btn';
        btn.innerHTML = `
            <span class="title">${game.name}</span>
            <span class="subtitle">${game.type}</span>
        `;
        btn.addEventListener('click', () => {
            launchGame(game.id);
        });
        optionsContainer.appendChild(btn);
    });

    switchState(2);
}

function launchGame(gameId) {
    console.log(`Launching Game: ${gameId}`);
    switchState(3);

    // Container for dynamic game injection
    const gameContainer = document.getElementById('game-container');

    // Call the game implementations
    if (window.Games) {
        window.Games.launch(gameId, gameContainer);
    } else {
        gameContainer.innerHTML = `<p>Error: games.js not loaded.</p>`;
    }
}

// Global helper to be called by individual games when completed
window.triggerReward = function () {
    switchState(4);
};
