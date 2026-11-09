// mb-given.js - Given M.B., JE Holdings Logic

function getCurrentlyActiveGivenMBs() {
    var allMBs = getData('mb_records');
    var latestMap = {};
    allMBs.forEach(function(m) {
        var norm = normalizeMB(m.mbNumber);
        if (norm) latestMap[norm] = m;
    });
    var list = [];
    for (var norm in latestMap) {
        var m = latestMap[norm];
        if (m.actionType === 'दिलेली M.B.' || m.actionType === 'दिलेली एमबी') list.push(m);
    }
    return list;
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

function getCurrentlyHeldMBsByJE(jeName) {
    if (!jeName) return [];
    var active = getCurrentlyActiveGivenMBs();
    var target = String(jeName).trim().toLowerCase();
    return active
        .filter(function(item) {
            var detail = String(item.receivedDetail || '').trim().toLowerCase();
            var source = String(item.receivedSource || '').trim().toLowerCase();
            if (detail === target) return true;
            if (source === target) return true;
            if (detail.indexOf(target) !== -1 && detail.split(/\s+/).length <= target.split(/\s+/).length + 3) return true;
            return false;
        })
        .map(function(item) {
            return { mbNo: item.mbNumber, size: item.size || 'लहान M.B.', date: item.date };
        });
}
