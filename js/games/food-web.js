// ============================================
// GAME 10: SOIL FOOD WEB BUILDER
// Drag organisms + draw connections
// Cross-tier: complexity auto-matched
// ============================================

const FoodWebGame = {
    container: null,
    tier: 'sprouts',
    data: null,
    placedOrganisms: {},
    drawnConnections: [],
    phase: 'place', // 'place' or 'connect'
    selectedNode: null,
    dragState: null,

    init(container, level, tier) {
        this.container = container;
        this.tier = tier || 'sprouts';
        this.data = FOOD_WEB_DATA[this.tier];
        this.placedOrganisms = {};
        this.drawnConnections = [];
        this.phase = 'place';
        this.selectedNode = null;
        this.dragState = null;

        if (!this.data) return;
        this.render();
    },

    render() {
        const organisms = this.data.organisms;
        const nodePositions = this.calculateNodePositions(organisms.length);

        this.container.innerHTML = `
            <div class="food-web-game">
                <div class="food-web-sidebar" id="fw-sidebar">
                    <div style="font-family:var(--font-title); font-size:0.55rem; color:var(--color-accent); text-align:center; margin-bottom:8px;">
                        ${this.data.title}
                    </div>
                    ${organisms.map(org => `
                        <div class="organism-card" data-org-id="${org.id}"
                             onpointerdown="FoodWebGame.startDragOrganism(event, '${org.id}')">
                            <div style="font-size:1.5rem;">${org.emoji}</div>
                            <div style="font-weight:bold; margin-top:4px;">${org.name}</div>
                            <div style="font-size:0.7rem; opacity:0.7;">${org.desc}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="food-web-canvas" id="fw-canvas">
                    <svg class="food-web-svg" id="fw-svg">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                                    refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.5)" />
                            </marker>
                            <marker id="arrowhead-correct" markerWidth="10" markerHeight="7"
                                    refX="10" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#4caf50" />
                            </marker>
                        </defs>
                        <g id="fw-connections"></g>
                        <g id="fw-nodes">
                            ${nodePositions.map((pos, i) => `
                                <g class="web-node" data-slot="${i}"
                                   transform="translate(${pos.x}, ${pos.y})"
                                   onclick="FoodWebGame.clickNode(${i})">
                                    <circle class="web-node-circle" r="35" cx="0" cy="0"></circle>
                                    <text class="web-node-label" y="5">?</text>
                                </g>
                            `).join('')}
                        </g>
                    </svg>
                    <div class="food-web-instructions" id="fw-instructions">
                        Drag organisms from the sidebar to the circles!
                    </div>
                </div>
            </div>
        `;

        this.nodePositions = nodePositions;

        // Setup drag handlers
        document.addEventListener('pointermove', this._onMove = (e) => this.onDragMove(e));
        document.addEventListener('pointerup', this._onUp = (e) => this.onDragEnd(e));
    },

    calculateNodePositions(count) {
        const positions = [];
        const svgRect = { width: 800, height: 600 };
        const cx = svgRect.width / 2;
        const cy = svgRect.height / 2;
        const radius = Math.min(cx, cy) * 0.6;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            positions.push({
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius
            });
        }
        return positions;
    },

    startDragOrganism(e, orgId) {
        e.preventDefault();
        const card = this.container.querySelector(`[data-org-id="${orgId}"]`);
        if (!card || card.classList.contains('placed')) return;

        const rect = card.getBoundingClientRect();
        const clone = document.createElement('div');
        clone.style.cssText = `
            position:fixed; z-index:1000; pointer-events:none;
            width:${rect.width}px; padding:12px; background:rgba(100,200,100,0.3);
            border:2px solid var(--color-success); border-radius:8px;
            text-align:center; font-family:var(--font-body); font-size:0.8rem; color:#fff;
        `;
        const org = this.data.organisms.find(o => o.id === orgId);
        clone.innerHTML = `<div style="font-size:1.5rem;">${org.emoji}</div>${org.name}`;
        document.body.appendChild(clone);

        this.dragState = {
            orgId,
            clone,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top
        };

        clone.style.left = (e.clientX - this.dragState.offsetX) + 'px';
        clone.style.top = (e.clientY - this.dragState.offsetY) + 'px';
    },

    onDragMove(e) {
        if (!this.dragState) return;
        e.preventDefault();
        this.dragState.clone.style.left = (e.clientX - this.dragState.offsetX) + 'px';
        this.dragState.clone.style.top = (e.clientY - this.dragState.offsetY) + 'px';
    },

    onDragEnd(e) {
        if (!this.dragState) return;

        // Find closest node
        const svg = document.getElementById('fw-svg');
        if (svg) {
            const svgRect = svg.getBoundingClientRect();
            const relX = (e.clientX - svgRect.left) / svgRect.width * 800;
            const relY = (e.clientY - svgRect.top) / svgRect.height * 600;

            let closestSlot = -1;
            let closestDist = Infinity;

            this.nodePositions.forEach((pos, i) => {
                // Skip already filled slots
                if (Object.values(this.placedOrganisms).includes(i)) return;

                const dist = Math.hypot(relX - pos.x, relY - pos.y);
                if (dist < 50 && dist < closestDist) {
                    closestDist = dist;
                    closestSlot = i;
                }
            });

            if (closestSlot >= 0) {
                this.placeOrganism(this.dragState.orgId, closestSlot);
            }
        }

        this.dragState.clone.remove();
        this.dragState = null;
    },

    placeOrganism(orgId, slotIndex) {
        this.placedOrganisms[orgId] = slotIndex;
        const org = this.data.organisms.find(o => o.id === orgId);

        // Update SVG node
        const node = this.container.querySelector(`[data-slot="${slotIndex}"]`);
        if (node) {
            const circle = node.querySelector('circle');
            const label = node.querySelector('text');
            circle.classList.add('filled');
            label.textContent = org.emoji + ' ' + org.name;
            label.style.fontSize = '10px';
        }

        // Mark sidebar card as placed
        const card = this.container.querySelector(`[data-org-id="${orgId}"]`);
        if (card) card.classList.add('placed');

        // Check if all placed
        if (Object.keys(this.placedOrganisms).length === this.data.organisms.length) {
            this.phase = 'connect';
            document.getElementById('fw-instructions').textContent =
                'Now tap two organisms to draw an arrow showing "who feeds who"!';
        }
    },

    clickNode(slotIndex) {
        if (this.phase !== 'connect') return;

        // Find which organism is in this slot
        const orgId = Object.keys(this.placedOrganisms).find(
            id => this.placedOrganisms[id] === slotIndex
        );
        if (!orgId) return;

        if (!this.selectedNode) {
            this.selectedNode = { orgId, slotIndex };
            // Highlight
            const node = this.container.querySelector(`[data-slot="${slotIndex}"] circle`);
            if (node) node.style.stroke = 'var(--color-accent)';
        } else {
            if (this.selectedNode.slotIndex === slotIndex) {
                // Deselect
                const node = this.container.querySelector(`[data-slot="${slotIndex}"] circle`);
                if (node) node.style.stroke = '';
                this.selectedNode = null;
                return;
            }

            // Draw connection from selectedNode to this node
            const fromId = this.selectedNode.orgId;
            const toId = orgId;

            this.drawConnection(fromId, toId);

            // Reset selection
            const prevNode = this.container.querySelector(`[data-slot="${this.selectedNode.slotIndex}"] circle`);
            if (prevNode) prevNode.style.stroke = '';
            this.selectedNode = null;

            // Check if all connections made
            this.checkConnections();
        }
    },

    drawConnection(fromId, toId) {
        const fromSlot = this.placedOrganisms[fromId];
        const toSlot = this.placedOrganisms[toId];
        const fromPos = this.nodePositions[fromSlot];
        const toPos = this.nodePositions[toSlot];

        // Check if this connection is correct
        const isCorrect = this.data.connections.some(
            c => c.from === fromId && c.to === toId
        );

        const connGroup = document.getElementById('fw-connections');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromPos.x);
        line.setAttribute('y1', fromPos.y);
        line.setAttribute('x2', toPos.x);
        line.setAttribute('y2', toPos.y);
        line.setAttribute('class', `web-arrow ${isCorrect ? 'correct' : ''}`);
        line.setAttribute('marker-end', isCorrect ? 'url(#arrowhead-correct)' : 'url(#arrowhead)');
        connGroup.appendChild(line);

        this.drawnConnections.push({ from: fromId, to: toId, correct: isCorrect });

        if (isCorrect) {
            app.updateScore(10);
        }
    },

    checkConnections() {
        const totalCorrect = this.data.connections.length;
        const playerCorrect = this.drawnConnections.filter(c => c.correct).length;

        if (playerCorrect >= totalCorrect) {
            document.getElementById('fw-instructions').textContent =
                `All connections found! ${playerCorrect}/${totalCorrect} correct!`;
            app.showFeedback(true);
            setTimeout(() => app.showCompletion(), 2000);
        } else {
            document.getElementById('fw-instructions').textContent =
                `${playerCorrect}/${totalCorrect} correct connections. Keep going!`;
        }
    },

    cleanup() {
        if (this._onMove) document.removeEventListener('pointermove', this._onMove);
        if (this._onUp) document.removeEventListener('pointerup', this._onUp);
        this.dragState = null;
    }
};

app.registerGame('food-web', FoodWebGame);
