// common.js

// १. सुरक्षेसाठी लॉगिन चेक
function checkAuth() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.replace('index.html');
    }
}

// २. दिनांक फॉरमॅट (YYYY-MM-DD to DD-MM-YYYY)
function formatDate(dateStr) {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    const parts = str.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return str;
}

// ३. दिनांक प्लेसहोल्डर हाताळणे (स्टँडर्ड फंक्शन)
function handleDateChange(input) {
    if (!input) return;
    if (input.value) {
        input.classList.add('has-value');
    } else {
        input.classList.remove('has-value');
    }
}
