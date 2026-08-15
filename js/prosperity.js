document.addEventListener('DOMContentLoaded', () => {
    const dailyCounterElement = document.getElementById('dailyCounter');
    const prosperityTrigger = document.querySelector('.prosperity-container');
    const coinRainContainer = document.getElementById('coinRainContainer');
    const prosperityStatus = document.getElementById('prosperityStatus');
    const initialDate = new Date('2025-05-11T00:00:00');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let experiencePromise;
    let isShowerActive = false;
    let stopMagicalSound = () => {};

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

    function beginMagicalWhoosh() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return () => {};

        const context = new AudioContextClass();
        const now = context.currentTime;
        const duration = 3.1;
        const master = context.createGain();
        const filter = context.createBiquadFilter();
        const noise = context.createBufferSource();
        const noiseBuffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
        const samples = noiseBuffer.getChannelData(0);

        for (let index = 0; index < samples.length; index += 1) {
            const fade = Math.sin(Math.PI * index / samples.length);
            samples[index] = (Math.random() * 2 - 1) * fade;
        }

        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.12, now + 0.18);
        master.gain.exponentialRampToValueAtTime(0.035, now + 1.7);
        master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        filter.type = 'bandpass';
        filter.Q.value = 0.7;
        filter.frequency.setValueAtTime(260, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 1.15);
        filter.frequency.exponentialRampToValueAtTime(620, now + duration);
        noise.buffer = noiseBuffer;
        noise.connect(filter).connect(master).connect(context.destination);
        noise.start(now);
        noise.stop(now + duration);

        [880, 1320, 1760].forEach((frequency, index) => {
            const chime = context.createOscillator();
            const chimeGain = context.createGain();
            const start = now + 0.35 + index * 0.34;
            chime.type = 'sine';
            chime.frequency.setValueAtTime(frequency, start);
            chime.frequency.exponentialRampToValueAtTime(frequency * 1.08, start + 0.5);
            chimeGain.gain.setValueAtTime(0.0001, start);
            chimeGain.gain.exponentialRampToValueAtTime(0.035, start + 0.025);
            chimeGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);
            chime.connect(chimeGain).connect(context.destination);
            chime.start(start);
            chime.stop(start + 0.74);
        });

        let stopped = false;
        const stop = () => {
            if (stopped) return;
            stopped = true;
            const stopAt = context.currentTime;
            master.gain.cancelScheduledValues(stopAt);
            master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), stopAt);
            master.gain.exponentialRampToValueAtTime(0.0001, stopAt + 0.12);
            window.setTimeout(() => context.close().catch(() => {}), 180);
        };
        window.setTimeout(stop, duration * 1000 + 100);
        return stop;
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

        if (isShowerActive) {
            setStatus('The current prosperity batch is still settling. Please tap again in a moment.');
            return;
        }

        if (reducedMotion.matches) {
            renderAccessibleTreasure();
            return;
        }

        prosperityTrigger.classList.add('is-loading');
        setStatus('Preparing the prosperity treasure.');
        stopMagicalSound();
        stopMagicalSound = beginMagicalWhoosh();

        try {
            experiencePromise ||= import('./prosperity-3d.mjs');
            const { startProsperityShower } = await experiencePromise;
            coinRainContainer.classList.remove('prosperity-fallback');
            const result = startProsperityShower(coinRainContainer, {
                availableCount: count,
                onSettled: (settledCount) => {
                    isShowerActive = false;
                    stopMagicalSound();
                    stopMagicalSound = () => {};
                    const remaining = Math.max(0, count - settledCount);
                    setStatus(remaining
                        ? `${settledCount} of ${count} blessings collected. Tap again for the next batch.`
                        : `All ${count} prosperity blessings are gathered in the treasure pile.`);
                },
            });
            isShowerActive = result.releasedCount > 0;
            if (result.releasedCount) {
                const afterBatch = Math.min(count, result.collectedCount + result.releasedCount);
                setStatus(`Releasing ${result.releasedCount} blessings. ${afterBatch} of ${count} will be collected.`);
            } else {
                stopMagicalSound();
                setStatus(`All ${count} prosperity blessings are already gathered.`);
            }
        } catch (error) {
            isShowerActive = false;
            stopMagicalSound();
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
