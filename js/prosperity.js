document.addEventListener('DOMContentLoaded', () => {
    const dailyCounterElement = document.getElementById('dailyCounter');
    const coinRainTrigger = document.getElementById('coinRainTrigger');
    const coinRainContainer = document.getElementById('coinRainContainer');
    const coinsFolder = 'assets/coins/';
    const audioFolder = 'assets/sounds/'; // Assuming you put the sound in an 'assets/sounds' folder
    const coinDropSound = new Audio(`${audioFolder}coin_drop.mp3`); // Create an Audio object
    const initialDate = new Date('2025-01-17'); // Hardcoded start date
    const coinImages = [
        'gold_coin_1.png',
        'gold_coin_2.png',
        'gold_coin_3.png',
        'gold_coin_4.png',
        'gold_coin_5.png',
        'gold_coin_6.png',
        'gold_coin_7.png'
        // Add ALL your coin image filenames here
    ];
    const animationSpeed = 5; // Adjust for faster/slower speed (higher is faster)

    function updateDailyCounter() {
        const now = new Date();
        const diffInDays = Math.floor((now - initialDate) / (1000 * 60 * 60 * 24));
        const count = diffInDays >= 0 ? diffInDays : 0;
        dailyCounterElement.textContent = count;
        return count;
    }

    function getRandomCoinImage() {
        if (!coinImages || coinImages.length === 0) {
            console.error('Error: No coin images defined in coinImages array.');
            return '';
        }
        const randomIndex = Math.floor(Math.random() * coinImages.length);
        const imageUrl = coinsFolder + coinImages[randomIndex];
        console.log('Getting random coin image:', imageUrl);
        return imageUrl;
    }

    function createCoin() {
        const imageUrl = getRandomCoinImage();
        if (!imageUrl) {
            return null;
        }

        const coin = document.createElement('img');
        coin.src = imageUrl;
        coin.classList.add('coin');
        coin.style.width = '25px';
        coin.style.height = '25px';
        coin.style.position = 'absolute';
        coin.style.top = `-${Math.random() * 50 + 30}px`; // Start coins above the viewport
        coin.style.left = `${Math.random() * window.innerWidth}px`;
        coin.style.opacity = 1;
        coin.style.transform = `rotate(${Math.random() * 360}deg)`;

        const rotationSpeed = (Math.random() * 60 - 30);

        let animationFrameId;
        const animateCoin = () => {
            coin.style.transform = `rotate(${parseFloat(coin.style.transform.replace('rotate(', '').replace('deg)', '')) + rotationSpeed}deg)`;
            coin.style.top = `${parseFloat(coin.style.top) + animationSpeed}px`;

            if (parseFloat(coin.style.top) < window.innerHeight + 50) { // Extend slightly below viewport
                animationFrameId = requestAnimationFrame(animateCoin);
            } else {
                coin.remove();
            }
        };

        setTimeout(() => {
            animationFrameId = requestAnimationFrame(animateCoin);
        }, Math.random() * 100);

        return coin;
    }


    coinRainTrigger.addEventListener('click', () => {
        const numberOfCoins = updateDailyCounter();
        console.log('Coin trigger clicked, creating', numberOfCoins, 'coins.');

        // Play the coin drop sound
        coinDropSound.currentTime = 0; // Reset the sound to the beginning if it's still playing
        coinDropSound.play();

        for (let i = 0; i < numberOfCoins; i++) {
            setTimeout(() => {
                const coin = createCoin();
                if (coin) {
                    coinRainContainer.appendChild(coin);
                }
            }, i * 50); // Faster stagger
        }
    });

    // Initialize the counter on page load
    updateDailyCounter();
    console.log('Daily counter initialized.');
});