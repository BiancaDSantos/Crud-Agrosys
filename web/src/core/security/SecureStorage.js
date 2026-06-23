export class SecureStorage {
    
    /**
     * Salva um dado genérico na sessão de forma ofuscada.
     */
    static setItem(key, value) {
        const payload = JSON.stringify(value);
        // Aplica um Base64 simples apenas para não ficar legível a olho nu no DevTools
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