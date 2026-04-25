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
})();
