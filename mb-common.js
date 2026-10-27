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
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function(c) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '\'': '&#39;',
            '"': '&quot;'
        }[c];
    });
}

function formatDateDisplay(v) {
    if (!v) return '';
    var p = String(v).split('-');
    return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : String(v);
}

/* =========================================================
   M.B. SMART ACTION CENTER
   मूळ MB.html मधील Modal वापरून कृती केंद्र उघडणे/बंद करणे
   ========================================================= */

var currentSmartActionMBNo = '';

function openSmartActionCenter(mbNo) {
    var modal = document.getElementById('smartActionCenterModal');
    var detailsBox = document.getElementById('sacDetailsBox');
    var subActionContainer = document.getElementById('sacSubActionContainer');
    var historyContainer = document.getElementById('sacHistoryContainer');

    if (!modal) {
        console.error(
            'Smart Action Center Modal सापडले नाही. MB.html मधील smartActionCenterModal तपासा.'
        );
        return false;
    }

    currentSmartActionMBNo = String(mbNo == null ? '' : mbNo).trim();

    if (subActionContainer) {
        subActionContainer.style.display = 'none';
        subActionContainer.innerHTML = '';
    }

    if (historyContainer) {
        historyContainer.style.display = 'none';
    }

    if (detailsBox) {
        detailsBox.innerHTML =
            '<div style="padding:10px;text-align:center;color:#0d47a1;">' +
            '<b>M.B. क्रमांक:</b> ' +
            escapeHtml(currentSmartActionMBNo || '-') +
            '<br><span style="font-size:11px;color:#666;">तपशील लोड होत आहेत...</span>' +
            '</div>';
    }

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    try {
        renderSmartActionCenterDetails(currentSmartActionMBNo);
    } catch (error) {
        console.error('Smart Action Center तपशील दाखवताना त्रुटी:', error);

        if (detailsBox) {
            detailsBox.innerHTML =
                '<div style="padding:10px;color:#b71c1c;">' +
                '<b>M.B. क्रमांक:</b> ' +
                escapeHtml(currentSmartActionMBNo || '-') +
                '<br>तपशील दाखवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' +
                '</div>';
        }
    }

    return true;
}

function closeSmartActionCenter() {
    var modal = document.getElementById('smartActionCenterModal');
    var subActionContainer = document.getElementById('sacSubActionContainer');
    var historyContainer = document.getElementById('sacHistoryContainer');

    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }

    if (subActionContainer) {
        subActionContainer.style.display = 'none';
        subActionContainer.innerHTML = '';
    }

    if (historyContainer) {
        historyContainer.style.display = 'none';
    }
}

function renderSmartActionCenterDetails(mbNo) {
    var detailsBox = document.getElementById('sacDetailsBox');
    if (!detailsBox) return;

    var normalizedNo = String(mbNo == null ? '' : mbNo).trim();

    if (!normalizedNo) {
        detailsBox.innerHTML =
            '<div style="padding:10px;color:#b71c1c;">' +
            'M.B. क्रमांक उपलब्ध नाही.' +
            '</div>';
        return;
    }

    var records = [];

    if (typeof getData === 'function') {
        records = getData('mb_records');

        if (!Array.isArray(records)) {
            records = [];
        }
    }

    var matchedRecords = records.filter(function(record) {
        if (!record) return false;

        var recordNo = String(
            record.mbNumber || record.mbNo || ''
        ).trim();

        return recordNo.toLowerCase() === normalizedNo.toLowerCase();
    });

    var latestRecord = matchedRecords.length
        ? matchedRecords[matchedRecords.length - 1]
        : null;

    var size = latestRecord
        ? (latestRecord.size || 'उपलब्ध नाही')
        : 'उपलब्ध नाही';

    var date = latestRecord
        ? (latestRecord.date || 'उपलब्ध नाही')
        : 'उपलब्ध नाही';

    var action = latestRecord
        ? (latestRecord.actionType || 'उपलब्ध नाही')
        : 'उपलब्ध नाही';

    var source = latestRecord
        ? (
            latestRecord.receivedSource ||
            latestRecord.receivedFrom ||
            latestRecord.source ||
            'उपलब्ध नाही'
        )
        : 'उपलब्ध नाही';

    var detail = latestRecord
        ? (
            latestRecord.receivedDetail ||
            latestRecord.detail ||
            'उपलब्ध नाही'
        )
        : 'उपलब्ध नाही';

    var holder = 'उपलब्ध नाही';

    if (typeof getLatestMBStatus === 'function') {
        try {
            var status = getLatestMBStatus(normalizedNo);

            if (typeof getMBDisplayHolder === 'function') {
                var isAvailable = false;

                if (typeof getAvailableStock === 'function') {
                    var stock = getAvailableStock();

                    if (Array.isArray(stock)) {
                        isAvailable = stock.some(function(item) {
                            var itemNo = String(
                                item && (item.mbNumber || item.mbNo) || ''
                            ).trim();

                            if (typeof normalizeMB === 'function') {
                                return normalizeMB(itemNo) === normalizeMB(normalizedNo);
                            }

                            return itemNo.toLowerCase() === normalizedNo.toLowerCase();
                        });
                    }
                }

                holder = getMBDisplayHolder(status, isAvailable);
            }
        } catch (error) {
            console.warn('M.B. सद्यस्थिती मिळवता आली नाही:', error);
        }
    }

    detailsBox.innerHTML =
        '<div style="' +
            'padding:10px;' +
            'background:#f4f8ff;' +
            'border:1px solid #d6e4ff;' +
            'border-radius:8px;' +
            'font-size:12px;' +
            'line-height:1.8;' +
        '">' +

            '<div style="' +
                'font-size:15px;' +
                'font-weight:800;' +
                'color:#0d47a1;' +
                'padding-bottom:6px;' +
                'margin-bottom:6px;' +
                'border-bottom:1px solid #c7d9f5;' +
            '">' +
                '📘 M.B. क्रमांक: ' + escapeHtml(normalizedNo) +
            '</div>' +

            '<div><b>📏 M.B. आकार:</b> ' +
                escapeHtml(size) +
            '</div>' +

            '<div><b>📅 दिनांक:</b> ' +
                escapeHtml(formatDateDisplay(date) || 'उपलब्ध नाही') +
            '</div>' +

            '<div><b>🔄 शेवटची कृती:</b> ' +
                escapeHtml(action) +
            '</div>' +

            '<div><b>🏢 प्राप्त / पाठविण्याचे कार्यालय:</b> ' +
                escapeHtml(source) +
            '</div>' +

            '<div><b>📝 तपशील:</b> ' +
                escapeHtml(detail) +
            '</div>' +

            '<div><b>📍 सद्यस्थिती:</b> ' +
                escapeHtml(holder) +
            '</div>' +

            (matchedRecords.length
                ? '<div style="margin-top:5px;color:#2e7d32;font-weight:700;">' +
                    'एकूण संबंधित नोंदी: ' + matchedRecords.length +
                  '</div>'
                : '<div style="margin-top:5px;color:#b71c1c;">' +
                    'या क्रमांकाची नोंद mb_records मध्ये सापडली नाही.' +
                  '</div>') +

        '</div>';
}

/* सध्याच्या कृती केंद्रातील M.B. क्रमांक मिळवण्यासाठी */
function getCurrentSmartActionMBNo() {
    return currentSmartActionMBNo;
}
