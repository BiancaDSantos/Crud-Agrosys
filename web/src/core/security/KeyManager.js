export class KeyManager {
    
    static #cryptoKey = null;

    /**
     * Armazena a chave derivada em memória volátil.
     * @param {CryptoKey} key 
     */
    static setKey(key) {
        this.#cryptoKey = key;
    }

    /**
     * Retorna a chave de criptografia.
     * @returns {CryptoKey}
     */
    static getKey() {
        if (!this.#cryptoKey) {
            throw new Error("Sessão expirada ou não autenticada. Chave de criptografia não encontrada.");
        }
        return this.#cryptoKey;
    }

    /**
     * Destrói a chave da memória (usado no logout ou timeout).
     */
    static clearKey() {
        this.#cryptoKey = null;
        console.log("🔒 Chave de criptografia destruída da memória.");
    }

    /**
     * Verifica se o usuário tem uma chave ativa.
     */
    static hasKey() {
        return this.#cryptoKey !== null;
    }
}