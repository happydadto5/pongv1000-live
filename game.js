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
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        // Set parameters based on sound type
        if (type === 'collision') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(880, context.currentTime); // A note
            gainNode.gain.setValueAtTime(0.5, context.currentTime);
        } else if (type === 'score') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(440, context.currentTime); // A note
            gainNode.gain.setValueAtTime(0.8, context.currentTime);
        }
        
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
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

    // Keyboard and mouse controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') {
            leftPaddleY -= 10;
        } else if (e.key === 's' || e.key === 'ArrowDown') {
            leftPaddleY += 10;
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
        ballX += ballSpeedX;
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

        // Score tracking
        if (ballX < 0) {
            aiScore++;
            resetBall();
            playSound('score');
        } else if (ballX > canvas.width) {
            playerScore++;
            resetBall();
            playSound('score');
        }
    }

    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX;
        ballSpeedY = (Math.random() - 0.5) * 4;
    }

    // Draw game
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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

        // Draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.fillRect(p.x, p.y, 5, 5);
            p.alpha -= 0.02;
            if (p.alpha <= 0) {
                particles.splice(i, 1);
            }
        }

        // Draw score
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText(playerScore, canvas.width / 4, 50);
        ctx.fillText(aiScore, 3 * canvas.width / 4, 50);
    }

    // Game loop
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
})();