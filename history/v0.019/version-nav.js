(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function fetchJson(url) {
    return fetch(url + (url.indexOf('?') === -1 ? '?t=' : '&t=') + Date.now()).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.json();
    });
  }

  function buildButton(label, href, enabled) {
    var a = document.createElement(enabled ? 'a' : 'span');
    a.textContent = label;
    a.className = 'pv1000-ver-btn' + (enabled ? '' : ' disabled');
    if (enabled) a.href = href;
    return a;
  }

  function injectStyles() {
    if (document.getElementById('pv1000-version-nav-style')) return;
    var style = document.createElement('style');
    style.id = 'pv1000-version-nav-style';
    style.textContent =
      '#pv1000-version-nav{' +
      'position:fixed;top:12px;right:12px;z-index:9999;display:flex;align-items:center;gap:8px;' +
      'padding:8px 10px;border-radius:999px;background:rgba(4,10,16,.88);border:1px solid rgba(126,240,255,.34);' +
      'box-shadow:0 8px 22px rgba(0,0,0,.35);font:12px Consolas,monospace;color:#eaf7ff;backdrop-filter:blur(6px);}' +
      '#pv1000-version-nav .pv1000-ver-btn{' +
      'color:#7ef0ff;text-decoration:none;border:1px solid rgba(126,240,255,.3);padding:4px 8px;border-radius:999px;min-width:52px;text-align:center;}' +
      '#pv1000-version-nav .pv1000-ver-btn:hover{background:rgba(126,240,255,.12);}' +
      '#pv1000-version-nav .pv1000-ver-btn.disabled{color:#67808d;border-color:rgba(103,128,141,.25);}' +
      '#pv1000-version-nav .pv1000-ver-meta{display:flex;flex-direction:column;line-height:1.15;min-width:110px;}' +
      '#pv1000-version-nav .pv1000-ver-label{color:#ffffff;font-weight:bold;}' +
      '#pv1000-version-nav .pv1000-ver-stamp{color:#a8c8d8;font-size:10px;}' +
      '@media (max-width: 720px){#pv1000-version-nav{top:auto;bottom:12px;right:12px;left:12px;justify-content:space-between;border-radius:14px;}#pv1000-version-nav .pv1000-ver-meta{min-width:0;flex:1;}}';
    document.head.appendChild(style);
  }

  ready(function () {
    var script = document.currentScript || document.querySelector('script[data-versions-path]');
    if (!script) return;
    var versionsPath = script.getAttribute('data-versions-path') || 'versions.json';
    var manifestPath = script.getAttribute('data-manifest-path') || 'manifest.json';

    Promise.all([fetchJson(versionsPath), fetchJson(manifestPath)]).then(function (results) {
      var versions = Array.isArray(results[0] && results[0].versions) ? results[0].versions : [];
      var manifest = results[1] || {};
      var currentVersion = 'v' + String(manifest.version || '').replace(/^v/i, '');
      var currentIndex = versions.findIndex(function (v) { return v.version === currentVersion; });
      if (currentIndex < 0) return;

      injectStyles();

      var current = versions[currentIndex];
      var older = currentIndex > 0 ? versions[currentIndex - 1] : null;
      var newer = currentIndex < versions.length - 1 ? versions[currentIndex + 1] : null;

      var nav = document.createElement('div');
      nav.id = 'pv1000-version-nav';
      nav.appendChild(buildButton('Ver -', older && older.url, !!older));

      var meta = document.createElement('div');
      meta.className = 'pv1000-ver-meta';

      var label = document.createElement('div');
      label.className = 'pv1000-ver-label';
      label.textContent = currentVersion + (current.is_current ? ' live' : '');
      meta.appendChild(label);

      var stamp = document.createElement('div');
      stamp.className = 'pv1000-ver-stamp';
      stamp.textContent = current.label || '';
      meta.appendChild(stamp);

      nav.appendChild(meta);
      nav.appendChild(buildButton('Ver +', newer && newer.url, !!newer));
      document.body.appendChild(nav);
    }).catch(function () {
      // Fail quietly; the game should stay playable even if history data is absent.
    });
  });
})();
