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
                speedX: Math.random() - 0.5
            });
        }
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

        // Update ball position and collision detection
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        if (ballY <= 0 || ballY >= canvas.height - ballRadius) {
            ballSpeedY *= -1;
        }

        if (ballX <= paddleWidth && ballY + ballRadius > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
            ballSpeedX *= -1;
        } else if (ballX >= canvas.width - ballRadius - paddleWidth && ballY + ballRadius > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
            ballSpeedX *= -1;
        }

        if (ballX <= 0 || ballX >= canvas.width - ballRadius) {
            resetBall();
        }
    }

    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX *= -1;
    }

    // Draw game elements
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();

        // Draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].x += particles[i].vx;
            particles[i].y += particles[i].vy;
            particles[i].alpha -= 0.01;
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.arc(particles[i].x, particles[i].y, ballRadius / 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, ' + particles[i].alpha + ')';
                ctx.fill();
                ctx.closePath();
            }
        }

        // Draw obstacles
        obstacles.forEach((obstacle) => {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        // Draw scores
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Player: ' + playerScore, 10, 30);
        ctx.fillText('AI: ' + aiScore, canvas.width - 75, 30);

        requestAnimationFrame(draw);
    }

    function init() {
        createObstacles();
        draw();
    }

    init();
})();