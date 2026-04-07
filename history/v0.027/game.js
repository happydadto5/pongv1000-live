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
                        speedX: Math.random() - 0.5,
                        type: 'default'
                    });
                }
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
                clampPaddles();

                ballX += ballSpeedX;
                ballY += ballSpeedY;

                if (ballY <= ballRadius || ballY >= canvas.height - ballRadius) {
                    ballSpeedY *= -1;
                }

                if (ballX <= paddleWidth && ballY + ballRadius > leftPaddleY && ballY - ballRadius < leftPaddleY + paddleHeight) {
                    ballSpeedX = Math.abs(ballSpeedX);
                } else if (ballX >= canvas.width - paddleWidth - ballRadius && ballY + ballRadius > rightPaddleY && ballY - ballRadius < rightPaddleY + paddleHeight) {
                    ballSpeedX = -Math.abs(ballSpeedX);
                }

                if (ballX <= -ballRadius) {
                    aiScore += 1;
                    resetBall(1);
                } else if (ballX >= canvas.width + ballRadius) {
                    playerScore += 1;
                    resetBall(-1);
                }

                obstacles.forEach((obstacle, index) => {
                    obstacle.x += obstacle.speedX;

                    if (obstacle.type === 'powerup' && Math.abs(ballX - obstacle.x) < ballRadius + obstacle.width / 2 && Math.abs(ballY - obstacle.y) < ballRadius + obstacle.height / 2) {
                        playSound('powerup');
                        // Implement power-up effect
                        obstacles.splice(index, 1);
                    }
                });
            }

            function drawBall() {
                ctx.beginPath();
                ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.closePath();
            }

            function drawPaddles() {
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
                ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
            }

            function drawScore() {
                ctx.font = '48px Arial';
                ctx.fillStyle = '#fff';
                ctx.fillText(playerScore, canvas.width / 2 - 60, 50);
                ctx.fillText(aiScore, canvas.width / 2 + 30, 50);
            }

            function resetBall(direction) {
                ballX = canvas.width / 2;
                ballY = canvas.height / 2;
                ballSpeedX *= direction;
                ballSpeedY = (Math.random() - 0.5) * 4;
            }

            // Game loop
            function gameLoop() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawPaddles();
                drawBall();
                update();
                drawObstacles();
                drawScore();
                requestAnimationFrame(gameLoop);
            }

            gameLoop();

            // Power-up obstacle creation
            setInterval(() => {
                createObstacles();
            }, 15000);

        })();