// mb-print.js - MB Module Direct PDF Download

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

        var table = '<table class="print-table"><thead><tr><th>अ.क्र.</th><th>दिनांक</th><th>M.B. क्रमांक</th><th>आकार</th><th>व्यवहार</th><th>प्राप्तीचा स्रोत</th><th>तपशील</th></tr></thead><tbody>' + rows + '</tbody></table>';

        var safeFileName = "MB_Register_Report_" + new Date().toISOString().slice(0, 10) + ".pdf";
        
        // common.js मधील युनिव्हर्सल फंक्शनला कॉल करा
        if (typeof printA4Document === 'function') {
            printA4Document(table, safeFileName);
        } else {
            // Fallback
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = table;
            document.body.appendChild(tempDiv);
            html2pdf().set({margin: 15, filename: safeFileName, jsPDF: {unit: 'mm', format: 'a4', orientation: 'portrait'}}).from(tempDiv).save().then(function(){
                document.body.removeChild(tempDiv);
            });
        }
        return true;
    };

    window.printA4Document = function printA4Document(content, optionalFileName) {
        var name = String(optionalFileName || "Office_Work_Report.pdf");
        var title = name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
        var holder = document.createElement("div");
        holder.innerHTML = String(content || "");

        holder.querySelectorAll("button,input,select,textarea,.btn-action,.btn-report,[data-print='hide']").forEach(function (node) { node.remove(); });
        
        if (typeof window.generateUniversalPDF === 'function') {
             window.generateUniversalPDF(holder.innerHTML, name);
        } else {
             if (typeof printA4Document === 'function') printA4Document(holder.innerHTML, name);
        }
    };
})();
