/* DMBMS CENTRAL DATA LAYER + INSTANT SYNC + ISOLATED PRINT */

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
            try { if(typeof fn==='function') fn(); } catch(e){}
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
        var moduleMap = { mb_records:'M.B.', je_records:'JE Management', work_records:'Work List', assign_records:'Assign', dmbms_bills:'Bill Register', savedPayFixationsList:'Pay Fixation', hraRecords:'HRA' };
        var count = Array.isArray(data) ? data.length : (data && typeof data==='object' ? Object.keys(data).length : 1);
        records.unshift({
            schemaVersion:'1.0', source: moduleMap[key]||'General', createdAt: timestamp,
            id:'AUTO-'+timestamp.replace(/[-:.TZ]/g,'')+'-'+Math.random().toString(36).slice(2,7),
            date:dateStr, time: now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:true}),
            timestamp: timestamp, module: moduleMap[key]||'General', action:'UPDATE',
            recordName: key, recordId: '—', mbNumber: '—', mbSize: '—', receivedFrom: '—',
            oldData:{}, newData:{ itemCount: count },
            changes: 'setData() द्वारे जतन/अपडेट', status:'—', user:'System', remark:'स्वयंचलित History नोंद'
        });
        if(records.length > 2000) records.length = 2000;
        localStorage.setItem(historyKey, JSON.stringify(records));
    } catch(e){}
}

function setData(key, data){
    try {
        localStorage.setItem(key, JSON.stringify(data));
        recordCentralDataHistory(key, data);
        if(typeof window.__dmbmsNotifyChange==='function') window.__dmbmsNotifyChange(key,'UPDATE');
    } catch(e){}
}

function normalizeMB(val){
    if(!val) return '';
    return String(val).trim().replace(/^0+/, '');
}

function escapeHtml(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
}

function formatDateToDMY(dateStr){
    if(!dateStr) return '-';
    var p = String(dateStr).split('-');
    return p.length===3 ? p[2]+'-'+p[1]+'-'+p[0] : String(dateStr);
}

/* =========================================================
   ISOLATED A4 PRINT (No background leak)
   ========================================================= */
function printA4Document(content, optionalFileName) {
    var printTitle = String(optionalFileName || 'Office_Work_Report.pdf').replace(/[\/:*?"<>|]+/g, '_');
    
    // 1. Android APK Bridge
    try {
        if (window.AndroidPrintBridge && typeof window.AndroidPrintBridge.printHtml === 'function') {
            window.AndroidPrintBridge.printHtml(String(content || ''), printTitle);
            return true;
        }
        if (window.Android && typeof window.Android.printHtml === 'function') {
            window.Android.printHtml(String(content || ''), printTitle);
            return true;
        }
    } catch(e) { console.warn('Android Print Bridge Error:', e); }

    // 2. Web Browser Popup Print (Isolated)
    var printWindow = null;
    try {
        printWindow = window.open('', '_blank');
        if (!printWindow) {
            printViaIframe(content, printTitle);
            return true;
        }
        
        var html = '<!doctype html><html lang="mr"><head><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<title>' + printTitle + '</title>' +
            '<style>' +
            '@page { size: A4 portrait; margin: 10mm; }' +
            '* { box-sizing: border-box; }' +
            'body { font-family: "Noto Sans Devanagari", Arial, sans-serif; font-size: 10pt; color: #111; margin: 0; padding: 0; background: #fff; }' +
            '.print-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }' +
            '.print-table th, .print-table td { border: 1px solid #333; padding: 5px 6px; text-align: left; vertical-align: top; }' +
            '.print-table th { background-color: #eee !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; }' +
            'h1, h2, h3 { text-align: center; margin: 0 0 10px 0; }' +
            'button, .btn-action, .btn-report { display: none !important; }' +
            '</style></head><body>' + String(content || '') +
            '<script>(function(){ var printed = false; function doPrint(){ if(printed) return; printed = true; try { window.focus(); window.print(); } catch(e) { console.error(e); } } window.addEventListener("load", function(){ setTimeout(doPrint, 200); }); window.addEventListener("afterprint", function(){ setTimeout(function(){ window.close(); }, 200); }); })();<\/script>' +
            '</body></html>';
            
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        return true;
    } catch (err) {
        console.error('Print error:', err);
        if (printWindow && !printWindow.closed) printWindow.close();
        printViaIframe(content, printTitle);
        return false;
    }
}

// Iframe Fallback (जर ब्राउझरने Popup ब्लॉक केले तर)
function printViaIframe(content, printTitle) {
    var iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    var doc = iframe.contentWindow.document;
    doc.open();
    doc.write('<!doctype html><html><head><title>' + printTitle + '</title><style>@page { size: A4 portrait; margin: 10mm; } body { font-family: "Noto Sans Devanagari", Arial, sans-serif; font-size: 10pt; } .print-table { width: 100%; border-collapse: collapse; } .print-table th, .print-table td { border: 1px solid #333; padding: 5px; } .print-table th { background: #eee; } button, .btn-action, .btn-report { display: none !important; }</style></head><body>' + content + '</body></html>');
    doc.close();
    
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    setTimeout(function() {
        if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
    }, 5000);
}
