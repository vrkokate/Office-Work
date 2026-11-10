// mb-print.js - Direct PDF Download (No about:blank)

(function () {
    "use strict";

    function mbPrintEscape(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    function mbPrintDate(value) {
        if (!value) return "-";
        if (typeof formatDateToDMY === "function") {
            try { return formatDateToDMY(value); } catch (e) {}
        }
        var text = String(value);
        var parts = text.split("-");
        return parts.length === 3 ? parts[2] + "-" + parts[1] + "-" + parts[0] : text;
    }

    function mbPrintOpenDocument(title, bodyHtml, fileName) {
        var safeTitle = mbPrintEscape(title || "M.B. Report");
        var safeFileName = String(fileName || "MB_Report").replace(/[\\/:*?"<>|]+/g, "_");
        
        var content = '<header style="text-align:center; margin-bottom: 20px; border-bottom:1.5px solid #222; padding-bottom:10px;">' +
            '<h1 style="font-size: 18px; margin: 0 0 5px 0;">सार्वजनिक बांधकाम विभाग</h1>' +
            '<h2 style="font-size: 14px; margin: 0;">' + safeTitle + '</h2>' +
            '</header>' +
            '<div style="display:flex; justify-content:space-between; margin-bottom: 15px; font-size: 11px;">' +
            '<span>अहवाल दिनांक: ' + mbPrintEscape(mbPrintDate(new Date().toISOString().slice(0, 10))) + '</span>' +
            '<span>फाईल: ' + mbPrintEscape(safeFileName) + '</span>' +
            '</div>' +
            String(bodyHtml || '') +
            '<div style="margin-top: 20px; text-align: right; font-size: 11px;">एकूण नोंदी: ' + mbPrintEscape((bodyHtml.match(/<tr\b/gi) || []).length > 0 ? (bodyHtml.match(/<tr\b/gi).length - 1) : 0) + '</div>';

        // Android Bridge
        try {
            if (window.AndroidPrintBridge && typeof window.AndroidPrintBridge.printHtml === 'function') {
                window.AndroidPrintBridge.printHtml(content, safeFileName);
                return true;
            }
        } catch(e) {}

        // HTML2PDF Logic
        if (typeof html2pdf === 'undefined') {
            if(typeof showAlert === 'function') showAlert('PDF जनरेटर लोड होत आहे, कृपया २ सेकंद थांबा आणि पुन्हा प्रयत्न करा.', 'INFO');
            var script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = function() {
                createAndDownloadPDF(content, safeFileName);
            };
            document.head.appendChild(script);
            return true;
        }

        createAndDownloadPDF(content, safeFileName);
        return true;
    }

    function createAndDownloadPDF(content, fileName) {
        var tempDiv = document.createElement('div');
        tempDiv.id = 'pdf-mb-temp-container';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '210mm';
        tempDiv.style.background = '#fff';
        tempDiv.style.padding = '10mm';
        tempDiv.style.boxSizing = 'border-box';
        
        tempDiv.innerHTML = '<style>' +
            'body { font-family: "Noto Sans Devanagari", Arial, sans-serif; font-size: 10pt; color: #111; }' +
            'table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }' +
            'th, td { border: 1px solid #333 !important; padding: 6px !important; text-align: left; vertical-align: top; font-size: 10pt; }' +
            'th { background-color: #eee !important; font-weight: bold; -webkit-print-color-adjust: exact; }' +
            '</style>' + content;
            
        document.body.appendChild(tempDiv);

        var opt = {
            margin: 10,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(tempDiv).save().then(function() {
            if (tempDiv && tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv);
            if (typeof showAlert === 'function') showAlert('PDF यशस्वीरीत्या डाउनलोड झाली आहे!', 'SUCCESS');
        }).catch(function(err) {
            console.error('PDF Error:', err);
            if (tempDiv && tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv);
            if (typeof showAlert === 'function') showAlert('PDF तयार करताना त्रुटी आली.', 'ERROR');
        });
    }

    window.printMBReport = function printMBReport() {
        var records = [];
        try { records = typeof getData === "function" ? getData("mb_records") : []; } catch (e) {}

        if (!Array.isArray(records) || records.length === 0) {
            if (typeof showAlert === "function") showAlert("प्रिंट करण्यासाठी M.B. नोंदी उपलब्ध नाहीत.", "WARNING");
            return false;
        }

        var rows = records.map(function (item, index) {
            item = item || {};
            return "<tr><td style='text-align:center'>" + (index + 1) + "</td><td>" + mbPrintEscape(mbPrintDate(item.date)) + "</td><td>" + mbPrintEscape(item.mbNumber || "-") + "</td><td>" + mbPrintEscape(item.size || "-") + "</td><td>" + mbPrintEscape(item.actionType || "-") + "</td><td>" + mbPrintEscape(item.receivedFrom || item.receivedSource || "-") + "</td><td>" + mbPrintEscape(item.receivedDetail || "-") + "</td></tr>";
        }).join("");

        var table = '<table><thead><tr><th>अ.क्र.</th><th>दिनांक</th><th>M.B. क्रमांक</th><th>आकार</th><th>व्यवहार</th><th>प्राप्तीचा स्रोत</th><th>तपशील</th></tr></thead><tbody>' + rows + '</tbody></table>';

        return mbPrintOpenDocument("मोजमाप पुस्तिका (M.B.) नोंदवही अहवाल", table, "MB_Register_Report_" + new Date().toISOString().slice(0, 10));
    };

    window.printA4Document = function printA4Document(content, optionalFileName) {
        var name = String(optionalFileName || "Office_Work_Report.pdf");
        var title = name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
        var holder = document.createElement("div");
        holder.innerHTML = String(content || "");

        holder.querySelectorAll("button,input,select,textarea,.btn-action,.btn-report,[data-print='hide']").forEach(function (node) { node.remove(); });
        return mbPrintOpenDocument(title, holder.innerHTML, name);
    };
})();
