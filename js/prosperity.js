document.addEventListener('DOMContentLoaded', () => {
    const dailyCounterElement = document.getElementById('dailyCounter');
    const prosperityTrigger = document.querySelector('.prosperity-container');
    const coinRainContainer = document.getElementById('coinRainContainer');
    const coinDropSound = new Audio('assets/sounds/coin_drop.mp3');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let experiencePromise;
    let soundStopTimer = null;

    if (!dailyCounterElement || !prosperityTrigger || !coinRainContainer) {
        return;
    }

    function getDailyCount() {
        return EarnDailyCounter.getValue();
    }

    function showBatchProgress(batchCount, dailyCount) {
        dailyCounterElement.textContent = `${batchCount}/${dailyCount}`;
        dailyCounterElement.setAttribute(
            'aria-label',
            `${batchCount} of ${dailyCount} prosperity pieces in this batch`,
        );
    }

    function stopCoinDropSound() {
        if (soundStopTimer) {
            window.clearTimeout(soundStopTimer);
            soundStopTimer = null;
        }
        coinDropSound.pause();
        coinDropSound.currentTime = 0;
    }

    function playCoinDropSound() {
        stopCoinDropSound();
        coinDropSound.volume = 0.72;
        coinDropSound.play().catch(() => {});
        soundStopTimer = window.setTimeout(stopCoinDropSound, 3200);
    }

    function renderAccessibleTreasure() {
        const metals = ['gold', 'silver', 'copper', 'platinum'];
        const gems = ['diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz'];
        const fragment = document.createDocumentFragment();

        coinRainContainer.replaceChildren();
        coinRainContainer.classList.add('prosperity-fallback');

        for (let index = 0; index < 18; index += 1) {
            const piece = document.createElement('span');
            const isGem = index % 3 === 1;
            const variant = isGem ? gems[index % gems.length] : metals[index % metals.length];
            piece.className = `prosperity-fallback-piece ${isGem ? 'is-gem' : 'is-coin'} ${variant}`;
            piece.style.setProperty('--piece-index', index);
            piece.style.setProperty('--piece-bottom', `${8 + (index % 5) * 8}px`);
            piece.style.setProperty('--piece-rotation', `${-32 + (index * 29) % 64}deg`);
            piece.style.setProperty('--piece-scale', `${0.78 + (index % 4) * 0.08}`);
            piece.setAttribute('aria-hidden', 'true');
            fragment.appendChild(piece);
        }

        coinRainContainer.appendChild(fragment);
    }

    async function startProsperity() {
        const count = getDailyCount();

        if (reducedMotion.matches) {
            renderAccessibleTreasure();
            return;
        }

        prosperityTrigger.classList.add('is-loading');
        playCoinDropSound();

        try {
            experiencePromise ||= import('./prosperity-3d.mjs');
            const { startProsperityShower } = await experiencePromise;
            coinRainContainer.classList.remove('prosperity-fallback');
            const result = startProsperityShower(coinRainContainer, {
                availableCount: count,
                onSettled: () => {
                    stopCoinDropSound();
                },
            });
            if (result.releasedCount) {
                showBatchProgress(result.releasedCount, count);
            } else {
                stopCoinDropSound();
                showBatchProgress(count, count);
            }
        } catch (error) {
            stopCoinDropSound();
            console.warn('The 3D prosperity scene is unavailable; using the accessible fallback.');
            renderAccessibleTreasure();
        } finally {
            prosperityTrigger.classList.remove('is-loading');
        }
    }

    prosperityTrigger.addEventListener('click', startProsperity);
    prosperityTrigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            startProsperity();
        }
    });

    const dailyCount = getDailyCount();
    dailyCounterElement.textContent = dailyCount;
    dailyCounterElement.setAttribute('aria-label', `${dailyCount} prosperity pieces available today`);
});
