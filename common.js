// common.js

// १. सुरक्षेसाठी लॉगिन चेक
function checkAuth() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }
}

// २. दिनांक फॉरमॅट (YYYY-MM-DD to DD-MM-YYYY)
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
}

// ३. दिनांक प्लेसहोल्डर हाताळणे
function checkDatePlaceholder(input) {
    if (input.value) {
        input.classList.add('has-value');
    } else {
        input.classList.remove('has-value');
    }
}
