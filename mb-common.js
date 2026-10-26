// mb-common.js - Common Utility Functions for M.B. System

function getMBDisplayHolder(status, isAvail) {
    if (isAvail) return 'कार्यालयात उपलब्ध';
    if (!status) return 'कार्यालय / उपलब्ध';
    var detail = status.detail || status.receivedDetail || '';
    var source = status.source || status.receivedSource || status.receivedFrom || '';
    var action = status.lastAction || status.actionType || '';
    
    if (detail) return detail;
    if (source) return source;
    if (action.includes('JE')) return action;
    return action || 'कार्यालय';
}

function formatTransactionSentence(h) {
    if (!h) return '-';
    return h.receivedSource || h.receivedFrom || h.actionType || '-';
}

function checkDatePlaceholder(input) {
    if (!input) return;
    if (input.value) input.classList.remove('empty-date');
    else input.classList.add('empty-date');
}

function escapeHtml(v) { 
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function(c){ 
        return {'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c]; 
    }); 
}

function formatDateDisplay(v) { 
    if(!v) return ''; 
    var p=String(v).split('-'); 
    return p.length===3 ? p[2]+'-'+p[1]+'-'+p[0] : String(v); 
}
