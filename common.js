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

function setData(key, data) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(data)
        );

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

function printA4Document(
    content,
    fileName
){

    var p =
        document.getElementById(
            'printableArea'
        );

    if(p){

        p.innerHTML =
            content;

        window.print();

        p.innerHTML =
            '';

    }

}
