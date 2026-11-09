/* DMBMS CENTRAL DATA LAYER + INSTANT SYNC
   ALL shared utilities live here. No other file should redefine
   getData/setData/normalizeMB/getAvailableStock/getLatestMBStatus/
   getCurrentlyActiveGivenMBs/getCurrentlyHeldMBsByJE/formatDateToDMY.
*/
(function(){
    'use strict';
    if (window.__DMBMS_COMMON_SYNC__) return;
    window.__DMBMS_COMMON_SYNC__ = true;

    var CHANNEL_NAME = 'DMBMS_CENTRAL_DATA_SYNC_V1';
    var channel = null;
    try { if ('BroadcastChannel' in window) channel = new BroadcastChannel(CHANNEL_NAME); } catch(e){}

    window.__dmbmsNotifyChange = window.__dmbmsNotifyChange || function(key, action){
        var msg = { key: key||'*', action: action||'UPDATE', time: Date.now(), source: Math.random().toString(36).slice(2) };
        try { window.dispatchEvent(new CustomEvent('dmbms:datachange', { detail: msg })); } catch(e){}
        try { if(channel) channel.postMessage(msg); } catch(e){}
    };

    function refresh(){
        var fn = window.refreshAll;
        if(window.__DMBMS_SYNC_REFRESH_TIMER) clearTimeout(window.__DMBMS_SYNC_REFRESH_TIMER);
        window.__DMBMS_SYNC_REFRESH_TIMER = setTimeout(function(){
            try { if(typeof fn==='function') fn(); } catch(e){ console.warn('DMBMS refresh:', e); }
            try { if(typeof window.refreshBillDashboard==='function') window.refreshBillDashboard(); } catch(e){}
            try { if(typeof window.refreshMBDashboard==='function') window.refreshMBDashboard(); } catch(e){}
        }, 0);
    }

    window.addEventListener('storage', function(e){ if(e && e.key) refresh(); });
    window.addEventListener('dmbms:datachange', refresh);
    if(channel) channel.onmessage = function(e){ if(e && e.data) refresh(); };
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) refresh(); });
    window.addEventListener('focus', refresh);
})();

/* =========================================================
   SMART SYSTEM MESSAGE (custom, no browser URL)
   ========================================================= */
function showAlert(msg, type){
    if(typeof window.appAlert === 'function') return window.appAlert(msg, { type: type });
    var old = document.getElementById('dmbmsInlineMessage'); if(old) old.remove();
    var box = document.createElement('div');
    box.id = 'dmbmsInlineMessage';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;background:#fff;border-radius:12px;box-shadow:0 10px 35px rgba(0,0,0,.3);padding:18px;max-width:90vw;width:360px;text-align:center;font-family:inherit;';
    var icon = type==='ERROR' ? '⚠️' : (type==='SUCCESS' ? '✅' : 'ℹ️');
    var safeMsg = String(msg==null?'':msg).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});
    box.innerHTML = '<div style="font-size:18px;font-weight:800;color:#0d47a1;margin-bottom:8px;">'+icon+'</div><div style="font-size:14px;line-height:1.55;color:#263238;white-space:pre-wrap;">'+safeMsg+'</div><button style="margin-top:14px;background:#0d47a1;color:#fff;border:0;border-radius:7px;padding:8px 24px;font-weight:700;" onclick="this.parentElement.remove()">ठीक आहे</button>';
    document.body.appendChild(box);
}

/* =========================================================
   CENTRAL DATA READ / WRITE
   ========================================================= */
function getData(key){
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; }
}

function recordCentralDataHistory(key, data){
    try {
        if(!key || key==='digital_hub_central_history' || key==='office_work_auto_snapshot_v1') return;
        var historyKey = 'digital_hub_central_history';
        var records = [];
        try { var r = localStorage.getItem(historyKey); var p = r ? JSON.parse(r) : []; if(Array.isArray(p)) records = p; } catch(e){}
        var now = new Date();
        var dateStr = String(now.getDate()).padStart(2,'0')+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+now.getFullYear();
        var timestamp = now.toISOString();
        var moduleMap = { mb_records:'M.B.', je_records:'JE Management', work_records:'Work List', assign_records:'Assign', bill_records:'Bill Register', dmbms_bills:'Bill Register', savedPayFixationsList:'Pay Fixation', hraRecords:'HRA', est_records:'Est.', PAY_FIXATION_4TH:'Pay Fixation' };
        var count = Array.isArray(data) ? data.length : (data && typeof data==='object' ? Object.keys(data).length : 1);
        records.unshift({
            schemaVersion:'1.0', source: moduleMap[key]||'General', createdAt: timestamp,
            id:'AUTO-'+timestamp.replace(/[-:.TZ]/g,'')+'-'+Math.random().toString(36).slice(2,7),
            date:dateStr, time: now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:true}),
            timestamp: timestamp, module: moduleMap[key]||'General', action:'UPDATE',
            recordName: key, recordId: '—', mbNumber: '—', mbSize: '—', receivedFrom: '—',
            oldData:{}, newData:{ itemCount: count },
            changes: 'setData() द्वारे जतन/अपडेट', status:'—', user:'System',
            remark:'स्वयंचलित History नोंद'
        });
        if(records.length > 2000) records.length = 2000;
        localStorage.setItem(historyKey, JSON.stringify(records));
    } catch(e){ console.warn('History entry skipped:', e); }
}

function saveOfficeWorkRecoverySnapshot(changedKey){
    try {
        if(!changedKey || changedKey==='office_work_auto_snapshot_v1') return;
        var raw = localStorage.getItem(String(changedKey));
        if(raw===null) return;
        var savedValue;
        try { savedValue = JSON.parse(raw); } catch(e){ savedValue = { __rawStringValue: raw }; }
        localStorage.setItem('office_work_auto_snapshot_v1', JSON.stringify({
            app:'Office-Work', snapshotVersion:1, createdAt:new Date().toISOString(),
            changedKey:String(changedKey), data:savedValue
        }));
    } catch(e){ console.warn('Snapshot skipped:', e); }
}

function setData(key, data){
    try {
        localStorage.setItem(key, JSON.stringify(data));
        recordCentralDataHistory(key, data);
        saveOfficeWorkRecoverySnapshot(key);
        if(typeof window.__dmbmsNotifyChange==='function') window.__dmbmsNotifyChange(key,'UPDATE');
    } catch(e){ console.error('setData failed:', e); }
}

/* =========================================================
   SINGLE normalizeMB — strips leading zeros
   ========================================================= */
function normalizeMB(val){
    if(!val) return '';
    return String(val).trim().replace(/^0+/, '');
}

/* =========================================================
   LATEST M.B. STATUS (last action wins)
   ========================================================= */
function getLatestMBStatus(mbNumber){
    var allMBs = getData('mb_records');
    var norm = normalizeMB(mbNumber);
    if(!norm) return null;
    for(var i = allMBs.length - 1; i >= 0; i--){
        var m = allMBs[i];
        if(normalizeMB(m.mbNumber) === norm){
            return {
                mbNumber: m.mbNumber, lastAction: m.actionType,
                date: m.date, receivedDetail: m.receivedDetail,
                size: m.size, index: i
            };
        }
    }
    return null;
}

/* =========================================================
   UNIQUE RECEIVED M.B. (all distinct received M.B.s)
   ========================================================= */
function getUniqueReceivedMBs(){
    var allMBs = getData('mb_records');
    var uniqueMap = {};
    allMBs.forEach(function(m){
        if(m.actionType==='मिळालेली M.B.' || m.actionType==='मिळालेली एमबी'){
            var no = String(m.mbNumber||'').trim();
            if(!no) return;
            uniqueMap[normalizeMB(no)] = { mbNumber: no, size: m.size||'लहान M.B.', date: m.date };
        }
    });
    var list = []; for(var k in uniqueMap) list.push(uniqueMap[k]);
    return list;
}

/* =========================================================
   CURRENTLY ACTIVE "GIVEN" M.B.s (latest action = given)
   ========================================================= */
function getCurrentlyActiveGivenMBs(){
    var allMBs = getData('mb_records');
    var latestMap = {};
    allMBs.forEach(function(m){
        var norm = normalizeMB(m.mbNumber);
        if(norm) latestMap[norm] = m;
    });
    var list = [];
    for(var norm in latestMap){
        var m = latestMap[norm];
        if(m.actionType==='दिलेली M.B.' || m.actionType==='दिलेली एमबी') list.push(m);
    }
    return list;
}

/* =========================================================
   AVAILABLE STOCK (received but not currently given)
   ========================================================= */
function getAvailableStock(){
    var received = getUniqueReceivedMBs();
    var activeGiven = getCurrentlyActiveGivenMBs();
    var issuedMap = {};
    activeGiven.forEach(function(m){ issuedMap[normalizeMB(m.mbNumber)] = true; });
    return received.filter(function(rec){ return !issuedMap[normalizeMB(rec.mbNumber)]; });
}

/* =========================================================
   M.B.s CURRENTLY HELD BY A SPECIFIC JE (exact name match)
   ========================================================= */
function getCurrentlyHeldMBsByJE(jeName){
    if(!jeName) return [];
    var active = getCurrentlyActiveGivenMBs();
    var target = String(jeName).trim().toLowerCase();
    return active
        .filter(function(item){
            var detail = String(item.receivedDetail||'').trim().toLowerCase();
            var source = String(item.receivedSource||'').trim().toLowerCase();
            // Match exact holder name in detail OR in source
            if(detail === target) return true;
            if(source === target) return true;
            // Allow "M.B. <name> यांना दिली" style strings
            if(detail.indexOf(target) !== -1 && detail.split(/\s+/).length <= target.split(/\s+/).length + 3) return true;
            return false;
        })
        .map(function(item){
            return { mbNo: item.mbNumber, size: item.size||'लहान M.B.', date: item.date };
        });
}

/* =========================================================
   DATE FORMAT
   ========================================================= */
function formatDateToDMY(dateStr){
    if(!dateStr) return '-';
    var p = String(dateStr).split('-');
    return p.length===3 ? p[2]+'-'+p[1]+'-'+p[0] : String(dateStr);
}

/* =========================================================
   HTML ESCAPE
   ========================================================= */
function escapeHtml(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
}

/* =========================================================
   A4 PRINT — with Android bridge support
   ========================================================= */
function printA4Document(content, optionalFileName){
    var printTitle = String(optionalFileName || 'Office_Work_Report.pdf').replace(/[\/:*?"<>|]+/g,'_');
    try {
        if(window.AndroidPrintBridge && typeof window.AndroidPrintBridge.printHtml === 'function'){
            window.AndroidPrintBridge.printHtml(String(content||''), printTitle);
            return true;
        }
        if(window.Android && typeof window.Android.printHtml === 'function'){
            window.Android.printHtml(String(content||''), printTitle);
            return true;
        }
        var printableArea = document.getElementById('printableArea');
        if(!printableArea){
            if(typeof showAlert==='function') showAlert('या पेजवर #printableArea सापडले नाही.','ERROR');
            return false;
        }
        var originalTitle = document.title;
        var originalContent = printableArea.innerHTML;
        document.title = printTitle;
        printableArea.innerHTML = String(content||'');
        printableArea.style.display = 'block';
        var restored = false;
        var restore = function(){
            if(restored) return;
            restored = true;
            printableArea.innerHTML = originalContent;
            printableArea.style.display = '';
            document.title = originalTitle;
            window.removeEventListener('afterprint', restore);
        };
        window.addEventListener('afterprint', restore);
        window.print();
        setTimeout(restore, 30000);
        return true;
    } catch(err){
        console.error('Print error:', err);
        if(typeof showAlert==='function') showAlert('प्रिंट विंडो उघडता आली नाही.','ERROR');
        return false;
    }
}
