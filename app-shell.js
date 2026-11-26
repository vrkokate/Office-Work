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
    // Home/Dashboard वर स्वतंत्र Back, Home, Profile किंवा User Management बार नको.
    if (page === 'index.html' || page === 'dashboard.html') return;
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

    if (page === 'user-management.html') {
      // User Management पानावर फक्त Back - मध्यवर्ती शीर्षक - Home.
      nav.classList.add('shared-app-nav--user-management');
      var heading = document.createElement('strong');
      heading.className = 'shared-app-nav__title';
      heading.textContent = 'User Management';
      nav.appendChild(back);
      nav.appendChild(heading);
      nav.appendChild(home);
    } else {
      nav.appendChild(back);
      nav.appendChild(home);
    }
    document.body.insertBefore(nav, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountNavigation, { once: true });
  } else {
    mountNavigation();
  }
})();
