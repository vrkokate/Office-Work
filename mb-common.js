/* =========================================================
   mb-common.js
   M.B. System - Common Utility Functions
   Module Open/Close & Smart Action Center Complete Integration
   ========================================================= */

"use strict";

function getMBDisplayHolder(status, isAvail) {
    if (isAvail) return 'कार्यालयात उपलब्ध';
    if (!status) return 'कार्यालय / उपलब्ध';
    var detail = status.detail || status.receivedDetail || '';
    var source = status.source || status.receivedSource || status.receivedFrom || '';
    var action = status.lastAction || status.actionType || '';
    if (detail) return detail;
    if (source) return source;
    if (action && action.includes('JE')) return action;
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
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
}

function formatDateDisplay(v) {
    if (!v) return '';
    var p = String(v).split('-');
    return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : String(v);
}

function openModule(moduleId) {
    var modal = document.getElementById(moduleId);
    if (!modal) return false;
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    return true;
}

function closeModule(moduleId) {
    var modal = document.getElementById(moduleId);
    if (!modal) return false;
    modal.style.setProperty('display', 'none', 'important');
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    return true;
}

function openSmartActionCenter(mbNo) {
    var modal = document.getElementById('smartActionCenterModal');
    if (!modal) return false;
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.setAttribute('aria-hidden', 'false');

    var detailsBox = document.getElementById('sacDetailsBox');
    if (detailsBox && mbNo != null) {
        detailsBox.setAttribute('data-mb-number', String(mbNo));
        detailsBox.innerHTML = '<strong>निवडलेला M.B. क्रमांक:</strong> ' + escapeHtml(mbNo);
    }
    document.body.style.overflow = 'hidden';
    return true;
}

function closeSmartActionCenter() {
    var modal = document.getElementById('smartActionCenterModal');
    if (!modal) return false;
    modal.style.setProperty('display', 'none', 'important');
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    return true;
}

function getCurrentSmartActionMBNo() {
    var detailsBox = document.getElementById('sacDetailsBox');
    if (!detailsBox) return '';
    return detailsBox.getAttribute('data-mb-number') || '';
}

/* =========================================================
   M.B. ACTION CENTER (7 FUNCTIONS) COMPLETE IMPLEMENTATION
   ========================================================= */

function sacOpenTransferForm() {
    var mbNo = getCurrentSmartActionMBNo();
    var container = document.getElementById('sacSubActionContainer');
    if (!container) return;
    
    var jeList = getData('je_records') || [];
    var jeOptions = jeList.map(function(j) { return '<option value="' + escapeHtml(j.name) + '">' + escapeHtml(j.name) + '</option>'; }).join('');

    container.style.display = 'block';
    container.innerHTML = '<strong>📤 हस्तांतरण फॉर्म (M.B. क्र: ' + escapeHtml(mbNo) + ')</strong>' +
        '<div style="margin-top:8px;">' +
        '<label style="display:block; font-size:11px; font-weight:600; margin-bottom:3px;">कोणाकडे द्यायची? (JE)</label>' +
        '<select id="sacTransJE" style="width:100%; padding:6px; font-size:12px; border:1px solid #ccc; border-radius:4px;"><option value="">-- JE निवडा --</option>' + jeOptions + '</select>' +
        '</div>' +
        '<div style="margin-top:8px;">' +
        '<label style="display:block; font-size:11px; font-weight:600; margin-bottom:3px;">दिनांक</label>' +
        '<input type="date" id="sacTransDate" value="' + new Date().toISOString().slice(0, 10) + '" style="width:100%; padding:6px; font-size:12px; border:1px solid #ccc; border-radius:4px;">' +
        '</div>' +
        '<div style="margin-top:10px; display:flex; gap:6px;">' +
        '<button type="button" onclick="sacSaveTransfer()" style="background:#2e7d32; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer; flex:1;">सेव्ह करा</button>' +
        '<button type="button" onclick="document.getElementById(\'sacSubActionContainer\').style.display=\'none\';" style="background:#757575; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">रद्द करा</button>' +
        '</div>';
}

function sacSaveTransfer() {
    var mbNo = getCurrentSmartActionMBNo();
    var jeName = document.getElementById('sacTransJE').value;
    var dt = document.getElementById('sacTransDate').value;
    if (!jeName || !dt) {
        if (typeof showAlert === 'function') showAlert('कृपया JE आणि दिनांक निवडा.', 'WARNING');
        else alert('कृपया JE आणि दिनांक निवडा.');
        return;
    }
    var mbList = getData('mb_records') || [];
    var latest = getLatestMBStatus(mbNo);
    var size = latest ? latest.size : 'लहान M.B.';

    mbList.push({
        actionType: 'दिलेली M.B.',
        mbNumber: mbNo,
        size: size,
        receivedSource: 'JE',
        receivedDetail: jeName,
        receivedFrom: 'M.B. ' + jeName + ' यांना दिली',
        date: dt
    });
    setData('mb_records', mbList);
    document.getElementById('sacSubActionContainer').style.display = 'none';
    if (typeof showAlert === 'function') showAlert('M.B. हस्तांतरण यशस्वीरीत्या सेव्ह झाले!', 'SUCCESS');
    if (typeof refreshMBDashboard === 'function') refreshMBDashboard();
}

function sacTriggerReceiveMB() {
    var mbNo = getCurrentSmartActionMBNo();
    var container = document.getElementById('sacSubActionContainer');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = '<strong>📥 M.B. घेणे / कार्यालय जमा (M.B. क्र: ' + escapeHtml(mbNo) + ')</strong>' +
        '<div style="margin-top:8px;">' +
        '<label style="display:block; font-size:11px; font-weight:600; margin-bottom:3px;">जमा दिनांक</label>' +
        '<input type="date" id="sacRecDate" value="' + new Date().toISOString().slice(0, 10) + '" style="width:100%; padding:6px; font-size:12px; border:1px solid #ccc; border-radius:4px;">' +
        '</div>' +
        '<div style="margin-top:10px; display:flex; gap:6px;">' +
        '<button type="button" onclick="sacSaveReceive()" style="background:#0277bd; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer; flex:1;">कार्यालयात जमा करा</button>' +
        '<button type="button" onclick="document.getElementById(\'sacSubActionContainer\').style.display=\'none\';" style="background:#757575; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">रद्द करा</button>' +
        '</div>';
}

function sacSaveReceive() {
    var mbNo = getCurrentSmartActionMBNo();
    var dt = document.getElementById('sacRecDate').value;
    if (!dt) {
        if (typeof showAlert === 'function') showAlert('कृपया दिनांक निवडा.', 'WARNING');
        else alert('कृपया दिनांक निवडा.');
        return;
    }
    var mbList = getData('mb_records') || [];
    var latest = getLatestMBStatus(mbNo);
    var size = latest ? latest.size : 'लहान M.B.';

    mbList.push({
        actionType: 'मिळालेली M.B.',
        mbNumber: mbNo,
        size: size,
        receivedSource: 'विभागीय कार्यालय',
        receivedDetail: 'कार्यालयात जमा',
        receivedFrom: 'कार्यालयात जमा',
        date: dt
    });
    setData('mb_records', mbList);
    document.getElementById('sacSubActionContainer').style.display = 'none';
    if (typeof showAlert === 'function') showAlert('M.B. कार्यालयात यशस्वीरीत्या जमा झाली!', 'SUCCESS');
    if (typeof refreshMBDashboard === 'function') refreshMBDashboard();
}

function sacTriggerEditRecord() {
    var mbNo = getCurrentSmartActionMBNo();
    var allMBs = getData('mb_records') || [];
    var targetIdx = -1;
    for (var i = 0; i < allMBs.length; i++) {
        if (normalizeMB(allMBs[i].mbNumber) === normalizeMB(mbNo)) {
            targetIdx = i;
            break;
        }
    }
    if (targetIdx === -1) {
        if (typeof showAlert === 'function') showAlert('या M.B. क्रमांकाची कोणतीही नोंद सापडली नाही.', 'WARNING');
        else alert('या M.B. क्रमांकाची कोणतीही नोंद सापडली नाही.');
        return;
    }
    closeSmartActionCenter();
    if (typeof openModule === 'function') openModule('mbModal');
    if (typeof editMB === 'function') editMB(targetIdx);
}

function sacToggleHistoryView() {
    var mbNo = getCurrentSmartActionMBNo();
    var histContainer = document.getElementById('sacHistoryContainer');
    var wrapper = document.getElementById('sacHistoryTableWrapper');
    if (!histContainer || !wrapper) return;

    if (histContainer.style.display === 'block') {
        histContainer.style.display = 'none';
        return;
    }

    var allMBs = getData('mb_records') || [];
    var norm = normalizeMB(mbNo);
    var historyRows = [];
    allMBs.forEach(function(m) {
        if (normalizeMB(m.mbNumber) === norm) {
            historyRows.push(m);
        }
    });

    if (historyRows.length === 0) {
        wrapper.innerHTML = '<div style="padding:10px; text-align:center; color:#666; font-size:11px;">कोणताही इतिहास उपलब्ध नाही.</div>';
    } else {
        var html = '<table class="data-table" style="width:100%; font-size:11px;"><thead><tr><th>दिनांक</th><th>व्यवहार</th><th>तपशील / धारक</th></tr></thead><tbody>';
        historyRows.forEach(function(r) {
            html += '<tr><td>' + formatDateDisplay(r.date) + '</td><td>' + escapeHtml(r.actionType) + '</td><td>' + escapeHtml(r.receivedDetail || r.receivedSource || '-') + '</td></tr>';
        });
        html += '</tbody></table>';
        wrapper.innerHTML = html;
    }
    histContainer.style.display = 'block';
}

function sacOpenWorkForCurrentMB() {
    var mbNo = getCurrentSmartActionMBNo();
    closeSmartActionCenter();
    if (typeof openModule === 'function') openModule('workModal');
    var workMB = document.getElementById('workMB');
    if (workMB) workMB.value = mbNo;
}

function sacOpenBillForCurrentMB() {
    var mbNo = getCurrentSmartActionMBNo();
    closeSmartActionCenter();
    if (typeof openModule === 'function') openModule('billModal');
}

function printHistoryFromSAC() {
    var mbNo = getCurrentSmartActionMBNo();
    var allMBs = getData('mb_records') || [];
    var norm = normalizeMB(mbNo);
    var historyRows = [];
    allMBs.forEach(function(m) {
        if (normalizeMB(m.mbNumber) === norm) {
            historyRows.push(m);
        }
    });

    if (historyRows.length === 0) {
        if (typeof showAlert === 'function') showAlert('प्रिंट करण्यासाठी कोणताही इतिहास उपलब्ध नाही.', 'WARNING');
        else alert('प्रिंट करण्यासाठी कोणताही इतिहास उपलब्ध नाही.');
        return;
    }

    var rowsHtml = historyRows.map(function(r, i) {
        return '<tr><td style="text-align:center;">' + (i + 1) + '</td><td>' + formatDateDisplay(r.date) + '</td><td>' + escapeHtml(r.actionType) + '</td><td>' + escapeHtml(r.receivedDetail || r.receivedSource || '-') + '</td></tr>';
    }).join('');

    var reportHtml = '<h2 style="text-align:center;">M.B. Movement History Report (M.B. क्र: ' + escapeHtml(mbNo) + ')</h2>' +
        '<table class="print-table"><thead><tr><th style="text-align:center; width:40px;">अ.क्र.</th><th>दिनांक</th><th>व्यवहार</th><th>तपशील / धारक</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>';

    if (typeof printA4Document === 'function') {
        printA4Document(reportHtml, 'MB_History_' + mbNo + '.pdf');
    }
}
