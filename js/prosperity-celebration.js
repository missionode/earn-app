(function exposeProsperityCelebration(global) {
    const SPAWN_INTERVAL_MS = 8;
    const HARD_SETTLEMENT_GRACE_MS = 25000;

    async function play({container, count, onComplete}) {
        let sound = null;
        let soundStopped = false;
        const stopSound = () => {
            if (soundStopped) return;
            soundStopped = true;
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        };
        const finish = (() => {
            let finished = false;
            return () => {
                if (finished) return;
                finished = true;
                stopSound();
                onComplete();
            };
        })();

        if (!container || !Number.isFinite(count) || count < 1) {
            finish();
            return;
        }

        const pieceCount = Math.floor(count);
        const completionTimeout = Math.max(
            12000,
            Math.max(0, pieceCount - 1) * SPAWN_INTERVAL_MS +
                HARD_SETTLEMENT_GRACE_MS,
        );
        const fallbackTimer = global.setTimeout(finish, completionTimeout);
        try {
            sound = new Audio('assets/sounds/coin_drop.mp3');
            sound.volume = 0.72;
            sound.loop = true;
            sound.play().catch(() => {});
            const {startProsperityShower} = await import('./prosperity-3d.mjs');
            startProsperityShower(container, {
                availableCount: pieceCount,
                releaseAll: true,
                onVisuallySettled: stopSound,
                onSettled: () => {
                    global.clearTimeout(fallbackTimer);
                    finish();
                },
            });
        } catch (error) {
            global.clearTimeout(fallbackTimer);
            finish();
        }
    }

    global.EarnProsperityCelebration = Object.freeze({play});
})(typeof window === 'undefined' ? globalThis : window);
