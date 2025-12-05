// ==================== DOM Elements ====================
const spinBtn = document.getElementById('spin-btn');
const finalResult = document.getElementById('final-result');
const resultGrid = document.getElementById('result-grid');

// Spinner configurations
const spinnerConfigs = [
    { id: 'spinner-hero', resultId: 'result-hero', data: GAME_DATA.heroes, label: '英雄' },
    { id: 'spinner-fskill', resultId: 'result-fskill', data: GAME_DATA.fSkills, label: 'F技能' },
    { id: 'spinner-ult', resultId: 'result-ult', data: GAME_DATA.ultimates, label: '大招' },
    { id: 'spinner-melee', resultId: 'result-melee', data: GAME_DATA.meleeWeapons, label: '近战武器' },
    { id: 'spinner-ranged', resultId: 'result-ranged', data: GAME_DATA.rangedWeapons, label: '远程武器' }
];

// State
let isSpinning = false;
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 4;
const SPIN_DURATION = 4000; // Total spin time in ms
const SPIN_STAGES = [
    { duration: 1000, interval: 30 },  // Fast
    { duration: 1500, interval: 60 },  // Medium
    { duration: 1000, interval: 120 }, // Slow
    { duration: 500, interval: 200 }   // Very slow
];

// ==================== Initialize Spinners ====================
function initSpinners() {
    spinnerConfigs.forEach(config => {
        const spinner = document.getElementById(config.id);
        const inner = spinner.querySelector('.spinner-inner');

        // Create enough items for seamless scrolling (repeat data 5 times)
        const repeatedData = [...config.data, ...config.data, ...config.data, ...config.data, ...config.data];

        inner.innerHTML = repeatedData.map(item =>
            `<div class="spinner-item">${item}</div>`
        ).join('');

        // Add highlight indicator
        const highlight = document.createElement('div');
        highlight.className = 'spinner-highlight';
        spinner.appendChild(highlight);

        // Center the spinner initially
        const offset = -(config.data.length * 2 * ITEM_HEIGHT) + (VISIBLE_ITEMS / 2 * ITEM_HEIGHT) - (ITEM_HEIGHT / 2);
        inner.style.transform = `translateY(${offset}px)`;
    });
}

// ==================== Spin Logic ====================
function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function spinAll() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.querySelector('.btn-text').textContent = '抽取中...';
    finalResult.classList.remove('show');

    // Reset result displays
    spinnerConfigs.forEach(config => {
        const resultDisplay = document.getElementById(config.resultId);
        resultDisplay.textContent = '?';
        resultDisplay.classList.remove('active');
    });

    const results = [];
    let completedSpinners = 0;

    spinnerConfigs.forEach((config, index) => {
        // Stagger the stop times for each spinner
        const staggerDelay = index * 400;
        const targetItem = getRandomItem(config.data);
        results.push({ label: config.label, value: targetItem });

        spinSingleWheel(config, targetItem, staggerDelay, () => {
            completedSpinners++;
            if (completedSpinners === spinnerConfigs.length) {
                showFinalResults(results);
                isSpinning = false;
                spinBtn.disabled = false;
                spinBtn.querySelector('.btn-text').textContent = '再来一次';
            }
        });
    });
}

function spinSingleWheel(config, targetItem, staggerDelay, onComplete) {
    const spinner = document.getElementById(config.id);
    const inner = spinner.querySelector('.spinner-inner');
    const resultDisplay = document.getElementById(config.resultId);

    const dataLength = config.data.length;
    const targetIndex = config.data.indexOf(targetItem);

    // Calculate final position
    // We want to land on an item in the "middle" repeated section
    const baseOffset = dataLength * 2; // Start from middle section
    const finalItemIndex = baseOffset + targetIndex;

    // Center offset calculation
    const centerOffset = (VISIBLE_ITEMS / 2 * ITEM_HEIGHT) - (ITEM_HEIGHT / 2);
    const finalPosition = -(finalItemIndex * ITEM_HEIGHT) + centerOffset;

    let currentPosition = parseFloat(inner.style.transform.replace(/translateY\((.*)px\)/, '$1')) || 0;
    let accumulatedTime = 0;

    // Animation using stages
    let stageIndex = 0;
    let lastUpdate = 0;

    setTimeout(() => {
        // Add visual spinning effect
        spinner.classList.add('spinning');

        const startTime = performance.now();

        function animate(timestamp) {
            const elapsed = timestamp - startTime;

            if (elapsed >= SPIN_DURATION) {
                // Finalize position
                spinner.classList.remove('spinning');
                inner.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
                inner.style.transform = `translateY(${finalPosition}px)`;

                // Show result after animation
                setTimeout(() => {
                    inner.style.transition = '';
                    resultDisplay.textContent = targetItem;
                    resultDisplay.classList.add('active');

                    // Add a nice bounce effect
                    resultDisplay.style.animation = 'none';
                    resultDisplay.offsetHeight; // Trigger reflow
                    resultDisplay.style.animation = 'bounceIn 0.5s ease';

                    onComplete();
                }, 500);
                return;
            }

            // Determine current stage based on elapsed time
            let stageTime = 0;
            for (let i = 0; i < SPIN_STAGES.length; i++) {
                if (elapsed < stageTime + SPIN_STAGES[i].duration) {
                    stageIndex = i;
                    break;
                }
                stageTime += SPIN_STAGES[i].duration;
            }

            const currentStage = SPIN_STAGES[stageIndex];

            // Update position based on interval
            if (timestamp - lastUpdate >= currentStage.interval) {
                lastUpdate = timestamp;
                currentPosition -= ITEM_HEIGHT;

                // Reset position for infinite scroll effect
                const resetThreshold = -(dataLength * 4 * ITEM_HEIGHT);
                if (currentPosition < resetThreshold) {
                    currentPosition += dataLength * ITEM_HEIGHT;
                }

                inner.style.transform = `translateY(${currentPosition}px)`;
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);

    }, staggerDelay);
}

function showFinalResults(results) {
    resultGrid.innerHTML = results.map(r => `
        <div class="result-item">
            <span class="result-item-label">${r.label}</span>
            <span class="result-item-value">${r.value}</span>
        </div>
    `).join('');

    setTimeout(() => {
        finalResult.classList.add('show');
    }, 300);
}

// ==================== Add bounce animation ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes bounceIn {
        0% { transform: scale(0.8); opacity: 0.5; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);

// ==================== Event Listeners ====================
spinBtn.addEventListener('click', spinAll);

// ==================== Initialize ====================
initSpinners();
