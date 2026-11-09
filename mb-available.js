// mb-available.js - Available Stock Management Logic

function getAvailableStock() {
    var received = getUniqueReceivedMBs(); // mb-given.js मधून येते
    var activeGiven = getCurrentlyActiveGivenMBs(); // mb-given.js मधून येते
    var issuedMap = {};
    
    activeGiven.forEach(function(m) {
        issuedMap[normalizeMB(m.mbNumber)] = true;
    });
    
    return received.filter(function(rec) {
        return !issuedMap[normalizeMB(rec.mbNumber)];
    });
}
