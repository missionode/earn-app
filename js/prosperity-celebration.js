(function exposeProsperityCelebration(global) {
    const REDIRECT_TIMEOUT_MS = 12000;

    async function play({container, count, onComplete}) {
        let sound = null;
        let soundTimer = null;
        const finish = (() => {
            let finished = false;
            return () => {
                if (finished) return;
                finished = true;
                if (soundTimer) global.clearTimeout(soundTimer);
                if (sound) {
                    sound.pause();
                    sound.currentTime = 0;
                }
                onComplete();
            };
        })();

        if (!container || !Number.isFinite(count) || count < 1) {
            finish();
            return;
        }

        const fallbackTimer = global.setTimeout(finish, REDIRECT_TIMEOUT_MS);
        try {
            sound = new Audio('assets/sounds/coin_drop.mp3');
            sound.volume = 0.72;
            sound.play().catch(() => {});
            soundTimer = global.setTimeout(() => {
                sound.pause();
                sound.currentTime = 0;
            }, 3200);
            const {startProsperityShower} = await import('./prosperity-3d.mjs');
            startProsperityShower(container, {
                availableCount: Math.floor(count),
                releaseAll: true,
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
