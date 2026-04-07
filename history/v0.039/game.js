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

    function drawParticles() {
        particles.forEach((particle, index) => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.type === 'powerup' ? '#ff6f61' : '#800';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, Math.random() * 5 + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Update particle properties
            particle.alpha -= 0.1;
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.alpha <= 0) {
                particles.splice(index, 1);
            }
        });
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
        const rect = canvas.getBoundingClientRect();
        if (event.type === 'touchstart' || event.type === 'touchmove') {
            const touchX = event.touches[0].clientX - rect.left;
            player.paddle.x = Math.max(paddleMargin, Math.min(canvas.width - paddleWidth - paddleMargin, touchX));
        } else if (event.type === 'mousemove') {
            player.paddle.x = Math.max(paddleMargin, Math.min(canvas.width - paddleWidth - paddleMargin, event.clientX - rect.left));
        }
    }

    canvas.addEventListener('touchstart', movePaddle);
    canvas.addEventListener('touchmove', movePaddle);
    document.addEventListener('mousemove', movePaddle);

    // Game loop
    function gameLoop() {
        const startTime = performance.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawParticles();
        drawObstacles();
        drawPaddles();

        requestAnimationFrame(gameLoop);

        const elapsedTime = performance.now() - startTime;
        if (elapsedTime < 16.67) {
            setTimeout(() => gameLoop(), 16.67 - elapsedTime);
        }
    }

    // Initialize paddles and ball
    const paddleWidth = 14;
    const paddleHeight = 100;
    const leftPaddle = {x: paddleMargin, y: canvas.height / 2 - paddleHeight / 2};
    const rightPaddle = {x: canvas.width - paddleWidth - paddleMargin, y: canvas.height / 2 - paddleHeight / 2};

    function drawPaddles() {
        ctx.fillStyle = '#ffffff'; // Corrected fillStyle color
        ctx.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
        ctx.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);
    }

    gameLoop();
})();