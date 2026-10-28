// mb-storage.js - LocalStorage Management
function getData(key) {
    try {
        var val = localStorage.getItem(key);
        return val ? JSON.parse(val) : [];
    } catch (e) {
        console.error("Error reading localStorage for key:", key, e);
        return [];
    }
}

function setData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Error writing localStorage for key:", key, e);
    }
}
