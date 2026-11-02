
// mb-print.js - Isolated, clean M.B. reports and A4 printing
// Printing is performed in a separate document. The live dashboard DOM,
// modal state, and LocalStorage records are never modified by this module.

(function () {
    "use strict";

    function mbPrintEscape(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[ch];
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
        var win = null;

        try {
            // Must be called directly from the user's click to avoid popup blocking.
            win = window.open("", "_blank");
            if (!win) {
                if (typeof showAlert === "function") {
                    showAlert("प्रिंट विंडो उघडता आली नाही. कृपया ब्राउझरमध्ये Pop-ups परवानगी द्या.", "WARNING");
                } else {
                    window.alert("प्रिंट विंडो उघडता आली नाही. Pop-ups परवानगी तपासा.");
                }
                return false;
            }

            var html = '<!doctype html><html lang="mr"><head><meta charset="utf-8">' +
                '<meta name="viewport" content="width=device-width,initial-scale=1">' +
                '<title>' + safeTitle + '</title><style>' +
                '@page{size:A4 portrait;margin:10mm}' +
                '*{box-sizing:border-box}' +
                'html,body{margin:0;padding:0;background:#fff!important;color:#111!important}' +
                'body{font-family:Arial,"Noto Sans Devanagari",sans-serif;font-size:10pt;line-height:1.4}' +
                '.report-heading{text-align:center;margin:0 0 5mm;padding:0 0 3mm;border-bottom:1.5px solid #222}' +
                '.report-heading h1{font-size:16pt;margin:0 0 2mm;font-weight:700}' +
                '.report-heading h2{font-size:12pt;margin:0;font-weight:600}' +
                '.report-meta{display:flex;justify-content:space-between;gap:8px;margin:0 0 4mm;font-size:9pt}' +
                'table{width:100%;border-collapse:collapse;border-spacing:0;table-layout:auto}' +
                'thead{display:table-header-group}' +
                'tr{break-inside:avoid;page-break-inside:avoid}' +
                'th,td{border:1px solid #333;padding:5px 6px;text-align:left;vertical-align:top;overflow-wrap:anywhere}' +
                'th{font-weight:700;background:#eee!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
                '.no-data{text-align:center;padding:12px;font-weight:600}' +
                '.report-footer{margin-top:4mm;text-align:right;font-size:9pt}' +
                '@media screen{body{padding:10mm}.report-sheet{max-width:190mm;margin:0 auto}}' +
                '</style></head><body><main class="report-sheet">' +
                '<header class="report-heading"><h1>सार्वजनिक बांधकाम विभाग</h1><h2>' + safeTitle + '</h2></header>' +
                '<section class="report-meta"><span>अहवाल दिनांक: ' + mbPrintEscape(mbPrintDate(new Date().toISOString().slice(0, 10))) +
                '</span><span>फाईल: ' + mbPrintEscape(safeFileName) + '</span></section>' +
                String(bodyHtml || "") +
                '<div class="report-footer">एकूण नोंदी: ' + mbPrintEscape((bodyHtml.match(/<tr\b/gi) || []).length > 0 ? (bodyHtml.match(/<tr\b/gi).length - 1) : 0) + '</div>' +
                '</main><script>(function(){var printed=false;function start(){if(printed)return;printed=true;setTimeout(function(){try{window.focus();window.print();}catch(e){console.error(e);}},250);}window.addEventListener("load",start);window.addEventListener("afterprint",function(){setTimeout(function(){try{window.close();}catch(e){}},250);});})();<\/script>' +
                '</body></html>';

            win.document.open();
            win.document.write(html);
            win.document.close();
            return true;
        } catch (error) {
            console.error("M.B. print error:", error);
            try { if (win && !win.closed) win.close(); } catch (e) {}
            if (typeof showAlert === "function") {
                showAlert("प्रिंट रिपोर्ट तयार करताना त्रुटी आली.", "ERROR");
            } else {
                window.alert("प्रिंट रिपोर्ट तयार करताना त्रुटी आली.");
            }
            return false;
        }
    }

    // Main M.B. register report button.
    window.printMBReport = function printMBReport() {
        var records = [];
        try {
            records = typeof getData === "function" ? getData("mb_records") : [];
        } catch (e) {
            console.error("Unable to read M.B. records:", e);
        }

        if (!Array.isArray(records) || records.length === 0) {
            if (typeof showAlert === "function") showAlert("प्रिंट करण्यासाठी M.B. नोंदी उपलब्ध नाहीत.", "WARNING");
            else window.alert("प्रिंट करण्यासाठी M.B. नोंदी उपलब्ध नाहीत.");
            return false;
        }

        var rows = records.map(function (item, index) {
            item = item || {};
            return "<tr>" +
                "<td style=\"text-align:center\">" + (index + 1) + "</td>" +
                "<td>" + mbPrintEscape(mbPrintDate(item.date)) + "</td>" +
                "<td>" + mbPrintEscape(item.mbNumber || "-") + "</td>" +
                "<td>" + mbPrintEscape(item.size || "-") + "</td>" +
                "<td>" + mbPrintEscape(item.actionType || "-") + "</td>" +
                "<td>" + mbPrintEscape(item.receivedFrom || item.receivedSource || "-") + "</td>" +
                "<td>" + mbPrintEscape(item.receivedDetail || "-") + "</td>" +
                "</tr>";
        }).join("");

        var table = '<table><thead><tr>' +
            '<th style="width:6%;text-align:center">अ.क्र.</th>' +
            '<th>दिनांक</th><th>M.B. क्रमांक</th><th>आकार</th>' +
            '<th>व्यवहार</th><th>प्राप्तीचा स्रोत</th><th>तपशील / धारक</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table>';

        return mbPrintOpenDocument(
            "मोजमाप पुस्तिका (M.B.) नोंदवही अहवाल",
            table,
            "MB_Register_Report_" + new Date().toISOString().slice(0, 10)
        );
    };

    // Backward-compatible helper for other M.B. screens that call printA4Document.
    // It also prints in an isolated document rather than replacing #printableArea.
    window.printA4Document = function printA4Document(content, optionalFileName) {
        var name = String(optionalFileName || "Office_Work_Report.pdf");
        var title = name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
        var holder = document.createElement("div");
        holder.innerHTML = String(content || "");

        // Strip controls and action-only columns from the detached report copy.
        holder.querySelectorAll("button,input,select,textarea,.btn-action,.btn-report,[data-print='hide']").forEach(function (node) {
            node.remove();
        });
        holder.querySelectorAll("table").forEach(function (table) {
            var indexes = [];
            var first = table.querySelector("thead tr") || table.querySelector("tr");
            if (first) {
                Array.prototype.forEach.call(first.children, function (cell, i) {
                    if (/^(action|actions|कृती|ॲक्शन|क्रिया)$/i.test((cell.textContent || "").trim())) indexes.push(i);
                });
            }
            indexes.sort(function (a, b) { return b - a; }).forEach(function (idx) {
                table.querySelectorAll("tr").forEach(function (row) {
                    if (row.children[idx]) row.children[idx].remove();
                });
            });
        });
        return mbPrintOpenDocument(title, holder.innerHTML, name);
    };
})();
