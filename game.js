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
        const pattern = [
            {x: Math.random() * canvas.width, y: Math.random() * canvas.height},
            {x: Math.random() * canvas.width, y: Math.random() * canvas.height},
            {x: Math.random() * canvas.width, y: Math.random() * canvas.height}
        ];
        pattern.forEach((point) => {
            obstacles.push({
                x: point.x,
                y: point.y,
                width: 20,
                height: 20,
                speedX: Math.random() - 0.5,
                type: 'default'
            });
        });
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

        obstacles.forEach((obstacle) => {
            obstacle.x += obstacle.speedX;
            if (obstacle.x < 0 || obstacle.x > canvas.width) obstacle.speedX *= -1;
        });

        if (ballX + ballRadius > canvas.width || ballX - ballRadius < 0) ballSpeedX *= -1;
        if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
            ballSpeedY *= -1;
            if (ballY < 0) aiScore++;
            else playerScore++;
        }

        if (obstacles.some((obstacle) => {
            return Math.abs(ballX - obstacle.x) < 25 && Math.abs(ballY - obstacle.y) < 25;
        })) ballSpeedX *= -1;

        if (Math.abs(ballX - rightPaddleX) < 10 && Math.abs(ballY - rightPaddleY) < paddleHeight / 2) ballSpeedX *= -1;
        if (Math.abs(ballX - leftPaddleX) < 10 && Math.abs(ballY - leftPaddleY) < paddleHeight / 2) ballSpeedX *= -1;

        if (playerScore >= 5 || aiScore >= 5) {
            resetGame();
        }
    }

    function resetGame() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = 5;
        ballSpeedY = 3;
        playerScore = 0;
        aiScore = 0;
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(leftPaddleX, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(rightPaddleX, rightPaddleY, paddleWidth, paddleHeight);
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        obstacles.forEach((obstacle) => {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText('Player: ' + playerScore, 10, canvas.height - 10);
        ctx.fillText('AI: ' + aiScore, canvas.width - 80, canvas.height - 10);
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    let leftPaddleX = 50;
    let rightPaddleX = canvas.width - paddleWidth - 50;

    setInterval(createObstacles, 2000);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') leftPaddleY -= 10;
        if (e.key === 'ArrowDown') leftPaddleY += 10;
    });

    gameLoop();
})();