// mb-available.js - Available Stock Management Logic

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
