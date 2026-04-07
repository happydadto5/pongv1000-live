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
                width: 20,
                height: 20,
                speedX: (Math.random() - 0.5) * 2, // Increased speed
                type: 'obstacle'
            });
        });
    }

    function drawObstacles() {
        obstacles.forEach((obstacle, index) => {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            // Update obstacle properties
            obstacle.x += obstacle.speedX;
            if (obstacle.x + obstacle.width < 0 || obstacle.x > canvas.width) {
                obstacles.splice(index, 1);
            }
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

    // Main game loop
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawObstacles();
        drawParticles();
        drawPaddles(); // Draw paddles in the game loop

        requestAnimationFrame(gameLoop);
    }

    // Handle particle effects based on event type
    function handleEvent(eventType) {
        if (eventType === 'powerup') {
            createParticles(event.x, event.y, 'powerup');
        } else {
            createParticles(event.x, event.y, 'default');
        }
    }

    // Event listeners for dynamic particle effects
    document.addEventListener('customEvent', function(event) {
        handleEvent(event.detail.type);
    });

    // Initialize game
    createObstacles();
    drawPaddles();
    gameLoop();
})();