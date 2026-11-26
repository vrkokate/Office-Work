/* Shared navigation shell for all authenticated app pages.
 * New pages: include <script src="app-shell.js" defer></script> in <head>.
 * The common Back/Home bar is injected automatically; no page-specific header markup is needed.
 */
(function () {
  'use strict';
  if (window.__officeWorkSharedNavigationLoaded) return;
  window.__officeWorkSharedNavigationLoaded = true;

  var page = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
  var backTargets = {
    'dashboard.html': 'index.html',
    'establishment.html': 'dashboard.html',
    'mb-dashboard.html': 'establishment.html',
    'mb-je.html': 'mb-dashboard.html',
    'mb-register.html': 'mb-dashboard.html',
    'mb-work-list.html': 'mb-dashboard.html',
    'mb-bill-reg.html': 'mb-dashboard.html',
    'mb-add-entry.html': 'mb-register.html',
    'pay-fixation.html': 'establishment.html',
    'user-management.html': 'dashboard.html',
    'profile.html': 'dashboard.html'
  };

  function addStyles() {
    if (!document.querySelector('link[data-shared-nav-fontawesome]') &&
        !document.querySelector('link[href*="font-awesome"],link[href*="fontawesome"]')) {
      var fa = document.createElement('link');
      fa.rel = 'stylesheet';
      fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      fa.setAttribute('data-shared-nav-fontawesome', 'true');
      document.head.appendChild(fa);
    }
    if (!document.querySelector('link[data-shared-nav-css]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'common-nav.css';
      css.setAttribute('data-shared-nav-css', 'true');
      document.head.appendChild(css);
    }
  }

  function mountNavigation() {
    if (!document.body || document.getElementById('shared-app-navigation')) return;
    // Login/registration screen intentionally has no in-app navigation.
    if (page === 'index.html') return;
    addStyles();

    var nav = document.createElement('nav');
    nav.id = 'shared-app-navigation';
    nav.className = 'shared-app-nav';
    nav.setAttribute('aria-label', 'मुख्य नेव्हिगेशन');

    var back = document.createElement('a');
    back.className = 'shared-app-nav__icon';
    back.href = backTargets[page] || 'dashboard.html';
    back.setAttribute('aria-label', 'मागील पृष्ठ');
    back.setAttribute('title', 'मागे');
    back.innerHTML = '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i>';

    // Use browser history only when the previous page belongs to this same app.
    back.addEventListener('click', function (event) {
      var ref = document.referrer;
      if (ref) {
        try {
          if (new URL(ref).origin === location.origin) {
            event.preventDefault();
            history.back();
          }
        } catch (_) { /* Keep the safe fallback href. */ }
      }
    });

    var home = document.createElement('a');
    home.className = 'shared-app-nav__icon';
    home.href = 'dashboard.html';
    home.setAttribute('aria-label', 'मुख्य पृष्ठ');
    home.setAttribute('title', 'होम');
    home.innerHTML = '<i class="fa-solid fa-house" aria-hidden="true"></i>';

    nav.appendChild(back);
    nav.appendChild(home);

    // प्रत्येक लॉगिन केलेल्या वापरकर्त्यास स्वतःचे Profile; Admin ला User Management.
    var profile = document.createElement('a');
    profile.className = 'shared-app-nav__icon shared-app-nav__action';
    profile.href = 'profile.html';
    profile.setAttribute('aria-label', 'माझे प्रोफाइल');
    profile.setAttribute('title', 'माझे प्रोफाइल');
    profile.innerHTML = '<i class="fa-solid fa-user-circle" aria-hidden="true"></i>';
    nav.appendChild(profile);

    if (localStorage.getItem('userRole') === 'admin') {
      var users = document.createElement('a');
      users.className = 'shared-app-nav__icon shared-app-nav__action';
      users.href = 'user-management.html';
      users.setAttribute('aria-label', 'User Management');
      users.setAttribute('title', 'User Management');
      users.innerHTML = '<i class="fa-solid fa-users-gear" aria-hidden="true"></i>';
      nav.appendChild(users);
    }
    document.body.insertBefore(nav, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountNavigation, { once: true });
  } else {
    mountNavigation();
  }
})();
