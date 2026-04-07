(function () {
    'use strict';

    // Lazy-init AudioContext
    let audioContext;
    function getAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    // Sound effect functions
    function playSound(type) {
        const context = getAudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.type = type === 'powerup' ? 'sawtooth' : 'square';
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 1);
        
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
        
        oscillator.connect(gainNode).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 1);
    }

    // Game setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle system
    const particles = [];
    function createParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                alpha: 1
            });
        }
    }

    // Power-up system
    let powerUpActive = false;
    let powerUpTimer;

    function activatePowerUp() {
        powerUpActive = true;
        aiSpeedMultiplier = 2;
        playSound('powerup');
        powerUpTimer = setTimeout(() => {
            powerUpActive = false;
            aiSpeedMultiplier = 1;
        }, 5000);
    }

    // Score system
    let playerScore = 0;
    let aiScore = 0;

    // Game state
    let leftPaddleY = canvas.height / 2 - 50;
    let rightPaddleY = canvas.height / 2 - 50;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = 5;
    let ballSpeedY = 3;
    const paddleHeight = 100;
    const paddleWidth = 10;
    const ballRadius = 10;

    // AI difficulty
    let aiSpeedMultiplier = 1;

    // Keyboard and mouse controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') {
            leftPaddleY -= 5;
        } else if (e.key === 's' || e.key === 'ArrowDown') {
            leftPaddleY += 5;
        }
    });

    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        rightPaddleY = Math.max(0, Math.min(mouseY - paddleHeight / 2, canvas.height - paddleHeight));
    });

    // Clamp paddle positions
    function clampPaddles() {
        leftPaddleY = Math.max(0, Math.min(canvas.height - paddleHeight, leftPaddleY));
        rightPaddleY = Math.max(0, Math.min(canvas.height - paddleHeight, rightPaddleY));
    }

    // Update game state
    function update() {
        // Move paddles
        clampPaddles();

        // Move ball
        ballX += ballSpeedX * aiSpeedMultiplier;
        ballY += ballSpeedY;

        // Ball collision with top/bottom
        if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
            ballSpeedY = -ballSpeedY;
            createParticles(ballX, ballY);
            playSound('collision');
        }

        // Ball collision with paddles
        if (ballX - ballRadius < paddleWidth && 
            ballY > leftPaddleY && 
            ballY < leftPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            createParticles(ballX, ballY);
            playSound('collision');
        } else if (ballX + ballRadius > canvas.width - paddleWidth && 
                   ballY > rightPaddleY && 
                   ballY < rightPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            createParticles(ballX, ballY);
            playSound('collision');
        }

        // Ball out of bounds
        if (ballX + ballRadius < 0 || ballX - ballRadius > canvas.width) {
            resetBall();
        }
    }

    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = Math.random() < 0.5 ? -5 : 5 * aiSpeedMultiplier;
        ballSpeedY = Math.random() * 10 - 5;
    }

    // Render game
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw paddles and ball
        ctx.fillStyle = 'white';
        ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw power-up indicator
        if (powerUpActive) {
            ctx.fillStyle = 'red';
            ctx.fillRect(canvas.width - 50, canvas.height / 2 - 10, 40, 20);
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.05;
            ctx.globalAlpha = particle.alpha;
            ctx.fillRect(particle.x, particle.y, 2, 2);
        }

        // Reset global alpha
        ctx.globalAlpha = 1;

        requestAnimationFrame(render);
    }

    render();

    // Game loop
    function gameLoop() {
        update();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
})();