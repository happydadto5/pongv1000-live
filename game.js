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
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 60
            });
        }
    }

    // Game variables
    const paddleWidth = 10;
    const paddleHeight = 100;
    const ballRadius = 10;
    let leftPaddleY = (canvas.height - paddleHeight) / 2;
    let rightPaddleY = (canvas.height - paddleHeight) / 2;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = 5;
    let ballSpeedY = 5;

    // Game loop
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    function update() {
        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].x += particles[i].vx;
            particles[i].y += particles[i].vy;
            particles[i].life--;
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
            }
        }

        // Move ball
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Ball collision with top/bottom
        if (ballY <= 0 || ballY >= canvas.height - ballRadius) {
            ballSpeedY = -ballSpeedY;
            createParticles(ballX, ballY);
        }

        // Ball collision with paddles
        if (ballX <= paddleWidth && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            createParticles(ballX, ballY);
        } else if (ballX >= canvas.width - paddleWidth - ballRadius && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            createParticles(ballX, ballY);
        }

        // Ball out of bounds
        if (ballX < 0 || ballX > canvas.width) {
            // Reset ball
            ballX = canvas.width / 2;
            ballY = canvas.height / 2;
            ballSpeedX = -ballSpeedX;
            ballSpeedY = Math.random() * 10 - 5;
        }
    }

    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw paddles
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);

        // Draw ball
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();
    }

    // Touch controls
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);

    function handleTouch(e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Left paddle control (left half of screen)
        if (x < canvas.width / 2) {
            leftPaddleY = y - paddleHeight / 2;
        } 
        // Right paddle control (right half of screen)
        else {
            rightPaddleY = y - paddleHeight / 2;
        }
    }

    // Start game
    gameLoop();
})();