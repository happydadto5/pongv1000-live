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
    function createParticles(x, y, type) {
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                alpha: 1,
                type: type
            });
        }
    }

    // Obstacle system
    let obstacles = [];
    function createObstacles() {
        for (let i = 0; i < 3; i++) {
            obstacles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                width: 20,
                height: 20,
                speedX: Math.random() - 0.5,
                type: 'default'
            });
        }
    }

    function drawObstacles() {
        obstacles.forEach((obstacle) => {
            ctx.fillStyle = obstacle.type === 'powerup' ? '#ff6f61' : '#6f6f6f';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
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
    let lastPlayerScore = playerScore;

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
        clampPaddles();

        ballX += ballSpeedX;
        ballY += ballSpeedY;

        if (ballY <= ballRadius || ballY >= canvas.height - ballRadius) {
            ballSpeedY *= -1;
        }
        
        // Adjust AI difficulty based on player performance
        if (playerScore !== lastPlayerScore) {
            aiSpeedMultiplier = Math.max(0.5, Math.min(2, aiSpeedMultiplier + (playerScore > lastPlayerScore ? 0.1 : -0.1)));
            lastPlayerScore = playerScore;
        }

        rightPaddleY += (ballY - (rightPaddleY + paddleHeight / 2)) * aiSpeedMultiplier;

        if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) {
            if (ballX - ballRadius < 0) {
                aiScore++;
            } else {
                playerScore++;
            }
            resetBall();
        }

        if (leftPaddleY <= ballY && ballY <= leftPaddleY + paddleHeight || rightPaddleY <= ballY && ballY <= rightPaddleY + paddleHeight) {
            ballSpeedX *= -1;
        }
    }

    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * Math.abs(ballSpeedX);
        ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * Math.abs(ballSpeedY);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw paddles
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);

        // Draw ball
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw score
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText(`Player: ${playerScore}`, 10, 50);
        ctx.fillText(`AI: ${aiScore}`, canvas.width - 80, 50);

        // Draw obstacles
        drawObstacles();
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    resetBall();
    gameLoop();

    // Obstacle generation
    setInterval(createObstacles, 3000);
})();