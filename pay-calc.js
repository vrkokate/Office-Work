// ==========================================
// वेतन निश्चिती गणना, लॉजिक आणि इव्हेंट प्रोसेसिंग फाईल (pay-calc.js)
// ==========================================

function getGradePayFrom4thOr5th(scale, designation) {
    let desigLower = (designation || "").toLowerCase();
    if (scale) {
        if (scale.includes("22400") || scale.includes("18400") || scale.includes("16400")) return 8700;
        if (scale.includes("15100") || scale.includes("14300") || scale.includes("12000")) return 7600;
        if (scale.includes("10650") || scale.includes("10000") || scale.includes("9125")) return 5400;
        if (scale.includes("8000") || scale.includes("7500") || scale.includes("7450")) {
            if (desigLower.includes("कार्यकारी") || desigLower.includes("executive") || desigLower.includes("अधीक्षक")) return 6600;
            return 5400;
        }
        if (scale.includes("7225") || scale.includes("6500") || scale.includes("6000")) {
            if (scale.includes("6500")) return 4400;
            return 4300;
        }
        if (scale.includes("5500")) return 4400;
        if (scale.includes("5000")) return 4200;
        if (scale.includes("4500")) return 2800;
        if (scale.includes("4000")) return 2400;
    }
    if (desigLower.includes("अभियांता") || desigLower.includes("engineer")) return 4400;
    return 2400;
}

function mapGpTo7thLevel(gradePay) {
    let gp = parseInt(gradePay, 10) || 1800;
    if (gp <= 1300) return "S-1";
    if (gp === 1400) return "S-2";
    if (gp === 1600) return "S-3";
    if (gp === 1650 || gp === 1700) return "S-4";
    if (gp === 1800) return "S-5";
    if (gp === 1900) return "S-6";
    if (gp === 2000) return "S-7";
    if (gp === 2400) return "S-8";
    if (gp === 2500) return "S-9";
    if (gp === 2800) return "S-10";
    if (gp === 2900 || gp === 3000) return "S-11";
    if (gp === 3500) return "S-12";
    if (gp === 4100 || gp === 4200) return "S-13";
    if (gp === 4300) return "S-14";
    if (gp === 4400) return "S-15";
    if (gp === 4500 || gp === 4600) return "S-16";
    if (gp === 4800) return "S-17";
    if (gp === 4900 || gp === 5000) return "S-18";
    if (gp === 5400) return "S-20";
    if (gp === 5500) return "S-21";
    if (gp === 5700 || gp === 5800) return "S-22";
    if (gp === 6600) return "S-23";
    if (gp === 6900) return "S-24";
    if (gp === 7600) return "S-25";
    if (gp === 7900) return "S-26";
    if (gp === 8700) return "S-27";
    if (gp === 8800) return "S-28";
    if (gp === 8900) return "S-29";
    if (gp === 10000) return "S-30";
    return "S-6";
}

function get5thScaleFrom4th(oldScale) {
    if (!oldScale) return "रु. 5000 - 150 - 8000";
    if (oldScale.includes("3000")) return "रु. 10000 - 325 - 15200";
    if (oldScale.includes("2200")) return "रु. 8000 - 275 - 13500";
    if (oldScale.includes("2000")) return "रु. 6500 - 200 - 10500";
    if (oldScale.includes("1640")) return "रु. 5500 - 175 - 9000";
    if (oldScale.includes("1400")) return "रु. 5000 - 150 - 8000";
    if (oldScale.includes("1200") || oldScale.includes("1350")) return "रु. 4000 - 100 - 6000";
    if (oldScale.includes("1150") || oldScale.includes("975")) return "रु. 3200 - 85 - 4900";
    if (oldScale.includes("950") || oldScale.includes("800")) return "रु. 3050 - 75 - 3950";
    return "रु. 4000 - 100 - 6000";
}

function get6thEntryPay(scaleStr, gp) {
    if (scaleStr && scaleStr.includes("PB-3")) {
        if (gp === 5000 || gp === 5400 || gp === 6600) return 15600;
    }
    return entryPayAnnexureIII[gp] || 0;
}

function fitInMatrix(levelKey, rawAmount) {
    let match = String(levelKey).match(/S-(\d+)/i);
    let key = match ? "S-" + parseInt(match[1], 10) : "S-6";
    let cells = fullPayMatrix7th[key] || fullPayMatrix7th["S-6"];
    for (let i = 0; i < cells.length; i++) {
        if (cells[i] >= rawAmount) return { basic: cells[i], index: i, level: key };
    }
    return { basic: cells[cells.length - 1], index: cells.length - 1, level: key };
}

function parsePayScaleStages(scaleStr, commission, gradePayOverride = 0) {
    if (!scaleStr) return [];

    if (commission === '7th' || scaleStr.includes('S-')) {
        let match = scaleStr.match(/S-(\d+)/i);
        let key = match ? "S-" + parseInt(match[1], 10) : "S-6";
        return fullPayMatrix7th[key] || fullPayMatrix7th["S-6"];
    }

    if (commission === '5th' || scaleStr.includes('रु.') || scaleStr.includes('4000') || scaleStr.includes('2550')) {
        let cleanStr = scaleStr.replace(/रु\./g, '').replace(/\(.*?\)/g, '').trim();
        let matches = cleanStr.match(/\d+/g);
        if (matches && matches.length >= 3) {
            let nums = matches.map(n => parseInt(n, 10));
            let stages = [nums[0]];
            let current = nums[0];
            for (let i = 1; i < nums.length - 1; i += 2) {
                let inc = nums[i];
                let target = nums[i + 1];
                let safety = 0;
                while (current < target && safety < 100) {
                    current += inc;
                    if (current > target) current = target;
                    stages.push(current);
                    safety++;
                }
            }
            return stages;
        }
    }

    if (commission === '6th' || scaleStr.includes('PB') || scaleStr.includes('GP') || scaleStr.includes('-1S')) {
        let clean = scaleStr.replace(/\(.*?\)/g, '');
        let bandMatch = clean.match(/(\d{4,6})\s*-\s*(\d{4,6})/);
        let gpMatch = scaleStr.match(/GP\s*(\d+)/i);
        let gp = gpMatch ? parseInt(gpMatch[1], 10) : (gradePayOverride || 0);

        if (bandMatch) {
            let bandMin = parseInt(bandMatch[1], 10);
            let bandMax = parseInt(bandMatch[2], 10);
            let entryPay = get6thEntryPay(scaleStr, gp);
            let stagesSet = new Set();
            let startVal = (entryPay && entryPay >= bandMin && entryPay <= bandMax) ? entryPay : bandMin;
            let curr = startVal;
            let safety = 0;
            while (curr <= bandMax && safety < 80) {
                stagesSet.add(curr);
                let inc = Math.ceil(((curr + gp) * 0.03) / 10) * 10;
                if (inc < 10) inc = 10;
                curr += inc;
                safety++;
            }
            return Array.from(stagesSet).sort((a, b) => a - b);
        }
    }

    let cleanStr = scaleStr.replace(/\(.*?\)/g, '').replace(/PB\s*-\s*\d+/gi, '').replace(/श्रेणी\s*-\s*\d+/gi, '');
    let matches = cleanStr.match(/\d+/g);
    if (!matches || matches.length < 3) return [19900, 20500, 21100, 21700, 22400];

    let nums = matches.map(n => parseInt(n, 10));
    let stages = [nums[0]];
    let current = nums[0];
    for (let i = 1; i < nums.length - 1; i += 2) {
        let inc = nums[i];
        let target = nums[i + 1];
        while (current < target) {
            current += inc;
            if (current > target) current = target;
            stages.push(current);
        }
    }
    return stages;
}

// ==========================================
// 🚀 मुख्य वेतन निश्चिती प्रक्रिया (इव्हेंट मर्जींग आणि अचूक विवरण)
// ==========================================

function processFixation() {
    try {
        const name = document.getElementById('empName').value.trim() || 'कर्मचारी';
        const initialDesignation = document.getElementById('empDesignation').value.trim() || '-';
        const joinDateInput = document.getElementById('empJoinDate').value;
        const scale = document.getElementById('currentPayScale').value;
        let basic = parseFloat(document.getElementById('basicPay').value);
        const fromDateInput = document.getElementById('fixationFrom').value;
        const toDateInput = document.getElementById('fixationTo').value;

        if (!joinDateInput || !scale || isNaN(basic) || !fromDateInput || !toDateInput) {
            alert("कृपया तिन्ही कार्ड्स मधील आवश्यक माहिती पूर्ण भरा!");
            return;
        }

        saveCurrentFixationRecord(false);
        globalCalcDataList = [];

        let gpMatch = scale.match(/GP\s*(\d+)/i);
        let gradePay = gpMatch ? parseFloat(gpMatch[1]) : (parseFloat(document.getElementById('gradePay').value) || 0);

        const autoUpgrade = document.getElementById('autoCommissionChange').value === 'Yes';
        const rule7th = document.getElementById('incrementMonthRule7th').value;
        const startCommission = document.getElementById('payCommission').value || '4th';
        
        let initialLevel = "S-6";
        if (startCommission === '7th') {
            let m = scale.match(/S-(\d+)/i);
            initialLevel = m ? "S-" + parseInt(m[1], 10) : "S-6";
        } else if (startCommission === '6th') {
            initialLevel = mapGpTo7thLevel(gradePay);
        } else {
            let gp = getGradePayFrom4thOr5th(scale, initialDesignation);
            initialLevel = mapGpTo7thLevel(gp);
        }

        const joinDateFormatted = formatDateToDDMMYYYY(joinDateInput);
        const fromDateFormatted = formatDateToDDMMYYYY(fromDateInput);
        const toDateFormatted = formatDateToDDMMYYYY(toDateInput);

        let scaleRevisions = [];
        const hasScaleRev = document.getElementById('hasScaleRev').value === 'Yes';
        if (hasScaleRev) {
            const revItems = document.querySelectorAll('#scaleRevList .scale-rev-item');
            revItems.forEach(item => {
                let d = item.querySelector('.rev-date').value;
                let c = item.querySelector('.rev-comm').value;
                let s = item.querySelector('.rev-scale').value;
                if (d && c && s) {
                    scaleRevisions.push({
                        date: parseLocalDate(d),
                        dateStr: d,
                        commission: c,
                        scale: s
                    });
                }
            });
        }

        let withheldDatesSet = new Set(selectedWithheldDates);
        const hasWithheld = document.getElementById('incrementWithheld').value === 'Yes';
        if (hasWithheld) {
            const chks = document.querySelectorAll('.withheld-date-chk:checked');
            chks.forEach(chk => withheldDatesSet.add(chk.value));
        }
        const withheldEffect = document.getElementById('withheldEffect').value;

        let activeBenefits = [];
        let summaryBenefitsText = [];

        for (let i = 1; i <= 3; i++) {
            let typeElem = document.getElementById(`b${i}_type`);
            if (typeElem && typeElem.value !== 'None') {
                let bType = typeElem.value;
                let bDate = document.getElementById(`b${i}_date`).value;
                let bOptDate = document.getElementById(`b${i}_optDate`).value || bDate;
                let bComm = document.getElementById(`b${i}_comm`).value;
                let bPost = document.getElementById(`b${i}_post`).value.trim() || `वरिष्ठ पद-${i}`;
                let bScale = document.getElementById(`b${i}_scale`).value;

                if (bDate && bScale) {
                    activeBenefits.push({
                        index: i,
                        type: bType,
                        date: parseLocalDate(bDate),
                        dateStr: bDate,
                        optDate: parseLocalDate(bOptDate),
                        optDateStr: bOptDate,
                        commission: bComm,
                        post: bPost,
                        scale: bScale
                    });
                    let label = (bType === 'Promotion') ? `पदोन्नती-${i}` : `MACP-${i}`;
                    summaryBenefitsText.push(`${label} (${formatDateToDDMMYYYY(bDate)} | ${bComm} आयोग: ${bScale})`);
                }
            }
        }

        let finalDesignation = initialDesignation;
        let sortedBenefitsForDesig = [...activeBenefits].sort((a, b) => a.date - b.date);
        sortedBenefitsForDesig.forEach(b => {
            if (b.type === 'Promotion' && b.post) {
                finalDesignation = b.post;
            }
        });

        let benefitSummaryDisplay = summaryBenefitsText.length > 0 ? summaryBenefitsText.join(" | ") : "कोणताही लाभ नाही";

        const summaryHtml = `
            <div><b>कर्मचाऱ्याचे नाव:</b> ${name}</div>
            <div><b>पदनाम:</b> ${finalDesignation}</div>
            <div><b>नियुक्ती दिनांक:</b> ${joinDateFormatted}</div>
            <div><b>आरंभीचा आयोग व वेतनश्रेणी:</b> ${startCommission} आयोग | ${scale}</div>
            <div><b>आर्थिक लाभ तपशील:</b> ${benefitSummaryDisplay}</div>
            <div><b>वेतन निश्चिती कालावधी:</b> ${fromDateFormatted} ते ${toDateFormatted}</div>
        `;

        document.getElementById('summaryText').innerHTML = summaryHtml;

        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = "";

        let events = [];
        let startDate = parseLocalDate(fromDateInput);
        let endDate = parseLocalDate(toDateInput);
        let joinDateObj = parseLocalDate(joinDateInput);
        let joinMonth = joinDateObj.getMonth();

        events.push({
            date: startDate,
            dateStr: fromDateFormatted,
            type: 'INITIAL',
            desc: 'मूळ वेतन निश्चिती / रुजू'
        });

        if (autoUpgrade) {
            let c5Date = new Date(1996, 0, 1);
            let c6Date = new Date(2006, 0, 1);
            let c7Date = new Date(2016, 0, 1);

            if (startDate < c5Date && c5Date <= endDate) {
                events.push({ date: c5Date, dateStr: "01-01-1996", type: 'COMMISSION_5TH', desc: '५वा आयोग वेतन निश्चिती (नियम ७ नुसार)' });
            }
            if (startDate < c6Date && c6Date <= endDate) {
                events.push({ date: c6Date, dateStr: "01-01-2006", type: 'COMMISSION_6TH', desc: '६वा आयोग सुधारणा' });
            }
            if (startDate < c7Date && c7Date <= endDate) {
                events.push({ date: c7Date, dateStr: "01-01-2016", type: 'COMMISSION_7TH', desc: '७वा आयोग सुधारणा (Matrix Fitment)' });
            }
        }

        scaleRevisions.forEach(rev => {
            if (rev.date >= startDate && rev.date <= endDate) {
                events.push({
                    date: rev.date,
                    dateStr: formatDateToDDMMYYYY(rev.dateStr),
                    type: 'SCALE_REVISION',
                    desc: `वेतनश्रेणी सुधारणा (${rev.scale})`,
                    data: rev
                });
            }
        });

        let startYr = startDate.getFullYear();
        let endYr = endDate.getFullYear();

        for (let yr = startYr; yr <= endYr; yr++) {
            let yrDate = new Date(yr, 6, 1);
            let activeComm = startCommission;
            if (autoUpgrade) {
                if (yrDate >= new Date(2016, 0, 1)) activeComm = "7th";
                else if (yrDate >= new Date(2006, 0, 1)) activeComm = "6th";
                else if (yrDate >= new Date(1996, 0, 1)) activeComm = "5th";
                else activeComm = "4th";
            }

            let incDate = null;
            let incDesc = "नियमित वार्षिक वेतन वाढ";

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
                let isDniOptionDate = activeBenefits.some(b => b.optDate > b.date && isSameDay(b.optDate, incDate));
                if (isDniOptionDate) continue;

                let isoStr = `${incDate.getFullYear()}-${String(incDate.getMonth() + 1).padStart(2, '0')}-${String(incDate.getDate()).padStart(2, '0')}`;
                let isWithheld = (hasWithheld && withheldDatesSet.has(isoStr));
                let m = String(incDate.getMonth() + 1).padStart(2, '0');
                let d = String(incDate.getDate()).padStart(2, '0');

                if (isWithheld) {
                    let effectLabel = (withheldEffect === 'cumulative') ? 'परिणाम करणारी' : 'परिणाम न करणारी';
                    events.push({
                        date: incDate,
                        dateStr: `${d}-${m}-${yr}`,
                        type: 'WITHHELD_INC',
                        desc: `वेतनवाढ रोखली / थांबवली (${effectLabel})`,
                        effect: withheldEffect,
                        isoDate: isoStr
                    });
                } else {
                    events.push({
                        date: incDate,
                        dateStr: `${d}-${m}-${yr}`,
                        type: 'ANNUAL_INC',
                        desc: incDesc,
                        isoDate: isoStr
                    });
                }
            }
        }

        activeBenefits.forEach(b => {
            let title = (b.type === 'Promotion') ? `पदोन्नती-${b.index} (${b.post})` : `MACP-${b.index} लाभ`;
            if (b.date >= startDate && b.date <= endDate) {
                if (isSameDay(b.date, b.optDate)) {
                    events.push({
                        date: b.date,
                        dateStr: formatDateToDDMMYYYY(b.dateStr),
                        type: 'BENEFIT_SAME_DAY',
                        desc: `${title} - वार्षिक/११(१) नुसार वेतन निश्चिती`,
                        data: b
                    });
                } else if (b.optDate > b.date && b.optDate <= endDate) {
                    events.push({
                        date: b.date,
                        dateStr: formatDateToDDMMYYYY(b.dateStr),
                        type: 'BENEFIT_PROMOTED_PROVISIONAL',
                        desc: `${title} मंजूर (विकल्पाच्या दिनांकापर्यंत तात्पुरती वेतन निश्चिती)`,
                        data: b
                    });
                    events.push({
                        date: b.optDate,
                        dateStr: formatDateToDDMMYYYY(b.optDateStr),
                        type: 'BENEFIT_OPTION_DNI',
                        desc: `${title} - वार्षिक/११(१) नुसार वेतन निश्चिती`,
                        data: b
                    });
                }
            }
        });

        // 🌟 एकाच दिनांकावर वार्षिक वाढ आणि लाभ आल्यास स्वतंत्र वार्षिक वाढ गाळून अंतिम निश्चिती ठेवणे
        let benefitDates = new Set();
        activeBenefits.forEach(b => {
            if (b.date) benefitDates.add(b.date.toDateString());
            if (b.optDate && b.optDate > b.date) benefitDates.add(b.optDate.toDateString());
        });

        events = events.filter(ev => {
            if (ev.type === 'ANNUAL_INC' && ev.date && benefitDates.has(ev.date.toDateString())) {
                return false;
            }
            return true;
        });

        events.sort((a, b) => {
            if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
            let order = { 'INITIAL': 1, 'COMMISSION_5TH': 2, 'COMMISSION_6TH': 3, 'COMMISSION_7TH': 4, 'ANNUAL_INC': 5, 'WITHHELD_INC': 5, 'SCALE_REVISION': 6, 'BENEFIT_PROMOTED_PROVISIONAL': 7, 'BENEFIT_SAME_DAY': 7, 'BENEFIT_OPTION_DNI': 8 };
            return (order[a.type] || 5) - (order[b.type] || 5);
        });

        let srNo = 1;
        let currentCommission = startCommission;
        let currentBasic = basic;
        let currentGP = (startCommission === '6th') ? gradePay : 0;
        let currentLevel = initialLevel;
        let currentMatrixIndex = -1;
        let restoreWithheldNext = false;

        if (currentCommission === '7th') {
            let match = String(initialLevel).match(/S-(\d+)/i);
            let key = match ? "S-" + parseInt(match[1], 10) : "S-6";
            currentLevel = key;
            let cells = fullPayMatrix7th[key] || fullPayMatrix7th["S-6"];
            currentMatrixIndex = cells.indexOf(currentBasic);
            if (currentMatrixIndex === -1) {
                for (let i = 0; i < cells.length; i++) {
                    if (cells[i] >= currentBasic) {
                        currentMatrixIndex = i;
                        currentBasic = cells[i];
                        break;
                    }
                }
                if (currentMatrixIndex === -1) currentMatrixIndex = 0;
            }
        } else if (currentCommission === '6th') {
            let cells = parsePayScaleStages(scale, '6th', gradePay);
            currentMatrixIndex = cells.indexOf(currentBasic);
            if (currentMatrixIndex === -1) currentMatrixIndex = 0;
        } else if (currentCommission === '4th' || currentCommission === '5th') {
            let cells = parsePayScaleStages(scale, currentCommission);
            currentMatrixIndex = cells.indexOf(currentBasic);
            if (currentMatrixIndex === -1) currentMatrixIndex = 0;
        }

        let currentScaleLabel = getCleanScaleLabel(scale, currentCommission, currentLevel);
        let lowerLevel = currentLevel;
        let lowerBasic = currentBasic;
        let lowerGP = currentGP;
        let lowerMatrixIndex = currentMatrixIndex;

        events.forEach(ev => {
            let prevScaleForSheet = currentScaleLabel;
            let prevGpForSheet = currentGP;

            if (ev.type === 'INITIAL') {
                addTableRow(srNo++, ev.dateStr, getCommissionLabel(currentCommission), currentScaleLabel, ev.desc, currentBasic, currentGP, ev.type, null);
            }
            else if (ev.type === 'COMMISSION_5TH') {
                currentCommission = '5th';
                let oldScale = prevScaleForSheet;
                let newScale = get5thScaleFrom4th(oldScale);
                currentScaleLabel = newScale;
                
                let preBasic = currentBasic;
                let bp = preBasic;
                let da = (bp <= 3500) ? Math.round(bp * 1.48) : ((bp <= 6000) ? Math.max(5180, Math.round(bp * 1.11)) : Math.max(6660, Math.round(bp * 0.96)));
                let ir1 = 100;
                let ir2 = Math.max(100, Math.round(bp * 0.10));
                let emoluments = bp + da + ir1 + ir2;
                let add40 = Math.round(bp * 0.40);
                let total = emoluments + add40;

                let proposedStages = parsePayScaleStages(newScale, '5th');
                if (proposedStages.length === 0) proposedStages = [2550, 2605, 2660, 2720, 2780, 2840, 2900, 2960, 3020, 3080, 3140, 3200];
                let st9 = proposedStages[0];
                for (let i = 0; i < proposedStages.length; i++) {
                    if (proposedStages[i] >= total) { st9 = proposedStages[i]; break; }
                }

                let existingStages = parsePayScaleStages(oldScale, '4th');
                let existingIncrements = (existingStages.indexOf(bp) !== -1) ? existingStages.indexOf(bp) : Math.floor((bp - (existingStages[0] || 750)) / 12);
                let bunchingIncrements = Math.floor(existingIncrements / 3);
                let st10 = proposedStages[Math.min(bunchingIncrements, proposedStages.length - 1)];

                currentBasic = Math.max(st9, st10);
                currentGP = 0;
                lowerBasic = currentBasic;
                lowerGP = 0;

                let calcData5th = {
                    commission: '5th',
                    empName: name,
                    designation: finalDesignation,
                    joinDate: joinDateFormatted,
                    existingScale: oldScale,
                    proposedScale: newScale,
                    existingPay: preBasic,
                    stage11: currentBasic
                };

                addTableRow(srNo++, ev.dateStr, getCommissionLabel(currentCommission), currentScaleLabel, ev.desc, currentBasic, currentGP, ev.type, calcData5th);
            }
            else if (ev.type === 'COMMISSION_6TH') {
                currentCommission = '6th';
                let preBasic = currentBasic;
                let multB = Math.round((currentBasic * 1.86) / 10) * 10;
                let gp6th = getGradePayFrom4thOr5th(prevScaleForSheet, initialDesignation);
                currentGP = gp6th;
                currentBasic = multB + gp6th;
                currentScaleLabel = (gp6th >= 4200) ? `PB-2 : 9300 - 34800 (GP ${gp6th})` : `PB-1 : 5200 - 20200 (GP ${gp6th})`;
                if (gp6th >= 5400) {
                    currentScaleLabel = `PB-3 : 15600 - 39100 (GP ${gp6th})`;
                }
                lowerBasic = currentBasic;
                lowerGP = currentGP;

                let calcData6th = {
                    commission: '6th',
                    empName: name,
                    designation: finalDesignation,
                    joinDate: joinDateFormatted,
                    existingScale: prevScaleForSheet,
                    proposedScale: currentScaleLabel,
                    existingPay: preBasic,
                    multBasic: multB,
                    gp: gp6th,
                    total: currentBasic
                };

                addTableRow(srNo++, ev.dateStr, getCommissionLabel(currentCommission), currentScaleLabel, ev.desc, currentBasic, currentGP, ev.type, calcData6th);
            }
            else if (ev.type === 'COMMISSION_7TH') {
                currentCommission = '7th';
                let totalBefore7th = currentBasic; 
                currentLevel = mapGpTo7thLevel(prevGpForSheet);
                let fitmentResult = fitInMatrix(currentLevel, totalBefore7th * 2.57);
                let oldB = currentBasic - prevGpForSheet;
                let oldGP = prevGpForSheet;

                currentBasic = fitmentResult.basic;
                currentMatrixIndex = fitmentResult.index;
                currentLevel = fitmentResult.level;
                currentGP = 0;

                lowerLevel = currentLevel;
                lowerBasic = currentBasic;
                lowerGP = 0;
                lowerMatrixIndex = currentMatrixIndex;

                let newScale7th = getCleanScaleLabel(scale, currentCommission, currentLevel);
                currentScaleLabel = newScale7th;

                let calcData7th = {
                    commission: '7th',
                    empName: name,
                    designation: finalDesignation,
                    joinDate: joinDateFormatted,
                    existingScale: prevScaleForSheet,
                    gp6th: oldGP,
                    basic6th: oldB,
                    total6th: totalBefore7th,
                    fitmentCalc: Math.round(totalBefore7th * 2.57),
                    level: currentLevel,
                    finalBasic7th: currentBasic,
                    proposedScale: newScale7th
                };

                addTableRow(srNo++, ev.dateStr, getCommissionLabel(currentCommission), currentScaleLabel, ev.desc, currentBasic, currentGP, ev.type, calcData7th);
            }
            else if (ev.type === 'SCALE_REVISION') {
                let rev = ev.data;
                currentCommission = rev.commission;

                if (currentCommission === '7th') {
                    let match = rev.scale.match(/S-(\d+)/i);
                    if (match) currentLevel = "S-" + parseInt(match[1], 10);
                    currentGP = 0;
                    let fit = fitInMatrix(currentLevel, currentBasic);
                    currentBasic = fit.basic;
                    currentMatrixIndex = fit.index;
                    currentLevel = fit.level;
                    currentScaleLabel = getCleanScaleLabel(rev.scale, currentCommission, currentLevel);
                } else if (currentCommission === '6th') {
                    let gpMatch = rev.scale.match(/GP\s*(\d+)/i);
                    if (gpMatch) currentGP = parseInt(gpMatch[1], 10);
                    let ep = get6thEntryPay(rev.scale, currentGP);
                    if (ep && currentBasic < ep) currentBasic = ep;
                    let cells = parsePayScaleStages(rev.scale, '6th', currentGP);
                    let found = cells.find(s => s >= currentBasic);
                    if (found) currentBasic = found;
                    currentMatrixIndex = cells.indexOf(currentBasic);
                    if (currentMatrixIndex === -1) currentMatrixIndex = 0;
                    currentScaleLabel = getCleanScaleLabel(rev.scale, currentCommission, currentLevel);
                } else {
                    currentGP = 0;
                    let cells = parsePayScaleStages(rev.scale, currentCommission);
                    let found = cells.find(s => s >= currentBasic);
                    if (found) currentBasic = found;
                    else if (cells.length > 0 && currentBasic < cells[0]) currentBasic = cells[0];
                    currentMatrixIndex = cells.indexOf(currentBasic);
                    if (currentMatrixIndex === -1) currentMatrixIndex = 0;
                    currentScaleLabel = rev.scale;
                }

                lowerLevel = currentLevel;
                lowerBasic = currentBasic;
                lowerGP = currentGP;
                lowerMatrixIndex = currentMatrixIndex;

                let desc = `वेतनश्रेणी सुधारणा (थेट सममूल्य / पुढील टप्प्यावर निश्चिती)`;
                addTableRow(srNo++, ev.dateStr, getCommissionLabel(currentCommission), currentScaleLabel, desc, currentBasic, currentGP, ev.type, null);
            }
            else if (ev.type === 'WITHHELD_INC') {
                restoreWithheldNext = (ev.effect === 'non_cumulative');
                addTableRow(srNo++, ev.dateStr, getCommissionLabel(currentCommission), currentScaleLabel, ev.desc, currentBasic, currentGP, ev.type, null);
            }
            else if (ev.type === 'BENEFIT_PROMOTED_PROVISIONAL') {
                let b = ev.data;
                b.savedLowerBasic = currentBasic;
                b.savedLowerGP = currentGP;
                currentCommission = b.commission;
                currentScaleLabel = b.scale;
                
                if (currentCommission === '7th') {
                    let lvlMatch = b.scale.match(/S-(\d+)/i);
                    let targetLvl = lvlMatch ? "S-" + parseInt(lvlMatch[1], 10) : "S-8";
                    let fitTemp = fitInMatrix(targetLvl, currentBasic);
                    currentLevel = fitTemp.level;
                    currentBasic = fitTemp.basic;
                    currentMatrixIndex = fitTemp.index;
                    currentGP = 0;
                    currentScaleLabel = getCleanScaleLabel(b.scale, currentCommission, currentLevel);
                } else {
                    let promoStages = parsePayScaleStages(b.scale, b.commission);
                    let found = promoStages.find(s => s >= currentBasic);
                    if (found) currentBasic = found;
                }

                addTableRow(srNo++, ev.dateStr, getCommissionLabel(b.commission), currentScaleLabel, ev.desc, currentBasic, currentGP, ev.type, null);
            }
            else if (ev.type === 'BENEFIT_OPTION_DNI') {
                let b = ev.data;
                currentCommission = b.commission;
                let lBasic = b.savedLowerBasic || currentBasic;

                currentScaleLabel = b.scale;
                if (currentCommission === '7th') {
                    let lvlMatch = b.scale.match(/S-(\d+)/i);
                    let targetLvl = lvlMatch ? "S-" + parseInt(lvlMatch[1], 10) : "S-8";
                    let cellsLower = fullPayMatrix7th[currentLevel] || fullPayMatrix7th["S-6"];
                    let currIdx = cellsLower.indexOf(lBasic);
                    if (currIdx === -1) currIdx = 0;

                    let notionalIdx = Math.min(currIdx + 2, cellsLower.length - 1);
                    let notionalPay = cellsLower[notionalIdx];

                    let fitFinal = fitInMatrix(targetLvl, notionalPay);
                    currentLevel = fitFinal.level;
                    currentBasic = fitFinal.basic;
                    currentMatrixIndex = fitFinal.index;
                    currentGP = 0;
                    currentScaleLabel = getCleanScaleLabel(b.scale, currentCommission, currentLevel);
                } else if (currentCommission === '6th') {
                    let gpMatch = b.scale.match(/GP\s*(\d+)/i);
                    let oldGP = currentGP;
                    currentGP = gpMatch ? parseInt(gpMatch[1], 10) : currentGP;
                    
                    let inc = Math.ceil((lBasic * 0.03) / 10) * 10;
                    let gpDiff = currentGP - oldGP;
                    currentBasic = lBasic + inc + gpDiff;

                    let ep = get6thEntryPay(b.scale, currentGP);
                    if (ep && currentBasic < (ep + currentGP)) currentBasic = ep + currentGP;
                    currentScaleLabel = getCleanScaleLabel(b.scale, currentCommission, currentLevel);
                } else {
                    let step = (currentCommission === '4th') ? 25 : 100;
                    let target = lBasic + (step * 2);
                    let promoStages = parsePayScaleStages(b.scale, currentCommission);
                    let found = promoStages.find(s => s >= target);
                    currentBasic = found ? found : target;
                    currentGP = 0;
                    currentScaleLabel = b.scale;
                }

                lowerLevel = currentLevel;
                lowerBasic = currentBasic;
                lowerGP = currentGP;
                lowerMatrixIndex = currentMatrixIndex;

                addTableRow(srNo++, ev.dateStr, getCommissionLabel(currentCommission), currentScaleLabel, ev.desc, currentBasic, currentGP, ev.type, null);
            }
            else if (ev.type === 'BENEFIT_SAME_DAY') {
                let b = ev.data;
                currentCommission = b.commission;

                if (currentCommission === '7th') {
                    let lvlMatch = b.scale.match(/S-(\d+)/i);
                    let targetLvl = lvlMatch ? "S-" + parseInt(lvlMatch[1], 10) : "S-8";
                    let cellsLower = fullPayMatrix7th[currentLevel] || fullPayMatrix7th["S-6"];
                    let currIdx = cellsLower.indexOf(currentBasic);
                    if (currIdx === -1) currIdx = Math.max(0, currentMatrixIndex);
                    let notionalIdx = Math.min(currIdx + 1, cellsLower.length - 1);
                    let notionalPay = cellsLower[notionalIdx];

                    let fitFinal = fitInMatrix(targetLvl, notionalPay);
                    currentLevel = fitFinal.level;
                    currentBasic = fitFinal.basic;
                    currentMatrixIndex = fitFinal.index;
                    currentGP = 0;
                    currentScaleLabel = getCleanScaleLabel(b.scale, currentCommission, currentLevel);
                } else if (currentCommission === '6th') {
                    let gpMatch = b.scale.match(/GP\s*(\d+)/i);
                    let oldGP = currentGP;
                    currentGP = gpMatch ? parseInt(gpMatch[1], 10) : currentGP;
                    
                    let inc = Math.ceil((currentBasic * 0.03) / 10) * 10;
                    let gpDiff = currentGP - oldGP;
                    currentBasic = currentBasic + inc + gpDiff;

                    let ep = get6thEntryPay(b.scale, currentGP);
                    if (ep && currentBasic < (ep + currentGP)) currentBasic = ep + currentGP;
                    currentScaleLabel = getCleanScaleLabel(b.scale, currentCommission, currentLevel);
                } else {
                    let step = (currentCommission === '4th') ? 25 : 100;
                    let target = currentBasic + step;
                    let promoStages = parsePayScaleStages(b.scale, currentCommission);
                    let found = promoStages.find(s => s >= target);
                    currentBasic = found ? found : target;
                    currentGP = 0;
                    currentScaleLabel = b.scale;
                }

                lowerLevel = currentLevel;
                lowerBasic = currentBasic;
                lowerGP = currentGP;
                lowerMatrixIndex = currentMatrixIndex;

                addTableRow(srNo++, ev.dateStr, getCommissionLabel(currentCommission), currentScaleLabel, ev.desc, currentBasic, currentGP, ev.type, null);
            }
            else if (ev.type === 'ANNUAL_INC') {
                let stagesToAdvance = restoreWithheldNext ? 2 : 1;
                let descText = restoreWithheldNext ? "नियमित वार्षिक वेतन वाढ (रोखलेली वाढ पूर्ववत जोडून)" : ev.desc;
                restoreWithheldNext = false;

                if (currentCommission === '7th') {
                    let match = String(currentLevel).match(/S-(\d+)/i);
                    let key = match ? "S-" + parseInt(match[1], 10) : "S-6";
                    currentLevel = key;
                    const cells = fullPayMatrix7th[key] || fullPayMatrix7th["S-6"];

                    if (currentMatrixIndex === -1 || currentMatrixIndex === undefined) {
                        currentMatrixIndex = cells.indexOf(currentBasic);
                        if (currentMatrixIndex === -1) {
                            for (let i = 0; i < cells.length; i++) {
                                if (cells[i] >= currentBasic) { currentMatrixIndex = i; break; }
                            }
                            if (currentMatrixIndex === -1) currentMatrixIndex = 0;
                        }
                    }

                    currentMatrixIndex = Math.min(currentMatrixIndex + stagesToAdvance, cells.length - 1);
                    currentBasic = cells[currentMatrixIndex];
                } else {
                    let cells = parsePayScaleStages(currentScaleLabel, currentCommission, currentGP);
                    let idx = cells.indexOf(currentBasic);
                    if (idx !== -1 && idx + stagesToAdvance < cells.length) {
                        currentBasic = cells[idx + stagesToAdvance];
                    } else {
                        let stepInc = (currentCommission === '4th' ? 25 : (currentCommission === '5th' ? 55 : Math.ceil((currentBasic * 0.03) / 10) * 10));
                        currentBasic += (stepInc * stagesToAdvance);
                    }
                }

                currentScaleLabel = getCleanScaleLabel(currentScaleLabel, currentCommission, currentLevel);
                addTableRow(srNo++, ev.dateStr, getCommissionLabel(currentCommission), currentScaleLabel, descText, currentBasic, currentGP, ev.type, null);
            }
        });

        const outputBox = document.getElementById('outputBox');
        outputBox.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        console.error("Process Fixation Error:", err);
        alert("वेतन निश्चिती प्रक्रिया करताना त्रुटी आली: " + err.message);
    }
}

function addTableRow(sr, dateStr, comm, scaleStr, eventDesc, basic, gp, evType, calcData) {
    let total = basic;
    let gpDisplay = gp > 0 ? gp : "-";
    if (comm === '६वा आयोग' || comm === '6th') {
        gpDisplay = gp > 0 ? gp : "-";
        total = basic;
    } else if (comm === '७वा आयोग' || comm === '7th') {
        gpDisplay = "-";
        total = basic;
    }

    let totalDisplay = total;

    if (evType === 'COMMISSION_5TH' || evType === 'COMMISSION_6TH' || evType === 'COMMISSION_7TH') {
        let dataIdx = globalCalcDataList.length;
        globalCalcDataList.push(calcData);
        totalDisplay = `<a href="javascript:void(0)" onclick="openCalculationSheet(${dataIdx})" style="color:#01579b; text-decoration:underline; font-weight:bold; cursor:pointer;" title="वेतन निश्चिती विवरणपत्र किंवा ग्रेड पे दुरुस्ती पहा">${total}</a>`;
    }

    let tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${sr}</td>
        <td>${dateStr}</td>
        <td>${comm}</td>
        <td><small><b>${scaleStr}</b></small></td>
        <td class="event-cell">${eventDesc}</td>
        <td><b>${basic}</b></td>
        <td>${gpDisplay}</td>
        <td><b>${totalDisplay}</b></td>
    `;
    document.getElementById('tableBody').appendChild(tr);
}

function getCommissionLabel(comm) {
    if(comm === '4th') return "४था आयोग";
    if(comm === '5th') return "५वा आयोग";
    if(comm === '6th') return "६वा आयोग";
    if(comm === '7th') return "७वा आयोग";
    return comm;
}

// ==========================================
// 🌟 वेतन निश्चिती विवरणपत्र (Illustration Sheet Modal) फंक्शन्स
// ==========================================

function openCalculationSheet(dataIndex) {
    let data = globalCalcDataList[dataIndex];
    if (!data) return;

    let contentDiv = document.getElementById('illustrationSheetContent');
    let titleHeader = document.getElementById('illustrationModalTitle');

    let gradePayHtml = (data.gp !== undefined && data.gp > 0) ? `<div><b>जुना ग्रेड पे:</b> रु. ${data.gp}</div>` : ((data.gp6th !== undefined && data.gp6th > 0) ? `<div><b>जुना ग्रेड पे:</b> रु. ${data.gp6th}</div>` : '');

    let empInfoBox = `
        <div style="background: #f4fbf4; border: 1px solid #a5d6a7; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; font-size: 11.5px; line-height: 1.5; color: #1b5e20; text-align: left;">
            <div><b>कर्मचाऱ्याचे नाव:</b> ${data.empName || '-'}</div>
            <div><b>पदनाम:</b> ${data.designation || '-'}</div>
            <div><b>नियुक्ती दिनांक:</b> ${data.joinDate || '-'}</div>
            <div><b>जुन्या वेतन आयोगाची वेतनश्रेणी:</b> ${data.existingScale || '-'}</div>
            ${gradePayHtml}
        </div>
    `;

    if (data.commission === '5th') {
        if (titleHeader) titleHeader.textContent = "महाराष्ट्र नागरी सेवा (सुधारित वेतन) नियम, १९९८ - पाचवा वेतन आयोग वेतन निश्चिती विवरणपत्र";
        contentDiv.innerHTML = `
            <div class="ill-print-sheet">
                <div style="text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 6px; margin-bottom: 8px;">
                    <h2 style="font-size: 15px; color: #1b5e20; margin: 0 0 2px 0; font-weight: bold; text-align: center;">महाराष्ट्र नागरी सेवा (सुधारित वेतन) नियम, १९९८</h2>
                    <div style="font-size: 12.5px; font-weight: bold; color: #263238; text-align: center;">पाचवा वेतन आयोग वेतन निश्चिती विवरणपत्र</div>
                </div>
                ${empInfoBox}
                <table class="ill-table">
                    <tr><td class="col-desc">Existing Scale of Pay</td><td class="col-dots">...</td><td class="col-val"><input type="text" class="ill-input ill-scale-input" value="${data.existingScale}"></td></tr>
                    <tr><td class="col-desc">Proposed Scale of Pay</td><td class="col-dots">...</td><td class="col-val"><input type="text" class="ill-input ill-scale-input" value="${data.proposedScale}"></td></tr>
                    <tr><td class="col-desc">Existing Pay</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_bp" class="ill-input ill-num-input" value="${data.existingPay}" oninput="recalculate5thIllustration(${dataIndex})"></td></tr>
                    <tr><td class="col-desc">Pay Fixed in Proposed Scale</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_stage11" class="ill-input ill-num-input" value="${data.stage11}" style="color:#b71c1c; border-color:#2e7d32;"></td></tr>
                </table>
            </div>
        `;
    } else if (data.commission === '6th') {
        if (titleHeader) titleHeader.textContent = "महाराष्ट्र नागरी सेवा (सुधारित वेतन) नियम, २००६ - सहावा वेतन आयोग वेतन निश्चिती विवरणपत्र";
        contentDiv.innerHTML = `
            <div class="ill-print-sheet">
                <div style="text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 6px; margin-bottom: 8px;">
                    <h2 style="font-size: 15px; color: #1b5e20; margin: 0 0 2px 0; font-weight: bold; text-align: center;">महाराष्ट्र नागरी सेवा (सुधारित वेतन) नियम, २००६</h2>
                    <div style="font-size: 12.5px; font-weight: bold; color: #263238; text-align: center;">सहावा वेतन आयोग वेतन निश्चिती विवरणपत्र</div>
                    <div style="font-size: 11px; color: #b71c1c; font-weight:bold; margin-top:3px;" class="ill-no-print">💡 खालील ग्रेड पे (Grade Pay) आवश्यकतेनुसार बदलू शकता:</div>
                </div>
                ${empInfoBox}
                <table class="ill-table">
                    <tr><td class="col-desc">१. ५व्या आयोगातील मूळ वेतन (Basic Pay)</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_6th_bp" class="ill-input ill-num-input" value="${data.existingPay}" readonly></td></tr>
                    <tr><td class="col-desc">२. १.८६ गुणाकार (Basic × 1.86)</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_6th_mult" class="ill-input ill-num-input" value="${data.multBasic}" readonly></td></tr>
                    <tr><td class="col-desc">३. ग्रेड पे (Grade Pay) <span class="ill-no-print">[बदला: 5400 / 6600]</span></td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_6th_gp" class="ill-input ill-num-input" value="${data.gp}" oninput="recalculate6thIllustration(${dataIndex})"></td></tr>
                    <tr style="background:#e8f5e9; font-weight:bold;"><td class="col-desc">४. ६व्या आयोगात एकूण निश्चित वेतन (Pay in Band + GP)</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_6th_total" class="ill-input ill-num-input" value="${data.total}" style="color:#b71c1c;" readonly></td></tr>
                </table>
            </div>
        `;
    } else if (data.commission === '7th') {
        if (titleHeader) titleHeader.textContent = "महाराष्ट्र नागरी सेवा (सुधारित वेतन) नियम, २०१९ - सातवा वेतन आयोग वेतन निश्चिती विवरणपत्र";
        contentDiv.innerHTML = `
            <div class="ill-print-sheet">
                <div style="text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 6px; margin-bottom: 8px;">
                    <h2 style="font-size: 15px; color: #1b5e20; margin: 0 0 2px 0; font-weight: bold; text-align: center;">महाराष्ट्र नागरी सेवा (सुधारित वेतन) नियम, २०१९</h2>
                    <div style="font-size: 12.5px; font-weight: bold; color: #263238; text-align: center;">सातवा वेतन आयोग वेतन निश्चिती विवरणपत्र (०१-०१-२०१६ पे-मॅट्रिक्स)</div>
                    <div style="font-size: 11px; color: #b71c1c; font-weight:bold; margin-top:3px;" class="ill-no-print">💡 खालील वेतनश्रेणी (स्तर) आणि ग्रेड पे आवश्यकतेनुसार बदलू शकता:</div>
                </div>
                ${empInfoBox}
                <table class="ill-table">
                    <tr><td class="col-desc">१. ३१-१२-२०१५ रोजीचे मूळ वेतन (६वा आयोग)</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_7th_b6" class="ill-input ill-num-input" value="${data.basic6th}" oninput="recalculate7thIllustration(${dataIndex})"></td></tr>
                    <tr><td class="col-desc">२. ग्रेड पे (Grade Pay)</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_7th_gp6" class="ill-input ill-num-input" value="${data.gp6th}" oninput="recalculate7thIllustration(${dataIndex})"></td></tr>
                    <tr><td class="col-desc">३. एकूण वेतन (Basic + GP)</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_7th_total6" class="ill-input ill-num-input" value="${data.total6th}" readonly></td></tr>
                    <tr><td class="col-desc">४. २.५७ गुणाकार घटक (Total × 2.57)</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_7th_fit" class="ill-input ill-num-input" value="${data.fitmentCalc}" readonly></td></tr>
                    <tr><td class="col-desc">५. ७व्या आयोगातील समतुल्य स्तर (Pay Matrix Level) <span class="ill-no-print">[बदला: S-20 / S-23]</span></td><td class="col-dots">...</td><td class="col-val"><input type="text" id="ill_7th_lvl" class="ill-input ill-num-input" style="text-align:center;" value="${data.level}" oninput="recalculate7thIllustration(${dataIndex})"></td></tr>
                    <tr style="background:#e8f5e9; font-weight:bold;"><td class="col-desc">६. पे-मॅट्रिक्सनुसार अंतिम निश्चित वेतन</td><td class="col-dots">...</td><td class="col-val"><span class="ill-rs-prefix">Rs.</span> <input type="number" id="ill_7th_final" class="ill-input ill-num-input" value="${data.finalBasic7th}" style="color:#b71c1c;" readonly></td></tr>
                </table>
            </div>
        `;
    }

    openModal('illustrationModal');
}

function recalculate6thIllustration(dataIndex) {
    let mult = parseFloat(document.getElementById('ill_6th_mult').value) || 0;
    let gp = parseFloat(document.getElementById('ill_6th_gp').value) || 0;
    let total = mult + gp;
    document.getElementById('ill_6th_total').value = total;

    globalCalcDataList[dataIndex].gp = gp;
    globalCalcDataList[dataIndex].total = total;
}

function recalculate7thIllustration(dataIndex) {
    let b6 = parseFloat(document.getElementById('ill_7th_b6').value) || 0;
    let gp6 = parseFloat(document.getElementById('ill_7th_gp6').value) || 0;
    let total6 = b6 + gp6;
    let fit = Math.round(total6 * 2.57);
    let lvl = document.getElementById('ill_7th_lvl').value.trim() || "S-23";

    let fitRes = fitInMatrix(lvl, fit);

    document.getElementById('ill_7th_total6').value = total6;
    document.getElementById('ill_7th_fit').value = fit;
    document.getElementById('ill_7th_final').value = fitRes.basic;

    globalCalcDataList[dataIndex].basic6th = b6;
    globalCalcDataList[dataIndex].gp6th = gp6;
    globalCalcDataList[dataIndex].total6th = total6;
    globalCalcDataList[dataIndex].fitmentCalc = fit;
    globalCalcDataList[dataIndex].level = lvl;
    globalCalcDataList[dataIndex].finalBasic7th = fitRes.basic;
}

function recalculate5thIllustration(dataIndex) {
    let bp = parseFloat(document.getElementById('ill_bp').value) || 0;
    let da = (bp <= 3500) ? Math.round(bp * 1.48) : ((bp <= 6000) ? Math.max(5180, Math.round(bp * 1.11)) : Math.max(6660, Math.round(bp * 0.96)));
    let ir1 = 100;
    let ir2 = Math.max(100, Math.round(bp * 0.10));
    let emoluments = bp + da + ir1 + ir2;
    let add40 = Math.round(bp * 0.40);
    let total = emoluments + add40;

    document.getElementById('ill_stage11').value = total;

    if (globalCalcDataList[dataIndex]) {
        globalCalcDataList[dataIndex].existingPay = bp;
        globalCalcDataList[dataIndex].stage11 = total;
    }
}
