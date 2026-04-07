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
            ctx.fillStyle = obstacle.type === 'powerup' ? '#ff6f61' : '#800';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
    }

    // Paddle movement
    const paddleMargin = 16;
    function movePaddle(event) {
        if (event.cancelable) {
            event.preventDefault();
        }
        const rect = canvas.getBoundingClientRect();
        const pointerY = event.touches
            ? event.touches[0].clientY - rect.top
            : event.clientY - rect.top;
        leftPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, pointerY - paddleHeight / 2));
    }

    canvas.addEventListener('touchstart', movePaddle);
    canvas.addEventListener('touchmove', movePaddle);
    canvas.addEventListener('mousedown', movePaddle);
    canvas.addEventListener('mousemove', movePaddle);

    // Previous version button fix
    const prevVersionButton = document.getElementById('prev-version-button');
    if (prevVersionButton) {
        prevVersionButton.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }

    // Game loop
    function gameLoop() {
        ctx.fillStyle = '#050b16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawPaddles();
        drawBall();
        moveBall();
        detectCollisions();
        createParticles(ball.x, ball.y, 'ball');
        requestAnimationFrame(gameLoop);
    }

    // Initialize paddles and ball
    const paddleWidth = 14;
    const paddleHeight = 100;
    const leftPaddle = {x: paddleMargin, y: canvas.height / 2 - paddleHeight / 2};
    const rightPaddle = {x: canvas.width - paddleMargin - paddleWidth, y: canvas.height / 2 - paddleHeight / 2};
    const ball = {x: canvas.width / 2, y: canvas.height / 2, vx: 5, vy: 5};

    function syncLayout() {
        leftPaddle.x = paddleMargin;
        rightPaddle.x = canvas.width - paddleMargin - paddleWidth;
        leftPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, leftPaddle.y));
        rightPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, rightPaddle.y));
    }
    syncLayout();

    // Draw paddles, ball
    function drawPaddles() {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
        ctx.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);
    }

    function drawBall() {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    }

    // Move ball
    function moveBall() {
        ball.x += ball.vx;
        ball.y += ball.vy;

        const aiTarget = ball.y - paddleHeight / 2;
        rightPaddle.y += (aiTarget - rightPaddle.y) * 0.12;
        rightPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, rightPaddle.y));

        if (ball.x - 10 < 0 || ball.x + 10 > canvas.width) {
            ball.vx *= -1;
        }
        if (ball.y - 10 < 0 || ball.y + 10 > canvas.height) {
            ball.vy *= -1;
        }

        // Collision with paddles
        if (ball.x - 10 <= leftPaddle.x + paddleWidth && ball.x > leftPaddle.x &&
            ball.y + 10 >= leftPaddle.y && ball.y - 10 <= leftPaddle.y + paddleHeight) {
            ball.vx *= -1;
            ball.x = leftPaddle.x + paddleWidth + 10;
        }
        if (ball.x + 10 >= rightPaddle.x && ball.x < rightPaddle.x + paddleWidth &&
            ball.y + 10 >= rightPaddle.y && ball.y - 10 <= rightPaddle.y + paddleHeight) {
            ball.vx *= -1;
            ball.x = rightPaddle.x - 10;
        }
    }

    // Collision with obstacles
    function detectCollisions() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (ball.x + 10 >= obstacles[i].x && ball.x + 10 <= obstacles[i].x + obstacles[i].width &&
                ball.y + 10 >= obstacles[i].y && ball.y - 10 <= obstacles[i].y + obstacles[i].height) {
                ball.vx *= -1;
                obstacles.splice(i, 1);
            }
        }
    }

    window.addEventListener('resize', syncLayout);

    gameLoop();
})();
