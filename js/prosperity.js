document.addEventListener('DOMContentLoaded', () => {
    const dailyCounterElement = document.getElementById('dailyCounter');
    const prosperityTrigger = document.querySelector('.prosperity-container');
    const coinRainContainer = document.getElementById('coinRainContainer');
    const prosperityStatus = document.getElementById('prosperityStatus');
    const coinDropSound = new Audio('assets/sounds/coin_drop.mp3');
    const initialDate = new Date('2025-05-11T00:00:00');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let experiencePromise;
    let soundStopTimer = null;

    if (!dailyCounterElement || !prosperityTrigger || !coinRainContainer) {
        return;
    }

    function updateDailyCounter() {
        const now = new Date();
        const diffInDays = Math.floor((now - initialDate) / (1000 * 60 * 60 * 24));
        const count = Math.max(0, diffInDays);
        dailyCounterElement.textContent = count;
        return count;
    }

    function setStatus(message) {
        if (prosperityStatus) {
            prosperityStatus.textContent = message;
        }
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

    function renderAccessibleTreasure(reason = 'reduced-motion') {
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
        setStatus(reason === 'reduced-motion'
            ? 'A still prosperity treasure is shown because reduced motion is enabled.'
            : 'A still prosperity treasure is shown because 3D graphics are unavailable.');
    }

    async function startProsperity() {
        const count = updateDailyCounter();

        if (reducedMotion.matches) {
            renderAccessibleTreasure();
            return;
        }

        prosperityTrigger.classList.add('is-loading');
        setStatus('Preparing the prosperity treasure.');
        playCoinDropSound();

        try {
            experiencePromise ||= import('./prosperity-3d.mjs');
            const { startProsperityShower } = await experiencePromise;
            coinRainContainer.classList.remove('prosperity-fallback');
            const result = startProsperityShower(coinRainContainer, {
                availableCount: count,
                onSettled: (settledCount) => {
                    stopCoinDropSound();
                    const remaining = Math.max(0, count - settledCount);
                    setStatus(remaining
                        ? `${settledCount} of ${count} blessings collected. Tap again for the next batch.`
                        : `All ${count} prosperity blessings are gathered in the treasure pile.`);
                },
            });
            if (result.releasedCount) {
                const afterBatch = Math.min(count, result.committedCount);
                setStatus(`Releasing ${result.releasedCount} blessings. ${afterBatch} of ${count} will be collected.`);
            } else {
                stopCoinDropSound();
                setStatus(`All ${count} prosperity blessings are already gathered.`);
            }
        } catch (error) {
            stopCoinDropSound();
            console.warn('The 3D prosperity scene is unavailable; using the accessible fallback.');
            renderAccessibleTreasure('unavailable');
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

    updateDailyCounter();
});
