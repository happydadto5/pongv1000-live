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
        const rect = canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        rightPaddleY = Math.max(0, Math.min(canvas.height - paddleHeight, mouseY - paddleHeight / 2));
    });

    // Ball speed ramping
    let direction = 1; // 1 for increase, -1 for decrease
    function adjustBallSpeed() {
        if (ballSpeedX > 5) {
            direction = -1;
        } else if (ballSpeedX < 3) {
            direction = 1;
        }
        ballSpeedX += direction * 0.1 * Math.random();
        ballSpeedY += direction * 0.1 * Math.random();
    }

    // Update game state
    function update() {
        adjustBallSpeed();

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw paddles and ball
        ctx.fillStyle = 'white';
        ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();

        // Move and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].x += particles[i].vx;
            particles[i].y += particles[i].vy;
            particles[i].alpha -= 0.02;

            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${particles[i].alpha})`;
                ctx.beginPath();
                ctx.arc(particles[i].x, particles[i].y, 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            }
        }

        // Draw obstacles
        drawObstacles();

        // Move ball and handle collisions
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) {
            ballSpeedX = -ballSpeedX;
        }

        if (ballY - ballRadius < 0) {
            ballY = ballRadius;
            ballSpeedY = -ballSpeedY;
            playSound('bounce');
        } else if (ballY + ballRadius > canvas.height) {
            ballY = canvas.height - ballRadius;
            ballSpeedY = -ballSpeedY;
            playSound('bounce');
        }

        // Move left paddle
        if (leftPaddleY < 0) {
            leftPaddleY = 0;
        } else if (leftPaddleY + paddleHeight > canvas.height) {
            leftPaddleY = canvas.height - paddleHeight;
        }

        // Move right paddle
        if (rightPaddleY < 0) {
            rightPaddleY = 0;
        } else if (rightPaddleY + paddleHeight > canvas.height) {
            rightPaddleY = canvas.height - paddleHeight;
        }

        // Update score display
        ctx.font = '24px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`Player: ${playerScore}`, 10, 30);
        ctx.fillText(`AI: ${aiScore}`, canvas.width - 150, 30);

        requestAnimationFrame(update);
    }

    // Start game loop
    update();
})();