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

    // Resize canvas and paddles
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawPaddles(); // Recreate paddles when resizing
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
            const size = Math.random() * 10 + (particle.type === 'powerup' ? 5 : 2); // Dynamic size based on event type
            const color = particle.type === 'powerup' ? '#ff6f61' : '#800';
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
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
                width: 50 + Math.random() * 100, // Dynamic size based on screen size
                height: 50 + Math.random() * 100,
                speed: Math.random() * 2 + 1
            });
        });
    }

    function drawObstacles() {
        obstacles.forEach(obstacle => {
            ctx.fillStyle = '#333';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
    }

    // Draw paddles
    function drawPaddles() {
        ctx.fillStyle = '#ffffff'; // Corrected fillStyle color
        const paddleWidth = 10;
        const paddleHeight = 80;

        // Left paddle
        ctx.fillRect(50, (canvas.height - paddleHeight) / 2, paddleWidth, paddleHeight);

        // Right paddle
        ctx.fillRect(canvas.width - paddleWidth - 50, (canvas.height - paddleHeight) / 2, paddleWidth, paddleHeight);
    }

    // Game loop
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawObstacles();
        drawParticles();
        drawPaddles(); // Draw paddles in the game loop

        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    // Mouse events for desktop
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        // Update paddle position based on mouse movement
    });

    // Touch events for mobile
    canvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        const mouseX = touch.clientX;
        const mouseY = touch.clientY;
        // Update paddle position based on touch movement
    });
})();