(function () {
  'use strict';

  var tabs = document.querySelectorAll('.tab');
  var panels = document.querySelectorAll('.panel');

  function activate(targetId) {
    tabs.forEach(function (tab) {
      var isActive = tab.dataset.target === targetId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panels.forEach(function (panel) {
      var isActive = panel.id === targetId;
      panel.classList.toggle('is-active', isActive);
      if (isActive) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
    if (history.replaceState) {
      history.replaceState(null, '', '#' + targetId);
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activate(tab.dataset.target);
    });
  });

  // Open from URL hash if present
  var hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    activate(hash);
  }

  // Avatar tap-to-spin (案C: ウィンク + Z軸360°)
  var avatar = document.querySelector('.avatar');
  if (avatar) {
    avatar.addEventListener('click', function () {
      if (avatar.classList.contains('is-spinning')) return;
      avatar.classList.add('is-spinning');
      window.setTimeout(function () {
        avatar.classList.remove('is-spinning');
      }, 700);
    });

    avatar.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  // 時間帯演出 -----------------------------------------------------------
  // 時間帯定義（hour: 0-23）
  // early-morning  5- 9
  // forenoon       9-12
  // afternoon     12-17
  // evening       17-19
  // night         19-23
  // late-night    23- 5
  var TIME_BANDS = [
    { id: 'early-morning', label: '早朝', start: 5 },
    { id: 'forenoon',      label: '午前', start: 9 },
    { id: 'afternoon',     label: '午後', start: 12 },
    { id: 'evening',       label: '夕方', start: 17 },
    { id: 'night',         label: '夜',   start: 19 },
    { id: 'late-night',    label: '深夜', start: 23 }
  ];

  function bandFromHour(hour) {
    var current = TIME_BANDS[TIME_BANDS.length - 1];
    for (var i = 0; i < TIME_BANDS.length; i++) {
      if (hour >= TIME_BANDS[i].start) current = TIME_BANDS[i];
    }
    if (hour < TIME_BANDS[0].start) current = TIME_BANDS[TIME_BANDS.length - 1];
    return current;
  }

  var overrideBandId = null;

  function applyBand(band) {
    document.body.setAttribute('data-time-band', band.id);
    var valueEl = document.querySelector('.time-debug__value');
    if (valueEl) valueEl.textContent = band.id + '（' + band.label + '）';
  }

  function updateBandFromClock() {
    if (overrideBandId) return;
    applyBand(bandFromHour(new Date().getHours()));
  }

  // 星パーティクル生成（夜・深夜で表示。常時生成しても opacity:0 で隠れる）
  function spawnStars() {
    var container = document.querySelector('.stars');
    if (!container || container.childElementCount > 0) return;
    var count = 36;
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.top = (Math.random() * 100).toFixed(2) + '%';
      s.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
      s.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);
      var size = 1 + Math.random() * 2;
      s.style.width = size.toFixed(1) + 'px';
      s.style.height = size.toFixed(1) + 'px';
      container.appendChild(s);
    }
  }

  spawnStars();

  // ?band=<id> で初期時間帯を強制（スクショ撮影・検証用）
  var bandParam = (window.location.search.match(/[?&]band=([\w-]+)/) || [])[1];
  if (bandParam) {
    for (var bi = 0; bi < TIME_BANDS.length; bi++) {
      if (TIME_BANDS[bi].id === bandParam) {
        overrideBandId = bandParam;
        applyBand(TIME_BANDS[bi]);
        break;
      }
    }
  }

  updateBandFromClock();
  // 1分ごとに再判定（時間帯境界を跨いだ時の追従用）
  window.setInterval(updateBandFromClock, 60 * 1000);

  // デバッグ切替UI -----------------------------------------------------
  var debugEnabledRuntime = false;

  function isDebugEnabled() {
    if (/[?&]debug=1\b/.test(window.location.search)) return true;
    return debugEnabledRuntime;
  }

  function showToast(message) {
    var t = document.createElement('div');
    t.className = 'time-debug-toast';
    t.textContent = message;
    document.body.appendChild(t);
    window.setTimeout(function () {
      t.classList.add('is-leaving');
      window.setTimeout(function () { t.remove(); }, 300);
    }, 1200);
  }

  // フッターを3連タップ（800ms以内）でデバッグUIをトグル（セッション内のみ。リロードで解除）
  (function () {
    var footer = document.querySelector('footer');
    if (!footer) return;
    var taps = [];
    footer.addEventListener('click', function () {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 800; });
      taps.push(now);
      if (taps.length >= 3) {
        taps = [];
        debugEnabledRuntime = !debugEnabledRuntime;
        if (debugEnabledRuntime) {
          showToast('デバッグ有効');
          buildDebugUI();
        } else {
          showToast('デバッグ無効');
          var box = document.querySelector('.time-debug');
          if (box) box.remove();
          overrideBandId = null;
          updateBandFromClock();
        }
      }
    });
  })();

  function buildDebugUI() {
    if (!isDebugEnabled()) return;
    if (document.querySelector('.time-debug')) return;

    var box = document.createElement('div');
    box.className = 'time-debug';

    var row = document.createElement('div');
    row.className = 'time-debug__row';
    var label = document.createElement('span');
    label.className = 'time-debug__label';
    label.textContent = 'time-band:';
    var value = document.createElement('span');
    value.className = 'time-debug__value';
    row.appendChild(label);
    row.appendChild(value);

    var controls = document.createElement('div');
    controls.className = 'time-debug__row';

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.textContent = '◀';
    var next = document.createElement('button');
    next.type = 'button';
    next.textContent = '▶';
    var auto = document.createElement('button');
    auto.type = 'button';
    auto.textContent = 'auto';

    function step(dir) {
      var currentId = overrideBandId || document.body.getAttribute('data-time-band');
      var idx = 0;
      for (var i = 0; i < TIME_BANDS.length; i++) {
        if (TIME_BANDS[i].id === currentId) { idx = i; break; }
      }
      idx = (idx + dir + TIME_BANDS.length) % TIME_BANDS.length;
      overrideBandId = TIME_BANDS[idx].id;
      applyBand(TIME_BANDS[idx]);
    }

    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    auto.addEventListener('click', function () {
      overrideBandId = null;
      updateBandFromClock();
    });

    controls.appendChild(prev);
    controls.appendChild(next);
    controls.appendChild(auto);

    box.appendChild(row);
    box.appendChild(controls);
    document.body.appendChild(box);

    // 初期表示の値を反映
    var current = overrideBandId
      ? TIME_BANDS.filter(function (b) { return b.id === overrideBandId; })[0]
      : bandFromHour(new Date().getHours());
    if (current) value.textContent = current.id + '（' + current.label + '）';
  }

  buildDebugUI();
})();
