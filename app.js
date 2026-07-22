/* === RUST MOBILE RAID CALCULATOR - APP LOGIC === */

// ===== GAME DATA =====
const WALLS = {
    wood: { name: 'Wood', icon: '🪵', hp: 250, tier: 1 },
    stone: { name: 'Stone', icon: '🪨', hp: 500, tier: 2 },
    metal: { name: 'Sheet Metal', icon: '🔩', hp: 1000, tier: 3 },
    armored: { name: 'Armored', icon: '🛡️', hp: 2000, tier: 4 }
};

const TOOLS = {
    satchel: {
        name: 'Satchel Charge',
        icon: '💼',
        damage: 475,
        craftCost: {
            beancan: { name: 'Beancan Grenade', icon: '🥫', count: 4 },
            rope: { name: 'Rope', icon: '🪢', count: 1 },
            cloth: { name: 'Cloth', icon: '👕', count: 1 }
        },
        // What's needed to craft the sub-components
        rawMaterials: {
            sulfur: 480, // 120 sulfur per beancan * 4
            metalFrags: 0,
            cloth: 1,
            wood: 60, // 15 wood per beancan * 4
            gunpowder: 0
        }
    },
    c4: {
        name: 'Timed Explosive (C4)',
        icon: '🧨',
        damage: 550,
        craftCost: {
            explosive: { name: 'Explosive', icon: '💥', count: 20 },
            cloth: { name: 'Cloth', icon: '👕', count: 5 },
            techTrash: { name: 'Tech Trash', icon: '🖥️', count: 3 },
            metalFrag: { name: 'Metal Frags', icon: '🔩', count: 1 }
        },
        rawMaterials: {
            sulfur: 2200, // 20 * (50 sulfur + 60 gp = 110 sulfur equiv per explosive)
            metalFrags: 201, // 20 * 10 = 200 + 1
            cloth: 5,
            wood: 0,
            gunpowder: 1200 // 20 * 60
        },
        // Detailed: each Explosive = 50 sulfur + 60 GP (10 sulfur) + 10 metal frags
        craftingDetail: 'Each Explosive: 50 Sulfur + 60 GP + 10 Metal Frags'
    },
    rocket: {
        name: 'Rocket (RPG)',
        icon: '🚀',
        damage: 350,
        craftCost: {
            gunpowder: { name: 'Gunpowder', icon: '⚡', count: 10 },
            sulfur: { name: 'Sulfur', icon: '💛', count: 10 },
            metalPipe: { name: 'Metal Pipe', icon: '🔧', count: 2 },
            metalFrag: { name: 'Metal Frags', icon: '🔩', count: 1 }
        },
        rawMaterials: {
            sulfur: 60, // 10 + 10 for GP (10 sulfur per 10 GP)
            metalFrags: 1,
            cloth: 0,
            wood: 0,
            gunpowder: 10
        }
    },
    explosive: {
        name: 'Explosive 5.56',
        icon: '🔫',
        damage: 10,
        craftCost: {
            gunpowder: { name: 'Gunpowder', icon: '⚡', count: 1 },
            sulfur: { name: 'Sulfur', icon: '💛', count: 1 },
            metalFrag: { name: 'Metal Frags', icon: '🔩', count: 1 }
        },
        rawMaterials: {
            sulfur: 11, // 1 sulfur + 1 GP (10 sulfur per GP)
            metalFrags: 1,
            cloth: 0,
            wood: 0,
            gunpowder: 1
        }
    },
    handmade: {
        name: 'Handmade Shell',
        icon: '🏹',
        damage: 5,
        craftCost: {
            gunpowder: { name: 'Gunpowder', icon: '⚡', count: 1 },
            sulfur: { name: 'Sulfur', icon: '💛', count: 1 },
            metalFrag: { name: 'Metal Frags', icon: '🔩', count: 1 }
        },
        rawMaterials: {
            sulfur: 11, // 1 sulfur + 1 GP (10 sulfur per GP)
            metalFrags: 1,
            cloth: 0,
            wood: 0,
            gunpowder: 1
        }
    }
};

// ===== STATE =====
let state = {
    selectedWall: null,
    selectedTool: null
};

// ===== DOM REFS =====
const $ = id => document.getElementById(id);
const splashEl = $('splash');
const appEl = $('app');
const resetBtn = $('resetBtn');
const totalSulfurEl = $('totalSulfur');
const totalMetalEl = $('totalMetal');
const totalGPEl = $('totalGP');
const wallSection = $('wallSection');
const toolSection = $('toolSection');
const resultsSection = $('resultsSection');
const resultContent = $('resultContent');
const comparisonContent = $('comparisonContent');

// ===== UTILITY =====
function ceilTo(x) {
    return Math.ceil(x);
}

function formatNum(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ===== CORE CALCULATION =====
function calculateRaids(wallHp) {
    const results = {};
    for (const [key, tool] of Object.entries(TOOLS)) {
        const count = ceilTo(wallHp / tool.damage);
        const raw = {};
        for (const [mat, val] of Object.entries(tool.rawMaterials)) {
            raw[mat] = val * count;
        }
        results[key] = { count, raw, tool };
    }
    return results;
}

// ===== RENDER =====
function renderResults() {
    if (!state.selectedWall || !state.selectedTool) return;

    const wall = WALLS[state.selectedWall];
    const tool = TOOLS[state.selectedTool];
    const count = ceilTo(wall.hp / tool.damage);
    const raw = {};
    for (const [mat, val] of Object.entries(tool.rawMaterials)) {
        raw[mat] = val * count;
    }

    let html = `
        <div class="result-summary">
            <div class="result-count">${formatNum(count)}</div>
            <div class="result-count-label">${tool.name}S NEEDED</div>
            <div class="result-detail">
                <strong>${wall.name}</strong> — ${formatNum(wall.hp)} HP ÷ ${formatNum(tool.damage)} DMG
            </div>
        </div>
        <div class="resource-breakdown">
    `;

    const matMap = {
        sulfur: { name: 'Sulfur', icon: '💛', cls: 'raw-sulfur' },
        metalFrags: { name: 'Metal Fragments', icon: '🔩', cls: 'metal-frags' },
        cloth: { name: 'Cloth', icon: '👕', cls: 'cloth' },
        wood: { name: 'Wood', icon: '🪵', cls: 'wood' },
        gunpowder: { name: 'Gunpowder', icon: '⚡', cls: 'gunpowder' }
    };

    for (const [mat, info] of Object.entries(matMap)) {
        if (raw[mat] > 0) {
            html += `
                <div class="resource-row">
                    <span class="resource-icon">${info.icon}</span>
                    <span class="resource-name">${info.name}</span>
                    <span class="resource-value ${info.cls}">${formatNum(raw[mat])}</span>
                </div>
            `;
        }
    }

    // Crafting breakdown
    html += `<div class="crafting-section"><h4>📦 CRAFTING BREAKDOWN</h4>`;

    if (tool.craftCost) {
        for (const [key, component] of Object.entries(tool.craftCost)) {
            html += `
                <div class="resource-row">
                    <span class="resource-icon">${component.icon}</span>
                    <span class="resource-name">${component.name}</span>
                    <span class="resource-value">${formatNum(component.count * count)}</span>
                </div>
            `;
        }
    }

    if (tool.craftingDetail) {
        html += `<p style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;">${tool.craftingDetail}</p>`;
    }

    html += `</div></div>`;
    resultContent.innerHTML = html;
    resultsSection.style.display = 'block';

    // Update status bar
    totalSulfurEl.textContent = formatNum(raw.sulfur || 0);
    totalMetalEl.textContent = formatNum(raw.metalFrags || 0);
    totalGPEl.textContent = formatNum(raw.gunpowder || 0);

    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function renderComparison() {
    if (!state.selectedWall) {
        comparisonContent.innerHTML = `<p class="text-muted">Select a wall type to see all raid methods.</p>`;
        return;
    }

    const wallHp = WALLS[state.selectedWall].hp;
    const results = calculateRaids(wallHp);

    let html = `
        <div class="comparison-grid">
            <div class="comparison-row header-row">
                <span>Tool</span>
                <span># Needed</span>
                <span>Sulfur</span>
                <span>Metal</span>
            </div>
    `;

    // Find cheapest by sulfur
    let minSulfur = Infinity;
    let maxSulfur = -Infinity;
    const entries = Object.entries(results);
    for (const [, r] of entries) {
        if (r.raw.sulfur < minSulfur) minSulfur = r.raw.sulfur;
        if (r.raw.sulfur > maxSulfur) maxSulfur = r.raw.sulfur;
    }

    for (const [key, r] of entries) {
        let extraClass = '';
        if (r.raw.sulfur === minSulfur) extraClass += ' cmp-cheapest';
        if (r.raw.sulfur === maxSulfur && entries.length > 1) extraClass += ' cmp-expensive';
        if (key === state.selectedTool) extraClass += ' selected'; // defined in CSS

        html += `
            <div class="comparison-row${extraClass}" onclick="selectToolFromComparison('${key}')">
                <span class="cmp-tool">${r.tool.icon} ${r.tool.name}</span>
                <span class="cmp-count">${r.count}</span>
                <span class="cmp-sulfur">${formatNum(r.raw.sulfur)}</span>
                <span class="cmp-metal">${formatNum(r.raw.metalFrags)}</span>
            </div>
        `;
    }

    html += `</div>`;
    html += `<p style="font-size:0.7rem;color:var(--text-muted);text-align:center;margin-top:8px;">
        🟢 Green = cheapest sulfur cost &nbsp;|&nbsp; 🔴 Red = most expensive
    </p>`;

    comparisonContent.innerHTML = html;
}

function selectToolFromComparison(key) {
    state.selectedTool = key;
    updateUI();
    renderResults();
    renderComparison();
}

// ===== UI UPDATES =====
function updateUI() {
    // Wall buttons
    document.querySelectorAll('.wall-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.wall === state.selectedWall);
    });

    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.tool === state.selectedTool);
    });

    // Toggle sections
    if (!state.selectedTool) {
        resultsSection.style.display = 'none';
    }
}

// ===== EVENT LISTENERS =====
// Wall selection
document.querySelectorAll('.wall-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        state.selectedWall = btn.dataset.wall;
        // Don't reset tool, let user re-select
        updateUI();
        renderComparison();
        if (state.selectedTool) {
            renderResults();
        }
        // Scroll to tool section
        toolSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Tool selection
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!state.selectedWall) {
            // Auto-select stone as default if no wall selected
            state.selectedWall = 'stone';
            updateUI();
            renderComparison();
        }
        state.selectedTool = btn.dataset.tool;
        updateUI();
        renderResults();
        renderComparison();
    });
});

// Reset
resetBtn.addEventListener('click', () => {
    state.selectedWall = null;
    state.selectedTool = null;
    updateUI();
    resultsSection.style.display = 'none';
    renderComparison();
    totalSulfurEl.textContent = '0';
    totalMetalEl.textContent = '0';
    totalGPEl.textContent = '0';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== SPLASH SCREEN =====
window.addEventListener('load', () => {
    setTimeout(() => {
        splashEl.classList.add('hidden');
        appEl.style.display = 'block';
        setTimeout(() => {
            splashEl.style.display = 'none';
        }, 500);
    }, 1800);
});

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('[SW] Registered'))
        .catch(err => console.log('[SW] Registration failed:', err));
}