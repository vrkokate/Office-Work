// mb-report.js - Smart Search & General Report

function handleSmartSearchInput(input) {
    var query = (input.value || '').trim().toLowerCase();
    var box = document.getElementById('smartSearchSuggestions');
    if (!box) return;

    if (!query) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }

    var allMBs = getData('mb_records');
    var matches = [];
    var seen = {};

    allMBs.forEach(function(m) {
        if(!m) return;
        var no = (m.mbNumber || '').trim();
        if (no.toLowerCase().includes(query) && !seen[no]) {
            seen[no] = true;
            matches.push(no);
        }
    });

    if (matches.length === 0) {
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }

    var html = '';
    matches.forEach(function(mbNo) {
        html += '<div class="suggestion-item" onclick="selectSuggestionItem(\'' + escapeHtml(mbNo) + '\')">' + escapeHtml(mbNo) + '</div>';
    });

    box.innerHTML = html;
    box.style.display = 'block';
}

function selectSuggestionItem(mbNo) {
    document.getElementById('smartSearchInput').value = mbNo;
    var box = document.getElementById('smartSearchSuggestions');
    if (box) {
        box.style.display = 'none';
        box.innerHTML = '';
    }
    openSmartActionCenter(mbNo);
}

document.addEventListener('click', function(e) {
    var searchInput = document.getElementById('smartSearchInput');
    var box = document.getElementById('smartSearchSuggestions');
    if (searchInput && box && !searchInput.contains(e.target) && !box.contains(e.target)) {
        box.style.display = 'none';
    }
});

/* 🌟 नवीन लॉजिक: शोध बॉक्समध्ये काही असेल तर दिनांक न देता देखील शोधणार */
function executeSmartSearchOrReport() {
    var searchTxt = document.getElementById('smartSearchInput').value.trim();
    
    // जर शोध बॉक्समध्ये काही लिहिले असेल, तर दिनांक न देता थेट शोध घ्या
    if (searchTxt) {
        showSmartSearchResultModal(searchTxt);
        return;
    }
    
    // जर शोध बॉक्स रिकामा असेल, तरच दिनांक तपासा
    generateGeneralReport();
}

function showSmartSearchResultModal(query) {
    var queryClean = query.trim();
    var queryLower = queryClean.toLowerCase();
    var queryMB = normalizeMB(queryClean);
    var allMBs = getData('mb_records');
    var stock = getAvailableStock();

    var matched = allMBs.filter(function(m) {
        if(!m) return false;
        var rawNo = (m.mbNumber || '').trim();
        var noLower = rawNo.toLowerCase();
        var noMB = normalizeMB(rawNo);
        var je = (m.receivedDetail || '').toLowerCase();
        var src = (m.receivedSource || '').toLowerCase();
        var from = (m.receivedFrom || '').toLowerCase();

        var isExactMB = (noLower === queryLower) || (noMB !== '' && noMB === queryMB);
        var isTextMatch = je.includes(queryLower) || src.includes(queryLower) || from.includes(queryLower);

        return isExactMB || isTextMatch;
    });

    var latestMap = {};
    matched.forEach(function(m) {
        var no = (m.mbNumber || '').trim();
        if (!latestMap[no]) {
            latestMap[no] = getLatestMBStatus(no);
        }
    });

    var resultList = [];
    for (var k in latestMap) {
        if (latestMap[k]) resultList.push(latestMap[k]);
    }

    if (resultList.length === 0) {
        return showAlert('स्मार्ट शोध "' + query + '" नुसार कोणतीही नोंद आढळली नाही!', 'WARNING');
    }

    var tableHTML = '<table class="data-table"><thead><tr>' +
    '<th style="text-align:center;">अ.क्र.</th>' +
    '<th>M.B. क्र.</th>' +
    '<th>आकार</th>' +
    '<th>दिनांक</th>' +
    '<th>सद्यस्थिती व धारक</th>' +
    '</tr></thead><tbody>';

    var isAvailableMap = {};
    stock.forEach(function(s) { if(s) isAvailableMap[normalizeMB(s.mbNumber)] = true; });

    resultList.forEach(function(item, idx) {
        var mbNo = item.mbNumber || '-';
        var size = item.size || 'लहान M.B.';
        var dateStr = formatDateToDMY(item.date);
        var statusText = '';
        var normMbNo = normalizeMB(mbNo);

        if (isAvailableMap[normMbNo]) {
            statusText = '<span style="color:#2e7d32; font-weight:700;">उपलब्ध</span>';
        } else if (item.lastAction === 'दिलेली M.B.' || item.lastAction === 'दिलेली एमबी') {
            var person = item.detail || item.source || 'संबंधित';
            person = person.replace(/^श्री.?\s*/i, '');
            statusText = '<span style="color:#e65100; font-weight:700;">JE श्री. ' + escapeHtml(person) + '</span>';
        } else {
            statusText = '<span style="color:#0d47a1; font-weight:600;">उपलब्ध</span>';
        }

        tableHTML += '<tr>' +
        '<td style="text-align:center;">' + (idx + 1) + '</td>' +
        '<td><a href="javascript:void(0)" onclick="closeSearchResultModal(); openSmartActionCenter(\'' + escapeHtml(mbNo) + '\')" style="color:#0d47a1; font-size:12.5px; font-weight:800; text-decoration:underline;">' + escapeHtml(mbNo) + '</a></td>' +
        '<td>' + escapeHtml(size) + '</td>' +
        '<td>' + dateStr + '</td>' +
        '<td>' + statusText + '</td>' +
        '</tr>';
    });

    tableHTML += '</tbody></table>';

    document.getElementById('searchResultModalTitle').innerText = '🔍 शोध तपशील (M.B. / नाव: "' + query + '")';
    document.getElementById('searchResultModalBody').innerHTML = tableHTML;
    document.getElementById('searchResultModal').style.display = 'flex';
}

function closeSearchResultModal() {
    document.getElementById('searchResultModal').style.display = 'none';
}

function printSearchResultFromPopup() {
    var title = document.getElementById('searchResultModalTitle').innerText;
    var body = document.getElementById('searchResultModalBody').innerHTML;
    printA4Document(body, 'Search_Result_' + new Date().toISOString().slice(0,10) + '.pdf');
}

function generateGeneralReport() {
    var fDate = document.getElementById('repFromDate').value;
    var tDate = document.getElementById('repToDate').value;
    if (!fDate || !tDate) return showAlert('कृपया दिनांक पासून आणि दिनांक पर्यंत निवडा.', 'WARNING');
    showAlert('अहवाल तयार होत आहे...', 'SUCCESS');
}
