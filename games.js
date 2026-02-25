/**
 * SDSHC Games Hub - Game Implementations
 */
window.Games = {
    launch: function (gameId, container) {
        container.innerHTML = ''; // Clear container
        switch (gameId) {
            case '1a':
            case '1a_optA':
                this.initGame1A_OptionA(container);
                break;
            case '1a_optC':
                this.initGame1A_OptionC(container);
                break;
            case '1b':
                this.initGame1B(container);
                break;
            case '2a':
                this.initGame2A(container);
                break;
            case '2b':
                this.initGame2B(container);
                break;
            case '3a':
                this.initGame3A(container);
                break;
            case '3b':
                this.initGame3B(container);
                break;
            default:
                container.innerHTML = `<p>Game ${gameId} not implemented yet.</p>`;
        }
    },

    // ==========================================
    // LEVEL 1: Little Sprouts (Pre-K to 2nd)
    // ==========================================

    // Game 1A (Option A): Drag & Drop "Snap-to-Grid"
    initGame1A_OptionA: function (container) {
        container.innerHTML = `
            <div id="game-1a">
                <h2>Build a Soil Cake! (Opt A)</h2>
                <div class="cake-area">
                    <div class="draggables">
                        <div class="layer-drag" draggable="true" data-layer="4" style="background-color: #3e2723;">O Horizon<br><small>Frosting</small></div>
                        <div class="layer-drag" draggable="true" data-layer="3" style="background-color: #4e342e;">A Horizon<br><small>Dark Cake</small></div>
                        <div class="layer-drag" draggable="true" data-layer="2" style="background-color: #5d4037;">B Horizon<br><small>Fudge</small></div>
                        <div class="layer-drag" draggable="true" data-layer="1" style="background-color: #795548;">C Horizon<br><small>Marble</small></div>
                    </div>
                    <div class="plate-area">
                        <div class="plate" id="cake-plate">
                            <span>Drop Layers Here<br>(Bottom to Top!)</span>
                        </div>
                    </div>
                </div>
                <div id="worm-cheer" class="hidden">🪱 YAY! You built the soil!</div>
            </div>
            <style>
                #game-1a { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 20px; }
                #game-1a h2 { color: var(--dark-text); font-size: 2.5rem; text-shadow: none; margin-bottom: 20px; }
                .cake-area { display: flex; width: 100%; justify-content: space-around; align-items: flex-end; flex-grow: 1; }
                .draggables { display: flex; flex-direction: column; gap: 15px; }
                .layer-drag {
                    width: 250px; padding: 20px; text-align: center; color: white;
                    border: 4px solid var(--dark-text); cursor: grab; font-size: 1.5rem;
                }
                .layer-drag:active { cursor: grabbing; }
                .plate-area { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
                .plate {
                    width: 350px; height: 350px; border: 8px dashed var(--secondary-color);
                    display: flex; flex-direction: column-reverse; /* Stack from bottom */
                    align-items: center; justify-content: flex-start; padding: 10px; gap: 5px;
                }
                .stacked-layer { width: 100%; padding: 25px; text-align: center; color: white; border: 4px solid var(--dark-text); font-size: 1.5rem; }
                #worm-cheer { font-size: 3rem; color: #4CAF50; margin-top: 20px; animation: bounce 1s infinite; }
                .hidden { display: none !important; }
            </style>
        `;

        let expectedLayer = 1; // Start from bottom (C horizon = 1)
        const plate = document.getElementById('cake-plate');
        const draggables = document.querySelectorAll('.layer-drag');

        // Note: For pure touchscreen on kiosks, HTML5 drag-and-drop is often flaky.
        // We will implement manual touch-based dragging to be safe.
        let draggedItem = null;
        let startX, startY, initialX, initialY;

        draggables.forEach(item => {
            item.addEventListener('touchstart', handleTouchStart, { passive: false });
            item.addEventListener('touchmove', handleTouchMove, { passive: false });
            item.addEventListener('touchend', handleTouchEnd, { passive: false });
            // Mouse fallbacks for testing
            item.addEventListener('mousedown', handleMouseDown);
        });

        function handleTouchStart(e) { e.preventDefault(); startDrag(e.touches[0], e.target); }
        function handleTouchMove(e) { e.preventDefault(); doDrag(e.touches[0]); }
        function handleTouchEnd(e) { e.preventDefault(); stopDrag(e.changedTouches[0]); }

        function handleMouseDown(e) {
            startDrag(e, e.target);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        function handleMouseMove(e) { doDrag(e); }
        function handleMouseUp(e) {
            stopDrag(e);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        function startDrag(pos, target) {
            // Traverse up to find .layer-drag if child was clicked
            while (target && !target.classList.contains('layer-drag')) { target = target.parentElement; }
            if (!target) return;

            draggedItem = target;
            const rect = draggedItem.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            startX = pos.clientX;
            startY = pos.clientY;

            draggedItem.style.position = 'fixed';
            draggedItem.style.zIndex = 1000;
            draggedItem.style.left = initialX + 'px';
            draggedItem.style.top = initialY + 'px';
        }

        function doDrag(pos) {
            if (!draggedItem) return;
            const dx = pos.clientX - startX;
            const dy = pos.clientY - startY;
            draggedItem.style.left = (initialX + dx) + 'px';
            draggedItem.style.top = (initialY + dy) + 'px';
        }

        function stopDrag(pos) {
            if (!draggedItem) return;

            // Revert styles
            draggedItem.style.position = '';
            draggedItem.style.zIndex = '';
            draggedItem.style.left = '';
            draggedItem.style.top = '';

            // Check drop target (plate)
            const plateRect = plate.getBoundingClientRect();
            const droppedOnPlate = (
                pos.clientX >= plateRect.left && pos.clientX <= plateRect.right &&
                pos.clientY >= plateRect.top && pos.clientY <= plateRect.bottom
            );

            if (droppedOnPlate) {
                const layerType = parseInt(draggedItem.getAttribute('data-layer'));
                if (layerType === expectedLayer) {
                    // Success! Added to plate.
                    const stacked = document.createElement('div');
                    stacked.className = 'stacked-layer';
                    stacked.style.backgroundColor = draggedItem.style.backgroundColor;
                    stacked.innerHTML = draggedItem.innerHTML;

                    // Remove initial text if it's the first
                    if (expectedLayer === 1) plate.innerHTML = '';

                    plate.appendChild(stacked); // appends at bottom visually due to column-reverse
                    draggedItem.remove(); // remove it from choices

                    // Ding sound
                    playDing();

                    expectedLayer++;
                    if (expectedLayer > 4) {
                        // Game Over!
                        document.getElementById('worm-cheer').classList.remove('hidden');
                        setTimeout(() => window.triggerReward(), 3000);
                    }
                } else {
                    // Wrong layer! Snap back to sidebar with a shake!
                    const dx = pos.clientX - startX;
                    const dy = pos.clientY - startY;
                    draggedItem.style.transition = 'transform 0.3s ease';
                    draggedItem.style.transform = `translate(${-dx}px, ${-dy}px)`;

                    setTimeout(() => {
                        if (draggedItem) {
                            draggedItem.style.transition = '';
                            draggedItem.style.transform = '';
                        }
                    }, 300);
                }
            } else {
                // Dropped outside. Snap back!
                const dx = pos.clientX - startX;
                const dy = pos.clientY - startY;
                draggedItem.style.transition = 'transform 0.3s ease';
                draggedItem.style.transform = `translate(${-dx}px, ${-dy}px)`;

                setTimeout(() => {
                    if (draggedItem) {
                        draggedItem.style.transition = '';
                        draggedItem.style.transform = '';
                    }
                }, 300);
            }
            draggedItem = null;
        }
    },

    // Game 1A (Option C): "The Conveyor Belt"
    initGame1A_OptionC: function (container) {
        container.innerHTML = `
            <div id="game-1a-optC">
                <h2>Tap the Soil on the Conveyor!</h2>
                <div id="instruction-optC">I need the <span style="color:var(--accent-color)">C Horizon (Marble)</span>!</div>
                
                <div class="conveyor-container">
                    <div id="conveyor-belt"></div>
                </div>

                <div class="plate-area-optC">
                    <div class="plate-optC" id="plate-target-optC">
                        <!-- Items fall here -->
                    </div>
                </div>
                <div id="worm-cheer-optC" class="hidden">🪱 Delicious Soil!</div>
            </div>
            <style>
                #game-1a-optC { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 20px; }
                #game-1a-optC h2 { color: var(--dark-text); font-size: 2.5rem; margin-bottom: 20px; text-shadow:none; }
                #instruction-optC { font-size: 2rem; margin-bottom: 30px; text-align:center;}
                .conveyor-container { 
                    width: 100%; height: 150px; background-color: #424242; border: 8px solid #212121; 
                    position: relative; overflow: hidden; margin-bottom: 50px;
                }
                .conveyor-container::after {
                    content: ''; position: absolute; bottom: 0; width: 200%; height: 10px;
                    background: repeating-linear-gradient(45deg, #000, #000 10px, #ffeb3b 10px, #ffeb3b 20px);
                    animation: moveBelt 2s linear infinite;
                }
                @keyframes moveBelt { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .belt-item {
                    width: 150px; height: 100px; position: absolute; top: 15px; color: white;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    border: 4px solid var(--dark-text); cursor: pointer; text-align:center; font-size: 1.2rem;
                    box-shadow: var(--pixel-shadow); transition: transform 0.1s;
                }
                .belt-item:active { transform: scale(0.9); }
                .plate-area-optC { flex-grow: 1; display: flex; align-items: flex-end; padding-bottom: 20px;}
                .plate-optC {
                    width: 350px; height: 250px; border-bottom: 10px solid var(--secondary-color);
                    display: flex; flex-direction: column-reverse; /* Stack from bottom */
                    align-items: center; padding: 10px; gap: 5px;
                }
                .stacked-layer-optC { width: 100%; padding: 25px; text-align: center; color: white; border: 4px solid var(--dark-text); font-size: 1.5rem; }
                #worm-cheer-optC { font-size: 3rem; color: var(--primary-color); margin-top: 20px; animation: bounce 1s infinite; position: absolute; bottom: 20px;}
            </style>
        `;

        const layersDef = [
            { id: 1, name: "C Horizon", sub: "Marble", color: "#795548" },
            { id: 2, name: "B Horizon", sub: "Fudge", color: "#5d4037" },
            { id: 3, name: "A Horizon", sub: "Dark Cake", color: "#4e342e" },
            { id: 4, name: "O Horizon", sub: "Frosting", color: "#3e2723" },
            { id: 99, name: "Old Shoe", sub: "Yuck!", color: "#607d8b" }, // Decoy
            { id: 98, name: "Empty Can", sub: "Trash", color: "#9e9e9e" }  // Decoy
        ];

        let expectedLayer = 1;
        let beltInterval;
        let spawnInterval;
        const belt = document.getElementById('conveyor-belt');
        const plate = document.getElementById('plate-target-optC');
        const instruction = document.getElementById('instruction-optC');

        const containerWidth = document.querySelector('.conveyor-container').offsetWidth;

        function updateInstruction() {
            if (expectedLayer > 4) return;
            const target = layersDef.find(l => l.id === expectedLayer);
            instruction.innerHTML = `I need the <span style="color:var(--accent-color)">${target.name} (${target.sub})</span>!`;
        }

        function spawnItem() {
            // Pick a random item, leaning toward the one we need so they don't wait forever
            let itemDef;
            if (Math.random() > 0.4) {
                itemDef = layersDef.find(l => l.id === expectedLayer);
            } else {
                itemDef = layersDef[Math.floor(Math.random() * layersDef.length)];
            }
            if (!itemDef) return;

            const el = document.createElement('div');
            el.className = 'belt-item';
            el.style.backgroundColor = itemDef.color;
            el.innerHTML = `${itemDef.name}<br><small>${itemDef.sub}</small>`;
            el.dataset.id = itemDef.id;

            // Start on the right side
            let posX = containerWidth;
            el.style.left = posX + 'px';
            belt.appendChild(el);

            el.addEventListener('click', () => {
                handleTap(parseInt(el.dataset.id), el);
            });
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleTap(parseInt(el.dataset.id), el);
            }, { passive: false });
        }

        function handleTap(id, domEl) {
            if (id === expectedLayer) {
                // Correct!
                playDing();
                domEl.remove();

                const stacked = document.createElement('div');
                stacked.className = 'stacked-layer-optC';
                stacked.style.backgroundColor = domEl.style.backgroundColor;
                stacked.innerHTML = domEl.innerHTML;
                plate.appendChild(stacked);

                expectedLayer++;
                if (expectedLayer > 4) {
                    clearInterval(beltInterval);
                    clearInterval(spawnInterval);
                    instruction.innerHTML = "You built the soil!";
                    document.getElementById('worm-cheer-optC').classList.remove('hidden');
                    setTimeout(() => window.triggerReward(), 3000);
                } else {
                    updateInstruction();
                }
            } else {
                // Wrong item!
                domEl.style.backgroundColor = "rgba(200, 50, 50, 0.8)"; // flash red
                instruction.innerHTML = "Oops! Not that one.";
                setTimeout(updateInstruction, 1500);
            }
        }

        // Move items
        beltInterval = setInterval(() => {
            if (expectedLayer > 4) return;
            const items = document.querySelectorAll('.belt-item');
            items.forEach(el => {
                let currentPos = parseFloat(el.style.left);
                currentPos -= 3; // speed
                if (currentPos < -200) {
                    el.remove(); // off screen
                } else {
                    el.style.left = currentPos + 'px';
                }
            });
        }, 16);

        spawnInterval = setInterval(spawnItem, 2000);
        updateInstruction();
    },

    // Game 1B: Dot-to-Dot Constellations
    initGame1B: function (container) {
        container.innerHTML = `
                < div id = "game-1b" >
                <h2>Connect the Stars!</h2>
                <div class="star-area">
                    <canvas id="star-canvas" width="800" height="400"></canvas>
                    <div id="star-message" class="hidden"></div>
                </div>
            </div >
    <style>
        #game-1b {width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 20px; }
        #game-1b h2 {color: var(--dark-text); font-size: 2.5rem; text-shadow: none; margin-bottom: 5px; }
        .star-area {position: relative; }
        #star-canvas {border: 4px solid var(--dark-text); background-color: #1a237e; border-radius: 12px; touch-action: none; cursor: crosshair; }
        #star-message {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(255,255,255,0.9); padding: 20px; border: 4px solid var(--dark-text);
        font-size: 2rem; border-radius: 8px; text-align: center; color: var(--dark-text);
                }
        .dot {position: absolute; width: 30px; height: 30px; background-color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; pointer-events: none; }
    </style>
`;

        const canvas = document.getElementById('star-canvas');
        const ctx = canvas.getContext('2d');
        const starMessage = document.getElementById('star-message');
        const starArea = document.querySelector('.star-area');

        // Configs for the 3 levels
        const levels = [
            { id: 1, points: [{ x: 200, y: 100 }, { x: 600, y: 100 }, { x: 400, y: 300 }], text: "Clay makes mugs! ☕", next: 2 },
            { id: 2, points: [{ x: 200, y: 200 }, { x: 400, y: 100 }, { x: 600, y: 200 }, { x: 400, y: 300 }], text: "Flowers like bees! 🐝", next: 3 },
            { id: 3, points: [{ x: 150, y: 200 }, { x: 350, y: 100 }, { x: 650, y: 150 }, { x: 550, y: 300 }, { x: 250, y: 300 }], text: "Bison love healthy soil! 🦬", next: null }
        ];

        let currentLevelIndex = 0;
        let points = [];
        let dotsDrawn = [];

        function loadLevel() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Remove old HTML dots
            document.querySelectorAll('.dot').forEach(el => el.remove());
            starMessage.classList.add('hidden');

            const levelData = levels[currentLevelIndex];
            points = levelData.points;
            dotsDrawn = [points[0]]; // Start at index 0

            // Draw HTML points for numbers
            points.forEach((p, i) => {
                const dot = document.createElement('div');
                dot.className = 'dot';
                dot.innerHTML = i + 1;
                dot.style.left = (p.x - 15) + 'px';
                dot.style.top = (p.y - 15) + 'px';
                starArea.appendChild(dot);

                // Draw initial stars
                drawStar(p.x, p.y, i === 0 ? '#FFEB3B' : 'white');
            });
            drawLines();
        }

        function drawStar(x, y, color) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawLines() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Redraw stars to clear paths
            points.forEach((p, i) => {
                const isDrawn = dotsDrawn.includes(p);
                drawStar(p.x, p.y, isDrawn ? '#FFEB3B' : 'white');
            });

            ctx.strokeStyle = '#FFEB3B';
            ctx.lineWidth = 5;
            ctx.beginPath();
            if (dotsDrawn.length > 0) {
                ctx.moveTo(dotsDrawn[0].x, dotsDrawn[0].y);
                for (let i = 1; i < dotsDrawn.length; i++) {
                    ctx.lineTo(dotsDrawn[i].x, dotsDrawn[i].y);
                }
                ctx.stroke();
            }
        }

        // Handle drawing connection
        let isDrawing = false;

        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            // Scale if CSS sizes differ
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }

        function handlePointerStart(e) {
            e.preventDefault();
            isDrawing = true;
            handlePointerMove(e);
        }

        function handlePointerMove(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getMousePos(e);

            // Check if near the next required point
            const nextPointIndex = dotsDrawn.length;
            if (nextPointIndex < points.length) {
                const nextPoint = points[nextPointIndex];
                const dist = Math.hypot(pos.x - nextPoint.x, pos.y - nextPoint.y);
                if (dist < 40) { // Hit threshold
                    dotsDrawn.push(nextPoint);
                    playDing();
                    drawLines();

                    if (dotsDrawn.length === points.length) {
                        isDrawing = false;
                        levelComplete();
                    }
                }
            }

            // Draw temp line
            if (isDrawing && dotsDrawn.length > 0 && dotsDrawn.length < points.length) {
                drawLines(); // base lines
                const lastPoint = dotsDrawn[dotsDrawn.length - 1];
                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
        }

        function handlePointerEnd(e) {
            e.preventDefault();
            isDrawing = false;
            drawLines(); // Snaps back if not reached
        }

        canvas.addEventListener('mousedown', handlePointerStart);
        canvas.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerEnd);

        canvas.addEventListener('touchstart', handlePointerStart, { passive: false });
        canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
        canvas.addEventListener('touchend', handlePointerEnd, { passive: false });

        function levelComplete() {
            const levelData = levels[currentLevelIndex];
            starMessage.innerHTML = levelData.text;
            starMessage.classList.remove('hidden');

            setTimeout(() => {
                if (levelData.next) {
                    currentLevelIndex++;
                    loadLevel();
                } else {
                    window.triggerReward();
                }
            }, 3000);
        }

        loadLevel();
    },

    // ==========================================
    // LEVEL 2: Earth Explorers (3rd to 5th)
    // ==========================================

    initGame2A: function (container) {
        container.innerHTML = `
    < div id = "game-2a" >
                <h2>The Three Sisters Garden</h2>
                <div class="sky-area">
                    <div id="prompt-box" class="animated">Let's plant a garden together!</div>
                </div>
                <div class="farm-area">
                    <div class="soil-bed">
                        <div id="plant-corn" class="plant-slot hidden">🌽<br>Corn (Selu)</div>
                        <div id="plant-beans" class="plant-slot hidden">🌿<br>Beans (Iya)</div>
                        <div id="plant-squash" class="plant-slot hidden">🎃<br>Squash (Tuya)</div>
                    </div>
                </div>
                <div class="seeds-area">
                    <button class="seed-btn" data-plant="corn">Corn Seed</button>
                    <button class="seed-btn" data-plant="beans">Bean Bug</button>
                    <button class="seed-btn" data-plant="squash">Squash Seed</button>
                </div>
            </div >
    <style>
        #game-2a {width: 100%; height: 100%; display: flex; flex-direction: column; text-align: center; }
        #game-2a h2 {font - size: 2rem; margin: 10px 0; color: var(--dark-text); text-shadow: none; }
        .sky-area {flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
        #prompt-box {
            background: white; border: 4px solid var(--primary-color); padding: 20px;
        font-size: 2rem; border-radius: 10px; max-width: 80%; line-height: 1.5; color: var(--dark-text);
                }
        .farm-area {flex: 2; background-color: var(--secondary-color); display: flex; align-items: flex-end; justify-content: center; padding-bottom: 20px; border-top: 8px solid var(--dark-text); }
        .soil-bed {width: 80%; border-bottom: 10px solid var(--dark-text); display: flex; justify-content: space-around; align-items: flex-end; height: 150px; }
        .plant-slot {font - size: 4rem; animation: grow 0.5s ease-out; }
        @keyframes grow {0 % { transform: scale(0); opacity: 0; } 100% {transform: scale(1); opacity: 1; } }
        .seeds-area {flex: 1; background-color: #eee; display: flex; justify-content: center; gap: 20px; align-items: center; border-radius: 0 0 12px 12px; }
        .seed-btn {
            padding: 20px 40px; font-size: 1.5rem; font-family: inherit; cursor: pointer;
        background-color: var(--accent-color); border: 4px solid var(--dark-text); box-shadow: var(--pixel-shadow); flex: 1; max-width: 250px;
                }
        .seed-btn:active {transform: translate(2px, 2px); box-shadow: var(--pixel-shadow-active); }
        .hidden {display: none !important; }
    </style>
`;

        const sequence = [
            {
                prompt: "I need a plant that grows tall and gives others a place to climb to reach the sunlight.",
                target: "corn",
                success: "Great! Corn acts as the pole for the beans."
            },
            {
                prompt: "I need a plant that helps the soil stay healthy by putting nitrogen nutrients back into it.",
                target: "beans",
                success: "Awesome! Beans pull nitrogen from the air."
            },
            {
                prompt: "I need a plant that spreads big leaves to keep the soil moist and stop weeds from growing.",
                target: "squash",
                success: "Perfect! Squash acts as living mulch."
            }
        ];

        let step = 0;
        const promptBox = document.getElementById('prompt-box');
        const buttons = document.querySelectorAll('.seed-btn');

        function loadStep() {
            if (step >= sequence.length) {
                promptBox.innerHTML = "You planted a beautiful Three Sisters Garden! 🌽🌿🎃";
                playDing();
                setTimeout(() => window.triggerReward(), 3000);
                return;
            }
            promptBox.innerHTML = sequence[step].prompt;
        }

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plant = e.target.getAttribute('data-plant');
                if (step < sequence.length && plant === sequence[step].target) {
                    // Correct!
                    document.getElementById(`plant-${plant}`).classList.remove('hidden');
                    playDing();
                    promptBox.innerHTML = sequence[step].success;
                    step++;
                    setTimeout(loadStep, 2500);
                } else if (step < sequence.length) {
                    promptBox.innerHTML = "Not quite! Try reading the clue carefully.";
                    setTimeout(() => loadStep(), 2000);
                }
            });
        });

        setTimeout(loadStep, 2000);
    },

    // ==========================================
    // LEVEL 2: Earth Explorers (3rd to 5th)
    // ==========================================
    initGame2B: function (container) {
        container.innerHTML = `
    < div id = "game-2b" >
                <h2>Spin the CLORPT Wheel!</h2>
                <div class="wheel-container" id="wheel-area">
                    <div class="wheel" id="wheel-graphic">🕹️<br>SWIPE<br>TO SPIN!</div>
                </div>
                <div id="qa-container" class="hidden">
                    <div class="question-box" id="q-text"></div>
                    <div class="answers-box" id="a-buttons"></div>
                </div>
            </div>
            <style>
                #game-2b { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 20px; }
                #game-2b h2 { font-size: 2rem; color: var(--dark-text); text-shadow: none; margin-bottom: 20px; }
                .wheel-container { flex: 1; display: flex; align-items: center; justify-content: center; cursor: grab; }
                .wheel { 
                    width: 400px; height: 400px; border-radius: 50%; border: 16px solid var(--dark-text);
                    background: conic-gradient(#f44336 0% 33%, #4caf50 33% 66%, #2196f3 66% 100%);
                    display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white;
                    text-shadow: 4px 4px 0 black; text-align: center; line-height: 1.2; box-shadow: 0 10px 0 rgba(0,0,0,0.5);
                    transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
                }
                #qa-container { flex: 1; width: 80%; display: flex; flex-direction: column; gap: 20px; justify-content: center; }
                .question-box { background: white; border: 4px solid var(--primary-color); padding: 20px; font-size: 1.8rem; border-radius: 10px; color: var(--dark-text); text-align: center; }
                .answers-box { display: flex; gap: 20px; justify-content: center; }
                .ans-btn { flex: 1; padding: 20px; font-size: 1.5rem; font-family: inherit; background-color: var(--accent-color); border: 4px solid var(--dark-text); cursor: pointer; }
                .ans-btn:active { background-color: #FFB300; }
                .hidden { display: none !important; }
            </style>
`;

        const questions = [
            { segment: 'C (Climate)', q: "True or False: Soils develop fastest in cold and dry climates.", ans: ["True", "False"], correct: 1 },
            { segment: 'O (Organisms)', q: "Which organism shreds organic matter in the soil food web?", ans: ["Arthropods", "Bacteria", "Fish"], correct: 0 },
            { segment: 'R (Relief)', q: "Where do deeper soils typically form?", ans: ["At the top of a hill", "At the bottom of a hill"], correct: 1 }
        ];

        const wheel = document.getElementById('wheel-graphic');
        const wheelArea = document.getElementById('wheel-area');
        const qaContainer = document.getElementById('qa-container');
        const qText = document.getElementById('q-text');
        const aButtons = document.getElementById('a-buttons');

        let isSpinning = false;
        let rot = 0;

        wheelArea.addEventListener('click', spinWheel);
        wheelArea.addEventListener('touchstart', (e) => { e.preventDefault(); spinWheel(); }, { passive: false });

        function spinWheel() {
            if (isSpinning) return;
            isSpinning = true;

            // Random spin amount over 3-5 full rotations
            const spinAdd = (360 * 3) + Math.floor(Math.random() * 360);
            rot += spinAdd;
            wheel.style.transform = `rotate(${rot}deg)`;

            setTimeout(() => {
                // Pick a random question
                const q = questions[Math.floor(Math.random() * questions.length)];
                askQuestion(q);
            }, 3000); // matches CSS transition time
        }

        function askQuestion(qObj) {
            wheelArea.classList.add('hidden');
            qaContainer.classList.remove('hidden');
            qText.innerHTML = `<strong>${qObj.segment}:</strong><br>${qObj.q}`;

            aButtons.innerHTML = '';
            qObj.ans.forEach((text, i) => {
                const b = document.createElement('button');
                b.className = 'ans-btn';
                b.textContent = text;
                b.onclick = () => {
                    if (i === qObj.correct) {
                        playDing();
                        qText.innerHTML = "Correct! 💧🌻";
                        b.style.backgroundColor = 'var(--primary-color)';
                        b.style.color = 'white';
                        setTimeout(() => window.triggerReward(), 2000);
                    } else {
                        qText.innerHTML = "Oops, try again!";
                        b.style.opacity = '0.5';
                    }
                };
                aButtons.appendChild(b);
            });
        }
    },

    // ==========================================
    // LEVEL 3: Agro-Heroes (Middle & High)
    // ==========================================

    initGame3A: function (container) {
        container.innerHTML = `
    < div id = "game-3a" >
                <h2>Farm Manager Simulator</h2>
                <div class="river-container">
                    <div id="river" class="river muddy">🌊 MUDDY RIVER 🌊</div>
                </div>
                <div class="scenario-panel">
                    <div id="sim-prompt">Your drainage tile water has too many nutrients and is going into the local stream! What do you build?</div>
                    <div id="sim-options" class="options-grid"></div>
                </div>
            </div >
    <style>
        #game-3a {width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 20px; text-align: center; }
        #game-3a h2 {font - size: 2.5rem; color: var(--dark-text); text-shadow: none; margin-bottom: 5px; }
        .river-container {width: 100%; height: 150px; overflow: hidden; border-radius: 10px; margin-bottom: 20px; border: 8px solid var(--dark-text); }
        .river {width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; transition: background-color 2s, color 2s; }
        .river.muddy {background-color: var(--secondary-color); color: var(--dark-text); text-shadow: none; }
        .river.clean {background-color: var(--background-color); color: var(--dark-text); text-shadow: none; animation: wave 2s infinite linear; }
        @keyframes wave {0 % { background- position - x: 0; } 100% {background - position - x: 100px; } }
        .scenario-panel {flex: 1; width: 90%; background: white; border: 6px solid var(--primary-color); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-around; }
        #sim-prompt {font - size: 2rem; color: var(--dark-text); line-height: 1.4; padding: 20px; }
        .options-grid {display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
        .sim-btn {padding: 20px 40px; font-size: 1.5rem; font-family: inherit; background-color: var(--accent-color); border: 4px solid var(--dark-text); cursor: pointer; border-radius: 8px; flex: 1; min-width: 250px; }
        .sim-btn:active {background - color: #FFB300; transform: translate(2px, 2px); }
    </style>
`;

        const scenarios = [
            {
                q: "Your drainage tile water has too many nutrients and is going into the local stream! What do you build?",
                opts: ["A Brick Wall", "Bioreactor / Saturated Buffers", "A Windmill"],
                correct: 1,
                success: "Excellent! The woodchips in the bioreactor filter out the nutrients before they hit the stream."
            },
            {
                q: "You need someone to run a complex agricultural business and decide how to raise crops based on market conditions.",
                opts: ["Call the Meteorologist", "Call the Seed Analyst", "Call the Farm Manager"],
                correct: 2,
                success: "Correct! The Farm Manager balances business, markets, and crop health."
            }
        ];

        let currentScenario = 0;
        const promptBox = document.getElementById('sim-prompt');
        const optionsArea = document.getElementById('sim-options');
        const riverBox = document.getElementById('river');

        function loadScenario() {
            if (currentScenario >= scenarios.length) {
                // Game completely won
                promptBox.innerHTML = "You successfully managed the farm!";
                optionsArea.innerHTML = "";
                riverBox.classList.remove('muddy');
                riverBox.classList.add('clean');
                riverBox.innerHTML = "🌊 SPARKLING RIVER 🌊";
                playDing();
                setTimeout(() => window.triggerReward(), 3000);
                return;
            }

            const data = scenarios[currentScenario];
            promptBox.innerHTML = data.q;
            optionsArea.innerHTML = '';

            data.opts.forEach((optText, index) => {
                const btn = document.createElement('button');
                btn.className = 'sim-btn';
                btn.textContent = optText;
                btn.onclick = () => {
                    if (index === data.correct) {
                        playDing();
                        promptBox.innerHTML = data.success;
                        optionsArea.innerHTML = '';
                        currentScenario++;
                        setTimeout(loadScenario, 3000);
                    } else {
                        btn.style.opacity = '0.5';
                        btn.textContent = "Not quite! Try again.";
                    }
                };
                optionsArea.appendChild(btn);
            });
        }

        loadScenario();
    },

    initGame3B: function (container) {
        container.innerHTML = `
    < div id = "game-3b" >
                <div class="header">
                    <h2>Trivia Challenge!</h2>
                    <div id="timer" class="clock">60</div>
                </div>
                <div class="trivia-panel">
                    <div id="trivia-q">Loading...</div>
                    <div id="trivia-opts" class="options-grid"></div>
                </div>
                <div class="score-board">Score: <span id="score">0</span></div>
            </div >
    <style>
        #game-3b {width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 20px; text-align: center; }
        .header {display: flex; width: 100%; justify-content: space-between; align-items: center; padding: 0 40px; margin-bottom: 20px; }
        .header h2 {font - size: 2.5rem; color: var(--dark-text); text-shadow: none; margin: 0; }
        .clock {font - size: 3rem; background: var(--dark-text); color: white; padding: 15px 30px; border-radius: 12px; border: 4px solid var(--accent-color); }
        .clock.warning {color: #f44336; animation: pulse 0.5s infinite; }
        @keyframes pulse {0 % { transform: scale(1); } 50% {transform: scale(1.1); } 100% {transform: scale(1); } }
        .trivia-panel {flex: 1; width: 90%; background: white; border: 6px solid var(--background-color); border-radius: 12px; padding: 40px; display: flex; flex-direction: column; justify-content: space-around; }
        #trivia-q {font - size: 2.2rem; color: var(--dark-text); line-height: 1.5; }
        .options-grid {display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 20px; }
        .t-btn {padding: 20px 30px; font-size: 1.5rem; font-family: inherit; background-color: var(--background-color); color: var(--dark-text); border: 4px solid var(--dark-text); cursor: pointer; border-radius: 8px; flex: 1 1 45%; min-width: 250px; }
        .t-btn:active {background - color: #1565C0; transform: translate(2px, 2px); }
        .score-board {font - size: 2.5rem; margin-top: 20px; color: var(--dark-text); }
    </style>
`;

        if (typeof triviaQuestions === 'undefined') {
            document.getElementById('trivia-q').textContent = "Error: triviaDatabase.js not loaded.";
            return;
        }

        // Shuffle questions
        const questions = [...triviaQuestions].sort(() => Math.random() - 0.5);

        let currentQIndex = 0;
        let score = 0;
        let timeLeft = 60;
        let interval;

        const clockEle = document.getElementById('timer');
        const qEle = document.getElementById('trivia-q');
        const optsEle = document.getElementById('trivia-opts');
        const scoreEle = document.getElementById('score');

        function startGame() {
            interval = setInterval(() => {
                timeLeft--;
                clockEle.textContent = timeLeft;
                if (timeLeft <= 10) clockEle.classList.add('warning');
                if (timeLeft <= 0) {
                    endGame();
                }
            }, 1000);
            loadNextQuestion();
        }

        function loadNextQuestion() {
            if (currentQIndex >= questions.length) {
                endGame();
                return;
            }

            optsEle.innerHTML = '';
            const q = questions[currentQIndex];
            qEle.textContent = q.question;

            q.options.forEach((optText, i) => {
                const btn = document.createElement('button');
                btn.className = 't-btn';
                btn.textContent = optText;
                btn.onclick = () => {
                    if (i === q.correctIndex) {
                        playDing();
                        score += 10;
                        scoreEle.textContent = score;
                        btn.style.backgroundColor = 'var(--primary-color)';
                    } else {
                        btn.style.backgroundColor = '#f44336';
                        // Highlight correct
                        optsEle.children[q.correctIndex].style.backgroundColor = 'var(--primary-color)';
                    }

                    // Disable all buttons to prevent spamming
                    Array.from(optsEle.children).forEach(b => b.onclick = null);

                    currentQIndex++;
                    setTimeout(() => {
                        if (timeLeft > 0) loadNextQuestion();
                    }, 1500);
                };
                optsEle.appendChild(btn);
            });
        }

        function endGame() {
            clearInterval(interval);
            qEle.innerHTML = `Game Over!<br>Your Final Score: ${score}`;
            optsEle.innerHTML = '';
            setTimeout(() => window.triggerReward(), 4000);
        }

        // Initial delay so player can prepare
        qEle.textContent = "Ready...";
        setTimeout(() => {
            qEle.textContent = "Go!";
            setTimeout(startGame, 1000);
        }, 1000);
    }
};

// Simple audio preloader and player
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playDing() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    // Simple synthesized ding
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}
