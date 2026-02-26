// ============================================
// GAME 1: BUILD A SOIL CAKE (Drag & Drop)
// Stack soil layers in the correct order
// ============================================

const SoilCakeGame = {
    container: null,
    level: 1,
    slots: [],
    placedLayers: [],
    dragState: null,

    init(container, level) {
        this.container = container;
        this.level = level;
        this.placedLayers = [];
        this.dragState = null;

        const levelData = SOIL_CAKE_LEVELS[level];
        if (!levelData) return;

        this.render(levelData);
        this.setupDragHandlers();
    },

    render(levelData) {
        const shuffled = [...levelData.layers].sort(() => Math.random() - 0.5);

        this.container.innerHTML = `
            <div class="soil-cake-game">
                <div class="cake-layers-source">
                    <div style="font-family:var(--font-title); font-size:0.6rem; color:var(--color-accent); margin-bottom:8px; text-align:center;">
                        Drag layers here →
                    </div>
                    ${shuffled.map(layer => `
                        <div class="draggable-layer" data-layer-id="${layer.id}"
                             style="background:${layer.color}; color:#fff; border-color:${layer.color};"
                             touch-action="none">
                            <div style="font-weight:bold; margin-bottom:4px;">${layer.name}</div>
                            <div style="font-size:0.75rem; opacity:0.8;">${layer.desc}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="cake-drop-zone">
                    <div style="font-family:var(--font-title); font-size:0.7rem; color:var(--color-accent); margin-bottom:16px; text-align:center;">
                        ${levelData.title}
                    </div>
                    <div style="font-family:var(--font-body); font-size:0.85rem; margin-bottom:20px; text-align:center; opacity:0.8;">
                        ${levelData.instruction}
                    </div>
                    <div class="cake-slots" id="cake-slots">
                        ${levelData.correctOrder.map((_, i) => `
                            <div class="cake-slot" data-slot-index="${i}">
                                <span style="opacity:0.3; font-size:0.75rem;">${levelData.correctOrder.length - i}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="cake-plate"></div>
                </div>
            </div>
        `;
    },

    setupDragHandlers() {
        const layers = this.container.querySelectorAll('.draggable-layer');
        const slots = this.container.querySelectorAll('.cake-slot');

        layers.forEach(layer => {
            layer.addEventListener('pointerdown', (e) => this.onDragStart(e, layer));
        });

        document.addEventListener('pointermove', this._onDragMove = (e) => this.onDragMove(e));
        document.addEventListener('pointerup', this._onDragEnd = (e) => this.onDragEnd(e));
    },

    onDragStart(e, layer) {
        if (layer.classList.contains('dragging')) return;
        e.preventDefault();

        const rect = layer.getBoundingClientRect();
        const clone = layer.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.width = rect.width + 'px';
        clone.style.zIndex = '1000';
        clone.style.pointerEvents = 'none';
        clone.style.opacity = '0.9';
        clone.style.transform = 'scale(1.05)';
        document.body.appendChild(clone);

        layer.classList.add('dragging');

        this.dragState = {
            element: layer,
            clone: clone,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            layerId: layer.dataset.layerId
        };

        this.updateClonePosition(e);
    },

    onDragMove(e) {
        if (!this.dragState) return;
        e.preventDefault();
        this.updateClonePosition(e);

        // Highlight nearest slot
        const slots = this.container.querySelectorAll('.cake-slot:not(.filled)');
        slots.forEach(slot => {
            const rect = slot.getBoundingClientRect();
            const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top && e.clientY <= rect.bottom;
            slot.classList.toggle('hover', isOver);
        });
    },

    onDragEnd(e) {
        if (!this.dragState) return;

        // Find the slot under the pointer
        const slots = this.container.querySelectorAll('.cake-slot:not(.filled)');
        let targetSlot = null;

        slots.forEach(slot => {
            const rect = slot.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                targetSlot = slot;
            }
            slot.classList.remove('hover');
        });

        if (targetSlot) {
            this.placeLayer(targetSlot, this.dragState);
        } else {
            // Return to source
            this.dragState.element.classList.remove('dragging');
        }

        // Clean up clone
        if (this.dragState.clone) {
            this.dragState.clone.remove();
        }
        this.dragState = null;
    },

    updateClonePosition(e) {
        if (!this.dragState || !this.dragState.clone) return;
        this.dragState.clone.style.left = (e.clientX - this.dragState.offsetX) + 'px';
        this.dragState.clone.style.top = (e.clientY - this.dragState.offsetY) + 'px';
    },

    placeLayer(slot, dragInfo) {
        const levelData = SOIL_CAKE_LEVELS[this.level];
        const slotIndex = parseInt(slot.dataset.slotIndex);
        const layerId = dragInfo.layerId;

        // Place the layer visually
        const layer = levelData.layers.find(l => l.id === layerId);
        slot.innerHTML = `<span style="font-size:0.8rem; font-weight:bold;">${layer.name}</span>`;
        slot.style.background = layer.color;
        slot.style.color = '#fff';
        slot.classList.add('filled');

        // Remove from source
        dragInfo.element.remove();

        // Track placement
        this.placedLayers.push({ slotIndex, layerId });

        // Check if all placed
        if (this.placedLayers.length === levelData.correctOrder.length) {
            this.checkOrder(levelData);
        }
    },

    checkOrder(levelData) {
        // Sort placed layers by slot index (bottom = highest index = first in correctOrder)
        const sorted = [...this.placedLayers].sort((a, b) => b.slotIndex - a.slotIndex);
        const playerOrder = sorted.map(p => p.layerId);
        const correct = JSON.stringify(playerOrder) === JSON.stringify(levelData.correctOrder);

        if (correct) {
            app.updateScore(100);
            app.showFeedback(true);

            // Show earthworm celebration for level 1
            if (this.level === 1) {
                setTimeout(() => {
                    const worm = document.createElement('div');
                    worm.style.cssText = 'position:absolute; bottom:20%; left:50%; transform:translateX(-50%); font-size:4rem; animation:wave-bounce 1s ease-in-out infinite;';
                    worm.textContent = '🪱';
                    this.container.querySelector('.cake-drop-zone').appendChild(worm);
                }, 800);
            }

            setTimeout(() => app.nextLevel(), 2000);
        } else {
            app.showFeedback(false);
            // Reset after wrong order
            setTimeout(() => {
                this.init(this.container, this.level);
            }, 1500);
        }
    },

    cleanup() {
        if (this._onDragMove) document.removeEventListener('pointermove', this._onDragMove);
        if (this._onDragEnd) document.removeEventListener('pointerup', this._onDragEnd);
        this.dragState = null;
    }
};

app.registerGame('soil-cake', SoilCakeGame);
