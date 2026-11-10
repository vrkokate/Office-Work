// mb-total.js - Total, Given, Available M.B. Dashboard & Print

var currentQuickModalType = '';

function animateNumberCount(elementId, finalVal) {
    var el = document.getElementById(elementId);
    if (!el) return;
    var targetValue = parseInt(finalVal, 10);
    if (isNaN(targetValue) || targetValue < 0) targetValue = 0;
    if (targetValue === 0) { el.innerText = '0'; return; }

    var startVal = 0, duration = 1600, startTime = null;
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = timestamp - startTime;
        var percentage = Math.min(progress / duration, 1);
        var easePercentage = (percentage === 1) ? 1 : 1 - Math.pow(2, -10 * percentage);
        el.innerText = Math.floor(startVal + (targetValue - startVal) * easePercentage);
        if (progress < duration) requestAnimationFrame(step);
        else el.innerText = targetValue;
    }
    requestAnimationFrame(step);
}

function refreshMBDashboard() {
    var rawList = getData('mb_records');
    var list = Array.isArray(rawList) ? rawList : [];
    var tbody = document.getElementById('mbListBody'); 
    if(tbody) {
        var rowsHtml = [];
        list.forEach(function(m, idx) {
            if(!m) return;
            var dateStr = typeof formatDateToDMY === 'function' ? formatDateToDMY(m.date) : (m.date || '-');
            var mbNoStr = m.mbNumber ? escapeHtml(m.mbNumber) : '-';
            var sizeStr = m.size ? escapeHtml(m.size) : '-';
            var fromStr = m.receivedFrom ? escapeHtml(m.receivedFrom) : '-';
            rowsHtml.push('<tr><td>' + (idx+1) + '</td><td>' + dateStr + '</td><td>' + mbNoStr + '</td><td>' + sizeStr + '</td><td>' + fromStr + '</td><td class="action-cell"><button class="btn-action" style="background:#2e7d32;" onclick="editMB(' + idx + ')">Edit</button><button class="btn-action" style="background:#d32f2f;" onclick="deleteMB(' + idx + ')">Delete</button></td></tr>');
        });
        tbody.innerHTML = rowsHtml.length > 0 ? rowsHtml.join('') : '<tr><td colspan="6" style="text-align:center; color:#777;">कोणतीही नोंद उपलब्ध नाही.</td></tr>';
    }
    var totalCount = typeof getUniqueReceivedMBs === 'function' ? (getUniqueReceivedMBs() || []).length : 0;
    var givenCount = typeof getCurrentlyActiveGivenMBs === 'function' ? (getCurrentlyActiveGivenMBs() || []).length : 0;
    var availCount = typeof getAvailableStock === 'function' ? (getAvailableStock() || []).length : 0;
    animateNumberCount('countReceivedMB', totalCount);
    animateNumberCount('countGivenMB', givenCount);
    animateNumberCount('countAvailableMB', availCount);
}

function getFilteredReceivedMBs() {
    var list = typeof getUniqueReceivedMBs === 'function' ? getUniqueReceivedMBs() : [];
    if (!Array.isArray(list)) list = [];
    var fSourceEl = document.getElementById('qmFilterSource');
    var fSizeEl = document.getElementById('qmFilterSize');
    var fJeEl = document.getElementById('qmFilterJE');
    var fSource = fSourceEl ? fSourceEl.value.trim() : '';
    var fSize = fSizeEl ? fSizeEl.value.trim() : '';
    var fJe = fJeEl ? fJeEl.value.trim() : '';
    var stock = typeof getAvailableStock === 'function' ? (getAvailableStock() || []) : [];
    var isAvailableMap = {};
    stock.forEach(function(s) { if(s && s.mbNumber) isAvailableMap[normalizeMB(s.mbNumber)] = true; });

    return list.filter(function(m) {
        if(!m) return false;
        var rawNo = (m.mbNumber || '').trim();
        var statusObj = typeof getLatestMBStatus === 'function' ? getLatestMBStatus(rawNo) : null;
        var isAvail = isAvailableMap[normalizeMB(rawNo)];
        var holder = typeof getMBDisplayHolder === 'function' ? getMBDisplayHolder(statusObj, isAvail) : '';
        if(holder) holder = holder.replace(/^(श्री\.?\s*)+/gi, 'श्री. ').trim();

        if (fSource && fSource !== 'सर्व (All)' && fSource !== 'सर्व') {
            var src = (m.receivedSource || m.receivedFrom || '').toLowerCase();
            if (!src.includes(fSource.toLowerCase())) return false;
        }
        if (fSize && fSize !== 'सर्व M.B.' && fSize !== 'सर्व') {
            if (m.size !== fSize) return false;
        }
        if (fJe && fJe !== 'सर्व JE' && fJe !== 'सर्व') {
            if (!holder.includes(fJe)) return false;
        }
        return true;
    });
}

function getFilteredGivenMBs() {
    var list = typeof getCurrentlyActiveGivenMBs === 'function' ? getCurrentlyActiveGivenMBs() : [];
    if (!Array.isArray(list)) list = [];
    var fSizeEl = document.getElementById('qmFilterSize');
    var fJeEl = document.getElementById('qmFilterJE');
    var fSize = fSizeEl ? fSizeEl.value.trim() : '';
    var fJe = fJeEl ? fJeEl.value.trim() : '';

    return list.filter(function(m) {
        if(!m) return false;
        var rawNo = (m.mbNumber || m.mbNo || '').trim();
        var statusObj = typeof getLatestMBStatus === 'function' ? getLatestMBStatus(rawNo) : null;
        var holder = typeof getMBDisplayHolder === 'function' ? getMBDisplayHolder(statusObj, false) : '';
        if(holder) holder = holder.replace(/^(श्री\.?\s*)+/gi, 'श्री. ').trim();
        if (fSize && fSize !== 'सर्व M.B.' && fSize !== 'सर्व') {
            if (m.size !== fSize) return false;
        }
        if (fJe && fJe !== 'सर्व JE' && fJe !== 'सर्व') {
            if (!holder.includes(fJe)) return false;
        }
        return true;
    });
}

function getFilteredAvailableMBs() {
    var list = typeof getAvailableStock === 'function' ? getAvailableStock() : [];
    if (!Array.isArray(list)) list = [];
    var fSizeEl = document.getElementById('qmFilterSize');
    var fSize = fSizeEl ? fSizeEl.value.trim() : '';
    return list.filter(function(m) {
        if(!m) return false;
        if (fSize && fSize !== 'सर्व M.B.' && fSize !== 'सर्व') {
            var sizeStr = m.size || 'लहान M.B.';
            if (sizeStr !== fSize) return false;
        }
        return true;
    });
}

function renderQuickModalTable() {
    var list = [];
    if (currentQuickModalType === 'RECEIVED' || currentQuickModalType === 'घेणेD') {
        list = getFilteredReceivedMBs();
    } else if (currentQuickModalType === 'GIVEN') {
        list = getFilteredGivenMBs();
    } else if (currentQuickModalType === 'AVAILABLE') {
        list = getFilteredAvailableMBs();
    }

    var stock = typeof getAvailableStock === 'function' ? (getAvailableStock() || []) : [];
    var isAvailableMap = {};
    stock.forEach(function(s) { if(s && s.mbNumber) isAvailableMap[normalizeMB(s.mbNumber)] = true; });

    var html = '<table class="data-table"><thead><tr><th style="text-align:center;">अ.क्र.</th><th>M.B. क्र.</th><th>साईज</th><th>सद्यस्थिती</th><th style="text-align:center;">Action</th></tr></thead><tbody>';

    if (list.length === 0) {
        html += '<tr><td colspan="5" style="text-align:center; padding:10px; color:#666;">कोणतीही नोंद उपलब्ध नाही.</td></tr>';
    } else {
        list.forEach(function(m, i) {
            if(!m) return;
            var rawNo = (m.mbNumber || m.mbNo || '').trim();
            var normNo = normalizeMB(rawNo);
            var statusObj = typeof getLatestMBStatus === 'function' ? getLatestMBStatus(rawNo) : null;
            var statusText = "";

            if (isAvailableMap[normNo]) {
                statusText = '<span style="color:#2e7d32; font-weight:700;">कार्यालयात उपलब्ध</span>';
            } else if (statusObj && (statusObj.lastAction === 'दिलेली M.B.' || statusObj.lastAction === 'दिलेली एमबी')) {
                var person = statusObj.detail || statusObj.source || 'संबंधित';
                person = person.replace(/^(श्री\.?\s*)+/gi, '').trim();
                statusText = '<span style="color:#e65100; font-weight:700;">श्री. ' + escapeHtml(person) + ' यांच्याकडे</span>';
            } else {
                statusText = '<span style="color:#0d47a1; font-weight:600;">कार्यालयात उपलब्ध</span>';
            }

            var allMBs = getData('mb_records') || [];
            var originalIdx = -1;
            for (var k = 0; k < allMBs.length; k++) {
                if (allMBs[k] && normalizeMB(allMBs[k].mbNumber) === normNo) { originalIdx = k; break; }
            }

            var sizeStr = m.size || 'लहान M.B.';
            html += '<tr><td style="text-align:center;">' + (i + 1) + '</td><td><a href="javascript:void(0)" onclick="closeQuickInfoModal(); if(typeof closeSearchResultModal===\'function\') closeSearchResultModal(); openSmartActionCenter(\'' + escapeHtml(rawNo) + '\');" style="color:#0d47a1; font-weight:800; text-decoration:underline;">' + escapeHtml(rawNo) + '</a></td><td>' + escapeHtml(sizeStr) + '</td><td>' + statusText + '</td><td class="action-cell" style="text-align:center;"><button class="btn-action" style="background:#2e7d32; padding:3px 6px;" onclick="closeQuickInfoModal(); openModule(\'mbModal\'); editMB(' + originalIdx + ')">Edit</button><button class="btn-action" style="background:#d32f2f; padding:3px 6px;" onclick="quickPopupDelete(' + originalIdx + ')">Delete</button></td></tr>';
        });
    }
    html += '</tbody></table>';
    var container = document.getElementById('qmTableContainer');
    if (container) container.innerHTML = html;
}

function openQuickInfoModal(type) {
    currentQuickModalType = type;
    var totalList = typeof getUniqueReceivedMBs === 'function' ? (getUniqueReceivedMBs() || []) : [];
    var totalCount = totalList.length;
    var smallCount = 0, bigCount = 0;
    totalList.forEach(function(m) { if (m && m.size === 'मोठी M.B.') bigCount++; else smallCount++; });
    var givenList = typeof getCurrentlyActiveGivenMBs === 'function' ? (getCurrentlyActiveGivenMBs() || []) : [];
    var availList = typeof getAvailableStock === 'function' ? (getAvailableStock() || []) : [];

    var title = '';
    if (type === 'RECEIVED' || type === 'घेणेD') title = 'एकूण M.B. (एकूण: ' + totalCount + ' | लहान: ' + smallCount + ', मोठी: ' + bigCount + ')';
    else if (type === 'GIVEN') title = 'दिलेली M.B. (एकूण: ' + givenList.length + ')';
    else title = 'उपलब्ध M.B. (एकूण: ' + availList.length + ')';

    var jeMap = {};
    var jeRecords = getData('je_records') || [];
    jeRecords.forEach(function(j) { if(j && j.name) jeMap[j.name.replace(/^(श्री\.?\s*)+/gi, '').trim()] = true; });
    var allMBs = getData('mb_records') || [];
    allMBs.forEach(function(m) {
        if(m && m.detail) jeMap[m.detail.replace(/^(श्री\.?\s*)+/gi, '').trim()] = true;
        if(m && m.source) jeMap[m.source.replace(/^(श्री\.?\s*)+/gi, '').trim()] = true;
    });

    var jeOptions = '<option value="सर्व JE">सर्व JE</option>';
    for (var jeName in jeMap) {
        if(jeName) jeOptions += '<option value="' + escapeHtml(jeName) + '">श्री. ' + escapeHtml(jeName) + '</option>';
    }

    var filterHTML = '<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:10px; margin-bottom:8px; font-size:12px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04); flex-shrink:0;">' +
        '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">' +
        '<div><label style="display:block; font-weight:700; margin-bottom:3px; color:#0d47a1;">स्रोत:</label>' +
        '<select class="form-control" id="qmFilterSource" style="padding:6px; font-size:11.5px; border-radius:6px; border:1px solid #94a3b8; background:#fff;" onchange="renderQuickModalTable()">' +
        '<option value="सर्व (All)">सर्व (All)</option><option value="विभागीय कार्यालय">विभागीय कार्यालय</option><option value="भांडारपाल">भांडारपाल</option></select></div>' +
        '<div><label style="display:block; font-weight:700; margin-bottom:3px; color:#0d47a1;">M.B. आकार:</label>' +
        '<select class="form-control" id="qmFilterSize" style="padding:6px; font-size:11.5px; border-radius:6px; border:1px solid #94a3b8; background:#fff;" onchange="renderQuickModalTable()">' +
        '<option value="सर्व M.B.">सर्व M.B.</option><option value="लहान M.B.">लहान M.B.</option><option value="मोठी M.B.">मोठी M.B.</option></select></div>' +
        '</div>' +
        '<div><label style="display:block; font-weight:700; margin-bottom:3px; color:#0d47a1;">कनिष्ठ अभियंता (JE):</label>' +
        '<select class="form-control" id="qmFilterJE" style="padding:6px; font-size:11.5px; border-radius:6px; border:1px solid #94a3b8; background:#fff;" onchange="renderQuickModalTable()">' + jeOptions + '</select>' +
        '</div></div>';

    var fullHTML = filterHTML + '<div id="qmTableContainer" style="max-height:220px; overflow-y:auto; overflow-x:auto; border:1px solid #e2e8f0; border-radius:6px;"></div>';

    var modalTitleEl = document.getElementById('quickModalTitle');
    var modalBodyEl = document.getElementById('quickModalBody');
    var modalEl = document.getElementById('quickInfoModal');

    if(modalTitleEl) modalTitleEl.innerText = title;
    if(modalBodyEl) modalBodyEl.innerHTML = fullHTML;
    if(modalEl) modalEl.style.display = 'flex';

    renderQuickModalTable();
}

function quickPopupDelete(idx) {
    if (idx === -1) return showAlert('रेकॉर्ड सापडला नाही.', 'ERROR');
    var rec = getData('mb_records')[idx];
    var mbNo = (rec && rec.mbNumber) ? rec.mbNumber : '';
    showCustomConfirm("ही नोंद हटवायची का?", "ही नोंद हटवण्यासाठी कृपया M.B. क्रमांक '" + mbNo + "' खालील बॉक्समध्ये टाईप करा:", mbNo, "✅ DELETE", "#d32f2f", function(confirmed) {
        if (confirmed) {
            var list = getData('mb_records');
            if(Array.isArray(list)) {
                list.splice(idx, 1);
                setData('mb_records', list);
                if (typeof refreshAll === 'function') refreshAll();
                closeQuickInfoModal();
                showAlert('M.B. नोंद यशस्वीरीत्या हटवली!', 'SUCCESS');
            }
        }
    });
}

function closeQuickInfoModal() { 
    var m = document.getElementById('quickInfoModal');
    if (m) m.style.display = 'none'; 
}

function printQuickModalReport() {
    var list = [];
    var reportTitle = '';
    if (currentQuickModalType === 'RECEIVED' || currentQuickModalType === 'घेणेD') {
        list = getFilteredReceivedMBs();
        reportTitle = 'एकूण मोजमाप पुस्तिका (M.B.) सविस्तर अहवाल';
    } else if (currentQuickModalType === 'GIVEN') {
        list = getFilteredGivenMBs();
        reportTitle = 'दिलेली मोजमाप पुस्तिका (M.B.) सविस्तर अहवाल';
    } else {
        list = getFilteredAvailableMBs();
        reportTitle = 'उपलब्ध मोजमाप पुस्तिका (M.B.) सविस्तर अहवाल';
    }

    var todayStr = typeof formatDateToDMY === 'function' ? formatDateToDMY(new Date().toISOString().slice(0, 10)) : new Date().toLocaleDateString();
    var groups = {};
    list.forEach(function(m) {
        if(!m) return;
        var rawNo = (m.mbNumber || m.mbNo || '').trim();
        var statusObj = typeof getLatestMBStatus === 'function' ? getLatestMBStatus(rawNo) : null;
        var stock = typeof getAvailableStock === 'function' ? (getAvailableStock() || []) : [];
        var isAvail = stock.some(function(s){ return s && normalizeMB(s.mbNumber) === normalizeMB(rawNo); });
        var holder = typeof getMBDisplayHolder === 'function' ? getMBDisplayHolder(statusObj, isAvail) : 'कार्यालय';
        if(holder) holder = holder.replace(/^(श्री\.?\s*)+/gi, 'श्री. ').trim();

        var mainSrc = m.receivedSource || m.receivedFrom || 'इतर स्त्रोत';
        if (mainSrc.includes('भांडारपाल')) mainSrc = 'भांडारपाल (Bhandarpal)';
        else if (mainSrc.includes('कार्यालय') || mainSrc.includes('जमा')) mainSrc = 'विभागीय कार्यालय (Office)';
        else mainSrc = 'इतर स्त्रोत (Other)';

        var secSrc = holder || 'कार्यालय';
        if (!groups[mainSrc]) groups[mainSrc] = {};
        if (!groups[mainSrc][secSrc]) groups[mainSrc][secSrc] = [];
        groups[mainSrc][secSrc].push(m);
    });

    var totalCount = list.length;
    var smallCount = 0, bigCount = 0;
    list.forEach(function(m){ if(m && m.size === 'मोठी M.B.') bigCount++; else smallCount++; });

    var html = '<div style="font-size:13px; font-weight:700; margin-bottom:10px; color:#0d47a1;">' + reportTitle + ' (एकूण: ' + totalCount + ' | लहान: ' + smallCount + ', मोठी: ' + bigCount + ')</div>';

    var globalIndex = 1;
    for (var mainKey in groups) {
        html += '<div style="margin-top:12px; margin-bottom:6px; font-size:11pt; font-weight:800; color:#0d47a1; background:#e3f2fd; padding:5px 8px; border: 1px solid #90caf9;">📂 मुख्य स्त्रोत: ' + escapeHtml(mainKey) + '</div>';
        for (var secKey in groups[mainKey]) {
            html += '<div style="margin:6px 0 4px 10px; font-size:10pt; font-weight:700; color:#333;">👉 सद्यस्थिती व धारक: ' + escapeHtml(secKey) + '</div>';
            html += '<table class="print-table" style="margin-bottom:8px; width:100%; border-collapse:collapse; font-size:9.5pt;"><thead><tr style="background:#f5f5f5;">' +
                '<th style="width:40px; text-align:center;">अ.क्र.</th><th>M.B. क्रमांक</th><th>साईज</th><th>नोंद दिनांक</th><th>सद्यस्थिती व तपशील</th></tr></thead><tbody>';

            groups[mainKey][secKey].forEach(function(item) {
                var rawNo = (item.mbNumber || item.mbNo || '').trim();
                var statusObj = typeof getLatestMBStatus === 'function' ? getLatestMBStatus(rawNo) : null;
                var stock = typeof getAvailableStock === 'function' ? (getAvailableStock() || []) : [];
                var isAvail = stock.some(function(s){ return s && normalizeMB(s.mbNumber) === normalizeMB(rawNo); });
                var holder = typeof getMBDisplayHolder === 'function' ? getMBDisplayHolder(statusObj, isAvail) : 'कार्यालय';
                if(holder) holder = holder.replace(/^(श्री\.?\s*)+/gi, 'श्री. ').trim();
                var dateStr = typeof formatDateToDMY === 'function' ? formatDateToDMY(item.date) : (item.date || '-');
                var sizeStr = item.size || 'लहान M.B.';
                html += '<tr><td style="text-align:center;">' + (globalIndex++) + '</td><td><strong>' + escapeHtml(rawNo) + '</strong></td><td>' + escapeHtml(sizeStr) + '</td><td>' + dateStr + '</td><td>' + escapeHtml(holder) + '</td></tr>';
            });
            html += '</tbody></table>';
        }
    }

    if (typeof printA4Document === 'function') {
        printA4Document(html, currentQuickModalType + '_Report_' + todayStr.replace(/\//g, '-') + '.pdf');
    }
}
