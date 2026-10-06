function showAlert(msg, type) {
    alert(msg);
}

function getData(key) { 
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
}

function setData(key, data) { 
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}

function normalizeMB(val) {
    if (!val) return '';
    return val.toString().trim();
}

function getLatestMBStatus(mbNumber) {
    var allMBs = getData('mb_records');
    var normalizedNo = normalizeMB(mbNumber);
    for (var i = allMBs.length - 1; i >= 0; i--) {
        var m = allMBs[i];
        if (normalizeMB(m.mbNumber) === normalizedNo) {
            return { mbNumber: m.mbNumber, lastAction: m.actionType, date: m.date, receivedDetail: m.receivedDetail, size: m.size, index: i };
        }
    }
    return null;
}

function getUniqueReceivedMBs() {
    var allMBs = getData('mb_records');
    var uniqueMap = {};
    allMBs.forEach(function(m) {
        if (m.actionType === 'मिळालेली M.B.' || m.actionType === 'मिळालेली एमबी') {
            var no = (m.mbNumber || '').trim();
            if (no) uniqueMap[normalizeMB(no)] = { mbNumber: no, size: m.size || 'लहान M.B.', date: m.date };
        }
    });
    var list = [];
    for (var k in uniqueMap) list.push(uniqueMap[k]);
    return list;
}

function getCurrentlyActiveGivenMBs() {
    var allMBs = getData('mb_records');
    var latestMap = {};
    allMBs.forEach(function(m) {
        var norm = normalizeMB(m.mbNumber);
        if (norm) latestMap[norm] = m;
    });
    var list = [];
    for (var norm in latestMap) {
        if (latestMap[norm].actionType === 'दिलेली M.B.' || latestMap[norm].actionType === 'दिलेली एमबी') {
            list.push(latestMap[norm]);
        }
    }
    return list;
}

function getAvailableStock() {
    var received = getUniqueReceivedMBs();
    var activeGiven = getCurrentlyActiveGivenMBs();
    var issuedMap = {};
    activeGiven.forEach(function(m) { issuedMap[normalizeMB(m.mbNumber)] = true; });
    var available = [];
    received.forEach(function(rec) {
        if (!issuedMap[normalizeMB(rec.mbNumber)]) available.push(rec);
    });
    return available;
}

function getCurrentlyHeldMBsByJE(jeName) {
    if (!jeName) return [];
    var normalizedJE = jeName.trim();
    var activeGiven = getCurrentlyActiveGivenMBs();
    var heldMBs = [];
    activeGiven.forEach(function(item) {
        if ((item.receivedDetail || '').trim() === normalizedJE) {
            heldMBs.push({ mbNo: item.mbNumber, size: item.size || 'लहान M.B.', date: item.date });
        }
    });
    return heldMBs;
}

function formatDateToDMY(dateStr) {
    if (!dateStr) return '-';
    var parts = dateStr.split('-');
    if (parts.length === 3) return parts[2] + '-' + parts[1] + '-' + parts[0];
    return dateStr;
}

function animateNumberCount(elementId, finalVal) {
    var el = document.getElementById(elementId);
    if (el) el.innerText = finalVal;
}

function printA4Document(content, fileName) {
    var p = document.getElementById('printableArea');
    if (p) {
        p.innerHTML = content;
        window.print();
        p.innerHTML = '';
    }
}
