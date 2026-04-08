(function () {
        'use strict';

        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        let audioContext;

        function getAudioContext() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
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
            if (state.left.down && state.left.y < canvas.height - currentPaddleHeight) {
                state.left.y += paddleSpeed;
            }

            if (state.right.y + currentPaddleHeight / 2 < aiTargetY) {
                state.right.y += 3.6;
            } else if (state.right.y + currentPaddleHeight / 2 > aiTargetY) {
                state.right.y -= 3.6;
            }

            clampPaddles();

            if (state.ball.y + currentBallSize / 2 > canvas.height || state.ball.y - currentBallSize / 2 < 0) {
                state.ball.vy = -state.ball.vy;
                playBlip(260, 0.08);
            }

            state.ball.x += state.ball.vx;
            state.ball.y += state.ball.vy;
            state.netOffset = (state.netOffset + 2) % 24;

            const leftPaddleX = currentPaddleMargin;
            const rightPaddleX = canvas.width - currentPaddleMargin - paddleWidth();
            const ballLeft = state.ball.x - currentBallSize / 2;
            const ballRight = state.ball.x + currentBallSize / 2;
            const ballTop = state.ball.y - currentBallSize / 2;
            const ballBottom = state.ball.y + currentBallSize / 2;

            const hitsLeftPaddle = (
                ballLeft <= leftPaddleX + paddleWidth() &&
                ballRight >= leftPaddleX &&
                ballBottom >= state.left.y &&
                ballTop <= state.left.y + currentPaddleHeight &&
                state.ball.vx < 0
            );

            if (hitsLeftPaddle) {
                state.ball.x = leftPaddleX + paddleWidth() + currentBallSize / 2;
                state.ball.vx = Math.abs(state.ball.vx) * 1.03;
                state.ball.vy += ((state.ball.y - (state.left.y + currentPaddleHeight / 2)) / currentPaddleHeight) * 2.4;
                playBlip(520, 0.06);
            }

            const hitsRightPaddle = (
                ballRight >= rightPaddleX &&
                ballLeft <= rightPaddleX + paddleWidth() &&
                ballBottom >= state.right.y &&
                ballTop <= state.right.y + currentPaddleHeight &&
                state.ball.vx > 0
            );

            if (hitsRightPaddle) {
                state.ball.x = rightPaddleX - currentBallSize / 2;
                state.ball.vx = -Math.abs(state.ball.vx) * 1.03;
                state.ball.vy += ((state.ball.y - (state.right.y + currentPaddleHeight / 2)) / currentPaddleHeight) * 2.4;
                playBlip(660, 0.06);
            }

            if (state.ball.x < -currentBallSize) {
                state.right.score += 1;
                resetRound(-1);
                return;
            }

            if (state.ball.x > canvas.width + currentBallSize) {
                state.left.score += 1;
                resetRound(1);
            }
        }

        function draw() {
            const currentPaddleHeight = paddleHeight();
            const currentPaddleWidth = paddleWidth();
            const currentBallSize = ballSize();
            const currentPaddleMargin = paddleMargin();

            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawCenterLine();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 42px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(state.left.score), canvas.width * 0.25, 60);
            ctx.fillText(String(state.right.score), canvas.width * 0.75, 60);

            ctx.fillRect(currentPaddleMargin, state.left.y, currentPaddleWidth, currentPaddleHeight);
            ctx.fillRect(canvas.width - currentPaddleMargin - currentPaddleWidth, state.right.y, currentPaddleWidth, currentPaddleHeight);

            ctx.beginPath();
            ctx.arc(state.ball.x, state.ball.y, currentBallSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawCenterLine() {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.setLineDash([12, 12]);
            ctx.lineDashOffset = -state.netOffset;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        resetRound(Math.random() > 0.5 ? 1 : -1);
        gameLoop();
    })();
