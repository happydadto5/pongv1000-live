(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // Canvas setup
  // -------------------------------------------------------------------------
  const canvas = document.getElementById('gameCanvas');
  const ctx    = canvas.getContext('2d');

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const aspect = 4 / 3;
    if (w / h > aspect) {
      canvas.height = Math.floor(h * 0.96);
      canvas.width  = Math.floor(canvas.height * aspect);
    } else {
      canvas.width  = Math.floor(w * 0.96);
      canvas.height = Math.floor(canvas.width / aspect);
    }
  }
  resize();
  window.addEventListener('resize', resize);

  // -------------------------------------------------------------------------
  // Audio — lazy init required for iOS Safari
  // Never create AudioContext at load time.
  // -------------------------------------------------------------------------
  let _audioCtx = null;

  function getAudioCtx() {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume();
    }
    return _audioCtx;
  }

  // Unlock audio on first user interaction (all platforms)
  ['click', 'keydown', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, function () { getAudioCtx(); }, { once: true, passive: true });
  });

  function playBlip(freq, dur) {
    try {
      var ac = getAudioCtx();
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + dur);
    } catch (e) { /* audio unavailable — fail silently */ }
  }

  // -------------------------------------------------------------------------
  // Game constants (functions to recalculate on resize)
  // -------------------------------------------------------------------------
  var BALL_SPEED = 5; // Increased ball speed for better challenge
  var PSPEED    = 6;
  var PAD_W     = 12;

  function PAD_H() { return Math.floor(canvas.height * 0.15); }
  function BALL_SIZE() { return Math.max(8, Math.floor(canvas.width * 0.013)); }
  function PAD_MARGIN() { return Math.floor(canvas.width * 0.025); }

  // -------------------------------------------------------------------------
  // Game state
  // -------------------------------------------------------------------------
  var state = {
    lp:   { y: 0, score: 0, up: false, dn: false },
    rp:   { y: 0, score: 0 },
    ball: { x: 0, y: 0, vx: BALL_SPEED, vy: BALL_SPEED * 0.7 },
    phase: 'playing', // 'playing'
  };

  function resetBall() {
    state.ball.x  = canvas.width  / 2;
    state.ball.y  = canvas.height / 2;
    state.ball.vx = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    state.ball.vy = BALL_SPEED * 0.7 * (Math.random() > 0.5 ? 1 : -1);
  }

  function reset() {
    state.lp.y = state.rp.y = canvas.height / 2 - PAD_H() / 2;
    resetBall();
  }
  reset();

  // -------------------------------------------------------------------------
  // Input
  // -------------------------------------------------------------------------
  document.addEventListener('keydown', function (e) {
    if (e.key === 'w' || e.key === 'ArrowUp')    state.lp.up = true;
    if (e.key === 's' || e.key === 'ArrowDown')  state.lp.dn = true;
  });
  document.addEventListener('keyup', function (e) {
    if (e.key === 'w' || e.key === 'ArrowUp')    state.lp.up = false;
    if (e.key === 's' || e.key === 'ArrowDown')  state.lp.dn = false;
  });

  // Touch: drag left half of screen to move left paddle
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const y = touch.clientY - rect.top;
      const paddleHeight = PAD_H();
      const minY = canvas.height / 2 - paddleHeight / 2;
      const maxY = canvas.height / 2 + paddleHeight / 2;
      state.lp.y = Math.max(minY, Math.min(maxY, y));
    }
  }, { passive: false });

  // -------------------------------------------------------------------------
  // Game loop
  // -------------------------------------------------------------------------
  function update() {
    // Update ball position
    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    // Collision with top/bottom walls
    if (state.ball.y <= 0 || state.ball.y >= canvas.height) {
      state.ball.vy *= -1;
    }

    // Collision with paddles
    const pm = PAD_MARGIN();
    const lp = state.lp;
    const rp = state.rp;

    // Left paddle collision
    if (state.ball.x <= PAD_W + pm && state.ball.y > lp.y && state.ball.y < lp.y + PAD_H()) {
      state.ball.vx *= -1;
    }
    // Right paddle collision
    if (state.ball.x >= canvas.width - PAD_W - pm && state.ball.y > rp.y && state.ball.y < rp.y + PAD_H()) {
      state.ball.vx *= -1;
    }

    // Collision with left/right walls
    if (state.ball.x <= 0 || state.ball.x >= canvas.width) {
      // Reset ball
      resetBall();
      // Reset paddles
      state.lp.y = state.rp.y = canvas.height / 2 - PAD_H() / 2;
    }
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = 'white';
    ctx.fillRect(state.lp.x, state.lp.y, PAD_W, PAD_H());
    ctx.fillRect(state.rp.x, state.rp.y, PAD_W, PAD_H());

    // Draw ball
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_SIZE() / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();