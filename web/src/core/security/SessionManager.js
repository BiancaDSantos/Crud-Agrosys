import { KeyManager } from './KeyManager.js';
import { SecureStorage } from './SecureStorage.js';

export class SessionManager {
    
    static #timeoutId = null;
    static #TIMEOUT_MS = 30 * 60 * 1000;

    static start() {
        this.resetTimer();
        
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        
        events.forEach(event => {
            document.addEventListener(event, this.resetTimer.bind(this), { passive: true });
        });
        
        console.log("🛡️ Monitoramento de sessão ativo.");
    }

    static resetTimer() {
        if (this.#timeoutId) {
            clearTimeout(this.#timeoutId);
        }

        if (!KeyManager.hasKey() && SecureStorage.getItem('isAuthenticated')) {
            this.logout();
            return;
        }

        this.#timeoutId = setTimeout(() => {
            console.warn("Sessão expirada por inatividade.");
            this.logout();
        }, this.#TIMEOUT_MS);
    }

    static logout() {
        KeyManager.clearKey();
        SecureStorage.clear();
        
        // Redireciona para a tela inicial (Login)
        if (!window.location.pathname.endsWith('index.html')) {
            alert("Sua sessão expirou por segurança. Faça login novamente.");
            window.location.href = 'index.html';
        }
    }
}