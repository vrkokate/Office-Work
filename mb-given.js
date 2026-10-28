// mb-given.js - Given M.B., JE Holdings, and Stock Management Logic

function normalizeMB(no) {
    if (!no) return '';
    return String(no).trim().replace(/^0+/, '');
}

function getCurrentlyActiveGivenMBs() {
    var allMBs = getData('mb_records');
    var statusMap = {};
    allMBs.forEach(function(m) {
        var no = (m.mbNumber || '').trim();
        var norm = normalizeMB(no);
        if (!norm) return;
        var isGiven = (m.actionType === 'दिलेली M.B.' || m.actionType === 'दिलेली एमबी');
        var isReceived = (m.actionType === 'मिळालेली M.B.' || m.actionType === 'मिळालेली एमबी');

        if (!statusMap[norm]) {
            statusMap[norm] = { lastAction: '', date: '', detail: '', source: '', size: m.size || 'लहान M.B.', mbNumber: no };
        }
        if (isGiven) {
            statusMap[norm].lastAction = 'दिलेली M.B.';
            statusMap[norm].date = m.date;
            statusMap[norm].detail = m.receivedDetail || '';
            statusMap[norm].source = m.receivedSource || '';
            statusMap[norm].size = m.size || statusMap[norm].size;
        } else if (isReceived) {
            statusMap[norm].lastAction = 'मिळालेली M.B.';
            statusMap[norm].date = m.date;
            statusMap[norm].detail = '';
            statusMap[norm].source = m.receivedSource || '';
            statusMap[norm].size = m.size || statusMap[norm].size;
        }
    });

    var activeList = [];
    for (var norm in statusMap) {
        var st = statusMap[norm];
        if (st.lastAction === 'दिलेली M.B.') {
            activeList.push({
                mbNumber: st.mbNumber,
                size: st.size,
                date: st.date,
                recipient: st.detail || st.source
            });
        }
    }
    return activeList;
}

function getCurrentlyHeldMBsByJE(jeName) {
    var givenList = getCurrentlyActiveGivenMBs();
    var stock = getAvailableStock();
    var availMap = {};
    stock.forEach(function(s){ availMap[normalizeMB(s.mbNumber)] = true; });

    return givenList.filter(function(g){
        var norm = normalizeMB(g.mbNumber);
        if (availMap[norm]) return false;
        var recip = (g.recipient || '').toLowerCase();
        var target = (jeName || '').toLowerCase();
        return recip.includes(target);
    });
}

function getAvailableStock() {
    var allMBs = getData('mb_records');
    var map = {};
    allMBs.forEach(function(m) {
        var no = (m.mbNumber || '').trim();
    var norm = normalizeMB(no);
        if (!norm) return;
        var isGiven = (m.actionType === 'दिलेली M.B.' || m.actionType === 'दिलेली एमबी');
        var isReceived = (m.actionType === 'मिळालेली M.B.' || m.actionType === 'मिळालेली एमबी');

        if (!map[norm]) {
            map[norm] = { isAvailable: true, size: m.size || 'लहान M.B.', mbNumber: no, date: m.date };
        }
        if (isGiven) {
            map[norm].isAvailable = false;
        } else if (isReceived) {
            map[norm].isAvailable = true;
            map[norm].size = m.size || map[norm].size;
            map[norm].date = m.date;
        }
    });

    var stock = [];
    for (var norm in map) {
        if (map[norm].isAvailable) {
            stock.push({
                mbNumber: map[norm].mbNumber,
                size: map[norm].size,
                date: map[norm].date
            });
        }
    }
    return stock;
}

function getLatestMBStatus(mbNo) {
    var allMBs = getData('mb_records');
    var normTarget = normalizeMB(mbNo);
    var latest = null;
    allMBs.forEach(function(m, idx) {
        var no = (m.mbNumber || '').trim();
        if (normalizeMB(no) === normTarget) {
            latest = {
                index: idx,
                mbNumber: no,
                size: m.size || 'लहान M.B.',
                lastAction: m.actionType,
                date: m.date,
                detail: m.receivedDetail || '',
                source: m.receivedSource || m.receivedFrom || ''
            };
        }
    });
    return latest;
}
