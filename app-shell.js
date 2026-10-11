/* Office Work shared navigation + offline support.
   Does not alter business data, calculations, or localStorage keys. */
(function () {
  'use strict';

  /* Global app message: replace Chrome's native alert, which exposes the site URL.
     Show only the actual message requested by the action, with a simple OK button. */
  (function installAppMessage() {
    var nativeAlert = window.alert;
    window.alert = function (message) {
      var text = (message === undefined || message === null) ? '' : String(message);
      if (!document.body) {
        try { nativeAlert.call(window, text); } catch (e) {}
        return;
      }
      var previous = document.getElementById('officeWorkMessageOverlay');
      if (previous) previous.remove();

      var overlay = document.createElement('div');
      overlay.id = 'officeWorkMessageOverlay';
      overlay.setAttribute('role', 'presentation');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;';

      var panel = document.createElement('div');
      panel.setAttribute('role', 'alertdialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', 'सूचना');
      panel.style.cssText = 'width:min(100%,520px);box-sizing:border-box;background:#fff;border-radius:18px;padding:24px 20px 18px;box-shadow:0 12px 40px rgba(0,0,0,.3);font-family:inherit;color:#263238;text-align:left;';

      var messageEl = document.createElement('div');
      messageEl.textContent = text;
      messageEl.style.cssText = 'font-size:18px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 22px;';

      var actions = document.createElement('div');
      actions.style.cssText = 'display:flex;justify-content:flex-end;';
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.textContent = 'ठीक आहे';
      ok.style.cssText = 'border:0;border-radius:9px;padding:10px 22px;background:#2e7d32;color:#fff;font-size:16px;font-weight:600;min-width:96px;cursor:pointer;';
      function closeMessage() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
      ok.addEventListener('click', closeMessage);
      overlay.addEventListener('click', function (event) { if (event.target === overlay) closeMessage(); });
      panel.appendChild(messageEl);
      actions.appendChild(ok);
      panel.appendChild(actions);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      ok.focus();
      overlay.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' || event.key === 'Enter') { event.preventDefault(); closeMessage(); }
      });
    };
  })();

  /* Custom yes/no dialog. Use appConfirm(...).then(function (confirmed) { ... })
     because a custom browser dialog cannot return a synchronous Boolean. */
  window.appConfirm = function (message, options) {
    return new Promise(function (resolve) {
      var previous = document.getElementById('officeWorkConfirmOverlay');
      if (previous) previous.remove();

      var opts = options || {};
      var overlay = document.createElement('div');
      overlay.id = 'officeWorkConfirmOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.50);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;';

      var panel = document.createElement('div');
      panel.setAttribute('role', 'alertdialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', opts.title || 'पुष्टी');
      panel.style.cssText = 'width:min(100%,520px);box-sizing:border-box;background:#fff;border-radius:18px;padding:22px 20px 18px;box-shadow:0 12px 40px rgba(0,0,0,.3);font-family:inherit;color:#263238;';

      var title = document.createElement('div');
      title.textContent = opts.title || 'पुष्टी करा';
      title.style.cssText = 'font-size:20px;font-weight:700;margin:0 0 12px;';

      var messageEl = document.createElement('div');
      messageEl.textContent = String(message == null ? '' : message);
      messageEl.style.cssText = 'font-size:18px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 22px;';

      var actions = document.createElement('div');
      actions.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;';

      function finish(result) {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }
      function makeButton(label, result, color) {
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.style.cssText = 'border:0;border-radius:9px;padding:10px 18px;background:' + color + ';color:#fff;font-size:16px;font-weight:600;min-width:96px;cursor:pointer;';
        button.addEventListener('click', function () { finish(result); });
        actions.appendChild(button);
        return button;
      }
      makeButton(opts.cancelText || 'रद्द करा', false, '#64748b');
      var yesButton = makeButton(opts.okText || 'होय', true, opts.okColor || '#2e7d32');
      overlay.addEventListener('click', function (event) { if (event.target === overlay) finish(false); });
      overlay.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { event.preventDefault(); finish(false); }
      });
      panel.appendChild(title);
      panel.appendChild(messageEl);
      panel.appendChild(actions);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      yesButton.focus();
    });
  };

  var FALLBACKS = {
    'Assign.html': 'MB.html',
    'JE.html': 'MB.html',
    'DataManager.html': 'MB.html',
    'MB.html': 'index.html',
    'BillRegister.html': 'MB.html',
    'WorkList.html': 'MB.html',
    'History.html': 'index.html',
    'pay-fixation.html': 'index.html',
    'da.html': 'index.html',
    'hra.html': 'index.html',
    'form.html': 'index.html',
    'diff_4th_commission.html': 'index.html',
    'diff_5th_commission.html': 'index.html',
    'diff_6th_commission.html': 'index.html',
    'diff_7th_commission.html': 'index.html'
  };

  window.appGoBack = function () {
    var current = location.pathname.split('/').pop() || 'index.html';
    var fallback = FALLBACKS[current] || 'index.html';
    try {
      if (history.length > 1) {
        history.back();
        return;
      }
    } catch (e) {}
    location.href = fallback;
  };

  // Use a consistent back action for existing module back buttons only.
  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('.btn-back-hub') : null;
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.appGoBack();
  }, true);

  // Preserve in-progress form entries across Chrome refreshes for this tab.
  // Use sessionStorage (not Cache API/localStorage) so this does not overwrite
  // application records or keep stale drafts indefinitely across browser sessions.
  (function preserveFormDrafts() {
    var pageName = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var storageKey = 'office_work_form_draft_v1:' + pageName;
    var selector = 'input, select, textarea';

    function eligible(el) {
      if (!el || !el.matches || !el.matches(selector)) return false;
      var type = (el.type || '').toLowerCase();
      if (el.disabled || el.hasAttribute('data-no-draft')) return false;
      if (['password', 'file', 'hidden', 'button', 'submit', 'reset', 'image'].indexOf(type) >= 0) return false;
      if (el.closest('[data-no-draft]')) return false;
      return true;
    }

    function controls() {
      return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(eligible);
    }

    function valueOf(el) {
      if (el.type === 'checkbox' || el.type === 'radio') return { checked: !!el.checked, value: el.value };
      if (el.tagName === 'SELECT' && el.multiple) {
        return { selected: Array.prototype.slice.call(el.options).map(function (o) { return !!o.selected; }) };
      }
      return { value: el.value };
    }

    function applyValue(el, saved) {
      if (!saved) return;
      if (el.type === 'checkbox') { el.checked = !!saved.checked; return; }
      if (el.type === 'radio') {
        if (el.value === saved.value) el.checked = !!saved.checked;
        return;
      }
      if (el.tagName === 'SELECT' && el.multiple && saved.selected) {
        Array.prototype.forEach.call(el.options, function (o, i) { o.selected = !!saved.selected[i]; });
        return;
      }
      if (typeof saved.value === 'string' && el.value !== saved.value) {
        // Restore only a matching control position/type; never execute saved content.
        el.value = saved.value;
      }
    }

    function identify(list) {
      var seen = Object.create(null);
      return list.map(function (el, i) {
        var base = el.id ? 'id:' + el.id : (el.name ? 'name:' + el.name : 'pos:' + el.tagName + ':' + (el.type || '') + ':' + i);
        var occurrence = seen[base] || 0;
        seen[base] = occurrence + 1;
        return { el: el, key: base + '#' + occurrence };
      });
    }

    function restore() {
      try {
        var saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
        if (!saved || !Array.isArray(saved.fields)) return;
        var list = identify(controls());
        var byKey = Object.create(null);
        saved.fields.forEach(function (item) { if (item && item.key) byKey[item.key] = item; });
        list.forEach(function (entry) {
          var item = byKey[entry.key];
          if (item && item.tag === entry.el.tagName && item.type === (entry.el.type || '').toLowerCase()) applyValue(entry.el, item.data);
        });
      } catch (e) { /* Storage may be unavailable in restricted browsing modes. */ }
    }

    var savePending = false;
    function save() {
      if (savePending) return;
      savePending = true;
      Promise.resolve().then(function () {
        savePending = false;
        try {
          var fields = identify(controls()).map(function (entry) {
            var el = entry.el;
            return { key: entry.key, tag: el.tagName, type: (el.type || '').toLowerCase(), data: valueOf(el) };
          });
          sessionStorage.setItem(storageKey, JSON.stringify({ version: 1, fields: fields }));
        } catch (e) { /* Do not interrupt normal data entry if storage is full/blocked. */ }
      });
    }

    document.addEventListener('input', function (e) { if (eligible(e.target)) save(); }, true);
    document.addEventListener('change', function (e) { if (eligible(e.target)) save(); }, true);
    document.addEventListener('reset', function (e) {
      var form = e.target;
      window.setTimeout(function () {
        try {
          if (form && form.querySelector && form.querySelector(selector)) {
            // Save the intentionally reset form state rather than resurrecting old entries.
            save();
          }
        } catch (err) {}
      }, 0);
    }, true);

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restore, { once: true });
    else restore();

    // Include fields added later by dialogs or dynamic sections.
    if (window.MutationObserver && document.documentElement) {
      var observer = new MutationObserver(function (records) {
        var added = records.some(function (r) { return r.addedNodes && r.addedNodes.length; });
        if (added) {
          restore();
          save();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  })();

  // Service workers require HTTPS or localhost; file:// pages still open locally,
  // but cannot register an offline cache under browser security rules.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })
        .then(function (registration) {
          if (registration && registration.update) registration.update().catch(function () {});
        })
        .catch(function (error) { console.warn('Offline support registration failed:', error); });
    });
  }
})();
