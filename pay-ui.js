// ==========================================
// युजर इंटरफेस, स्टोरेज आणि इव्हेंट फाईल (pay-ui.js)
// ==========================================

let selectedWithheldDates = new Set();
let globalCalcDataList = [];
let currentEditingRecordId = null;

function printReportChrome() {
    document.body.classList.remove('print-illustration-mode');
    window.print();
}

function printIllustrationChrome() {
    document.body.classList.add('print-illustration-mode');
    window.print();
    const cleanup = () => {
        document.body.classList.remove('print-illustration-mode');
        window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 2000);
}

// 🌟 कर्मचाऱ्याच्या अचूक नावा By डिफॉल्ट फाईल नाव मिळवण्याचे फंक्शन
function getDynamicFileName(defaultPrefix) {
    let empName = '';
    
    // १. प्रथम अहवाल समरी कार्डमधून (Summary Text) कर्मचाऱ्याचे नाव शोधणे
    const summaryCard = document.getElementById('summaryText');
    if (summaryCard) {
        const text = summaryCard.innerText || summaryCard.textContent;
        const match = text.match(/कर्मचाऱ्याचे नाव[:\s]+([^\n\r]+)/);
        if (match && match[1]) {
            empName = match[1].trim();
        }
    }

    // २. समरीमध्ये न मिळाल्यास इनपुट बॉक्स तपणे
    if (!empName) {
        const empNameInput = document.getElementById('empName');
        if (empNameInput && empNameInput.value.trim()) {
            empName = empNameInput.value.trim();
        }
    }

    const safeName = empName ? empName.replace(/\s+/g, '_') : defaultPrefix;
    return `${safeName}_Pay_Fixation.pdf`;
}

function downloadReportPDF() {
    const reportArea = document.getElementById('printableReportArea');
    if (!reportArea) return;

    if (typeof html2pdf === 'undefined') {
        window.print();
        return;
    }

    const filename = getDynamicFileName('Pay_Fixation');

    const scrollContainer = reportArea.querySelector('.table-scroll-container');
    const prevMaxH = scrollContainer ? scrollContainer.style.maxHeight : '';
    const prevOverflow = scrollContainer ? scrollContainer.style.overflow : '';

    reportArea.classList.add('pdf-export-mode');
    if (scrollContainer) {
        scrollContainer.style.maxHeight = 'none';
        scrollContainer.style.overflow = 'visible';
    }

    const opt = {
        margin: [8, 6, 8, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(reportArea).save().then(() => {
        if (scrollContainer) {
            scrollContainer.style.maxHeight = prevMaxH;
            scrollContainer.style.overflow = prevOverflow;
        }
        reportArea.classList.remove('pdf-export-mode');
    }).catch(err => {
        console.error(err);
        if (scrollContainer) {
            scrollContainer.style.maxHeight = prevMaxH;
            scrollContainer.style.overflow = prevOverflow;
        }
        reportArea.classList.remove('pdf-export-mode');
        window.print();
    });
}

function downloadIllustrationPDF() {
    const illContent = document.getElementById('illustrationSheetContent');
    if (!illContent) return;

    if (typeof html2pdf === 'undefined') {
        printIllustrationChrome();
        return;
    }

    const filename = getDynamicFileName('Illustration') + '_Sheet.pdf';

    illContent.querySelectorAll('input').forEach(input => {
        input.setAttribute('value', input.value);
    });

    const opt = {
        margin: [8, 8, 8, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(illContent).save();
}

function getSavedRecordsFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('savedPayFixationsList') || '[]');
    } catch(e) {
        return [];
    }
}

function saveRecordsListToStorage(list) {
    localStorage.setItem('savedPayFixationsList', JSON.stringify(list));
    renderSavedRecordsTable();
}

function getRecordDataObject() {
    const empName = document.getElementById('empName').value.trim();
    const empDesig = document.getElementById('empDesignation').value.trim();

    let revRows = [];
    document.querySelectorAll('#scaleRevList .scale-rev-item').forEach(item => {
        let d = item.querySelector('.rev-date').value;
        let c = item.querySelector('.rev-comm').value;
        let s = item.querySelector('.rev-scale').value;
        if (d && c && s) revRows.push({ d, c, s });
    });

    return {
        id: currentEditingRecordId || Date.now(),
        savedAt: new Date().toLocaleString('mr-IN'),
        empName: empName,
        empDesignation: empDesig,
        formData: {
            empName: empName,
            empDesignation: empDesig,
            empJoinDate: document.getElementById('empJoinDate').value,
            payCommission: document.getElementById('payCommission').value,
            currentPayScale: document.getElementById('currentPayScale').value,
            basicPay: document.getElementById('basicPay').value,
            gradePay: document.getElementById('gradePay').value,
            b1_type: document.getElementById('b1_type').value,
            b1_date: document.getElementById('b1_date').value,
            b1_optDate: document.getElementById('b1_optDate').value,
            b1_comm: document.getElementById('b1_comm').value,
            b1_post: document.getElementById('b1_post').value,
            b1_scale: document.getElementById('b1_scale').value,
            b2_type: document.getElementById('b2_type').value,
            b2_date: document.getElementById('b2_date').value,
            b2_optDate: document.getElementById('b2_optDate').value,
            b2_comm: document.getElementById('b2_comm').value,
            b2_post: document.getElementById('b2_post').value,
            b2_scale: document.getElementById('b2_scale').value,
            b3_type: document.getElementById('b3_type').value,
            b3_date: document.getElementById('b3_date').value,
            b3_optDate: document.getElementById('b3_optDate').value,
            b3_comm: document.getElementById('b3_comm').value,
            b3_post: document.getElementById('b3_post').value,
            b3_scale: document.getElementById('b3_scale').value,
            fixationFrom: document.getElementById('fixationFrom').value,
            fixationTo: document.getElementById('fixationTo').value,
            autoCommissionChange: document.getElementById('autoCommissionChange').value,
            incrementMonthRule7th: document.getElementById('incrementMonthRule7th').value,
            hasScaleRev: document.getElementById('hasScaleRev').value,
            revRows: revRows,
            incrementWithheld: document.getElementById('incrementWithheld').value,
            withheldEffect: document.getElementById('withheldEffect').value,
            withheldDates: Array.from(selectedWithheldDates)
        }
    };
}

function saveCurrentFixationRecord(showAlert = true) {
    const empName = document.getElementById('empName').value.trim();
    if (!empName) {
        if (showAlert) alert("कृपया कर्मचाऱ्याचे नाव भरा!");
        return null;
    }

    const recordData = getRecordDataObject();
    let list = getSavedRecordsFromStorage();
    if (currentEditingRecordId) {
        let idx = list.findIndex(r => r.id === currentEditingRecordId);
        if (idx !== -1) list[idx] = recordData;
        else list.unshift(recordData);
        if (showAlert) alert(`'${empName}' यांची वेतन निश्चिती माहिती यशस्वीरीत्या अद्ययावत झाली!`);
    } else {
        list.unshift(recordData);
        currentEditingRecordId = recordData.id;
        if (showAlert) alert(`'${empName}' यांची वेतन निश्चिती माहिती यशस्वीरीत्या सेव्ह झाली!`);
    }

    saveRecordsListToStorage(list);
    return recordData;
}

function renderSavedRecordsTable() {
    const tbody = document.getElementById('savedRecordsTableBody');
    const countLabel = document.getElementById('savedCountLabel');
    let list = getSavedRecordsFromStorage();

    if (countLabel) countLabel.textContent = `एकूण: ${list.length} नोंदी`;
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#90a4ae; padding:10px;">कोणतीही नोंद जतन केलेली नाही.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    list.forEach((item, index) => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold;">${index + 1}</td>
            <td><b>${item.empName}</b></td>
            <td>${item.empDesignation || '-'}</td>
            <td style="text-align:center; white-space:nowrap;">
                <button type="button" class="act-btn act-btn-view" onclick="viewSavedRecord(${item.id})" title="अहवाल पहा">👁️ पहा</button>
                <button type="button" class="act-btn act-btn-edit" onclick="editSavedRecord(${item.id})" title="माहिती दुरुस्त करा">✏️</button>
                <button type="button" class="act-btn act-btn-del" onclick="deleteSavedRecord(${item.id}, '${item.empName}')" title="नोंद हटवा">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function populateFormFromRecord(rec) {
    currentEditingRecordId = rec.id;
    const d = rec.formData;

    document.getElementById('empName').value = d.empName || '';
    document.getElementById('empDesignation').value = d.empDesignation || '';
    document.getElementById('empJoinDate').value = d.empJoinDate || '';
    handleDatePicked('empJoinDate', 'empJoinDate_disp');

    document.getElementById('payCommission').value = d.payCommission || '';
    document.getElementById('currentPayScale').value = d.currentPayScale || '';
    document.getElementById('basicPay').value = d.basicPay || '';
    document.getElementById('gradePay').value = d.gradePay || '0';

    for (let i = 1; i <= 3; i++) {
        document.getElementById(`b${i}_type`).value = d[`b${i}_type`] || 'None';
        toggleBenefitRow(i);
        document.getElementById(`b${i}_date`).value = d[`b${i}_date`] || '';
        handleDatePicked(`b${i}_date`, `b${i}_date_disp`);
        document.getElementById(`b${i}_optDate`).value = d[`b${i}_optDate`] || '';
        handleDatePicked(`b${i}_optDate`, `b${i}_optDate_disp`);
        document.getElementById(`b${i}_comm`).value = d[`b${i}_comm`] || '';
        document.getElementById(`b${i}_post`).value = d[`b${i}_post`] || '';
        document.getElementById(`b${i}_scale`).value = d[`b${i}_scale`] || '';
    }

    document.getElementById('fixationFrom').value = d.fixationFrom || '';
    handleDatePicked('fixationFrom', 'fixationFrom_disp');
    document.getElementById('fixationTo').value = d.fixationTo || '';
    handleDatePicked('fixationTo', 'fixationTo_disp');

    document.getElementById('autoCommissionChange').value = d.autoCommissionChange || 'Yes';
    document.getElementById('incrementMonthRule7th').value = d.incrementMonthRule7th || 'july';

    document.getElementById('hasScaleRev').value = d.hasScaleRev || 'No';
    toggleScaleRevSection();
    const listDiv = document.getElementById('scaleRevList');
    if (listDiv) listDiv.innerHTML = "";
    if (d.hasScaleRev === 'Yes' && d.revRows && d.revRows.length > 0) {
        d.revRows.forEach(r => {
            addScaleRevRow();
            let lastItem = listDiv.lastElementChild;
            if (lastItem) {
                lastItem.querySelector('.rev-date').value = r.d;
                let commSel = lastItem.querySelector('.rev-comm');
                commSel.value = r.c;
                updateRevScaleOptions(commSel);
                lastItem.querySelector('.rev-scale').value = r.s;
            }
        });
    }

    document.getElementById('incrementWithheld').value = d.incrementWithheld || 'No';
    document.getElementById('withheldEffect').value = d.withheldEffect || 'non_cumulative';
    selectedWithheldDates.clear();
    if (d.withheldDates && Array.isArray(d.withheldDates)) {
        d.withheldDates.forEach(dt => selectedWithheldDates.add(dt));
    }

    validateCard1();
    validateCard2();
    validateCard3();
}

function loadCurrentRecordIntoForm() {
    if (!currentEditingRecordId) return;
    let list = getSavedRecordsFromStorage();
    let rec = list.find(r => r.id === currentEditingRecordId);
    if (rec) {
        populateFormFromRecord(rec);
    }
}

function viewSavedRecord(id) {
    let list = getSavedRecordsFromStorage();
    let rec = list.find(r => r.id === id);
    if (!rec) return;

    populateFormFromRecord(rec);
    processFixation();
}

function editSavedRecord(id) {
    let list = getSavedRecordsFromStorage();
    let rec = list.find(r => r.id === id);
    if (!rec) return;

    populateFormFromRecord(rec);
    closeReportView();
    scrollToEditData();
    alert(`'${rec.empName}' यांची माहिती फॉर्ममध्ये भरली आहे. आवश्यक ते बदल करून पुन्हा 'Submit Data' किंवा 'Save Record' करा.`);
}

function deleteSavedRecord(id, empName) {
    if (confirm(`तुम्हाला '${empName}' यांची जतन केलेली वेतन निश्चिती नोंद खरोखर हटवायची आहे का?`)) {
        let list = getSavedRecordsFromStorage();
        list = list.filter(r => r.id !== id);
        if (currentEditingRecordId === id) currentEditingRecordId = null;
        saveRecordsListToStorage(list);
        alert("नोंद यशस्वीरीत्या हटवण्यात आली आहे!");
    }
}

function onWithheldChkChange(chk) {
    if (chk.checked) selectedWithheldDates.add(chk.value);
    else selectedWithheldDates.delete(chk.value);
}

function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return '';
    let parts = dateString.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateString;
}

function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    let parts = dateStr.split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
    }
    let d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function handleDatePicked(dateId, dispId) {
    const dateInput = document.getElementById(dateId);
    const dispInput = document.getElementById(dispId);
    if (dateInput && dispInput) {
        dispInput.value = dateInput.value ? formatDateToDDMMYYYY(dateInput.value) : "";
    }
}

function openModal(modalId) { 
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
    if (modalId === 'rulesModal') {
        const joinDateVal = document.getElementById('empJoinDate').value;
        const fixationFromInput = document.getElementById('fixationFrom');
        const fixationToInput = document.getElementById('fixationTo');
        if (joinDateVal) {
            fixationFromInput.setAttribute('min', joinDateVal);
            fixationToInput.setAttribute('min', joinDateVal);
        } else {
            fixationFromInput.removeAttribute('min');
            fixationToInput.removeAttribute('min');
        }

        const withheldVal = document.getElementById('incrementWithheld').value;
        const effectDiv = document.getElementById('withheldEffectDiv');
        if (withheldVal === 'Yes') effectDiv.classList.remove('hidden');
        populateWithheldCheckboxes();
    }
}

function closeModal(modalId) { 
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

function closeReportView() {
    document.getElementById('outputBox').classList.add('hidden');
}

function scrollToEditData() {
    const cardsArea = document.querySelector('.smart-cards-list');
    if (cardsArea) cardsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleScaleRevSection() {
    const val = document.getElementById('hasScaleRev').value;
    const container = document.getElementById('scaleRevContainer');
    if (val === 'Yes') {
        container.classList.remove('hidden');
        if (document.getElementById('scaleRevList').children.length === 0) addScaleRevRow();
    } else {
        container.classList.add('hidden');
        document.getElementById('scaleRevList').innerHTML = "";
    }
}

function addScaleRevRow() {
    const list = document.getElementById('scaleRevList');
    const div = document.createElement('div');
    div.className = 'scale-rev-item';
    div.innerHTML = `
        <div style="display: flex; gap: 6px; align-items: center;">
            <input type="date" class="rev-date" style="flex:1; padding:6px; font-size:11px; border:1px solid #ccc; border-radius:4px;">
            <select class="rev-comm" style="flex:1; padding:6px; font-size:11px; border:1px solid #ccc; border-radius:4px;" onchange="updateRevScaleOptions(this)">
                <option value="" disabled selected>आयोग</option>
                <option value="4th">४था</option>
                <option value="5th">५वा</option>
                <option value="6th">६वा</option>
                <option value="7th">७वा</option>
            </select>
            <select class="rev-scale" style="flex:2; padding:6px; font-size:11px; border:1px solid #ccc; border-radius:4px;">
                <option value="" disabled selected>सुधारित वेतनश्रेणी / स्तर</option>
            </select>
            <button type="button" onclick="this.parentElement.parentElement.remove()" style="background:#d32f2f; color:#fff; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:11px;">✕</button>
        </div>
    `;
    list.appendChild(div);
}

function updateRevScaleOptions(selectElem) {
    const comm = selectElem.value;
    const scaleSelect = selectElem.parentElement.querySelector('.rev-scale');
    scaleSelect.innerHTML = '<option value="" disabled selected>सुधारित वेतनश्रेणी / स्तर</option>';

    let list = [];
    if (comm === '4th') list = payScales4th;
    else if (comm === '5th') list = payScales5th;
    else if (comm === '6th') list = payScales6th;
    else if (comm === '7th') list = levelConfig7th.map(cfg => level7thStartPay[cfg.id].desc);

    list.forEach(item => {
        let opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        scaleSelect.appendChild(opt);
    });
}

function populateWithheldCheckboxes() {
    const container = document.getElementById('generatedIncrementsCheckboxes');
    if (!container) return;

    container.querySelectorAll('.withheld-date-chk:checked').forEach(c => selectedWithheldDates.add(c.value));
    container.innerHTML = "";

    const joinDateInput = document.getElementById('empJoinDate').value;
    const fromDateInput = document.getElementById('fixationFrom').value;
    const toDateInput = document.getElementById('fixationTo').value;
    const comm = document.getElementById('payCommission').value;
    const rule7th = document.getElementById('incrementMonthRule7th').value;

    if (!joinDateInput || !fromDateInput || !toDateInput || !comm) {
        container.innerHTML = `<div style="color:#78909c; font-size:11px;">कृपया प्रथम भाग १ व भाग ३ मधील माहिती भरा!</div>`;
        return;
    }

    let startDate = parseLocalDate(fromDateInput);
    let endDate = parseLocalDate(toDateInput);
    let joinDateObj = parseLocalDate(joinDateInput);
    let joinMonth = joinDateObj.getMonth();

    let startYr = startDate.getFullYear();
    let endYr = endDate.getFullYear();
    let datesList = [];

    for (let yr = startYr; yr <= endYr; yr++) {
        let yrDate = new Date(yr, 6, 1);
        let activeComm = comm;
        if (yrDate < new Date(1996, 0, 1)) activeComm = "4th";
        else if (yrDate < new Date(2006, 0, 1)) activeComm = "5th";
        else if (yrDate < new Date(2016, 0, 1)) activeComm = "6th";
        else activeComm = "7th";

        let incDate = null;
        if (activeComm === "4th" || activeComm === "5th") {
            incDate = new Date(yr, joinMonth, 1);
            if (incDate <= joinDateObj) continue;
        } else if (activeComm === "6th") {
            incDate = new Date(yr, 6, 1);
        } else if (activeComm === "7th") {
            incDate = (rule7th === 'january') ? new Date(yr, 0, 1) : new Date(yr, 6, 1);
            if (rule7th === 'january' && yr === 2016) continue;
        }

        if (incDate && incDate > startDate && incDate <= endDate) {
            let isoStr = `${incDate.getFullYear()}-${String(incDate.getMonth() + 1).padStart(2, '0')}-${String(incDate.getDate()).padStart(2, '0')}`;
            datesList.push({ iso: isoStr, disp: formatDateToDDMMYYYY(isoStr) });
        }
    }

    if (datesList.length === 0) {
        container.innerHTML = `<div style="color:#78909c; font-size:11px;">कोणतीही वार्षिक वेतनवाढ तारीख उपलब्ध नाही.</div>`;
        return;
    }

    datesList.forEach(item => {
        let isChecked = selectedWithheldDates.has(item.iso) ? "checked" : "";
        let label = document.createElement('label');
        label.className = 'checkbox-item';
        label.innerHTML = `<input type="checkbox" class="withheld-date-chk" value="${item.iso}" ${isChecked} onchange="onWithheldChkChange(this)"> दिनांक: <b>${item.disp}</b> रोजीची वार्षिक वेतनवाढ`;
        container.appendChild(label);
    });
}

function toggleWithheldOption() {
    const withheld = document.getElementById('incrementWithheld').value;
    const listContainer = document.getElementById('withheldListContainer');
    const effectDiv = document.getElementById('withheldEffectDiv');
    if (withheld === 'Yes') {
        listContainer.classList.remove('hidden');
        effectDiv.classList.remove('hidden');
        populateWithheldCheckboxes();
    } else {
        listContainer.classList.add('hidden');
        effectDiv.classList.add('hidden');
        selectedWithheldDates.clear();
    }
}

function confirmWithheldSelection() {
    const chks = document.querySelectorAll('.withheld-date-chk:checked');
    if (chks.length === 0) {
        alert("कृपया किमान एक वेतनवाढ तारीख निवडा!");
        return;
    }
    selectedWithheldDates.clear();
    chks.forEach(c => selectedWithheldDates.add(c.value));
    
    const listContainer = document.getElementById('withheldListContainer');
    if (listContainer) listContainer.classList.add('hidden');
    alert("वेतनवाढ रोखण्याची तारीख यशस्वीरीत्या जतन केली!");
}

function resetAllData() {
    if (confirm("तुम्हाला भरलेली सर्व माहिती पुसून टाकायची आहे का?")) {
        selectedWithheldDates.clear();
        globalCalcDataList = [];
        currentEditingRecordId = null;
        
        document.getElementById('empName').value = "";
        document.getElementById('empDesignation').value = "";
        document.getElementById('empJoinDate').value = "";
        document.getElementById('empJoinDate_disp').value = "";
        document.getElementById('payCommission').value = "";
        document.getElementById('currentPayScale').value = "";
        document.getElementById('basicPay').value = "";
        document.getElementById('gradePay').value = "0";

        for (let i = 1; i <= 3; i++) {
            document.getElementById(`b${i}_type`).value = "None";
            document.getElementById(`b${i}_fields`).classList.add('hidden');
            document.getElementById(`b${i}_date`).value = "";
            document.getElementById(`b${i}_date_disp`).value = "";
            document.getElementById(`b${i}_optDate`).value = "";
            document.getElementById(`b${i}_optDate_disp`).value = "";
            document.getElementById(`b${i}_comm`).value = "";
            document.getElementById(`b${i}_post`).value = "";
            document.getElementById(`b${i}_scale`).value = "";
        }

        document.getElementById('fixationFrom').value = "";
        document.getElementById('fixationFrom_disp').value = "";
        document.getElementById('fixationTo').value = "";
        document.getElementById('fixationTo_disp').value = "";
        document.getElementById('hasScaleRev').value = "No";
        document.getElementById('scaleRevContainer').classList.add('hidden');
        document.getElementById('scaleRevList').innerHTML = "";
        document.getElementById('incrementWithheld').value = "No";
        document.getElementById('withheldListContainer').classList.add('hidden');
        document.getElementById('withheldEffectDiv').classList.add('hidden');
        document.getElementById('withheldEffect').value = "non_cumulative";

        validateCard1();
        validateCard2();
        validateCard3();

        document.getElementById('outputBox').classList.add('hidden');
        alert("सर्व माहिती यशस्वीरीत्या साफ करण्यात आली आहे!");
    }
}

function validateCard1() {
    const name = document.getElementById('empName').value.trim();
    const desig = document.getElementById('empDesignation').value.trim();
    const joinDate = document.getElementById('empJoinDate').value;
    const comm = document.getElementById('payCommission').value;
    const scale = document.getElementById('currentPayScale').value.trim();
    const basic = document.getElementById('basicPay').value.trim();

    const card = document.getElementById('cardEmp');
    const status = document.getElementById('cardEmpStatus');
    const badge = document.getElementById('cardEmpBadge');

    if (name && desig && joinDate && comm && scale && basic) {
        card.classList.remove('card-pending');
        card.classList.add('card-filled');
        status.textContent = "✓ माहिती पूर्ण भरली आहे";
        badge.textContent = "✓";
        return true;
    } else {
        card.classList.remove('card-filled');
        card.classList.add('card-pending');
        status.textContent = "⚠️ ही माहिती भरणे बाकी आहे (कृपया भरा)";
        badge.textContent = "!";
        return false;
    }
}

function saveEmployeeModal() {
    validateCard1();
    closeModal('employeeModal');
}

function validateCard2() {
    let hasIncomplete = false;
    let anyActive = false;

    for (let i = 1; i <= 3; i++) {
        let type = document.getElementById(`b${i}_type`).value;
        if (type !== 'None') {
            anyActive = true;
            let dateVal = document.getElementById(`b${i}_date`).value;
            let scaleVal = document.getElementById(`b${i}_scale`).value.trim();
            let commVal = document.getElementById(`b${i}_comm`).value;

            if (!dateVal || !scaleVal || !commVal) hasIncomplete = true;
        }
    }

    const card = document.getElementById('cardBenefit');
    const status = document.getElementById('cardBenefitStatus');
    const badge = document.getElementById('cardBenefitBadge');

    if (hasIncomplete) {
        card.classList.remove('card-filled');
        card.classList.add('card-pending');
        status.textContent = "⚠️ ही माहिती भरणे बाकी आहे (दिनांक/वेतनश्रेणी भरा)";
        badge.textContent = "!";
        return false;
    } else {
        card.classList.remove('card-pending');
        card.classList.add('card-filled');
        status.textContent = anyActive ? "✓ माहिती पूर्ण भरली आहे" : "✓ कोणताही लाभ नाही (नियमित)";
        badge.textContent = "✓";
        return true;
    }
}

function saveBenefitModal() {
    validateCard2();
    closeModal('benefitModal');
}

function validateCard3() {
    const fromDate = document.getElementById('fixationFrom').value;
    const toDate = document.getElementById('fixationTo').value;

    const card = document.getElementById('cardRules');
    const status = document.getElementById('cardRulesStatus');
    const badge = document.getElementById('cardRulesBadge');

    if (fromDate && toDate) {
        card.classList.remove('card-pending');
        card.classList.add('card-filled');
        status.textContent = "✓ माहिती पूर्ण भरली आहे";
        badge.textContent = "✓";
        return true;
    } else {
        card.classList.remove('card-filled');
        card.classList.add('card-pending');
        status.textContent = "⚠️ ही माहिती भरणे बाकी आहे (कालावधी निवडा)";
        badge.textContent = "!";
        return false;
    }
}

function saveRulesModal() {
    validateCard3();
    closeModal('rulesModal');
}
