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

        // Ball out of bounds
        if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) {
            if (ballX - ballRadius < 0) {
                aiScore++;
            } else {
                playerScore++;
            }
            resetBall();
        }

        // Update AI difficulty based on player score
        let aiDifficulty = Math.min(3, Math.floor(playerScore / 5));
        adjustAIDifficulty(aiDifficulty);
    }

    function adjustAIDifficulty(difficulty) {
        if (difficulty === 1) {
            ballSpeedX = 5;
            ballSpeedY = 2;
        } else if (difficulty === 2) {
            ballSpeedX = 6;
            ballSpeedY = 3;
        } else if (difficulty === 3) {
            ballSpeedX = 7;
            ballSpeedY = 4;
        }
    }

    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
    }

    // Render game
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPaddles();
        drawBall();
        drawScore();
        updateParticles();
    }

    function drawPaddles() {
        ctx.fillStyle = 'white';
        ctx.fillRect(10, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - 20 - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
    }

    function drawBall() {
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    }

    function drawScore() {
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`Player: ${playerScore}`, 10, 50);
        ctx.fillText(`AI: ${aiScore}`, canvas.width - 100, 50);
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, ballRadius / 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.fill();
                ctx.closePath();
            }
        }
    }

    // Game loop
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
})();