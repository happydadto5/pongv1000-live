// PongV1000 v0.001 — Classic Pong baseline
// Autonomously evolved by PongV1000 agent. Do not edit manually.
// https://happydadto5.github.io/pongv1000-live/

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
  var BALL_SPEED = 5;
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
    var t = e.touches[0];
    var r = canvas.getBoundingClientRect();
    var ty = (t.clientY - r.top) * (canvas.height / r.height);
    if (t.clientX - r.left < r.width / 2) {
      state.lp.y = ty - PAD_H() / 2;
    }
  }, { passive: false });

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------
  function clamp(pad) {
    pad.y = Math.max(0, Math.min(canvas.height - PAD_H(), pad.y));
  }

  function update() {
    var b  = state.ball;
    var lp = state.lp;
    var rp = state.rp;
    var ph = PAD_H();
    var bs = BALL_SIZE();
    var pm = PAD_MARGIN();

    // Player paddle
    if (lp.up) lp.y -= PSPEED;
    if (lp.dn) lp.y += PSPEED;
    clamp(lp);

    // AI paddle (tracks ball with slight lag)
    var aiCenter = rp.y + ph / 2;
    if (aiCenter < b.y - 4) rp.y += PSPEED * 0.82;
    if (aiCenter > b.y + 4) rp.y -= PSPEED * 0.82;
    clamp(rp);

    // Ball movement
    b.x += b.vx;
    b.y += b.vy;

    // Wall bounce (top/bottom)
    if (b.y <= 0) {
      b.y = 0;
      b.vy = Math.abs(b.vy);
      playBlip(220, 0.06);
    }
    if (b.y + bs >= canvas.height) {
      b.y = canvas.height - bs;
      b.vy = -Math.abs(b.vy);
      playBlip(220, 0.06);
    }

    // Left paddle collision
    if (b.x <= pm + PAD_W &&
        b.y + bs >= lp.y && b.y <= lp.y + ph) {
      b.vx = Math.abs(b.vx) * 1.04;
      b.x  = pm + PAD_W + 1;
      playBlip(440, 0.08);
    }

    // Right paddle collision
    if (b.x + bs >= canvas.width - pm - PAD_W &&
        b.y + bs >= rp.y && b.y <= rp.y + ph) {
      b.vx = -Math.abs(b.vx) * 1.04;
      b.x  = canvas.width - pm - PAD_W - bs - 1;
      playBlip(440, 0.08);
    }

    // Score
    if (b.x < 0) {
      rp.score++;
      playBlip(180, 0.25);
      reset();
    }
    if (b.x > canvas.width) {
      lp.score++;
      playBlip(660, 0.2);
      reset();
    }
  }

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------
  function draw() {
    var w  = canvas.width;
    var h  = canvas.height;
    var ph = PAD_H();
    var bs = BALL_SIZE();
    var pm = PAD_MARGIN();

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // Centre line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.floor(h * 0.09) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.lp.score, w * 0.25, h * 0.12);
    ctx.fillText(state.rp.score, w * 0.75, h * 0.12);

    // Paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(pm,             state.lp.y, PAD_W, ph);
    ctx.fillRect(w - pm - PAD_W, state.rp.y, PAD_W, ph);

    // Ball
    ctx.fillRect(state.ball.x, state.ball.y, bs, bs);
  }

  // -------------------------------------------------------------------------
  // Game loop
  // -------------------------------------------------------------------------
  (function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  })();

})();
