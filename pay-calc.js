// ==========================================
// वेतन निश्चिती गणना, लॉजिक आणि विवरणपत्र फाईल (pay-calc.js)
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
