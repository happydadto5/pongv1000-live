(function () {
            'use strict';

            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');

            let audioContext;

            function getAudioContext() {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                return audioContext;
            }

            ['click', 'keydown', 'touchstart'].forEach((eventName) => {
                document.addEventListener(eventName, () => {
                    getAudioContext();
                }, { once: true, passive: true });
            });

            function playBlip(frequency, duration) {
                try {
                    const context = getAudioContext();
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();

                    oscillator.type = 'square';
                    oscillator.frequency.value = frequency;

                    gainNode.gain.setValueAtTime(0.12, context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    oscillator.start(context.currentTime);
                    oscillator.stop(context.currentTime + duration);
                } catch (error) {
                    // Audio is optional; gameplay should continue even if it is unavailable.
                }
            }

            function paddleHeight() {
                return Math.max(80, Math.floor(canvas.height * 0.18));
            }

            function paddleWidth() {
                return Math.max(12, Math.floor(canvas.width * 0.012));
            }

            function paddleMargin() {
                return Math.max(24, Math.floor(canvas.width * 0.04));
            }

            function ballSize() {
                return Math.max(10, Math.floor(canvas.width * 0.015));
            }

            function baseBallSpeed() {
                return Math.max(4.5, canvas.width * 0.006);
            }

            const state = {
                left: { y: 0, up: false, down: false, score: 0 },
                right: { y: 0, score: 0 },
                ball: { x: 0, y: 0, vx: 0, vy: 0 },
                netOffset: 0
            };

            function centerPaddles() {
                const centeredY = (canvas.height - paddleHeight()) / 2;
                state.left.y = centeredY;
                state.right.y = centeredY;
            }

            function resetBall(direction) {
                const speed = baseBallSpeed();
                state.ball.x = canvas.width / 2;
                state.ball.y = canvas.height / 2;
                state.ball.vx = speed * direction;
                state.ball.vy = speed * (Math.random() > 0.5 ? 0.7 : -0.7);
            }

            function resizeCanvas() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                centerPaddles();
                if (!state.ball.vx && !state.ball.vy) {
                    resetBall(Math.random() > 0.5 ? 1 : -1);
                }
            }

            function resetRound(direction) {
                centerPaddles();
                resetBall(direction);
            }

            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            document.addEventListener('keydown', (event) => {
                const key = event.key.toLowerCase();
                if (key === 'w' || event.key === 'ArrowUp') {
                    state.left.up = true;
                }
                if (key === 's' || event.key === 'ArrowDown') {
                    state.left.down = true;
                }
            });

            document.addEventListener('keyup', (event) => {
                const key = event.key.toLowerCase();
                if (key === 'w' || event.key === 'ArrowUp') {
                    state.left.up = false;
                }
                if (key === 's' || event.key === 'ArrowDown') {
                    state.left.down = false;
                }
            });

            function movePlayerPaddle(clientY) {
                const rect = canvas.getBoundingClientRect();
                const scaledY = (clientY - rect.top) * (canvas.height / rect.height);
                state.left.y = scaledY - paddleHeight() / 2;
            }

            canvas.addEventListener('mousemove', (event) => {
                movePlayerPaddle(event.clientY);
            });

            canvas.addEventListener('touchstart', (event) => {
                movePlayerPaddle(event.touches[0].clientY);
            }, { passive: true });

            canvas.addEventListener('touchmove', (event) => {
                event.preventDefault();
                movePlayerPaddle(event.touches[0].clientY);
            }, { passive: false });

            function clampPaddles() {
                const maxY = canvas.height - paddleHeight();
                state.left.y = Math.max(0, Math.min(maxY, state.left.y));
                state.right.y = Math.max(0, Math.min(maxY, state.right.y));
            }

            var powerUpActive = false;
            var powerUpTimeoutId = 0;

            function applyPowerUp() {
                if (powerUpActive) {
                    return;
                }

                powerUpActive = true;
                window.clearTimeout(powerUpTimeoutId);
                powerUpTimeoutId = window.setTimeout(function () {
                    powerUpActive = false;
                }, 5000);
            }

            function checkForPowerUp() {
                if (Math.random() < 0.05) applyPowerUp();
            }

            setInterval(checkForPowerUp, 30000);

            function update() {
                const currentPaddleHeight = paddleHeight();
                const currentBallSize = ballSize();
                const currentPaddleMargin = paddleMargin();
                const paddleSpeed = powerUpActive ? 7 : 5;
                const aiTargetY = state.ball.y - currentPaddleHeight / 2;

                if (state.left.up && state.left.y > 0) {
                    state.left.y -= paddleSpeed;
                }
                if (state.left.down && state.left.y + currentPaddleHeight < canvas.height) {
                    state.left.y += paddleSpeed;
                }

                const rightPaddleY = state.right.y + currentPaddleHeight / 2;
                if (aiTargetY < rightPaddleY - 5) {
                    state.right.y -= paddleSpeed;
                } else if (aiTargetY > rightPaddleY + 5) {
                    state.right.y += paddleSpeed;
                }

                state.ball.x += state.ball.vx;
                state.ball.y += state.ball.vy;

                if (state.ball.y <= 0 || state.ball.y >= canvas.height - ballSize()) {
                    state.ball.vy = -state.ball.vy;
                }
                if (state.ball.x <= paddleMargin() + ballSize() && state.left.up) {
                    state.ball.vx = -state.ball.vx;
                } else if (state.ball.x <= paddleMargin() + ballSize() && !state.left.up) {
                    resetRound(-1);
                }
                if (state.ball.x >= canvas.width - paddleMargin() - ballSize() && state.right.up) {
                    state.ball.vx = -state.ball.vx;
                } else if (state.ball.x >= canvas.width - paddleMargin() - ballSize() && !state.right.up) {
                    resetRound(1);
                }
            }

            function render() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw paddles and ball
                ctx.fillStyle = 'white';
                ctx.fillRect(paddleMargin(), state.left.y, paddleWidth(), paddleHeight());
                ctx.fillRect(canvas.width - paddleMargin() - paddleWidth(), state.right.y, paddleWidth(), paddleHeight());
                ctx.beginPath();
                ctx.arc(state.ball.x, state.ball.y, ballSize(), 0, Math.PI * 2);
                ctx.fill();

                // Draw net
                ctx.fillStyle = 'white';
                for (let y = 0; y < canvas.height; y += 10) {
                    ctx.fillRect(canvas.width / 2 - 1, y, 2, 5);
                }
            }

            function gameLoop() {
                update();
                render();
                requestAnimationFrame(gameLoop);
            }

            gameLoop();
        })();