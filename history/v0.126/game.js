(function () {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let audioContext;
    let currentSoundEffect = null;

    function getAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    ['click', 'keydown', 'touchstart'].forEach((eventName) => {
        document.addEventListener(eventName, () => {
            // Initialize audio context
            getAudioContext();
        });
    });

    function playBlip(frequency, durationMs) {
        try {
            const context = getAudioContext();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            const durationSeconds = durationMs / 1000;

            oscillator.type = 'square';
            oscillator.frequency.value = frequency;

            gainNode.gain.setValueAtTime(0.12, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + durationSeconds);

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + durationSeconds);

            currentSoundEffect = oscillator;
            oscillator.addEventListener('ended', function () {
                if (currentSoundEffect === oscillator) {
                    currentSoundEffect = null;
                }
            });
        } catch (error) {
            currentSoundEffect = null;
        }
    }

    function handleBallHitPaddle() {
        if (currentSoundEffect) {
            try {
                currentSoundEffect.stop();
            } catch (error) {
                currentSoundEffect = null;
            }
        }

        playBlip(800, 200);
    }

    function paddleHeight() {
        return Math.max(80, Math.floor(canvas.height * 0.18));
    }

    function paddleWidth() {
        return Math.max(12, Math.floor(canvas.width * 0.012));
    }

    function paddleMargin() {
        return Math.max(24, Math.floor(canvas.width * 0.04));
    }

    function ballSize() {
        return Math.max(10, Math.floor(canvas.width * 0.015));
    }

    function baseBallSpeed() {
        return Math.max(4.5, canvas.width * 0.006);
    }

    const state = {
        left: { x: 0, y: 0, up: false, down: false, score: 0 },
        right: { x: 0, y: 0, score: 0 },
        ball: { x: 0, y: 0, vx: 0, vy: 0 }
    };

    function centerPaddles() {
        const centeredY = (canvas.height - paddleHeight()) / 2;
        state.left.x = paddleMargin();
        state.right.x = canvas.width - paddleMargin() - paddleWidth();
        state.left.y = centeredY;
        state.right.y = centeredY;
    }

    function resetBall(direction) {
        const speed = baseBallSpeed();
        state.ball.x = canvas.width / 2;
        state.ball.y = canvas.height / 2;
        state.ball.vx = speed * direction;
        state.ball.vy = speed * (Math.random() > 0.5 ? 0.7 : -0.7);
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        centerPaddles();
        if (!state.ball.vx && !state.ball.vy) {
            resetBall(Math.random() > 0.5 ? 1 : -1);
        }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (key === 'w' || key === 'ArrowUp') {
            state.left.up = true;
        }
        if (key === 's' || key === 'ArrowDown') {
            state.left.down = true;
        }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        if (key === 'w' || key === 'ArrowUp') {
            state.left.up = false;
        }
        if (key === 's' || key === 'ArrowDown') {
            state.left.down = false;
        }
    });

    function movePlayerPaddle(clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaledY = (clientY - rect.top) * (canvas.height / rect.height);
        state.left.y = Math.max(0, Math.min(canvas.height - paddleHeight(), scaledY - paddleHeight() / 2));
    }

    canvas.addEventListener('mousemove', (event) => {
        movePlayerPaddle(event.clientY);
    });

    canvas.addEventListener('touchstart', (event) => {
        movePlayerPaddle(event.touches[0].clientY);
    }, { passive: true });

    canvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
        movePlayerPaddle(event.touches[0].clientY);
    }, { passive: false });

    function clampPaddles() {
        const maxY = canvas.height - paddleHeight();
        state.left.y = Math.max(0, Math.min(maxY, state.left.y));
        state.right.y = Math.max(0, Math.min(maxY, state.right.y));
    }

    var powerUpActive = false;
    var powerUpTimeoutId = 0;

    function applyPowerUp(powerUpType) {
        if (powerUpActive) {
            return;
        }

        powerUpActive = true;
        window.clearTimeout(powerUpTimeoutId);
        powerUpTimeoutId = window.setTimeout(function () {
            powerUpActive = false;
        }, 5000);

        const context = getAudioContext();
        switch (powerUpType) {
            case 'speedBoost':
                state.right.speed *= 1.5;
                playBlip(800, 200);
                break;
            case 'shield':
                state.right.hasShield = true;
                ctx.fillStyle = 'blue';
                break;
            case 'doublePoints':
                state.scoreMultiplier = 2;
                playBlip(400, 100);
                break;
            default:
                break;
        }
    }

    function checkForPowerUp() {
        if (Math.random() < 0.05) applyPowerUp();
    }

    setInterval(checkForPowerUp, 30000);

    function updateAIPaddle() {
        const paddleSpeed = powerUpActive ? 7 : 5;
        const ballYCenter = state.ball.y + ballSize() / 2;
        if (state.right.y < ballYCenter) {
            state.right.y += paddleSpeed;
        } else if (state.right.y > ballYCenter) {
            state.right.y -= paddleSpeed;
        }
        clampPaddles();
    }

    function update() {
        const currentPaddleHeight = paddleHeight();
        const currentBallSize = ballSize();
        const paddleSpeed = powerUpActive ? 7 : 5;

        if (state.left.up) {
            state.left.y -= paddleSpeed;
        } else if (state.left.down) {
            state.left.y += paddleSpeed;
        }

        clampPaddles();

        state.ball.x += state.ball.vx;
        state.ball.y += state.ball.vy;

        updateAIPaddle(); // Call the AI paddle update function

        handleBallHitPaddle();

        if (state.ball.x - ballSize() < 0 || state.ball.x + ballSize() > canvas.width) {
            resetBall(state.ball.x - ballSize() < 0 ? -1 : 1);
        }

        if (state.ball.y - ballSize() < 0 || state.ball.y + ballSize() > canvas.height) {
            state.ball.vy = -state.ball.vy;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw paddles and ball here
        ctx.fillStyle = 'white';
        ctx.fillRect(state.left.x, state.left.y, paddleWidth(), paddleHeight());
        ctx.fillRect(state.right.x, state.right.y, paddleWidth(), paddleHeight());
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, ballSize(), 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
})();