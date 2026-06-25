export class SecureStorage {
    
    static setItem(key, value) {
        const payload = JSON.stringify(value);
        sessionStorage.setItem(window.btoa(key), window.btoa(payload));
    }

    static getItem(key) {
        
        const encodedKey = window.btoa(key);
        const data = sessionStorage.getItem(encodedKey);
        
        if (!data) return null;
        
        try {
            return JSON.parse(window.atob(data));
        } catch (e) {
            return null;
        }
    }

    static removeItem(key) {
        sessionStorage.removeItem(window.btoa(key));
    }

    static clear() {
        sessionStorage.clear();
    }
}