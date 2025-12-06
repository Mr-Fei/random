// ==================== DOM Elements ====================
const spinBtn = document.getElementById('spin-btn');
const finalResult = document.getElementById('final-result');
const resultGrid = document.getElementById('result-grid');
const mainTitle = document.getElementById('main-title');
const editTitleBtn = document.getElementById('edit-title-btn');
const titleEditContainer = document.getElementById('title-edit-container');
const titleInput = document.getElementById('title-input');
const saveTitleBtn = document.getElementById('save-title-btn');
const cancelTitleBtn = document.getElementById('cancel-title-btn');
const resetTitleBtn = document.getElementById('reset-title-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.querySelector('.close-modal');
const resetSettingsBtn = document.getElementById('reset-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContentContainer = document.querySelector('.tab-content-container');

// ==================== Constants & Config ====================
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 4;
const SPIN_DURATION = 4000; 
const DEFAULT_TITLE = "克烈无间";

const SPINNER_CONFIG = {
    'spinner-hero': { key: 'heroes', label: '英雄', resultId: 'result-hero', wrapperId: 'wrapper-hero' },
    'spinner-fskill': { key: 'fSkills', label: 'F技能', resultId: 'result-fskill', wrapperId: 'wrapper-fskill' },
    'spinner-ult': { key: 'ultimates', label: '大招', resultId: 'result-ult', wrapperId: 'wrapper-ult' },
    'spinner-melee': { key: 'meleeWeapons', label: '近战武器', resultId: 'result-melee', wrapperId: 'wrapper-melee' },
    'spinner-ranged': { key: 'rangedWeapons', label: '远程武器', resultId: 'result-ranged', wrapperId: 'wrapper-ranged' }
};

// ==================== Weights System ====================
let WEIGHTS = {};

function initWeights() {
    const stored = localStorage.getItem('kled_random_weights');
    if (stored) {
        try {
            WEIGHTS = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to load weights', e);
        }
    }
    
    // Ensure structure and default values
    let updated = false;
    const dataKeys = ['heroes', 'fSkills', 'ultimates', 'meleeWeapons', 'rangedWeapons'];
    
    dataKeys.forEach(key => {
        if (!WEIGHTS[key]) {
            WEIGHTS[key] = {};
            updated = true;
        }
        
        GAME_DATA[key].forEach(item => {
            if (WEIGHTS[key][item] === undefined) {
                WEIGHTS[key][item] = 100;
                updated = true;
            }
        });
    });
    
    if (updated) saveWeights();
}

function saveWeights() {
    localStorage.setItem('kled_random_weights', JSON.stringify(WEIGHTS));
}

function getWeightedRandomItem(items, dataKey) {
    // If no key or no weights for this key, return uniform random
    if (!dataKey || !WEIGHTS[dataKey]) return items[Math.floor(Math.random() * items.length)];
    
    // Physics-based weight calculation
    const randomConfig = State.randomConfig || {
        baseWeightMultiplier: 3,
        quadraticCorrection: false,
        seed: null
    };

    let totalWeight = 0;
    const weights = new Array(items.length);

    for (let i = 0; i < items.length; i++) {
        let w = WEIGHTS[dataKey][items[i]] !== undefined ? WEIGHTS[dataKey][items[i]] : 100;
        
        // Apply quadratic correction if enabled
        if (randomConfig.quadraticCorrection) {
            w = (w * w) / 100;
        }
        
        // Apply base multiplier
        w = w * randomConfig.baseWeightMultiplier;
        
        weights[i] = w;
        totalWeight += w;
    }
    
    if (totalWeight <= 0) return items[Math.floor(Math.random() * items.length)];
    
    // Use seed if available (simple implementation)
    let randomVal;
    if (randomConfig.seed !== null && randomConfig.seed !== undefined) {
        // Simple seeded random
        const x = Math.sin(randomConfig.seed++) * 10000;
        randomVal = (x - Math.floor(x)) * totalWeight;
    } else {
        randomVal = Math.random() * totalWeight;
    }
    
    for (let i = 0; i < items.length; i++) {
        if (randomVal < weights[i]) return items[i];
        randomVal -= weights[i];
    }
    
    return items[items.length - 1];
}

function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        padding: 15px;
        border: 1px solid #d4af37;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        font-size: 12px;
        display: none;
    `;
    
    panel.innerHTML = `
        <h3 style="margin-bottom: 10px; color: #d4af37;">🎲 随机算法参数</h3>
        
        <div style="margin-bottom: 8px;">
            <label>基础权重倍率 (1-10)</label>
            <input type="range" min="1" max="10" step="0.5" value="3" id="debug-weight-mult">
            <span id="debug-weight-mult-val">3</span>
        </div>
        
        <div style="margin-bottom: 8px;">
            <label>
                <input type="checkbox" id="debug-quad"> 二次曲线修正
            </label>
        </div>
        
        <button id="debug-save-preset" style="margin-top: 10px; background: #d4af37; border: none; padding: 5px 10px; cursor: pointer;">保存预设</button>
    `;
    
    document.body.appendChild(panel);
    
    // Bind events
    document.getElementById('debug-weight-mult').addEventListener('input', (e) => {
        if (!State.randomConfig) State.randomConfig = {};
        State.randomConfig.baseWeightMultiplier = parseFloat(e.target.value);
        document.getElementById('debug-weight-mult-val').textContent = e.target.value;
    });
    
    document.getElementById('debug-quad').addEventListener('change', (e) => {
        if (!State.randomConfig) State.randomConfig = {};
        State.randomConfig.quadraticCorrection = e.target.checked;
    });
    
    document.getElementById('debug-save-preset').addEventListener('click', () => {
        State.save();
        alert('预设已保存！');
    });
    
    // Toggle button for debug panel
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '🔧';
    toggleBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #333;
        border: 1px solid #d4af37;
        color: #d4af37;
        cursor: pointer;
        z-index: 10001;
    `;
    toggleBtn.onclick = () => {
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'block' : 'none';
        toggleBtn.style.right = isHidden ? '240px' : '20px';
    };
    document.body.appendChild(toggleBtn);
}

initWeights();

const SPIN_STAGES = [
    { duration: 1000, interval: 30 },
    { duration: 1500, interval: 60 },
    { duration: 1000, interval: 120 },
    { duration: 500, interval: 200 }
];

// ==================== State Management ====================
const State = {
    title: DEFAULT_TITLE,
    disabledCategories: [], // Array of spinner IDs
    disabledItems: {}, // Object: { 'heroes': ['Name1', 'Name2'], ... }
    
    load() {
        const saved = localStorage.getItem('randomGeneratorState');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.title = parsed.title || DEFAULT_TITLE;
            this.disabledCategories = parsed.disabledCategories || [];
            this.disabledItems = parsed.disabledItems || {};
            this.randomConfig = parsed.randomConfig || {
                baseWeightMultiplier: 3,
                quadraticCorrection: true,
                seed: null
            };
        }
        // Initialize disabledItems keys if missing
        Object.values(SPINNER_CONFIG).forEach(config => {
            if (!this.disabledItems[config.key]) {
                this.disabledItems[config.key] = [];
            }
        });
        
        // Default random config if not loaded
        if (!this.randomConfig) {
            this.randomConfig = {
                baseWeightMultiplier: 3,
                quadraticCorrection: true,
                seed: null
            };
        }
    },

    save() {
        localStorage.setItem('randomGeneratorState', JSON.stringify({
            title: this.title,
            disabledCategories: this.disabledCategories,
            disabledItems: this.disabledItems,
            randomConfig: this.randomConfig
        }));
    },

    reset() {
        this.title = DEFAULT_TITLE;
        this.disabledCategories = [];
        this.disabledItems = {};
        this.randomConfig = {
            baseWeightMultiplier: 3,
            quadraticCorrection: true,
            seed: null
        };
        Object.values(SPINNER_CONFIG).forEach(config => {
            this.disabledItems[config.key] = [];
        });
        this.save();
        this.load(); // Reload to ensure consistency
    }
};

// ==================== Initialization ====================
function init() {
    State.load();
    updateUI();
    initSpinners();
    bindEvents();
    bindWeightEvents();
    // createDebugPanel(); // Hidden as requested
}

function updateUI() {
    // Update Title
    mainTitle.textContent = State.title;
    document.title = `${State.title} - 随机挑战生成器`;
    titleInput.value = State.title;

    // Update Category Toggles
    document.querySelectorAll('.toggle-switch input').forEach(input => {
        const targetId = input.dataset.target;
        input.checked = !State.disabledCategories.includes(targetId);
        updateCategoryVisuals(targetId, input.checked);
    });
}

function updateCategoryVisuals(spinnerId, isEnabled) {
    const config = SPINNER_CONFIG[spinnerId];
    const wrapper = document.getElementById(config.wrapperId);
    const miniBtn = wrapper.querySelector('.mini-spin-btn');
    
    if (isEnabled) {
        wrapper.classList.remove('disabled');
        miniBtn.disabled = false;
    } else {
        wrapper.classList.add('disabled');
        miniBtn.disabled = true;
    }
}

function getActiveItems(dataKey) {
    const allItems = GAME_DATA[dataKey];
    const disabled = State.disabledItems[dataKey] || [];
    return allItems.filter(item => !disabled.includes(item));
}

function initSpinners() {
    Object.entries(SPINNER_CONFIG).forEach(([id, config]) => {
        const spinner = document.getElementById(id);
        const inner = spinner.querySelector('.spinner-inner');
        const activeItems = getActiveItems(config.key);

        // Clear existing content
        inner.innerHTML = '';

        if (activeItems.length === 0) {
            inner.innerHTML = '<div class="spinner-item">无选项</div>';
            return;
        }

        // Create enough items for seamless scrolling
        // If items are few, repeat more times
        const minItems = 150; // Increased for smoother long spins
        let repeatedData = [...activeItems];
        while (repeatedData.length < minItems) {
            repeatedData = [...repeatedData, ...activeItems];
        }

        inner.innerHTML = repeatedData.map(item =>
            `<div class="spinner-item">${item}</div>`
        ).join('');

        // Add highlight indicator if not exists
        if (!spinner.querySelector('.spinner-highlight')) {
            const highlight = document.createElement('div');
            highlight.className = 'spinner-highlight';
            spinner.appendChild(highlight);
        }

        // Center the spinner initially
        // We start at a position that aligns with an item
        // Center offset: (VISIBLE_ITEMS / 2 * ITEM_HEIGHT) - (ITEM_HEIGHT / 2) = (2 * 50) - 25 = 75px
        // Initial transform needs to align an item to this center
        // Let's just set it to a reasonable negative value
        const startOffset = -(activeItems.length * ITEM_HEIGHT) + 75;
        inner.style.transform = `translateY(${startOffset}px)`;
    });
}

// ==================== Event Binding ====================
function bindEvents() {
    // Title Editing
    editTitleBtn.addEventListener('click', () => {
        titleEditContainer.style.display = 'flex';
        editTitleBtn.style.display = 'none';
        mainTitle.style.display = 'none';
        titleInput.focus();
    });

    saveTitleBtn.addEventListener('click', () => {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
            State.title = newTitle;
            State.save();
            updateUI();
        }
        closeTitleEdit();
    });

    cancelTitleBtn.addEventListener('click', closeTitleEdit);

    resetTitleBtn.addEventListener('click', () => {
        if(confirm('确定要重置标题为默认值吗？')) {
            State.title = DEFAULT_TITLE;
            State.save();
            updateUI();
            closeTitleEdit();
        }
    });

    function closeTitleEdit() {
        titleEditContainer.style.display = 'none';
        editTitleBtn.style.display = 'inline-block';
        mainTitle.style.display = 'block';
    }

    // Category Toggles
    document.querySelectorAll('.toggle-switch input').forEach(input => {
        input.addEventListener('change', (e) => {
            const targetId = e.target.dataset.target;
            const isEnabled = e.target.checked;
            
            if (isEnabled) {
                State.disabledCategories = State.disabledCategories.filter(id => id !== targetId);
            } else {
                if (!State.disabledCategories.includes(targetId)) {
                    State.disabledCategories.push(targetId);
                }
            }
            State.save();
            updateCategoryVisuals(targetId, isEnabled);
        });
    });

    // Mini Spin Buttons
    document.querySelectorAll('.mini-spin-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            spin([targetId]);
        });
    });

    // Main Spin Button
    spinBtn.addEventListener('click', () => {
        const enabledSpinners = Object.keys(SPINNER_CONFIG).filter(id => !State.disabledCategories.includes(id));
        if (enabledSpinners.length === 0) {
            alert('请至少启用一个随机选项！');
            return;
        }
        spin(enabledSpinners, true);
    });

    // Settings Modal
    settingsBtn.addEventListener('click', () => {
        renderSettingsTab('heroes'); // Default tab
        settingsModal.classList.add('show');
    });

    closeModalBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });

    // Map tab data-tab to config keys
    const tabMap = {
        'hero': 'heroes',
        'fskill': 'fSkills',
        'ult': 'ultimates',
        'melee': 'meleeWeapons',
        'ranged': 'rangedWeapons'
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tabKey = tabMap[btn.dataset.tab];
            renderSettingsTab(tabKey);
        });
    });

    resetSettingsBtn.addEventListener('click', () => {
        if(confirm('确定要重置所有设置吗？这将恢复所有选项和标题。')) {
            State.reset();
            updateUI();
            initSpinners();
            settingsModal.classList.remove('show');
        }
    });

    saveSettingsBtn.addEventListener('click', () => {
        // Collect all unchecked items in the current tab? 
        // No, we should update state immediately on checkbox change or collect all on save.
        // Let's do immediate state update on checkbox change for simplicity in this logic,
        // but since we have a "Save" button, users expect it to only save then.
        // However, switching tabs would lose unsaved changes if we don't use a temp state.
        // Simplest: Update State directly on checkbox change, "Save" just closes modal and re-inits spinners.
        // "Reset" is global reset.
        
        initSpinners(); // Re-init to reflect disabled items
        settingsModal.classList.remove('show');
    });
}

function renderSettingsTab(dataKey) {
    const allItems = GAME_DATA[dataKey];
    const disabled = State.disabledItems[dataKey] || [];

    tabContentContainer.innerHTML = `
        <div class="items-grid">
            ${allItems.map(item => {
                const isChecked = !disabled.includes(item);
                return `
                    <label class="item-checkbox-label">
                        <input type="checkbox" value="${item}" data-key="${dataKey}" ${isChecked ? 'checked' : ''}>
                        ${item}
                    </label>
                `;
            }).join('')}
        </div>
    `;

    // Bind checkbox events
    tabContentContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            const item = e.target.value;
            const checked = e.target.checked;

            if (checked) {
                // Remove from disabled
                State.disabledItems[key] = State.disabledItems[key].filter(i => i !== item);
            } else {
                // Add to disabled
                if (!State.disabledItems[key].includes(item)) {
                    State.disabledItems[key].push(item);
                }
            }
            State.save();
        });
    });
}

// ==================== Spin Logic ====================
let isSpinning = false;

function spin(spinnerIds, isMainSpin = false) {
    if (isSpinning) return;
    
    // Check if any target has no items
    const validSpinners = spinnerIds.filter(id => {
        const config = SPINNER_CONFIG[id];
        const activeItems = getActiveItems(config.key);
        return activeItems.length > 0;
    });

    if (validSpinners.length === 0) {
        if (isMainSpin) alert('没有可用的选项！');
        return;
    }

    isSpinning = true;
    if (isMainSpin) {
        spinBtn.disabled = true;
        spinBtn.querySelector('.btn-text').textContent = '抽取中...';
        finalResult.classList.remove('show');
    } else {
        // Disable specific mini buttons
        validSpinners.forEach(id => {
            const wrapper = document.getElementById(SPINNER_CONFIG[id].wrapperId);
            wrapper.querySelector('.mini-spin-btn').disabled = true;
        });
    }

    // Reset displays for involved spinners
    validSpinners.forEach(id => {
        const config = SPINNER_CONFIG[id];
        const resultDisplay = document.getElementById(config.resultId);
        resultDisplay.textContent = '?';
        resultDisplay.classList.remove('active');
    });

    let completedCount = 0;
    const results = [];

    validSpinners.forEach((id, index) => {
        const config = SPINNER_CONFIG[id];
        const activeItems = getActiveItems(config.key);
        
        // Independent Random Algorithm
        // We use crypto.getRandomValues for better randomness if available, 
        // but Math.random is sufficient for this game. 
        // To ensure isolation, each spin is a separate event.
        const targetItem = getWeightedRandomItem(activeItems, config.key);
        
        results.push({ label: config.label, value: targetItem });

        const staggerDelay = isMainSpin ? index * 200 : 0;

        spinSingleWheel(id, targetItem, activeItems, staggerDelay, () => {
            completedCount++;
            if (completedCount === validSpinners.length) {
                isSpinning = false;
                
                if (isMainSpin) {
                        spinBtn.disabled = false;
                        spinBtn.querySelector('.btn-text').textContent = '再来一次';
                        showFinalResults(results); // This might only show subset if some categories disabled
                    } else {
                     validSpinners.forEach(vid => {
                        const wrapper = document.getElementById(SPINNER_CONFIG[vid].wrapperId);
                        wrapper.querySelector('.mini-spin-btn').disabled = false;
                    });
                    // Update final result if it's already visible
                    if (finalResult.classList.contains('show')) {
                        updateFinalResults();
                    }
                }
            }
        });
    });
}

function spinSingleWheel(spinnerId, targetItem, activeItems, delay, onComplete) {
    const spinner = document.getElementById(spinnerId);
    const inner = spinner.querySelector('.spinner-inner');
    const config = SPINNER_CONFIG[spinnerId];
    const resultDisplay = document.getElementById(config.resultId);

    // We need to find the position of the target item
    // Since we have repeated data, we want to land on a "middle" one to allow spinning
    // We reconstructed the HTML in initSpinners with [repeated...]
    // Let's find a random occurrence of targetItem in the middle of the list
    
    const itemNodes = Array.from(inner.children);
    const indices = itemNodes.map((node, idx) => node.textContent === targetItem ? idx : -1).filter(i => i !== -1);
    
    // Pick an index that is far enough down to spin for a while
    // Ideally somewhere in the middle-end
    const targetIndex = indices[Math.floor(indices.length * 0.7)]; 

    // Calculate target position
    // Center offset is 75px (calculated in init)
    const centerOffset = 75;
    const finalPosition = -(targetIndex * ITEM_HEIGHT) + centerOffset;

    setTimeout(() => {
        spinner.classList.add('spinning');
        const startTime = performance.now();
        // Initial position
        let startPos = parseFloat(inner.style.transform.replace(/translateY\((.*)px\)/, '$1')) || 0;
        
        // Speed: px per second. 1200 px/s = 20 px/frame at 60fps
        const speed = 1200; 
        const totalHeight = itemNodes.length * ITEM_HEIGHT;

        function animate(timestamp) {
            const elapsed = timestamp - startTime;

            if (elapsed >= SPIN_DURATION) {
                // Stop
                spinner.classList.remove('spinning');
                inner.style.transition = 'transform 1.5s cubic-bezier(0.1, 0.9, 0.2, 1)'; // Ease out
                inner.style.transform = `translateY(${finalPosition}px)`;

                setTimeout(() => {
                    inner.style.transition = '';
                    resultDisplay.textContent = targetItem;
                    resultDisplay.classList.add('active');
                    
                    // Trigger bounce
                    resultDisplay.style.animation = 'none';
                    resultDisplay.offsetHeight; 
                    resultDisplay.style.animation = 'bounceIn 0.5s ease';

                    onComplete();
                }, 1500);
                return;
            }

            // Time-based position update
            // distance = speed * time
            const distance = speed * (elapsed / 1000);
            let currentPos = startPos - distance;

            // Infinite scroll reset logic
            // If we go too far, reset to a higher position that matches visually
            if (-currentPos > totalHeight / 2) {
                const jump = totalHeight / 3;
                startPos += jump;
                currentPos += jump;
            }

            inner.style.transform = `translateY(${currentPos}px)`;
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }, delay);
}

function updateFinalResults() {
    const enabledCategories = Object.keys(SPINNER_CONFIG).filter(id => !State.disabledCategories.includes(id));
    
    const finalData = enabledCategories.map(id => {
        const config = SPINNER_CONFIG[id];
        const val = document.getElementById(config.resultId).textContent;
        return { label: config.label, value: val === '?' ? '未抽取' : val };
    });

    resultGrid.innerHTML = finalData.map(r => `
        <div class="result-item">
            <span class="result-item-label">${r.label}</span>
            <span class="result-item-value">${r.value}</span>
        </div>
    `).join('');
}

function showFinalResults(results) {
    updateFinalResults();
    finalResult.classList.add('show');
}

// ==================== Start ====================
init();

// ==================== Weight UI Logic ====================
function bindWeightEvents() {
    const weightBtn = document.getElementById('weight-settings-btn');
    const weightModal = document.getElementById('weight-settings-modal');
    const closeWeightModal = document.getElementById('close-weight-modal');
    const weightTabs = document.getElementById('weight-tabs');
    const saveWeightsBtn = document.getElementById('save-weights-btn');
    const resetWeightsBtn = document.getElementById('reset-weights-btn');
    
    // Base Weight Multiplier Logic
    const baseWeightMultInput = document.getElementById('base-weight-mult');
    const baseWeightMultVal = document.getElementById('base-weight-mult-val');

    if (baseWeightMultInput) {
        // Initialize value
        if (State.randomConfig) {
             baseWeightMultInput.value = State.randomConfig.baseWeightMultiplier || 3;
             if (baseWeightMultVal) baseWeightMultVal.textContent = baseWeightMultInput.value;
        }

        baseWeightMultInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (baseWeightMultVal) baseWeightMultVal.textContent = val;
            
            if (!State.randomConfig) State.randomConfig = {};
            State.randomConfig.baseWeightMultiplier = val;
            State.save();
        });
    }

    if (weightBtn) {
        weightBtn.addEventListener('click', () => {
            weightModal.classList.add('show');
            renderWeightTab('heroes');
        });
    }

    if (closeWeightModal) {
        closeWeightModal.addEventListener('click', () => {
            weightModal.classList.remove('show');
        });
    }

    if (saveWeightsBtn) {
        saveWeightsBtn.addEventListener('click', () => {
            weightModal.classList.remove('show');
        });
    }

    if (resetWeightsBtn) {
        resetWeightsBtn.addEventListener('click', () => {
             if(confirm('确定要重置所有权重为默认值(100)吗？')) {
                resetAllWeights();
            }
        });
    }

    if (weightTabs) {
        weightTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                weightTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                const tabKey = e.target.dataset.tab;
                renderWeightTab(tabKey);
            }
        });
    }
    
    if (weightModal) {
         weightModal.addEventListener('click', (e) => {
            if (e.target === weightModal) weightModal.classList.remove('show');
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && weightModal && weightModal.classList.contains('show')) {
            weightModal.classList.remove('show');
        }
    });
}

let currentWeightTabKey = 'heroes';

function renderWeightTab(key) {
    currentWeightTabKey = key;
    const content = document.getElementById('weight-tab-content');
    if (!content) return;
    
    const items = GAME_DATA[key];
    content.innerHTML = `<div class="items-grid">
        ${items.map(item => {
            const weight = WEIGHTS[key][item] !== undefined ? WEIGHTS[key][item] : 100;
            return `
                <div class="weight-item">
                    <div class="weight-header">
                        <span class="weight-label">${item}</span>
                        <span class="weight-value" id="val-${key}-${item}">${weight}</span>
                    </div>
                    <div class="weight-slider-container">
                        <input type="range" min="0" max="200" step="0.1" value="${weight}" 
                            class="weight-slider" 
                            oninput="updateWeightValue('${key}', '${item}', this.value)">
                    </div>
                </div>
            `;
        }).join('')}
    </div>`;
}

window.updateWeightValue = function(key, item, value) {
    const floatVal = Math.round(parseFloat(value) * 10) / 10;
    if (!WEIGHTS[key]) WEIGHTS[key] = {};
    WEIGHTS[key][item] = floatVal;
    
    const display = document.getElementById(`val-${key}-${item}`);
    if (display) display.textContent = floatVal;
    
    saveWeights();
};

function resetAllWeights() {
    const keys = ['heroes', 'fSkills', 'ultimates', 'meleeWeapons', 'rangedWeapons'];
    keys.forEach(key => {
        if (!WEIGHTS[key]) WEIGHTS[key] = {};
        GAME_DATA[key].forEach(item => {
            WEIGHTS[key][item] = 100;
        });
    });
    saveWeights();
    renderWeightTab(currentWeightTabKey);
}
