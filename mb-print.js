// mb-print.js - Printing, PDF generation, and Android Print Bridge Integration

function printA4Document(content, optionalFileName) {
    var printableArea = document.getElementById('printableArea');
    var originalTitle = document.title;
    var originalContent = printableArea ? printableArea.innerHTML : '';
    var requestedName = String(optionalFileName || 'Office_Work_Report.pdf');
    var safeName = requestedName.replace(/[\/:*?"<>|]+/g, '_').replace(/\.pdf$/i, '');
    if (!safeName) safeName = 'Office_Work_Report';
    var printTitle = safeName + '.pdf';

    try {
        if (window.AndroidPrintBridge && typeof window.AndroidPrintBridge.printHtml === 'function') {
            window.AndroidPrintBridge.printHtml(String(content || ''), printTitle);
            return true;
        }
        if (window.Android && typeof window.Android.printHtml === 'function') {
            window.Android.printHtml(String(content || ''), printTitle);
            return true;
        }

        document.title = printTitle;
        if (printableArea) {
            printableArea.innerHTML = String(content || '');
            printableArea.style.display = 'block';
            window.print();
            var restorePrintPage = function () {
                printableArea.innerHTML = originalContent;
                printableArea.style.display = '';
                document.title = originalTitle;
                window.removeEventListener('afterprint', restorePrintPage);
            };
            window.addEventListener('afterprint', restorePrintPage);
            window.setTimeout(function () {
                if (document.title === printTitle) {
                    printableArea.innerHTML = originalContent;
                    printableArea.style.display = '';
                    document.title = originalTitle;
                    window.removeEventListener('afterprint', restorePrintPage);
                }
            }, 30000);
            return true;
        }

        var win = window.open('', '_blank');
        if (!win) throw new Error('Print window was blocked');
        var html = '<!doctype html><html><head><meta charset="utf-8"><title>' +
            printTitle.replace(/[&<>"]/g, function (c) {
                return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
            }) +
            '</title><meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<style>@page{size:A4 portrait;margin:7mm}body{font-family:Arial,"Noto Sans Devanagari",sans-serif;color:#111;font-size:10pt}' +
            'table{width:100%;border-collapse:collapse}th,td{border:1px solid #222;padding:4px;vertical-align:top}' +
            'tr{break-inside:avoid}img{max-width:100%;height:auto}</style></head><body>' +
            String(content || '') + '</body></html>';
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.onload = function () { win.focus(); win.print(); };
        return true;
    } catch (err) {
        console.error('Report print failed:', err);
        document.title = originalTitle;
        if (printableArea) {
            printableArea.innerHTML = originalContent;
            printableArea.style.display = '';
        }
        if (typeof showAlert === 'function') {
            showAlert('प्रिंट विंडो उघडता आली नाही. या APK/WebView मध्ये Print सुविधा उपलब्ध आहे का ते तपासा.', 'ERROR');
        } else {
            window.appAlert('प्रिंट विंडो उघडता आली नाही. या APK/WebView मध्ये Print सुविधा उपलब्ध आहे का ते तपासा.');
        }
        return false;
    }
}
