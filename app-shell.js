/* Office Work shared navigation + offline support + UNIFIED DIALOG SYSTEM.
   Provides: appAlert, appConfirm, appPrompt, appGoBack
   Overrides native window.alert to prevent browser URL exposure.
   This is the SINGLE SOURCE for all custom dialogs.
   Do not redefine appAlert/appConfirm/appPrompt in other files.
*/
(function(){
    'use strict';

    /* =========================================================
       UNIFIED CUSTOM DIALOG SYSTEM
       (Alert + Confirm + Prompt — सर्व एकाच ठिकाणी)
       ========================================================= */
    (function installDialogs(){
        if (window.__officeWorkDialogsInstalled) return;
        window.__officeWorkDialogsInstalled = true;

        function ensureDialog(){
            var old = document.getElementById('ow-dialog-overlay');
            if (old) return old;

            var style = document.createElement('style');
            style.id = 'ow-dialog-style';
            style.textContent =
                '#ow-dialog-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.58);display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;font-family:inherit}' +
                '#ow-dialog-card{width:min(100%,520px);max-height:85vh;overflow:auto;background:#fff;color:#24313b;border-radius:18px;box-shadow:0 18px 55px rgba(0,0,0,.35);padding:22px;box-sizing:border-box}' +
                '#ow-dialog-head{display:flex;align-items:center;gap:10px;border-bottom:3px solid #174ea6;padding-bottom:12px;margin-bottom:16px;color:#174ea6;font-weight:800;font-size:18px}' +
                '#ow-dialog-message{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;font-size:16px;margin:12px 0 20px}' +
                '#ow-dialog-input{width:100%;box-sizing:border-box;border:1px solid #aeb8c2;border-radius:9px;padding:12px;font-size:16px;margin:0 0 18px;color:#202124;background:#fff}' +
                '#ow-dialog-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}' +
                '#ow-dialog-actions button{border:0;border-radius:9px;padding:12px 20px;font-size:16px;font-weight:700;cursor:pointer;min-width:100px}' +
                '#ow-dialog-cancel{background:#e7edf5;color:#24313b}' +
                '#ow-dialog-ok{background:#174ea6;color:#fff}' +
                '#ow-dialog-ok.danger{background:#c62828}' +
                '@media(max-width:420px){#ow-dialog-card{padding:17px}#ow-dialog-actions button{flex:1}}';
            (document.head || document.documentElement).appendChild(style);

            var overlay = document.createElement('div');
            overlay.id = 'ow-dialog-overlay';
            overlay.innerHTML =
                '<div id="ow-dialog-card" role="dialog" aria-modal="true" aria-labelledby="ow-dialog-title">' +
                    '<div id="ow-dialog-head"><span>📘</span><span id="ow-dialog-title">कार्यालयीन डिजिटल हब</span></div>' +
                    '<div id="ow-dialog-message"></div>' +
                    '<input id="ow-dialog-input" style="display:none" autocomplete="off">' +
                    '<div id="ow-dialog-actions">' +
                        '<button type="button" id="ow-dialog-cancel">Cancel</button>' +
                        '<button type="button" id="ow-dialog-ok">OK</button>' +
                    '</div>' +
                '</div>';
            (document.body || document.documentElement).appendChild(overlay);
            return overlay;
        }

        function openDialog(kind, message, options){
            options = options || {};
            return new Promise(function(resolve){
                var overlay = ensureDialog();
                var msg = overlay.querySelector('#ow-dialog-message');
                var input = overlay.querySelector('#ow-dialog-input');
                var cancel = overlay.querySelector('#ow-dialog-cancel');
                var ok = overlay.querySelector('#ow-dialog-ok');
                var title = overlay.querySelector('#ow-dialog-title');

                title.textContent = options.title || 'कार्यालयीन डिजिटल हब';
                msg.textContent = String(message == null ? '' : message);

                input.style.display = kind === 'prompt' ? 'block' : 'none';
                input.value = kind === 'prompt' ? (options.defaultValue || '') : '';
                input.placeholder = options.placeholder || '';

                cancel.style.display = kind === 'alert' ? 'none' : 'inline-block';
                cancel.textContent = options.cancelText || 'Cancel';
                ok.textContent = options.okText || (kind === 'alert' ? 'ठीक आहे' : 'OK');
                ok.classList.toggle('danger', !!options.danger);
                if (kind === 'alert' && options.type === 'ERROR') ok.classList.add('danger');

                overlay.style.display = 'flex';

                var done = false;
                function finish(value){
                    if (done) return;
                    done = true;
                    overlay.style.display = 'none';
                    cancel.onclick = null;
                    ok.onclick = null;
                    overlay.onclick = null;
                    document.removeEventListener('keydown', keyHandler);
                    resolve(value);
                }

                cancel.onclick = function(){ finish(kind === 'prompt' ? null : false); };
                ok.onclick = function(){
                    finish(kind === 'prompt' ? input.value : (kind === 'alert' ? undefined : true));
                };
                overlay.onclick = function(e){
                    if (e.target === overlay && kind !== 'alert') {
                        finish(kind === 'prompt' ? null : false);
                    }
                };

                function keyHandler(e){
                    if (e.key === 'Escape' && kind !== 'alert') {
                        e.preventDefault();
                        finish(kind === 'prompt' ? null : false);
                    } else if (e.key === 'Enter' && kind === 'prompt') {
                        e.preventDefault();
                        finish(input.value);
                    } else if (e.key === 'Enter' && kind === 'alert') {
                        e.preventDefault();
                        finish(undefined);
                    }
                }
                document.addEventListener('keydown', keyHandler);
                setTimeout(function(){ (kind === 'prompt' ? input : ok).focus(); }, 0);
            });
        }

        // ✅ Main dialog functions
        window.appAlert   = function(message, options){ return openDialog('alert',   message, options); };
        window.appConfirm = function(message, options){ return openDialog('confirm', message, options); };
        window.appPrompt  = function(message, options){ return openDialog('prompt',  message, options); };

        // ✅ Native window.alert override (जुने कोड compat साठी)
        var nativeAlert = window.alert;
        window.alert = function(message){
            try {
                window.appAlert(String(message == null ? '' : message));
            } catch (e) {
                try { nativeAlert.call(window, String(message)); } catch (err) {}
            }
        };
    })();

    /* =========================================================
       NAVIGATION FALLBACKS
       ========================================================= */
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

    window.appGoBack = function(){
        var current = location.pathname.split('/').pop() || 'index.html';
        var fallback = FALLBACKS[current] || 'index.html';
        try {
            if (history.length > 1) { history.back(); return; }
        } catch (e) {}
        location.href = fallback;
    };

    document.addEventListener('click', function(event){
        var button = event.target && event.target.closest
            ? event.target.closest('.btn-back-hub')
            : null;
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        window.appGoBack();
    }, true);

    /* =========================================================
       FORM DRAFT PRESERVATION (sessionStorage)
       ========================================================= */
    (function preserveFormDrafts(){
        var pageName = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        var storageKey = 'office_work_form_draft_v1:' + pageName;
        var selector = 'input, select, textarea';

        function eligible(el){
            if (!el || !el.matches || !el.matches(selector)) return false;
            var type = (el.type || '').toLowerCase();
            if (el.disabled || el.hasAttribute('data-no-draft')) return false;
            if (['password','file','hidden','button','submit','reset','image'].indexOf(type) >= 0) return false;
            if (el.closest('[data-no-draft]')) return false;
            return true;
        }
        function controls(){
            return Array.prototype.slice.call(document.querySelectorAll(selector)).filter(eligible);
        }
        function valueOf(el){
            if (el.type === 'checkbox' || el.type === 'radio') return { checked: !!el.checked, value: el.value };
            if (el.tagName === 'SELECT' && el.multiple) {
                return { selected: Array.prototype.slice.call(el.options).map(function(o){ return !!o.selected; }) };
            }
            return { value: el.value };
        }
        function identify(list){
            var seen = Object.create(null);
            return list.map(function(el, i){
                var base = el.id
                    ? 'id:' + el.id
                    : (el.name
                        ? 'name:' + el.name
                        : 'pos:' + el.tagName + ':' + (el.type || '') + ':' + i);
                var occ = seen[base] || 0;
                seen[base] = occ + 1;
                return { el: el, key: base + '#' + occ };
            });
        }
        function restore(){
            try {
                var saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
                if (!saved || !Array.isArray(saved.fields)) return;
                var byKey = Object.create(null);
                saved.fields.forEach(function(it){ if (it && it.key) byKey[it.key] = it; });
                identify(controls()).forEach(function(entry){
                    var item = byKey[entry.key];
                    if (!item || item.tag !== entry.el.tagName) return;
                    var el = entry.el, data = item.data;
                    if (el.type === 'checkbox') { el.checked = !!data.checked; return; }
                    if (el.type === 'radio') { if (el.value === data.value) el.checked = !!data.checked; return; }
                    if (el.tagName === 'SELECT' && el.multiple && data.selected) {
                        Array.prototype.forEach.call(el.options, function(o, i){ o.selected = !!data.selected[i]; });
                        return;
                    }
                    if (typeof data.value === 'string') el.value = data.value;
                });
            } catch (e) {}
        }
        var pending = false;
        function save(){
            if (pending) return;
            pending = true;
            Promise.resolve().then(function(){
                pending = false;
                try {
                    var fields = identify(controls()).map(function(entry){
                        var el = entry.el;
                        return { key: entry.key, tag: el.tagName, type: (el.type || '').toLowerCase(), data: valueOf(el) };
                    });
                    sessionStorage.setItem(storageKey, JSON.stringify({ version: 1, fields: fields }));
                } catch (e) {}
            });
        }
        document.addEventListener('input', function(e){ if (eligible(e.target)) save(); }, true);
        document.addEventListener('change', function(e){ if (eligible(e.target)) save(); }, true);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', restore, { once: true });
        } else {
            restore();
        }
    })();

    /* =========================================================
       SERVICE WORKER REGISTRATION
       ========================================================= */
    if ('serviceWorker' in navigator &&
        (location.protocol === 'https:' ||
         location.hostname === 'localhost' ||
         location.hostname === '127.0.0.1')) {
        window.addEventListener('load', function(){
            navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })
                .then(function(reg){
                    if (reg && reg.update) reg.update().catch(function(){});
                })
                .catch(function(err){ console.warn('SW registration failed:', err); });
        });
    }
})();
