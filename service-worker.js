/* Offline cache with network-first HTML: fresh online pages, cached fallback offline. */
'use strict';

var CACHE_NAME = 'office-work-offline-v6-final3';

var EXTERNAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

var APP_FILES = [
  './',
  './index.html',
  './MB.html',
  './JE.html',
  './Assign.html',
  './DataManager.html',
  './BillRegister.html',
  './WorkList.html',
  './History.html',
  './pay-fixation.html',
  './da.html',
  './hra.html',
  './form.html',
  './Radio.html',
  './diff_4th_commission.html',
  './diff_5th_commission.html',
  './diff_6th_commission.html',
  './diff_7th_commission.html',
  './common.js',
  './app-shell.js',
  './style.css',
  './home-bg.jpg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      var localAssets = APP_FILES.map(function (url) {
        return fetch(url, { cache: 'reload' })
          .then(function (response) {
            if (response && response.ok) {
              return cache.put(url, response.clone());
            }
          })
          .catch(function () {
            /* Individual unavailable assets must not block install. */
          });
      });

      var remoteAssets = EXTERNAL_ASSETS.map(function (url) {
        return fetch(url, {
          mode: 'no-cors',
          cache: 'reload'
        })
          .then(function (response) {
            if (response) {
              return cache.put(url, response.clone());
            }
          })
          .catch(function () {
            /* CDN may be unavailable; app shell remains installable. */
          });
      });

      return Promise.all(localAssets.concat(remoteAssets));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key.indexOf('office-work-offline-') === 0 &&
                 key !== CACHE_NAME;
        }).map(function (key) {
          return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;

  if (request.method !== 'GET') return;

  var url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  /* For navigations/HTML, prefer the network so changes are not hidden by stale cache. */
  if (
    request.mode === 'navigate' ||
    (
      url.origin === self.location.origin &&
      /\.html?$/i.test(url.pathname)
    )
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).then(function (response) {
        if (response && response.ok &&
            url.origin === self.location.origin) {
          var copy = response.clone();

          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy).catch(function () {});
          });
        }

        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) return cached;
          return caches.match('./index.html');
        });
      })
    );

    return;
  }

  /* Network-first for assets; use cached copy offline. */
  event.respondWith(
    fetch(request).then(function (response) {
      if (response &&
          (response.ok || response.type === 'opaque')) {
        var copy = response.clone();

        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, copy).catch(function () {});
        });
      }

      return response;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) return cached;

        if (request.destination === 'document') {
          return caches.match('./index.html');
        }

        return Response.error();
      });
    })
  );
});
