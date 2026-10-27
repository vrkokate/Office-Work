
/* =========================================================
   mb-common.js
   M.B. System - Common Utility Functions
   Module Open/Close Fix
   ========================================================= */

"use strict";

/* ---------------------------------------------------------
   M.B. Display Holder
   --------------------------------------------------------- */
function getMBDisplayHolder(status, isAvail) {
    if (isAvail) {
        return 'कार्यालयात उपलब्ध';
    }

    if (!status) {
        return 'कार्यालय / उपलब्ध';
    }

    var detail =
        status.detail ||
        status.receivedDetail ||
        '';

    var source =
        status.source ||
        status.receivedSource ||
        status.receivedFrom ||
        '';

    var action =
        status.lastAction ||
        status.actionType ||
        '';

    if (detail) {
        return detail;
    }

    if (source) {
        return source;
    }

    if (action && action.includes('JE')) {
        return action;
    }

    return action || 'कार्यालय';
}


/* ---------------------------------------------------------
   Transaction Sentence
   --------------------------------------------------------- */
function formatTransactionSentence(h) {
    if (!h) {
        return '-';
    }

    return (
        h.receivedSource ||
        h.receivedFrom ||
        h.actionType ||
        '-'
    );
}


/* ---------------------------------------------------------
   Date Placeholder
   --------------------------------------------------------- */
function checkDatePlaceholder(input) {
    if (!input) {
        return;
    }

    if (input.value) {
        input.classList.remove('empty-date');
    } else {
        input.classList.add('empty-date');
    }
}


/* ---------------------------------------------------------
   HTML Escape
   --------------------------------------------------------- */
function escapeHtml(v) {
    return String(v == null ? '' : v).replace(
        /[&<>'"]/g,
        function (c) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[c];
        }
    );
}


/* ---------------------------------------------------------
   Date Display Format
   --------------------------------------------------------- */
function formatDateDisplay(v) {
    if (!v) {
        return '';
    }

    var p = String(v).split('-');

    return p.length === 3
        ? p[2] + '-' + p[1] + '-' + p[0]
        : String(v);
}


/* ---------------------------------------------------------
   MODULE OPEN
   JE / M.B. / Work List / Bill Register / Assign
   --------------------------------------------------------- */
function openModule(moduleId) {
    var modal = document.getElementById(moduleId);

    if (!modal) {
        console.error(
            'M.B. System: मॉड्यूल सापडले नाही:',
            moduleId
        );

        if (typeof showCustomAlert === 'function') {
            showCustomAlert(
                'त्रुटी',
                'मॉड्यूल सापडले नाही: ' + moduleId
            );
        } else {
            alert(
                'मॉड्यूल सापडले नाही: ' + moduleId
            );
        }

        return false;
    }

    /*
       आधी display:none असलेला modal स्पष्टपणे उघडा.
       !important असल्यासही display:flex लागू करण्याचा प्रयत्न.
    */
    modal.style.setProperty(
        'display',
        'flex',
        'important'
    );

    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';

    modal.setAttribute('aria-hidden', 'false');

    /*
       Modal मधील scroll आणि मोबाइल स्क्रीनसाठी
       मूळ layout कायम ठेवणे.
    */
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    /*
       Assign मधील पुढील कृतीचा modal स्वतंत्रपणे
       बंद राहू द्या.
    */
    if (moduleId === 'assignModal') {
        var assignActionModal =
            document.getElementById('assignActionModal');

        if (assignActionModal) {
            assignActionModal.style.setProperty(
                'display',
                'none',
                'important'
            );

            assignActionModal.setAttribute(
                'aria-hidden',
                'true'
            );
        }
    }

    /*
       Modal उघडल्यानंतर संबंधित उपलब्ध refresh
       functions चालवण्याचा प्रयत्न.
       एखादी function नसल्यास modal बंद पडणार नाही.
    */
    try {
        if (
            moduleId === 'jeModal' &&
            typeof renderJEList === 'function'
        ) {
            renderJEList();
        }
    } catch (error) {
        console.error('JE refresh error:', error);
    }

    try {
        if (
            moduleId === 'mbModal' &&
            typeof refreshMBDashboard === 'function'
        ) {
            refreshMBDashboard();
        }
    } catch (error) {
        console.error('M.B. refresh error:', error);
    }

    try {
        if (
            moduleId === 'workModal' &&
            typeof renderWorkList === 'function'
        ) {
            renderWorkList();
        }
    } catch (error) {
        console.error('Work List refresh error:', error);
    }

    try {
        if (
            moduleId === 'billModal' &&
            typeof renderBills === 'function'
        ) {
            renderBills();
        }
    } catch (error) {
        console.error('Bill Register refresh error:', error);
    }

    try {
        if (
            moduleId === 'assignModal' &&
            typeof refreshAssignDropdowns === 'function'
        ) {
            refreshAssignDropdowns();
        }
    } catch (error) {
        console.error('Assign refresh error:', error);
    }

    return true;
}


/* ---------------------------------------------------------
   MODULE CLOSE
   --------------------------------------------------------- */
function closeModule(moduleId) {
    var modal = document.getElementById(moduleId);

    if (!modal) {
        console.error(
            'M.B. System: बंद करण्यासाठी मॉड्यूल सापडले नाही:',
            moduleId
        );

        return false;
    }

    modal.style.setProperty(
        'display',
        'none',
        'important'
    );

    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';

    modal.setAttribute('aria-hidden', 'true');

    /*
       इतर कोणताही मुख्य modal उघडा आहे का ते तपासा.
    */
    var modalIds = [
        'jeModal',
        'mbModal',
        'workModal',
        'billModal',
        'assignModal'
    ];

    var anotherModalOpen = modalIds.some(
        function (id) {
            if (id === moduleId) {
                return false;
            }

            var other = document.getElementById(id);

            return other &&
                window.getComputedStyle(other).display !== 'none';
        }
    );

    if (!anotherModalOpen) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }

    return true;
}


/* ---------------------------------------------------------
   SMART ACTION CENTER OPEN
   --------------------------------------------------------- */
function openSmartActionCenter(mbNo) {
    var modal = document.getElementById(
        'smartActionCenterModal'
    );

    if (!modal) {
        console.error(
            'Smart Action Center modal सापडला नाही.'
        );
        return false;
    }

    modal.style.setProperty(
        'display',
        'flex',
        'important'
    );

    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';

    modal.setAttribute('aria-hidden', 'false');

    var detailsBox = document.getElementById(
        'sacDetailsBox'
    );

    if (detailsBox && mbNo != null) {
        detailsBox.setAttribute(
            'data-mb-number',
            String(mbNo)
        );
    }

    document.body.style.overflow = 'hidden';

    return true;
}


/* ---------------------------------------------------------
   SMART ACTION CENTER CLOSE
   --------------------------------------------------------- */
function closeSmartActionCenter() {
    var modal = document.getElementById(
        'smartActionCenterModal'
    );

    if (!modal) {
        return false;
    }

    modal.style.setProperty(
        'display',
        'none',
        'important'
    );

    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';

    modal.setAttribute('aria-hidden', 'true');

    var modalIds = [
        'jeModal',
        'mbModal',
        'workModal',
        'billModal',
        'assignModal'
    ];

    var anotherModalOpen = modalIds.some(
        function (id) {
            var other = document.getElementById(id);

            return other &&
                window.getComputedStyle(other).display !== 'none';
        }
    );

    if (!anotherModalOpen) {
        document.body.style.overflow = '';
    }

    return true;
}


/* ---------------------------------------------------------
   CURRENT SMART ACTION CENTER M.B. NUMBER
   --------------------------------------------------------- */
function getCurrentSmartActionMBNo() {
    var detailsBox = document.getElementById(
        'sacDetailsBox'
    );

    if (!detailsBox) {
        return '';
    }

    return detailsBox.getAttribute(
        'data-mb-number'
    ) || '';
}


/* ---------------------------------------------------------
   ESCAPE KEY - CLOSE TOPMOST OPEN MODULE
   --------------------------------------------------------- */
document.addEventListener(
    'keydown',
    function (event) {
        if (event.key !== 'Escape') {
            return;
        }

        var smartModal = document.getElementById(
            'smartActionCenterModal'
        );

        if (
            smartModal &&
            window.getComputedStyle(smartModal).display !== 'none'
        ) {
            closeSmartActionCenter();
            return;
        }

        var modalIds = [
            'assignActionModal',
            'jeModal',
            'mbModal',
            'workModal',
            'billModal',
            'assignModal'
        ];

        for (var i = 0; i < modalIds.length; i++) {
            var modal = document.getElementById(
                modalIds[i]
            );

            if (
                modal &&
                window.getComputedStyle(modal).display !== 'none'
            ) {
                closeModule(modalIds[i]);
                return;
            }
        }
    }
);


/* ---------------------------------------------------------
   INITIALIZATION
   --------------------------------------------------------- */
document.addEventListener(
    'DOMContentLoaded',
    function () {
        var modalIds = [
            'jeModal',
            'mbModal',
            'workModal',
            'billModal',
            'assignModal',
            'assignActionModal'
        ];

        modalIds.forEach(function (id) {
            var modal = document.getElementById(id);

            if (modal) {
                modal.setAttribute('aria-hidden', 'true');
            }
        });
    }
);
