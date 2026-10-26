// mb-total.js - Total M.B., Dashboard Counts, Filtering, and Grouped Reporting Logic

function animateNumberCount(elementId, finalVal) {
    var el = document.getElementById(elementId);
    if (!el) return;
    var startVal = 0, duration = 1600, startTime = null;
    if (finalVal === 0) { el.innerText = '0'; return; }
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = timestamp - startTime;
        var percentage = Math.min(progress / duration, 1);
        var easePercentage = (percentage === 1) ? 1 : 1 - Math.pow(2, -10 * percentage);
        el.innerText = Math.floor(startVal + (finalVal - startVal) * easePercentage);
        if (progress < duration) requestAnimationFrame(step);
        else el.innerText = finalVal;
    }
    requestAnimationFrame(step);
}

function refreshMBDashboard() {
    var list = getData('mb_records');
    var tbody = document.getElementById('mbListBody'); 
    if(!tbody) return;
    tbody.innerHTML = ''; 
    list.forEach(function(m, idx) {
        tbody.innerHTML += '<tr><td>' + (idx+1) + '</td><td>' + formatDateToDMY(m.date) + '</td><td>' + m.mbNumber + '</td><td>' + m.size + '</td><td>' + (m.receivedFrom || '-') + '</td>' +
        '<td class="action-cell"><button class="btn-action" style="background:#2e7d32;" onclick="editMB(' + idx + ')">Edit</button><button class="btn-action" style="background:#d32f2f;" onclick="deleteMB(' + idx + ')">Delete</button></td></tr>';
    });

    animateNumberCount('countReceivedMB', getUniqueReceivedMBs().length);
    animateNumberCount('countGivenMB', getCurrentlyActiveGivenMBs().length);
    animateNumberCount('countAvailableMB', getAvailableStock().length);
}

function getUniqueReceivedMBs(excludeIndex = -1) {
    var allMBs = getData('mb_records');
    var uniqueMap = {};
    allMBs.forEach(function(m, i) {
        if (i === excludeIndex) return;
        var isRcv = (m.actionType === 'मिळालेली M.B.' || m.actionType === 'मिळालेली एमबी');
        if (isRcv) {
            var no = (m.mbNumber || '').trim();
            var norm = normalizeMB(no);
            if (norm && !uniqueMap[norm]) {
                uniqueMap[norm] = {
                    mbNumber: no,
                    size: m.size || 'लहान M.B.',
                    date: m.date,
                    receivedSource: m.receivedSource || m.receivedFrom || '-',
                    receivedDetail: m.receivedDetail || '-'
                };
            }
        }
    });
    var list = [];
    for (var k in uniqueMap) {
        list.push(uniqueMap[k]);
    }
    return list;
}

function getFilteredReceivedMBs() {
    var list = getUniqueReceivedMBs();
    var fJe = document.getElementById('qmFilterJE') ? document.getElementById('qmFilterJE').value : '';
    var fSize = document.getElementById('qmFilterSize') ? document.getElementById('qmFilterSize').value : '';
    var fSource = document.getElementById('qmFilterSource') ? document.getElementById('qmFilterSource').value : '';
    var fFrom = document.getElementById('qmFromDate') ? document.getElementById('qmFromDate').value : '';
    var fTo = document.getElementById('qmToDate') ? document.getElementById('qmToDate').value : '';

    return list.filter(function(m) {
        var rawNo = (m.mbNumber || '').trim();
        var statusObj = getLatestMBStatus(rawNo);
        var stock = getAvailableStock();
        var isAvail = stock.some(function(s){ return normalizeMB(s.mbNumber) === normalizeMB(rawNo); });
        var holder = getMBDisplayHolder(statusObj, isAvail);

        // JE Filter
        if (fJe) {
            if (!holder.includes(fJe)) return false;
        }
        // Size Filter
        if (fSize) {
            if (m.size !== fSize) return false;
        }
        // Source Filter
        if (fSource) {
            var src = (m.receivedSource || m.receivedFrom || '').toLowerCase();
            if (!src.includes(fSource.toLowerCase())) return false;
        }
        // Date Range Filter (दिनांक पासून - दिनांक पर्यंत)
        if (fFrom && m.date && m.date < fFrom) return false;
        if (fTo && m.date && m.date > fTo) return false;

        return true;
    });
}

function renderQuickModalTable() {
    var list = getFilteredReceivedMBs();
    var stock = getAvailableStock();
    var isAvailableMap = {};
    stock.forEach(function(s) { isAvailableMap[normalizeMB(s.mbNumber)] = true; });

    var html = '<table class="data-table"><thead><tr>' +
    '<th style="text-align:center;">अ.क्र.</th>' +
    '<th>M.B. क्र.</th>' +
    '<th>साईज</th>' +
    '<th>सद्यस्थिती व धारक</th>' +
    '<th>दिनांक</th>' +
    '<th style="text-align:center;">Action</th>' +
    '</tr></thead><tbody>';

    if (list.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center; padding:10px; color:#666;">कोणतीही नोंद उपलब्ध नाही.</td></tr>';
    } else {
        list.forEach(function(m, i) {
            var rawNo = (m.mbNumber || m.mbNo || '').trim();
            var normNo = normalizeMB(rawNo);
            var statusObj = getLatestMBStatus(rawNo);
            var statusText = "";

            if (isAvailableMap[normNo]) {
                statusText = '<span style="color:#2e7d32; font-weight:700;">उपलब्ध</span>';
            } else if (statusObj && (statusObj.lastAction === 'दिलेली M.B.' || statusObj.lastAction === 'दिलेली एमबी')) {
                var person = statusObj.detail || statusObj.source || 'संबंधित';
                person = person.replace(/^श्री.?\s*/i, '');
                statusText = '<span style="color:#e65100; font-weight:700;">JE श्री. ' + person + '</span>';
            } else {
                statusText = '<span style="color:#0d47a1; font-weight:600;">उपलब्ध</span>';
            }

            var allMBs = getData('mb_records');
            var originalIdx = -1;
            for (var k = 0; k < allMBs.length; k++) {
                if (normalizeMB(allMBs[k].mbNumber) === normNo) {
                    originalIdx = k;
                    break;
                }
            }

            var dateStr = formatDateToDMY(m.date);
            var sizeStr = m.size || 'लहान M.B.';

            html += '<tr>' +
            '<td style="text-align:center;">' + (i + 1) + '</td>' +
            '<td><a href="javascript:void(0)" onclick="closeQuickInfoModal(); openSmartActionCenter(\'' + rawNo + '\')" style="color:#0d47a1; font-weight:800; text-decoration:underline;">' + rawNo + '</a></td>' +
            '<td>' + sizeStr + '</td>' +
            '<td>' + statusText + '</td>' +
            '<td>' + dateStr + '</td>' +
            '<td class="action-cell" style="text-align:center;">' +
            '<button class="btn-action" style="background:#2e7d32; padding:3px 6px;" onclick="closeQuickInfoModal(); openModule(\'mbModal\'); editMB(' + originalIdx + ')">Edit</button>' +
            '<button class="btn-action" style="background:#d32f2f; padding:3px 6px;" onclick="quickPopupDelete(' + originalIdx + ')">Delete</button>' +
            '</td>' +
            '</tr>';
        });
    }
    html += '</tbody></table>';

    var container = document.getElementById('qmTableContainer');
    if (container) container.innerHTML = html;
}

function openQuickInfoModal(type) {
    currentQuickModalType = type;
    var title = type === 'घेणेD' ? 'एकूण M.B.' : (type === 'GIVEN' ? 'दिलेली M.B.' : 'उपलब्ध M.B.');
    
    var filterHTML = '';
    if (type === 'घेणेD') {
        var jeOptions = '<option value="">-- सर्व JE --</option>';
        getData('je_records').forEach(function(j) { jeOptions += '<option value="' + j.name + '">' + j.name + '</option>'; });
        
        filterHTML = '<div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:8px; margin-bottom:10px; font-size:11.5px;">' +
            '<div style="font-weight:700; color:#0d47a1; margin-bottom:6px;">📊 एकूण M.B. रिपोर्ट फिल्टर व कालावधी</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:6px;">' +
            '<div><label style="display:block; font-weight:600; margin-bottom:2px;">दिनांक पासून</label><input type="date" class="form-control" id="qmFromDate" style="padding:4px; font-size:11px;" onchange="renderQuickModalTable()"></div>' +
            '<div><label style="display:block; font-weight:600; margin-bottom:2px;">दिनांक पर्यंत</label><input type="date" class="form-control" id="qmToDate" style="padding:4px; font-size:11px;" onchange="renderQuickModalTable()"></div>' +
            '</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:6px;">' +
            '<div><label style="display:block; font-weight:600; margin-bottom:2px;">JE निवडा</label><select class="form-control" id="qmFilterJE" style="padding:4px; font-size:11px;" onchange="renderQuickModalTable()">' + jeOptions + '</select></div>' +
            '<div><label style="display:block; font-weight:600; margin-bottom:2px;">M.B. प्रकार</label><select class="form-control" id="qmFilterSize" style="padding:4px; font-size:11px;" onchange="renderQuickModalTable()"><option value="">-- सर्व M.B. --</option><option value="लहान M.B.">लहान M.B.</option><option value="मोठी M.B.">मोठी M.B.</option></select></div>' +
            '<div><label style="display:block; font-weight:600; margin-bottom:2px;">नोंद स्रोत</label><select class="form-control" id="qmFilterSource" style="padding:4px; font-size:11px;" onchange="renderQuickModalTable()"><option value="">-- सर्व स्रोत --</option><option value="विभागीय कार्यालय">विभागीय कार्यालय</option><option value="भांडारपाल">भांडारपाल</option></select></div>' +
            '</div></div>';
    }

    var fullHTML = filterHTML + '<div id="qmTableContainer"></div>';

    document.getElementById('quickModalTitle').innerText = title;
    document.getElementById('quickModalBody').innerHTML = fullHTML;
    document.getElementById('quickInfoModal').style.display = 'flex';

    if (type === 'घेणेD') {
        renderQuickModalTable();
    } else {
        var list = type === 'GIVEN' ? getCurrentlyActiveGivenMBs() : getAvailableStock();
        var stock = getAvailableStock();
        var isAvailableMap = {};
        stock.forEach(function(s) { isAvailableMap[normalizeMB(s.mbNumber)] = true; });
        
        var html = '<table class="data-table"><thead><tr>' +
        '<th style="text-align:center;">अ.क्र.</th>' +
        '<th>M.B. क्र.</th>' +
        '<th>साईज</th>' +
        '<th>सद्यस्थिती व धारक</th>' +
        '<th>दिनांक</th>' +
        '<th style="text-align:center;">Action</th>' +
        '</tr></thead><tbody>';

        if (list.length === 0) {
            html += '<tr><td colspan="6" style="text-align:center; padding:10px; color:#666;">कोणतीही नोंद उपलब्ध नाही.</td></tr>';
        } else {
            list.forEach(function(m, i) {
                var rawNo = (m.mbNumber || m.mbNo || '').trim();
                var normNo = normalizeMB(rawNo);
                var statusObj = getLatestMBStatus(rawNo);
                var statusText = "";

                if (isAvailableMap[normNo]) {
                    statusText = '<span style="color:#2e7d32; font-weight:700;">उपलब्ध</span>';
                } else if (statusObj && (statusObj.lastAction === 'दिलेली M.B.' || statusObj.lastAction === 'दिलेली एमबी')) {
                    var person = statusObj.detail || statusObj.source || 'संबंधित';
                    person = person.replace(/^श्री.?\s*/i, '');
                    statusText = '<span style="color:#e65100; font-weight:700;">JE श्री. ' + person + '</span>';
                } else {
                    statusText = '<span style="color:#0d47a1; font-weight:600;">उपलब्ध</span>';
                }

                var allMBs = getData('mb_records');
                var originalIdx = -1;
                for (var k = 0; k < allMBs.length; k++) {
                    if (normalizeMB(allMBs[k].mbNumber) === normNo) {
                        originalIdx = k;
                        break;
                    }
                }

                var dateStr = formatDateToDMY(m.date);
                var sizeStr = m.size || 'लहान M.B.';

                html += '<tr>' +
                '<td style="text-align:center;">' + (i + 1) + '</td>' +
                '<td><a href="javascript:void(0)" onclick="closeQuickInfoModal(); openSmartActionCenter(\'' + rawNo + '\')" style="color:#0d47a1; font-weight:800; text-decoration:underline;">' + rawNo + '</a></td>' +
                '<td>' + sizeStr + '</td>' +
                '<td>' + statusText + '</td>' +
                '<td>' + dateStr + '</td>' +
                '<td class="action-cell" style="text-align:center;">' +
                '<button class="btn-action" style="background:#2e7d32; padding:3px 6px;" onclick="closeQuickInfoModal(); openModule(\'mbModal\'); editMB(' + originalIdx + ')">Edit</button>' +
                '<button class="btn-action" style="background:#d32f2f; padding:3px 6px;" onclick="quickPopupDelete(' + originalIdx + ')">Delete</button>' +
                '</td>' +
                '</tr>';
            });
        }
        html += '</tbody></table>';
        document.getElementById('qmTableContainer').innerHTML = html;
    }
}

function quickPopupDelete(idx) {
    if (idx === -1) return showAlert('रेकॉर्ड सापडला नाही.', 'ERROR');
    var rec = getData('mb_records')[idx];
    var mbNo = rec ? rec.mbNumber : '';
    showCustomConfirm("ही नोंद हटवायची का?", "ही नोंद हटवण्यासाठी कृपया M.B. क्रमांक '" + mbNo + "' खालील बॉक्समध्ये टाईप करा:", mbNo, "✅ DELETE", "#d32f2f", function(confirmed) {
        if (confirmed) {
            var list = getData('mb_records');
            list.splice(idx, 1);
            setData('mb_records', list);
            refreshAll();
            closeQuickInfoModal();
            showAlert('M.B. नोंद यशस्वीरीत्या हटवली!', 'SUCCESS');
        }
    });
}

function closeQuickInfoModal() { document.getElementById('quickInfoModal').style.display = 'none'; }

function printQuickModalReport() {
    if (currentQuickModalType !== 'घेणेD') {
        var title = document.getElementById('quickModalTitle').innerText;
        var tableHTML = document.getElementById('qmTableContainer').innerHTML;
        var todayStr = formatDateToDMY(new Date().toISOString().slice(0, 10));
        var html = '<div style="margin-bottom:12px; border-bottom:2px solid #333; padding-bottom:6px;"><div style="text-align:center; margin-bottom:4px;"><h1 style="font-size:16px; font-weight:800; margin:0;">सार्वजनिक बांधकाम विभाग</h1><h2 style="font-size:12px; font-weight:700; margin:2px 0;">' + title + '</h2></div><div style="text-align:right; font-size:11.5px;">अहवाल दिनांक: ' + todayStr + '</div></div>' + tableHTML;
        printA4Document(html, 'MB_Quick_Report_' + todayStr.replace(/\//g, '-') + '.pdf');
        return;
    }

    // एकूण M.B. (घेणेD) साठी मुख्य स्त्रोत आणि दुसरा स्त्रोत गटानुसार (Grouped Report) प्रिंट जनरेट करणे
    var list = getFilteredReceivedMBs();
    var fFrom = document.getElementById('qmFromDate') ? document.getElementById('qmFromDate').value : '';
    var fTo = document.getElementById('qmToDate') ? document.getElementById('qmToDate').value : '';
    var todayStr = formatDateToDMY(new Date().toISOString().slice(0, 10));

    var groups = {};
    list.forEach(function(m) {
        var rawNo = (m.mbNumber || '').trim();
        var statusObj = getLatestMBStatus(rawNo);
        var stock = getAvailableStock();
        var isAvail = stock.some(function(s){ return normalizeMB(s.mbNumber) === normalizeMB(rawNo); });
        var holder = getMBDisplayHolder(statusObj, isAvail);

        // मुख्य स्त्रोत (Main Source) ठरवणे
        var mainSrc = m.receivedSource || m.receivedFrom || 'इतर स्त्रोत';
        if (mainSrc.includes('भांडारपाल')) mainSrc = 'भांडारपाल (Bhandarpal)';
        else if (mainSrc.includes('कार्यालय') || mainSrc.includes('जमा')) mainSrc = 'विभागीय कार्यालय (Office)';
        else mainSrc = 'इतर स्त्रोत (Other)';

        // दुसरा स्त्रोत / धारक (Secondary Source / Holder)
        var secSrc = holder || 'कार्यालय';

        if (!groups[mainSrc]) groups[mainSrc] = {};
        if (!groups[mainSrc][secSrc]) groups[mainSrc][secSrc] = [];
        groups[mainSrc][secSrc].push(m);
    });

    var html = '<div style="margin-bottom:15px; border-bottom:2px solid #333; padding-bottom:8px;">' +
        '<div style="text-align:center; margin-bottom:4px;">' +
        '<h1 style="font-size:16px; font-weight:800; margin:0;">सार्वजनिक बांधकाम विभाग</h1>' +
        '<h2 style="font-size:13px; font-weight:700; margin:3px 0;">एकूण मोजमाप पुस्तिका (M.B.) सविस्तर अहवाल (मुख्य व दुसरा स्त्रोत गटानुसार)</h2>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; font-size:11px; margin-top:5px;">' +
        '<div><strong>कालावधी:</strong> ' + (fFrom ? formatDateToDMY(fFrom) : 'सर्व') + ' ते ' + (fTo ? formatDateToDMY(fTo) : 'सर्व') + '</div>' +
        '<div><strong>अहवाल दिनांक:</strong> ' + todayStr + '</div>' +
        '</div>' +
        '</div>';

    var globalIndex = 1;
    for (var mainKey in groups) {
        html += '<div style="margin-top:12px; margin-bottom:6px; font-size:11pt; font-weight:800; color:#0d47a1; background:#e3f2fd; padding:5px 8px; border-radius:4px;">📂 मुख्य स्त्रोत: ' + mainKey + '</div>';
        
        for (var secKey in groups[mainKey]) {
            html += '<div style="margin:6px 0 4px 10px; font-size:10pt; font-weight:700; color:#333;">👉 दुसरा स्त्रोत / धारक: ' + secKey + '</div>';
            html += '<table class="print-table" style="margin-bottom:8px; width:100%; border-collapse:collapse; font-size:9.5pt;">' +
                '<thead><tr style="background:#f5f5f5;">' +
                '<th style="width:40px; text-align:center;">अ.क्र.</th>' +
                '<th>M.B. क्रमांक</th>' +
                '<th>साईज</th>' +
                '<th>नोंद दिनांक</th>' +
                '<th>सद्यस्थिती व तपशील</th>' +
                '</tr></thead><tbody>';

            groups[mainKey][secKey].forEach(function(item) {
                var rawNo = (item.mbNumber || '').trim();
                var statusObj = getLatestMBStatus(rawNo);
                var stock = getAvailableStock();
                var isAvail = stock.some(function(s){ return normalizeMB(s.mbNumber) === normalizeMB(rawNo); });
                var holder = getMBDisplayHolder(statusObj, isAvail);
                var dateStr = formatDateToDMY(item.date);
                var sizeStr = item.size || 'लहान M.B.';

                html += '<tr>' +
                    '<td style="text-align:center;">' + (globalIndex++) + '</td>' +
                    '<td><strong>' + rawNo + '</strong></td>' +
                    '<td>' + sizeStr + '</td>' +
                    '<td>' + dateStr + '</td>' +
                    '<td>' + holder + '</td>' +
                    '</tr>';
            });
            html += '</tbody></table>';
        }
    }

    printA4Document(html, 'Total_MB_Grouped_Report_' + todayStr.replace(/\//g, '-') + '.pdf');
}
