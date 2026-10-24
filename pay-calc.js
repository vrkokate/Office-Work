// ==========================================
// वेतन निश्चिती गणना आणि लॉजिक फाईल (pay-calc.js)
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
