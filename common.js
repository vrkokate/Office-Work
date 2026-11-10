/* DMBMS CENTRAL DATA LAYER + ROBUST PRINT ENGINE */

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
   ROBUST PRINT ENGINE (PDF + Fallback)
   ========================================================= */
window.__isPrinting = false;

function printA4Document(content, optionalFileName) {
    if (window.__isPrinting) return; 
    window.__isPrinting = true;

    var todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    var printTitle = String(optionalFileName || 'Report.pdf').replace(/[\/:*?"<>|]+/g, '_');
    var reportName = printTitle.replace('.pdf', '').replace(/_/g, ' ');

    var html = '<style>' +
        '* { border-radius: 0 !important; box-shadow: none !important; } ' +
        '.pdf-wrapper { position: relative; width: 100%; font-family: "Noto Sans Devanagari", Arial, sans-serif; } ' +
        '.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 70px; font-weight: bold; color: rgba(0, 0, 0, 0.08); z-index: 0; pointer-events: none; white-space: nowrap; width: 100%; text-align: center; } ' +
        '.pdf-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; position: relative; z-index: 1; } ' +
        '.pdf-header h1 { margin: 0; font-size: 20px; font-weight: bold; } ' +
        '.pdf-header h2 { margin: 5px 0; font-size: 14px; font-weight: bold; text-transform: capitalize; } ' +
        '.pdf-header p { margin: 5px 0; font-size: 12px; } ' +
        '.pdf-content { position: relative; z-index: 1; } ' +
        'table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; } ' +
        'th, td { border: 1px solid #000 !important; padding: 6px !important; text-align: left; vertical-align: top; word-wrap: break-word; } ' +
        'th { background-color: #eaeaea !important; font-weight: bold; -webkit-print-color-adjust: exact; } ' +
        'thead { display: table-header-group; } ' + 
        'tr { page-break-inside: avoid; } ' + 
        '</style>' +
        '<div class="pdf-wrapper">' +
        '<div class="watermark">PWD SOLAPUR</div>' +
        '<div class="pdf-header">' +
        '<h1>सार्वजनिक बांधकाम विभाग</h1>' +
        '<h2>' + reportName + '</h2>' +
        '<p>अहवाल दिनांक: ' + todayStr + '</p>' +
        '</div>' +
        '<div class="pdf-content">' + String(content || '') + '</div>' +
        '</div>';

    // १. जर html2pdf उपलब्ध नसेल तर थेट Iframe प्रिंट
    if (typeof html2pdf === 'undefined') {
        return printViaIframe(html, printTitle);
    }

    // २. html2pdf ने PDF तयार करणे
    try {
        var container = document.createElement('div');
        container.id = 'pdf-hidden-container';
        container.style.cssText = 'position: fixed; top: -10000px; left: -10000px; width: 180mm; background: #fff; z-index: -9999; pointer-events: none;';
        container.innerHTML = html;
        document.body.appendChild(container);

        var opt = {
            margin: [10, 10, 15, 10], 
            filename: printTitle,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 1, useCORS: true, letterRendering: false, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
        };

        setTimeout(function() {
            html2pdf().set(opt).from(container).toPdf().get('pdf').then(function(pdf) {
                try {
                    var totalPages = pdf.internal.getNumberOfPages();
                    for (var i = 1; i <= totalPages; i++) {
                        pdf.setPage(i);
                        pdf.setFontSize(9); pdf.setTextColor(100);
                        pdf.text('Created by Vitthal kokate | Mb. No. 8446556141', 10, 287);
                        pdf.text('Page ' + i + ' of ' + totalPages, 200, 287, { align: 'right' });
                    }
                } catch(e) { console.warn('Page number error', e); }
            }).save().then(function() {
                if (container && container.parentNode) container.parentNode.removeChild(container);
                window.__isPrinting = false;
            }).catch(function(err) {
                console.error('PDF Error, switching to fallback:', err);
                if (container && container.parentNode) container.parentNode.removeChild(container);
                window.__isPrinting = false;
                printViaIframe(html, printTitle);
            });
        }, 150);

    } catch(err) {
        console.error('PDF Generation Error, using fallback:', err);
        window.__isPrinting = false;
        printViaIframe(html, printTitle);
    }
}

// 🌟 फॉलबॅक प्रिंट (जर html2pdf फेल झाली तर)
function printViaIframe(htmlContent, printTitle) {
    var iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0'; iframe.style.bottom = '0';
    iframe.style.width = '1px'; iframe.style.height = '1px';
    iframe.style.opacity = '0'; iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);
    
    var doc = iframe.contentWindow.document;
    doc.open();
    doc.write('<!doctype html><html><head><title>' + printTitle + '</title><style>@page { size: A4 portrait; margin: 15mm; } body { margin:0; padding:0; background:#fff; }</style></head><body>' + htmlContent + '</body></html>');
    doc.close();
    
    setTimeout(function() {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch(e) { console.error('Iframe print error:', e); }
        
        setTimeout(function() {
            if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
            window.__isPrinting = false;
        }, 4000);
    }, 500);
}
