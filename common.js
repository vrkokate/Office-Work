/* DMBMS CENTRAL DATA LAYER + INSTANT SYNC
   All modules use the same localStorage records.
   Any ADD / EDIT / DELETE / ISSUE / RECEIVE / UPDATE is immediately
   broadcast to other open pages/tabs and refreshed on the current page.
*/

(function(){
    'use strict';

    if (window.__DMBMS_COMMON_SYNC__) return;
    window.__DMBMS_COMMON_SYNC__ = true;

    var CHANNEL_NAME = 'DMBMS_CENTRAL_DATA_SYNC_V1';
    var channel = null;

    try {
        if ('BroadcastChannel' in window) {
            channel = new BroadcastChannel(CHANNEL_NAME);
        }
    } catch(e) {}

    window.__dmbmsNotifyChange = window.__dmbmsNotifyChange || function(key, action){

        var msg = {
            key: key || '*',
            action: action || 'UPDATE',
            time: Date.now(),
            source: Math.random().toString(36).slice(2)
        };

        try {
            window.dispatchEvent(
                new CustomEvent('dmbms:datachange', {
                    detail: msg
                })
            );
        } catch(e) {}

        try {
            if(channel) {
                channel.postMessage(msg);
            }
        } catch(e) {}
    };

    function refresh(){

        var fn = window.refreshAll;

        if(typeof fn !== 'function') return;

        if(window.__DMBMS_SYNC_REFRESH_TIMER) {
            clearTimeout(window.__DMBMS_SYNC_REFRESH_TIMER);
        }

        window.__DMBMS_SYNC_REFRESH_TIMER = setTimeout(function(){

            try {
                fn();
            } catch(e) {
                console.warn('DMBMS central refresh:', e);
            }

            try {

                if(typeof window.refreshBillDashboard === 'function') {
                    window.refreshBillDashboard();
                }

                if(typeof window.refreshMBDashboard === 'function') {
                    window.refreshMBDashboard();
                }

            } catch(e) {}

        }, 0);
    }

    /* LocalStorage बदलल्यास */
    window.addEventListener('storage', function(e){

        if(e && e.key) {
            refresh();
        }

    });

    /* Current page data change */
    window.addEventListener('dmbms:datachange', function(){

        refresh();

    });

    /* दुसऱ्या open tab/page मधून change */
    if(channel) {

        channel.onmessage = function(e){

            if(e && e.data) {
                refresh();
            }

        };

    }

    /* Page पुन्हा visible झाल्यावर */
    document.addEventListener('visibilitychange', function(){

        if(!document.hidden) {
            refresh();
        }

    });

    /* Window focus झाल्यावर */
    window.addEventListener('focus', refresh);

})();


/* =========================================================
   SMART SYSTEM MESSAGE
   ========================================================= */

function showAlert(msg, type) {

    /* Existing project custom message system, if present. */

    if(typeof window.openCustomMessage === 'function') {
        return window.openCustomMessage(msg, type);
    }

    if(typeof window.showSystemMessage === 'function') {
        return window.showSystemMessage(msg, type);
    }

    /*
       Last-resort non-browser-blocking message.
       Never use native alert().
    */

    var old = document.getElementById('dmbmsInlineMessage');

    if(old) {
        old.remove();
    }

    var box = document.createElement('div');

    box.id = 'dmbmsInlineMessage';

    box.style.cssText =
        'position:fixed;' +
        'left:50%;' +
        'top:50%;' +
        'transform:translate(-50%,-50%);' +
        'z-index:99999;' +
        'background:#fff;' +
        'border-radius:12px;' +
        'box-shadow:0 10px 35px rgba(0,0,0,.3);' +
        'padding:18px;' +
        'max-width:90vw;' +
        'width:360px;' +
        'text-align:center;' +
        'font-family:inherit;';

    var icon = 'ℹ️';

    if(type === 'ERROR') {
        icon = '⚠️';
    }

    if(type === 'SUCCESS') {
        icon = '✅';
    }

    var safeMsg = String(msg || '').replace(
        /[&<>]/g,
        function(c){
            return {
                '&':'&amp;',
                '<':'&lt;',
                '>':'&gt;'
            }[c];
        }
    );

    box.innerHTML =
        '<div style="' +
        'font-size:18px;' +
        'font-weight:800;' +
        'color:#0d47a1;' +
        'margin-bottom:8px;">' +
        icon +
        '</div>' +

        '<div style="' +
        'font-size:14px;' +
        'line-height:1.55;' +
        'color:#263238;' +
        'white-space:pre-wrap;">' +
        safeMsg +
        '</div>' +

        '<button ' +
        'style="' +
        'margin-top:14px;' +
        'background:#0d47a1;' +
        'color:#fff;' +
        'border:0;' +
        'border-radius:7px;' +
        'padding:8px 24px;' +
        'font-weight:700;" ' +
        'onclick="this.parentElement.remove()">' +
        'ठीक आहे' +
        '</button>';

    document.body.appendChild(box);
}


/* =========================================================
   CENTRAL DATA READ
   ========================================================= */

function getData(key) {

    try {

        return JSON.parse(
            localStorage.getItem(key) || '[]'
        );

    } catch(e) {

        return [];

    }

}


/* =========================================================
   CENTRAL DATA WRITE + INSTANT SYNC
   ========================================================= */


/* =========================================================
   CENTRAL HISTORY ENTRY FOR COMMON setData WRITES
   ========================================================= */

function recordCentralDataHistory(key, data) {
    try {
        if (!key || key === 'digital_hub_central_history' || key === 'office_work_auto_snapshot_v1') return;

        var historyKey = 'digital_hub_central_history';
        var records = [];
        try {
            var rawHistory = localStorage.getItem(historyKey);
            var parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
            if (Array.isArray(parsedHistory)) records = parsedHistory;
        } catch (e) {}

        var now = new Date();
        var dateStr = String(now.getDate()).padStart(2, '0') + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' + now.getFullYear();
        var timestamp = now.toISOString();
        var moduleMap = {
            mb_records: 'M.B.',
            je_records: 'JE Management',
            work_records: 'Work List',
            assign_records: 'Assign',
            bill_records: 'Bill Register',
            dmbms_bills: 'Bill Register',
            savedPayFixationsList: 'Pay Fixation',
            hraRecords: 'HRA',
            est_records: 'Est.'
        };
        var moduleName = moduleMap[key] || 'General';
        var count = Array.isArray(data) ? data.length :
            (data && typeof data === 'object' ? Object.keys(data).length : 1);
        records.unshift({
            schemaVersion: '1.0',
            source: moduleName,
            createdAt: timestamp,
            id: 'AUTO-' + timestamp.replace(/[-:.TZ]/g, '') + '-' + Math.random().toString(36).slice(2, 7),
            date: dateStr,
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            timestamp: timestamp,
            module: moduleName,
            action: 'UPDATE',
            recordName: key,
            recordId: '—',
            mbNumber: '—',
            mbSize: '—',
            receivedFrom: '—',
            oldData: {},
            newData: { itemCount: count },
            changes: 'नोंदी setData() द्वारे जतन/अपडेट केल्या',
            status: '—',
            user: 'System',
            remark: 'स्वयंचलित History नोंद; हा बदल तपशीलवार field-level audit नाही.'
        });
        if (records.length > 2000) records.length = 2000;
        localStorage.setItem(historyKey, JSON.stringify(records));
    } catch (e) {
        // History logging must never block the original data write.
        console.warn('Central history entry skipped:', e);
    }
}


/* Best-effort key-level recovery snapshot; avoids duplicating all localStorage data. */
function saveOfficeWorkRecoverySnapshot(changedKey) {
    try {
        if (!changedKey || changedKey === 'office_work_auto_snapshot_v1') return;
        var raw = localStorage.getItem(String(changedKey));
        if (raw === null) return;
        var savedValue;
        try { savedValue = JSON.parse(raw); }
        catch (e) { savedValue = { __rawStringValue: raw }; }
        localStorage.setItem('office_work_auto_snapshot_v1', JSON.stringify({
            app: 'Office-Work',
            snapshotVersion: 1,
            createdAt: new Date().toISOString(),
            changedKey: String(changedKey),
            data: savedValue
        }));
    } catch (e) {
        console.warn('Automatic recovery snapshot skipped:', e);
    }
}

function setData(key, data) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(data)
        );

        recordCentralDataHistory(key, data);
        saveOfficeWorkRecoverySnapshot(key);

        if(typeof window.__dmbmsNotifyChange === 'function') {

            window.__dmbmsNotifyChange(
                key,
                'UPDATE'
            );

        }

    } catch(e) {}

}


/* =========================================================
   EXACT M.B. NUMBER NORMALIZATION
   ========================================================= */

function normalizeMB(val) {

    return val
        ? val.toString().trim()
        : '';

}


/* =========================================================
   GET LATEST M.B. STATUS
   ========================================================= */

function getLatestMBStatus(mbNumber) {

    var allMBs = getData('mb_records');

    var normalizedNo = normalizeMB(mbNumber);

    for(var i = allMBs.length - 1; i >= 0; i--) {

        var m = allMBs[i];

        /*
           Exact string comparison.
           0066 != 066
           0066 != 06
           0006 != 06
        */

        if(
            normalizeMB(m.mbNumber) === normalizedNo
        ) {

            return {

                mbNumber: m.mbNumber,

                lastAction: m.actionType,

                date: m.date,

                receivedDetail: m.receivedDetail,

                size: m.size,

                index: i

            };

        }

    }

    return null;

}


/* =========================================================
   UNIQUE RECEIVED M.B.
   ========================================================= */

function getUniqueReceivedMBs() {

    var allMBs = getData('mb_records');

    var uniqueMap = {};

    allMBs.forEach(function(m){

        if(
            m.actionType === 'मिळालेली M.B.' ||
            m.actionType === 'मिळालेली एमबी'
        ){

            var no = (
                m.mbNumber || ''
            ).trim();

            if(no) {

                uniqueMap[
                    normalizeMB(no)
                ] = {

                    mbNumber: no,

                    size:
                        m.size ||
                        'लहान M.B.',

                    date: m.date

                };

            }

        }

    });

    var list = [];

    for(var k in uniqueMap) {

        list.push(
            uniqueMap[k]
        );

    }

    return list;

}


/* =========================================================
   CURRENTLY GIVEN M.B.
   ========================================================= */

function getCurrentlyActiveGivenMBs() {

    var allMBs = getData('mb_records');

    var latestMap = {};

    allMBs.forEach(function(m){

        var norm =
            normalizeMB(
                m.mbNumber
            );

        if(norm) {

            latestMap[norm] = m;

        }

    });

    var list = [];

    for(var norm in latestMap) {

        var m =
            latestMap[norm];

        if(
            m.actionType === 'दिलेली M.B.' ||
            m.actionType === 'दिलेली एमबी'
        ){

            list.push(m);

        }

    }

    return list;

}


/* =========================================================
   AVAILABLE M.B. STOCK
   ========================================================= */

function getAvailableStock() {

    var received =
        getUniqueReceivedMBs();

    var activeGiven =
        getCurrentlyActiveGivenMBs();

    var issuedMap = {};

    activeGiven.forEach(function(m){

        issuedMap[
            normalizeMB(
                m.mbNumber
            )
        ] = true;

    });

    return received.filter(function(rec){

        return !issuedMap[
            normalizeMB(
                rec.mbNumber
            )
        ];

    });

}


/* =========================================================
   M.B. CURRENTLY HELD BY JE
   ========================================================= */

function getCurrentlyHeldMBsByJE(jeName) {

    if(!jeName) {
        return [];
    }

    var active =
        getCurrentlyActiveGivenMBs();

    var n =
        jeName.trim();

    return active
        .filter(function(item){

            return (
                item.receivedDetail ||
                ''
            ).trim() === n;

        })
        .map(function(item){

            return {

                mbNo: item.mbNumber,

                size:
                    item.size ||
                    'लहान M.B.',

                date: item.date

            };

        });

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDateToDMY(dateStr) {

    if(!dateStr) {
        return '-';
    }

    var p =
        dateStr.split('-');

    return p.length === 3
        ? p[2] + '-' + p[1] + '-' + p[0]
        : dateStr;

}


/* =========================================================
   FAST NUMBER DISPLAY
   ========================================================= */

function animateNumberCount(
    elementId,
    finalVal
){

    var el =
        document.getElementById(
            elementId
        );

    if(el) {

        el.innerText =
            finalVal;

    }

}


/* =========================================================
   A4 PRINT
   ========================================================= */

function printA4Document(content, optionalFileName) {
    var printableArea = document.getElementById('printableArea');
    var originalTitle = document.title;
    var originalContent = printableArea ? printableArea.innerHTML : '';
    var requestedName = String(optionalFileName || 'Office_Work_Report.pdf');
    var safeName = requestedName.replace(/[\/:*?"<>|]+/g, '_').replace(/\.pdf$/i, '');
    if (!safeName) safeName = 'Office_Work_Report';
    var printTitle = safeName + '.pdf';

    try {
        if (window.AndroidPrintBridge && typeof window.AndroidPrintBridge.printHtml === 'function') {
            window.AndroidPrintBridge.printHtml(String(content || ''), printTitle);
            return true;
        }
        if (window.Android && typeof window.Android.printHtml === 'function') {
            window.Android.printHtml(String(content || ''), printTitle);
            return true;
        }
        document.title = printTitle;
        if (printableArea) {
            printableArea.innerHTML = String(content || '');
            printableArea.style.display = 'block';
            var restored = false;
            var restorePrintPage = function () {
                if (restored) return;
                restored = true;
                printableArea.innerHTML = originalContent;
                printableArea.style.display = '';
                document.title = originalTitle;
                window.removeEventListener('afterprint', restorePrintPage);
            };
            // Register cleanup before opening the print dialog; some WebViews may fire afterprint quickly.
            window.addEventListener('afterprint', restorePrintPage);
            window.print();
            window.setTimeout(restorePrintPage, 30000);
            return true;
        }
        var win = window.open('', '_blank');
        if (!win) throw new Error('Print window was blocked');
        var html = '<!doctype html><html><head><meta charset="utf-8"><title>' +
            printTitle.replace(/[&<>"]/g, function (c) {
                return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
            }) +
            '</title><meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<style>@page{size:A4 portrait;margin:7mm}body{font-family:Arial,"Noto Sans Devanagari",sans-serif;color:#111;font-size:10pt}' +
            'table{width:100%;border-collapse:collapse}th,td{border:1px solid #222;padding:4px;vertical-align:top}' +
            'tr{break-inside:avoid}img{max-width:100%;height:auto}</style></head><body>' +
            String(content || '') + '</body></html>';
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.onload = function () { win.focus(); win.print(); };
        return true;
    } catch (err) {
        console.error('Report print failed:', err);
        document.title = originalTitle;
        if (printableArea) {
            printableArea.innerHTML = originalContent;
            printableArea.style.display = '';
        }
        if (typeof showAlert === 'function') {
            showAlert('प्रिंट विंडो उघडता आली नाही. या APK/WebView मध्ये Print सुविधा उपलब्ध आहे का ते तपासा.', 'ERROR');
        } else {
            alert('प्रिंट विंडो उघडता आली नाही. या APK/WebView मध्ये Print सुविधा उपलब्ध आहे का ते तपासा.');
        }
        return false;
    }
}
