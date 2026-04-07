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
    let aiSpeedMultiplier = 1.2; // Increased difficulty multiplier
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
        rightPaddleY = Math.max(0, Math.min(e.clientY - paddleHeight / 2, canvas.height - paddleHeight));
    });

    // Power-up mechanics
    function applyPowerUp() {
        ballSpeedX *= Math.random() > 0.5 ? 1.5 : -1.5;
        ballSpeedY *= Math.random() > 0.5 ? 1.5 : -1.5;
    }

    canvas.addEventListener('click', () => {
        applyPowerUp();
        createParticles(ballX, ballY, 'powerup');
        playSound('powerup');
    });

    // Main game loop
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw paddles and ball
        ctx.fillStyle = '#000';
        ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();

        // Update ball position
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Collision detection with walls and paddles
        if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
            ballSpeedY *= -1;
        }
        if (ballX - ballRadius < paddleWidth && leftPaddleY <= ballY && ballY <= leftPaddleY + paddleHeight) {
            ballSpeedX *= -1.2;
            lastPlayerScore = playerScore;
        } else if (ballX + ballRadius > canvas.width - paddleWidth && rightPaddleY <= ballY && ballY <= rightPaddleY + paddleHeight) {
            ballSpeedX *= -1.2;
            playerScore++;
        }

        // Collision detection with obstacles
        obstacles.forEach((obstacle, index) => {
            if (ballX > obstacle.x && ballX < obstacle.x + obstacle.width && ballY > obstacle.y && ballY < obstacle.y + obstacle.height) {
                if (Math.random() > 0.5) {
                    ballSpeedX *= -1;
                } else {
                    ballSpeedY *= -1;
                }
                obstacles.splice(index, 1);
                createParticles(ballX, ballY, 'default');
            }
        });

        // Reset ball position on miss
        if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) {
            ballX = canvas.width / 2;
            ballY = canvas.height / 2;
            ballSpeedX = Math.random() > 0.5 ? 5 : -5;
            ballSpeedY = Math.random() * 3 - 1.5;
        }

        // Draw score and high score
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('Player: ' + playerScore, 10, 30);
        ctx.fillText('AI: ' + aiScore, canvas.width - 80, 30);

        // Animation frame request
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
})();